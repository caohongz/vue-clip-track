# Props

组件接受以下属性配置。

## 基础配置

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `showToolsBar` | `boolean` | `true` | 是否显示工具栏 |
| `fps` | `number` | `30` | 帧率 |
| `maxDuration` | `number` | `undefined` | 最大时长（秒） |
| `trackControlWidth` | `number` | `160` | 轨道控制区宽度 |

## 工具栏配置

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `operationButtons` | `OperationButton[]` | `['reset', 'undo', 'redo', 'delete']` | 操作按钮 |
| `scaleConfigButtons` | `ScaleConfigButton[]` | `['snap']` | 缩放配置按钮 |

```typescript
type OperationButton = 'reset' | 'undo' | 'redo' | 'delete' | 'split' | CustomButton
type ScaleConfigButton = 'snap' | CustomButton
```

## 轨道配置

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `trackTypes` | `TrackTypeConfig` | 见下方 | 轨道类型配置 |
| `enableMainTrackMode` | `boolean` | `false` | 主轨道模式 |
| `enableCrossTrackDrag` | `boolean` | `true` | 跨轨道拖拽 |

```typescript
// 默认值
const defaultTrackTypes = {
  video: { max: 5 },
  audio: { max: 3 },
  subtitle: { max: 2 }
}
```

## 缩放配置

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `pixelsPerSecond` | `number` | `100` | 每秒像素数 |
| `minScale` | `number` | `0.1` | 最小缩放 |
| `maxScale` | `number` | `10` | 最大缩放 |
| `defaultScale` | `number` | `1` | 默认缩放 |
| `enableSnap` | `boolean` | `true` | 启用吸附 |
| `snapThreshold` | `number` | `10` | 吸附阈值(px) |

## 播放配置

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `playbackRates` | `number[]` | `[0.5, 1, 2, 4]` | 播放速率选项 |

## Clip 配置

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `clipConfigs` | `ClipTypeConfig` | - | Clip 类型样式 |

## 右键菜单配置

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `trackContextMenu` | `TrackContextMenuConfig` | `{ enabled: true }` | 轨道菜单 |
| `clipContextMenu` | `ClipContextMenuConfig` | 见下方 | Clip 菜单 |

```typescript
// 默认 clipContextMenu
const defaultClipContextMenu = {
  showCommonItems: true,
  commonItems: ['copy', 'cut', 'delete']
}
```

## 国际化与主题

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `locale` | `'zh-CN' \| 'en-US' \| LocaleConfig` | `'zh-CN'` | 语言配置 |
| `theme` | `ThemeConfig` | `undefined` | 主题配置 |
