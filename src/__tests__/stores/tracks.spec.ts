import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTracksStore } from '../../stores/tracks'
import type { Track, Clip, MediaClip } from '@/types'

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

describe('useTracksStore', () => {
  let store: ReturnType<typeof useTracksStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useTracksStore()
  })

  describe('初始状态', () => {
    it('应该有空的轨道数组', () => {
      expect(store.tracks).toEqual([])
    })

    it('应该有空的选中集合', () => {
      expect(store.selectedClipIds.size).toBe(0)
    })

    it('应该有空的剪贴板', () => {
      expect(store.clipboard.clips).toEqual([])
      expect(store.clipboard.operation).toBeNull()
    })
  })

  describe('轨道操作', () => {
    describe('addTrack', () => {
      it('应该能添加轨道', () => {
        const track = createTestTrack()
        store.addTrack(track)
        expect(store.tracks).toHaveLength(1)
        expect(store.tracks[0]).toEqual(track)
      })

      it('应该能添加多个轨道', () => {
        const track1 = createTestTrack({ name: 'Track 1' })
        const track2 = createTestTrack({ name: 'Track 2' })
        store.addTrack(track1)
        store.addTrack(track2)
        expect(store.tracks).toHaveLength(2)
      })
    })

    describe('removeTrack', () => {
      it('应该能删除轨道', () => {
        const track = createTestTrack()
        store.addTrack(track)
        store.removeTrack(track.id)
        expect(store.tracks).toHaveLength(0)
      })

      it('删除不存在的轨道应该不报错', () => {
        store.removeTrack('non-existent')
        expect(store.tracks).toHaveLength(0)
      })
    })

    describe('updateTrack', () => {
      it('应该能更新轨道属性', () => {
        const track = createTestTrack({ name: 'Original' })
        store.addTrack(track)
        store.updateTrack(track.id, { name: 'Updated' })
        expect(store.tracks[0].name).toBe('Updated')
      })

      it('更新不存在的轨道应该不报错', () => {
        store.updateTrack('non-existent', { name: 'Updated' })
        expect(store.tracks).toHaveLength(0)
      })
    })

    describe('addTrackAbove', () => {
      it('应该能在指定轨道上方添加轨道', () => {
        const track = createTestTrack({ order: 0 })
        store.addTrack(track)
        const newTrack = store.addTrackAbove(track.id, 'audio')
        expect(newTrack).not.toBeNull()
        expect(newTrack?.type).toBe('audio')
        expect(store.tracks).toHaveLength(2)
      })

      it('添加到不存在轨道的上方应该返回 null', () => {
        const result = store.addTrackAbove('non-existent', 'audio')
        expect(result).toBeNull()
      })
    })

    describe('addTrackBelow', () => {
      it('应该能在指定轨道下方添加轨道', () => {
        const track = createTestTrack({ order: 0 })
        store.addTrack(track)
        const newTrack = store.addTrackBelow(track.id, 'audio')
        expect(newTrack).not.toBeNull()
        expect(newTrack?.type).toBe('audio')
        expect(store.tracks).toHaveLength(2)
      })

      it('添加到不存在轨道的下方应该返回 null', () => {
        const result = store.addTrackBelow('non-existent', 'audio')
        expect(result).toBeNull()
      })
    })

    describe('getTrackCountByType', () => {
      it('应该返回指定类型轨道的数量', () => {
        store.addTrack(createTestTrack({ type: 'video' }))
        store.addTrack(createTestTrack({ type: 'video' }))
        store.addTrack(createTestTrack({ type: 'audio' }))
        expect(store.getTrackCountByType('video')).toBe(2)
        expect(store.getTrackCountByType('audio')).toBe(1)
        expect(store.getTrackCountByType('subtitle')).toBe(0)
      })
    })
  })

  describe('Clip 操作', () => {
    let track: Track

    beforeEach(() => {
      track = createTestTrack()
      store.addTrack(track)
    })

    describe('addClip', () => {
      it('应该能添加 clip', () => {
        const clip = createTestClip(track.id)
        store.addClip(track.id, clip)
        expect(store.tracks[0].clips).toHaveLength(1)
        expect(store.tracks[0].clips[0]).toEqual(clip)
      })

      it('添加到不存在的轨道应该不报错', () => {
        const clip = createTestClip('non-existent')
        store.addClip('non-existent', clip)
        expect(store.tracks[0].clips).toHaveLength(0)
      })
    })

    describe('removeClip', () => {
      it('应该能删除 clip', () => {
        const clip = createTestClip(track.id)
        store.addClip(track.id, clip)
        store.removeClip(clip.id)
        expect(store.tracks[0].clips).toHaveLength(0)
      })

      it('应该同时从选中集合中移除', () => {
        const clip = createTestClip(track.id)
        store.addClip(track.id, clip)
        store.selectClip(clip.id)
        store.removeClip(clip.id)
        expect(store.selectedClipIds.has(clip.id)).toBe(false)
      })
    })

    describe('removeClips', () => {
      it('应该能批量删除 clips', () => {
        const clip1 = createTestClip(track.id)
        const clip2 = createTestClip(track.id)
        store.addClip(track.id, clip1)
        store.addClip(track.id, clip2)
        store.removeClips([clip1.id, clip2.id])
        expect(store.tracks[0].clips).toHaveLength(0)
      })
    })

    describe('updateClip', () => {
      it('应该能更新 clip 属性', () => {
        const clip = createTestClip(track.id, { name: 'Original' })
        store.addClip(track.id, clip)
        store.updateClip(clip.id, { name: 'Updated' })
        expect(store.tracks[0].clips[0].name).toBe('Updated')
      })
    })

    describe('moveClipToTrack', () => {
      it('应该能将 clip 移动到其他轨道', () => {
        const track2 = createTestTrack({ name: 'Track 2' })
        store.addTrack(track2)

        const clip = createTestClip(track.id)
        store.addClip(track.id, clip)

        store.moveClipToTrack(clip.id, track2.id)

        expect(store.tracks[0].clips).toHaveLength(0)
        expect(store.tracks[1].clips).toHaveLength(1)
        expect(store.tracks[1].clips[0].trackId).toBe(track2.id)
      })
    })

    describe('getClip', () => {
      it('应该能获取指定的 clip', () => {
        const clip = createTestClip(track.id)
        store.addClip(track.id, clip)
        const foundClip = store.getClip(clip.id)
        expect(foundClip).toEqual(clip)
      })

      it('获取不存在的 clip 应该返回 undefined', () => {
        const foundClip = store.getClip('non-existent')
        expect(foundClip).toBeUndefined()
      })
    })
  })

  describe('选择操作', () => {
    let track: Track
    let clip: MediaClip

    beforeEach(() => {
      track = createTestTrack()
      store.addTrack(track)
      clip = createTestClip(track.id)
      store.addClip(track.id, clip)
    })

    describe('selectClip', () => {
      it('应该能选中 clip', () => {
        store.selectClip(clip.id)
        expect(store.selectedClipIds.has(clip.id)).toBe(true)
      })

      it('默认应该清除之前的选择', () => {
        const clip2 = createTestClip(track.id)
        store.addClip(track.id, clip2)

        store.selectClip(clip.id)
        store.selectClip(clip2.id)

        expect(store.selectedClipIds.size).toBe(1)
        expect(store.selectedClipIds.has(clip2.id)).toBe(true)
      })

      it('append=true 时应该追加选择', () => {
        const clip2 = createTestClip(track.id)
        store.addClip(track.id, clip2)

        store.selectClip(clip.id)
        store.selectClip(clip2.id, true)

        expect(store.selectedClipIds.size).toBe(2)
      })
    })

    describe('toggleClipSelection', () => {
      it('应该能切换 clip 选中状态', () => {
        store.toggleClipSelection(clip.id)
        expect(store.selectedClipIds.has(clip.id)).toBe(true)

        store.toggleClipSelection(clip.id)
        expect(store.selectedClipIds.has(clip.id)).toBe(false)
      })
    })

    describe('deselectClip', () => {
      it('应该能取消选中 clip', () => {
        store.selectClip(clip.id)
        store.deselectClip(clip.id)
        expect(store.selectedClipIds.has(clip.id)).toBe(false)
      })
    })

    describe('clearSelection', () => {
      it('应该能清空所有选择', () => {
        const clip2 = createTestClip(track.id)
        store.addClip(track.id, clip2)

        store.selectClip(clip.id, true)
        store.selectClip(clip2.id, true)
        store.clearSelection()

        expect(store.selectedClipIds.size).toBe(0)
      })
    })
  })

  describe('碰撞检测', () => {
    let track: Track

    beforeEach(() => {
      track = createTestTrack()
      store.addTrack(track)
    })

    describe('hasOverlap', () => {
      it('应该检测重叠', () => {
        const clip = createTestClip(track.id, { startTime: 0, endTime: 5 })
        store.addClip(track.id, clip)

        expect(store.hasOverlap(track.id, 3, 8)).toBe(true)
        expect(store.hasOverlap(track.id, 5, 10)).toBe(false)
        expect(store.hasOverlap(track.id, -5, 0)).toBe(false)
      })

      it('应该支持排除指定 clip', () => {
        const clip = createTestClip(track.id, { startTime: 0, endTime: 5 })
        store.addClip(track.id, clip)

        expect(store.hasOverlap(track.id, 0, 5, clip.id)).toBe(false)
      })

      it('轨道不存在时应该返回 false', () => {
        expect(store.hasOverlap('non-existent', 0, 5)).toBe(false)
      })
    })
  })

  describe('剪贴板操作', () => {
    let track: Track
    let clip: MediaClip

    beforeEach(() => {
      track = createTestTrack()
      store.addTrack(track)
      clip = createTestClip(track.id, { startTime: 0, endTime: 5 })
      store.addClip(track.id, clip)
    })

    describe('copyClips', () => {
      it('应该能复制选中的 clips', () => {
        store.selectClip(clip.id)
        const result = store.copyClips()
        expect(result).toBe(true)
        expect(store.clipboard.clips).toHaveLength(1)
        expect(store.clipboard.operation).toBe('copy')
      })

      it('应该能复制指定的 clips', () => {
        const result = store.copyClips([clip.id])
        expect(result).toBe(true)
        expect(store.clipboard.clips).toHaveLength(1)
      })

      it('没有选中时应该返回 false', () => {
        const result = store.copyClips()
        expect(result).toBe(false)
      })
    })

    describe('cutClips', () => {
      it('应该能剪切选中的 clips', () => {
        store.selectClip(clip.id)
        const result = store.cutClips()
        expect(result).toBe(true)
        expect(store.clipboard.clips).toHaveLength(1)
        expect(store.clipboard.operation).toBe('cut')
      })

      it('没有选中时应该返回 false', () => {
        const result = store.cutClips()
        expect(result).toBe(false)
      })
    })

    describe('pasteClips', () => {
      it('应该能粘贴 clips', () => {
        store.copyClips([clip.id])
        const pasted = store.pasteClips(track.id, 10)
        expect(pasted).not.toBeNull()
        expect(pasted).toHaveLength(1)
        expect(store.tracks[0].clips).toHaveLength(2)
      })

      it('剪切后粘贴应该删除原 clips', () => {
        store.cutClips([clip.id])
        const pasted = store.pasteClips(track.id, 10)
        expect(pasted).not.toBeNull()
        // 原 clip 被删除，新 clip 被添加
        expect(store.tracks[0].clips).toHaveLength(1)
        expect(store.tracks[0].clips[0].startTime).toBe(10)
      })

      it('剪贴板为空时应该返回 null', () => {
        const pasted = store.pasteClips(track.id, 0)
        expect(pasted).toBeNull()
      })

      it('目标轨道不存在时应该返回 null', () => {
        store.copyClips([clip.id])
        const pasted = store.pasteClips('non-existent', 0)
        expect(pasted).toBeNull()
      })
    })

    describe('hasClipboardContent', () => {
      it('剪贴板有内容时应该返回 true', () => {
        store.copyClips([clip.id])
        expect(store.hasClipboardContent()).toBe(true)
      })

      it('剪贴板为空时应该返回 false', () => {
        expect(store.hasClipboardContent()).toBe(false)
      })
    })

    describe('clearClipboard', () => {
      it('应该清空剪贴板', () => {
        store.copyClips([clip.id])
        store.clearClipboard()
        expect(store.clipboard.clips).toHaveLength(0)
        expect(store.clipboard.operation).toBeNull()
      })
    })
  })

  describe('计算属性', () => {
    describe('mainTrack', () => {
      it('应该返回主轨道', () => {
        const mainTrack = createTestTrack({ isMain: true })
        store.addTrack(mainTrack)
        expect(store.mainTrack).toEqual(mainTrack)
      })

      it('没有主轨道时应该返回 undefined', () => {
        expect(store.mainTrack).toBeUndefined()
      })
    })

    describe('sortedTracks', () => {
      it('应该按类型权重排序轨道', () => {
        const effectTrack = createTestTrack({ type: 'effect', order: 0 })
        const videoTrack = createTestTrack({ type: 'video', order: 1 })
        const audioTrack = createTestTrack({ type: 'audio', order: 2 })
        const mainTrack = createTestTrack({ type: 'video', isMain: true, order: 3 })

        store.addTrack(audioTrack)
        store.addTrack(mainTrack)
        store.addTrack(videoTrack)
        store.addTrack(effectTrack)

        const sorted = store.sortedTracks
        expect(sorted[0].type).toBe('effect')
        expect(sorted[sorted.length - 1].type).toBe('audio')
      })
    })

    describe('totalDuration', () => {
      it('应该返回所有 clips 的最大结束时间', () => {
        const track = createTestTrack()
        store.addTrack(track)

        const clip1 = createTestClip(track.id, { startTime: 0, endTime: 5 })
        const clip2 = createTestClip(track.id, { startTime: 10, endTime: 20 })

        store.addClip(track.id, clip1)
        store.addClip(track.id, clip2)

        expect(store.totalDuration).toBe(20)
      })

      it('没有 clips 时应该返回 0', () => {
        expect(store.totalDuration).toBe(0)
      })
    })

    describe('selectedClips', () => {
      it('应该返回选中的 clips', () => {
        const track = createTestTrack()
        store.addTrack(track)

        const clip1 = createTestClip(track.id)
        const clip2 = createTestClip(track.id)

        store.addClip(track.id, clip1)
        store.addClip(track.id, clip2)

        store.selectClip(clip1.id, true)
        store.selectClip(clip2.id, true)

        expect(store.selectedClips).toHaveLength(2)
      })
    })
  })

  describe('其他方法', () => {
    describe('reset', () => {
      it('应该重置所有状态', () => {
        const track = createTestTrack()
        store.addTrack(track)
        const clip = createTestClip(track.id)
        store.addClip(track.id, clip)
        store.selectClip(clip.id)

        store.reset()

        expect(store.tracks).toHaveLength(0)
        expect(store.selectedClipIds.size).toBe(0)
      })
    })

    describe('cleanupEmptyTracks', () => {
      it('应该删除没有 clips 的非主轨道', () => {
        const emptyTrack = createTestTrack({ name: 'Empty' })
        const mainTrack = createTestTrack({ name: 'Main', isMain: true })
        const trackWithClip = createTestTrack({ name: 'With Clip' })

        store.addTrack(emptyTrack)
        store.addTrack(mainTrack)
        store.addTrack(trackWithClip)

        const clip = createTestClip(trackWithClip.id)
        store.addClip(trackWithClip.id, clip)

        store.cleanupEmptyTracks()

        expect(store.tracks).toHaveLength(2)
        expect(store.tracks.some((t) => t.name === 'Empty')).toBe(false)
        expect(store.tracks.some((t) => t.isMain)).toBe(true)
      })

      it('不应该删除主轨道，即使为空', () => {
        const mainTrack = createTestTrack({ isMain: true })
        store.addTrack(mainTrack)

        store.cleanupEmptyTracks()

        expect(store.tracks).toHaveLength(1)
      })
    })
  })
})
