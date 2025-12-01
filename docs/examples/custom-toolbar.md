# 自定义工具栏

通过插槽和配置自定义工具栏。

## 自定义按钮配置

```vue
<template>
  <VideoTrack
    :operation-buttons="operationButtons"
    :scale-config-buttons="scaleButtons"
  >
    <!-- 自定义按钮内容 -->
    <template #custom-operation-save>
      <button @click="saveProject">
        💾 保存
      </button>
    </template>
  </VideoTrack>
</template>

<script setup>
const operationButtons = [
  'undo',
  'redo',
  'delete',
  { key: 'save', label: '保存' }  // 自定义按钮
]

const scaleButtons = ['snap']

function saveProject() {
  const data = videoTrackRef.value.exportData()
  localStorage.setItem('project', JSON.stringify(data))
}
</script>
```

## 使用插槽扩展

```vue
<template>
  <VideoTrack>
    <!-- 操作区域前置 -->
    <template #operations-prepend>
      <button @click="newProject">新建</button>
    </template>
    
    <!-- 操作区域后置 -->
    <template #operations-append>
      <button @click="exportVideo">导出</button>
    </template>
    
    <!-- 播放控制后置 -->
    <template #playback-append>
      <span>{{ formattedTime }}</span>
    </template>
  </VideoTrack>
</template>
```

## 完全自定义工具栏

```vue
<template>
  <VideoTrack :show-tools-bar="false">
    <template #toolbar-before>
      <div class="custom-toolbar">
        <button @click="undo">撤销</button>
        <button @click="redo">重做</button>
        <button @click="play">播放</button>
      </div>
    </template>
  </VideoTrack>
</template>
```
