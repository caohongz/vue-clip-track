# 键盘快捷键

vue-clip-track 内置了丰富的键盘快捷键支持，提升编辑效率。

## 快捷键列表

| 快捷键 | Mac | 功能 |
|--------|-----|------|
| `Ctrl+C` | `Cmd+C` | 复制选中的片段 |
| `Ctrl+X` | `Cmd+X` | 剪切选中的片段 |
| `Ctrl+V` | `Cmd+V` | 粘贴片段 |
| `Delete` / `Backspace` | `Delete` / `Backspace` | 删除选中的片段 |
| `Ctrl+Z` | `Cmd+Z` | 撤销 |
| `Ctrl+Shift+Z` / `Ctrl+Y` | `Cmd+Shift+Z` | 重做 |
| `Space` | `Space` | 播放/暂停 |
| `Ctrl+A` | `Cmd+A` | 全选 |
| `Escape` | `Escape` | 取消选择 |

## 使用 useKeyboard Composable

如果需要自定义快捷键行为，可以使用导出的 `useKeyboard` composable：

```typescript
import { useKeyboard } from 'vue-clip-track'

// 在组件中使用
const { 
  handleCopy,
  handleCut,
  handlePaste,
  handleDelete,
  handleUndo,
  handleRedo,
  handleSelectAll
} = useKeyboard()
```

## 自定义快捷键

你可以通过监听组件事件来实现自定义快捷键：

```vue
<template>
  <div @keydown="handleKeyDown">
    <VideoTrack ref="videoTrackRef" />
  </div>
</template>

<script setup>
import { ref } from 'vue'

const videoTrackRef = ref()

function handleKeyDown(e: KeyboardEvent) {
  // 自定义快捷键：Ctrl+S 保存
  if (e.ctrlKey && e.key === 's') {
    e.preventDefault()
    const data = videoTrackRef.value.exportData()
    // 保存数据...
  }
  
  // 自定义快捷键：Ctrl+D 复制片段
  if (e.ctrlKey && e.key === 'd') {
    e.preventDefault()
    // 自定义复制逻辑...
  }
}
</script>
```

## 禁用默认快捷键

如果需要禁用某些默认快捷键，可以在事件处理中阻止默认行为：

```vue
<template>
  <VideoTrack 
    @clip-copy="handleCopy"
    @clip-delete="handleDelete"
  />
</template>

<script setup>
function handleCopy(clipIds: string[]) {
  // 自定义复制逻辑
  // 返回 false 可以阻止默认行为
}

function handleDelete(clipId: string) {
  // 添加确认对话框
  if (confirm('确定要删除吗？')) {
    // 执行删除
  }
}
</script>
```
