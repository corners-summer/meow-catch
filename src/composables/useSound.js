import { ref } from 'vue'
import { loadJSON, saveJSON } from '../utils/storage.js'

/**
 * 用 WebAudio 现场合成音效，零音频资源、零体积。
 * 所有声音都是几个振荡器拼出来的，静音状态持久化到 localStorage。
 */
export function useSound() {
  const muted = ref(loadJSON('muted', false))
  let actx = null

  function ctx() {
    if (!actx) {
      const AC = window.AudioContext || window.webkitAudioContext
      if (AC) actx = new AC()
    }
    return actx
  }

  // 首次交互时唤醒 AudioContext（浏览器自动播放策略）
  function resume() {
    const ac = ctx()
    if (ac && ac.state === 'suspended') ac.resume()
  }

  function tone(freq, dur, type = 'sine', gain = 0.15, delay = 0) {
    if (muted.value) return
    const ac = ctx()
    if (!ac) return
    const t0 = ac.currentTime + delay
    const osc = ac.createOscillator()
    const g = ac.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, t0)
    g.gain.setValueAtTime(gain, t0)
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
    osc.connect(g)
    g.connect(ac.destination)
    osc.start(t0)
    osc.stop(t0 + dur)
  }

  const sounds = {
    good: () => tone(660, 0.12, 'triangle'),
    // 连击越高音越高，制造"步步高升"的爽感
    combo: (n = 0) => tone(620 + Math.min(n, 20) * 45, 0.1, 'square', 0.12),
    bad: () => tone(120, 0.28, 'sawtooth', 0.2),
    cat: () => {
      tone(880, 0.1, 'sine', 0.16)
      tone(1320, 0.12, 'sine', 0.14, 0.09)
    },
    power: () => {
      tone(523, 0.1, 'square', 0.14)
      tone(784, 0.16, 'square', 0.14, 0.1)
    },
    record: () => {
      tone(659, 0.12, 'triangle', 0.18)
      tone(880, 0.12, 'triangle', 0.18, 0.12)
      tone(1175, 0.22, 'triangle', 0.18, 0.24)
    },
    over: () => {
      tone(300, 0.2, 'sawtooth', 0.18)
      tone(150, 0.4, 'sawtooth', 0.18, 0.18)
    },
  }

  function play(name, ...args) {
    sounds[name]?.(...args)
  }

  function toggleMute() {
    muted.value = !muted.value
    saveJSON('muted', muted.value)
  }

  return { muted, play, toggleMute, resume }
}
