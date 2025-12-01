---
layout: home

hero:
  name: vue-clip-track
  text: 专业级视频轨道编辑组件
  tagline: 基于 Vue 3 的高性能、可扩展的时间轴编辑器
  image:
    src: /logo.svg
    alt: vue-clip-track
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/getting-started
    - theme: alt
      text: 在线演示
      link: https://caohongz.github.io/vue-clip-track/
    - theme: alt
      text: GitHub
      link: https://github.com/caohongz/vue-clip-track

features:
  - icon: 🎬
    title: 多轨道编辑
    details: 支持视频、音频、字幕、文本、贴纸、滤镜、特效等多种轨道类型
  - icon: 🎯
    title: 精准时间控制
    details: 支持帧级别的时间精度控制，满足专业编辑需求
  - icon: 🔄
    title: 拖放操作
    details: 直观的拖放式编辑体验，支持跨轨道拖拽
  - icon: ⏱️
    title: 时间轴缩放
    details: 灵活的时间轴缩放和定位，支持吸附功能
  - icon: 🔗
    title: 转场效果
    details: 在相邻 Clip 之间轻松添加转场效果
  - icon: 📸
    title: 媒体预览
    details: 视频缩略图和音频波形可视化展示
  - icon: 🎨
    title: 高度可定制
    details: 支持自定义主题、国际化配置，灵活扩展
  - icon: 📦
    title: TypeScript 支持
    details: 完整的 TypeScript 类型定义，享受智能提示
  - icon: ⌨️
    title: 键盘快捷键
    details: 内置常用快捷键支持，提升编辑效率
---

## 快速体验

```bash
# 安装
pnpm add vue-clip-track

# 或使用 npm
npm install vue-clip-track
```

```vue
<template>
  <VideoTrack
    :track-types="trackTypes"
    :enable-snap="true"
    @clip-select="handleSelect"
  />
</template>

<script setup>
import { VideoTrack } from 'vue-clip-track'
import 'vue-clip-track/style.css'
</script>
```
