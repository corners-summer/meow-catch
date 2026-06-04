<script setup>
const props = defineProps({
  score: { type: Number, required: true },
  lives: { type: Number, required: true },
  maxLives: { type: Number, default: 3 },
  levelName: { type: String, required: true },
  levelLabel: { type: String, default: '等级' },
  bestScore: { type: Number, default: 0 },
  combo: { type: Number, default: 0 },
  comboMult: { type: Number, default: 1 },
  showCombo: { type: Boolean, default: false },
})

const hearts = () =>
  '❤️'.repeat(Math.max(0, props.lives)) +
  '🖤'.repeat(Math.max(0, props.maxLives - props.lives))
</script>

<template>
  <div class="hud">
    <div class="left">
      <div class="score">{{ score }}</div>
      <div class="lvl">{{ levelLabel }}：{{ levelName }}</div>
      <div class="best">🏆 最高 {{ bestScore }}</div>
    </div>

    <div class="right">
      <div class="hearts">{{ hearts() }}</div>
      <Transition name="pop">
        <div v-if="showCombo" :key="combo" class="combo">
          🔥 连击 {{ combo }} <span class="mult">x{{ comboMult }}</span>
        </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.hud {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 12px 14px;
  font-weight: 700;
  pointer-events: none;
  text-shadow: 0 2px 6px rgba(0, 0, 0, 0.6);
}
.right {
  text-align: right;
}
.score {
  font-size: 22px;
  color: var(--accent);
}
.lvl {
  font-size: 13px;
  opacity: 0.8;
}
.best {
  font-size: 12px;
  opacity: 0.65;
  margin-top: 2px;
}
.hearts {
  font-size: 20px;
  letter-spacing: 2px;
}
.combo {
  margin-top: 6px;
  font-size: 15px;
  color: #ff8fab;
}
.combo .mult {
  color: var(--accent);
  font-size: 17px;
}
.pop-enter-active {
  transition: transform 0.18s ease, opacity 0.18s ease;
}
.pop-enter-from {
  transform: scale(1.5);
  opacity: 0;
}
</style>
