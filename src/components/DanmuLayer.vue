<script setup>
defineProps({
  list: { type: Array, default: () => [] },
})
</script>

<template>
  <div class="danmu">
    <div
      v-for="d in list"
      :key="d.id"
      class="bullet"
      :style="{ top: d.top + 'px', color: d.color || '#fff' }"
    >
      {{ d.text }}
    </div>
  </div>
</template>

<style scoped>
.danmu {
  position: absolute;
  left: 0;
  right: 0;
  top: 70px;
  pointer-events: none;
  height: 0;
}
.bullet {
  position: absolute;
  white-space: nowrap;
  font-size: 15px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(2px);
  right: -50%;
  animation: fly 4s linear forwards;
}
@keyframes fly {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-160vw);
  }
}
</style>
