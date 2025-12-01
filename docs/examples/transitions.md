# 转场效果

在片段之间添加转场效果。

## 监听转场请求

```vue
<template>
  <VideoTrack
    @add-transition="handleAddTransition"
    @transition-added="handleTransitionAdded"
  />
</template>

<script setup>
function handleAddTransition(beforeClipId, afterClipId) {
  // 显示转场选择器
  showTransitionPicker(beforeClipId, afterClipId)
}

function handleTransitionAdded(transition, beforeId, afterId) {
  console.log('转场已添加:', transition.name)
}
</script>
```

## 添加转场

```typescript
// 用户选择转场后
function onTransitionSelect(type: string, beforeId: string, afterId: string) {
  const transitionClip = {
    id: generateId(),
    type: 'transition',
    name: type,
    transitionType: type,
    duration: 1
  }
  
  // 触发事件通知组件
  videoTrackRef.value.emitTransitionAdded(
    transitionClip,
    beforeId,
    afterId
  )
}
```

## 支持的转场类型

- `fade` - 淡入淡出
- `dissolve` - 溶解
- `wipe` - 擦除
- `slide` - 滑动
- 自定义转场...
