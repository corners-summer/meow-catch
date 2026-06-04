<script setup>
defineProps({
  score: { type: Number, required: true },
  ending: { type: Object, required: true },
  bestScore: { type: Number, default: 0 },
  isNewRecord: { type: Boolean, default: false },
})
defineEmits(['restart'])
</script>

<template>
  <div class="overlay">
    <div v-if="isNewRecord" class="record-badge">🎉 新纪录！</div>
    <h1>{{ ending.title }}</h1>
    <div class="final-score">{{ score }}</div>
    <div class="best">🏆 最高分 {{ bestScore }}</div>
    <p>{{ ending.comment }}</p>
    <button class="btn" @click="$emit('restart')">不服，再来！</button>
  </div>
</template>

<style scoped>
@import '../styles/overlay.css';

.final-score {
  font-size: 48px;
  color: var(--accent);
  font-weight: 900;
}
.best {
  font-size: 14px;
  opacity: 0.75;
  margin-top: -6px;
}
.record-badge {
  font-size: 22px;
  font-weight: 900;
  color: #fff;
  background: linear-gradient(135deg, #ff8fab, #ff5d8f);
  padding: 8px 22px;
  border-radius: 30px;
  box-shadow: 0 8px 24px rgba(255, 93, 143, 0.5);
  animation: bounce 0.6s ease infinite alternate;
}
@keyframes bounce {
  from {
    transform: translateY(0) rotate(-2deg);
  }
  to {
    transform: translateY(-6px) rotate(2deg);
  }
}
</style>
