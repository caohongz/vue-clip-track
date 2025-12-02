# Stores

导出的 Pinia Stores。

```typescript
import {
  useTracksStore,
  usePlaybackStore,
  useHistoryStore,
  useScaleStore,
  useDragStore,
} from 'vue-clip-track'
```

## useTracksStore

轨道和 Clip 数据管理。

```typescript
const tracksStore = useTracksStore()

// 状态
tracksStore.tracks        // 所有轨道
tracksStore.selectedClipIds  // 选中的 Clip IDs

// 方法
tracksStore.addTrack(track)
tracksStore.removeTrack(trackId)
tracksStore.addClip(trackId, clip)
tracksStore.removeClip(clipId)
tracksStore.updateClip(clipId, changes)

// 设置轨道数据（自动规范化 clips 时长）
tracksStore.setTracks(tracks)

// 规范化方法（用于处理带 playbackRate 的 clips）
tracksStore.normalizeTracks(tracks)       // 规范化轨道数组
tracksStore.normalizeClipDuration(clip)   // 规范化单个 clip

// 倍速控制
tracksStore.setClipPlaybackRate(clipId, rate, options)
tracksStore.getClipDurationAtRate(clipId, rate)
tracksStore.checkPlaybackRateCollision(clipId, rate)
tracksStore.calculateTrackDuration(trimStart, trimEnd, playbackRate)
```

::: tip 自动时长修正
`addTrack`、`addClip`、`setTracks` 方法会自动根据 `playbackRate` 修正媒体 clip 的 `endTime`。
详见 [播放倍速指南](/guide/playback-rate)。
:::

## usePlaybackStore

播放状态管理。

```typescript
const playbackStore = usePlaybackStore()

// 状态
playbackStore.isPlaying
playbackStore.currentTime
playbackStore.playbackRate
playbackStore.duration

// 方法
playbackStore.play()
playbackStore.pause()
playbackStore.seekTo(time)
playbackStore.setPlaybackRate(rate)
```

## useHistoryStore

撤销/重做历史管理。

```typescript
const historyStore = useHistoryStore()

// 状态
historyStore.canUndo
historyStore.canRedo

// 方法
historyStore.undo()
historyStore.redo()
historyStore.pushState(state)
historyStore.clear()
```

## useScaleStore

缩放和吸附管理。

```typescript
const scaleStore = useScaleStore()

// 状态
scaleStore.scale
scaleStore.snapEnabled
scaleStore.pixelsPerSecond

// 方法
scaleStore.setScale(scale)
scaleStore.zoomIn()
scaleStore.zoomOut()
scaleStore.enableSnap()
scaleStore.disableSnap()
```

## useDragStore

拖拽状态管理。

```typescript
const dragStore = useDragStore()

// 状态
dragStore.isDragging
dragStore.draggedClip
dragStore.dragOffset
```
