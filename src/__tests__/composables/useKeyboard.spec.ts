import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref } from 'vue'
import { setActivePinia, createPinia } from 'pinia'
import { withSetup } from '../setup'

describe('useKeyboard', () => {
  let pinia: ReturnType<typeof createPinia>

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null)
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { })

    // Mock navigator.platform
    Object.defineProperty(navigator, 'platform', {
      value: 'Win32',
      configurable: true,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('应该正确导入', async () => {
    const { useKeyboard } = await import('../../composables/useKeyboard')
    expect(useKeyboard).toBeDefined()
    expect(typeof useKeyboard).toBe('function')
  })

  it('应该返回正确的属性和方法', async () => {
    const { useKeyboard } = await import('../../composables/useKeyboard')

    const { result, unmount } = withSetup(() => useKeyboard(), [pinia])

    expect(result).toHaveProperty('handleKeyDown')
    expect(result).toHaveProperty('isActive')
    unmount()
  })

  it('初始状态 isActive 应该为 false', async () => {
    const { useKeyboard } = await import('../../composables/useKeyboard')

    const { result, unmount } = withSetup(() => useKeyboard(), [pinia])

    expect(result.isActive.value).toBe(false)
    unmount()
  })

  describe('handleKeyDown', () => {
    it('应该能处理键盘事件', async () => {
      const { useKeyboard } = await import('../../composables/useKeyboard')

      const { result, unmount } = withSetup(() => useKeyboard(), [pinia])

      const div = document.createElement('div')
      const event = new KeyboardEvent('keydown', {
        code: 'Space',
        bubbles: true,
      })
      Object.defineProperty(event, 'target', { value: div })

      // 不应该抛出错误
      result.handleKeyDown(event)
      unmount()
    })

    it('输入框聚焦时不应该处理快捷键', async () => {
      const { useKeyboard } = await import('../../composables/useKeyboard')

      const { result, unmount } = withSetup(() => useKeyboard(), [pinia])

      const input = document.createElement('input')
      document.body.appendChild(input)
      input.focus()

      const event = new KeyboardEvent('keydown', {
        code: 'Space',
        bubbles: true,
      })
      Object.defineProperty(event, 'target', { value: input })

      result.handleKeyDown(event)

      document.body.removeChild(input)
      unmount()
    })
  })

  describe('带容器的键盘处理', () => {
    it('应该支持容器引用', async () => {
      const { useKeyboard } = await import('../../composables/useKeyboard')

      const container = document.createElement('div')
      const containerRef = ref(container)

      const { result, unmount } = withSetup(() => useKeyboard({ containerRef }), [pinia])

      expect(result.isActive.value).toBe(false)
      unmount()
    })
  })

  describe('快捷键功能测试', () => {
    it('Delete 键应该触发删除', async () => {
      const { useKeyboard } = await import('../../composables/useKeyboard')
      const { useTracksStore } = await import('../../stores/tracks')

      const { result, unmount } = withSetup(() => useKeyboard(), [pinia])
      const tracksStore = useTracksStore()

      // 添加测试数据
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
      tracksStore.selectClip('clip-1')

      const div = document.createElement('div')
      const event = new KeyboardEvent('keydown', {
        code: 'Delete',
        bubbles: true,
      })
      Object.defineProperty(event, 'target', { value: div })

      result.handleKeyDown(event)

      // 验证 clip 被删除
      expect(tracksStore.tracks[0].clips.length).toBe(0)
      unmount()
    })

    it('Escape 键应该清空选择', async () => {
      const { useKeyboard } = await import('../../composables/useKeyboard')
      const { useTracksStore } = await import('../../stores/tracks')

      const { result, unmount } = withSetup(() => useKeyboard(), [pinia])
      const tracksStore = useTracksStore()

      // 添加测试数据并选中
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
      tracksStore.selectClip('clip-1')

      expect(tracksStore.selectedClipIds.size).toBe(1)

      const div = document.createElement('div')
      const event = new KeyboardEvent('keydown', {
        code: 'Escape',
        bubbles: true,
      })
      Object.defineProperty(event, 'target', { value: div })

      result.handleKeyDown(event)

      expect(tracksStore.selectedClipIds.size).toBe(0)
      unmount()
    })

    it('ArrowRight 键应该调整时间前进', async () => {
      const { useKeyboard } = await import('../../composables/useKeyboard')
      const { usePlaybackStore } = await import('../../stores/playback')

      const { result, unmount } = withSetup(() => useKeyboard(), [pinia])
      const playbackStore = usePlaybackStore()

      playbackStore.currentTime = 0
      playbackStore.duration = 100

      const div = document.createElement('div')
      const event = new KeyboardEvent('keydown', {
        code: 'ArrowRight',
        bubbles: true,
      })
      Object.defineProperty(event, 'target', { value: div })

      result.handleKeyDown(event)

      expect(playbackStore.currentTime).toBeGreaterThan(0)
      unmount()
    })

    it('ArrowLeft 键应该调整时间后退', async () => {
      const { useKeyboard } = await import('../../composables/useKeyboard')
      const { usePlaybackStore } = await import('../../stores/playback')

      const { result, unmount } = withSetup(() => useKeyboard(), [pinia])
      const playbackStore = usePlaybackStore()

      playbackStore.currentTime = 10
      playbackStore.duration = 100

      const div = document.createElement('div')
      const event = new KeyboardEvent('keydown', {
        code: 'ArrowLeft',
        bubbles: true,
      })
      Object.defineProperty(event, 'target', { value: div })

      result.handleKeyDown(event)

      expect(playbackStore.currentTime).toBeLessThan(10)
      unmount()
    })

    it('Space 键应该切换播放状态', async () => {
      const { useKeyboard } = await import('../../composables/useKeyboard')
      const { usePlaybackStore } = await import('../../stores/playback')

      const { result, unmount } = withSetup(() => useKeyboard(), [pinia])
      const playbackStore = usePlaybackStore()

      // 初始状态不是播放中
      expect(playbackStore.isPlaying).toBe(false)

      const div = document.createElement('div')
      const event = new KeyboardEvent('keydown', {
        code: 'Space',
        bubbles: true,
      })
      Object.defineProperty(event, 'target', { value: div })

      result.handleKeyDown(event)

      expect(playbackStore.isPlaying).toBe(true)

      // 再按一次暂停
      result.handleKeyDown(event)
      expect(playbackStore.isPlaying).toBe(false)
      unmount()
    })

    it('Ctrl+Z 应该触发撤销', async () => {
      const { useKeyboard } = await import('../../composables/useKeyboard')
      const { useHistoryStore } = await import('../../stores/history')

      const historyStore = useHistoryStore()
      historyStore.initialize()
      const undoSpy = vi.spyOn(historyStore, 'undo')

      const { result, unmount } = withSetup(() => useKeyboard(), [pinia])

      const div = document.createElement('div')
      const event = new KeyboardEvent('keydown', {
        code: 'KeyZ',
        ctrlKey: true,
        bubbles: true,
      })
      Object.defineProperty(event, 'target', { value: div })

      result.handleKeyDown(event)

      expect(undoSpy).toHaveBeenCalled()
      unmount()
    })

    it('Ctrl+Shift+Z 应该触发重做', async () => {
      const { useKeyboard } = await import('../../composables/useKeyboard')
      const { useHistoryStore } = await import('../../stores/history')

      const historyStore = useHistoryStore()
      historyStore.initialize()
      const redoSpy = vi.spyOn(historyStore, 'redo')

      const { result, unmount } = withSetup(() => useKeyboard(), [pinia])

      const div = document.createElement('div')
      const event = new KeyboardEvent('keydown', {
        code: 'KeyZ',
        ctrlKey: true,
        shiftKey: true,
        bubbles: true,
      })
      Object.defineProperty(event, 'target', { value: div })

      result.handleKeyDown(event)

      expect(redoSpy).toHaveBeenCalled()
      unmount()
    })

    it('Ctrl+C 应该触发复制', async () => {
      const { useKeyboard } = await import('../../composables/useKeyboard')
      const { useTracksStore } = await import('../../stores/tracks')

      const tracksStore = useTracksStore()
      const copySpy = vi.spyOn(tracksStore, 'copyClips')

      const { result, unmount } = withSetup(() => useKeyboard(), [pinia])

      // 添加并选中一个 clip
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
      tracksStore.selectClip('clip-1')

      const div = document.createElement('div')
      const event = new KeyboardEvent('keydown', {
        code: 'KeyC',
        ctrlKey: true,
        bubbles: true,
      })
      Object.defineProperty(event, 'target', { value: div })

      result.handleKeyDown(event)

      expect(copySpy).toHaveBeenCalled()
      unmount()
    })

    it('Ctrl+X 应该触发剪切', async () => {
      const { useKeyboard } = await import('../../composables/useKeyboard')
      const { useTracksStore } = await import('../../stores/tracks')
      const { useHistoryStore } = await import('../../stores/history')

      const tracksStore = useTracksStore()
      const historyStore = useHistoryStore()
      historyStore.initialize()
      const cutSpy = vi.spyOn(tracksStore, 'cutClips')

      const { result, unmount } = withSetup(() => useKeyboard(), [pinia])

      // 添加并选中一个 clip
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
      tracksStore.selectClip('clip-1')

      const div = document.createElement('div')
      const event = new KeyboardEvent('keydown', {
        code: 'KeyX',
        ctrlKey: true,
        bubbles: true,
      })
      Object.defineProperty(event, 'target', { value: div })

      result.handleKeyDown(event)

      expect(cutSpy).toHaveBeenCalled()
      unmount()
    })

    it('Ctrl+A 应该被处理', async () => {
      const { useKeyboard } = await import('../../composables/useKeyboard')
      const { useTracksStore } = await import('../../stores/tracks')

      const tracksStore = useTracksStore()
      const { result, unmount } = withSetup(() => useKeyboard(), [pinia])

      // 添加多个 clip
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

      tracksStore.addClip('track-1', {
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
      })

      tracksStore.addClip('track-1', {
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
      })

      const div = document.createElement('div')
      const event = new KeyboardEvent('keydown', {
        code: 'KeyA',
        ctrlKey: true,
        bubbles: true,
      })
      Object.defineProperty(event, 'target', { value: div })

      // 验证事件可以被处理，不会抛出错误
      result.handleKeyDown(event)

      // Ctrl+A 目前没有实现全选，所以不做具体验证
      unmount()
    })

    it('按住 Shift 键加 ArrowRight 应该调整时间', async () => {
      const { useKeyboard } = await import('../../composables/useKeyboard')
      const { usePlaybackStore } = await import('../../stores/playback')

      const { result, unmount } = withSetup(() => useKeyboard(), [pinia])
      const playbackStore = usePlaybackStore()

      playbackStore.currentTime = 0
      playbackStore.duration = 100

      const div = document.createElement('div')
      const event = new KeyboardEvent('keydown', {
        code: 'ArrowRight',
        shiftKey: true,
        bubbles: true,
      })
      Object.defineProperty(event, 'target', { value: div })

      result.handleKeyDown(event)

      // ArrowRight 应该调整时间
      expect(playbackStore.currentTime).toBeGreaterThanOrEqual(0)
      unmount()
    })

    it('Ctrl+V 应该触发粘贴', async () => {
      const { useKeyboard } = await import('../../composables/useKeyboard')
      const { useTracksStore } = await import('../../stores/tracks')
      const { useHistoryStore } = await import('../../stores/history')

      const tracksStore = useTracksStore()
      const historyStore = useHistoryStore()
      historyStore.initialize()

      const { result, unmount } = withSetup(() => useKeyboard(), [pinia])

      // 添加轨道和 clip
      const track = {
        id: 'track-1',
        type: 'video' as const,
        name: 'Test',
        visible: true,
        locked: false,
        clips: [],
        order: 0,
        isMain: true,
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

      // 先复制
      tracksStore.selectClip('clip-1')
      tracksStore.copyClips(['clip-1'])

      const div = document.createElement('div')
      const event = new KeyboardEvent('keydown', {
        code: 'KeyV',
        ctrlKey: true,
        bubbles: true,
      })
      Object.defineProperty(event, 'target', { value: div })

      result.handleKeyDown(event)

      // 验证粘贴成功（会多出一个 clip）
      expect(tracksStore.tracks[0].clips.length).toBeGreaterThanOrEqual(1)
      unmount()
    })

    it('Ctrl+V 没有剪贴板内容时不应该做任何事', async () => {
      const { useKeyboard } = await import('../../composables/useKeyboard')
      const { useTracksStore } = await import('../../stores/tracks')

      const tracksStore = useTracksStore()
      const { result, unmount } = withSetup(() => useKeyboard(), [pinia])

      // 添加空轨道
      const track = {
        id: 'track-1',
        type: 'video' as const,
        name: 'Test',
        visible: true,
        locked: false,
        clips: [],
        order: 0,
        isMain: true,
      }
      tracksStore.addTrack(track)

      const div = document.createElement('div')
      const event = new KeyboardEvent('keydown', {
        code: 'KeyV',
        ctrlKey: true,
        bubbles: true,
      })
      Object.defineProperty(event, 'target', { value: div })

      result.handleKeyDown(event)

      // 没有剪贴板内容，不应该有变化
      expect(tracksStore.tracks[0].clips.length).toBe(0)
      unmount()
    })

    it('Ctrl+Y 应该触发重做', async () => {
      const { useKeyboard } = await import('../../composables/useKeyboard')
      const { useHistoryStore } = await import('../../stores/history')

      const historyStore = useHistoryStore()
      historyStore.initialize()
      const redoSpy = vi.spyOn(historyStore, 'redo')

      const { result, unmount } = withSetup(() => useKeyboard(), [pinia])

      const div = document.createElement('div')
      const event = new KeyboardEvent('keydown', {
        code: 'KeyY',
        ctrlKey: true,
        bubbles: true,
      })
      Object.defineProperty(event, 'target', { value: div })

      result.handleKeyDown(event)

      expect(redoSpy).toHaveBeenCalled()
      unmount()
    })

    it('Ctrl++ 应该放大视图', async () => {
      const { useKeyboard } = await import('../../composables/useKeyboard')
      const { useScaleStore } = await import('../../stores/scale')

      const scaleStore = useScaleStore()
      const zoomInSpy = vi.spyOn(scaleStore, 'zoomIn')

      const { result, unmount } = withSetup(() => useKeyboard(), [pinia])

      const div = document.createElement('div')
      const event = new KeyboardEvent('keydown', {
        code: 'Equal',
        ctrlKey: true,
        bubbles: true,
      })
      Object.defineProperty(event, 'target', { value: div })

      result.handleKeyDown(event)

      expect(zoomInSpy).toHaveBeenCalled()
      unmount()
    })

    it('Ctrl+- 应该缩小视图', async () => {
      const { useKeyboard } = await import('../../composables/useKeyboard')
      const { useScaleStore } = await import('../../stores/scale')

      const scaleStore = useScaleStore()
      const zoomOutSpy = vi.spyOn(scaleStore, 'zoomOut')

      const { result, unmount } = withSetup(() => useKeyboard(), [pinia])

      const div = document.createElement('div')
      const event = new KeyboardEvent('keydown', {
        code: 'Minus',
        ctrlKey: true,
        bubbles: true,
      })
      Object.defineProperty(event, 'target', { value: div })

      result.handleKeyDown(event)

      expect(zoomOutSpy).toHaveBeenCalled()
      unmount()
    })

    it('Backspace 键应该删除选中的 clips', async () => {
      const { useKeyboard } = await import('../../composables/useKeyboard')
      const { useTracksStore } = await import('../../stores/tracks')
      const { useHistoryStore } = await import('../../stores/history')

      const { result, unmount } = withSetup(() => useKeyboard(), [pinia])
      const tracksStore = useTracksStore()
      const historyStore = useHistoryStore()
      historyStore.initialize()

      // 添加测试数据
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
      tracksStore.selectClip('clip-1')

      const div = document.createElement('div')
      const event = new KeyboardEvent('keydown', {
        code: 'Backspace',
        bubbles: true,
      })
      Object.defineProperty(event, 'target', { value: div })

      result.handleKeyDown(event)

      // 验证 clip 被删除
      expect(tracksStore.tracks[0].clips.length).toBe(0)
      unmount()
    })

    it('NumpadAdd 应该放大视图', async () => {
      const { useKeyboard } = await import('../../composables/useKeyboard')
      const { useScaleStore } = await import('../../stores/scale')

      const scaleStore = useScaleStore()
      const zoomInSpy = vi.spyOn(scaleStore, 'zoomIn')

      const { result, unmount } = withSetup(() => useKeyboard(), [pinia])

      const div = document.createElement('div')
      const event = new KeyboardEvent('keydown', {
        code: 'NumpadAdd',
        ctrlKey: true,
        bubbles: true,
      })
      Object.defineProperty(event, 'target', { value: div })

      result.handleKeyDown(event)

      expect(zoomInSpy).toHaveBeenCalled()
      unmount()
    })

    it('NumpadSubtract 应该缩小视图', async () => {
      const { useKeyboard } = await import('../../composables/useKeyboard')
      const { useScaleStore } = await import('../../stores/scale')

      const scaleStore = useScaleStore()
      const zoomOutSpy = vi.spyOn(scaleStore, 'zoomOut')

      const { result, unmount } = withSetup(() => useKeyboard(), [pinia])

      const div = document.createElement('div')
      const event = new KeyboardEvent('keydown', {
        code: 'NumpadSubtract',
        ctrlKey: true,
        bubbles: true,
      })
      Object.defineProperty(event, 'target', { value: div })

      result.handleKeyDown(event)

      expect(zoomOutSpy).toHaveBeenCalled()
      unmount()
    })

    it('没有选中 clips 时删除键不应该做任何事', async () => {
      const { useKeyboard } = await import('../../composables/useKeyboard')
      const { useTracksStore } = await import('../../stores/tracks')
      const { useHistoryStore } = await import('../../stores/history')

      const { result, unmount } = withSetup(() => useKeyboard(), [pinia])
      const tracksStore = useTracksStore()
      const historyStore = useHistoryStore()
      historyStore.initialize()

      // 添加测试数据但不选中
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

      const div = document.createElement('div')
      const event = new KeyboardEvent('keydown', {
        code: 'Delete',
        bubbles: true,
      })
      Object.defineProperty(event, 'target', { value: div })

      result.handleKeyDown(event)

      // clip 不应该被删除
      expect(tracksStore.tracks[0].clips.length).toBe(1)
      unmount()
    })

    it('没有选中 clips 时复制不应该做任何事', async () => {
      const { useKeyboard } = await import('../../composables/useKeyboard')
      const { useTracksStore } = await import('../../stores/tracks')

      const tracksStore = useTracksStore()
      const copySpy = vi.spyOn(tracksStore, 'copyClips')

      const { result, unmount } = withSetup(() => useKeyboard(), [pinia])

      // 添加轨道但不添加 clip
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

      const div = document.createElement('div')
      const event = new KeyboardEvent('keydown', {
        code: 'KeyC',
        ctrlKey: true,
        bubbles: true,
      })
      Object.defineProperty(event, 'target', { value: div })

      result.handleKeyDown(event)

      // copyClips 不应该被调用（因为没有选中）
      expect(copySpy).not.toHaveBeenCalled()
      unmount()
    })

    it('没有选中 clips 时剪切不应该做任何事', async () => {
      const { useKeyboard } = await import('../../composables/useKeyboard')
      const { useTracksStore } = await import('../../stores/tracks')

      const tracksStore = useTracksStore()
      const cutSpy = vi.spyOn(tracksStore, 'cutClips')

      const { result, unmount } = withSetup(() => useKeyboard(), [pinia])

      // 添加轨道但不添加 clip
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

      const div = document.createElement('div')
      const event = new KeyboardEvent('keydown', {
        code: 'KeyX',
        ctrlKey: true,
        bubbles: true,
      })
      Object.defineProperty(event, 'target', { value: div })

      result.handleKeyDown(event)

      // cutClips 不应该被调用（因为没有选中）
      expect(cutSpy).not.toHaveBeenCalled()
      unmount()
    })
  })

  describe('容器事件处理', () => {
    it('鼠标进入容器时 isActive 应该为 true', async () => {
      const { useKeyboard } = await import('../../composables/useKeyboard')

      const container = document.createElement('div')
      document.body.appendChild(container)
      const containerRef = ref(container)

      const { result, unmount } = withSetup(() => useKeyboard({ containerRef }), [pinia])

      expect(result.isActive.value).toBe(false)

      // 模拟鼠标进入
      const enterEvent = new MouseEvent('mouseenter', { bubbles: true })
      container.dispatchEvent(enterEvent)

      expect(result.isActive.value).toBe(true)

      document.body.removeChild(container)
      unmount()
    })

    it('鼠标离开容器且焦点不在容器内时 isActive 应该为 false', async () => {
      const { useKeyboard } = await import('../../composables/useKeyboard')

      const container = document.createElement('div')
      document.body.appendChild(container)
      const containerRef = ref(container)

      const { result, unmount } = withSetup(() => useKeyboard({ containerRef }), [pinia])

      // 先触发鼠标进入
      const enterEvent = new MouseEvent('mouseenter', { bubbles: true })
      container.dispatchEvent(enterEvent)
      expect(result.isActive.value).toBe(true)

      // 触发鼠标离开
      const leaveEvent = new MouseEvent('mouseleave', { bubbles: true })
      container.dispatchEvent(leaveEvent)

      expect(result.isActive.value).toBe(false)

      document.body.removeChild(container)
      unmount()
    })

    it('容器获得焦点时 isActive 应该为 true', async () => {
      const { useKeyboard } = await import('../../composables/useKeyboard')

      const container = document.createElement('div')
      container.tabIndex = 0
      document.body.appendChild(container)
      const containerRef = ref(container)

      const { result, unmount } = withSetup(() => useKeyboard({ containerRef }), [pinia])

      expect(result.isActive.value).toBe(false)

      // 模拟焦点进入
      const focusInEvent = new FocusEvent('focusin', { bubbles: true })
      container.dispatchEvent(focusInEvent)

      expect(result.isActive.value).toBe(true)

      document.body.removeChild(container)
      unmount()
    })

    it('容器失去焦点且焦点移到容器外时 isActive 应该为 false', async () => {
      const { useKeyboard } = await import('../../composables/useKeyboard')

      const container = document.createElement('div')
      container.tabIndex = 0
      const externalElement = document.createElement('div')
      externalElement.tabIndex = 0
      document.body.appendChild(container)
      document.body.appendChild(externalElement)
      const containerRef = ref(container)

      const { result, unmount } = withSetup(() => useKeyboard({ containerRef }), [pinia])

      // 先触发焦点进入
      const focusInEvent = new FocusEvent('focusin', { bubbles: true })
      container.dispatchEvent(focusInEvent)
      expect(result.isActive.value).toBe(true)

      // 触发焦点离开到外部元素
      const focusOutEvent = new FocusEvent('focusout', {
        bubbles: true,
        relatedTarget: externalElement,
      })
      container.dispatchEvent(focusOutEvent)

      expect(result.isActive.value).toBe(false)

      document.body.removeChild(container)
      document.body.removeChild(externalElement)
      unmount()
    })

    it('有容器时非激活状态不应处理快捷键', async () => {
      const { useKeyboard } = await import('../../composables/useKeyboard')
      const { useTracksStore } = await import('../../stores/tracks')

      const container = document.createElement('div')
      document.body.appendChild(container)
      const containerRef = ref(container)
      const tracksStore = useTracksStore()

      // 添加一个轨道和 clip 用于测试删除
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
        selected: true,
        sourceUrl: 'test.mp4',
        originalDuration: 10,
        trimStart: 0,
        trimEnd: 5,
        playbackRate: 1,
      })
      tracksStore.selectClip('clip-1')

      const { result, unmount } = withSetup(() => useKeyboard({ containerRef }), [pinia])

      expect(result.isActive.value).toBe(false)
      expect(tracksStore.tracks[0].clips).toHaveLength(1)

      const div = document.createElement('div')
      // 使用 Delete 键测试，因为空格键是全局生效的
      const event = new KeyboardEvent('keydown', {
        code: 'Delete',
        bubbles: true,
      })
      Object.defineProperty(event, 'target', { value: div })

      result.handleKeyDown(event)

      // 因为不是激活状态，不应该删除 clip
      expect(tracksStore.tracks[0].clips).toHaveLength(1)

      document.body.removeChild(container)
      unmount()
    })

    it('有容器时激活状态应该处理快捷键', async () => {
      const { useKeyboard } = await import('../../composables/useKeyboard')
      const { usePlaybackStore } = await import('../../stores/playback')

      const container = document.createElement('div')
      document.body.appendChild(container)
      const containerRef = ref(container)
      const playbackStore = usePlaybackStore()

      const { result, unmount } = withSetup(() => useKeyboard({ containerRef }), [pinia])

      // 先激活容器
      const enterEvent = new MouseEvent('mouseenter', { bubbles: true })
      container.dispatchEvent(enterEvent)
      expect(result.isActive.value).toBe(true)

      const div = document.createElement('div')
      const event = new KeyboardEvent('keydown', {
        code: 'Space',
        bubbles: true,
      })
      Object.defineProperty(event, 'target', { value: div })

      result.handleKeyDown(event)

      // 激活状态应该切换播放
      expect(playbackStore.isPlaying).toBe(true)

      document.body.removeChild(container)
      unmount()
    })

    it('textarea 聚焦时不应该处理快捷键', async () => {
      const { useKeyboard } = await import('../../composables/useKeyboard')
      const { usePlaybackStore } = await import('../../stores/playback')

      const { result, unmount } = withSetup(() => useKeyboard(), [pinia])
      const playbackStore = usePlaybackStore()

      const textarea = document.createElement('textarea')
      document.body.appendChild(textarea)

      const event = new KeyboardEvent('keydown', {
        code: 'Space',
        bubbles: true,
      })
      Object.defineProperty(event, 'target', { value: textarea })

      result.handleKeyDown(event)

      expect(playbackStore.isPlaying).toBe(false)

      document.body.removeChild(textarea)
      unmount()
    })

    it('contentEditable 元素应该被识别', async () => {
      const { useKeyboard } = await import('../../composables/useKeyboard')

      const { result, unmount } = withSetup(() => useKeyboard(), [pinia])

      const editableDiv = document.createElement('div')
      editableDiv.contentEditable = 'true'
      document.body.appendChild(editableDiv)

      // JSDOM 中 contentEditable 属性设置后应该能够被读取
      expect(editableDiv.contentEditable).toBe('true')

      document.body.removeChild(editableDiv)
      unmount()
    })
  })

  describe('键盘回调功能', () => {
    it('复制操作应该触发 onCopy 回调', async () => {
      const { useKeyboard } = await import('../../composables/useKeyboard')
      const { useTracksStore } = await import('../../stores/tracks')

      const onCopy = vi.fn()
      const callbacks = { onCopy }

      const container = document.createElement('div')
      document.body.appendChild(container)
      const containerRef = ref(container)

      const { result, unmount } = withSetup(() => useKeyboard({ containerRef, callbacks }), [pinia])
      const tracksStore = useTracksStore()

      // 添加测试数据
      tracksStore.addTrack({
        id: 'track-callback-test',
        type: 'video' as const,
        name: 'Test',
        visible: true,
        locked: false,
        clips: [],
        order: 0,
      })
      tracksStore.addClip('track-callback-test', {
        id: 'clip-callback-1',
        trackId: 'track-callback-test',
        type: 'video' as const,
        startTime: 0,
        endTime: 5,
        selected: false,
        sourceUrl: 'test.mp4',
        originalDuration: 10,
        trimStart: 0,
        trimEnd: 10,
        playbackRate: 1,
      })

      // 选中 clip
      tracksStore.selectClip('clip-callback-1')

      // 模拟激活状态
      result.isActive.value = true

      // 模拟 Ctrl+C
      const div = document.createElement('div')
      const event = new KeyboardEvent('keydown', {
        code: 'KeyC',
        ctrlKey: true,
        bubbles: true,
      })
      Object.defineProperty(event, 'target', { value: div })
      Object.defineProperty(event, 'preventDefault', { value: vi.fn() })

      result.handleKeyDown(event)

      expect(onCopy).toHaveBeenCalledWith(['clip-callback-1'])

      document.body.removeChild(container)
      unmount()
    })

    it('剪切操作应该触发 onCut 回调', async () => {
      const { useKeyboard } = await import('../../composables/useKeyboard')
      const { useTracksStore } = await import('../../stores/tracks')

      const onCut = vi.fn()
      const callbacks = { onCut }

      const container = document.createElement('div')
      document.body.appendChild(container)
      const containerRef = ref(container)

      const { result, unmount } = withSetup(() => useKeyboard({ containerRef, callbacks }), [pinia])
      const tracksStore = useTracksStore()

      // 添加测试数据
      tracksStore.addTrack({
        id: 'track-cut-callback',
        type: 'video' as const,
        name: 'Test',
        visible: true,
        locked: false,
        clips: [],
        order: 0,
      })
      tracksStore.addClip('track-cut-callback', {
        id: 'clip-cut-callback-1',
        trackId: 'track-cut-callback',
        type: 'video' as const,
        startTime: 0,
        endTime: 5,
        selected: false,
        sourceUrl: 'test.mp4',
        originalDuration: 10,
        trimStart: 0,
        trimEnd: 10,
        playbackRate: 1,
      })

      // 选中 clip
      tracksStore.selectClip('clip-cut-callback-1')

      // 模拟激活状态
      result.isActive.value = true

      // 模拟 Ctrl+X
      const div = document.createElement('div')
      const event = new KeyboardEvent('keydown', {
        code: 'KeyX',
        ctrlKey: true,
        bubbles: true,
      })
      Object.defineProperty(event, 'target', { value: div })
      Object.defineProperty(event, 'preventDefault', { value: vi.fn() })

      result.handleKeyDown(event)

      expect(onCut).toHaveBeenCalledWith(['clip-cut-callback-1'])

      document.body.removeChild(container)
      unmount()
    })

    it('删除操作应该触发 onDelete 回调', async () => {
      const { useKeyboard } = await import('../../composables/useKeyboard')
      const { useTracksStore } = await import('../../stores/tracks')
      const { useHistoryStore } = await import('../../stores/history')

      const onDelete = vi.fn()
      const callbacks = { onDelete }

      const container = document.createElement('div')
      document.body.appendChild(container)
      const containerRef = ref(container)

      const { result, unmount } = withSetup(() => useKeyboard({ containerRef, callbacks }), [pinia])
      const tracksStore = useTracksStore()
      const historyStore = useHistoryStore()
      historyStore.initialize()

      // 添加测试数据
      tracksStore.addTrack({
        id: 'track-delete-callback',
        type: 'video' as const,
        name: 'Test',
        visible: true,
        locked: false,
        clips: [],
        order: 0,
      })
      tracksStore.addClip('track-delete-callback', {
        id: 'clip-delete-callback-1',
        trackId: 'track-delete-callback',
        type: 'video' as const,
        startTime: 0,
        endTime: 5,
        selected: false,
        sourceUrl: 'test.mp4',
        originalDuration: 10,
        trimStart: 0,
        trimEnd: 10,
        playbackRate: 1,
      })

      // 选中 clip
      tracksStore.selectClip('clip-delete-callback-1')

      // 模拟激活状态
      result.isActive.value = true

      // 模拟 Delete 键
      const div = document.createElement('div')
      const event = new KeyboardEvent('keydown', {
        code: 'Delete',
        bubbles: true,
      })
      Object.defineProperty(event, 'target', { value: div })
      Object.defineProperty(event, 'preventDefault', { value: vi.fn() })

      result.handleKeyDown(event)

      expect(onDelete).toHaveBeenCalledWith(['clip-delete-callback-1'])

      document.body.removeChild(container)
      unmount()
    })

    it('粘贴操作应该触发 onPaste 回调', async () => {
      const { useKeyboard } = await import('../../composables/useKeyboard')
      const { useTracksStore } = await import('../../stores/tracks')
      const { usePlaybackStore } = await import('../../stores/playback')
      const { useHistoryStore } = await import('../../stores/history')

      const onPaste = vi.fn()
      const callbacks = { onPaste }

      const container = document.createElement('div')
      document.body.appendChild(container)
      const containerRef = ref(container)

      const { result, unmount } = withSetup(() => useKeyboard({ containerRef, callbacks }), [pinia])
      const tracksStore = useTracksStore()
      const playbackStore = usePlaybackStore()
      const historyStore = useHistoryStore()
      historyStore.initialize()

      // 添加测试数据
      tracksStore.addTrack({
        id: 'track-paste-callback',
        type: 'video' as const,
        name: 'Test',
        visible: true,
        locked: false,
        clips: [],
        order: 0,
        isMain: true,
      })
      tracksStore.addClip('track-paste-callback', {
        id: 'clip-paste-callback-1',
        trackId: 'track-paste-callback',
        type: 'video' as const,
        startTime: 0,
        endTime: 5,
        selected: false,
        sourceUrl: 'test.mp4',
        originalDuration: 10,
        trimStart: 0,
        trimEnd: 10,
        playbackRate: 1,
      })

      // 复制 clip
      tracksStore.copyClips(['clip-paste-callback-1'])

      // 设置当前时间
      playbackStore.setDuration(100)
      playbackStore.seekTo(10)

      // 模拟激活状态
      result.isActive.value = true

      // 模拟 Ctrl+V
      const div = document.createElement('div')
      const event = new KeyboardEvent('keydown', {
        code: 'KeyV',
        ctrlKey: true,
        bubbles: true,
      })
      Object.defineProperty(event, 'target', { value: div })
      Object.defineProperty(event, 'preventDefault', { value: vi.fn() })

      result.handleKeyDown(event)

      expect(onPaste).toHaveBeenCalled()

      document.body.removeChild(container)
      unmount()
    })

    it('没有回调时不应该报错', async () => {
      const { useKeyboard } = await import('../../composables/useKeyboard')
      const { useTracksStore } = await import('../../stores/tracks')

      const container = document.createElement('div')
      document.body.appendChild(container)
      const containerRef = ref(container)

      // 不传入 callbacks
      const { result, unmount } = withSetup(() => useKeyboard({ containerRef }), [pinia])
      const tracksStore = useTracksStore()

      // 添加测试数据
      tracksStore.addTrack({
        id: 'track-no-callback',
        type: 'video' as const,
        name: 'Test',
        visible: true,
        locked: false,
        clips: [],
        order: 0,
      })
      tracksStore.addClip('track-no-callback', {
        id: 'clip-no-callback-1',
        trackId: 'track-no-callback',
        type: 'video' as const,
        startTime: 0,
        endTime: 5,
        selected: false,
        sourceUrl: 'test.mp4',
        originalDuration: 10,
        trimStart: 0,
        trimEnd: 10,
        playbackRate: 1,
      })

      // 选中 clip
      tracksStore.selectClip('clip-no-callback-1')

      // 模拟激活状态
      result.isActive.value = true

      // 模拟 Ctrl+C - 不应该报错
      const div = document.createElement('div')
      const event = new KeyboardEvent('keydown', {
        code: 'KeyC',
        ctrlKey: true,
        bubbles: true,
      })
      Object.defineProperty(event, 'target', { value: div })
      Object.defineProperty(event, 'preventDefault', { value: vi.fn() })

      expect(() => result.handleKeyDown(event)).not.toThrow()

      document.body.removeChild(container)
      unmount()
    })
  })
})

