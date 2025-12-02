# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.3] - 2025-12-02

### Added

- 🚀 添加 GitHub Actions 测试和发布工作流配置

### Changed

- 🎨 调整 TrackControl 组件样式，增加右侧间距和背景色
- 🔧 优化视频剪辑的 trimEnd 逻辑，修正相关测试用例
- 🧹 移除游标线相关冗余代码

### Fixed

- 📝 优化 README 中的链接格式

## [0.1.2] - 2025-12-02

### Added

- ⏱️ 新增音视频 Clip 的播放倍速控制 (`playbackRate`) 功能
- 🎬 添加播放 (`play`) 和暂停 (`pause`) 事件的发射
- 📐 添加拖拽预览结束时间计算功能
- 🔧 支持 Clip 属性深度合并更新，便于更新嵌套属性
- 💫 新增动画配置 (`AnimationConfig`) 类型支持

### Changed

- 🎵 优化音频波形数据计算算法，提升性能
- ⌨️ 优化键盘事件处理，增强输入框内快捷键的兼容性
- 📏 优化轨道宽度动态调整逻辑
- 🖼️ 增强裁剪和缩略图展示逻辑

### Fixed

- 🐛 修复拖拽 Clip 时 layer 层级错误的问题
- 🔗 修复在线演示链接地址

## [0.1.1] - 2024-11-29

### Fixed

- 🔧 更新版本号
- 📝 修复 README 中的文档链接

## [0.1.0] - 2024-11-28

### Added

- 🎬 初始版本发布
- 支持多轨道编辑（视频、音频、字幕、贴纸、滤镜、特效）
- 支持 Clip 拖拽、调整大小、跨轨道移动
- 支持时间轴缩放和吸附功能
- 支持撤销/重做操作
- 支持国际化（中文/英文）
- 支持主题定制
- 提供完整的 TypeScript 类型支持
- 导出 Stores、Composables 和工具函数供高级用户使用
