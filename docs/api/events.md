# Events

组件触发的事件列表。

## Clip 事件

| 事件名 | 参数 | 说明 |
|--------|------|------|
| `clipMove` | `(clipId, trackId, startTime)` | 移动 |
| `clipDelete` | `(clipId)` | 删除 |
| `clipSelect` | `(clipIds)` | 选中 |
| `clipCopy` | `(clipIds)` | 复制 |
| `clipCut` | `(clipIds)` | 剪切 |
| `clipPaste` | `(clips, trackId, time)` | 粘贴 |
| `clipSplit` | `(originalClipId, leftClip, rightClip, splitTime)` | 分割 |

## Clip 生命周期事件

| 事件名 | 参数 | 说明 |
|--------|------|------|
| `clip:added` | `(clip, trackId)` | 添加后 |
| `clip:updated` | `(clipId, changes, oldValues)` | 更新后 |
| `clip:removed` | `(clip, trackId)` | 移除后 |
| `clip:resize-start` | `(clip, edge)` | 开始调整大小 |
| `clip:resize-end` | `(clip, oldStartTime, oldEndTime)` | 结束调整大小 |
| `clip:drag-start` | `(clip)` | 开始拖拽 |
| `clip:drag-end` | `(clip, fromTrackId, toTrackId)` | 结束拖拽 |

## Track 事件

| 事件名 | 参数 | 说明 |
|--------|------|------|
| `trackCreate` | `(trackId)` | 创建 |
| `trackDelete` | `(trackId)` | 删除 |
| `track:added` | `(track)` | 添加后 |
| `track:removed` | `(track)` | 移除后 |
| `track:updated` | `(trackId, changes)` | 更新后 |

## 选择事件

| 事件名 | 参数 | 说明 |
|--------|------|------|
| `selection:changed` | `(selectedIds, previousIds)` | 选择变化 |

## 播放事件

| 事件名 | 参数 | 说明 |
|--------|------|------|
| `playback:play` | - | 播放 |
| `playback:pause` | - | 暂停 |
| `playback:seek` | `(time)` | 跳转 |
| `playback:timeupdate` | `(time)` | 时间更新 |
| `playback:ratechange` | `(rate)` | 速率变化 |

## 其他事件

| 事件名 | 参数 | 说明 |
|--------|------|------|
| `scale:changed` | `(scale)` | 缩放变化 |
| `history:changed` | `({ canUndo, canRedo })` | 历史变化 |
| `addTransition` | `(beforeClipId, afterClipId)` | 请求添加转场 |
| `transitionAdded` | `(transitionClip, beforeClipId, afterClipId)` | 转场已添加 |
| `dropMedia` | `(mediaData, trackId, startTime)` | 拖放媒体 |
| `data:changed` | - | 数据变化 |
