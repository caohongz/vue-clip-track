
import { useTracksStore } from '@/stores/tracks'
import type { Clip } from '@/types'

export function useSelection() {
  const tracksStore = useTracksStore()

  // 处理 Clip 点击（支持多选）
  function handleClipClick(clip: Clip, event: MouseEvent) {
    if (event.ctrlKey || event.metaKey) {
      // Ctrl/Cmd + 点击：切换选中状态
      tracksStore.toggleClipSelection(clip.id)
    } else if (event.shiftKey) {
      // Shift + 点击：范围选择
      handleRangeSelection(clip)
    } else {
      // 普通点击：单选
      tracksStore.clearSelection()
      tracksStore.selectClip(clip.id)
    }
  }

  // 处理范围选择
  function handleRangeSelection(endClip: Clip) {
    const selectedClips = tracksStore.selectedClips
    if (selectedClips.length === 0) {
      tracksStore.selectClip(endClip.id)
      return
    }

    const startClip = selectedClips[0]

    // 找到同一轨道的所有 clips
    const track = tracksStore.tracks.find((t) =>
      t.clips.some((c) => c.id === startClip.id)
    )
    if (!track) return

    const startIndex = track.clips.findIndex((c) => c.id === startClip.id)
    const endIndex = track.clips.findIndex((c) => c.id === endClip.id)

    if (startIndex === -1 || endIndex === -1) return

    const minIndex = Math.min(startIndex, endIndex)
    const maxIndex = Math.max(startIndex, endIndex)

    // 选中范围内的所有 clips
    for (let i = minIndex; i <= maxIndex; i++) {
      tracksStore.selectClip(track.clips[i].id, true)
    }
  }

  return {
    handleClipClick
  }
}

