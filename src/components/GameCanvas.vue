<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  onMountCanvas: { type: Function, required: true },
  onUnmountCanvas: { type: Function, required: true },
  onPointer: { type: Function, required: true },
})

const canvas = ref(null)

function handlePointer(clientX) {
  props.onPointer(clientX)
}
function onMouseMove(e) {
  handlePointer(e.clientX)
}
function onTouchStart(e) {
  handlePointer(e.touches[0].clientX)
}
function onTouchMove(e) {
  handlePointer(e.touches[0].clientX)
  e.preventDefault()
}

onMounted(() => {
  props.onMountCanvas(canvas.value)
})
onBeforeUnmount(() => {
  props.onUnmountCanvas()
})
</script>

<template>
  <canvas
    ref="canvas"
    class="game-canvas"
    @mousemove="onMouseMove"
    @touchstart.passive="onTouchStart"
    @touchmove.prevent="onTouchMove"
  ></canvas>
</template>

<style scoped>
.game-canvas {
  display: block;
  width: 100%;
  height: 100%;
  background: linear-gradient(180deg, #2b3a55 0%, #1b2735 60%, #131a26 100%);
}
</style>
