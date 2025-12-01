# Slots

组件提供的插槽。

## 工具栏插槽

| 插槽名 | 说明 |
|--------|------|
| `toolbar-before` | 工具栏前置 |
| `toolbar-after` | 工具栏后置 |
| `operations-prepend` | 操作区域前置 |
| `operations-append` | 操作区域后置 |
| `playback-prepend` | 播放区域前置 |
| `playback-append` | 播放区域后置 |
| `scale-prepend` | 缩放区域前置 |
| `scale-append` | 缩放区域后置 |
| `custom-operation-{key}` | 自定义操作按钮 |
| `custom-scale-config-{key}` | 自定义缩放按钮 |

## 轨道插槽

| 插槽名 | Slot Props | 说明 |
|--------|------------|------|
| `tracks-before` | - | 轨道区域前置 |
| `tracks-after` | - | 轨道区域后置 |
| `track-control` | `{ track }` | 轨道控制区 |
| `track-area` | `{ track }` | 轨道区域 |
| `clip-content` | `{ clip, track }` | Clip 内容 |
| `empty-track` | `{ track }` | 空轨道提示 |

## 其他插槽

| 插槽名 | Slot Props | 说明 |
|--------|------------|------|
| `context-menu-item` | `{ item, clip?, track? }` | 菜单项 |
| `ruler-before` | - | 时间线前置 |
| `ruler-after` | - | 时间线后置 |
| `statusbar` | - | 底部状态栏 |

## 使用示例

```vue
<template>
  <VideoTrack>
    <!-- 自定义工具栏按钮 -->
    <template #operations-append>
      <button @click="saveProject">保存</button>
    </template>
    
    <!-- 自定义 Clip 内容 -->
    <template #clip-content="{ clip, track }">
      <div class="custom-clip">
        {{ clip.name }}
      </div>
    </template>
    
    <!-- 自定义轨道控制 -->
    <template #track-control="{ track }">
      <div class="track-info">
        <span>{{ track.name }}</span>
        <button @click="muteTrack(track.id)">静音</button>
      </div>
    </template>
    
    <!-- 底部状态栏 -->
    <template #statusbar>
      <div class="status">
        已选中 {{ selectedCount }} 个片段
      </div>
    </template>
  </VideoTrack>
</template>
```
