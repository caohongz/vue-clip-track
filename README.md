# vue-clip-track

一个基于 Vue 3 的专业级视频轨道编辑组件库。

[![npm version](https://img.shields.io/npm/v/vue-clip-track.svg)](https://www.npmjs.com/package/vue-clip-track)

## 📺 在线演示

[**查看 DEMO 在线演示 →**](https://caohongz.github.io/video-track-component/)

[**查看 DOCS 在线文档和演示 →**](https://caohongz.github.io/vue-clip-track/docs/)

[**查看 Storybook 在线文档和演示 →**](https://caohongz.github.io/vue-clip-track/)

## ✨ 特性

- 🎬 **多轨道编辑** - 支持视频、音频、字幕、文本、贴纸、滤镜、特效等多种轨道类型
- 🎯 **精准时间控制** - 支持帧级别的时间精度控制
- 🔄 **拖放操作** - 直观的拖放式编辑体验，支持跨轨道拖拽
- ⏱️ **时间轴缩放** - 灵活的时间轴缩放和定位
- 🔗 **转场效果** - 在相邻 Clip 之间添加转场
- 📸 **媒体预览** - 视频缩略图和音频波形可视化
- 🎨 **高度可定制** - 支持自定义主题、国际化配置
- 📦 **TypeScript** - 完整的 TypeScript 类型支持
- 🔌 **插件化架构** - 可扩展的 Store 和 Composables
- ⌨️ **键盘快捷键** - 内置常用快捷键支持
- 📋 **剪贴板操作** - 支持复制、剪切、粘贴
- ↩️ **撤销/重做** - 完整的操作历史管理

## 📦 安装

```bash
# npm
npm install vue-clip-track

# pnpm
pnpm add vue-clip-track

# yarn
yarn add vue-clip-track
```

## 🚀 快速开始

### 1. 引入组件和样式

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
    @transition-added="handleTransitionAdded"
    @clip-copy="handleClipCopy"
    @clip-cut="handleClipCut"
    @clip-delete="handleClipDelete"
    @selection:changed="handleSelectionChanged"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { VideoTrack, locales } from 'vue-clip-track'

const videoTrackRef = ref()

const trackTypes = ref({
  video: { max: 5 },
  audio: { max: 3 },
  subtitle: { max: 2 },
})

// 使用内置语言包
const locale = locales['zh-CN']

function handleAddTransition(beforeClipId: string, afterClipId: string) {
  console.log('Add transition:', beforeClipId, afterClipId)
}

function handleDropMedia(mediaData: any, trackId: string, startTime: number) {
  console.log('Drop media:', mediaData, trackId, startTime)
}

function handleTransitionAdded(transitionClip: any, beforeClipId: string, afterClipId: string) {
  console.log('Transition added:', transitionClip.name)
}

function handleClipCopy(clipIds: string[]) {
  console.log('Clips copied:', clipIds)
}

function handleClipCut(clipIds: string[]) {
  console.log('Clips cut:', clipIds)
}

function handleClipDelete(clipId: string) {
  console.log('Clip deleted:', clipId)
}

function handleSelectionChanged(selectedIds: string[], previousIds: string[]) {
  console.log('Selection changed:', selectedIds, 'from:', previousIds)
}
</script>
```

## 📖 API 文档

### Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `operationButtons` | `OperationButton[]` | `['reset', 'undo', 'redo', 'delete']` | 工具栏操作按钮配置 |
| `scaleConfigButtons` | `ScaleConfigButton[]` | `['snap']` | 缩放配置按钮 |
| `trackTypes` | `TrackTypeConfig` | 见下方 | 轨道类型及数量限制配置 |
| `clipConfigs` | `ClipTypeConfig` | - | Clip 类型样式配置 |
| `showToolsBar` | `boolean` | `true` | 是否显示工具栏 |
| `enableMainTrackMode` | `boolean` | `false` | 是否启用主轨道模式 |
| `enableCrossTrackDrag` | `boolean` | `true` | 是否启用跨轨道拖拽 |
| `maxDuration` | `number` | `undefined` | 最大时长（秒），不设置则自动扩展 |
| `fps` | `number` | `30` | 帧率 |
| `pixelsPerSecond` | `number` | `100` | 每秒像素数 |
| `minScale` | `number` | `0.1` | 最小缩放比例 |
| `maxScale` | `number` | `10` | 最大缩放比例 |
| `defaultScale` | `number` | `1` | 默认缩放比例 |
| `enableSnap` | `boolean` | `true` | 是否启用吸附 |
| `snapThreshold` | `number` | `10` | 吸附阈值（像素） |
| `playbackRates` | `number[]` | `[0.5, 1, 2, 4]` | 支持的播放速率 |
| `trackControlWidth` | `number` | `160` | 轨道控制区宽度 |
| `trackContextMenu` | `TrackContextMenuConfig` | `{ enabled: true }` | 轨道右键菜单配置 |
| `clipContextMenu` | `ClipContextMenuConfig` | 见下方 | Clip 右键菜单配置 |
| `locale` | `'zh-CN' \| 'en-US' \| LocaleConfig` | `'zh-CN'` | 国际化配置 |
| `theme` | `ThemeConfig` | `undefined` | 主题配置 |

**默认 trackTypes 配置:**
```typescript
{
  video: { max: 5 },
  audio: { max: 3 },
  subtitle: { max: 2 }
}
```

**默认 clipContextMenu 配置:**
```typescript
{
  showCommonItems: true,
  commonItems: ['copy', 'cut', 'delete']
}
```

### Events

#### Clip 基础事件

| 事件名 | 参数 | 说明 |
|--------|------|------|
| `clipMove` | `(clipId: string, trackId: string, startTime: number)` | Clip 移动时触发 |
| `clipDelete` | `(clipId: string)` | Clip 删除时触发 |
| `clipSelect` | `(clipIds: string[])` | Clip 选中时触发 |
| `clipCopy` | `(clipIds: string[])` | Clip 复制时触发 |
| `clipCut` | `(clipIds: string[])` | Clip 剪切时触发 |
| `clipPaste` | `(clips: any[], trackId: string, time: number)` | Clip 粘贴时触发 |
| `clipSplit` | `(originalClipId: string, leftClip: any, rightClip: any, splitTime: number)` | Clip 分割时触发 |

#### Clip 生命周期事件

| 事件名 | 参数 | 说明 |
|--------|------|------|
| `clip:added` | `(clip: any, trackId: string)` | Clip 添加后触发 |
| `clip:updated` | `(clipId: string, changes: any, oldValues: any)` | Clip 更新后触发 |
| `clip:removed` | `(clip: any, trackId: string)` | Clip 移除后触发 |
| `clip:resize-start` | `(clip: any, edge: 'left' \| 'right')` | 开始调整 Clip 大小时触发 |
| `clip:resize-end` | `(clip: any, oldStartTime: number, oldEndTime: number)` | 结束调整 Clip 大小时触发 |
| `clip:drag-start` | `(clip: any)` | 开始拖拽 Clip 时触发 |
| `clip:drag-end` | `(clip: any, fromTrackId: string, toTrackId: string)` | 结束拖拽 Clip 时触发 |

#### Track 事件

| 事件名 | 参数 | 说明 |
|--------|------|------|
| `trackCreate` | `(trackId: string)` | 轨道创建时触发 |
| `trackDelete` | `(trackId: string)` | 轨道删除时触发 |
| `track:added` | `(track: Track)` | 轨道添加后触发 |
| `track:removed` | `(track: Track)` | 轨道移除后触发 |
| `track:updated` | `(trackId: string, changes: any)` | 轨道更新后触发 |

#### 选择事件

| 事件名 | 参数 | 说明 |
|--------|------|------|
| `selection:changed` | `(selectedClipIds: string[], previousIds: string[])` | 选择变化时触发 |

#### 播放状态事件

| 事件名 | 参数 | 说明 |
|--------|------|------|
| `playback:play` | - | 开始播放时触发 |
| `playback:pause` | - | 暂停播放时触发 |
| `playback:seek` | `(time: number)` | 跳转时间时触发 |
| `playback:timeupdate` | `(time: number)` | 播放时间更新时触发 |
| `playback:ratechange` | `(rate: number)` | 播放速率变化时触发 |

#### 缩放与历史事件

| 事件名 | 参数 | 说明 |
|--------|------|------|
| `scale:changed` | `(scale: number)` | 缩放变化时触发 |
| `history:changed` | `(state: { canUndo: boolean, canRedo: boolean })` | 历史状态变化时触发 |

#### 转场事件

| 事件名 | 参数 | 说明 |
|--------|------|------|
| `addTransition` | `(beforeClipId: string, afterClipId: string)` | 请求添加转场时触发 |
| `transitionAdded` | `(transitionClip: any, beforeClipId: string, afterClipId: string)` | 转场添加成功后触发 |

#### 其他事件

| 事件名 | 参数 | 说明 |
|--------|------|------|
| `dropMedia` | `(mediaData: any, trackId: string, startTime: number)` | 拖放媒体时触发 |
| `trackContextMenuSelect` | `(key: string, track: Track, time: number)` | 轨道右键菜单选择时触发 |
| `clipContextMenuSelect` | `(key: string, clip: any)` | Clip 右键菜单选择时触发 |
| `data:changed` | - | 数据变化时触发 |

### Slots

#### 工具栏插槽

| 插槽名 | 说明 |
|--------|------|
| `toolbar-before` | 工具栏前置内容 |
| `toolbar-after` | 工具栏后置内容 |
| `operations-prepend` | 操作区域前置内容 |
| `operations-append` | 操作区域后置内容 |
| `playback-prepend` | 播放控制区域前置内容 |
| `playback-append` | 播放控制区域后置内容 |
| `scale-prepend` | 缩放区域前置内容 |
| `scale-append` | 缩放区域后置内容 |
| `custom-operation-{key}` | 自定义操作按钮，key 为按钮配置中的 key |
| `custom-scale-config-{key}` | 自定义缩放配置按钮 |

#### 轨道插槽

| 插槽名 | Slot Props | 说明 |
|--------|------------|------|
| `tracks-before` | - | 轨道区域前置内容 |
| `tracks-after` | - | 轨道区域后置内容 |
| `track-control` | `{ track }` | 轨道控制区自定义 |
| `track-area` | `{ track }` | 轨道区域自定义 |
| `clip-content` | `{ clip, track }` | Clip 内容自定义 |
| `empty-track` | `{ track }` | 空轨道提示 |

#### 其他插槽

| 插槽名 | Slot Props | 说明 |
|--------|------------|------|
| `context-menu-item` | `{ item, clip?, track? }` | 自定义菜单项 |
| `ruler-before` | - | 时间线前置内容 |
| `ruler-after` | - | 时间线后置内容 |
| `statusbar` | - | 底部状态栏 |

### 组件实例方法 (Expose)

通过 `ref` 获取组件实例后，可以调用以下方法：

#### 基础操作

```typescript
// 重置组件
videoTrackRef.value.reset()

// 注册自定义 Clip 类型
videoTrackRef.value.registerClipType('custom', CustomClipComponent)

// 触发转场添加事件
videoTrackRef.value.emitTransitionAdded(transitionClip, beforeClipId, afterClipId)
```

#### 数据导入/导出

```typescript
// 导出项目数据
const data = videoTrackRef.value.exportData()

// 导入项目数据
videoTrackRef.value.importData(data)

// 导出为 JSON 字符串
const json = videoTrackRef.value.exportAsJSON()

// 从 JSON 导入
videoTrackRef.value.importFromJSON(json)
```

#### 轨道操作

```typescript
// 添加轨道
videoTrackRef.value.addTrack(track)

// 删除轨道
videoTrackRef.value.removeTrack(trackId)

// 更新轨道
videoTrackRef.value.updateTrack(trackId, changes)

// 获取所有轨道
const tracks = videoTrackRef.value.getTracks()

// 获取排序后的轨道
const sortedTracks = videoTrackRef.value.getSortedTracks()

// 获取指定轨道
const track = videoTrackRef.value.getTrackById(trackId)

// 获取主轨道
const mainTrack = videoTrackRef.value.getMainTrack()
```

#### Clip 操作

```typescript
// 添加 Clip
videoTrackRef.value.addClip(trackId, clip)

// 删除 Clip
videoTrackRef.value.removeClip(clipId)

// 更新 Clip
videoTrackRef.value.updateClip(clipId, changes)

// 获取指定 Clip
const clip = videoTrackRef.value.getClipById(clipId)

// 移动 Clip
videoTrackRef.value.moveClip(clipId, targetTrackId, newStartTime)
```

#### 选择操作

```typescript
// 选中单个 Clip
videoTrackRef.value.selectClip(clipId)

// 选中多个 Clips
videoTrackRef.value.selectClips(clipIds)

// 清空选择
videoTrackRef.value.clearSelection()

// 获取选中的 Clips
const selectedClips = videoTrackRef.value.getSelectedClips()

// 获取选中的 Clip IDs
const selectedIds = videoTrackRef.value.getSelectedClipIds()
```

#### 播放控制

```typescript
// 播放
videoTrackRef.value.play()

// 暂停
videoTrackRef.value.pause()

// 切换播放/暂停
videoTrackRef.value.togglePlay()

// 跳转到指定时间
videoTrackRef.value.seekTo(time)

// 获取当前时间
const currentTime = videoTrackRef.value.getCurrentTime()

// 设置播放速率
videoTrackRef.value.setPlaybackRate(rate)

// 获取播放速率
const rate = videoTrackRef.value.getPlaybackRate()

// 是否正在播放
const playing = videoTrackRef.value.isPlaying()

// 获取总时长
const duration = videoTrackRef.value.getDuration()
```

#### 缩放控制

```typescript
// 设置缩放
videoTrackRef.value.setScale(scale)

// 获取缩放
const scale = videoTrackRef.value.getScale()

// 放大
videoTrackRef.value.zoomIn()

// 缩小
videoTrackRef.value.zoomOut()

// 启用吸附
videoTrackRef.value.enableSnap()

// 禁用吸附
videoTrackRef.value.disableSnap()

// 获取吸附状态
const snapEnabled = videoTrackRef.value.isSnapEnabled()
```

#### 历史操作

```typescript
// 撤销
videoTrackRef.value.undo()

// 重做
videoTrackRef.value.redo()

// 获取历史状态
const historyState = videoTrackRef.value.getHistoryState()
// { canUndo: boolean, canRedo: boolean }
```

### 导出的 Stores

```typescript
import {
  useTracksStore,    // 轨道和 Clip 数据管理
  usePlaybackStore,  // 播放状态管理
  useHistoryStore,   // 撤销/重做历史管理
  useScaleStore,     // 缩放和吸附管理
  useDragStore,      // 拖拽状态管理
} from 'vue-clip-track'
```

### 导出的 Composables

```typescript
import {
  useKeyboard,      // 快捷键处理（复制/剪切/粘贴/删除/撤销/重做等）
  useResize,        // Clip 调整大小
  useAutoScroll,    // 播放时自动滚动
  useSelection,     // 多选/范围选择
} from 'vue-clip-track'
```

### 导出的工具函数

```typescript
import {
  generateId,           // 生成唯一 ID
  formatTime,           // 格式化时间显示 (HH:MM:SS:FF)
  hasTimeOverlap,       // 检查时间重叠
  clamp,                // 数值限制
  throttle,             // 节流函数
  debounce,             // 防抖函数
  isMac,                // 检测 Mac 系统
  deepClone,            // 深拷贝
  normalizeTime,        // 规范化时间精度（毫秒级）
  normalizeClipTime,    // 规范化 Clip 时间
  extractVideoThumbnails,    // 提取视频缩略图
  extractAudioWaveform,      // 提取音频波形
  extractVideoAudioWaveform, // 提取视频中的音频波形
} from 'vue-clip-track'
```

### 导出的类型

```typescript
import type {
  // Clip 类型
  BaseClip,
  MediaClip,
  SubtitleClip,
  TextClip,
  StickerClip,
  FilterClip,
  EffectClip,
  TransitionClip,
  Clip,
  ClipType,
  Animation,
  // Track 类型
  Track,
  TrackType,
  // 配置类型
  OperationButton,
  CustomButton,
  ScaleConfigButton,
  TrackTypeConfig,
  ClipTypeConfig,
  ContextMenuItem,
  TrackContextMenuConfig,
  ClipContextMenuConfig,
  VideoTrackConfig,
  PlaybackState,
  ScaleState,
  HistoryItem,
  LocaleConfig,
  ThemeConfig,
} from 'vue-clip-track'
```

### 内置语言包

```typescript
import { locales } from 'vue-clip-track'

// 使用中文
const zhLocale = locales['zh-CN']

// 使用英文
const enLocale = locales['en-US']
```

## ⌨️ 键盘快捷键

组件内置以下快捷键支持：

| 快捷键 | Mac | 功能 |
|--------|-----|------|
| `Ctrl+C` | `Cmd+C` | 复制选中的 Clip |
| `Ctrl+X` | `Cmd+X` | 剪切选中的 Clip |
| `Ctrl+V` | `Cmd+V` | 粘贴 Clip |
| `Delete` / `Backspace` | `Delete` / `Backspace` | 删除选中的 Clip |
| `Ctrl+Z` | `Cmd+Z` | 撤销 |
| `Ctrl+Shift+Z` / `Ctrl+Y` | `Cmd+Shift+Z` | 重做 |
| `Space` | `Space` | 播放/暂停 |
| `Ctrl+A` | `Cmd+A` | 全选 |
| `Escape` | `Escape` | 取消选择 |

## 🎨 主题定制

组件使用 CSS 变量进行主题定制，可以通过设置 CSS 变量来自定义样式：

```css
:root {
  --theme-hue: 220;
  --theme-saturation: 85%;
  --theme-lightness: 55%;
  --color-bg-dark: #0f172a;
  --color-bg-medium: #1e293b;
  --color-text-primary: rgba(255, 255, 255, 0.95);
}
```

## 🌍 国际化

```vue
<!-- 使用内置语言包 -->
<script setup>
import { locales } from 'vue-clip-track'
const locale = locales['en-US']
</script>

<template>
  <VideoTrack :locale="locale" />
</template>
```

```vue
<!-- 自定义语言配置 -->
<template>
  <VideoTrack
    :locale="{
      play: 'Play',
      pause: 'Pause',
      undo: 'Undo',
      redo: 'Redo',
      delete: 'Delete',
      reset: 'Reset',
      snap: 'Snap',
      copy: 'Copy',
      cut: 'Cut',
      paste: 'Paste',
    }"
  />
</template>
```

## 📄 许可证

[MIT](./LICENSE)

## 🛠️ 开发

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 启动 Storybook 文档
pnpm storybook

# 构建库
pnpm build

# 构建 Storybook 静态文件
pnpm build-storybook

# 运行测试
pnpm test
```
