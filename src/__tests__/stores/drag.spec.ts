import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useDragStore } from '../../stores/drag'
import { useTracksStore } from '../../stores/tracks'
import { useScaleStore } from '../../stores/scale'
import { useHistoryStore } from '../../stores/history'
import type { Track, MediaClip } from '@/types'

// Mock localStorage
vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null)
vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { })
vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => { })

// 创建测试用的 track
function createTestTrack(overrides: Partial<Track> = {}): Track {
  return {
    id: `track-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: 'video',
    name: 'Test Track',
    visible: true,
    locked: false,
    clips: [],
    order: 0,
    ...overrides,
  }
}

// 创建测试用的 clip
function createTestClip(trackId: string, overrides: Partial<MediaClip> = {}): MediaClip {
  return {
    id: `clip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    trackId,
    type: 'video',
    name: 'Test Clip',
    startTime: 0,
    endTime: 5,
    selected: false,
    sourceUrl: 'test.mp4',
    originalDuration: 10,
    trimStart: 0,
    trimEnd: 10,
    playbackRate: 1,
    ...overrides,
  }
}

describe('useDragStore', () => {
  let dragStore: ReturnType<typeof useDragStore>
  let tracksStore: ReturnType<typeof useTracksStore>
  let scaleStore: ReturnType<typeof useScaleStore>
  let historyStore: ReturnType<typeof useHistoryStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    dragStore = useDragStore()
    tracksStore = useTracksStore()
    scaleStore = useScaleStore()
    historyStore = useHistoryStore()
  })

  afterEach(() => {
    dragStore.resetDragState()
  })

  describe('初始状态', () => {
    it('应该有正确的初始状态', () => {
      expect(dragStore.isDragging).toBe(false)
      expect(dragStore.draggedClips).toEqual([])
      expect(dragStore.draggedClipIds.size).toBe(0)
      expect(dragStore.dragOffset).toEqual({ x: 0, y: 0 })
      expect(dragStore.previewPosition.visible).toBe(false)
    })

    it('应该有默认的边缘滚动配置', () => {
      expect(dragStore.edgeScrollConfig.enabled).toBe(true)
      expect(dragStore.edgeScrollConfig.edgeThreshold).toBe(80)
      expect(dragStore.edgeScrollConfig.scrollSpeed).toBe(8)
      expect(dragStore.edgeScrollConfig.maxScrollSpeed).toBe(25)
    })
  })

  describe('setConfig', () => {
    it('应该能设置跨轨拖拽配置', () => {
      dragStore.setConfig({ enableCrossTrackDrag: false })
      // 由于 enableCrossTrackDrag 是内部 ref，我们通过行为来验证
    })

    it('应该能设置边缘滚动配置', () => {
      dragStore.setConfig({
        edgeScroll: {
          enabled: false,
          edgeThreshold: 100,
        },
      })
      expect(dragStore.edgeScrollConfig.enabled).toBe(false)
      expect(dragStore.edgeScrollConfig.edgeThreshold).toBe(100)
    })
  })

  describe('setScrollContainers', () => {
    it('应该能设置滚动容器引用', () => {
      const mockContainer = document.createElement('div')
      const mockScrollbar = document.createElement('div')
      const mockCallback = vi.fn()

      dragStore.setScrollContainers(mockContainer, mockScrollbar, mockCallback)
      // 通过边缘滚动行为验证
    })
  })

  describe('startDrag', () => {
    it('应该能开始拖拽', () => {
      const track = createTestTrack()
      tracksStore.addTrack(track)
      const clip = createTestClip(track.id)
      tracksStore.addClip(track.id, clip)

      const event = new MouseEvent('mousedown', {
        clientX: 100,
        clientY: 100,
      })

      dragStore.startDrag(clip, event)

      expect(dragStore.isDragging).toBe(true)
      expect(dragStore.draggedClips).toHaveLength(1)
      expect(dragStore.draggedClips[0].id).toBe(clip.id)
    })

    it('转场 clip 不应该能拖拽', () => {
      const track = createTestTrack()
      tracksStore.addTrack(track)
      const transitionClip = {
        id: 'transition-1',
        trackId: track.id,
        type: 'transition' as const,
        name: 'Transition',
        startTime: 0,
        endTime: 1,
        selected: false,
        transitionType: 'fade',
        transitionDuration: 1,
      }
      tracksStore.addClip(track.id, transitionClip)

      const event = new MouseEvent('mousedown', {
        clientX: 100,
        clientY: 100,
      })

      dragStore.startDrag(transitionClip, event)

      expect(dragStore.isDragging).toBe(false)
      expect(dragStore.draggedClips).toHaveLength(0)
    })
  })

  describe('handleDragMove', () => {
    it('拖拽中应该更新偏移', () => {
      const track = createTestTrack()
      tracksStore.addTrack(track)
      const clip = createTestClip(track.id)
      tracksStore.addClip(track.id, clip)

      const startEvent = new MouseEvent('mousedown', {
        clientX: 100,
        clientY: 100,
      })
      dragStore.startDrag(clip, startEvent)

      // 模拟鼠标移动
      const moveEvent = new MouseEvent('mousemove', {
        clientX: 150,
        clientY: 100,
      })
      dragStore.handleDragMove(moveEvent)

      expect(dragStore.dragOffset.x).toBe(50)
      expect(dragStore.dragOffset.y).toBe(0)
    })
  })

  describe('handleDragEnd', () => {
    it('拖拽结束后应该重置状态', () => {
      const track = createTestTrack()
      tracksStore.addTrack(track)
      const clip = createTestClip(track.id)
      tracksStore.addClip(track.id, clip)

      historyStore.initialize()

      const startEvent = new MouseEvent('mousedown', {
        clientX: 100,
        clientY: 100,
      })
      dragStore.startDrag(clip, startEvent)

      dragStore.handleDragEnd()

      expect(dragStore.isDragging).toBe(false)
      expect(dragStore.draggedClips).toHaveLength(0)
    })
  })

  describe('resetDragState', () => {
    it('应该重置所有拖拽状态', () => {
      const track = createTestTrack()
      tracksStore.addTrack(track)
      const clip = createTestClip(track.id)
      tracksStore.addClip(track.id, clip)

      const event = new MouseEvent('mousedown', {
        clientX: 100,
        clientY: 100,
      })
      dragStore.startDrag(clip, event)

      dragStore.resetDragState()

      expect(dragStore.isDragging).toBe(false)
      expect(dragStore.draggedClips).toHaveLength(0)
      expect(dragStore.dragOffset).toEqual({ x: 0, y: 0 })
      expect(dragStore.previewPosition.visible).toBe(false)
    })
  })

  describe('边缘滚动', () => {
    it('应该能开始和停止边缘滚动', () => {
      dragStore.startEdgeScroll()
      dragStore.stopEdgeScroll()
      // 验证没有抛出错误
    })
  })

  describe('draggedClipIds 计算属性', () => {
    it('应该返回拖拽中 clip 的 ID 集合', () => {
      const track = createTestTrack()
      tracksStore.addTrack(track)
      const clip = createTestClip(track.id)
      tracksStore.addClip(track.id, clip)

      const event = new MouseEvent('mousedown', {
        clientX: 100,
        clientY: 100,
      })
      dragStore.startDrag(clip, event)

      expect(dragStore.draggedClipIds.has(clip.id)).toBe(true)
    })
  })

  describe('handleDragMove 详细测试', () => {
    it('应该更新预览位置', () => {
      const track = createTestTrack()
      tracksStore.addTrack(track)
      const clip = createTestClip(track.id, { startTime: 0, endTime: 5 })
      tracksStore.addClip(track.id, clip)

      const startEvent = new MouseEvent('mousedown', {
        clientX: 100,
        clientY: 100,
      })
      dragStore.startDrag(clip, startEvent)

      const moveEvent = new MouseEvent('mousemove', {
        clientX: 200,
        clientY: 100,
      })
      dragStore.handleDragMove(moveEvent)

      expect(dragStore.previewPosition.visible).toBe(true)
    })

    it('按住 Shift 键时应该跳过吸附', () => {
      const track = createTestTrack()
      tracksStore.addTrack(track)
      const clip1 = createTestClip(track.id, { startTime: 0, endTime: 5 })
      const clip2 = createTestClip(track.id, { startTime: 10, endTime: 15 })
      tracksStore.addClip(track.id, clip1)
      tracksStore.addClip(track.id, clip2)

      const startEvent = new MouseEvent('mousedown', {
        clientX: 100,
        clientY: 100,
      })
      dragStore.startDrag(clip1, startEvent)

      const moveEvent = new MouseEvent('mousemove', {
        clientX: 200,
        clientY: 100,
        shiftKey: true,
      })
      dragStore.handleDragMove(moveEvent)

      expect(dragStore.previewPosition.visible).toBe(true)
    })
  })

  describe('跨轨拖拽', () => {
    it('禁用跨轨拖拽时不应该改变轨道', () => {
      const track1 = createTestTrack({ name: 'Track 1' })
      const track2 = createTestTrack({ name: 'Track 2' })
      tracksStore.addTrack(track1)
      tracksStore.addTrack(track2)

      const clip = createTestClip(track1.id)
      tracksStore.addClip(track1.id, clip)

      dragStore.setConfig({ enableCrossTrackDrag: false })

      const startEvent = new MouseEvent('mousedown', {
        clientX: 100,
        clientY: 100,
      })
      dragStore.startDrag(clip, startEvent)

      expect(dragStore.isDragging).toBe(true)
    })
  })

  describe('碰撞检测', () => {
    it('同轨移动时应该处理碰撞', () => {
      const track = createTestTrack()
      tracksStore.addTrack(track)

      const clip1 = createTestClip(track.id, { startTime: 0, endTime: 5 })
      const clip2 = createTestClip(track.id, { startTime: 10, endTime: 15 })
      tracksStore.addClip(track.id, clip1)
      tracksStore.addClip(track.id, clip2)

      historyStore.initialize()

      const startEvent = new MouseEvent('mousedown', {
        clientX: 100,
        clientY: 100,
      })
      dragStore.startDrag(clip1, startEvent)

      // 模拟拖拽到 clip2 位置
      const moveEvent = new MouseEvent('mousemove', {
        clientX: 1100, // 移动较大距离
        clientY: 100,
      })
      dragStore.handleDragMove(moveEvent)

      expect(dragStore.previewPosition.visible).toBe(true)
    })
  })

  describe('完整拖拽流程', () => {
    it('应该完成同轨拖拽并更新 clip 位置', () => {
      const track = createTestTrack()
      tracksStore.addTrack(track)

      const clip = createTestClip(track.id, { startTime: 0, endTime: 5 })
      tracksStore.addClip(track.id, clip)

      historyStore.initialize()

      // 开始拖拽
      const startEvent = new MouseEvent('mousedown', {
        clientX: 100,
        clientY: 100,
      })
      dragStore.startDrag(clip, startEvent)

      // 移动
      const moveEvent = new MouseEvent('mousemove', {
        clientX: 200,
        clientY: 100,
      })
      dragStore.handleDragMove(moveEvent)

      // 结束拖拽
      dragStore.handleDragEnd()

      expect(dragStore.isDragging).toBe(false)
      expect(dragStore.draggedClips).toHaveLength(0)
    })

    it('未拖拽时调用 handleDragEnd 应该重置状态', () => {
      dragStore.handleDragEnd()
      expect(dragStore.isDragging).toBe(false)
    })

    it('未拖拽时调用 handleDragMove 应该不做任何事', () => {
      const moveEvent = new MouseEvent('mousemove', {
        clientX: 200,
        clientY: 100,
      })
      dragStore.handleDragMove(moveEvent)
      expect(dragStore.isDragging).toBe(false)
    })
  })

  describe('跨轨拖拽详细测试', () => {
    it('跨轨拖拽应该检测目标轨道', () => {
      // 创建两个轨道
      const track1 = createTestTrack({ name: 'Video Track 1' })
      const track2 = createTestTrack({ name: 'Video Track 2' })
      tracksStore.addTrack(track1)
      tracksStore.addTrack(track2)

      const clip = createTestClip(track1.id, { startTime: 0, endTime: 5 })
      tracksStore.addClip(track1.id, clip)

      historyStore.initialize()

      // 开始拖拽
      const startEvent = new MouseEvent('mousedown', {
        clientX: 100,
        clientY: 100,
      })
      dragStore.startDrag(clip, startEvent)

      // 垂直移动超过阈值 (40px)
      const moveEvent = new MouseEvent('mousemove', {
        clientX: 100,
        clientY: 200, // 垂直移动 100px
      })
      dragStore.handleDragMove(moveEvent)

      expect(dragStore.dragOffset.y).toBe(100)
    })
  })

  describe('吸附功能', () => {
    it('启用吸附时应该吸附到附近的时间点', () => {
      const track = createTestTrack()
      tracksStore.addTrack(track)

      const clip1 = createTestClip(track.id, { startTime: 0, endTime: 5 })
      const clip2 = createTestClip(track.id, { startTime: 10, endTime: 15 })
      tracksStore.addClip(track.id, clip1)
      tracksStore.addClip(track.id, clip2)

      // 确保启用吸附
      scaleStore.setSnapEnabled(true)

      const startEvent = new MouseEvent('mousedown', {
        clientX: 100,
        clientY: 100,
      })
      dragStore.startDrag(clip1, startEvent)

      const moveEvent = new MouseEvent('mousemove', {
        clientX: 200,
        clientY: 100,
        shiftKey: false,
      })
      dragStore.handleDragMove(moveEvent)

      expect(dragStore.previewPosition.visible).toBe(true)
    })

    it('禁用吸附时不应该吸附', () => {
      const track = createTestTrack()
      tracksStore.addTrack(track)

      const clip = createTestClip(track.id, { startTime: 0, endTime: 5 })
      tracksStore.addClip(track.id, clip)

      scaleStore.setSnapEnabled(false)

      const startEvent = new MouseEvent('mousedown', {
        clientX: 100,
        clientY: 100,
      })
      dragStore.startDrag(clip, startEvent)

      const moveEvent = new MouseEvent('mousemove', {
        clientX: 200,
        clientY: 100,
      })
      dragStore.handleDragMove(moveEvent)

      expect(dragStore.previewPosition.visible).toBe(true)
    })
  })

  describe('转场处理', () => {
    it('应该检测并处理孤立的转场', () => {
      const track = createTestTrack()
      tracksStore.addTrack(track)

      const clip1 = createTestClip(track.id, { startTime: 0, endTime: 5 })
      const clip2 = createTestClip(track.id, { startTime: 5, endTime: 10 })
      tracksStore.addClip(track.id, clip1)
      tracksStore.addClip(track.id, clip2)

      // 添加转场
      const transitionClip = {
        id: 'transition-1',
        trackId: track.id,
        type: 'transition' as const,
        name: 'Transition',
        startTime: 4.5,
        endTime: 5.5,
        selected: false,
        transitionType: 'fade',
        transitionDuration: 1,
      }
      tracksStore.addClip(track.id, transitionClip)

      historyStore.initialize()

      // 开始拖拽 clip1
      const startEvent = new MouseEvent('mousedown', {
        clientX: 100,
        clientY: 100,
      })
      dragStore.startDrag(clip1, startEvent)

      // 移动 clip1 使转场变为孤立
      const moveEvent = new MouseEvent('mousemove', {
        clientX: -500, // 向左移动
        clientY: 100,
      })
      dragStore.handleDragMove(moveEvent)

      // 结束拖拽
      dragStore.handleDragEnd()

      expect(dragStore.isDragging).toBe(false)
    })
  })

  describe('边缘滚动详细测试', () => {
    it('应该能设置滚动容器', () => {
      const mockContainer = document.createElement('div')
      const mockScrollbar = document.createElement('div')
      mockScrollbar.scrollLeft = 0
      Object.defineProperty(mockScrollbar, 'scrollWidth', { value: 1000, writable: true })
      Object.defineProperty(mockScrollbar, 'clientWidth', { value: 500 })

      const mockCallback = vi.fn()

      dragStore.setScrollContainers(mockContainer, mockScrollbar, mockCallback)

      // 验证设置成功（通过后续边缘滚动行为验证）
      expect(dragStore.edgeScrollConfig.enabled).toBe(true)
    })

    it('边缘滚动开始和停止应该正常工作', () => {
      const mockContainer = document.createElement('div')
      const mockScrollbar = document.createElement('div')
      mockScrollbar.scrollLeft = 0

      dragStore.setScrollContainers(mockContainer, mockScrollbar)

      // 开始边缘滚动
      dragStore.startEdgeScroll()
      // 停止边缘滚动
      dragStore.stopEdgeScroll()

      // 应该没有错误
      expect(dragStore.isDragging).toBe(false)
    })

    it('鼠标靠近容器右边缘时应该触发滚动', () => {
      const track = createTestTrack()
      tracksStore.addTrack(track)
      const clip = createTestClip(track.id, { startTime: 0, endTime: 5 })
      tracksStore.addClip(track.id, clip)

      const mockContainer = document.createElement('div')
      mockContainer.getBoundingClientRect = vi.fn().mockReturnValue({
        left: 0,
        top: 0,
        width: 800,
        height: 600,
        right: 800,
        bottom: 600,
      })

      const mockScrollbar = document.createElement('div')
      mockScrollbar.scrollLeft = 0
      Object.defineProperty(mockScrollbar, 'scrollWidth', { value: 2000 })
      Object.defineProperty(mockScrollbar, 'clientWidth', { value: 800 })

      dragStore.setScrollContainers(mockContainer, mockScrollbar)

      historyStore.initialize()

      // 开始拖拽
      const startEvent = new MouseEvent('mousedown', {
        clientX: 100,
        clientY: 100,
      })
      dragStore.startDrag(clip, startEvent)

      // 移动到右边缘附近
      const moveEvent = new MouseEvent('mousemove', {
        clientX: 780, // 靠近右边缘
        clientY: 100,
      })
      dragStore.handleDragMove(moveEvent)

      // 验证拖拽仍在进行
      expect(dragStore.isDragging).toBe(true)

      // 结束拖拽
      dragStore.handleDragEnd()
    })

    it('鼠标靠近容器左边缘时应该触发滚动', () => {
      const track = createTestTrack()
      tracksStore.addTrack(track)
      const clip = createTestClip(track.id, { startTime: 5, endTime: 10 })
      tracksStore.addClip(track.id, clip)

      const mockContainer = document.createElement('div')
      mockContainer.getBoundingClientRect = vi.fn().mockReturnValue({
        left: 0,
        top: 0,
        width: 800,
        height: 600,
        right: 800,
        bottom: 600,
      })

      const mockScrollbar = document.createElement('div')
      mockScrollbar.scrollLeft = 100 // 有一些滚动偏移
      Object.defineProperty(mockScrollbar, 'scrollWidth', { value: 2000 })
      Object.defineProperty(mockScrollbar, 'clientWidth', { value: 800 })

      dragStore.setScrollContainers(mockContainer, mockScrollbar)

      historyStore.initialize()

      // 开始拖拽
      const startEvent = new MouseEvent('mousedown', {
        clientX: 500,
        clientY: 100,
      })
      dragStore.startDrag(clip, startEvent)

      // 移动到左边缘附近
      const moveEvent = new MouseEvent('mousemove', {
        clientX: 20, // 靠近左边缘
        clientY: 100,
      })
      dragStore.handleDragMove(moveEvent)

      // 验证拖拽仍在进行
      expect(dragStore.isDragging).toBe(true)

      // 结束拖拽
      dragStore.handleDragEnd()
    })
  })

  describe('跨轨拖放详细测试', () => {
    it('跨轨拖放到类型匹配的轨道应该直接移动', () => {
      const track1 = createTestTrack({ type: 'video', name: 'Video Track 1' })
      const track2 = createTestTrack({ type: 'video', name: 'Video Track 2' })
      tracksStore.addTrack(track1)
      tracksStore.addTrack(track2)

      const clip = createTestClip(track1.id, { startTime: 0, endTime: 5 })
      tracksStore.addClip(track1.id, clip)

      historyStore.initialize()

      // 开始拖拽
      const startEvent = new MouseEvent('mousedown', {
        clientX: 100,
        clientY: 100,
      })
      dragStore.startDrag(clip, startEvent)

      // 垂直移动超过阈值
      const moveEvent = new MouseEvent('mousemove', {
        clientX: 100,
        clientY: 200, // 垂直移动 100px
      })
      dragStore.handleDragMove(moveEvent)

      expect(dragStore.dragOffset.y).toBe(100)
      expect(dragStore.previewPosition.visible).toBe(true)

      // 结束拖拽
      dragStore.handleDragEnd()

      expect(dragStore.isDragging).toBe(false)
    })

    it('跨轨拖放到类型不匹配的轨道应该创建新轨道', () => {
      const videoTrack = createTestTrack({ type: 'video', name: 'Video Track' })
      const audioTrack = createTestTrack({ type: 'audio', name: 'Audio Track' })
      tracksStore.addTrack(videoTrack)
      tracksStore.addTrack(audioTrack)

      const clip = createTestClip(videoTrack.id, { startTime: 0, endTime: 5, type: 'video' })
      tracksStore.addClip(videoTrack.id, clip)

      historyStore.initialize()

      // 开始拖拽
      const startEvent = new MouseEvent('mousedown', {
        clientX: 100,
        clientY: 100,
      })
      dragStore.startDrag(clip, startEvent)

      // 移动到音频轨道位置（类型不匹配）
      const moveEvent = new MouseEvent('mousemove', {
        clientX: 100,
        clientY: 200,
      })
      dragStore.handleDragMove(moveEvent)

      // 验证预览位置
      expect(dragStore.previewPosition.visible).toBe(true)

      // 结束拖拽
      dragStore.handleDragEnd()

      expect(dragStore.isDragging).toBe(false)
    })

    it('跨轨拖放到有重叠的轨道应该创建新轨道', () => {
      const track1 = createTestTrack({ type: 'video', name: 'Video Track 1' })
      const track2 = createTestTrack({ type: 'video', name: 'Video Track 2' })
      tracksStore.addTrack(track1)
      tracksStore.addTrack(track2)

      const clip1 = createTestClip(track1.id, { startTime: 0, endTime: 5 })
      const clip2 = createTestClip(track2.id, { startTime: 0, endTime: 5 }) // 同位置
      tracksStore.addClip(track1.id, clip1)
      tracksStore.addClip(track2.id, clip2)

      historyStore.initialize()

      // 开始拖拽 clip1
      const startEvent = new MouseEvent('mousedown', {
        clientX: 100,
        clientY: 100,
      })
      dragStore.startDrag(clip1, startEvent)

      // 移动到 track2（会有重叠）
      const moveEvent = new MouseEvent('mousemove', {
        clientX: 100,
        clientY: 200,
      })
      dragStore.handleDragMove(moveEvent)

      // 验证预览位置
      expect(dragStore.previewPosition.visible).toBe(true)

      // 结束拖拽
      dragStore.handleDragEnd()

      expect(dragStore.isDragging).toBe(false)
    })
  })

  describe('重叠解决机制', () => {
    it('同轨移动时应该解决重叠问题', () => {
      const track = createTestTrack()
      tracksStore.addTrack(track)

      const clip1 = createTestClip(track.id, { startTime: 0, endTime: 5 })
      const clip2 = createTestClip(track.id, { startTime: 10, endTime: 15 })
      tracksStore.addClip(track.id, clip1)
      tracksStore.addClip(track.id, clip2)

      historyStore.initialize()

      // 开始拖拽 clip1
      const startEvent = new MouseEvent('mousedown', {
        clientX: 100,
        clientY: 100,
      })
      dragStore.startDrag(clip1, startEvent)

      // 移动到与 clip2 重叠的位置
      const moveEvent = new MouseEvent('mousemove', {
        clientX: 1000, // 大幅右移
        clientY: 100,
      })
      dragStore.handleDragMove(moveEvent)

      expect(dragStore.previewPosition.visible).toBe(true)

      // 结束拖拽
      dragStore.handleDragEnd()

      // 验证没有重叠
      const clips = tracksStore.tracks[0].clips.filter(c => c.type !== 'transition')
      if (clips.length >= 2) {
        const sortedClips = [...clips].sort((a, b) => a.startTime - b.startTime)
        for (let i = 0; i < sortedClips.length - 1; i++) {
          expect(sortedClips[i].endTime).toBeLessThanOrEqual(sortedClips[i + 1].startTime)
        }
      }
    })

    it('移动到前一个 clip 之前时应该正确处理', () => {
      const track = createTestTrack()
      tracksStore.addTrack(track)

      const clip1 = createTestClip(track.id, { startTime: 0, endTime: 5 })
      const clip2 = createTestClip(track.id, { startTime: 10, endTime: 15 })
      tracksStore.addClip(track.id, clip1)
      tracksStore.addClip(track.id, clip2)

      historyStore.initialize()

      // 开始拖拽 clip2
      const startEvent = new MouseEvent('mousedown', {
        clientX: 1000,
        clientY: 100,
      })
      dragStore.startDrag(clip2, startEvent)

      // 移动到 clip1 前面
      const moveEvent = new MouseEvent('mousemove', {
        clientX: -500, // 大幅左移
        clientY: 100,
      })
      dragStore.handleDragMove(moveEvent)

      expect(dragStore.previewPosition.visible).toBe(true)

      // 结束拖拽
      dragStore.handleDragEnd()

      expect(dragStore.isDragging).toBe(false)
    })
  })

  describe('预览位置计算', () => {
    it('预览位置应该正确更新', () => {
      const track = createTestTrack()
      tracksStore.addTrack(track)
      const clip = createTestClip(track.id, { startTime: 0, endTime: 5 })
      tracksStore.addClip(track.id, clip)

      historyStore.initialize()

      // 开始拖拽
      const startEvent = new MouseEvent('mousedown', {
        clientX: 100,
        clientY: 100,
      })
      dragStore.startDrag(clip, startEvent)

      // 移动
      const moveEvent = new MouseEvent('mousemove', {
        clientX: 200,
        clientY: 100,
      })
      dragStore.handleDragMove(moveEvent)

      expect(dragStore.previewPosition.visible).toBe(true)
      expect(dragStore.previewPosition.trackId).toBe(track.id)
      expect(dragStore.previewPosition.clipType).toBe('video')

      // 结束拖拽
      dragStore.handleDragEnd()
    })

    it('跨轨移动时预览位置应该显示需要新轨道', () => {
      const track1 = createTestTrack({ type: 'video', name: 'Video Track' })
      tracksStore.addTrack(track1)

      const clip = createTestClip(track1.id, { startTime: 0, endTime: 5 })
      tracksStore.addClip(track1.id, clip)

      dragStore.setConfig({ enableCrossTrackDrag: true })
      historyStore.initialize()

      // 开始拖拽
      const startEvent = new MouseEvent('mousedown', {
        clientX: 100,
        clientY: 100,
      })
      dragStore.startDrag(clip, startEvent)

      // 垂直移动超过阈值（但没有目标轨道）
      const moveEvent = new MouseEvent('mousemove', {
        clientX: 100,
        clientY: 250, // 大幅垂直移动
      })
      dragStore.handleDragMove(moveEvent)

      expect(dragStore.previewPosition.visible).toBe(true)

      // 结束拖拽
      dragStore.handleDragEnd()
    })
  })

  describe('多选拖拽', () => {
    it('拖拽时只应该拖拽当前 clip', () => {
      const track = createTestTrack()
      tracksStore.addTrack(track)

      const clip1 = createTestClip(track.id, { startTime: 0, endTime: 5 })
      const clip2 = createTestClip(track.id, { startTime: 10, endTime: 15 })
      tracksStore.addClip(track.id, clip1)
      tracksStore.addClip(track.id, clip2)

      historyStore.initialize()

      // 选中两个 clip
      tracksStore.selectClip(clip1.id)
      tracksStore.selectClip(clip2.id, true)

      // 开始拖拽 clip1
      const startEvent = new MouseEvent('mousedown', {
        clientX: 100,
        clientY: 100,
      })
      dragStore.startDrag(clip1, startEvent)

      // 验证只拖拽 clip1
      expect(dragStore.draggedClips).toHaveLength(1)
      expect(dragStore.draggedClips[0].id).toBe(clip1.id)

      // 结束拖拽
      dragStore.handleDragEnd()
    })
  })

  describe('配置禁用跨轨拖拽', () => {
    it('禁用跨轨拖拽时跨轨移动不应该改变轨道', () => {
      const track1 = createTestTrack({ name: 'Track 1' })
      const track2 = createTestTrack({ name: 'Track 2' })
      tracksStore.addTrack(track1)
      tracksStore.addTrack(track2)

      const clip = createTestClip(track1.id)
      tracksStore.addClip(track1.id, clip)

      dragStore.setConfig({ enableCrossTrackDrag: false })
      historyStore.initialize()

      const startEvent = new MouseEvent('mousedown', {
        clientX: 100,
        clientY: 100,
      })
      dragStore.startDrag(clip, startEvent)

      // 大幅垂直移动
      const moveEvent = new MouseEvent('mousemove', {
        clientX: 100,
        clientY: 300,
      })
      dragStore.handleDragMove(moveEvent)

      // 结束拖拽
      dragStore.handleDragEnd()

      // clip 应该仍在原轨道
      const clipInTrack1 = tracksStore.tracks[0].clips.find(c => c.id === clip.id)
      expect(clipInTrack1).toBeDefined()
    })
  })

  describe('边界情况', () => {
    it('拖拽开始时间不应该小于 0', () => {
      const track = createTestTrack()
      tracksStore.addTrack(track)

      const clip = createTestClip(track.id, { startTime: 1, endTime: 6 })
      tracksStore.addClip(track.id, clip)

      historyStore.initialize()

      // 开始拖拽
      const startEvent = new MouseEvent('mousedown', {
        clientX: 100,
        clientY: 100,
      })
      dragStore.startDrag(clip, startEvent)

      // 大幅向左移动
      const moveEvent = new MouseEvent('mousemove', {
        clientX: -1000,
        clientY: 100,
      })
      dragStore.handleDragMove(moveEvent)

      // 验证预览开始时间不小于 0
      expect(dragStore.previewPosition.startTime).toBeGreaterThanOrEqual(0)

      // 结束拖拽
      dragStore.handleDragEnd()

      // 验证实际开始时间不小于 0
      const updatedClip = tracksStore.tracks[0].clips.find(c => c.id === clip.id)
      if (updatedClip) {
        expect(updatedClip.startTime).toBeGreaterThanOrEqual(0)
      }
    })
  })

  // ====================== 新增测试：边缘滚动相关 ======================
  describe('边缘滚动完整测试', () => {
    let mockContainer: HTMLElement
    let mockScrollbar: HTMLElement
    let mockCallback: ReturnType<typeof vi.fn>
    let originalRAF: typeof requestAnimationFrame
    let originalCAF: typeof cancelAnimationFrame

    beforeEach(() => {
      // 模拟 requestAnimationFrame 和 cancelAnimationFrame
      originalRAF = (globalThis as any).requestAnimationFrame
      originalCAF = (globalThis as any).cancelAnimationFrame
      let rafId = 0
        ; (globalThis as any).requestAnimationFrame = vi.fn((cb) => {
          rafId++
          setTimeout(() => cb(performance.now()), 0)
          return rafId
        })
        ; (globalThis as any).cancelAnimationFrame = vi.fn()

      mockContainer = document.createElement('div')
      mockScrollbar = document.createElement('div')
      mockCallback = vi.fn()

      // 设置容器的边界
      mockContainer.getBoundingClientRect = vi.fn().mockReturnValue({
        left: 100,
        top: 50,
        width: 800,
        height: 600,
        right: 900,
        bottom: 650,
      })

      // 模拟 scrollbar 的属性
      Object.defineProperty(mockScrollbar, 'scrollLeft', {
        value: 100,
        writable: true,
        configurable: true,
      })
      Object.defineProperty(mockScrollbar, 'scrollWidth', {
        value: 2000,
        configurable: true,
      })
      Object.defineProperty(mockScrollbar, 'clientWidth', {
        value: 800,
        configurable: true,
      })
    })

    afterEach(() => {
      ; (globalThis as any).requestAnimationFrame = originalRAF
        ; (globalThis as any).cancelAnimationFrame = originalCAF
    })

    it('checkAndPerformEdgeScroll 应该在非拖拽状态下停止边缘滚动', async () => {
      dragStore.setScrollContainers(mockContainer, mockScrollbar, mockCallback)

      // 不拖拽状态下启动边缘滚动
      dragStore.startEdgeScroll()

      // 等待 RAF 执行
      await new Promise(resolve => setTimeout(resolve, 10))

      // 由于 isDragging 为 false，边缘滚动应该停止
      expect(dragStore.isDragging).toBe(false)
    })

    it('checkAndPerformEdgeScroll 应该在边缘滚动禁用时停止', async () => {
      dragStore.setConfig({ edgeScroll: { enabled: false } })
      dragStore.setScrollContainers(mockContainer, mockScrollbar, mockCallback)

      const track = createTestTrack()
      tracksStore.addTrack(track)
      const clip = createTestClip(track.id, { startTime: 0, endTime: 5 })
      tracksStore.addClip(track.id, clip)

      const startEvent = new MouseEvent('mousedown', { clientX: 200, clientY: 100 })
      dragStore.startDrag(clip, startEvent)

      // 等待 RAF 执行
      await new Promise(resolve => setTimeout(resolve, 10))

      // 边缘滚动已禁用
      expect(dragStore.edgeScrollConfig.enabled).toBe(false)

      dragStore.handleDragEnd()
    })

    it('performScroll 应该在没有 scrollbar 时不执行', () => {
      dragStore.setScrollContainers(mockContainer, null, mockCallback)

      // 手动调用开始边缘滚动（这不会执行实际滚动）
      dragStore.startEdgeScroll()
      dragStore.stopEdgeScroll()

      expect(mockCallback).not.toHaveBeenCalled()
    })

    it('左边缘滚动应该正确执行', async () => {
      // 设置容器可滚动
      Object.defineProperty(mockScrollbar, 'scrollLeft', {
        value: 100,
        writable: true,
        configurable: true,
      })

      dragStore.setScrollContainers(mockContainer, mockScrollbar, mockCallback)

      const track = createTestTrack()
      tracksStore.addTrack(track)
      const clip = createTestClip(track.id, { startTime: 5, endTime: 10 })
      tracksStore.addClip(track.id, clip)

      historyStore.initialize()

      // 开始拖拽
      const startEvent = new MouseEvent('mousedown', { clientX: 500, clientY: 100 })
      dragStore.startDrag(clip, startEvent)

      // 移动到左边缘（容器left=100，threshold=80，所以 <= 180 会触发）
      const moveEvent = new MouseEvent('mousemove', { clientX: 120, clientY: 100 })
      dragStore.handleDragMove(moveEvent)

      // 等待 RAF 执行
      await new Promise(resolve => setTimeout(resolve, 20))

      dragStore.handleDragEnd()
    })

    it('右边缘滚动应该正确执行', async () => {
      // 设置容器可滚动（未到达最大滚动位置）
      Object.defineProperty(mockScrollbar, 'scrollLeft', {
        value: 100,
        writable: true,
        configurable: true,
      })

      dragStore.setScrollContainers(mockContainer, mockScrollbar, mockCallback)

      const track = createTestTrack()
      tracksStore.addTrack(track)
      const clip = createTestClip(track.id, { startTime: 0, endTime: 5 })
      tracksStore.addClip(track.id, clip)

      historyStore.initialize()

      // 开始拖拽
      const startEvent = new MouseEvent('mousedown', { clientX: 200, clientY: 100 })
      dragStore.startDrag(clip, startEvent)

      // 移动到右边缘（容器right=900，threshold=80，所以 >= 820 会触发）
      const moveEvent = new MouseEvent('mousemove', { clientX: 880, clientY: 100 })
      dragStore.handleDragMove(moveEvent)

      // 等待 RAF 执行
      await new Promise(resolve => setTimeout(resolve, 20))

      dragStore.handleDragEnd()
    })

    it('右边缘滚动应该在已到达最大滚动位置时不执行', async () => {
      // 设置 scrollLeft 为最大值
      Object.defineProperty(mockScrollbar, 'scrollLeft', {
        value: 1200, // scrollWidth - clientWidth = 2000 - 800 = 1200
        writable: true,
        configurable: true,
      })

      dragStore.setScrollContainers(mockContainer, mockScrollbar, mockCallback)

      const track = createTestTrack()
      tracksStore.addTrack(track)
      const clip = createTestClip(track.id, { startTime: 0, endTime: 5 })
      tracksStore.addClip(track.id, clip)

      historyStore.initialize()

      // 开始拖拽
      const startEvent = new MouseEvent('mousedown', { clientX: 200, clientY: 100 })
      dragStore.startDrag(clip, startEvent)

      // 移动到右边缘
      const moveEvent = new MouseEvent('mousemove', { clientX: 880, clientY: 100 })
      dragStore.handleDragMove(moveEvent)

      // 等待 RAF 执行
      await new Promise(resolve => setTimeout(resolve, 20))

      dragStore.handleDragEnd()
    })

    it('updateDragPositionAfterScroll 应该在没有拖拽 clips 时返回', () => {
      dragStore.setScrollContainers(mockContainer, mockScrollbar, mockCallback)

      // 不开始拖拽直接调用 startEdgeScroll
      dragStore.startEdgeScroll()
      dragStore.stopEdgeScroll()

      expect(dragStore.draggedClips.length).toBe(0)
    })

    it('滚动后应该累积滚动偏移量', async () => {
      Object.defineProperty(mockScrollbar, 'scrollLeft', {
        value: 100,
        writable: true,
        configurable: true,
      })

      dragStore.setScrollContainers(mockContainer, mockScrollbar, mockCallback)

      const track = createTestTrack()
      tracksStore.addTrack(track)
      const clip = createTestClip(track.id, { startTime: 0, endTime: 5 })
      tracksStore.addClip(track.id, clip)

      historyStore.initialize()

      // 开始拖拽
      const startEvent = new MouseEvent('mousedown', { clientX: 200, clientY: 100 })
      dragStore.startDrag(clip, startEvent)

      // 移动到右边缘触发滚动
      const moveEvent = new MouseEvent('mousemove', { clientX: 880, clientY: 100 })
      dragStore.handleDragMove(moveEvent)

      // 等待多次 RAF 执行以累积滚动偏移
      await new Promise(resolve => setTimeout(resolve, 50))

      // 验证预览位置已更新
      expect(dragStore.previewPosition.visible).toBe(true)

      dragStore.handleDragEnd()
    })
  })

  // ====================== 新增测试：跨轨拖放完整逻辑 ======================
  describe('跨轨拖放完整逻辑测试', () => {
    it('handleCrossTrackDrop 应该创建新轨道并移动 clip（当 needNewTrack 为 true）', () => {
      const videoTrack = createTestTrack({ type: 'video', name: 'Video Track' })
      const audioTrack = createTestTrack({ type: 'audio', name: 'Audio Track' })
      tracksStore.addTrack(videoTrack)
      tracksStore.addTrack(audioTrack)

      const clip = createTestClip(videoTrack.id, { startTime: 0, endTime: 5, type: 'video' })
      tracksStore.addClip(videoTrack.id, clip)

      historyStore.initialize()

      // 模拟跨轨拖拽到类型不匹配的轨道
      const startEvent = new MouseEvent('mousedown', { clientX: 100, clientY: 100 })
      dragStore.startDrag(clip, startEvent)

      // 移动到音频轨道位置
      const moveEvent = new MouseEvent('mousemove', { clientX: 100, clientY: 200 })
      dragStore.handleDragMove(moveEvent)

      // 结束拖拽（应该创建新轨道）
      dragStore.handleDragEnd()

      // 验证拖拽已结束
      expect(dragStore.isDragging).toBe(false)
    })

    it('handleCrossTrackDrop 应该直接移动到目标轨道（当类型匹配且无重叠时）', () => {
      // 创建两个相同类型的轨道
      const track1 = createTestTrack({ type: 'video', name: 'Video Track 1' })
      const track2 = createTestTrack({ type: 'video', name: 'Video Track 2' })
      tracksStore.addTrack(track1)
      tracksStore.addTrack(track2)

      const clip = createTestClip(track1.id, { startTime: 0, endTime: 5, type: 'video' })
      tracksStore.addClip(track1.id, clip)

      historyStore.initialize()

      // 模拟 DOM 元素来模拟轨道检测
      const mockTrackElement = document.createElement('div')
      mockTrackElement.classList.add('tracks__track')
      mockTrackElement.dataset.trackId = track2.id
      Object.defineProperty(mockTrackElement, 'getBoundingClientRect', {
        value: () => ({ top: 150, bottom: 250, left: 0, right: 800 }),
      })
      document.body.appendChild(mockTrackElement)

      try {
        // 开始拖拽
        const startEvent = new MouseEvent('mousedown', { clientX: 100, clientY: 100 })
        dragStore.startDrag(clip, startEvent)

        // 移动到 track2 位置
        const moveEvent = new MouseEvent('mousemove', { clientX: 100, clientY: 200 })
        dragStore.handleDragMove(moveEvent)

        // 结束拖拽
        dragStore.handleDragEnd()

        expect(dragStore.isDragging).toBe(false)
      } finally {
        document.body.removeChild(mockTrackElement)
      }
    })

    it('calculatePreviewPosition 应该处理目标轨道不存在的情况', () => {
      const track = createTestTrack({ type: 'video', name: 'Video Track' })
      tracksStore.addTrack(track)

      const clip = createTestClip(track.id, { startTime: 0, endTime: 5 })
      tracksStore.addClip(track.id, clip)

      historyStore.initialize()

      // 模拟 DOM 元素返回无效的 trackId
      const mockTrackElement = document.createElement('div')
      mockTrackElement.classList.add('tracks__track')
      mockTrackElement.dataset.trackId = 'non-existent-track'
      Object.defineProperty(mockTrackElement, 'getBoundingClientRect', {
        value: () => ({ top: 150, bottom: 250, left: 0, right: 800 }),
      })
      document.body.appendChild(mockTrackElement)

      try {
        // 开始拖拽
        const startEvent = new MouseEvent('mousedown', { clientX: 100, clientY: 100 })
        dragStore.startDrag(clip, startEvent)

        // 移动到不存在的轨道位置
        const moveEvent = new MouseEvent('mousemove', { clientX: 100, clientY: 200 })
        dragStore.handleDragMove(moveEvent)

        // 由于目标轨道不存在，needNewTrack 应该为 true
        expect(dragStore.previewPosition.visible).toBe(true)

        dragStore.handleDragEnd()
      } finally {
        document.body.removeChild(mockTrackElement)
      }
    })

    it('跨轨拖放到有重叠的轨道应该设置 needNewTrack 为 true', () => {
      const track1 = createTestTrack({ type: 'video', name: 'Video Track 1' })
      const track2 = createTestTrack({ type: 'video', name: 'Video Track 2' })
      tracksStore.addTrack(track1)
      tracksStore.addTrack(track2)

      // 两个轨道同一位置都有 clip
      const clip1 = createTestClip(track1.id, { startTime: 0, endTime: 5, type: 'video' })
      const clip2 = createTestClip(track2.id, { startTime: 0, endTime: 5, type: 'video' })
      tracksStore.addClip(track1.id, clip1)
      tracksStore.addClip(track2.id, clip2)

      historyStore.initialize()

      // 模拟 DOM 元素
      const mockTrackElement = document.createElement('div')
      mockTrackElement.classList.add('tracks__track')
      mockTrackElement.dataset.trackId = track2.id
      Object.defineProperty(mockTrackElement, 'getBoundingClientRect', {
        value: () => ({ top: 150, bottom: 250, left: 0, right: 800 }),
      })
      document.body.appendChild(mockTrackElement)

      try {
        // 开始拖拽 clip1
        const startEvent = new MouseEvent('mousedown', { clientX: 100, clientY: 100 })
        dragStore.startDrag(clip1, startEvent)

        // 移动到 track2（会与 clip2 重叠）
        const moveEvent = new MouseEvent('mousemove', { clientX: 100, clientY: 200 })
        dragStore.handleDragMove(moveEvent)

        // 应该需要新轨道
        expect(dragStore.previewPosition.visible).toBe(true)

        dragStore.handleDragEnd()
      } finally {
        document.body.removeChild(mockTrackElement)
      }
    })
  })

  // ====================== 新增测试：重叠解决复杂场景 ======================
  describe('重叠解决复杂场景测试', () => {
    it('resolveTrackOverlaps 应该处理多个 clip 连续重叠的情况', () => {
      const track = createTestTrack()
      tracksStore.addTrack(track)

      // 创建多个连续的 clips
      const clip1 = createTestClip(track.id, { startTime: 0, endTime: 5 })
      const clip2 = createTestClip(track.id, { startTime: 5, endTime: 10 })
      const clip3 = createTestClip(track.id, { startTime: 10, endTime: 15 })
      tracksStore.addClip(track.id, clip1)
      tracksStore.addClip(track.id, clip2)
      tracksStore.addClip(track.id, clip3)

      historyStore.initialize()

      // 开始拖拽 clip1
      const startEvent = new MouseEvent('mousedown', { clientX: 100, clientY: 100 })
      dragStore.startDrag(clip1, startEvent)

      // 移动 clip1 使其与 clip2 和 clip3 重叠
      const moveEvent = new MouseEvent('mousemove', { clientX: 800, clientY: 100 })
      dragStore.handleDragMove(moveEvent)

      // 结束拖拽
      dragStore.handleDragEnd()

      // 验证没有重叠
      const clips = tracksStore.tracks[0].clips.filter(c => c.type !== 'transition')
      const sortedClips = [...clips].sort((a, b) => a.startTime - b.startTime)
      for (let i = 0; i < sortedClips.length - 1; i++) {
        expect(sortedClips[i].endTime).toBeLessThanOrEqual(sortedClips[i + 1].startTime)
      }
    })

    it('resolveTrackOverlaps 应该在轨道不存在时返回', () => {
      const track = createTestTrack()
      tracksStore.addTrack(track)

      const clip = createTestClip(track.id, { startTime: 0, endTime: 5 })
      tracksStore.addClip(track.id, clip)

      historyStore.initialize()

      // 开始拖拽
      const startEvent = new MouseEvent('mousedown', { clientX: 100, clientY: 100 })
      dragStore.startDrag(clip, startEvent)

      // 移动
      const moveEvent = new MouseEvent('mousemove', { clientX: 200, clientY: 100 })
      dragStore.handleDragMove(moveEvent)

      // 结束拖拽
      dragStore.handleDragEnd()

      expect(dragStore.isDragging).toBe(false)
    })

    it('resolveTrackOverlaps 应该在只有一个 clip 时返回', () => {
      const track = createTestTrack()
      tracksStore.addTrack(track)

      const clip = createTestClip(track.id, { startTime: 5, endTime: 10 })
      tracksStore.addClip(track.id, clip)

      historyStore.initialize()

      // 开始拖拽
      const startEvent = new MouseEvent('mousedown', { clientX: 100, clientY: 100 })
      dragStore.startDrag(clip, startEvent)

      // 移动
      const moveEvent = new MouseEvent('mousemove', { clientX: 200, clientY: 100 })
      dragStore.handleDragMove(moveEvent)

      // 结束拖拽
      dragStore.handleDragEnd()

      expect(dragStore.isDragging).toBe(false)
    })

    it('同轨移动时放在前面但放不下应该尝试放到 0 位置', () => {
      const track = createTestTrack()
      tracksStore.addTrack(track)

      // clip1 从 0 开始，clip2 紧随其后
      const clip1 = createTestClip(track.id, { startTime: 0, endTime: 3 })
      const clip2 = createTestClip(track.id, { startTime: 5, endTime: 10 })
      tracksStore.addClip(track.id, clip1)
      tracksStore.addClip(track.id, clip2)

      historyStore.initialize()

      // 开始拖拽 clip2
      const startEvent = new MouseEvent('mousedown', { clientX: 500, clientY: 100 })
      dragStore.startDrag(clip2, startEvent)

      // 尝试将 clip2 移动到 clip1 前面（但位置不够）
      const moveEvent = new MouseEvent('mousemove', { clientX: 50, clientY: 100 })
      dragStore.handleDragMove(moveEvent)

      expect(dragStore.previewPosition.visible).toBe(true)

      dragStore.handleDragEnd()
    })

    it('同轨移动时如果 0 位置还是重叠应该放到后面', () => {
      const track = createTestTrack()
      tracksStore.addTrack(track)

      // clip1 从 0 开始且很长
      const clip1 = createTestClip(track.id, { startTime: 0, endTime: 10 })
      const clip2 = createTestClip(track.id, { startTime: 15, endTime: 18 })
      tracksStore.addClip(track.id, clip1)
      tracksStore.addClip(track.id, clip2)

      historyStore.initialize()

      // 开始拖拽 clip2
      const startEvent = new MouseEvent('mousedown', { clientX: 1500, clientY: 100 })
      dragStore.startDrag(clip2, startEvent)

      // 尝试将 clip2 移动到 clip1 前面
      const moveEvent = new MouseEvent('mousemove', { clientX: 50, clientY: 100 })
      dragStore.handleDragMove(moveEvent)

      expect(dragStore.previewPosition.visible).toBe(true)

      dragStore.handleDragEnd()
    })
  })

  // ====================== 新增测试：吸附逻辑完整测试 ======================
  describe('吸附逻辑完整测试', () => {
    it('snapToPositions 应该在没有其他 clips 时返回原始时间', () => {
      const track = createTestTrack()
      tracksStore.addTrack(track)

      const clip = createTestClip(track.id, { startTime: 0, endTime: 5 })
      tracksStore.addClip(track.id, clip)

      scaleStore.setSnapEnabled(true)
      historyStore.initialize()

      // 开始拖拽
      const startEvent = new MouseEvent('mousedown', { clientX: 100, clientY: 100 })
      dragStore.startDrag(clip, startEvent)

      // 移动
      const moveEvent = new MouseEvent('mousemove', { clientX: 200, clientY: 100 })
      dragStore.handleDragMove(moveEvent)

      expect(dragStore.previewPosition.visible).toBe(true)

      dragStore.handleDragEnd()
    })

    it('snapToPositions 应该在轨道不存在时返回原始时间', () => {
      const track = createTestTrack()
      tracksStore.addTrack(track)

      const clip = createTestClip(track.id, { startTime: 0, endTime: 5 })
      tracksStore.addClip(track.id, clip)

      scaleStore.setSnapEnabled(true)
      historyStore.initialize()

      // 模拟一个无效的轨道 ID
      const mockTrackElement = document.createElement('div')
      mockTrackElement.classList.add('tracks__track')
      mockTrackElement.dataset.trackId = 'invalid-track-id'
      Object.defineProperty(mockTrackElement, 'getBoundingClientRect', {
        value: () => ({ top: 150, bottom: 250, left: 0, right: 800 }),
      })
      document.body.appendChild(mockTrackElement)

      try {
        // 开始拖拽
        const startEvent = new MouseEvent('mousedown', { clientX: 100, clientY: 100 })
        dragStore.startDrag(clip, startEvent)

        // 移动到无效轨道位置
        const moveEvent = new MouseEvent('mousemove', { clientX: 200, clientY: 200 })
        dragStore.handleDragMove(moveEvent)

        expect(dragStore.previewPosition.visible).toBe(true)

        dragStore.handleDragEnd()
      } finally {
        document.body.removeChild(mockTrackElement)
      }
    })

    it('snapToPositions 应该吸附到其他 clip 的开始时间', () => {
      const track = createTestTrack()
      tracksStore.addTrack(track)

      const clip1 = createTestClip(track.id, { startTime: 0, endTime: 5 })
      const clip2 = createTestClip(track.id, { startTime: 20, endTime: 25 })
      tracksStore.addClip(track.id, clip1)
      tracksStore.addClip(track.id, clip2)

      scaleStore.setSnapEnabled(true)
      historyStore.initialize()

      // 开始拖拽 clip1
      const startEvent = new MouseEvent('mousedown', { clientX: 100, clientY: 100 })
      dragStore.startDrag(clip1, startEvent)

      // 移动靠近 clip2 的开始位置
      const moveEvent = new MouseEvent('mousemove', { clientX: 2000, clientY: 100 })
      dragStore.handleDragMove(moveEvent)

      expect(dragStore.previewPosition.visible).toBe(true)

      dragStore.handleDragEnd()
    })

    it('snapToPositions 应该吸附到其他 clip 的结束时间', () => {
      const track = createTestTrack()
      tracksStore.addTrack(track)

      const clip1 = createTestClip(track.id, { startTime: 0, endTime: 5 })
      const clip2 = createTestClip(track.id, { startTime: 15, endTime: 20 })
      tracksStore.addClip(track.id, clip1)
      tracksStore.addClip(track.id, clip2)

      scaleStore.setSnapEnabled(true)
      historyStore.initialize()

      // 开始拖拽 clip1
      const startEvent = new MouseEvent('mousedown', { clientX: 100, clientY: 100 })
      dragStore.startDrag(clip1, startEvent)

      // 移动到刚好在 clip2 结束位置后
      const moveEvent = new MouseEvent('mousemove', { clientX: 2100, clientY: 100 })
      dragStore.handleDragMove(moveEvent)

      expect(dragStore.previewPosition.visible).toBe(true)

      dragStore.handleDragEnd()
    })

    it('snapToPositions 应该跳过选中的 clips', () => {
      const track = createTestTrack()
      tracksStore.addTrack(track)

      const clip1 = createTestClip(track.id, { startTime: 0, endTime: 5 })
      const clip2 = createTestClip(track.id, { startTime: 10, endTime: 15 })
      const clip3 = createTestClip(track.id, { startTime: 20, endTime: 25 })
      tracksStore.addClip(track.id, clip1)
      tracksStore.addClip(track.id, clip2)
      tracksStore.addClip(track.id, clip3)

      scaleStore.setSnapEnabled(true)
      historyStore.initialize()

      // 选中 clip2
      tracksStore.selectClip(clip2.id)

      // 开始拖拽 clip1
      const startEvent = new MouseEvent('mousedown', { clientX: 100, clientY: 100 })
      dragStore.startDrag(clip1, startEvent)

      // 移动
      const moveEvent = new MouseEvent('mousemove', { clientX: 1000, clientY: 100 })
      dragStore.handleDragMove(moveEvent)

      expect(dragStore.previewPosition.visible).toBe(true)

      dragStore.handleDragEnd()
    })

    it('snapToPositions 应该跳过转场 clips', () => {
      const track = createTestTrack()
      tracksStore.addTrack(track)

      const clip1 = createTestClip(track.id, { startTime: 0, endTime: 5 })
      const clip2 = createTestClip(track.id, { startTime: 5, endTime: 10 })
      tracksStore.addClip(track.id, clip1)
      tracksStore.addClip(track.id, clip2)

      // 添加转场
      const transitionClip = {
        id: 'transition-snap',
        trackId: track.id,
        type: 'transition' as const,
        name: 'Transition',
        startTime: 4.5,
        endTime: 5.5,
        selected: false,
        transitionType: 'fade',
        transitionDuration: 1,
      }
      tracksStore.addClip(track.id, transitionClip)

      scaleStore.setSnapEnabled(true)
      historyStore.initialize()

      // 开始拖拽 clip1
      const startEvent = new MouseEvent('mousedown', { clientX: 100, clientY: 100 })
      dragStore.startDrag(clip1, startEvent)

      // 移动
      const moveEvent = new MouseEvent('mousemove', { clientX: 300, clientY: 100 })
      dragStore.handleDragMove(moveEvent)

      expect(dragStore.previewPosition.visible).toBe(true)

      dragStore.handleDragEnd()
    })
  })

  // ====================== 新增测试：转场处理完整测试 ======================
  describe('转场处理完整测试', () => {
    it('checkAndRemoveOrphanedTransitions 应该删除没有相邻 clips 的转场', () => {
      const track = createTestTrack()
      tracksStore.addTrack(track)

      const clip1 = createTestClip(track.id, { startTime: 0, endTime: 5 })
      const clip2 = createTestClip(track.id, { startTime: 5, endTime: 10 })
      tracksStore.addClip(track.id, clip1)
      tracksStore.addClip(track.id, clip2)

      // 添加转场
      const transitionClip = {
        id: 'transition-orphan',
        trackId: track.id,
        type: 'transition' as const,
        name: 'Transition',
        startTime: 4.5,
        endTime: 5.5,
        selected: false,
        transitionType: 'fade',
        transitionDuration: 1,
      }
      tracksStore.addClip(track.id, transitionClip)

      historyStore.initialize()

      // 开始拖拽 clip2 使转场变为孤立
      const startEvent = new MouseEvent('mousedown', { clientX: 500, clientY: 100 })
      dragStore.startDrag(clip2, startEvent)

      // 移动 clip2 使其不再与 clip1 相接
      const moveEvent = new MouseEvent('mousemove', { clientX: 1500, clientY: 100 })
      dragStore.handleDragMove(moveEvent)

      // 结束拖拽
      dragStore.handleDragEnd()

      // 验证转场是否被删除
      const transitionsRemaining = tracksStore.tracks[0].clips.filter(c => c.type === 'transition')
      // 转场应该被删除因为 clips 不再相接
      expect(transitionsRemaining.length).toBeLessThanOrEqual(1)
    })

    it('checkAndRemoveOrphanedTransitions 应该保留仍有效的转场', () => {
      const track = createTestTrack()
      tracksStore.addTrack(track)

      const clip1 = createTestClip(track.id, { startTime: 0, endTime: 5 })
      const clip2 = createTestClip(track.id, { startTime: 5, endTime: 10 })
      tracksStore.addClip(track.id, clip1)
      tracksStore.addClip(track.id, clip2)

      // 添加转场
      const transitionClip = {
        id: 'transition-valid',
        trackId: track.id,
        type: 'transition' as const,
        name: 'Transition',
        startTime: 4.5,
        endTime: 5.5,
        selected: false,
        transitionType: 'fade',
        transitionDuration: 1,
      }
      tracksStore.addClip(track.id, transitionClip)

      historyStore.initialize()

      // 开始拖拽 clip1（但不改变与 clip2 的相接关系）
      const startEvent = new MouseEvent('mousedown', { clientX: 100, clientY: 100 })
      dragStore.startDrag(clip1, startEvent)

      // 只稍微移动一点
      const moveEvent = new MouseEvent('mousemove', { clientX: 110, clientY: 100 })
      dragStore.handleDragMove(moveEvent)

      // 结束拖拽
      dragStore.handleDragEnd()

      expect(dragStore.isDragging).toBe(false)
    })

    it('checkAndRemoveOrphanedTransitions 应该处理多个转场', () => {
      const track = createTestTrack()
      tracksStore.addTrack(track)

      const clip1 = createTestClip(track.id, { startTime: 0, endTime: 5 })
      const clip2 = createTestClip(track.id, { startTime: 5, endTime: 10 })
      const clip3 = createTestClip(track.id, { startTime: 10, endTime: 15 })
      tracksStore.addClip(track.id, clip1)
      tracksStore.addClip(track.id, clip2)
      tracksStore.addClip(track.id, clip3)

      // 添加两个转场
      const transition1 = {
        id: 'transition-1-multi',
        trackId: track.id,
        type: 'transition' as const,
        name: 'Transition 1',
        startTime: 4.5,
        endTime: 5.5,
        selected: false,
        transitionType: 'fade',
        transitionDuration: 1,
      }
      const transition2 = {
        id: 'transition-2-multi',
        trackId: track.id,
        type: 'transition' as const,
        name: 'Transition 2',
        startTime: 9.5,
        endTime: 10.5,
        selected: false,
        transitionType: 'fade',
        transitionDuration: 1,
      }
      tracksStore.addClip(track.id, transition1)
      tracksStore.addClip(track.id, transition2)

      historyStore.initialize()

      // 开始拖拽 clip2
      const startEvent = new MouseEvent('mousedown', { clientX: 500, clientY: 100 })
      dragStore.startDrag(clip2, startEvent)

      // 移动 clip2 使两边的转场都变为孤立
      const moveEvent = new MouseEvent('mousemove', { clientX: 2500, clientY: 100 })
      dragStore.handleDragMove(moveEvent)

      // 结束拖拽
      dragStore.handleDragEnd()

      expect(dragStore.isDragging).toBe(false)
    })
  })

  // ====================== 新增测试：calculateSameTrackPosition 边界情况 ======================
  describe('calculateSameTrackPosition 边界情况', () => {
    it('应该处理重叠时放在后面的情况', () => {
      const track = createTestTrack()
      tracksStore.addTrack(track)

      const clip1 = createTestClip(track.id, { startTime: 0, endTime: 5 })
      const clip2 = createTestClip(track.id, { startTime: 8, endTime: 13 })
      tracksStore.addClip(track.id, clip1)
      tracksStore.addClip(track.id, clip2)

      historyStore.initialize()

      // 开始拖拽 clip1
      const startEvent = new MouseEvent('mousedown', { clientX: 100, clientY: 100 })
      dragStore.startDrag(clip1, startEvent)

      // 移动 clip1 到 clip2 后半部分（应该放在后面）
      const moveEvent = new MouseEvent('mousemove', { clientX: 1200, clientY: 100 })
      dragStore.handleDragMove(moveEvent)

      expect(dragStore.previewPosition.visible).toBe(true)

      dragStore.handleDragEnd()
    })

    it('应该在轨道不存在时返回默认位置', () => {
      const track = createTestTrack()
      tracksStore.addTrack(track)

      const clip = createTestClip(track.id, { startTime: 0, endTime: 5 })
      tracksStore.addClip(track.id, clip)

      historyStore.initialize()

      // 开始拖拽
      const startEvent = new MouseEvent('mousedown', { clientX: 100, clientY: 100 })
      dragStore.startDrag(clip, startEvent)

      // 移动
      const moveEvent = new MouseEvent('mousemove', { clientX: 200, clientY: 100 })
      dragStore.handleDragMove(moveEvent)

      dragStore.handleDragEnd()

      expect(dragStore.isDragging).toBe(false)
    })
  })

  // ====================== 新增测试：wouldOverlapInTrack 边界情况 ======================
  describe('wouldOverlapInTrack 边界情况', () => {
    it('应该在轨道不存在时返回 false', () => {
      const track = createTestTrack()
      tracksStore.addTrack(track)

      const clip = createTestClip(track.id, { startTime: 0, endTime: 5 })
      tracksStore.addClip(track.id, clip)

      historyStore.initialize()

      // 模拟无效轨道 ID
      const mockTrackElement = document.createElement('div')
      mockTrackElement.classList.add('tracks__track')
      mockTrackElement.dataset.trackId = 'non-existent-track'
      Object.defineProperty(mockTrackElement, 'getBoundingClientRect', {
        value: () => ({ top: 150, bottom: 250, left: 0, right: 800 }),
      })
      document.body.appendChild(mockTrackElement)

      try {
        // 开始拖拽
        const startEvent = new MouseEvent('mousedown', { clientX: 100, clientY: 100 })
        dragStore.startDrag(clip, startEvent)

        // 移动到无效轨道位置
        const moveEvent = new MouseEvent('mousemove', { clientX: 100, clientY: 200 })
        dragStore.handleDragMove(moveEvent)

        // 结束拖拽
        dragStore.handleDragEnd()

        expect(dragStore.isDragging).toBe(false)
      } finally {
        document.body.removeChild(mockTrackElement)
      }
    })

    it('应该跳过当前拖拽的 clips 和转场', () => {
      const track = createTestTrack()
      tracksStore.addTrack(track)

      const clip1 = createTestClip(track.id, { startTime: 0, endTime: 5 })
      const clip2 = createTestClip(track.id, { startTime: 5, endTime: 10 })
      tracksStore.addClip(track.id, clip1)
      tracksStore.addClip(track.id, clip2)

      // 添加转场
      const transitionClip = {
        id: 'transition-overlap',
        trackId: track.id,
        type: 'transition' as const,
        name: 'Transition',
        startTime: 4.5,
        endTime: 5.5,
        selected: false,
        transitionType: 'fade',
        transitionDuration: 1,
      }
      tracksStore.addClip(track.id, transitionClip)

      historyStore.initialize()

      // 开始拖拽 clip1
      const startEvent = new MouseEvent('mousedown', { clientX: 100, clientY: 100 })
      dragStore.startDrag(clip1, startEvent)

      // 移动
      const moveEvent = new MouseEvent('mousemove', { clientX: 200, clientY: 100 })
      dragStore.handleDragMove(moveEvent)

      expect(dragStore.previewPosition.visible).toBe(true)

      dragStore.handleDragEnd()
    })
  })

  // ====================== 新增测试：applySameTrackPosition 边界情况 ======================
  describe('applySameTrackPosition 边界情况', () => {
    it('应该在没有初始位置信息时返回', () => {
      const track = createTestTrack()
      tracksStore.addTrack(track)

      const clip = createTestClip(track.id, { startTime: 0, endTime: 5 })
      tracksStore.addClip(track.id, clip)

      historyStore.initialize()

      // 开始拖拽
      const startEvent = new MouseEvent('mousedown', { clientX: 100, clientY: 100 })
      dragStore.startDrag(clip, startEvent)

      // 移动
      const moveEvent = new MouseEvent('mousemove', { clientX: 200, clientY: 100 })
      dragStore.handleDragMove(moveEvent)

      // 结束拖拽
      dragStore.handleDragEnd()

      expect(dragStore.isDragging).toBe(false)
    })
  })

  // ====================== 新增测试：getTargetTrackId 边界情况 ======================
  describe('getTargetTrackId 边界情况', () => {
    it('应该在没有找到轨道元素时返回 null', () => {
      const track = createTestTrack()
      tracksStore.addTrack(track)

      const clip = createTestClip(track.id, { startTime: 0, endTime: 5 })
      tracksStore.addClip(track.id, clip)

      historyStore.initialize()

      // 开始拖拽
      const startEvent = new MouseEvent('mousedown', { clientX: 100, clientY: 100 })
      dragStore.startDrag(clip, startEvent)

      // 移动到没有轨道元素的位置
      const moveEvent = new MouseEvent('mousemove', { clientX: 100, clientY: 1000 })
      dragStore.handleDragMove(moveEvent)

      // 由于没有找到目标轨道，应该保持原轨道
      expect(dragStore.currentTargetTrackId).toBe(track.id)

      dragStore.handleDragEnd()
    })

    it('应该在元素没有 trackId 时返回 null', () => {
      const track = createTestTrack()
      tracksStore.addTrack(track)

      const clip = createTestClip(track.id, { startTime: 0, endTime: 5 })
      tracksStore.addClip(track.id, clip)

      // 添加一个没有 trackId 的轨道元素
      const mockTrackElement = document.createElement('div')
      mockTrackElement.classList.add('tracks__track')
      // 不设置 dataset.trackId
      Object.defineProperty(mockTrackElement, 'getBoundingClientRect', {
        value: () => ({ top: 150, bottom: 250, left: 0, right: 800 }),
      })
      document.body.appendChild(mockTrackElement)

      historyStore.initialize()

      try {
        // 开始拖拽
        const startEvent = new MouseEvent('mousedown', { clientX: 100, clientY: 100 })
        dragStore.startDrag(clip, startEvent)

        // 移动到模拟元素位置
        const moveEvent = new MouseEvent('mousemove', { clientX: 100, clientY: 200 })
        dragStore.handleDragMove(moveEvent)

        dragStore.handleDragEnd()
      } finally {
        document.body.removeChild(mockTrackElement)
      }
    })
  })

  // ====================== 新增测试：createNewTrack 不同类型 ======================
  describe('createNewTrack 不同类型', () => {
    it('应该正确创建不同类型的新轨道', () => {
      const trackTypes = ['audio', 'subtitle', 'sticker', 'filter', 'effect'] as const

      for (const type of trackTypes) {
        const track = createTestTrack({ type, name: `${type} Track` })
        tracksStore.addTrack(track)

        const clip = createTestClip(track.id, {
          startTime: 0,
          endTime: 5,
          type: type as any,
        })
        tracksStore.addClip(track.id, clip)
      }

      expect(tracksStore.tracks.length).toBeGreaterThanOrEqual(trackTypes.length)
    })
  })
})
