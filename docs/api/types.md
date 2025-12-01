# 类型定义

导出的 TypeScript 类型。

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

## Clip 类型

### BaseClip

```typescript
interface BaseClip {
  id: string
  type: ClipType
  name: string
  startTime: number
  endTime: number
  animation?: Animation
}
```

### MediaClip

```typescript
interface MediaClip extends BaseClip {
  type: 'video' | 'audio'
  source: string
  sourceStartTime: number
  sourceEndTime: number
  thumbnails?: string[]
  waveform?: number[]
}
```

### SubtitleClip

```typescript
interface SubtitleClip extends BaseClip {
  type: 'subtitle'
  text: string
  style?: SubtitleStyle
}
```

### TransitionClip

```typescript
interface TransitionClip extends BaseClip {
  type: 'transition'
  transitionType: string
  duration: number
}
```

## Track 类型

```typescript
interface Track {
  id: string
  type: TrackType
  name: string
  clips: Clip[]
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
