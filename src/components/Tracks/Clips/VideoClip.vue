<template>
  <div class="video-clip">
    <div class="video-clip__thumbnails" ref="thumbnailsRef">
      <!-- 加载中状态 -->
      <div v-if="isLoading" class="video-clip__loading">
        <span class="video-clip__loading-spinner"></span>
        <span class="video-clip__loading-text">加载中...</span>
      </div>
      <!-- 缩略图展示 -->
      <div v-else class="video-clip__thumbnail-track" :style="{ width: clipWidth + 'px' }">
        <div v-for="(item, index) in displayThumbnails" :key="index" class="video-clip__thumbnail" :style="{
          backgroundImage: item.url ? `url(${item.url})` : 'none',
          width: item.width + 'px',
          backgroundPosition: 'center',
          backgroundSize: 'cover'
        }">
          <div v-if="!item.url" class="video-clip__thumbnail-placeholder">
            📹
          </div>
        </div>
      </div>
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

// 缩略图宽度限制（根据缩放比例动态调整）
const MIN_THUMBNAIL_WIDTH = 40  // 最小宽度
const MAX_THUMBNAIL_WIDTH = 120 // 最大宽度
const BASE_THUMBNAIL_WIDTH = 80 // 基准宽度

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

// 根据缩放比例计算单个缩略图的理想宽度
const thumbnailIdealWidth = computed(() => {
  // 根据缩放比例调整缩略图宽度
  const scaleFactor = Math.sqrt(scaleStore.scale) // 使用平方根让变化更平滑
  const width = BASE_THUMBNAIL_WIDTH * scaleFactor
  // 限制在最小和最大值之间
  return Math.max(MIN_THUMBNAIL_WIDTH, Math.min(MAX_THUMBNAIL_WIDTH, width))
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

// 计算显示的缩略图列表
// 每个缩略图代表原始视频中的一个时间点
const displayThumbnails = computed(() => {
  const fullData = fullThumbnails.value
  const originalDuration = mediaClip.value.originalDuration
  const trimStart = mediaClip.value.trimStart ?? 0
  const trimEnd = mediaClip.value.trimEnd ?? originalDuration
  const trimDuration = trimEnd - trimStart

  // 如果没有缩略图数据或原始时长无效，返回占位符
  if (!fullData || fullData.length === 0 || originalDuration <= 0 || trimDuration <= 0) {
    const count = Math.max(1, Math.ceil(clipWidth.value / thumbnailIdealWidth.value))
    return Array.from({ length: count }, () => ({
      url: '',
      width: clipWidth.value / count
    }))
  }

  // 每个原始缩略图代表的时间跨度
  const timePerThumbnail = originalDuration / fullData.length

  const result: { url: string; width: number }[] = []
  let currentPixel = 0
  const totalWidth = clipWidth.value

  // 从 trimStart 开始，按照理想宽度步进
  while (currentPixel < totalWidth) {
    // 计算当前像素对应的时间（相对于 clip 开始位置）
    const clipRelativeTime = (currentPixel / totalWidth) * trimDuration
    // 对应到原始视频的时间
    const originalTime = trimStart + clipRelativeTime

    // 计算对应的缩略图索引
    const thumbnailIndex = Math.floor(originalTime / timePerThumbnail)
    // 确保索引在有效范围内
    const safeIndex = Math.max(0, Math.min(thumbnailIndex, fullData.length - 1))

    // 计算这个缩略图应该占用的宽度
    let width = thumbnailIdealWidth.value

    // 如果剩余空间不足一个完整的缩略图宽度，使用剩余宽度
    if (currentPixel + width > totalWidth) {
      width = totalWidth - currentPixel
    }

    // 只有宽度大于0才添加
    if (width > 0) {
      result.push({
        url: fullData[safeIndex],
        width
      })
    }

    currentPixel += width
  }

  return result
})

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

.video-clip__thumbnail-track {
  display: flex;
  height: 100%;
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
