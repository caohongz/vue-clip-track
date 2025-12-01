# 工具函数

导出的工具函数。

```typescript
import {
  generateId,
  formatTime,
  hasTimeOverlap,
  clamp,
  throttle,
  debounce,
  isMac,
  deepClone,
  normalizeTime,
  normalizeClipTime,
  extractVideoThumbnails,
  extractAudioWaveform,
  extractVideoAudioWaveform,
} from 'vue-clip-track'
```

## 通用工具

### generateId

生成唯一 ID。

```typescript
const id = generateId()
// 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
```

### formatTime

格式化时间显示。

```typescript
formatTime(65.5, 30)
// '00:01:05:15' (HH:MM:SS:FF)
```

### clamp

数值限制。

```typescript
clamp(150, 0, 100) // 100
clamp(-10, 0, 100) // 0
```

### deepClone

深拷贝。

```typescript
const copy = deepClone(object)
```

### isMac

检测 Mac 系统。

```typescript
if (isMac()) {
  // Mac 特定逻辑
}
```

## 时间处理

### hasTimeOverlap

检查时间重叠。

```typescript
hasTimeOverlap(0, 10, 5, 15) // true
hasTimeOverlap(0, 10, 10, 20) // false
```

### normalizeTime

规范化时间精度（毫秒级）。

```typescript
normalizeTime(1.23456789) // 1.235
```

### normalizeClipTime

规范化 Clip 时间。

```typescript
const clip = normalizeClipTime(clip)
```

## 函数工具

### throttle

节流函数。

```typescript
const throttled = throttle(fn, 100)
```

### debounce

防抖函数。

```typescript
const debounced = debounce(fn, 300)
```

## 媒体处理

### extractVideoThumbnails

提取视频缩略图。

```typescript
const thumbnails = await extractVideoThumbnails(videoUrl, {
  count: 10,
  width: 160,
  height: 90
})
```

### extractAudioWaveform

提取音频波形。

```typescript
const waveform = await extractAudioWaveform(audioUrl, {
  samples: 100
})
```

### extractVideoAudioWaveform

提取视频中的音频波形。

```typescript
const waveform = await extractVideoAudioWaveform(videoUrl)
```
