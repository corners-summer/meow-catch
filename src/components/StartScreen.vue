<script setup>
defineProps({
  theme: { type: Object, required: true },
  themes: { type: Array, required: true },
  themeId: { type: String, required: true },
  difficulties: { type: Array, required: true },
  difficultyId: { type: String, required: true },
  skins: { type: Array, required: true },
  skinId: { type: String, required: true },
  isSkinUnlocked: { type: Function, required: true },
  bestScores: { type: Object, default: () => ({}) },
})
defineEmits(['start', 'select-theme', 'select-difficulty', 'select-skin'])
</script>

<template>
  <div class="overlay">
    <h1 v-html="theme.title"></h1>

    <!-- 主题切换 -->
    <div class="row">
      <button
        v-for="t in themes"
        :key="t.id"
        class="chip"
        :class="{ active: t.id === themeId }"
        @click="$emit('select-theme', t.id)"
      >
        <span class="ic">{{ t.icon }}</span> {{ t.name }}
      </button>
    </div>

    <!-- 难度选择 -->
    <div class="section-label">选择难度</div>
    <div class="row">
      <button
        v-for="d in difficulties"
        :key="d.id"
        class="chip"
        :class="{ active: d.id === difficultyId }"
        @click="$emit('select-difficulty', d.id)"
      >
        <span class="ic">{{ d.icon }}</span> {{ d.name }}
        <span class="sub">{{ '❤️'.repeat(d.lives) }}</span>
      </button>
    </div>

    <!-- 猫咪图鉴 -->
    <div class="section-label">猫咪图鉴（按历史最高分解锁）</div>
    <div class="skins">
      <button
        v-for="s in skins"
        :key="s.id"
        class="skin"
        :class="{ active: s.id === skinId, locked: !isSkinUnlocked(s) }"
        :title="isSkinUnlocked(s) ? s.name : `${s.unlock} 分解锁`"
        @click="$emit('select-skin', s.id)"
      >
        <span class="face">{{ isSkinUnlocked(s) ? s.emoji : '🔒' }}</span>
        <span class="name">{{ isSkinUnlocked(s) ? s.name : s.unlock }}</span>
      </button>
    </div>

    <div class="best-row">🏆 本主题最高分：{{ bestScores[themeId] || 0 }}</div>

    <button class="btn" @click="$emit('start')">开始游戏</button>
    <div class="hint">电脑：← → 移动　手机：触摸拖动 · ⚠️ 小心 Boss 乱入</div>
  </div>
</template>

<style scoped>
@import '../styles/overlay.css';

.section-label {
  font-size: 12px;
  opacity: 0.6;
  margin-top: 2px;
}
.row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
}
.chip {
  cursor: pointer;
  border: 2px solid rgba(255, 255, 255, 0.18);
  background: rgba(255, 255, 255, 0.06);
  color: #fff;
  font-weight: 700;
  font-size: 13px;
  padding: 7px 14px;
  border-radius: 22px;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: all 0.15s;
}
.chip .ic {
  font-size: 16px;
}
.chip .sub {
  font-size: 10px;
  letter-spacing: -2px;
}
.chip.active {
  border-color: var(--accent);
  background: rgba(255, 209, 102, 0.18);
  color: var(--accent);
  box-shadow: 0 0 16px rgba(255, 209, 102, 0.3);
}
.chip:active {
  transform: scale(0.95);
}

.skins {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
  max-width: 340px;
}
.skin {
  cursor: pointer;
  width: 54px;
  border: 2px solid rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  padding: 6px 0 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  transition: all 0.15s;
}
.skin .face {
  font-size: 24px;
}
.skin .name {
  font-size: 10px;
  opacity: 0.85;
  color: #fff;
}
.skin.active {
  border-color: var(--accent);
  background: rgba(255, 209, 102, 0.18);
  box-shadow: 0 0 14px rgba(255, 209, 102, 0.3);
}
.skin.locked {
  cursor: not-allowed;
  opacity: 0.5;
}
.skin.locked .name {
  color: var(--accent);
}
.best-row {
  font-size: 13px;
  color: var(--accent);
  opacity: 0.9;
  font-weight: 700;
}
</style>
