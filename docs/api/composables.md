# Composables

导出的组合式函数。

```typescript
import {
  useKeyboard,
  useResize,
  useAutoScroll,
  useSelection,
} from 'vue-clip-track'
```

## useKeyboard

快捷键处理。

```typescript
const keyboard = useKeyboard()

// 方法
keyboard.handleCopy()
keyboard.handleCut()
keyboard.handlePaste()
keyboard.handleDelete()
keyboard.handleUndo()
keyboard.handleRedo()
keyboard.handleSelectAll()
```

## useResize

Clip 调整大小。

```typescript
const resize = useResize(clip, options)

// 开始调整
resize.startResize(edge, event)

// 状态
resize.isResizing
resize.resizeEdge
```

## useAutoScroll

播放时自动滚动。

```typescript
const autoScroll = useAutoScroll(containerRef, options)

// 启用/禁用
autoScroll.enable()
autoScroll.disable()
```

## useSelection

多选/范围选择。

```typescript
const selection = useSelection()

// 方法
selection.select(clipId)
selection.selectMultiple(clipIds)
selection.toggle(clipId)
selection.clear()
selection.selectRange(startId, endId)

// 状态
selection.selectedIds
selection.hasSelection
```
