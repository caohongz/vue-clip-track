import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

// localStorage key
const STORAGE_KEY = 'video-track-scale-settings'

// 从 localStorage 读取保存的设置
function loadSettings() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (e) {
    console.warn('Failed to load scale settings from localStorage:', e)
  }
  return null
}

// 保存设置到 localStorage
function saveSettings(settings: { scale: number; snapEnabled: boolean }) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch (e) {
    console.warn('Failed to save scale settings to localStorage:', e)
  }
}

export const useScaleStore = defineStore('scale', () => {
  // 加载保存的设置
  const savedSettings = loadSettings()

  // 状态
  const scale = ref(savedSettings?.scale ?? 1) // 当前缩放比例
  const minScale = ref(0.1) // 最小缩放比例
  const maxScale = ref(10) // 最大缩放比例
  const pixelsPerSecond = ref(100) // 每秒像素数（基础值）
  const snapEnabled = ref(savedSettings?.snapEnabled ?? true) // 是否启用吸附
  const snapThreshold = ref(10) // 吸附阈值（像素）

  // 监听变化并保存到 localStorage
  watch([scale, snapEnabled], ([newScale, newSnapEnabled]) => {
    saveSettings({ scale: newScale, snapEnabled: newSnapEnabled })
  }, { immediate: false })

  // 计算属性：实际每秒像素数
  const actualPixelsPerSecond = computed(() => pixelsPerSecond.value * scale.value)

  // 计算属性：刻度间隔配置（根据缩放比例动态调整）
  const rulerConfig = computed(() => {
    const s = scale.value

    // 放大级别 - 显示帧级别刻度
    if (s >= 5) {
      return {
        majorInterval: 1, // 1秒主刻度
        minorInterval: 1 / 30, // 每帧（假设30fps）
        majorHeight: 20,
        minorHeight: 8
      }
    } else if (s >= 2) {
      return {
        majorInterval: 1, // 1秒主刻度
        minorInterval: 0.1, // 0.1秒子刻度
        majorHeight: 20,
        minorHeight: 10
      }
    } else if (s >= 1) {
      return {
        majorInterval: 1, // 1秒主刻度
        minorInterval: 0.2, // 0.2秒子刻度
        majorHeight: 20,
        minorHeight: 10
      }
    } else if (s >= 0.5) {
      return {
        majorInterval: 2, // 2秒主刻度
        minorInterval: 0.5, // 0.5秒子刻度
        majorHeight: 20,
        minorHeight: 10
      }
    } else if (s >= 0.2) {
      return {
        majorInterval: 5, // 5秒主刻度
        minorInterval: 1, // 1秒子刻度
        majorHeight: 20,
        minorHeight: 10
      }
    } else {
      return {
        majorInterval: 10, // 10秒主刻度
        minorInterval: 2, // 2秒子刻度
        majorHeight: 20,
        minorHeight: 10
      }
    }
  })

  // 方法：设置缩放比例
  function setScale(newScale: number) {
    scale.value = Math.max(minScale.value, Math.min(newScale, maxScale.value))
  }

  // 方法：增加缩放
  function zoomIn(step = 0.1) {
    setScale(scale.value + step)
  }

  // 方法：减少缩放
  function zoomOut(step = 0.1) {
    setScale(scale.value - step)
  }

  // 方法：切换吸附功能
  function toggleSnap() {
    snapEnabled.value = !snapEnabled.value
  }

  // 方法：设置吸附启用状态
  function setSnapEnabled(enabled: boolean) {
    snapEnabled.value = enabled
  }

  // 方法：计算时间到像素位置
  function timeToPixels(time: number): number {
    return time * actualPixelsPerSecond.value
  }

  // 方法：计算像素位置到时间
  function pixelsToTime(pixels: number): number {
    return pixels / actualPixelsPerSecond.value
  }

  // 方法：计算吸附位置
  function snapToPosition(position: number, snapPositions: number[]): number {
    if (!snapEnabled.value || snapPositions.length === 0) {
      return position
    }

    // 找到最近的吸附点
    let closestPosition = position
    let minDistance = snapThreshold.value

    for (const snapPos of snapPositions) {
      const distance = Math.abs(position - snapPos)
      if (distance < minDistance) {
        minDistance = distance
        closestPosition = snapPos
      }
    }

    return closestPosition
  }

  // 方法：重置
  function reset() {
    scale.value = 1
    snapEnabled.value = true
    // 清除 localStorage 中的设置
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (e) {
      console.warn('Failed to remove scale settings from localStorage:', e)
    }
  }

  // 方法：检查是否有保存的设置
  function hasSavedSettings(): boolean {
    return savedSettings !== null
  }

  // 方法：初始化缩放（仅在没有保存的设置时使用默认值）
  function initScale(defaultScale: number) {
    if (!hasSavedSettings()) {
      setScale(defaultScale)
    }
  }

  // 方法：初始化吸附（仅在没有保存的设置时使用默认值）
  function initSnapEnabled(defaultEnabled: boolean) {
    if (!hasSavedSettings()) {
      setSnapEnabled(defaultEnabled)
    }
  }

  return {
    // 状态
    scale,
    minScale,
    maxScale,
    pixelsPerSecond,
    snapEnabled,
    snapThreshold,

    // 计算属性
    actualPixelsPerSecond,
    rulerConfig,

    // 方法
    setScale,
    zoomIn,
    zoomOut,
    toggleSnap,
    setSnapEnabled,
    timeToPixels,
    pixelsToTime,
    snapToPosition,
    reset,
    hasSavedSettings,
    initScale,
    initSnapEnabled
  }
})

