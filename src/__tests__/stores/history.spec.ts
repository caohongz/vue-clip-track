import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useHistoryStore } from '../../stores/history'
import { useTracksStore } from '../../stores/tracks'
import type { Track, MediaClip } from '@/types'

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

describe('useHistoryStore', () => {
  let historyStore: ReturnType<typeof useHistoryStore>
  let tracksStore: ReturnType<typeof useTracksStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    historyStore = useHistoryStore()
    tracksStore = useTracksStore()
  })

  describe('初始状态', () => {
    it('应该有空的历史栈', () => {
      expect(historyStore.historyStack).toEqual([])
    })

    it('应该有 currentIndex 为 -1', () => {
      expect(historyStore.currentIndex).toBe(-1)
    })

    it('应该有默认的最大历史记录数', () => {
      expect(historyStore.maxHistorySize).toBe(50)
    })

    it('canUndo 应该为 false', () => {
      expect(historyStore.canUndo).toBe(false)
    })

    it('canRedo 应该为 false', () => {
      expect(historyStore.canRedo).toBe(false)
    })
  })

  describe('createSnapshot', () => {
    it('应该创建包含当前状态的快照', () => {
      const track = createTestTrack()
      tracksStore.addTrack(track)
      const clip = createTestClip(track.id)
      tracksStore.addClip(track.id, clip)

      const snapshot = historyStore.createSnapshot('测试快照')

      expect(snapshot.id).toBeDefined()
      expect(snapshot.timestamp).toBeDefined()
      expect(snapshot.description).toBe('测试快照')
      expect(snapshot.snapshot).toBeDefined()

      const data = JSON.parse(snapshot.snapshot)
      expect(data.tracks).toHaveLength(1)
      expect(data.selectedClipIds).toEqual([])
    })
  })

  describe('pushSnapshot', () => {
    it('应该添加快照到历史栈', () => {
      historyStore.pushSnapshot('操作1')
      expect(historyStore.historyStack).toHaveLength(1)
      expect(historyStore.currentIndex).toBe(0)
    })

    it('应该能添加多个快照', () => {
      historyStore.pushSnapshot('操作1')
      historyStore.pushSnapshot('操作2')
      historyStore.pushSnapshot('操作3')
      expect(historyStore.historyStack).toHaveLength(3)
      expect(historyStore.currentIndex).toBe(2)
    })

    it('在非栈顶添加快照时应该删除后续历史', () => {
      historyStore.pushSnapshot('操作1')
      historyStore.pushSnapshot('操作2')
      historyStore.pushSnapshot('操作3')

      // 撤销到第一个操作
      historyStore.undo()
      historyStore.undo()

      // 添加新操作，应该删除操作2和操作3
      historyStore.pushSnapshot('新操作')

      expect(historyStore.historyStack).toHaveLength(2)
    })

    it('应该限制历史记录数量', () => {
      historyStore.maxHistorySize = 3

      historyStore.pushSnapshot('操作1')
      historyStore.pushSnapshot('操作2')
      historyStore.pushSnapshot('操作3')
      historyStore.pushSnapshot('操作4')

      expect(historyStore.historyStack).toHaveLength(3)
    })
  })

  describe('undo', () => {
    it('应该能撤销操作', () => {
      const track = createTestTrack()
      tracksStore.addTrack(track)

      historyStore.pushSnapshot('添加轨道前')

      const clip = createTestClip(track.id)
      tracksStore.addClip(track.id, clip)

      historyStore.pushSnapshot('添加 clip 后')

      expect(tracksStore.tracks[0].clips).toHaveLength(1)

      historyStore.undo()

      expect(tracksStore.tracks[0].clips).toHaveLength(0)
    })

    it('没有可撤销的操作时不应该报错', () => {
      historyStore.undo()
      expect(historyStore.currentIndex).toBe(-1)
    })
  })

  describe('redo', () => {
    it('应该能重做操作', () => {
      const track = createTestTrack()
      tracksStore.addTrack(track)

      historyStore.pushSnapshot('状态1')

      const clip = createTestClip(track.id)
      tracksStore.addClip(track.id, clip)

      historyStore.pushSnapshot('状态2')

      historyStore.undo()
      expect(tracksStore.tracks[0].clips).toHaveLength(0)

      historyStore.redo()
      expect(tracksStore.tracks[0].clips).toHaveLength(1)
    })

    it('没有可重做的操作时不应该报错', () => {
      historyStore.redo()
      expect(historyStore.currentIndex).toBe(-1)
    })
  })

  describe('initialize', () => {
    it('应该初始化历史并保存初始状态', () => {
      const track = createTestTrack()
      tracksStore.addTrack(track)

      historyStore.initialize()

      expect(historyStore.historyStack).toHaveLength(1)
      expect(historyStore.currentIndex).toBe(0)
      expect(historyStore.historyStack[0].description).toBe('初始状态')
    })
  })

  describe('clear', () => {
    it('应该清空历史', () => {
      historyStore.pushSnapshot('操作1')
      historyStore.pushSnapshot('操作2')

      historyStore.clear()

      expect(historyStore.historyStack).toHaveLength(0)
      expect(historyStore.currentIndex).toBe(-1)
    })
  })

  describe('reset', () => {
    it('应该重置历史（调用 clear）', () => {
      historyStore.pushSnapshot('操作1')

      historyStore.reset()

      expect(historyStore.historyStack).toHaveLength(0)
      expect(historyStore.currentIndex).toBe(-1)
    })
  })

  describe('计算属性', () => {
    it('canUndo 应该在有历史时返回 true', () => {
      historyStore.pushSnapshot('操作1')
      historyStore.pushSnapshot('操作2')
      expect(historyStore.canUndo).toBe(true)
    })

    it('canRedo 应该在有未重做的操作时返回 true', () => {
      historyStore.pushSnapshot('操作1')
      historyStore.pushSnapshot('操作2')
      historyStore.undo()
      expect(historyStore.canRedo).toBe(true)
    })
  })
})
