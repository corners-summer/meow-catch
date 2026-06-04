/**
 * 游戏配置。
 *
 * 设计原则：**逻辑与内容分离**。
 * - 下方 SHARED 是所有主题通用的「玩法参数」（手感、难度曲线、道具行为时长）。
 * - THEMES 是各主题的「内容」（emoji、文案、等级、结算、配色）。
 *
 * 道具行为由 `type` 决定，逻辑只认 type，因此换主题/加主题只需改这里的数据：
 *   - good       命中加分
 *   - bad        命中扣 1 血
 *   - invincible 命中进入无敌
 *   - cat        命中召唤小猫助攻（磁吸 + 扩大接取范围）
 */

// 画布逻辑尺寸（实际渲染按容器自适应）
export const STAGE = {
  maxWidth: 480,
  maxHeight: 800,
}

// 玩家手感（与主题无关）
export const PLAYER = {
  size: 64,
  bottomGap: 90,
  keyboardSpeed: 520,
  follow: 14,
}

export const MAX_LIVES = 3

// 道具行为时长（ms）
export const POWER = {
  invincibleMs: 3000,
  catHelperMs: 6000, // 小猫助攻持续时间
}

// 难度曲线（与主题无关）
export const DIFFICULTY = {
  baseSpawnInterval: 800,
  minSpawnInterval: 320,
  spawnRamp: 12,
  baseFallSpeed: 120,
  fallSpeedJitter: 60,
  speedRamp: 0.03,
}

// 连击系统：连续接到好东西累积连击，分数翻倍；踩雷或漏接断连击。
export const COMBO = {
  step: 3, // 每多少连击提升一档倍率
  bonusPerStep: 0.5, // 每档增加的倍率
  maxMultiplier: 4, // 倍率上限
  showFrom: 2, // 连击达到多少才在 HUD 显示
}

// 当前连击对应的分数倍率
export function comboMultiplier(combo) {
  const m = 1 + Math.floor(combo / COMBO.step) * COMBO.bonusPerStep
  return Math.min(m, COMBO.maxMultiplier)
}

// 难度预设：spawnMul 越大生成越慢（越简单），speedMul 越大下落越快。
export const DIFFICULTIES = [
  { id: 'casual', name: '休闲', icon: '🍃', spawnMul: 1.3, speedMul: 0.85, lives: 4 },
  { id: 'normal', name: '普通', icon: '⚔️', spawnMul: 1.0, speedMul: 1.0, lives: 3 },
  { id: 'hell', name: '地狱', icon: '🔥', spawnMul: 0.7, speedMul: 1.3, lives: 2 },
]
export const DEFAULT_DIFFICULTY_ID = 'normal'
export function getDifficulty(id) {
  return DIFFICULTIES.find((d) => d.id === id) || DIFFICULTIES[1]
}

// 猫咪皮肤图鉴：按「历史最高分」解锁，选中的皮肤替换主角的猫。
export const CAT_SKINS = [
  { id: 'classic', emoji: '🐱', name: '狸花猫', unlock: 0 },
  { id: 'smile', emoji: '😺', name: '微笑猫', unlock: 100 },
  { id: 'grin', emoji: '😸', name: '开心猫', unlock: 250 },
  { id: 'heart', emoji: '😻', name: '花痴猫', unlock: 450 },
  { id: 'cool', emoji: '😼', name: '得意猫', unlock: 700 },
  { id: 'black', emoji: '🐈‍⬛', name: '黑猫警长', unlock: 1000 },
  { id: 'tiger', emoji: '🐯', name: '虎里虎气', unlock: 1500 },
]
export const DEFAULT_SKIN_ID = 'classic'
export function getSkin(id) {
  return CAT_SKINS.find((s) => s.id === id) || CAT_SKINS[0]
}

// Boss 乱入：周期性横穿屏幕并疯狂砸下扣血物。
export const BOSS = {
  firstAtSec: 18, // 首次出现时间
  intervalSec: 22, // 之后的出现间隔
  warningMs: 1200, // 出现前的预警时长
  crossSec: 4.2, // 横穿屏幕所需时间
  dropIntervalMs: 240, // 砸落扣血物的间隔
  y: 96, // boss 所在高度
}

// 道具行为对应的特效颜色
export const TYPE_COLORS = {
  good: '#ffd166',
  bad: '#ef476f',
  invincible: '#06d6a0',
  cat: '#ff8fab',
}

// 小猫助攻通用文案（所有主题共用）
export const CAT_DANMU = ['喵呜~本喵来帮你接！', '猫爪磁吸·启动', '有猫万事兴', '喵星人助攻中']

/**
 * 主题列表。新增主题：复制一份对象、改内容即可，无需改任何逻辑。
 */
export const THEMES = [
  {
    id: 'chicken',
    name: '打工人接鸡腿',
    icon: '🍗',
    title: '🍗 打工人<em>接鸡腿</em>大作战',
    intro: '你是一只饿了三天的打工猫。天上开始掉东西了——<br/>有的能吃，有的能让你当场离职。',
    // 背景渐变（从上到下）
    bg: ['#2b3a55', '#1b2735', '#131a26'],
    player: { emoji: '🐱', plate: '🍽️' }, // 主角是只打工猫
    helperCat: '😸', // 助攻小猫
    boss: { emoji: '🧔‍♂️', name: '老板', warn: '⚠️ 老板来了，快躲需求！' },
    items: [
      { emoji: '🍗', type: 'good', weight: 42, score: 10 },
      { emoji: '🐂', type: 'invincible', weight: 6, score: 5 },
      { emoji: '🐱', type: 'cat', weight: 5, score: 5 },
      { emoji: '📄', type: 'bad', weight: 24 },
      { emoji: '🪲', type: 'bad', weight: 23 },
    ],
    legend: [
      { emoji: '🍗', text: '鸡腿 +10 续命' },
      { emoji: '🐂', text: '红牛 无敌3秒' },
      { emoji: '🐱', text: '小猫 召唤助攻' },
      { emoji: '📄', text: '需求 -1血' },
      { emoji: '🪲', text: 'BUG -1血' },
    ],
    levelLabel: '摸鱼等级',
    levels: [
      { score: 0, name: '实习生' },
      { score: 50, name: '正式工' },
      { score: 120, name: '小组长' },
      { score: 220, name: '老油条' },
      { score: 350, name: '摸鱼大师' },
      { score: 500, name: '带薪划水之神' },
    ],
    danmu: {
      good: ['真香！', '这鸡腿绝了', '干饭猫干饭魂', '+10 续命', '吃饱才有力气摸鱼', '老板看不见我'],
      bad: ['啊这…需求又改了', 'BUG是我亲生的', '周报又得编了', '这锅我不背', '别更新需求了！', '我提桶跑路了'],
      invincible: ['红牛附体！冲！', '无敌是多么寂寞', '加班？不存在的', '喝完这罐再战300回合'],
    },
    endings: [
      { score: 500, title: '🏆 带薪划水之神！', comment: 'HR看了都流泪，建议直接升职加薪。' },
      { score: 220, title: '😎 老油条认证', comment: '需求虐我千百遍，我待鸡腿如初恋。' },
      { score: 80, title: '🙂 还行的打工猫', comment: '勉强温饱，离财富自由还差一个鸡腿。' },
      { score: 0, title: '😵 你被需求淹没了', comment: '连鸡腿都接不住，难怪老板说你不够努力。' },
    ],
  },
  {
    id: 'milktea',
    name: '接奶茶躲减肥餐',
    icon: '🧋',
    title: '🧋 接奶茶<em>躲减肥餐</em>',
    intro: '你是一只馋奶茶的小猫。天上下起了快乐水——<br/>但减肥餐也在虎视眈眈，接到就破功。',
    bg: ['#3a2b4d', '#2a1f3d', '#1a1428'],
    player: { emoji: '🐱', plate: '🥤' },
    helperCat: '😸',
    boss: { emoji: '🏋️', name: '减肥教练', warn: '⚠️ 减肥教练杀到，躲开减肥餐！' },
    items: [
      { emoji: '🧋', type: 'good', weight: 42, score: 10 },
      { emoji: '🏃', type: 'invincible', weight: 6, score: 5 }, // 开跑！减肥餐打不到你
      { emoji: '🐱', type: 'cat', weight: 5, score: 5 },
      { emoji: '🥗', type: 'bad', weight: 24 },
      { emoji: '🥦', type: 'bad', weight: 23 },
    ],
    legend: [
      { emoji: '🧋', text: '奶茶 +10 快乐' },
      { emoji: '🏃', text: '跑鞋 无敌3秒' },
      { emoji: '🐱', text: '小猫 召唤助攻' },
      { emoji: '🥗', text: '沙拉 -1血' },
      { emoji: '🥦', text: '西兰花 -1血' },
    ],
    levelLabel: '快乐等级',
    levels: [
      { score: 0, name: '佛系养生' },
      { score: 50, name: '微糖去冰' },
      { score: 120, name: '七分糖' },
      { score: 220, name: '全糖加料' },
      { score: 350, name: '奶茶续命师' },
      { score: 500, name: '快乐水之王' },
    ],
    danmu: {
      good: ['快乐就是这么简单', '珍珠双倍！', '续命奶茶到账', '+10 快乐值', '热量是什么不认识', '今天也要喝奶茶'],
      bad: ['呸！草', '减肥从明天开始', '西兰花滚出去', '我的体重不归你管', '这也叫饭？', '卡路里刺客！'],
      invincible: ['跑起来！减肥餐追不上', '运动了就能多喝一杯', '无敌奔跑模式', '甩开沙拉三条街'],
    },
    endings: [
      { score: 500, title: '🏆 快乐水之王！', comment: '你已超脱卡路里，奶茶店该给你立雕像。' },
      { score: 220, title: '😎 全糖加料认证', comment: '减肥餐在你面前瑟瑟发抖。' },
      { score: 80, title: '🙂 还行的奶茶星人', comment: '快乐尚可，再多喝两杯就完美了。' },
      { score: 0, title: '😵 你被减肥餐围剿了', comment: '一口奶茶没喝上，这减肥怕是要成功了。' },
    ],
  },
  {
    id: 'coder',
    name: '程序员接咖啡躲会议',
    icon: '☕',
    title: '☕ 程序员<em>接咖啡</em>躲会议',
    intro: '你是一只靠咖啡续命的程序猫。天上落下了续命快乐水——<br/>但会议邀请和钉钉提醒正在疯狂轰炸。',
    bg: ['#1f3b34', '#15292a', '#0e1a1d'],
    player: { emoji: '🐱', plate: '☕' },
    helperCat: '😼',
    boss: { emoji: '🧑‍💼', name: '产品经理', warn: '⚠️ PM 带着新需求冲过来了！' },
    items: [
      { emoji: '☕', type: 'good', weight: 42, score: 10 },
      { emoji: '🎧', type: 'invincible', weight: 6, score: 5 }, // 戴上耳机=专注无敌
      { emoji: '🐱', type: 'cat', weight: 5, score: 5 },
      { emoji: '📅', type: 'bad', weight: 24 },
      { emoji: '🔔', type: 'bad', weight: 23 },
    ],
    legend: [
      { emoji: '☕', text: '咖啡 +10 续命' },
      { emoji: '🎧', text: '耳机 无敌3秒' },
      { emoji: '🐱', text: '小猫 召唤助攻' },
      { emoji: '📅', text: '会议 -1血' },
      { emoji: '🔔', text: '提醒 -1血' },
    ],
    levelLabel: '职级',
    levels: [
      { score: 0, name: '试用期' },
      { score: 50, name: '初级猿' },
      { score: 120, name: '中级猿' },
      { score: 220, name: '高级猿' },
      { score: 350, name: '架构师' },
      { score: 500, name: '不开会的神' },
    ],
    danmu: {
      good: ['咖啡因+10', '续上了续上了', '这口提神', '编译通过的味道', '再来一杯就能改完', '咖啡是第一生产力'],
      bad: ['又拉我进会？', '这会能发个邮件解决', '钉钉别响了！', '需求评审第8场', '已读不回也是一种态度', '我在忙（划水）'],
      invincible: ['耳机一戴谁也不爱', '专注模式·开', '勿扰勿扰勿扰', '世界清净了'],
    },
    endings: [
      { score: 500, title: '🏆 不开会的神！', comment: '日历干干净净，代码行云流水，建议封神。' },
      { score: 220, title: '😎 高级猿认证', comment: '会议虐我千百遍，咖啡待我如初恋。' },
      { score: 80, title: '🙂 还行的程序猫', comment: '勉强续上命，下个迭代继续加油。' },
      { score: 0, title: '😵 你被会议淹没了', comment: '一行代码没写，倒是开了一天的会。' },
    ],
  },
]

export const DEFAULT_THEME_ID = 'chicken'

export function getTheme(id) {
  return THEMES.find((t) => t.id === id) || THEMES[0]
}
