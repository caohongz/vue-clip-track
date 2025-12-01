<template>
  <div class="text-clip" :style="clipStyle">
    <div class="text-clip__content">
      <span class="text-clip__text" :style="textStyle">{{ clipText }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { TextClip as TextClipType } from '@/types'

interface Props {
  clip: TextClipType
}

const props = defineProps<Props>()

// 从 config 或直接属性中获取配置值
const getConfig = (key: string, defaultValue: any) => {
  const directValue = (props.clip as any)[key]
  if (directValue !== undefined) return directValue
  return props.clip.config?.[key] ?? defaultValue
}

// 文本内容
const clipText = computed(() => props.clip.text || getConfig('text', '自定义文本'))

// clip 容器样式
const clipStyle = computed(() => ({
  background: getConfig('backgroundColor', undefined),
  textAlign: getConfig('textAlign', 'center'),
}))

// 文字样式
const textStyle = computed(() => ({
  fontFamily: getConfig('fontFamily', undefined),
  fontSize: getConfig('fontSize', undefined) ? `${getConfig('fontSize', 10)}px` : undefined,
  color: getConfig('color', '#ffffff'),
  fontWeight: getConfig('fontWeight', 600),
}))
</script>

<style scoped>
.text-clip {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.text-clip__content {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px 8px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
  min-width: 40px;
}

.text-clip__text {
  font-size: 10px;
  font-weight: 600;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}
</style>
