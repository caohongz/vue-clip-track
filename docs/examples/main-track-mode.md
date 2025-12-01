# 主轨道模式

启用主轨道模式的示例。

## 基本用法

```vue
<template>
  <VideoTrack
    :enable-main-track-mode="true"
    :track-types="trackTypes"
  />
</template>

<script setup>
const trackTypes = {
  video: { max: 1 },  // 主轨道只有一个视频轨道
  audio: { max: 3 },
  subtitle: { max: 2 },
}
</script>
```

## 主轨道特性

- 主视频轨道始终存在
- 其他轨道的内容围绕主轨道时间轴
- 适合传统视频编辑场景

## 获取主轨道

```typescript
const mainTrack = videoTrackRef.value.getMainTrack()
console.log(mainTrack.id, mainTrack.clips)
```
