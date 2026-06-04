<script setup>
import { useGame, GameState } from './composables/useGame.js'
import GameCanvas from './components/GameCanvas.vue'
import HudBar from './components/HudBar.vue'
import DanmuLayer from './components/DanmuLayer.vue'
import StartScreen from './components/StartScreen.vue'
import GameOverScreen from './components/GameOverScreen.vue'

const {
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
  combo,
  comboMult,
  showCombo,
  bestScore,
  bestScores,
  isNewRecord,
  muted,
  mount,
  unmount,
  start,
  pointerMove,
  setTheme,
  setDifficulty,
  setSkin,
  toggleMute,
} = useGame()
</script>

<template>
  <div class="stage">
    <GameCanvas
      :on-mount-canvas="mount"
      :on-unmount-canvas="unmount"
      :on-pointer="pointerMove"
    />

    <HudBar
      v-show="state !== GameState.MENU"
      :score="score"
      :lives="lives"
      :max-lives="maxLives"
      :level-name="levelName"
      :level-label="theme.levelLabel"
      :best-score="bestScore"
      :combo="combo"
      :combo-mult="comboMult"
      :show-combo="showCombo"
    />

    <DanmuLayer :list="danmuList" />

    <button class="mute-btn" :title="muted ? '开启音效' : '静音'" @click="toggleMute">
      {{ muted ? '🔇' : '🔊' }}
    </button>

    <StartScreen
      v-if="state === GameState.MENU"
      :theme="theme"
      :themes="themes"
      :theme-id="themeId"
      :difficulties="difficulties"
      :difficulty-id="difficultyId"
      :skins="skins"
      :skin-id="skinId"
      :is-skin-unlocked="isSkinUnlocked"
      :best-scores="bestScores"
      @start="start"
      @select-theme="setTheme"
      @select-difficulty="setDifficulty"
      @select-skin="setSkin"
    />
    <GameOverScreen
      v-else-if="state === GameState.OVER"
      :score="score"
      :ending="ending"
      :best-score="bestScore"
      :is-new-record="isNewRecord"
      @restart="start"
    />
  </div>
</template>

<style scoped>
.stage {
  position: relative;
  width: min(100vw, 480px);
  height: min(100vh, 800px);
  overflow: hidden;
  box-shadow: 0 0 60px rgba(0, 0, 0, 0.6);
}
.mute-btn {
  position: absolute;
  right: 12px;
  bottom: 12px;
  z-index: 5;
  border: none;
  cursor: pointer;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  font-size: 20px;
  background: rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(4px);
  transition: transform 0.12s;
}
.mute-btn:active {
  transform: scale(0.9);
}
</style>
