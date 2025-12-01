<template>
  <div class="subtitle-clip" :style="clipStyle">
    <div class="subtitle-clip__text">
      {{ subtitleClip.text }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { SubtitleClip as SubtitleClipType } from '@/types'

// Props
interface Props {
  clip: SubtitleClipType
}

const props = defineProps<Props>()

// Computed
const subtitleClip = computed(() => props.clip as SubtitleClipType)

// 从 config 或直接属性中获取配置值
const getConfig = (key: string, defaultValue: any) => {
  // 优先使用直接属性，其次使用 config 中的值
  const directValue = (subtitleClip.value as any)[key]
  if (directValue !== undefined) return directValue
  return subtitleClip.value.config?.[key] ?? defaultValue
}

// clip 容器样式
const clipStyle = computed(() => ({
  background: getConfig('backgroundColor', undefined),
  textAlign: getConfig('textAlign', 'left'),
}))
</script>

<style scoped>
.subtitle-clip {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: start;
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  padding: 8px;
  color: #ffffff;
}

.subtitle-clip__text {
  max-width: 100%;
  line-height: 1.2;
  font-size: 10px;
  font-weight: 500;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}
</style>
