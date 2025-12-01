# 轨道与片段

## 轨道（Track）

轨道是时间轴上的水平容器，每个轨道可以承载特定类型的片段。

### 轨道类型

| 类型 | 说明 |
|------|------|
| `video` | 视频轨道，支持视频片段和转场 |
| `audio` | 音频轨道，支持音频波形显示 |
| `subtitle` | 字幕轨道 |
| `text` | 文本轨道 |
| `sticker` | 贴纸轨道 |
| `filter` | 滤镜轨道 |
| `effect` | 特效轨道 |

### 配置轨道数量

通过 `trackTypes` prop 配置各类型轨道的最大数量：

```vue
<template>
  <VideoTrack :track-types="trackTypes" />
</template>

<script setup>
const trackTypes = {
  video: { max: 5 },   // 最多 5 个视频轨道
  audio: { max: 3 },   // 最多 3 个音频轨道
  subtitle: { max: 2 } // 最多 2 个字幕轨道
}
</script>
```

### 轨道操作

```typescript
// 添加轨道
videoTrackRef.value.addTrack({
  id: 'video-1',
  type: 'video',
  name: '视频轨道 1',
  clips: []
})

// 删除轨道
videoTrackRef.value.removeTrack('video-1')

// 获取所有轨道
const tracks = videoTrackRef.value.getTracks()

// 获取指定轨道
const track = videoTrackRef.value.getTrackById('video-1')
```

## 片段（Clip）

片段是放置在轨道上的内容单元，具有开始时间、结束时间和各种属性。

### 片段类型

根据轨道类型，片段分为以下几种：

#### MediaClip（媒体片段）

用于视频和音频轨道：

```typescript
interface MediaClip {
  id: string
  type: 'video' | 'audio'
  name: string
  startTime: number      // 在轨道上的开始时间（秒）
  endTime: number        // 在轨道上的结束时间（秒）
  source: string         // 媒体源 URL
  sourceStartTime: number // 媒体裁剪开始时间
  sourceEndTime: number   // 媒体裁剪结束时间
  thumbnails?: string[]   // 视频缩略图
  waveform?: number[]     // 音频波形数据
}
```

#### SubtitleClip（字幕片段）

```typescript
interface SubtitleClip {
  id: string
  type: 'subtitle'
  name: string
  startTime: number
  endTime: number
  text: string           // 字幕文本
  style?: SubtitleStyle  // 字幕样式
}
```

#### TransitionClip（转场片段）

```typescript
interface TransitionClip {
  id: string
  type: 'transition'
  name: string
  transitionType: string  // 转场类型
  duration: number        // 转场时长
}
```

### 片段操作

```typescript
// 添加片段
videoTrackRef.value.addClip('video-1', {
  id: 'clip-1',
  type: 'video',
  name: '视频片段',
  startTime: 0,
  endTime: 10,
  source: '/path/to/video.mp4',
  sourceStartTime: 0,
  sourceEndTime: 10
})

// 更新片段
videoTrackRef.value.updateClip('clip-1', {
  name: '新名称',
  endTime: 15
})

// 移动片段到其他轨道
videoTrackRef.value.moveClip('clip-1', 'video-2', 5)

// 删除片段
videoTrackRef.value.removeClip('clip-1')

// 获取片段
const clip = videoTrackRef.value.getClipById('clip-1')
```

### 选择片段

```typescript
// 选中单个片段
videoTrackRef.value.selectClip('clip-1')

// 选中多个片段
videoTrackRef.value.selectClips(['clip-1', 'clip-2'])

// 清空选择
videoTrackRef.value.clearSelection()

// 获取选中的片段
const selectedClips = videoTrackRef.value.getSelectedClips()
```

## 跨轨道拖拽

启用 `enableCrossTrackDrag` 后，可以将片段拖拽到同类型的其他轨道：

```vue
<VideoTrack :enable-cross-track-drag="true" />
```

## 吸附功能

启用 `enableSnap` 后，片段在移动和调整大小时会自动吸附到其他片段的边界：

```vue
<VideoTrack 
  :enable-snap="true" 
  :snap-threshold="10"  <!-- 吸附阈值（像素） -->
/>
```

## 主轨道模式

启用主轨道模式后，会有一个主要的视频轨道，其他内容围绕主轨道组织：

```vue
<VideoTrack :enable-main-track-mode="true" />
```
