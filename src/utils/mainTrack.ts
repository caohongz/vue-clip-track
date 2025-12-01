import type { Track, Clip } from '@/types'

// 主轨道连续排列处理

// 插入 Clip 到主轨道
export function insertClipToMainTrack(track: Track, clip: Clip, insertTime: number): void {
  // 找到插入位置
  const insertIndex = track.clips.findIndex((c) => c.startTime >= insertTime)

  if (insertIndex === -1) {
    // 插入到末尾
    const lastClip = track.clips[track.clips.length - 1]
    const newStartTime = lastClip ? lastClip.endTime : 0
    clip.startTime = newStartTime
    clip.endTime = newStartTime + (clip.endTime - clip.startTime)
    track.clips.push(clip)
  } else {
    // 插入到中间，需要将后面的 clips 往后移
    const duration = clip.endTime - clip.startTime
    clip.startTime = insertTime
    clip.endTime = insertTime + duration

    // 将插入位置及之后的所有 clips 往后移动
    for (let i = insertIndex; i < track.clips.length; i++) {
      const c = track.clips[i]
      const cDuration = c.endTime - c.startTime
      c.startTime += duration
      c.endTime = c.startTime + cDuration
    }

    track.clips.splice(insertIndex, 0, clip)
  }
}

// 从主轨道移除 Clip
export function removeClipFromMainTrack(track: Track, clipId: string): void {
  const clipIndex = track.clips.findIndex((c) => c.id === clipId)
  if (clipIndex === -1) return

  const clip = track.clips[clipIndex]
  const duration = clip.endTime - clip.startTime

  // 移除 clip
  track.clips.splice(clipIndex, 1)

  // 将后面的 clips 往前移动
  for (let i = clipIndex; i < track.clips.length; i++) {
    const c = track.clips[i]
    const cDuration = c.endTime - c.startTime
    c.startTime -= duration
    c.endTime = c.startTime + cDuration
  }
}

// 更新主轨道中 Clip 的位置
export function updateClipInMainTrack(
  track: Track,
  clipId: string,
  newStartTime: number
): void {
  const clipIndex = track.clips.findIndex((c) => c.id === clipId)
  if (clipIndex === -1) return

  const clip = track.clips[clipIndex]
  const oldStartTime = clip.startTime
  const duration = clip.endTime - clip.startTime

  if (newStartTime === oldStartTime) return

  // 移除 clip
  track.clips.splice(clipIndex, 1)

  // 重新插入
  insertClipToMainTrack(track, clip, newStartTime)
}

// 确保主轨道 clips 连续排列
export function ensureMainTrackContinuity(track: Track): void {
  if (!track.isMain || track.clips.length === 0) return

  // 按 startTime 排序
  track.clips.sort((a, b) => a.startTime - b.startTime)

  // 确保从 0 开始，且连续无间隙
  let currentTime = 0
  for (const clip of track.clips) {
    const duration = clip.endTime - clip.startTime
    clip.startTime = currentTime
    clip.endTime = currentTime + duration
    currentTime += duration
  }
}

