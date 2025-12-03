# vue-clip-track

A professional-grade video track editing component library based on Vue 3.

English | [简体中文](./README.md)

[![npm version](https://img.shields.io/npm/v/vue-clip-track.svg)](https://www.npmjs.com/package/vue-clip-track)
[![npm downloads](https://img.shields.io/npm/dm/vue-clip-track.svg)](https://www.npmjs.com/package/vue-clip-track)

## 📺 Online Demo

[**View DEMO Online →**](https://caohongz.github.io/video-track-component/)

[**View DOCS Online Documentation →**](https://caohongz.github.io/vue-clip-track/docs/)

[**View Storybook Documentation →**](https://caohongz.github.io/vue-clip-track/)

## ✨ Features

- 🎬 **Multi-track Editing** - Support for video, audio, subtitle, text, sticker, filter, effect and other track types
- 🎯 **Precise Time Control** - Frame-level time precision control
- 🔄 **Drag & Drop** - Intuitive drag-and-drop editing experience with cross-track dragging support
- ⏱️ **Timeline Zoom** - Flexible timeline zoom and positioning
- 🔗 **Transitions** - Add transitions between adjacent clips
- 📸 **Media Preview** - Video thumbnails and audio waveform visualization
- 🎨 **Highly Customizable** - Support for custom themes and internationalization
- 📦 **TypeScript** - Full TypeScript type support
- 🔌 **Plugin Architecture** - Extensible Stores and Composables
- ⌨️ **Keyboard Shortcuts** - Built-in common shortcut support
- 📋 **Clipboard Operations** - Support for copy, cut, paste
- ↩️ **Undo/Redo** - Complete operation history management

## 📦 Installation

```bash
# npm
npm install vue-clip-track

# pnpm
pnpm add vue-clip-track

# yarn
yarn add vue-clip-track
```

> ⚠️ **Pinia Dependency**: This component library depends on Pinia for state management. Please ensure Pinia is installed and configured in your project.

## 🚀 Quick Start

### 1. Import Component and Styles

```typescript
// main.ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

// Import component styles
import 'vue-clip-track/style.css'

const app = createApp(App)
app.use(createPinia())
app.mount('#app')
```

### 2. Use the Component

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

// Use built-in language pack
const locale = locales['en-US']

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

## 📖 API Documentation

### Props

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `operationButtons` | `OperationButton[]` | `['reset', 'undo', 'redo', 'delete']` | Toolbar operation buttons configuration |
| `scaleConfigButtons` | `ScaleConfigButton[]` | `['snap']` | Scale configuration buttons |
| `trackTypes` | `TrackTypeConfig` | See below | Track types and quantity limit configuration |
| `clipConfigs` | `ClipTypeConfig` | - | Clip type style configuration |
| `showToolsBar` | `boolean` | `true` | Whether to show toolbar |
| `enableMainTrackMode` | `boolean` | `false` | Whether to enable main track mode |
| `enableCrossTrackDrag` | `boolean` | `true` | Whether to enable cross-track dragging |
| `maxDuration` | `number` | `undefined` | Maximum duration (seconds), auto-expand if not set |
| `fps` | `number` | `30` | Frame rate |
| `pixelsPerSecond` | `number` | `100` | Pixels per second |
| `minScale` | `number` | `0.1` | Minimum scale ratio |
| `maxScale` | `number` | `10` | Maximum scale ratio |
| `defaultScale` | `number` | `1` | Default scale ratio |
| `enableSnap` | `boolean` | `true` | Whether to enable snapping |
| `snapThreshold` | `number` | `10` | Snap threshold (pixels) |
| `playbackRates` | `number[]` | `[0.5, 1, 2, 4]` | Supported playback rates |
| `trackControlWidth` | `number` | `160` | Track control area width |
| `trackContextMenu` | `TrackContextMenuConfig` | `{ enabled: true }` | Track context menu configuration |
| `clipContextMenu` | `ClipContextMenuConfig` | See below | Clip context menu configuration |
| `locale` | `'zh-CN' \| 'en-US' \| LocaleConfig` | `'zh-CN'` | Internationalization configuration |
| `theme` | `ThemeConfig` | `undefined` | Theme configuration |

**Default trackTypes configuration:**
```typescript
{
  video: { max: 5 },
  audio: { max: 3 },
  subtitle: { max: 2 }
}
```

**Default clipContextMenu configuration:**
```typescript
{
  showCommonItems: true,
  commonItems: ['copy', 'cut', 'delete']
}
```

## 🎯 Core Concepts

### MediaClip Duration and Playback Rate

For video/audio type MediaClip, the actual duration on the track is automatically calculated based on `playbackRate`:

```typescript
// Actual track duration = (trimEnd - trimStart) / playbackRate
// The component automatically corrects endTime
endTime = startTime + (trimEnd - trimStart) / playbackRate
```

**Important**: When adding or importing MediaClip via API, the component automatically normalizes the duration - no manual calculation required.

### Time Precision

The component internally uses the `normalizeTime()` function to ensure millisecond precision (3 decimal places), avoiding floating-point precision issues:

```typescript
import { normalizeTime } from 'vue-clip-track'

// Normalize time value
const time = normalizeTime(1.23456789) // => 1.235
```

### Main Track Mode

When `enableMainTrackMode` is enabled, clips in the main track are forced to be arranged continuously without gaps:

```typescript
<VideoTrack :enable-main-track-mode="true" />
```

- After deleting a clip, subsequent clips automatically move forward to fill the gap
- When inserting a clip, subsequent clips automatically move backward to make room
- The main track cannot be deleted

### Events

#### Clip Basic Events

| Event Name | Parameters | Description |
|------------|------------|-------------|
| `clipMove` | `(clipId: string, trackId: string, startTime: number)` | Triggered when clip moves |
| `clipDelete` | `(clipId: string)` | Triggered when clip is deleted |
| `clipSelect` | `(clipIds: string[])` | Triggered when clip is selected |
| `clipCopy` | `(clipIds: string[])` | Triggered when clip is copied |
| `clipCut` | `(clipIds: string[])` | Triggered when clip is cut |
| `clipPaste` | `(clips: any[], trackId: string, time: number)` | Triggered when clip is pasted |
| `clipSplit` | `(originalClipId: string, leftClip: any, rightClip: any, splitTime: number)` | Triggered when clip is split |

#### Clip Lifecycle Events

| Event Name | Parameters | Description |
|------------|------------|-------------|
| `clip:added` | `(clip: any, trackId: string)` | Triggered after clip is added |
| `clip:updated` | `(clipId: string, changes: any, oldValues: any)` | Triggered after clip is updated |
| `clip:removed` | `(clip: any, trackId: string)` | Triggered after clip is removed |
| `clip:resize-start` | `(clip: any, edge: 'left' \| 'right')` | Triggered when starting to resize clip |
| `clip:resize-end` | `(clip: any, oldStartTime: number, oldEndTime: number)` | Triggered when finishing resizing clip |
| `clip:drag-start` | `(clip: any)` | Triggered when starting to drag clip |
| `clip:drag-end` | `(clip: any, fromTrackId: string, toTrackId: string)` | Triggered when finishing dragging clip |

#### Track Events

| Event Name | Parameters | Description |
|------------|------------|-------------|
| `trackCreate` | `(trackId: string)` | Triggered when track is created |
| `trackDelete` | `(trackId: string)` | Triggered when track is deleted |
| `track:added` | `(track: Track)` | Triggered after track is added |
| `track:removed` | `(track: Track)` | Triggered after track is removed |
| `track:updated` | `(trackId: string, changes: any)` | Triggered after track is updated |

#### Selection Events

| Event Name | Parameters | Description |
|------------|------------|-------------|
| `selection:changed` | `(selectedClipIds: string[], previousIds: string[])` | Triggered when selection changes |

#### Playback State Events

| Event Name | Parameters | Description |
|------------|------------|-------------|
| `playback:play` | - | Triggered when playback starts |
| `playback:pause` | - | Triggered when playback pauses |
| `playback:seek` | `(time: number)` | Triggered when seeking to time |
| `playback:timeupdate` | `(time: number)` | Triggered when playback time updates |
| `playback:ratechange` | `(rate: number)` | Triggered when playback rate changes |

#### Zoom and History Events

| Event Name | Parameters | Description |
|------------|------------|-------------|
| `scale:changed` | `(scale: number)` | Triggered when scale changes |
| `history:changed` | `(state: { canUndo: boolean, canRedo: boolean })` | Triggered when history state changes |

#### Transition Events

| Event Name | Parameters | Description |
|------------|------------|-------------|
| `addTransition` | `(beforeClipId: string, afterClipId: string)` | Triggered when requesting to add transition |
| `transitionAdded` | `(transitionClip: any, beforeClipId: string, afterClipId: string)` | Triggered after transition is added successfully |

#### Other Events

| Event Name | Parameters | Description |
|------------|------------|-------------|
| `dropMedia` | `(mediaData: any, trackId: string, startTime: number)` | Triggered when media is dropped |
| `trackContextMenuSelect` | `(key: string, track: Track, time: number)` | Triggered when track context menu item is selected |
| `clipContextMenuSelect` | `(key: string, clip: any)` | Triggered when clip context menu item is selected |
| `data:changed` | - | Triggered when data changes |

### Slots

#### Toolbar Slots

| Slot Name | Description |
|-----------|-------------|
| `toolbar-before` | Content before toolbar |
| `toolbar-after` | Content after toolbar |
| `operations-prepend` | Content prepended to operations area |
| `operations-append` | Content appended to operations area |
| `playback-prepend` | Content prepended to playback control area |
| `playback-append` | Content appended to playback control area |
| `scale-prepend` | Content prepended to scale area |
| `scale-append` | Content appended to scale area |
| `custom-operation-{key}` | Custom operation button, key is from button config |
| `custom-scale-config-{key}` | Custom scale config button |

#### Track Slots

| Slot Name | Slot Props | Description |
|-----------|------------|-------------|
| `tracks-before` | - | Content before tracks area |
| `tracks-after` | - | Content after tracks area |
| `track-control` | `{ track }` | Custom track control area |
| `track-area` | `{ track }` | Custom track area |
| `clip-content` | `{ clip, track }` | Custom clip content |
| `empty-track` | `{ track }` | Empty track hint |

#### Other Slots

| Slot Name | Slot Props | Description |
|-----------|------------|-------------|
| `context-menu-item` | `{ item, clip?, track? }` | Custom menu item |
| `ruler-before` | - | Content before timeline |
| `ruler-after` | - | Content after timeline |
| `statusbar` | - | Bottom status bar |

### Component Instance Methods (Expose)

After getting the component instance via `ref`, you can call the following methods:

#### Basic Operations

```typescript
// Reset component
videoTrackRef.value.reset()

// Register custom clip type
videoTrackRef.value.registerClipType('custom', CustomClipComponent)

// Trigger transition added event
videoTrackRef.value.emitTransitionAdded(transitionClip, beforeClipId, afterClipId)
```

#### Data Import/Export

```typescript
// Export project data
const data = videoTrackRef.value.exportData()

// Import project data
videoTrackRef.value.importData(data)

// Export as JSON string
const json = videoTrackRef.value.exportAsJSON()

// Import from JSON
videoTrackRef.value.importFromJSON(json)
```

#### Track Operations

```typescript
// Add track
videoTrackRef.value.addTrack(track)

// Remove track
videoTrackRef.value.removeTrack(trackId)

// Update track
videoTrackRef.value.updateTrack(trackId, changes)

// Get all tracks
const tracks = videoTrackRef.value.getTracks()

// Get sorted tracks
const sortedTracks = videoTrackRef.value.getSortedTracks()

// Get specific track
const track = videoTrackRef.value.getTrackById(trackId)

// Get main track
const mainTrack = videoTrackRef.value.getMainTrack()
```

#### Clip Operations

```typescript
// Add clip
videoTrackRef.value.addClip(trackId, clip)

// Remove clip
videoTrackRef.value.removeClip(clipId)

// Update clip
videoTrackRef.value.updateClip(clipId, changes)

// Get specific clip
const clip = videoTrackRef.value.getClipById(clipId)

// Move clip
videoTrackRef.value.moveClip(clipId, targetTrackId, newStartTime)

// Set clip playback rate (MediaClip only)
videoTrackRef.value.setClipPlaybackRate(clipId, 2.0, {
  allowShrink: true,   // Allow shrinking subsequent clips
  allowExpand: true,   // Allow expanding into empty space
  handleCollision: true, // Handle collisions
  keepStartTime: true  // Keep start time unchanged
})

// Get expected duration of clip at specified playback rate
const duration = videoTrackRef.value.getClipDurationAtRate(clipId, 1.5)

// Check if adjusting playback rate will cause collision
const hasCollision = videoTrackRef.value.checkPlaybackRateCollision(clipId, 0.5)
```

#### Selection Operations

```typescript
// Select single clip
videoTrackRef.value.selectClip(clipId)

// Select multiple clips
videoTrackRef.value.selectClips(clipIds)

// Clear selection
videoTrackRef.value.clearSelection()

// Get selected clips
const selectedClips = videoTrackRef.value.getSelectedClips()

// Get selected clip IDs
const selectedIds = videoTrackRef.value.getSelectedClipIds()
```

#### Playback Control

```typescript
// Play
videoTrackRef.value.play()

// Pause
videoTrackRef.value.pause()

// Toggle play/pause
videoTrackRef.value.togglePlay()

// Seek to time
videoTrackRef.value.seekTo(time)

// Get current time
const currentTime = videoTrackRef.value.getCurrentTime()

// Set playback rate
videoTrackRef.value.setPlaybackRate(rate)

// Get playback rate
const rate = videoTrackRef.value.getPlaybackRate()

// Is playing
const playing = videoTrackRef.value.isPlaying()

// Get duration
const duration = videoTrackRef.value.getDuration()
```

#### Zoom Control

```typescript
// Set scale
videoTrackRef.value.setScale(scale)

// Get scale
const scale = videoTrackRef.value.getScale()

// Zoom in
videoTrackRef.value.zoomIn()

// Zoom out
videoTrackRef.value.zoomOut()

// Enable snap
videoTrackRef.value.enableSnap()

// Disable snap
videoTrackRef.value.disableSnap()

// Get snap status
const snapEnabled = videoTrackRef.value.isSnapEnabled()
```

#### History Operations

```typescript
// Undo
videoTrackRef.value.undo()

// Redo
videoTrackRef.value.redo()

// Get history state
const historyState = videoTrackRef.value.getHistoryState()
// { canUndo: boolean, canRedo: boolean }
```

### Exported Stores

```typescript
import {
  useTracksStore,    // Track and clip data management
  usePlaybackStore,  // Playback state management
  useHistoryStore,   // Undo/redo history management
  useScaleStore,     // Scale and snap management
  useDragStore,      // Drag state management
} from 'vue-clip-track'
```

### Exported Composables

```typescript
import {
  useKeyboard,      // Shortcut key handling (copy/cut/paste/delete/undo/redo, etc.)
  useResize,        // Clip resizing
  useAutoScroll,    // Auto-scroll during playback
  useSelection,     // Multi-select/range selection
} from 'vue-clip-track'
```

### Exported Utility Functions

```typescript
import {
  generateId,           // Generate unique ID
  formatTime,           // Format time display (HH:MM:SS:FF)
  hasTimeOverlap,       // Check time overlap
  clamp,                // Clamp value
  throttle,             // Throttle function
  debounce,             // Debounce function
  isMac,                // Detect Mac system
  deepClone,            // Deep clone
  normalizeTime,        // Normalize time precision (millisecond level)
  normalizeClipTime,    // Normalize clip time
  extractVideoThumbnails,    // Extract video thumbnails
  extractAudioWaveform,      // Extract audio waveform
  extractVideoAudioWaveform, // Extract audio waveform from video
} from 'vue-clip-track'
```

### Exported Types

```typescript
import type {
  // Clip types
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
  // Track types
  Track,
  TrackType,
  // Configuration types
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

### Built-in Language Packs

```typescript
import { locales } from 'vue-clip-track'

// Use Chinese
const zhLocale = locales['zh-CN']

// Use English
const enLocale = locales['en-US']
```

## 📐 Clip Type System

The component supports multiple clip types, each with specific properties:

### BaseClip (Base Properties)

All clip types inherit from BaseClip:

```typescript
interface BaseClip {
  id: string           // Unique identifier
  trackId: string      // Parent track ID
  name?: string        // Name
  startTime: number    // Start time in track (seconds)
  endTime: number      // End time in track (seconds)
  selected: boolean    // Is selected
  
  // Optional spatial properties (for canvas positioning)
  rect?: {
    x: number
    y: number
    w: number
    h: number
    angle: number
  }
  
  // Optional animation configuration
  animations?: AnimationConfig[]
  
  visible?: boolean    // Is visible
  opacity?: number     // Opacity (0-1)
  zIndex?: number      // Z-index layer
}
```

### MediaClip (Video/Audio)

```typescript
interface MediaClip extends BaseClip {
  type: 'video' | 'audio'
  sourceUrl: string        // Media file URL
  originalDuration: number // Original duration
  trimStart: number        // Trim start time
  trimEnd: number          // Trim end time
  playbackRate: number     // Playback rate
  volume?: number          // Volume (0-1)
  thumbnails?: string[]    // Video thumbnails
  waveformData?: number[]  // Audio waveform data
}
```

### Other Clip Types

- **SubtitleClip**: Subtitles (text, fontFamily, fontSize, color, etc.)
- **TextClip**: Text
- **StickerClip**: Stickers (sourceUrl)
- **FilterClip**: Filters (filterType, filterValue)
- **EffectClip**: Effects (effectType, effectDuration)
- **TransitionClip**: Transitions (transitionType, transitionDuration)

## ⌨️ Keyboard Shortcuts

The component has built-in support for the following shortcuts:

| Shortcut | Mac | Function |
|----------|-----|----------|
| `Ctrl+C` | `Cmd+C` | Copy selected clip |
| `Ctrl+X` | `Cmd+X` | Cut selected clip |
| `Ctrl+V` | `Cmd+V` | Paste clip |
| `Delete` / `Backspace` | `Delete` / `Backspace` | Delete selected clip |
| `Ctrl+Z` | `Cmd+Z` | Undo |
| `Ctrl+Shift+Z` / `Ctrl+Y` | `Cmd+Shift+Z` | Redo |
| `Space` | `Space` | Play/Pause |
| `Ctrl+A` | `Cmd+A` | Select all |
| `Escape` | `Escape` | Cancel selection |

## 🎨 Theme Customization

The component uses CSS variables for theme customization, supporting two methods:

### Method 1: Via Props Configuration

```vue
<template>
  <VideoTrack
    :theme="{
      primaryHue: 220,
      primarySaturation: 85,
      primaryLightness: 55,
      bgDark: '#0f172a',
      bgMedium: '#1e293b',
      textPrimary: 'rgba(255, 255, 255, 0.95)',
      borderRadius: { sm: 4, md: 8, lg: 12 }
    }"
  />
</template>
```

### Method 2: Via CSS Variables

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

### Complete ThemeConfig

```typescript
interface ThemeConfig {
  // Primary color
  primaryColor?: string
  primaryHue?: number
  primarySaturation?: number
  primaryLightness?: number
  
  // Background colors
  bgDark?: string
  bgMedium?: string
  bgLight?: string
  bgElevated?: string
  
  // Text colors
  textPrimary?: string
  textSecondary?: string
  textMuted?: string
  
  // Border color
  borderColor?: string
  
  // Border radius
  borderRadius?: {
    sm?: number
    md?: number
    lg?: number
  }
}
```

## 🌍 Internationalization

The component includes built-in Chinese and English language packs with support for custom extensions:

### Using Built-in Language Packs

```vue
<script setup>
import { locales } from 'vue-clip-track'
const locale = locales['en-US']
</script>

<template>
  <VideoTrack :locale="locale" />
</template>
```

### Custom Language Configuration
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

### Complete LocaleConfig

```typescript
interface LocaleConfig {
  // Toolbar
  reset?: string
  undo?: string
  redo?: string
  delete?: string
  play?: string
  pause?: string
  
  // Snap
  snapOn?: string   // Tooltip when click to disable snap
  snapOff?: string  // Tooltip when click to enable snap
  
  // Context menu
  copy?: string
  cut?: string
  paste?: string
  selectAll?: string
  splitClip?: string
  deleteClip?: string
  deleteTrack?: string
  lockTrack?: string
  unlockTrack?: string
  muteTrack?: string
  unmuteTrack?: string
  
  // Track names
  mainTrack?: string
  videoTrack?: string
  audioTrack?: string
  subtitleTrack?: string
  // ... more track types
  
  // Hints
  emptyTrackHint?: string
  noClipSelected?: string
  confirmDelete?: string
  confirmDeleteTrack?: string
}
```

## 📄 License

[MIT](./LICENSE)

## 🔧 Custom Button Configuration

### Operation Button Extension

In addition to built-in operation buttons (reset/undo/redo/split/delete), custom buttons are also supported:

```vue
<template>
  <VideoTrack
    :operation-buttons="[
      'undo',
      'redo',
      {
        type: 'custom',
        key: 'myButton'
      },
      {
        key: 'export',
        label: 'Export',
        icon: '📤',
        onClick: handleExport,
        title: 'Export project'
      }
    ]"
  >
    <!-- Custom button slot -->
    <template #custom-operation-myButton>
      <button @click="doSomething">Custom Button</button>
    </template>
  </VideoTrack>
</template>
```

### Context Menu Extension

```vue
<template>
  <VideoTrack
    :clip-context-menu="{
      showCommonItems: true,
      commonItems: ['copy', 'cut', 'delete'],
      byType: {
        video: [
          { key: 'addFilter', label: 'Add Filter', icon: '🎨' },
          { key: 'extractAudio', label: 'Extract Audio', icon: '🔊' }
        ],
        audio: [
          { key: 'adjustVolume', label: 'Adjust Volume', icon: '🔉' }
        ]
      },
      extraItems: [
        { key: 'divider', label: '', divider: true },
        { key: 'properties', label: 'Properties', icon: 'ℹ️' }
      ]
    }"
    @clip-context-menu-select="handleClipMenuSelect"
  />
</template>

<script setup>
function handleClipMenuSelect(key, clip) {
  switch (key) {
    case 'addFilter':
      // Handle adding filter
      break
    case 'properties':
      // Show properties panel
      break
  }
}
</script>
```

## 🛠️ Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Start Storybook documentation
pnpm storybook

# Build library
pnpm build

# Build Storybook static files
pnpm build-storybook

# Run tests
pnpm test
```
