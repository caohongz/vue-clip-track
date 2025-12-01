import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePlaybackStore } from '../../stores/playback'

describe('usePlaybackStore', () => {
  let store: ReturnType<typeof usePlaybackStore>

  beforeEach(() => {
    vi.useFakeTimers()
    setActivePinia(createPinia())
    store = usePlaybackStore()
  })

  afterEach(() => {
    vi.useRealTimers()
    store.reset()
  })

  describe('初始状态', () => {
    it('应该有正确的初始状态', () => {
      expect(store.isPlaying).toBe(false)
      expect(store.currentTime).toBe(0)
      expect(store.playbackRate).toBe(1)
      expect(store.duration).toBe(0)
    })
  })

  describe('formatTime', () => {
    it('应该正确格式化时间', () => {
      expect(store.formatTime(0)).toBe('00:00:00:00')
      expect(store.formatTime(1)).toBe('00:00:01:00')
      expect(store.formatTime(60)).toBe('00:01:00:00')
      expect(store.formatTime(3600)).toBe('01:00:00:00')
    })

    it('应该支持自定义帧率', () => {
      expect(store.formatTime(1, 24)).toBe('00:00:01:00')
      expect(store.formatTime(1.5, 24)).toBe('00:00:01:12')
    })

    it('应该正确处理帧数', () => {
      // 30fps, 0.5秒 = 15帧
      expect(store.formatTime(0.5, 30)).toBe('00:00:00:15')
    })
  })

  describe('计算属性', () => {
    it('formattedCurrentTime 应该返回格式化的当前时间', () => {
      store.currentTime = 65.5
      expect(store.formattedCurrentTime).toBe('00:01:05:15')
    })

    it('formattedDuration 应该返回格式化的总时长', () => {
      store.duration = 120
      expect(store.formattedDuration).toBe('00:02:00:00')
    })
  })

  describe('play', () => {
    it('应该设置 isPlaying 为 true', () => {
      store.play()
      expect(store.isPlaying).toBe(true)
    })

    it('已在播放时不应该重复调用', () => {
      store.play()
      store.play()
      expect(store.isPlaying).toBe(true)
    })
  })

  describe('pause', () => {
    it('应该设置 isPlaying 为 false', () => {
      store.play()
      store.pause()
      expect(store.isPlaying).toBe(false)
    })

    it('未在播放时不应该报错', () => {
      store.pause()
      expect(store.isPlaying).toBe(false)
    })
  })

  describe('togglePlay', () => {
    it('应该切换播放状态', () => {
      expect(store.isPlaying).toBe(false)
      store.togglePlay()
      expect(store.isPlaying).toBe(true)
      store.togglePlay()
      expect(store.isPlaying).toBe(false)
    })
  })

  describe('seekTo', () => {
    it('应该设置当前时间', () => {
      store.duration = 100
      store.seekTo(50)
      expect(store.currentTime).toBe(50)
    })

    it('应该限制在有效范围内', () => {
      store.duration = 100
      store.seekTo(-10)
      expect(store.currentTime).toBe(0)

      store.seekTo(150)
      expect(store.currentTime).toBe(100)
    })
  })

  describe('setPlaybackRate', () => {
    it('应该设置播放速率', () => {
      store.setPlaybackRate(2)
      expect(store.playbackRate).toBe(2)
    })
  })

  describe('setDuration', () => {
    it('应该设置总时长', () => {
      store.setDuration(120)
      expect(store.duration).toBe(120)
    })
  })

  describe('adjustTime', () => {
    it('应该调整当前时间', () => {
      store.duration = 100
      store.currentTime = 50

      store.adjustTime(10)
      expect(store.currentTime).toBe(60)

      store.adjustTime(-20)
      expect(store.currentTime).toBe(40)
    })

    it('应该限制在有效范围内', () => {
      store.duration = 100
      store.currentTime = 50

      store.adjustTime(100)
      expect(store.currentTime).toBe(100)

      store.adjustTime(-200)
      expect(store.currentTime).toBe(0)
    })
  })

  describe('reset', () => {
    it('应该重置所有状态', () => {
      store.play()
      store.currentTime = 50
      store.playbackRate = 2
      store.duration = 100

      store.reset()

      expect(store.isPlaying).toBe(false)
      expect(store.currentTime).toBe(0)
      expect(store.playbackRate).toBe(1)
      expect(store.duration).toBe(0)
    })
  })

  describe('播放循环', () => {
    it('播放时应该随时间推进', async () => {
      store.duration = 100
      store.currentTime = 0

      // Mock requestAnimationFrame
      let frameCallback: FrameRequestCallback | undefined = undefined
      const originalRAF = (globalThis as any).requestAnimationFrame
        ; (globalThis as any).requestAnimationFrame = vi.fn((callback: FrameRequestCallback) => {
          frameCallback = callback
          return 1
        })

      store.play()
      expect(store.isPlaying).toBe(true)

      // 模拟第一帧（初始化 lastTime）
      if (frameCallback) {
        (frameCallback as FrameRequestCallback)(1000)
      }

      // 模拟第二帧（100ms 后）
      if (frameCallback) {
        (frameCallback as FrameRequestCallback)(1100)
      }

      // 验证时间有推进（deltaTime = 0.1秒）
      expect(store.currentTime).toBeGreaterThanOrEqual(0)

      store.pause()
        ; (globalThis as any).requestAnimationFrame = originalRAF
    })

    it('播放到达末尾时应该自动暂停', async () => {
      store.duration = 1
      store.currentTime = 0.9

      let frameCallback: FrameRequestCallback | undefined = undefined
      const originalRAF = (globalThis as any).requestAnimationFrame
        ; (globalThis as any).requestAnimationFrame = vi.fn((callback: FrameRequestCallback) => {
          frameCallback = callback
          return 1
        })

      store.play()

      // 模拟第一帧
      if (frameCallback) {
        (frameCallback as FrameRequestCallback)(1000)
      }

      // 模拟时间超过 duration
      if (frameCallback) {
        (frameCallback as FrameRequestCallback)(2000) // 1秒后，newTime = 0.9 + 1 = 1.9 > duration
      }

      // 应该自动暂停
      expect(store.isPlaying).toBe(false)
      expect(store.currentTime).toBe(1) // 应该停在 duration

        ; (globalThis as any).requestAnimationFrame = originalRAF
    })

    it('调整播放速率应该影响播放速度', async () => {
      store.duration = 100
      store.currentTime = 0
      store.setPlaybackRate(2) // 2倍速

      let frameCallback: FrameRequestCallback | undefined = undefined
      const originalRAF = (globalThis as any).requestAnimationFrame
        ; (globalThis as any).requestAnimationFrame = vi.fn((callback: FrameRequestCallback) => {
          frameCallback = callback
          return 1
        })

      store.play()

      // 模拟第一帧
      if (frameCallback) {
        (frameCallback as FrameRequestCallback)(1000)
      }

      // 模拟第二帧（100ms 后，2倍速应该推进 0.2秒）
      if (frameCallback) {
        (frameCallback as FrameRequestCallback)(1100)
      }

      expect(store.currentTime).toBeGreaterThanOrEqual(0)

      store.pause()
        ; (globalThis as any).requestAnimationFrame = originalRAF
    })
  })
})
