# 实例方法

通过 `ref` 获取组件实例后可调用的方法。

## 基础操作

```typescript
// 重置
videoTrackRef.value.reset()

// 注册自定义 Clip 类型
videoTrackRef.value.registerClipType('custom', CustomComponent)
```

## 数据导入/导出

```typescript
// 导出数据
const data = videoTrackRef.value.exportData()

// 导入数据
videoTrackRef.value.importData(data)

// JSON 格式
const json = videoTrackRef.value.exportAsJSON()
videoTrackRef.value.importFromJSON(json)
```

## 轨道操作

```typescript
// 增删改查
videoTrackRef.value.addTrack(track)
videoTrackRef.value.removeTrack(trackId)
videoTrackRef.value.updateTrack(trackId, changes)

// 获取
videoTrackRef.value.getTracks()
videoTrackRef.value.getSortedTracks()
videoTrackRef.value.getTrackById(trackId)
videoTrackRef.value.getMainTrack()
```

## Clip 操作

```typescript
// 增删改
videoTrackRef.value.addClip(trackId, clip)
videoTrackRef.value.removeClip(clipId)
videoTrackRef.value.updateClip(clipId, changes)
videoTrackRef.value.moveClip(clipId, targetTrackId, newStartTime)

// 获取
videoTrackRef.value.getClipById(clipId)
```

### updateClip 深度合并

`updateClip` 方法支持深度合并嵌套对象，无需手动展开原有属性：

```typescript
// ✅ 只更新 rect.angle，保留其他属性（x, y, w, h）
videoTrackRef.value.updateClip(clipId, {
  rect: { angle: Math.PI / 4 }
})

// ✅ 只更新 time.playbackRate，保留 offset 和 duration
videoTrackRef.value.updateClip(clipId, {
  time: { playbackRate: 2 }
})

// ✅ 同时更新多个嵌套属性
videoTrackRef.value.updateClip(clipId, {
  rect: { x: 100, y: 100 },
  opacity: 0.8,
  visible: true
})

// ⚠️ 数组会被完全替换（不会合并）
videoTrackRef.value.updateClip(clipId, {
  animations: [newAnimation] // 替换整个 animations 数组
})
```

## 选择操作

```typescript
videoTrackRef.value.selectClip(clipId)
videoTrackRef.value.selectClips(clipIds)
videoTrackRef.value.clearSelection()
videoTrackRef.value.getSelectedClips()
videoTrackRef.value.getSelectedClipIds()
```

## 播放控制

```typescript
videoTrackRef.value.play()
videoTrackRef.value.pause()
videoTrackRef.value.togglePlay()
videoTrackRef.value.seekTo(time)
videoTrackRef.value.getCurrentTime()
videoTrackRef.value.setPlaybackRate(rate)
videoTrackRef.value.getPlaybackRate()
videoTrackRef.value.isPlaying()
videoTrackRef.value.getDuration()
```

## 缩放控制

```typescript
videoTrackRef.value.setScale(scale)
videoTrackRef.value.getScale()
videoTrackRef.value.zoomIn()
videoTrackRef.value.zoomOut()
videoTrackRef.value.enableSnap()
videoTrackRef.value.disableSnap()
videoTrackRef.value.isSnapEnabled()
```

## 历史操作

```typescript
videoTrackRef.value.undo()
videoTrackRef.value.redo()
videoTrackRef.value.getHistoryState()
// 返回 { canUndo: boolean, canRedo: boolean }
```
