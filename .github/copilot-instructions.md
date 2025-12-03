# Vue Clip Track - Copilot Instructions

## 项目概述
这是一个基于 Vue 3 + Pinia + TypeScript 的专业级视频轨道编辑组件库。主要用于非线性视频编辑场景，支持多轨道、多类型 Clip（视频、音频、字幕、贴纸、滤镜、特效、转场）管理。

## 架构设计

### 核心数据流
```
用户操作 → Composables (业务逻辑) → Stores (状态管理) → Components (UI 渲染)
```

### 目录结构
- `src/components/` - Vue 组件（主组件 `index.vue`，子组件按功能分文件夹）
- `src/stores/` - Pinia stores（tracks/playback/history/scale/drag）
- `src/composables/` - Vue 组合式函数（useKeyboard/useResize/useSelection 等）
- `src/types/` - TypeScript 类型定义（clip.ts/track.ts/config.ts）
- `src/utils/` - 工具函数（helpers.ts/mainTrack.ts/mediaProcessor.ts）

### 状态管理模式
所有 stores 使用 Pinia setup store 语法（composition API）：
```typescript
// stores/tracks.ts 示例
export const useTracksStore = defineStore('tracks', () => {
  const tracks = ref<Track[]>([])
  // 使用 ref + computed + 函数
})
```

## 开发命令
```bash
pnpm dev          # 开发服务器
pnpm build        # 构建库（含类型声明）
pnpm test         # 运行测试（watch 模式）
pnpm test:run     # 单次运行测试
pnpm test:coverage # 测试覆盖率
pnpm storybook    # Storybook 文档
pnpm docs:dev     # VitePress 文档
```

## 关键类型定义

### Clip 类型体系 (src/types/clip.ts)
- `BaseClip` - 基础属性（id/trackId/startTime/endTime/rect/animations 等）
- `MediaClip` - 视频/音频（含 trimStart/trimEnd/playbackRate）
- 其他类型：`SubtitleClip`/`TextClip`/`StickerClip`/`FilterClip`/`EffectClip`/`TransitionClip`

### 时间精度规范
使用 `normalizeTime()` 确保毫秒精度（3位小数）：
```typescript
// utils/helpers.ts
export function normalizeTime(time: number): number {
  return Math.round(time * 1000) / 1000
}
```

### MediaClip 时长计算
MediaClip 的 endTime 由 playbackRate 自动修正：
```typescript
// 实际时长 = (trimEnd - trimStart) / playbackRate
endTime = startTime + (trimEnd - trimStart) / playbackRate
```

## 代码规范

### 组件开发
- 主组件通过 `provide` 注入配置，子组件通过 `inject` 获取
- 使用插槽系统实现高度可定制化（toolbar-before/after, track-control, clip-content 等）
- 事件通过 `emit` 向上传递，命名格式：`{action}:{target}`（如 `playback:play`）

### Store 操作
```typescript
// 正确：使用 store 暴露的方法
const tracksStore = useTracksStore()
tracksStore.addClip(trackId, clip)
tracksStore.updateClip(clipId, { startTime: 5 })

// 历史记录：操作后调用 pushSnapshot
historyStore.pushSnapshot('添加片段')
```

### 测试规范
- 测试文件位于 `src/__tests__/` 镜像目录结构
- 使用 `src/__tests__/setup.ts` 中的 `withSetup()` 测试 composables
- Store 测试需要 `setActivePinia(createPinia())` 初始化

## 主轨道模式
当 `enableMainTrackMode=true` 时，主轨道 clips 强制连续排列：
```typescript
// utils/mainTrack.ts
ensureMainTrackContinuity(track)  // 确保无间隙
insertClipToMainTrack(track, clip, time)  // 自动推移后续 clips
```

## 国际化
使用预设语言包或自定义 `LocaleConfig`：
```typescript
import { locales } from 'vue-clip-track'
// locales['zh-CN'] / locales['en-US']
```

## 构建输出
库构建生成 ESM + UMD 格式，外部化 `vue` 和 `pinia`：
- `dist/vue-clip-track.js` (ESM)
- `dist/vue-clip-track.umd.cjs` (UMD)
- `dist/style.css`
- `dist/index.d.ts` (类型声明)
