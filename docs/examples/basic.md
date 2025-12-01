# 基础用法

最简单的使用示例。

## 基本示例

```vue
<template>
  <div class="editor">
    <VideoTrack
      ref="videoTrackRef"
      :track-types="trackTypes"
      :enable-snap="true"
      @clip-select="onSelect"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { VideoTrack } from 'vue-clip-track'
import 'vue-clip-track/style.css'

const videoTrackRef = ref()

const trackTypes = {
  video: { max: 3 },
  audio: { max: 2 },
}

function onSelect(clipIds: string[]) {
  console.log('选中:', clipIds)
}
</script>

<style>
.editor {
  width: 100%;
  height: 400px;
}
</style>
```

## 添加初始数据

```vue
<script setup>
import { onMounted } from 'vue'

onMounted(() => {
  // 添加轨道
  videoTrackRef.value.addTrack({
    id: 'video-1',
    type: 'video',
    name: '视频轨道',
    clips: []
  })
  
  // 添加片段
  videoTrackRef.value.addClip('video-1', {
    id: 'clip-1',
    type: 'video',
    name: '片段 1',
    startTime: 0,
    endTime: 10,
    source: '/video.mp4',
    sourceStartTime: 0,
    sourceEndTime: 10
  })
})
</script>
```
