# 快速开始

## 安装

::: code-group

```bash [pnpm]
pnpm add vue-clip-track
```

```bash [npm]
npm install vue-clip-track
```

```bash [yarn]
yarn add vue-clip-track
```

:::

## 前置依赖

vue-clip-track 依赖以下库，请确保已安装：

- `vue` >= 3.3.0
- `pinia` >= 2.1.0

## 引入组件

### 1. 配置 Pinia

如果你的项目还没有配置 Pinia，需要先进行配置：

```typescript
// main.ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

// 引入组件样式
import 'vue-clip-track/style.css'

const app = createApp(App)
app.use(createPinia())
app.mount('#app')
```

### 2. 使用组件

```vue
<template>
  <div class="editor-container">
    <VideoTrack
      ref="videoTrackRef"
      :operation-buttons="['reset', 'undo', 'redo', 'split', 'delete']"
      :scale-config-buttons="['snap']"
      :track-types="trackTypes"
      :enable-main-track-mode="false"
      :enable-cross-track-drag="true"
      :enable-snap="true"
      :locale="locale"
      @add-transition="handleAddTransition"
      @drop-media="handleDropMedia"
      @clip-select="handleClipSelect"
      @clip-delete="handleClipDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { VideoTrack, locales } from 'vue-clip-track'

const videoTrackRef = ref()

// 轨道类型配置
const trackTypes = ref({
  video: { max: 5 },
  audio: { max: 3 },
  subtitle: { max: 2 },
})

// 使用内置中文语言包
const locale = locales['zh-CN']

// 事件处理
function handleAddTransition(beforeClipId: string, afterClipId: string) {
  console.log('添加转场:', beforeClipId, afterClipId)
}

function handleDropMedia(mediaData: any, trackId: string, startTime: number) {
  console.log('拖放媒体:', mediaData, trackId, startTime)
}

function handleClipSelect(clipIds: string[]) {
  console.log('选中片段:', clipIds)
}

function handleClipDelete(clipId: string) {
  console.log('删除片段:', clipId)
}
</script>

<style scoped>
.editor-container {
  width: 100%;
  height: 400px;
}
</style>
```

## 基本概念

### Track（轨道）

轨道是时间轴上的水平容器，用于承载不同类型的内容。支持的轨道类型：

- `video` - 视频轨道
- `audio` - 音频轨道
- `subtitle` - 字幕轨道
- `text` - 文本轨道
- `sticker` - 贴纸轨道
- `filter` - 滤镜轨道
- `effect` - 特效轨道

### Clip（片段）

片段是放置在轨道上的内容单元，具有开始时间和结束时间。每个片段可以：

- 拖拽移动位置
- 调整左右边界改变时长
- 复制、剪切、粘贴
- 分割为多个片段

## 下一步

- 了解 [Props 配置](/api/props) 来自定义组件行为
- 查看 [Events 事件](/api/events) 来响应用户操作
- 学习 [主题定制](/guide/theming) 来自定义外观
