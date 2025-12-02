# 播放倍速

本指南介绍如何处理媒体 Clip（视频/音频）的播放倍速。

## 基本概念

播放倍速 (`playbackRate`) 会影响媒体内容在轨道上显示的时长：

- **倍速 > 1**：快速播放，轨道时长 < 媒体时长
- **倍速 < 1**：慢速播放，轨道时长 > 媒体时长
- **倍速 = 1**：正常播放，轨道时长 = 媒体时长

### 时长计算公式

```
轨道时长 = (trimEnd - trimStart) / playbackRate
```

例如，一个裁剪后 5 秒的视频：
- 1x 倍速 → 轨道时长 5 秒
- 1.5x 倍速 → 轨道时长 3.33 秒
- 0.5x 倍速 → 轨道时长 10 秒

## 自动时长修正

组件会在以下场景自动根据 `playbackRate` 修正 `endTime`：

### 1. 添加轨道时

通过 `addTrack` 添加包含 clips 的轨道时，会自动修正每个 clip 的时长：

```typescript
videoTrackRef.value.addTrack({
  id: 'track-1',
  type: 'video',
  name: '视频轨道',
  clips: [
    {
      id: 'clip-1',
      type: 'video',
      startTime: 0,
      endTime: 10,  // ⚠️ 这个值会被自动修正
      trimStart: 0,
      trimEnd: 5,
      playbackRate: 2,  // 2倍速
      // ...其他属性
    }
  ]
})
// clip 的 endTime 会被自动修正为 2.5 (= 5 / 2)
```

### 2. 添加 Clip 时

通过 `addClip` 添加单个 clip 时，同样会自动修正：

```typescript
videoTrackRef.value.addClip('track-1', {
  id: 'clip-2',
  type: 'video',
  startTime: 5,
  endTime: 15,  // ⚠️ 这个值会被自动修正
  trimStart: 0,
  trimEnd: 10,
  playbackRate: 0.5,  // 0.5倍速（慢放）
  // ...
})
// clip 的 endTime 会被自动修正为 25 (= 5 + 10 / 0.5)
```

### 3. 导入数据时

通过 `importData` 导入项目数据时，也会自动修正：

```typescript
videoTrackRef.value.importData({
  tracks: [
    {
      id: 'track-1',
      clips: [
        {
          // clips 的 endTime 会被自动修正
        }
      ]
    }
  ]
})
```

## 动态调整倍速

要在运行时调整已存在 clip 的播放倍速，请使用 `setClipPlaybackRate` 方法：

```typescript
const result = videoTrackRef.value.setClipPlaybackRate(clipId, 1.5, {
  allowShrink: true,      // 允许缩短时长
  allowExpand: true,      // 允许扩展时长
  handleCollision: true,  // 自动处理碰撞（推挤后续 clips）
  keepStartTime: true     // 保持开始位置不变
})

if (result.success) {
  console.log('倍速调整成功')
} else {
  console.warn('调整失败:', result.message)
}
```

### 配置选项

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `allowShrink` | `boolean` | `true` | 是否允许缩短时长（倍速 > 当前） |
| `allowExpand` | `boolean` | `true` | 是否允许扩展时长（倍速 < 当前） |
| `handleCollision` | `boolean` | `true` | 是否自动处理与其他 clip 的碰撞 |
| `keepStartTime` | `boolean` | `true` | 是否保持 clip 开始位置不变 |

### 返回值

```typescript
interface SetPlaybackRateResult {
  success: boolean
  message?: string              // 失败原因
  removedTransitions?: string[] // 被删除的转场 IDs
  adjustedClips?: Array<{       // 被推挤的 clips
    id: string
    startTime: number
    endTime: number
  }>
}
```

## 辅助方法

### 预览倍速调整结果

在调整前预览新倍速下的时长：

```typescript
const newDuration = videoTrackRef.value.getClipDurationAtRate(clipId, 1.5)
console.log(`1.5x 倍速下的时长: ${newDuration}秒`)
```

### 检测碰撞

在调整前检测是否会与其他 clip 碰撞：

```typescript
const collision = videoTrackRef.value.checkPlaybackRateCollision(clipId, 1.5)
if (collision.willCollide) {
  console.warn('会与以下 clips 碰撞:', collision.collidingClipIds)
}
```

## 使用 Store 直接操作

如果你直接使用 `useTracksStore`，可以使用以下方法：

```typescript
import { useTracksStore } from 'vue-clip-track'

const tracksStore = useTracksStore()

// 设置轨道数据（自动规范化时长）
tracksStore.setTracks(tracksData)

// 规范化轨道数据
const normalizedTracks = tracksStore.normalizeTracks(tracksData)

// 规范化单个 clip
const normalizedClip = tracksStore.normalizeClipDuration(clip)

// 计算轨道时长
const duration = tracksStore.calculateTrackDuration(trimStart, trimEnd, playbackRate)
```

## 注意事项

::: warning 直接修改 playbackRate 不会更新时长
使用 `updateClip` 直接修改 `playbackRate` **不会**自动更新 `endTime`：

```typescript
// ❌ 错误用法：时长不会更新
videoTrackRef.value.updateClip(clipId, { playbackRate: 2 })

// ✅ 正确用法：使用专用方法
videoTrackRef.value.setClipPlaybackRate(clipId, 2)
```
:::

::: tip 倍速范围限制
`setClipPlaybackRate` 方法限制倍速范围为 **0.25 ~ 4**。如需更大范围，请直接计算 `endTime` 后使用 `updateClip`。
:::

## 完整示例

```vue
<template>
  <div>
    <VideoTrack ref="videoTrackRef" />
    <div class="controls">
      <select v-model="playbackRate" @change="updatePlaybackRate">
        <option :value="0.5">0.5x</option>
        <option :value="1">1x</option>
        <option :value="1.5">1.5x</option>
        <option :value="2">2x</option>
      </select>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { VideoTrack } from 'vue-clip-track'

const videoTrackRef = ref()
const playbackRate = ref(1)
const selectedClipId = ref(null)

function updatePlaybackRate() {
  if (!selectedClipId.value) return
  
  const result = videoTrackRef.value.setClipPlaybackRate(
    selectedClipId.value,
    playbackRate.value,
    {
      allowShrink: true,
      allowExpand: true,
      handleCollision: true,
      keepStartTime: true
    }
  )
  
  if (!result.success) {
    alert(`调整失败: ${result.message}`)
    // 恢复原值
    const clip = videoTrackRef.value.getClipById(selectedClipId.value)
    playbackRate.value = clip?.playbackRate || 1
  }
}
</script>
```
