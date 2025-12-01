import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTracksStore } from '../../stores/tracks'

describe('useSelection', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('应该正确导入', async () => {
    const { useSelection } = await import('../../composables/useSelection')
    expect(useSelection).toBeDefined()
    expect(typeof useSelection).toBe('function')
  })

  it('应该返回正确的属性和方法', async () => {
    const { useSelection } = await import('../../composables/useSelection')

    const result = useSelection()

    expect(result).toHaveProperty('handleClipClick')
  })

  describe('handleClipClick', () => {
    it('普通点击应该单选', async () => {
      const { useSelection } = await import('../../composables/useSelection')
      const tracksStore = useTracksStore()

      const { handleClipClick } = useSelection()

      // 添加测试 track 和 clip
      const track = {
        id: 'track-1',
        type: 'video' as const,
        name: 'Test',
        visible: true,
        locked: false,
        clips: [],
        order: 0,
      }
      tracksStore.addTrack(track)

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

      const event = new MouseEvent('click')
      handleClipClick(clip, event)

      expect(tracksStore.selectedClipIds.has('clip-1')).toBe(true)
    })

    it('Ctrl+点击应该切换选中状态', async () => {
      const { useSelection } = await import('../../composables/useSelection')
      const tracksStore = useTracksStore()

      const { handleClipClick } = useSelection()

      const track = {
        id: 'track-1',
        type: 'video' as const,
        name: 'Test',
        visible: true,
        locked: false,
        clips: [],
        order: 0,
      }
      tracksStore.addTrack(track)

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

      // 先选中
      tracksStore.selectClip('clip-1')
      expect(tracksStore.selectedClipIds.has('clip-1')).toBe(true)

      // Ctrl+点击取消选中
      const event = new MouseEvent('click', { ctrlKey: true })
      handleClipClick(clip, event)

      expect(tracksStore.selectedClipIds.has('clip-1')).toBe(false)
    })

    it('Meta+点击应该切换选中状态（Mac）', async () => {
      const { useSelection } = await import('../../composables/useSelection')
      const tracksStore = useTracksStore()

      const { handleClipClick } = useSelection()

      const track = {
        id: 'track-1',
        type: 'video' as const,
        name: 'Test',
        visible: true,
        locked: false,
        clips: [],
        order: 0,
      }
      tracksStore.addTrack(track)

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

      // 先选中
      tracksStore.selectClip('clip-1')
      expect(tracksStore.selectedClipIds.has('clip-1')).toBe(true)

      // Meta+点击取消选中
      const event = new MouseEvent('click', { metaKey: true })
      handleClipClick(clip, event)

      expect(tracksStore.selectedClipIds.has('clip-1')).toBe(false)
    })
  })

  describe('handleRangeSelection', () => {
    it('Shift+点击应该进行范围选择', async () => {
      const { useSelection } = await import('../../composables/useSelection')
      const tracksStore = useTracksStore()

      const { handleClipClick } = useSelection()

      const track = {
        id: 'track-1',
        type: 'video' as const,
        name: 'Test',
        visible: true,
        locked: false,
        clips: [],
        order: 0,
      }
      tracksStore.addTrack(track)

      const clip1 = {
        id: 'clip-1',
        trackId: 'track-1',
        type: 'video' as const,
        name: 'Test Clip 1',
        startTime: 0,
        endTime: 5,
        selected: false,
        sourceUrl: 'test1.mp4',
        originalDuration: 10,
        trimStart: 0,
        trimEnd: 10,
        playbackRate: 1,
      }
      const clip2 = {
        id: 'clip-2',
        trackId: 'track-1',
        type: 'video' as const,
        name: 'Test Clip 2',
        startTime: 5,
        endTime: 10,
        selected: false,
        sourceUrl: 'test2.mp4',
        originalDuration: 10,
        trimStart: 0,
        trimEnd: 10,
        playbackRate: 1,
      }
      const clip3 = {
        id: 'clip-3',
        trackId: 'track-1',
        type: 'video' as const,
        name: 'Test Clip 3',
        startTime: 10,
        endTime: 15,
        selected: false,
        sourceUrl: 'test3.mp4',
        originalDuration: 10,
        trimStart: 0,
        trimEnd: 10,
        playbackRate: 1,
      }
      tracksStore.addClip('track-1', clip1)
      tracksStore.addClip('track-1', clip2)
      tracksStore.addClip('track-1', clip3)

      // 先选中第一个
      tracksStore.selectClip('clip-1')

      // Shift+点击第三个，应该选中 1-3
      const event = new MouseEvent('click', { shiftKey: true })
      handleClipClick(clip3, event)

      expect(tracksStore.selectedClipIds.has('clip-1')).toBe(true)
      expect(tracksStore.selectedClipIds.has('clip-2')).toBe(true)
      expect(tracksStore.selectedClipIds.has('clip-3')).toBe(true)
    })

    it('没有已选中 clip 时 Shift+点击应该单选', async () => {
      const { useSelection } = await import('../../composables/useSelection')
      const tracksStore = useTracksStore()

      const { handleClipClick } = useSelection()

      const track = {
        id: 'track-1',
        type: 'video' as const,
        name: 'Test',
        visible: true,
        locked: false,
        clips: [],
        order: 0,
      }
      tracksStore.addTrack(track)

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

      // Shift+点击，没有已选中的
      const event = new MouseEvent('click', { shiftKey: true })
      handleClipClick(clip, event)

      expect(tracksStore.selectedClipIds.has('clip-1')).toBe(true)
    })

    it('范围选择起止位置相反时应该正确选中', async () => {
      const { useSelection } = await import('../../composables/useSelection')
      const tracksStore = useTracksStore()

      const { handleClipClick } = useSelection()

      const track = {
        id: 'track-1',
        type: 'video' as const,
        name: 'Test',
        visible: true,
        locked: false,
        clips: [],
        order: 0,
      }
      tracksStore.addTrack(track)

      const clip1 = {
        id: 'clip-1',
        trackId: 'track-1',
        type: 'video' as const,
        name: 'Test Clip 1',
        startTime: 0,
        endTime: 5,
        selected: false,
        sourceUrl: 'test1.mp4',
        originalDuration: 10,
        trimStart: 0,
        trimEnd: 10,
        playbackRate: 1,
      }
      const clip2 = {
        id: 'clip-2',
        trackId: 'track-1',
        type: 'video' as const,
        name: 'Test Clip 2',
        startTime: 5,
        endTime: 10,
        selected: false,
        sourceUrl: 'test2.mp4',
        originalDuration: 10,
        trimStart: 0,
        trimEnd: 10,
        playbackRate: 1,
      }
      const clip3 = {
        id: 'clip-3',
        trackId: 'track-1',
        type: 'video' as const,
        name: 'Test Clip 3',
        startTime: 10,
        endTime: 15,
        selected: false,
        sourceUrl: 'test3.mp4',
        originalDuration: 10,
        trimStart: 0,
        trimEnd: 10,
        playbackRate: 1,
      }
      tracksStore.addClip('track-1', clip1)
      tracksStore.addClip('track-1', clip2)
      tracksStore.addClip('track-1', clip3)

      // 先选中第三个
      tracksStore.selectClip('clip-3')

      // Shift+点击第一个（反向），应该选中 1-3
      const event = new MouseEvent('click', { shiftKey: true })
      handleClipClick(clip1, event)

      expect(tracksStore.selectedClipIds.has('clip-1')).toBe(true)
      expect(tracksStore.selectedClipIds.has('clip-2')).toBe(true)
      expect(tracksStore.selectedClipIds.has('clip-3')).toBe(true)
    })

    it('范围选择不在同一轨道时不会选中新的 clip', async () => {
      const { useSelection } = await import('../../composables/useSelection')
      const tracksStore = useTracksStore()

      const { handleClipClick } = useSelection()

      const track1 = {
        id: 'track-1',
        type: 'video' as const,
        name: 'Test 1',
        visible: true,
        locked: false,
        clips: [],
        order: 0,
      }
      const track2 = {
        id: 'track-2',
        type: 'video' as const,
        name: 'Test 2',
        visible: true,
        locked: false,
        clips: [],
        order: 1,
      }
      tracksStore.addTrack(track1)
      tracksStore.addTrack(track2)

      const clip1 = {
        id: 'clip-1',
        trackId: 'track-1',
        type: 'video' as const,
        name: 'Test Clip 1',
        startTime: 0,
        endTime: 5,
        selected: false,
        sourceUrl: 'test1.mp4',
        originalDuration: 10,
        trimStart: 0,
        trimEnd: 10,
        playbackRate: 1,
      }
      const clip2 = {
        id: 'clip-2',
        trackId: 'track-2',
        type: 'video' as const,
        name: 'Test Clip 2',
        startTime: 0,
        endTime: 5,
        selected: false,
        sourceUrl: 'test2.mp4',
        originalDuration: 10,
        trimStart: 0,
        trimEnd: 10,
        playbackRate: 1,
      }
      tracksStore.addClip('track-1', clip1)
      tracksStore.addClip('track-2', clip2)

      // 先选中第一个轨道的 clip
      tracksStore.selectClip('clip-1')

      // Shift+点击第二个轨道的 clip（不在同一轨道）
      const event = new MouseEvent('click', { shiftKey: true })
      handleClipClick(clip2, event)

      // 由于跨轨道范围选择不支持，clip-1 仍然被选中，clip-2 不会被选中
      expect(tracksStore.selectedClipIds.has('clip-1')).toBe(true)
      expect(tracksStore.selectedClipIds.has('clip-2')).toBe(false)
    })
  })
})
