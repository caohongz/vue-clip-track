<template>
  <div class="audio-clip" ref="clipRef">
    <!-- 加载中状态 -->
    <div v-if="isLoading" class="audio-clip__loading">
      <span class="audio-clip__loading-spinner"></span>
      <span class="audio-clip__loading-text">加载波形...</span>
    </div>
    <!-- 波形展示 -->
    <canvas v-else ref="canvasRef" class="audio-clip__waveform" :width="canvasWidth" :height="canvasHeight" />
    <div class="audio-clip__info">
      <span class="audio-clip__name">{{ clipName }}</span>
      <span v-if="mediaClip.volume !== undefined" class="audio-clip__volume">
        🔊 {{ Math.round(mediaClip.volume * 100) }}%
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, onUnmounted, nextTick } from 'vue'
import { useScaleStore } from '@/stores/scale'
import { extractAudioWaveform, extractVideoAudioWaveform } from '@/utils/mediaProcessor'
import type { MediaClip } from '@/types'

// Props
interface Props {
  clip: MediaClip
}

const props = defineProps<Props>()

// Stores
const scaleStore = useScaleStore()

// Refs
const clipRef = ref<HTMLElement>()
const canvasRef = ref<HTMLCanvasElement>()
const canvasWidth = ref(400)
const canvasHeight = ref(32)
const isLoading = ref(false)
const loadedWaveformData = ref<number[]>([])

// ResizeObserver
let resizeObserver: ResizeObserver | null = null

// Computed
const mediaClip = computed(() => props.clip as MediaClip)

const clipName = computed(() => {
  if (mediaClip.value.name) return mediaClip.value.name
  const url = mediaClip.value.sourceUrl
  const parts = url.split('/')
  return parts[parts.length - 1] || 'Audio'
})

// 获取完整的原始波形数据
const fullWaveformData = computed(() => {
  // 优先使用 clip 上已有的波形数据
  if (mediaClip.value.waveformData && mediaClip.value.waveformData.length > 0) {
    return mediaClip.value.waveformData
  }
  // 否则使用动态加载的波形数据
  return loadedWaveformData.value
})

// 根据 trimStart 和 trimEnd 获取应该展示的波形数据
const waveformData = computed(() => {
  const fullData = fullWaveformData.value
  if (!fullData || fullData.length === 0) return []

  const originalDuration = mediaClip.value.originalDuration
  if (originalDuration <= 0) return fullData

  const trimStart = mediaClip.value.trimStart || 0
  const trimEnd = mediaClip.value.trimEnd || originalDuration

  // 计算波形数据的起始和结束索引
  const totalSamples = fullData.length
  const startIndex = Math.floor((trimStart / originalDuration) * totalSamples)
  const endIndex = Math.ceil((trimEnd / originalDuration) * totalSamples)

  // 返回截取后的数据
  return fullData.slice(startIndex, endIndex)
})

// 绘制波形图
function drawWaveform() {
  if (!canvasRef.value) return

  const canvas = canvasRef.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // 清空画布
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // 如果有波形数据，绘制波形
  if (waveformData.value && waveformData.value.length > 0) {
    drawRealWaveform(ctx, waveformData.value)
  } else {
    // 绘制占位符波形
    drawPlaceholderWaveform(ctx)
  }
}

// 绘制真实波形
function drawRealWaveform(ctx: CanvasRenderingContext2D, data: number[]) {
  const width = canvasWidth.value
  const height = canvasHeight.value
  // 柱形宽度计算：使用总宽度除以数据长度
  const barSpacing = width / data.length
  // 实际柱形宽度为间距的 75%
  const barWidth = Math.max(1, barSpacing * 0.75)

  // 创建渐变
  const gradient = ctx.createLinearGradient(0, 0, 0, height)
  gradient.addColorStop(0, 'rgba(16, 185, 129, 0.9)')
  gradient.addColorStop(0.5, 'rgba(16, 185, 129, 1)')
  gradient.addColorStop(1, 'rgba(16, 185, 129, 0.9)')

  ctx.fillStyle = gradient

  // 绘制对称波形
  for (let i = 0; i < data.length; i++) {
    // 柱形居中放置在间距中
    const x = i * barSpacing + (barSpacing - barWidth) / 2
    const amplitude = data[i] * height * 0.85
    const y = (height - amplitude) / 2

    // 绘制圆角矩形
    const radius = Math.min(1, barWidth / 2)

    ctx.beginPath()
    ctx.roundRect(x, y, barWidth, amplitude, radius)
    ctx.fill()
  }

  // 绘制中心线
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(0, height / 2)
  ctx.lineTo(width, height / 2)
  ctx.stroke()
}

// 绘制占位符波形
function drawPlaceholderWaveform(ctx: CanvasRenderingContext2D) {
  const width = canvasWidth.value
  const height = canvasHeight.value
  const bars = Math.max(20, Math.floor(width / 8))

  ctx.fillStyle = 'rgba(16, 185, 129, 0.5)'

  // 使用伪随机生成一致的占位符波形
  const seed = mediaClip.value.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0)

  for (let i = 0; i < bars; i++) {
    const x = (i / bars) * width
    // 使用正弦波 + 噪声生成波形
    const noise = Math.sin(seed + i * 0.5) * 0.3 + Math.sin(seed + i * 1.3) * 0.2
    const barHeight = (0.3 + Math.abs(noise) * 0.5) * height
    const y = (height - barHeight) / 2

    ctx.fillRect(x, y, width / bars - 1, barHeight)
  }
}

// 更新 canvas 尺寸
function updateCanvasSize() {
  if (!clipRef.value) return

  const rect = clipRef.value.getBoundingClientRect()
  canvasWidth.value = Math.max(100, rect.width)
  canvasHeight.value = Math.max(24, rect.height - 20) // 减去 info 区域高度

  nextTick(() => {
    drawWaveform()
  })
}

// 加载波形数据
async function loadWaveform() {
  // 如果已经有波形数据，不需要加载
  if (mediaClip.value.waveformData && mediaClip.value.waveformData.length > 0) {
    return
  }

  const sourceUrl = mediaClip.value.sourceUrl
  if (!sourceUrl) return

  isLoading.value = true
  try {
    // 根据文件类型选择提取方法
    // 使用更多采样点（500）以获取完整精细的波形数据
    const isVideo = sourceUrl.match(/\.(mp4|webm|mov|avi)$/i)
    const result = isVideo
      ? await extractVideoAudioWaveform(sourceUrl, { samples: 500 })
      : await extractAudioWaveform(sourceUrl, { samples: 500 })

    loadedWaveformData.value = result.waveformData
  } catch (error) {
    console.error('Failed to load audio waveform:', error)
  } finally {
    isLoading.value = false
    nextTick(() => {
      drawWaveform()
    })
  }
}

// 监听 sourceUrl 变化
watch(() => mediaClip.value.sourceUrl, () => {
  loadedWaveformData.value = []
  loadWaveform()
})

// 监听波形数据变化
watch(waveformData, () => {
  nextTick(() => {
    drawWaveform()
  })
})

// 监听 trimStart/trimEnd 变化，重新绘制波形
watch(
  () => [mediaClip.value.trimStart, mediaClip.value.trimEnd],
  () => {
    nextTick(() => {
      drawWaveform()
    })
  }
)

// 监听缩放变化
watch(() => scaleStore.actualPixelsPerSecond, () => {
  updateCanvasSize()
})

// 组件挂载时
onMounted(() => {
  // 设置 ResizeObserver
  if (clipRef.value) {
    resizeObserver = new ResizeObserver(() => {
      updateCanvasSize()
    })
    resizeObserver.observe(clipRef.value)
  }

  updateCanvasSize()
  loadWaveform()
})

// 组件卸载时清理
onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
})
</script>

<style scoped>
.audio-clip {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border-radius: inherit;
  overflow: hidden;
  position: relative;
}

.audio-clip__loading {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  background: rgba(0, 0, 0, 0.3);
}

.audio-clip__loading-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.audio-clip__loading-text {
  font-size: 9px;
  color: rgba(255, 255, 255, 0.8);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.audio-clip__waveform {
  flex: 1;
  width: 100%;
  display: block;
}

.audio-clip__info {
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

.audio-clip__name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
}

.audio-clip__volume {
  padding: 1px 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  font-size: 9px;
  font-weight: 600;
  margin-left: 4px;
}
</style>
