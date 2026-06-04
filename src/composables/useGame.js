import { ref, computed, reactive } from 'vue'
import {
  PLAYER,
  DIFFICULTY,
  POWER,
  COMBO,
  comboMultiplier,
  TYPE_COLORS,
  CAT_DANMU,
  THEMES,
  DEFAULT_THEME_ID,
  getTheme,
  DIFFICULTIES,
  DEFAULT_DIFFICULTY_ID,
  getDifficulty,
  CAT_SKINS,
  DEFAULT_SKIN_ID,
  getSkin,
  BOSS,
} from '../config/gameConfig.js'
import { loadJSON, saveJSON } from '../utils/storage.js'
import { useSound } from './useSound.js'

export const GameState = {
  MENU: 'menu',
  PLAY: 'play',
  OVER: 'over',
}

const pick = (arr) => arr[(Math.random() * arr.length) | 0]

/**
 * 游戏核心逻辑：状态、循环、渲染、碰撞、主题、道具行为。
 * 与组件解耦；组件只挂载 canvas、展示响应式状态、转发输入。
 */
export function useGame() {
  const sound = useSound()

  // ---- 对外响应式状态 ----
  const state = ref(GameState.MENU)
  const score = ref(0)
  const lives = ref(3)
  const maxLives = ref(3)
  const danmuList = ref([])
  const ending = ref(null)
  const combo = ref(0)
  const isNewRecord = ref(false)
  const themeId = ref(getTheme(loadJSON('theme', DEFAULT_THEME_ID)).id)
  const theme = computed(() => getTheme(themeId.value))
  const themes = THEMES

  // 难度
  const difficulties = DIFFICULTIES
  const difficultyId = ref(getDifficulty(loadJSON('difficulty', DEFAULT_DIFFICULTY_ID)).id)
  const difficulty = computed(() => getDifficulty(difficultyId.value))

  // 猫咪皮肤
  const skins = CAT_SKINS
  const skinId = ref(getSkin(loadJSON('skin', DEFAULT_SKIN_ID)).id)
  const skin = computed(() => getSkin(skinId.value))

  // 每主题独立最高分，持久化到 localStorage
  const bestScores = ref(loadJSON('best', {}))
  const bestScore = computed(() => bestScores.value[themeId.value] || 0)
  // 历史最高分（跨主题），用于皮肤解锁
  const bestEver = computed(() =>
    Object.values(bestScores.value).reduce((m, v) => Math.max(m, v || 0), 0)
  )
  const isSkinUnlocked = (s) => bestEver.value >= s.unlock

  const comboMult = computed(() => comboMultiplier(combo.value))
  const showCombo = computed(() => combo.value >= COMBO.showFrom)

  const levelName = computed(() => {
    let name = theme.value.levels[0].name
    for (const l of theme.value.levels) if (score.value >= l.score) name = l.name
    return name
  })

  // ---- 内部（非响应式，性能敏感）----
  const canvasRef = ref(null)
  let ctx = null
  let W = 0
  let H = 0
  let DPR = 1
  let rafId = 0
  let lastTime = 0
  let danmuSeq = 0

  const player = { x: 0, y: 0, targetX: 0 }
  let items = []
  let particles = []
  let pops = []
  let elapsed = 0
  let spawnTimer = 0
  let speedMul = 1
  let invincibleUntil = 0
  let catUntil = 0 // 小猫助攻结束时间
  let flash = 0
  let bgOffset = 0
  const keys = reactive({})

  // Boss 状态机：idle → warning → crossing → idle
  const boss = {
    phase: 'idle',
    x: 0,
    dir: 1,
    vx: 0,
    warnUntil: 0,
    nextDropAt: 0,
    nextAtSec: BOSS.firstAtSec,
  }
  // 震屏
  let shakeMag = 0
  let shakeUntil = 0
  function shake(mag, durMs) {
    shakeMag = Math.max(shakeMag, mag)
    shakeUntil = performance.now() + durMs
  }

  let totalWeight = 0
  function recalcWeight() {
    totalWeight = theme.value.items.reduce((s, k) => s + k.weight, 0)
  }

  // ---- 画布尺寸 ----
  function resize() {
    const c = canvasRef.value
    if (!c) return
    const parent = c.parentElement
    W = parent.clientWidth
    H = parent.clientHeight
    DPR = Math.min(window.devicePixelRatio || 1, 2)
    c.width = W * DPR
    c.height = H * DPR
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0)
  }

  function mount(canvasEl) {
    canvasRef.value = canvasEl
    ctx = canvasEl.getContext('2d')
    recalcWeight()
    resize()
    window.addEventListener('resize', resize)
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    lastTime = performance.now()
    rafId = requestAnimationFrame(loop)
  }

  function unmount() {
    cancelAnimationFrame(rafId)
    window.removeEventListener('resize', resize)
    window.removeEventListener('keydown', onKeyDown)
    window.removeEventListener('keyup', onKeyUp)
  }

  // ---- 输入 ----
  function onKeyDown(e) {
    if (['ArrowLeft', 'ArrowRight', 'a', 'd', 'A', 'D'].includes(e.key)) keys[e.key] = true
    if (e.key === ' ' && state.value !== GameState.PLAY) {
      e.preventDefault()
      start()
    }
  }
  function onKeyUp(e) {
    keys[e.key] = false
  }
  function pointerMove(clientX) {
    if (state.value !== GameState.PLAY || !canvasRef.value) return
    const rect = canvasRef.value.getBoundingClientRect()
    player.targetX = clientX - rect.left
  }

  function setTheme(id) {
    if (state.value === GameState.PLAY) return // 对局中不允许切主题
    themeId.value = id
    saveJSON('theme', id)
    recalcWeight()
  }

  function setDifficulty(id) {
    if (state.value === GameState.PLAY) return
    difficultyId.value = id
    saveJSON('difficulty', id)
  }

  function setSkin(id) {
    const s = getSkin(id)
    if (!isSkinUnlocked(s)) return // 未解锁不可选
    skinId.value = s.id
    saveJSON('skin', s.id)
  }

  // ---- 流程 ----
  function start() {
    sound.resume() // 借用户点击手势唤醒音频
    recalcWeight()
    score.value = 0
    maxLives.value = difficulty.value.lives
    lives.value = difficulty.value.lives
    combo.value = 0
    isNewRecord.value = false
    items = []
    particles = []
    pops = []
    danmuList.value = []
    elapsed = 0
    spawnTimer = 0
    speedMul = 1
    invincibleUntil = 0
    catUntil = 0
    flash = 0
    shakeMag = 0
    shakeUntil = 0
    boss.phase = 'idle'
    boss.nextAtSec = BOSS.firstAtSec
    player.x = player.targetX = W / 2
    player.y = H - PLAYER.bottomGap
    state.value = GameState.PLAY
  }

  function gameOver() {
    state.value = GameState.OVER
    const list = theme.value.endings
    ending.value = list.find((e) => score.value >= e.score) || list[list.length - 1]

    // 刷新最高分
    if (score.value > (bestScores.value[themeId.value] || 0)) {
      bestScores.value = { ...bestScores.value, [themeId.value]: score.value }
      saveJSON('best', bestScores.value)
      isNewRecord.value = true
      sound.play('record')
    } else {
      sound.play('over')
    }
  }

  // ---- 弹幕 ----
  function shout(text, color) {
    const id = ++danmuSeq
    danmuList.value.push({ id, text, color, top: 10 + Math.random() * 220 })
    setTimeout(() => {
      danmuList.value = danmuList.value.filter((d) => d.id !== id)
    }, 4200)
  }

  // ---- 生成 / 特效 ----
  function spawnItem() {
    let r = Math.random() * totalWeight
    let kind = theme.value.items[0]
    for (const k of theme.value.items) {
      r -= k.weight
      if (r <= 0) {
        kind = k
        break
      }
    }
    items.push({
      x: 24 + Math.random() * (W - 48),
      y: -40,
      size: 34 + Math.random() * 8,
      vy:
        (DIFFICULTY.baseFallSpeed + Math.random() * DIFFICULTY.fallSpeedJitter) *
        speedMul *
        difficulty.value.speedMul,
      rot: (Math.random() - 0.5) * 2,
      a: Math.random() * Math.PI,
      emoji: kind.emoji,
      type: kind.type,
      score: kind.score || 0,
    })
  }

  // Boss 从某点砸下一个该主题的扣血物
  function dropBadFrom(x) {
    const bads = theme.value.items.filter((k) => k.type === 'bad')
    const kind = pick(bads) || theme.value.items[theme.value.items.length - 1]
    items.push({
      x: Math.max(20, Math.min(W - 20, x + (Math.random() - 0.5) * 50)),
      y: BOSS.y + 20,
      size: 34 + Math.random() * 8,
      vy: (DIFFICULTY.baseFallSpeed + 40) * difficulty.value.speedMul,
      rot: (Math.random() - 0.5) * 2,
      a: Math.random() * Math.PI,
      emoji: kind.emoji,
      type: 'bad',
      score: 0,
    })
  }

  // Boss 状态机推进
  function updateBoss(dt, now) {
    if (boss.phase === 'idle') {
      if (elapsed >= boss.nextAtSec) {
        boss.phase = 'warning'
        boss.warnUntil = now + BOSS.warningMs
        boss.dir = Math.random() < 0.5 ? 1 : -1
        shout(theme.value.boss.warn, TYPE_COLORS.bad)
        shake(6, 500)
      }
    } else if (boss.phase === 'warning') {
      if (now >= boss.warnUntil) {
        boss.phase = 'crossing'
        boss.x = boss.dir > 0 ? -60 : W + 60
        boss.vx = (boss.dir * (W + 120)) / BOSS.crossSec
        boss.nextDropAt = now
        sound.play('bad')
        shake(10, 350)
      }
    } else if (boss.phase === 'crossing') {
      boss.x += boss.vx * dt
      if (now >= boss.nextDropAt) {
        boss.nextDropAt = now + BOSS.dropIntervalMs
        dropBadFrom(boss.x)
      }
      const gone = boss.dir > 0 ? boss.x > W + 60 : boss.x < -60
      if (gone) {
        boss.phase = 'idle'
        boss.nextAtSec = elapsed + BOSS.intervalSec
      }
    }
  }

  function burst(x, y, color, n = 12) {
    for (let i = 0; i < n; i++) {
      const ang = Math.random() * Math.PI * 2
      const sp = 40 + Math.random() * 160
      particles.push({
        x,
        y,
        vx: Math.cos(ang) * sp,
        vy: Math.sin(ang) * sp,
        life: 0.6,
        color,
        r: 2 + Math.random() * 3,
      })
    }
  }

  function addPop(x, y, text, color) {
    pops.push({ x, y, text, color, life: 0.8 })
  }

  // ---- 更新 ----
  function update(dt) {
    if (state.value !== GameState.PLAY) return
    elapsed += dt

    speedMul = 1 + elapsed * DIFFICULTY.speedRamp
    const spawnInterval =
      Math.max(
        DIFFICULTY.minSpawnInterval,
        DIFFICULTY.baseSpawnInterval - elapsed * DIFFICULTY.spawnRamp
      ) * difficulty.value.spawnMul

    // 玩家移动
    if (keys['ArrowLeft'] || keys['a'] || keys['A'])
      player.targetX = player.x - PLAYER.keyboardSpeed * dt
    if (keys['ArrowRight'] || keys['d'] || keys['D'])
      player.targetX = player.x + PLAYER.keyboardSpeed * dt
    player.targetX = Math.max(PLAYER.size / 2, Math.min(W - PLAYER.size / 2, player.targetX))
    player.x += (player.targetX - player.x) * Math.min(1, dt * PLAYER.follow)

    // 生成
    spawnTimer += dt * 1000
    if (spawnTimer >= spawnInterval) {
      spawnTimer = 0
      spawnItem()
    }

    const now = performance.now()
    updateBoss(dt, now)
    const invincible = now < invincibleUntil
    const catActive = now < catUntil
    // 小猫助攻时接取范围放大
    const catchScale = catActive ? 1.6 : 1

    for (let i = items.length - 1; i >= 0; i--) {
      const it = items[i]

      // 小猫助攻：磁吸「好东西」朝玩家靠拢
      if (catActive && (it.type === 'good' || it.type === 'invincible' || it.type === 'cat')) {
        it.x += (player.x - it.x) * Math.min(1, dt * 3)
      }

      it.y += it.vy * dt
      it.a += it.rot * dt

      const dx = Math.abs(it.x - player.x)
      const dy = Math.abs(it.y - (player.y + 6))
      if (
        dx < (PLAYER.size * 0.45 + it.size * 0.4) * catchScale &&
        dy < PLAYER.size * 0.45 * catchScale
      ) {
        handleCatch(it, invincible)
        items.splice(i, 1)
        continue
      }
      if (it.y > H + 50) {
        // 漏接「好东西」会断连击
        if (it.type === 'good') combo.value = 0
        items.splice(i, 1)
      }
    }

    // 粒子
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i]
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.vy += 300 * dt
      p.life -= dt
      if (p.life <= 0) particles.splice(i, 1)
    }
    // 飘字
    for (let i = pops.length - 1; i >= 0; i--) {
      pops[i].y -= 40 * dt
      pops[i].life -= dt
      if (pops[i].life <= 0) pops.splice(i, 1)
    }
    if (flash > 0) flash -= dt
  }

  function handleCatch(it, invincible) {
    if (it.type === 'good') {
      combo.value += 1
      const gained = Math.round(it.score * comboMultiplier(combo.value))
      score.value += gained
      const label = combo.value >= COMBO.showFrom ? `+${gained} x${combo.value}` : `+${gained}`
      addPop(it.x, it.y, label, TYPE_COLORS.good)
      burst(it.x, it.y, TYPE_COLORS.good)
      sound.play(combo.value >= COMBO.showFrom ? 'combo' : 'good', combo.value)
      if (Math.random() < 0.4) shout(pick(theme.value.danmu.good), TYPE_COLORS.good)
    } else if (it.type === 'invincible') {
      invincibleUntil = performance.now() + POWER.invincibleMs
      score.value += it.score
      addPop(it.x, it.y, '无敌!', TYPE_COLORS.invincible)
      burst(it.x, it.y, TYPE_COLORS.invincible, 22)
      sound.play('power')
      shout(pick(theme.value.danmu.invincible), TYPE_COLORS.invincible)
    } else if (it.type === 'cat') {
      catUntil = performance.now() + POWER.catHelperMs
      score.value += it.score
      addPop(it.x, it.y, '喵~助攻!', TYPE_COLORS.cat)
      burst(it.x, it.y, TYPE_COLORS.cat, 24)
      sound.play('cat')
      shout(pick(CAT_DANMU), TYPE_COLORS.cat)
    } else {
      if (!invincible) {
        lives.value -= 1
        combo.value = 0 // 踩雷断连击
        flash = 0.25
        shake(12, 300)
        addPop(it.x, it.y, '-1', TYPE_COLORS.bad)
        burst(it.x, it.y, TYPE_COLORS.bad)
        sound.play('bad')
        if (Math.random() < 0.6) shout(pick(theme.value.danmu.bad), TYPE_COLORS.bad)
        if (lives.value <= 0) gameOver()
      } else {
        burst(it.x, it.y, TYPE_COLORS.invincible)
      }
    }
  }

  // ---- 渲染 ----
  function drawBg() {
    const colors = theme.value.bg
    const grad = ctx.createLinearGradient(0, 0, 0, H)
    grad.addColorStop(0, colors[0])
    grad.addColorStop(0.6, colors[1])
    grad.addColorStop(1, colors[2])
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, W, H)

    bgOffset = (bgOffset + 0.3) % 40
    ctx.strokeStyle = 'rgba(255,255,255,0.04)'
    ctx.lineWidth = 1
    for (let y = -40 + bgOffset; y < H; y += 40) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(W, y)
      ctx.stroke()
    }
    for (let x = 0; x < W; x += 40) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, H)
      ctx.stroke()
    }
  }

  function drawBoss(now) {
    const b = theme.value.boss
    if (boss.phase === 'warning') {
      // 顶部预警横幅 + 闪烁
      const blink = 0.4 + Math.abs(Math.sin(now / 120)) * 0.5
      ctx.save()
      ctx.globalAlpha = blink * 0.85
      ctx.fillStyle = TYPE_COLORS.bad
      ctx.fillRect(0, BOSS.y - 28, W, 40)
      ctx.globalAlpha = 1
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 18px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(`${b.emoji} ${b.name}来袭！`, W / 2, BOSS.y - 8)
      ctx.restore()
    } else if (boss.phase === 'crossing') {
      const bob = Math.sin(now / 100) * 6
      ctx.save()
      ctx.translate(boss.x, BOSS.y + bob)
      ctx.font = '58px serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      if (boss.dir < 0) ctx.scale(-1, 1) // 朝向移动方向
      ctx.fillText(b.emoji, 0, 0)
      ctx.restore()
    }
  }

  function draw() {
    if (!ctx) return
    const now = performance.now()
    drawBg()

    // 震屏：背景之上整体抖动
    let sx = 0
    let sy = 0
    if (now < shakeUntil && shakeMag > 0) {
      const k = (shakeUntil - now) / 300
      const m = shakeMag * Math.max(0, Math.min(1, k))
      sx = (Math.random() - 0.5) * m * 2
      sy = (Math.random() - 0.5) * m * 2
    } else {
      shakeMag = 0
    }
    ctx.save()
    ctx.translate(sx, sy)

    // Boss
    if (state.value === GameState.PLAY) drawBoss(now)

    // 掉落物
    for (const it of items) {
      ctx.save()
      ctx.translate(it.x, it.y)
      ctx.rotate(Math.sin(it.a) * 0.3)
      ctx.font = `${it.size}px serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(it.emoji, 0, 0)
      ctx.restore()
    }

    // 玩家
    if (state.value !== GameState.MENU) {
      const invincible = now < invincibleUntil
      const catActive = now < catUntil
      ctx.save()
      ctx.translate(player.x, player.y)
      if (invincible) {
        ctx.globalAlpha = 0.5 + Math.sin(now / 60) * 0.4
        ctx.beginPath()
        ctx.arc(0, 4, PLAYER.size * 0.7, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(6,214,160,.25)'
        ctx.fill()
        ctx.globalAlpha = 1
      }
      if (catActive) {
        // 磁吸光环
        ctx.globalAlpha = 0.3 + Math.sin(now / 120) * 0.15
        ctx.beginPath()
        ctx.arc(0, 4, PLAYER.size * 1.0, 0, Math.PI * 2)
        ctx.strokeStyle = TYPE_COLORS.cat
        ctx.lineWidth = 3
        ctx.stroke()
        ctx.globalAlpha = 1
      }
      ctx.font = `${PLAYER.size}px serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(skin.value.emoji, 0, 0) // 选中的猫咪皮肤
      ctx.font = `${PLAYER.size * 0.5}px serif`
      ctx.fillText(theme.value.player.plate, 0, PLAYER.size * 0.42)
      ctx.restore()

      // 助攻小猫：在玩家旁边蹦跳
      if (catActive) {
        const bob = Math.sin(now / 120) * 8
        const side = Math.sin(now / 600) * 30
        ctx.save()
        ctx.translate(player.x + side, player.y - PLAYER.size * 0.5 + bob)
        ctx.font = `${PLAYER.size * 0.55}px serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(theme.value.helperCat, 0, 0)
        ctx.restore()
      }
    }

    // 粒子
    for (const p of particles) {
      ctx.globalAlpha = Math.max(0, p.life / 0.6)
      ctx.fillStyle = p.color
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1

    // 飘字
    for (const p of pops) {
      ctx.globalAlpha = Math.max(0, p.life / 0.8)
      ctx.fillStyle = p.color
      ctx.font = 'bold 22px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(p.text, p.x, p.y)
    }
    ctx.globalAlpha = 1

    ctx.restore() // 结束震屏变换

    // 受击红屏（不随震屏抖动，铺满全屏）
    if (flash > 0) {
      ctx.fillStyle = `rgba(239,71,111,${flash})`
      ctx.fillRect(0, 0, W, H)
    }
  }

  function loop(t) {
    const dt = Math.min(0.05, (t - lastTime) / 1000 || 0)
    lastTime = t
    update(dt)
    draw()
    rafId = requestAnimationFrame(loop)
  }

  return {
    // state
    state,
    score,
    lives,
    maxLives,
    levelName,
    danmuList,
    ending,
    theme,
    themes,
    themeId,
    difficulties,
    difficultyId,
    skins,
    skinId,
    isSkinUnlocked,
    bestEver,
    combo,
    comboMult,
    showCombo,
    bestScore,
    bestScores,
    isNewRecord,
    muted: sound.muted,
    // actions
    mount,
    unmount,
    start,
    pointerMove,
    setTheme,
    setDifficulty,
    setSkin,
    toggleMute: sound.toggleMute,
  }
}
