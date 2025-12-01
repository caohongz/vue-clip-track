<template>
  <div class="video-clip">
    <div class="video-clip__thumbnails" ref="thumbnailsRef">
      <!-- 加载中状态 -->
      <div v-if="isLoading" class="video-clip__loading">
        <span class="video-clip__loading-spinner"></span>
        <span class="video-clip__loading-text">加载中...</span>
      </div>
      <!-- 缩略图展示 -->
      <template v-else>
        <div v-for="(thumbnail, index) in displayThumbnails" :key="index" class="video-clip__thumbnail" :style="{
          backgroundImage: thumbnail ? `url(${thumbnail})` : 'none',
          width: thumbnailWidth + 'px'
        }">
          <div v-if="!thumbnail" class="video-clip__thumbnail-placeholder">
            📹
          </div>
        </div>
      </template>
    </div>
    <div class="video-clip__info">
      <span class="video-clip__name">{{ clipName }}</span>
      <span v-if="mediaClip.playbackRate && mediaClip.playbackRate !== 1" class="video-clip__rate">
        {{ mediaClip.playbackRate }}x
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, watch, onUnmounted } from 'vue'
import { useScaleStore } from '@/stores/scale'
import { extractVideoThumbnails } from '@/utils/mediaProcessor'
import type { MediaClip } from '@/types'

// Props
interface Props {
  clip: MediaClip
}

const props = defineProps<Props>()

// Stores
const scaleStore = useScaleStore()

// Refs
const thumbnailsRef = ref<HTMLElement>()
const isLoading = ref(false)
const loadedThumbnails = ref<string[]>([])

// Computed
const mediaClip = computed(() => props.clip as MediaClip)

const clipName = computed(() => {
  if (mediaClip.value.name) return mediaClip.value.name
  const url = mediaClip.value.sourceUrl
  const parts = url.split('/')
  return parts[parts.length - 1] || 'Video'
})

// 计算 clip 的宽度（像素）
const clipWidth = computed(() => {
  const duration = props.clip.endTime - props.clip.startTime
  return duration * scaleStore.actualPixelsPerSecond
})

// 计算每个缩略图的宽度
const thumbnailWidth = computed(() => {
  const count = displayThumbnails.value.length
  if (count === 0) return 0
  return clipWidth.value / count
})

// 计算需要显示的缩略图数量
const thumbnailCount = computed(() => {
  // 每个缩略图大约 60-100px 宽度
  const idealWidth = 80
  const count = Math.max(1, Math.ceil(clipWidth.value / idealWidth))
  return Math.min(count, 20) // 最多 20 个缩略图
})

// 获取完整的原始缩略图数据
const fullThumbnails = computed(() => {
  // 优先使用 clip 上已有的缩略图
  if (mediaClip.value.thumbnails && mediaClip.value.thumbnails.length > 0) {
    return mediaClip.value.thumbnails
  }
  // 否则使用动态加载的缩略图
  return loadedThumbnails.value
})

// 根据 trimStart 和 trimEnd 获取应该展示的缩略图
const trimmedThumbnails = computed(() => {
  const fullData = fullThumbnails.value
  if (!fullData || fullData.length === 0) return []

  const originalDuration = mediaClip.value.originalDuration
  if (originalDuration <= 0) return fullData

  const trimStart = mediaClip.value.trimStart || 0
  const trimEnd = mediaClip.value.trimEnd || originalDuration

  // 计算缩略图的起始和结束索引
  const totalThumbnails = fullData.length
  const startIndex = Math.floor((trimStart / originalDuration) * totalThumbnails)
  const endIndex = Math.ceil((trimEnd / originalDuration) * totalThumbnails)

  // 返回截取后的数据
  return fullData.slice(startIndex, endIndex)
})

// 显示的缩略图
const displayThumbnails = computed(() => {
  const trimmed = trimmedThumbnails.value
  if (trimmed.length > 0) {
    return selectThumbnails(trimmed, thumbnailCount.value)
  }
  // 返回占位符
  return new Array(thumbnailCount.value).fill('')
})

// 从缩略图数组中均匀选择指定数量的缩略图
function selectThumbnails(thumbnails: string[], count: number): string[] {
  if (thumbnails.length <= count) {
    return [...thumbnails]
  }
  const result: string[] = []
  const step = thumbnails.length / count
  for (let i = 0; i < count; i++) {
    const index = Math.floor(i * step)
    result.push(thumbnails[index])
  }
  return result
}

// 加载缩略图
async function loadThumbnails() {
  // 如果已经有缩略图，不需要加载
  if (mediaClip.value.thumbnails && mediaClip.value.thumbnails.length > 0) {
    return
  }

  const sourceUrl = mediaClip.value.sourceUrl
  if (!sourceUrl) return

  isLoading.value = true
  try {
    const result = await extractVideoThumbnails(sourceUrl, {
      count: 20,
      width: 120
    })
    loadedThumbnails.value = result.thumbnails
  } catch (error) {
    console.error('Failed to load video thumbnails:', error)
  } finally {
    isLoading.value = false
  }
}

// 监听 sourceUrl 变化
watch(() => mediaClip.value.sourceUrl, () => {
  loadedThumbnails.value = []
  loadThumbnails()
})

// 组件挂载时加载缩略图
onMounted(() => {
  loadThumbnails()
})

// 组件卸载时清理
onUnmounted(() => {
  // 清理 blob URL
  for (const url of loadedThumbnails.value) {
    if (url.startsWith('blob:')) {
      URL.revokeObjectURL(url)
    }
  }
})
</script>

<style scoped>
.video-clip {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: inherit;
  overflow: hidden;
}

.video-clip__thumbnails {
  flex: 1;
  display: flex;
  overflow: hidden;
  position: relative;
}

.video-clip__loading {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  background: rgba(0, 0, 0, 0.3);
}

.video-clip__loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.video-clip__loading-text {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.8);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.video-clip__thumbnail {
  flex-shrink: 0;
  height: 100%;
  background-size: cover;
  background-position: center;
  border-right: 1px solid rgba(0, 0, 0, 0.1);
  position: relative;
}

.video-clip__thumbnail:last-child {
  border-right: none;
}

.video-clip__thumbnail::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, transparent 70%, rgba(0, 0, 0, 0.2));
  pointer-events: none;
}

.video-clip__thumbnail-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  opacity: 0.6;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

.video-clip__info {
  position: absolute;
  top: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 2px 6px;
  background: rgba(0, 0, 0, 0.4);
  font-size: 10px;
  font-weight: 500;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  flex-shrink: 0;
}

.video-clip__name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
}

.video-clip__rate {
  padding: 1px 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  font-size: 9px;
  font-weight: 600;
  margin-left: 4px;
}
</style>
