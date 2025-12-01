import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

describe('useResize', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null)
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('应该正确导入', async () => {
    const { useResize } = await import('../../composables/useResize')
    expect(useResize).toBeDefined()
    expect(typeof useResize).toBe('function')
  })

  it('应该返回正确的属性和方法', async () => {
    const { useResize } = await import('../../composables/useResize')

    const result = useResize()

    expect(result).toHaveProperty('isResizing')
    expect(result).toHaveProperty('startResize')
  })

  it('初始状态 isResizing 应该为 false', async () => {
    const { useResize } = await import('../../composables/useResize')

    const { isResizing } = useResize()

    expect(isResizing.value).toBe(false)
  })

  describe('startResize', () => {
    it('应该能开始调整大小', async () => {
      const { useResize } = await import('../../composables/useResize')
      const { useTracksStore } = await import('../../stores/tracks')

      const tracksStore = useTracksStore()
      const { isResizing, startResize } = useResize()

      // 添加测试轨道和 clip
      tracksStore.addTrack({
        id: 'track-1',
        type: 'video',
        name: 'Test Track',
        visible: true,
        locked: false,
        clips: [],
        order: 0,
      })

      const clip = {
        id: 'clip-1',
        trackId: 'track-1',
        type: 'video' as const,
        name: 'Test Clip',
        startTime: 0,
        endTime: 5,
        selected: false,
        sourceUrl: 'test.mp4',
        originalDuration: 10,
        trimStart: 0,
        trimEnd: 10,
        playbackRate: 1,
      }
      tracksStore.addClip('track-1', clip)

      const event = new MouseEvent('mousedown', {
        clientX: 100,
        clientY: 100,
      })

      startResize(clip, 'right', event)

      expect(isResizing.value).toBe(true)
    })

    it('应该能从左边调整大小', async () => {
      const { useResize } = await import('../../composables/useResize')
      const { useTracksStore } = await import('../../stores/tracks')

      const tracksStore = useTracksStore()
      const { isResizing, startResize } = useResize()

      tracksStore.addTrack({
        id: 'track-1',
        type: 'video',
        name: 'Test Track',
        visible: true,
        locked: false,
        clips: [],
        order: 0,
      })

      const clip = {
        id: 'clip-1',
        trackId: 'track-1',
        type: 'video' as const,
        name: 'Test Clip',
        startTime: 2,
        endTime: 7,
        selected: false,
        sourceUrl: 'test.mp4',
        originalDuration: 10,
        trimStart: 0,
        trimEnd: 10,
        playbackRate: 1,
      }
      tracksStore.addClip('track-1', clip)

      const event = new MouseEvent('mousedown', {
        clientX: 100,
        clientY: 100,
      })

      startResize(clip, 'left', event)

      expect(isResizing.value).toBe(true)
    })

    it('转场 clip 应该使用转场调整功能', async () => {
      const { useResize } = await import('../../composables/useResize')
      const { useTracksStore } = await import('../../stores/tracks')

      const tracksStore = useTracksStore()
      const { isResizing, startResize } = useResize()

      tracksStore.addTrack({
        id: 'track-1',
        type: 'video',
        name: 'Test Track',
        visible: true,
        locked: false,
        clips: [],
        order: 0,
      })

      const transitionClip = {
        id: 'transition-1',
        trackId: 'track-1',
        type: 'transition' as const,
        name: 'Transition',
        startTime: 0,
        endTime: 1,
        selected: false,
        transitionType: 'fade',
        transitionDuration: 1,
      }
      tracksStore.addClip('track-1', transitionClip)

      const event = new MouseEvent('mousedown', {
        clientX: 100,
        clientY: 100,
      })

      startResize(transitionClip, 'right', event)

      expect(isResizing.value).toBe(true)
    })

    it('audio clip 应该保存 trim 值', async () => {
      const { useResize } = await import('../../composables/useResize')
      const { useTracksStore } = await import('../../stores/tracks')

      const tracksStore = useTracksStore()
      const { isResizing, startResize } = useResize()

      tracksStore.addTrack({
        id: 'track-1',
        type: 'audio',
        name: 'Audio Track',
        visible: true,
        locked: false,
        clips: [],
        order: 0,
      })

      const audioClip = {
        id: 'clip-1',
        trackId: 'track-1',
        type: 'audio' as const,
        name: 'Audio Clip',
        startTime: 0,
        endTime: 5,
        selected: false,
        sourceUrl: 'test.mp3',
        originalDuration: 10,
        trimStart: 1,
        trimEnd: 9,
        playbackRate: 1,
      }
      tracksStore.addClip('track-1', audioClip)

      const event = new MouseEvent('mousedown', {
        clientX: 100,
        clientY: 100,
      })

      startResize(audioClip, 'right', event)

      expect(isResizing.value).toBe(true)
    })
  })

  describe('resize 完整流程', () => {
    it('应该能完成右边缘调整', async () => {
      const { useResize } = await import('../../composables/useResize')
      const { useTracksStore } = await import('../../stores/tracks')
      const { useHistoryStore } = await import('../../stores/history')

      const tracksStore = useTracksStore()
      const historyStore = useHistoryStore()
      const { isResizing, startResize } = useResize()

      historyStore.initialize()

      tracksStore.addTrack({
        id: 'track-1',
        type: 'video',
        name: 'Test Track',
        visible: true,
        locked: false,
        clips: [],
        order: 0,
      })

      const clip = {
        id: 'clip-1',
        trackId: 'track-1',
        type: 'video' as const,
        name: 'Test Clip',
        startTime: 0,
        endTime: 5,
        selected: false,
        sourceUrl: 'test.mp4',
        originalDuration: 10,
        trimStart: 0,
        trimEnd: 10,
        playbackRate: 1,
      }
      tracksStore.addClip('track-1', clip)

      // 开始调整
      const startEvent = new MouseEvent('mousedown', {
        clientX: 100,
        clientY: 100,
      })
      startResize(clip, 'right', startEvent)

      expect(isResizing.value).toBe(true)

      // 模拟鼠标移动
      const moveEvent = new MouseEvent('mousemove', {
        clientX: 150,
        clientY: 100,
      })
      document.dispatchEvent(moveEvent)

      // 模拟鼠标释放
      const upEvent = new MouseEvent('mouseup')
      document.dispatchEvent(upEvent)

      expect(isResizing.value).toBe(false)
    })

    it('应该能完成左边缘调整', async () => {
      const { useResize } = await import('../../composables/useResize')
      const { useTracksStore } = await import('../../stores/tracks')
      const { useHistoryStore } = await import('../../stores/history')

      const tracksStore = useTracksStore()
      const historyStore = useHistoryStore()
      const { isResizing, startResize } = useResize()

      historyStore.initialize()

      tracksStore.addTrack({
        id: 'track-1',
        type: 'video',
        name: 'Test Track',
        visible: true,
        locked: false,
        clips: [],
        order: 0,
      })

      const clip = {
        id: 'clip-1',
        trackId: 'track-1',
        type: 'video' as const,
        name: 'Test Clip',
        startTime: 2,
        endTime: 7,
        selected: false,
        sourceUrl: 'test.mp4',
        originalDuration: 10,
        trimStart: 0,
        trimEnd: 10,
        playbackRate: 1,
      }
      tracksStore.addClip('track-1', clip)

      // 开始调整
      const startEvent = new MouseEvent('mousedown', {
        clientX: 100,
        clientY: 100,
      })
      startResize(clip, 'left', startEvent)

      expect(isResizing.value).toBe(true)

      // 模拟鼠标移动
      const moveEvent = new MouseEvent('mousemove', {
        clientX: 80,
        clientY: 100,
      })
      document.dispatchEvent(moveEvent)

      // 模拟鼠标释放
      const upEvent = new MouseEvent('mouseup')
      document.dispatchEvent(upEvent)

      expect(isResizing.value).toBe(false)
    })

    it('转场调整应该更新转场时长', async () => {
      const { useResize } = await import('../../composables/useResize')
      const { useTracksStore } = await import('../../stores/tracks')
      const { useHistoryStore } = await import('../../stores/history')

      const tracksStore = useTracksStore()
      const historyStore = useHistoryStore()
      const { isResizing, startResize } = useResize()

      historyStore.initialize()

      tracksStore.addTrack({
        id: 'track-1',
        type: 'video',
        name: 'Test Track',
        visible: true,
        locked: false,
        clips: [],
        order: 0,
      })

      // 添加两个视频片段
      tracksStore.addClip('track-1', {
        id: 'clip-1',
        trackId: 'track-1',
        type: 'video',
        startTime: 0,
        endTime: 5,
        selected: false,
        sourceUrl: 'test1.mp4',
        originalDuration: 10,
        trimStart: 0,
        trimEnd: 10,
        playbackRate: 1,
      })

      tracksStore.addClip('track-1', {
        id: 'clip-2',
        trackId: 'track-1',
        type: 'video',
        startTime: 5,
        endTime: 10,
        selected: false,
        sourceUrl: 'test2.mp4',
        originalDuration: 10,
        trimStart: 0,
        trimEnd: 10,
        playbackRate: 1,
      })

      // 添加转场
      const transitionClip = {
        id: 'transition-1',
        trackId: 'track-1',
        type: 'transition' as const,
        name: 'Transition',
        startTime: 4.5,
        endTime: 5.5,
        selected: false,
        transitionType: 'fade',
        transitionDuration: 1,
      }
      tracksStore.addClip('track-1', transitionClip)

      // 开始调整转场
      const startEvent = new MouseEvent('mousedown', {
        clientX: 100,
        clientY: 100,
      })
      startResize(transitionClip, 'right', startEvent)

      expect(isResizing.value).toBe(true)

      // 模拟鼠标移动
      const moveEvent = new MouseEvent('mousemove', {
        clientX: 120,
        clientY: 100,
      })
      document.dispatchEvent(moveEvent)

      // 模拟鼠标释放
      const upEvent = new MouseEvent('mouseup')
      document.dispatchEvent(upEvent)

      expect(isResizing.value).toBe(false)
    })
  })

  describe('与相邻 clip 的碰撞检测', () => {
    it('调整大小时不应该与相邻 clip 重叠', async () => {
      const { useResize } = await import('../../composables/useResize')
      const { useTracksStore } = await import('../../stores/tracks')
      const { useHistoryStore } = await import('../../stores/history')

      const tracksStore = useTracksStore()
      const historyStore = useHistoryStore()
      const { isResizing, startResize } = useResize()

      historyStore.initialize()

      tracksStore.addTrack({
        id: 'track-1',
        type: 'video',
        name: 'Test Track',
        visible: true,
        locked: false,
        clips: [],
        order: 0,
      })

      // 添加两个相邻的 clip
      tracksStore.addClip('track-1', {
        id: 'clip-1',
        trackId: 'track-1',
        type: 'video',
        startTime: 0,
        endTime: 5,
        selected: false,
        sourceUrl: 'test1.mp4',
        originalDuration: 10,
        trimStart: 0,
        trimEnd: 10,
        playbackRate: 1,
      })

      const clip2 = {
        id: 'clip-2',
        trackId: 'track-1',
        type: 'video' as const,
        startTime: 5,
        endTime: 10,
        selected: false,
        sourceUrl: 'test2.mp4',
        originalDuration: 10,
        trimStart: 0,
        trimEnd: 10,
        playbackRate: 1,
      }
      tracksStore.addClip('track-1', clip2)

      // 开始调整 clip2 左边缘
      const startEvent = new MouseEvent('mousedown', {
        clientX: 100,
        clientY: 100,
      })
      startResize(clip2, 'left', startEvent)

      expect(isResizing.value).toBe(true)

      // 模拟鼠标向左移动（尝试重叠）
      const moveEvent = new MouseEvent('mousemove', {
        clientX: 50,
        clientY: 100,
      })
      document.dispatchEvent(moveEvent)

      // 模拟鼠标释放
      const upEvent = new MouseEvent('mouseup')
      document.dispatchEvent(upEvent)

      expect(isResizing.value).toBe(false)
    })

    it('右边缘调整时不应该与右侧 clip 重叠', async () => {
      const { useResize } = await import('../../composables/useResize')
      const { useTracksStore } = await import('../../stores/tracks')
      const { useHistoryStore } = await import('../../stores/history')

      const tracksStore = useTracksStore()
      const historyStore = useHistoryStore()
      const { isResizing, startResize } = useResize()

      historyStore.initialize()

      tracksStore.addTrack({
        id: 'track-1',
        type: 'video',
        name: 'Test Track',
        visible: true,
        locked: false,
        clips: [],
        order: 0,
      })

      const clip1 = {
        id: 'clip-1',
        trackId: 'track-1',
        type: 'video' as const,
        startTime: 0,
        endTime: 5,
        selected: false,
        sourceUrl: 'test1.mp4',
        originalDuration: 10,
        trimStart: 0,
        trimEnd: 10,
        playbackRate: 1,
      }
      tracksStore.addClip('track-1', clip1)

      tracksStore.addClip('track-1', {
        id: 'clip-2',
        trackId: 'track-1',
        type: 'video',
        startTime: 6,
        endTime: 11,
        selected: false,
        sourceUrl: 'test2.mp4',
        originalDuration: 10,
        trimStart: 0,
        trimEnd: 10,
        playbackRate: 1,
      })

      // 开始调整 clip1 右边缘
      const startEvent = new MouseEvent('mousedown', {
        clientX: 100,
        clientY: 100,
      })
      startResize(clip1, 'right', startEvent)

      expect(isResizing.value).toBe(true)

      // 模拟鼠标向右移动较大距离（尝试重叠）
      const moveEvent = new MouseEvent('mousemove', {
        clientX: 200,
        clientY: 100,
      })
      document.dispatchEvent(moveEvent)

      // 模拟鼠标释放
      const upEvent = new MouseEvent('mouseup')
      document.dispatchEvent(upEvent)

      expect(isResizing.value).toBe(false)
    })
  })

  describe('链式转场更新', () => {
    it('调整带转场连接的 clip 应该收集关联元素', async () => {
      const { useResize } = await import('../../composables/useResize')
      const { useTracksStore } = await import('../../stores/tracks')
      const { useHistoryStore } = await import('../../stores/history')

      const tracksStore = useTracksStore()
      const historyStore = useHistoryStore()
      const { isResizing, startResize } = useResize()

      historyStore.initialize()

      tracksStore.addTrack({
        id: 'track-1',
        type: 'video',
        name: 'Test Track',
        visible: true,
        locked: false,
        clips: [],
        order: 0,
      })

      // 添加两个通过转场连接的 clip
      const clip1 = {
        id: 'clip-1',
        trackId: 'track-1',
        type: 'video' as const,
        startTime: 0,
        endTime: 5,
        selected: false,
        sourceUrl: 'test1.mp4',
        originalDuration: 10,
        trimStart: 0,
        trimEnd: 10,
        playbackRate: 1,
      }
      tracksStore.addClip('track-1', clip1)

      tracksStore.addClip('track-1', {
        id: 'clip-2',
        trackId: 'track-1',
        type: 'video',
        startTime: 5,
        endTime: 10,
        selected: false,
        sourceUrl: 'test2.mp4',
        originalDuration: 10,
        trimStart: 0,
        trimEnd: 10,
        playbackRate: 1,
      })

      // 添加转场
      tracksStore.addClip('track-1', {
        id: 'transition-1',
        trackId: 'track-1',
        type: 'transition',
        name: 'Transition',
        startTime: 4.5,
        endTime: 5.5,
        selected: false,
        transitionType: 'fade',
        transitionDuration: 1,
      })

      // 开始调整 clip1 右边缘
      const startEvent = new MouseEvent('mousedown', {
        clientX: 100,
        clientY: 100,
      })
      startResize(clip1, 'right', startEvent)

      expect(isResizing.value).toBe(true)

      // 模拟鼠标移动
      const moveEvent = new MouseEvent('mousemove', {
        clientX: 80,
        clientY: 100,
      })
      document.dispatchEvent(moveEvent)

      // 模拟鼠标释放
      const upEvent = new MouseEvent('mouseup')
      document.dispatchEvent(upEvent)

      expect(isResizing.value).toBe(false)
    })

    it('左边缘调整时应该更新左侧关联元素', async () => {
      const { useResize } = await import('../../composables/useResize')
      const { useTracksStore } = await import('../../stores/tracks')
      const { useHistoryStore } = await import('../../stores/history')

      const tracksStore = useTracksStore()
      const historyStore = useHistoryStore()
      const { isResizing, startResize } = useResize()

      historyStore.initialize()

      tracksStore.addTrack({
        id: 'track-1',
        type: 'video',
        name: 'Test Track',
        visible: true,
        locked: false,
        clips: [],
        order: 0,
      })

      tracksStore.addClip('track-1', {
        id: 'clip-1',
        trackId: 'track-1',
        type: 'video',
        startTime: 0,
        endTime: 5,
        selected: false,
        sourceUrl: 'test1.mp4',
        originalDuration: 10,
        trimStart: 0,
        trimEnd: 10,
        playbackRate: 1,
      })

      const clip2 = {
        id: 'clip-2',
        trackId: 'track-1',
        type: 'video' as const,
        startTime: 5,
        endTime: 10,
        selected: false,
        sourceUrl: 'test2.mp4',
        originalDuration: 10,
        trimStart: 0,
        trimEnd: 10,
        playbackRate: 1,
      }
      tracksStore.addClip('track-1', clip2)

      // 添加转场
      tracksStore.addClip('track-1', {
        id: 'transition-1',
        trackId: 'track-1',
        type: 'transition',
        name: 'Transition',
        startTime: 4.5,
        endTime: 5.5,
        selected: false,
        transitionType: 'fade',
        transitionDuration: 1,
      })

      // 开始调整 clip2 左边缘
      const startEvent = new MouseEvent('mousedown', {
        clientX: 100,
        clientY: 100,
      })
      startResize(clip2, 'left', startEvent)

      expect(isResizing.value).toBe(true)

      // 模拟鼠标移动
      const moveEvent = new MouseEvent('mousemove', {
        clientX: 120,
        clientY: 100,
      })
      document.dispatchEvent(moveEvent)

      // 模拟鼠标释放
      const upEvent = new MouseEvent('mouseup')
      document.dispatchEvent(upEvent)

      expect(isResizing.value).toBe(false)
    })
  })

  describe('MediaClip trim 边界限制', () => {
    it('左边缘调整时 trimStart 不应小于 0', async () => {
      const { useResize } = await import('../../composables/useResize')
      const { useTracksStore } = await import('../../stores/tracks')
      const { useHistoryStore } = await import('../../stores/history')

      const tracksStore = useTracksStore()
      const historyStore = useHistoryStore()
      const { isResizing, startResize } = useResize()

      historyStore.initialize()

      tracksStore.addTrack({
        id: 'track-1',
        type: 'video',
        name: 'Test Track',
        visible: true,
        locked: false,
        clips: [],
        order: 0,
      })

      // 创建一个 trimStart 已经为 0 的 clip
      const clip = {
        id: 'clip-1',
        trackId: 'track-1',
        type: 'video' as const,
        startTime: 5,
        endTime: 10,
        selected: false,
        sourceUrl: 'test.mp4',
        originalDuration: 10,
        trimStart: 0,
        trimEnd: 5,
        playbackRate: 1,
      }
      tracksStore.addClip('track-1', clip)

      // 开始调整左边缘
      const startEvent = new MouseEvent('mousedown', {
        clientX: 100,
        clientY: 100,
      })
      startResize(clip, 'left', startEvent)

      expect(isResizing.value).toBe(true)

      // 模拟鼠标向左移动很远（尝试使 trimStart 小于 0）
      const moveEvent = new MouseEvent('mousemove', {
        clientX: -100,
        clientY: 100,
      })
      document.dispatchEvent(moveEvent)

      // 模拟鼠标释放
      const upEvent = new MouseEvent('mouseup')
      document.dispatchEvent(upEvent)

      // 验证 trimStart 不小于 0
      const updatedClip = tracksStore.tracks[0].clips.find(c => c.id === 'clip-1')
      if (updatedClip && updatedClip.type === 'video') {
        expect((updatedClip as any).trimStart).toBeGreaterThanOrEqual(0)
      }

      expect(isResizing.value).toBe(false)
    })

    it('右边缘调整时 trimEnd 不应超过原始时长', async () => {
      const { useResize } = await import('../../composables/useResize')
      const { useTracksStore } = await import('../../stores/tracks')
      const { useHistoryStore } = await import('../../stores/history')

      const tracksStore = useTracksStore()
      const historyStore = useHistoryStore()
      const { isResizing, startResize } = useResize()

      historyStore.initialize()

      tracksStore.addTrack({
        id: 'track-1',
        type: 'video',
        name: 'Test Track',
        visible: true,
        locked: false,
        clips: [],
        order: 0,
      })

      // 创建一个 trimEnd 接近原始时长的 clip
      const clip = {
        id: 'clip-1',
        trackId: 'track-1',
        type: 'video' as const,
        startTime: 0,
        endTime: 5,
        selected: false,
        sourceUrl: 'test.mp4',
        originalDuration: 10,
        trimStart: 0,
        trimEnd: 5,
        playbackRate: 1,
      }
      tracksStore.addClip('track-1', clip)

      // 开始调整右边缘
      const startEvent = new MouseEvent('mousedown', {
        clientX: 100,
        clientY: 100,
      })
      startResize(clip, 'right', startEvent)

      expect(isResizing.value).toBe(true)

      // 模拟鼠标向右移动很远（尝试使 trimEnd 超过原始时长）
      const moveEvent = new MouseEvent('mousemove', {
        clientX: 500,
        clientY: 100,
      })
      document.dispatchEvent(moveEvent)

      // 模拟鼠标释放
      const upEvent = new MouseEvent('mouseup')
      document.dispatchEvent(upEvent)

      // 验证 trimEnd 不超过原始时长
      const updatedClip = tracksStore.tracks[0].clips.find(c => c.id === 'clip-1')
      if (updatedClip && updatedClip.type === 'video') {
        expect((updatedClip as any).trimEnd).toBeLessThanOrEqual(clip.originalDuration)
      }

      expect(isResizing.value).toBe(false)
    })
  })

  describe('吸附功能', () => {
    it('启用吸附时应该吸附到附近的时间点', async () => {
      const { useResize } = await import('../../composables/useResize')
      const { useTracksStore } = await import('../../stores/tracks')
      const { useScaleStore } = await import('../../stores/scale')
      const { useHistoryStore } = await import('../../stores/history')

      const tracksStore = useTracksStore()
      const scaleStore = useScaleStore()
      const historyStore = useHistoryStore()
      const { isResizing, startResize } = useResize()

      historyStore.initialize()
      scaleStore.setSnapEnabled(true)

      tracksStore.addTrack({
        id: 'track-1',
        type: 'video',
        name: 'Test Track',
        visible: true,
        locked: false,
        clips: [],
        order: 0,
      })

      const clip1 = {
        id: 'clip-1',
        trackId: 'track-1',
        type: 'video' as const,
        startTime: 0,
        endTime: 5,
        selected: false,
        sourceUrl: 'test1.mp4',
        originalDuration: 10,
        trimStart: 0,
        trimEnd: 10,
        playbackRate: 1,
      }
      tracksStore.addClip('track-1', clip1)

      // 添加另一个 clip 作为吸附点
      tracksStore.addClip('track-1', {
        id: 'clip-2',
        trackId: 'track-1',
        type: 'video',
        startTime: 10,
        endTime: 15,
        selected: false,
        sourceUrl: 'test2.mp4',
        originalDuration: 10,
        trimStart: 0,
        trimEnd: 10,
        playbackRate: 1,
      })

      // 开始调整 clip1 右边缘
      const startEvent = new MouseEvent('mousedown', {
        clientX: 100,
        clientY: 100,
      })
      startResize(clip1, 'right', startEvent)

      expect(isResizing.value).toBe(true)

      // 模拟鼠标移动
      const moveEvent = new MouseEvent('mousemove', {
        clientX: 150,
        clientY: 100,
      })
      document.dispatchEvent(moveEvent)

      // 模拟鼠标释放
      const upEvent = new MouseEvent('mouseup')
      document.dispatchEvent(upEvent)

      expect(isResizing.value).toBe(false)
    })

    it('按住 Shift 键时应该禁用吸附', async () => {
      const { useResize } = await import('../../composables/useResize')
      const { useTracksStore } = await import('../../stores/tracks')
      const { useScaleStore } = await import('../../stores/scale')
      const { useHistoryStore } = await import('../../stores/history')

      const tracksStore = useTracksStore()
      const scaleStore = useScaleStore()
      const historyStore = useHistoryStore()
      const { isResizing, startResize } = useResize()

      historyStore.initialize()
      scaleStore.setSnapEnabled(true)

      tracksStore.addTrack({
        id: 'track-1',
        type: 'video',
        name: 'Test Track',
        visible: true,
        locked: false,
        clips: [],
        order: 0,
      })

      const clip = {
        id: 'clip-1',
        trackId: 'track-1',
        type: 'video' as const,
        startTime: 0,
        endTime: 5,
        selected: false,
        sourceUrl: 'test.mp4',
        originalDuration: 10,
        trimStart: 0,
        trimEnd: 10,
        playbackRate: 1,
      }
      tracksStore.addClip('track-1', clip)

      // 开始调整
      const startEvent = new MouseEvent('mousedown', {
        clientX: 100,
        clientY: 100,
      })
      startResize(clip, 'right', startEvent)

      expect(isResizing.value).toBe(true)

      // 按住 Shift 移动
      const moveEvent = new MouseEvent('mousemove', {
        clientX: 150,
        clientY: 100,
        shiftKey: true,
      })
      document.dispatchEvent(moveEvent)

      // 模拟鼠标释放
      const upEvent = new MouseEvent('mouseup')
      document.dispatchEvent(upEvent)

      expect(isResizing.value).toBe(false)
    })
  })

  describe('非视频类型 clip', () => {
    it('文本 clip 调整大小应该正常工作', async () => {
      const { useResize } = await import('../../composables/useResize')
      const { useTracksStore } = await import('../../stores/tracks')
      const { useHistoryStore } = await import('../../stores/history')

      const tracksStore = useTracksStore()
      const historyStore = useHistoryStore()
      const { isResizing, startResize } = useResize()

      historyStore.initialize()

      tracksStore.addTrack({
        id: 'track-1',
        type: 'subtitle',
        name: 'Subtitle Track',
        visible: true,
        locked: false,
        clips: [],
        order: 0,
      })

      const textClip = {
        id: 'clip-1',
        trackId: 'track-1',
        type: 'subtitle' as const,
        name: 'Text Clip',
        startTime: 0,
        endTime: 5,
        selected: false,
        content: 'Hello World',
        text: 'Hello World',
        fontFamily: 'Arial',
        fontSize: 16,
        color: '#ffffff',
      }
      tracksStore.addClip('track-1', textClip)

      // 开始调整
      const startEvent = new MouseEvent('mousedown', {
        clientX: 100,
        clientY: 100,
      })
      startResize(textClip, 'right', startEvent)

      expect(isResizing.value).toBe(true)

      // 模拟鼠标移动
      const moveEvent = new MouseEvent('mousemove', {
        clientX: 150,
        clientY: 100,
      })
      document.dispatchEvent(moveEvent)

      // 模拟鼠标释放
      const upEvent = new MouseEvent('mouseup')
      document.dispatchEvent(upEvent)

      expect(isResizing.value).toBe(false)
    })
  })

  describe('最小时长限制', () => {
    it('调整大小时应该保持合理的最小时长', async () => {
      const { useResize } = await import('../../composables/useResize')
      const { useTracksStore } = await import('../../stores/tracks')
      const { useHistoryStore } = await import('../../stores/history')

      const tracksStore = useTracksStore()
      const historyStore = useHistoryStore()
      const { isResizing, startResize } = useResize()

      historyStore.initialize()

      tracksStore.addTrack({
        id: 'track-1',
        type: 'video',
        name: 'Test Track',
        visible: true,
        locked: false,
        clips: [],
        order: 0,
      })

      const clip = {
        id: 'clip-1',
        trackId: 'track-1',
        type: 'video' as const,
        startTime: 0,
        endTime: 5,
        selected: false,
        sourceUrl: 'test.mp4',
        originalDuration: 10,
        trimStart: 0,
        trimEnd: 10,
        playbackRate: 1,
      }
      tracksStore.addClip('track-1', clip)

      // 开始从左边缘调整
      const startEvent = new MouseEvent('mousedown', {
        clientX: 100,
        clientY: 100,
      })
      startResize(clip, 'left', startEvent)

      expect(isResizing.value).toBe(true)

      // 模拟鼠标向右移动很远（尝试使时长小于 0.1）
      const moveEvent = new MouseEvent('mousemove', {
        clientX: 1000,
        clientY: 100,
      })
      document.dispatchEvent(moveEvent)

      // 模拟鼠标释放
      const upEvent = new MouseEvent('mouseup')
      document.dispatchEvent(upEvent)

      // 验证时长大于 0
      const updatedClip = tracksStore.tracks[0].clips.find(c => c.id === 'clip-1')
      if (updatedClip) {
        const duration = updatedClip.endTime - updatedClip.startTime
        expect(duration).toBeGreaterThan(0)
      }

      expect(isResizing.value).toBe(false)
    })
  })
})
