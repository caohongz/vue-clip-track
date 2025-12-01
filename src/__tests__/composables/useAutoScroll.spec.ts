import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref, nextTick, reactive } from 'vue'
import { setActivePinia, createPinia } from 'pinia'

let mockPlaybackStore = reactive({
  currentTime: 0,
  isPlaying: false,
})

let mockScaleStore = reactive({
  actualPixelsPerSecond: 100,
})

// Mock stores
vi.mock('@/stores/playback', () => ({
  usePlaybackStore: vi.fn(() => mockPlaybackStore),
}))

vi.mock('@/stores/scale', () => ({
  useScaleStore: vi.fn(() => mockScaleStore),
}))

describe('useAutoScroll', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    mockPlaybackStore.currentTime = 0
    mockPlaybackStore.isPlaying = false
    mockScaleStore.actualPixelsPerSecond = 100
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('应该正确导入', async () => {
    const { useAutoScroll } = await import('../../composables/useAutoScroll')
    expect(useAutoScroll).toBeDefined()
    expect(typeof useAutoScroll).toBe('function')
  })

  it('应该能初始化', async () => {
    const { useAutoScroll } = await import('../../composables/useAutoScroll')

    const scrollLeft = ref(0)
    const tracksWidth = ref(800)
    const setScrollLeft = vi.fn()

    // 不应该抛出错误
    useAutoScroll({ scrollLeft, tracksWidth, setScrollLeft })
  })

  it('不播放时不应触发滚动', async () => {
    const { useAutoScroll } = await import('../../composables/useAutoScroll')

    const scrollLeft = ref(0)
    const tracksWidth = ref(800)
    const setScrollLeft = vi.fn()

    useAutoScroll({ scrollLeft, tracksWidth, setScrollLeft })

    // 修改时间但未播放
    mockPlaybackStore.isPlaying = false
    mockPlaybackStore.currentTime = 100

    await nextTick()

    expect(setScrollLeft).not.toHaveBeenCalled()
  })

  it('播放时且接近右边缘时应触发滚动', async () => {
    const { useAutoScroll } = await import('../../composables/useAutoScroll')

    const scrollLeft = ref(0)
    const tracksWidth = ref(800)
    const setScrollLeft = vi.fn()

    useAutoScroll({ scrollLeft, tracksWidth, setScrollLeft })

    // 开始播放并到达边缘
    mockPlaybackStore.isPlaying = true
    // threshold = 0 + 800 * 0.9 = 720px
    // currentPos = currentTime * 100 需要 > 720
    // 所以 currentTime > 7.2
    mockPlaybackStore.currentTime = 8

    await nextTick()

    expect(setScrollLeft).toHaveBeenCalled()
    // 新的滚动位置应该是 scrollLeft + tracksWidth * 0.8 = 0 + 640 = 640
    expect(setScrollLeft).toHaveBeenCalledWith(640)
  })

  it('播放时未到边缘不应触发滚动', async () => {
    const { useAutoScroll } = await import('../../composables/useAutoScroll')

    const scrollLeft = ref(0)
    const tracksWidth = ref(800)
    const setScrollLeft = vi.fn()

    useAutoScroll({ scrollLeft, tracksWidth, setScrollLeft })

    // 开始播放但位置还在中间
    mockPlaybackStore.isPlaying = true
    mockPlaybackStore.currentTime = 3 // 300px < 720px threshold

    await nextTick()

    expect(setScrollLeft).not.toHaveBeenCalled()
  })
})
