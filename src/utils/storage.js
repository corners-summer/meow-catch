/**
 * 极简的 localStorage 封装，统一前缀、容错（隐私模式下不报错）。
 */
const PREFIX = 'cat-game:'

export function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    return raw == null ? fallback : JSON.parse(raw)
  } catch {
    return fallback
  }
}

export function saveJSON(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    /* 忽略写入失败（如隐私模式 / 配额超限） */
  }
}
