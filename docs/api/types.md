# 类型定义

导出的 TypeScript 类型。

```typescript
import type {
  // Clip 空间配置
  RectProps,
  RectConfig,
  FlipType,
  // Clip 动画配置
  AnimatableProps,
  AnimationKeyframes,
  AnimationOptions,
  AnimationConfig,
  InteractableMode,
  PresetAnimationType,
  PresetAnimation,
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
  ClipCreateOptions,
  ClipUpdateOptions,
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
  // 工具
  DEFAULT_RECT,
  TIME_UNITS,
  timeUtils,
} from 'vue-clip-track'
```

## 空间属性 (Rect)

### RectProps

基础空间属性，定义 clip 在画布中的位置、尺寸和旋转。参考 WebAV 的 `IRectBaseProps`。

```typescript
interface RectProps {
  /** X 坐标位置 */
  x: number
  /** Y 坐标位置 */
  y: number
  /** 宽度 */
  w: number
  /** 高度 */
  h: number
  /** 旋转角度（弧度） */
  angle: number
}
```

### RectConfig

扩展的空间属性配置。

```typescript
interface RectConfig extends RectProps {
  /** 是否固定宽高比 */
  fixedAspectRatio?: boolean
  /** 缩放时是否以中心点为基准 */
  fixedScaleCenter?: boolean
}
```

## 翻转配置 (Flip)

### FlipType

```typescript
type FlipType = 'horizontal' | 'vertical' | null
```

## 动画配置 (Animation)

### AnimatableProps

可动画属性，包含 rect 的基础属性和 opacity。参考 WebAV 的 `TAnimateProps`。

```typescript
interface AnimatableProps extends Partial<RectProps> {
  /** 透明度 (0-1) */
  opacity?: number
}
```

### AnimationKeyframes

动画关键帧定义，支持百分比格式（如 `'0%'`, `'50%'`, `'100%'`）和别名（`'from'`, `'to'`）。

```typescript
type AnimationKeyframes = {
  [key: string]: Partial<AnimatableProps>
}

// 示例
const keyframes: AnimationKeyframes = {
  'from': { opacity: 0, x: -100 },
  '50%': { opacity: 0.5, x: 0 },
  'to': { opacity: 1, x: 100 }
}
```

### AnimationOptions

动画选项配置。参考 WebAV 的 `IAnimationOpts`。

```typescript
interface AnimationOptions {
  /** 动画时长（微秒） */
  duration: number
  /** 延迟时间（微秒） */
  delay?: number
  /** 迭代次数，undefined 或 Infinity 表示无限循环 */
  iterCount?: number
  /** 缓动函数 */
  easing?: 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | string
  /** 动画方向 */
  direction?: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse'
  /** 填充模式 */
  fillMode?: 'none' | 'forwards' | 'backwards' | 'both'
}
```

### AnimationConfig

完整动画配置，包含关键帧和动画选项。

```typescript
interface AnimationConfig {
  /** 动画唯一标识 */
  id?: string
  /** 动画名称 */
  name?: string
  /** 关键帧定义 */
  keyframes: AnimationKeyframes
  /** 动画选项 */
  options: AnimationOptions
  /** 是否启用 */
  enabled?: boolean
}
```

### PresetAnimationType

预设动画类型。

```typescript
type PresetAnimationType =
  | 'fadeIn' | 'fadeOut'
  | 'slideInLeft' | 'slideInRight' | 'slideInTop' | 'slideInBottom'
  | 'slideOutLeft' | 'slideOutRight' | 'slideOutTop' | 'slideOutBottom'
  | 'zoomIn' | 'zoomOut'
  | 'rotateIn' | 'rotateOut'
  | 'bounceIn' | 'bounceOut'
```

## 交互配置

### InteractableMode

交互模式。参考 WebAV 的 `VisibleSprite.interactable`。

```typescript
type InteractableMode = 'interactive' | 'selectable' | 'disabled'
```

## Clip 类型

### BaseClip

基础 Clip 接口，所有 Clip 类型的基类。参考 WebAV 的 VisibleSprite 属性配置。

```typescript
interface BaseClip {
  /** 唯一标识符 */
  id: string
  /** 所属轨道 ID */
  trackId: string
  /** Clip 名称 */
  name?: string

  // 时间配置
  /** 轨道内开始时间（秒） */
  startTime: number
  /** 轨道内结束时间（秒） */
  endTime: number

  // 空间配置
  /** 空间属性配置，定义 clip 在画布中的位置、尺寸和旋转 */
  rect?: RectConfig

  // 可见性和透明度
  /** 是否可见 */
  visible?: boolean
  /** 透明度 (0-1) */
  opacity?: number

  // 翻转配置
  /** 翻转模式 */
  flip?: FlipType

  // 交互配置
  /** 是否被选中 */
  selected: boolean
  /** 交互模式 */
  interactable?: InteractableMode
  /** Z-index 层级 */
  zIndex?: number

  // 动画配置
  /** 动画列表，支持关键帧动画 */
  animations?: AnimationConfig[]

  // 用户自定义配置
  config?: Record<string, unknown>
}
```

### MediaClip

视频/音频 Clip。

```typescript
interface MediaClip extends BaseClip {
  type: 'video' | 'audio'
  sourceUrl: string
  originalDuration: number
  trimStart: number
  trimEnd: number
  playbackRate: number  // 播放速率，仅音视频有
  volume?: number
  thumbnails?: string[]
  waveformData?: number[]
}
```

### SubtitleClip

字幕 Clip。

```typescript
interface SubtitleClip extends BaseClip {
  type: 'subtitle'
  text: string
  fontFamily: string
  fontSize: number
  color: string
  backgroundColor?: string
  textAlign?: 'left' | 'center' | 'right'
}
```

### TextClip

文本 Clip。

```typescript
interface TextClip extends BaseClip {
  type: 'text'
  text: string
  fontFamily?: string
  fontSize?: number
  color?: string
  backgroundColor?: string
}
```

### StickerClip

贴纸 Clip。

```typescript
interface StickerClip extends BaseClip {
  type: 'sticker'
  sourceUrl: string
}
```

### FilterClip

滤镜 Clip。

```typescript
interface FilterClip extends BaseClip {
  type: 'filter'
  filterType: string
  filterValue: number | Record<string, number>
}
```

### EffectClip

特效 Clip。

```typescript
interface EffectClip extends BaseClip {
  type: 'effect'
  effectType: string
  effectDuration: number
}
```

### TransitionClip

转场 Clip。

```typescript
interface TransitionClip extends BaseClip {
  type: 'transition'
  transitionType: string
  transitionDuration: number
}
```

### Clip

所有 Clip 类型的联合类型。

```typescript
type Clip =
  | MediaClip
  | SubtitleClip
  | TextClip
  | StickerClip
  | FilterClip
  | EffectClip
  | TransitionClip
```

### ClipType

Clip 类型字符串。

```typescript
type ClipType =
  | 'video' | 'audio'
  | 'subtitle' | 'text'
  | 'sticker' | 'filter'
  | 'effect' | 'transition'
```

## 辅助类型

### ClipCreateOptions

创建 Clip 时的选项类型（不包含必填字段）。

```typescript
type ClipCreateOptions<T extends Clip> = Omit<T, 'id' | 'trackId' | 'startTime' | 'endTime' | 'selected'>
```

### ClipUpdateOptions

更新 Clip 时的选项类型（部分更新）。

```typescript
type ClipUpdateOptions<T extends Clip> = Partial<Omit<T, 'id' | 'trackId' | 'type'>>
```

## 工具常量和函数

### DEFAULT_RECT

默认的 Rect 值。

```typescript
const DEFAULT_RECT: RectProps = {
  x: 0,
  y: 0,
  w: 100,
  h: 100,
  angle: 0,
}
```

### TIME_UNITS

时间单位转换常量。

```typescript
const TIME_UNITS = {
  /** 1秒 = 1,000,000 微秒 */
  SECOND_TO_MICROSECOND: 1_000_000,
  /** 1毫秒 = 1,000 微秒 */
  MILLISECOND_TO_MICROSECOND: 1_000,
} as const
```

### timeUtils

时间单位转换工具函数。

```typescript
const timeUtils = {
  /** 秒转微秒 */
  secondsToMicroseconds: (seconds: number) => number,
  /** 微秒转秒 */
  microsecondsToSeconds: (microseconds: number) => number,
  /** 帧转微秒 (给定帧率) */
  framesToMicroseconds: (frames: number, fps: number) => number,
  /** 微秒转帧 (给定帧率) */
  microsecondsToFrames: (microseconds: number, fps: number) => number,
}

// 示例
import { timeUtils } from 'vue-clip-track'

const microseconds = timeUtils.secondsToMicroseconds(5) // 5_000_000
const seconds = timeUtils.microsecondsToSeconds(5_000_000) // 5
```

## Track 类型

```typescript
interface Track {
  id: string
  type: TrackType
  name: string
  clips: Clip[]
  order: number
  isMain?: boolean
  locked?: boolean
  visible?: boolean
}

type TrackType = 'video' | 'audio' | 'subtitle' | 'text' | 'sticker' | 'filter' | 'effect'
```

## 配置类型

### TrackTypeConfig

```typescript
interface TrackTypeConfig {
  video?: { max: number }
  audio?: { max: number }
  subtitle?: { max: number }
  // ...
}
```

### ContextMenuItem

```typescript
interface ContextMenuItem {
  key: string
  label: string
  icon?: string
  disabled?: boolean
  danger?: boolean
}
```

### LocaleConfig

```typescript
interface LocaleConfig {
  play: string
  pause: string
  undo: string
  redo: string
  delete: string
  // ...
}
```

### ThemeConfig

```typescript
interface ThemeConfig {
  primaryColor?: string
  backgroundColor?: string
  textColor?: string
  borderColor?: string
}
```
