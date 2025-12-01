# 主题定制

vue-clip-track 使用 CSS 变量进行主题定制，可以轻松修改颜色、间距等样式。

## 使用 CSS 变量

组件提供了丰富的 CSS 变量，可以在全局样式中覆盖：

```css
:root {
  /* 主题色 */
  --theme-hue: 220;
  --theme-saturation: 85%;
  --theme-lightness: 55%;
  
  /* 背景色 */
  --color-bg-dark: #0f172a;
  --color-bg-medium: #1e293b;
  --color-bg-light: #334155;
  
  /* 文字颜色 */
  --color-text-primary: rgba(255, 255, 255, 0.95);
  --color-text-secondary: rgba(255, 255, 255, 0.7);
  --color-text-tertiary: rgba(255, 255, 255, 0.5);
  
  /* 边框颜色 */
  --color-border: rgba(255, 255, 255, 0.1);
  --color-border-hover: rgba(255, 255, 255, 0.2);
  
  /* 轨道相关 */
  --track-height: 60px;
  --track-gap: 4px;
  
  /* 时间线 */
  --ruler-height: 36px;
  --playhead-color: #ef4444;
}
```

## 使用 theme prop

也可以通过 `theme` prop 传递主题配置：

```vue
<template>
  <VideoTrack :theme="theme" />
</template>

<script setup>
const theme = {
  primaryColor: '#3b82f6',
  backgroundColor: '#0f172a',
  textColor: '#ffffff',
  borderColor: 'rgba(255, 255, 255, 0.1)'
}
</script>
```

## 预设主题

### 暗色主题（默认）

```css
:root {
  --theme-hue: 220;
  --color-bg-dark: #0f172a;
  --color-bg-medium: #1e293b;
  --color-text-primary: rgba(255, 255, 255, 0.95);
}
```

### 亮色主题

```css
:root {
  --theme-hue: 220;
  --color-bg-dark: #f8fafc;
  --color-bg-medium: #f1f5f9;
  --color-text-primary: rgba(0, 0, 0, 0.87);
}
```

### 自定义主题色

只需修改 `--theme-hue` 即可快速切换主题色：

```css
/* 蓝色主题 */
:root { --theme-hue: 220; }

/* 绿色主题 */
:root { --theme-hue: 142; }

/* 紫色主题 */
:root { --theme-hue: 270; }

/* 橙色主题 */
:root { --theme-hue: 30; }
```

## 片段类型颜色

可以为不同类型的片段设置不同的颜色：

```vue
<template>
  <VideoTrack :clip-configs="clipConfigs" />
</template>

<script setup>
const clipConfigs = {
  video: {
    color: '#3b82f6',
    borderColor: '#2563eb'
  },
  audio: {
    color: '#10b981',
    borderColor: '#059669'
  },
  subtitle: {
    color: '#f59e0b',
    borderColor: '#d97706'
  },
  text: {
    color: '#8b5cf6',
    borderColor: '#7c3aed'
  }
}
</script>
```

## 使用 Scoped 样式

如果只想影响单个组件实例，可以使用 scoped 样式：

```vue
<template>
  <div class="custom-track">
    <VideoTrack />
  </div>
</template>

<style scoped>
.custom-track {
  --theme-hue: 142;
  --color-bg-dark: #064e3b;
  --color-bg-medium: #065f46;
}
</style>
```

## 响应式主题

结合媒体查询实现响应式主题：

```css
/* 默认暗色主题 */
:root {
  --color-bg-dark: #0f172a;
  --color-text-primary: rgba(255, 255, 255, 0.95);
}

/* 用户偏好亮色模式时 */
@media (prefers-color-scheme: light) {
  :root {
    --color-bg-dark: #f8fafc;
    --color-text-primary: rgba(0, 0, 0, 0.87);
  }
}
```
