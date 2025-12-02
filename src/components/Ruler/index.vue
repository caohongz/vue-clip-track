<template>
  <div class="ruler" ref="rulerRef">
    <!-- 左侧占位（对齐轨道控制栏） -->
    <div class="ruler__placeholder" :style="{ width: trackControlWidth + 'px' }" />

    <!-- 时间线内容区 -->
    <div class="ruler__wrapper" ref="rulerWrapperRef" @scroll="handleScroll">
      <div class="ruler__content" :style="{ width: contentWidth + 'px' }" @mousedown="handleRulerClick">
        <!-- 刻度线 -->
        <div v-for="mark in marks" :key="mark.time" class="ruler__mark" :class="{
          'ruler__mark--major': mark.isMajor
        }" :style="{
          left: mark.position + 'px',
          height: mark.height + 'px'
        }">
          <span v-if="mark.isMajor" class="ruler__mark-label">
            {{ formatMarkTime(mark.time) }}
          </span>
        </div>
      </div>
    </div>

    <!-- 游标手柄和线条（独立于滚动容器） -->
    <div v-if="cursorVisible" class="ruler__cursor-handle"
      :class="{ 'ruler__cursor-handle--dragging': isDraggingCursor }" :style="{ left: cursorDisplayPosition + 'px' }"
      @mousedown.stop="handleCursorDragStart">
      <!-- 向下连接线 -->
      <div class="ruler__cursor-line" @mousedown.stop="handleCursorDragStart" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { usePlaybackStore } from '@/stores/playback'
import { useScaleStore } from '@/stores/scale'
import { useTracksStore } from '@/stores/tracks'
import { useDragStore } from '@/stores/drag'

// Props
interface Props {
  width?: number
  scrollLeft?: number
  trackControlWidth?: number
}

const props = withDefaults(defineProps<Props>(), {
  width: 0,
  scrollLeft: 0,
  trackControlWidth: 200
})

// Emits
const emit = defineEmits<{
  scroll: [left: number]
  seek: [time: number]
}>()

// Stores
const playbackStore = usePlaybackStore()
const scaleStore = useScaleStore()
const tracksStore = useTracksStore()
const dragStore = useDragStore()

// Refs
const rulerRef = ref<HTMLElement>()
const rulerWrapperRef = ref<HTMLElement>()
const isDraggingCursor = ref(false)

// 提供给外部组件判断是否在拖拽
defineExpose({
  isDraggingCursor
})

// Computed
const rulerConfig = computed(() => scaleStore.rulerConfig)
const actualPixelsPerSecond = computed(() => scaleStore.actualPixelsPerSecond)

// 内容总宽度
const contentWidth = computed(() => {
  const maxDuration = Math.max(
    tracksStore.totalDuration,
    playbackStore.duration,
    dragStore.previewEndTime, // 拖拽预览的结束时间
    60 // 最少显示 60 秒
  )
  return Math.ceil(maxDuration * actualPixelsPerSecond.value)
})

// 生成刻度标记（使用整数索引避免浮点数误差）
const marks = computed(() => {
  const result: Array<{
    time: number
    position: number
    isMajor: boolean
    height: number
  }> = []

  const config = rulerConfig.value
  const maxTime = contentWidth.value / actualPixelsPerSecond.value
  const minorInterval = config.minorInterval
  const majorInterval = config.majorInterval

  // 计算需要生成的刻度数量
  const totalMarks = Math.ceil(maxTime / minorInterval) + 1

  // 使用整数索引生成刻度，避免浮点数累加误差
  for (let i = 0; i < totalMarks; i++) {
    const time = i * minorInterval
    if (time > maxTime) break

    // 使用更精确的方法判断是否为主刻度
    const isMajor = Math.abs(Math.round(time / majorInterval) * majorInterval - time) < 0.001

    result.push({
      time,
      position: time * actualPixelsPerSecond.value,
      isMajor,
      height: isMajor ? config.majorHeight : config.minorHeight
    })
  }

  return result
})

// 游标在内容中的位置（用于拖拽计算）
const cursorPosition = computed(() => {
  return playbackStore.currentTime * actualPixelsPerSecond.value
})

// 游标显示位置（考虑滚动和控制栏偏移）
const cursorDisplayPosition = computed(() => {
  return props.trackControlWidth + cursorPosition.value - (props.scrollLeft || 0)
})

// 游标是否可见（不在轨道控制栏区域）
const cursorVisible = computed(() => {
  return cursorDisplayPosition.value >= props.trackControlWidth
})

// 格式化刻度时间
function formatMarkTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

// 处理点击时间线
function handleRulerClick(event: MouseEvent) {
  if (isDraggingCursor.value) return

  const rect = rulerRef.value?.getBoundingClientRect()
  if (!rect) return

  // 减去左侧占位宽度
  const x = event.clientX - rect.left - props.trackControlWidth + (props.scrollLeft || 0)
  const time = x / actualPixelsPerSecond.value
  const seekTime = Math.max(0, time)

  // 直接跳转到点击位置，不进行吸附
  playbackStore.seekTo(seekTime)
  emit('seek', seekTime)
}

// 开始拖拽游标
// 开始拖拽游标
function handleCursorDragStart() {
  isDraggingCursor.value = true
  playbackStore.pause()
  document.body.style.userSelect = 'none' // 防止拖拽时选中文字

  let rafId: number | null = null
  let currentMouseX = 0
  let autoScrollSpeed = 0

  // 自动滚动循环
  const autoScrollLoop = () => {
    if (!isDraggingCursor.value) return

    if (autoScrollSpeed !== 0 && rulerWrapperRef.value) {
      rulerWrapperRef.value.scrollLeft += autoScrollSpeed
      emit('scroll', rulerWrapperRef.value.scrollLeft) // 手动触发滚动事件以同步轨道区域
      updateTime()
    }

    rafId = requestAnimationFrame(autoScrollLoop)
  }

  // 更新时间
  const updateTime = () => {
    const rect = rulerRef.value?.getBoundingClientRect()
    if (!rect || !rulerWrapperRef.value) return

    // 计算鼠标相对于时间线内容区的位置（考虑滚动）
    const x = currentMouseX - rect.left - props.trackControlWidth + rulerWrapperRef.value.scrollLeft
    let newTime = x / actualPixelsPerSecond.value

    // 限制在有效范围内
    newTime = Math.max(0, newTime)

    playbackStore.seekTo(newTime)
  }

  const handleMouseMove = (e: MouseEvent) => {
    currentMouseX = e.clientX

    // 计算自动滚动速度
    const rect = rulerWrapperRef.value?.getBoundingClientRect()
    if (rect) {
      const threshold = 50 // 边缘阈值
      const maxSpeed = 15 // 最大滚动速度

      if (e.clientX < rect.left + threshold) {
        // 向左滚动
        const ratio = 1 - (e.clientX - rect.left) / threshold
        autoScrollSpeed = -maxSpeed * Math.max(0, ratio)
      } else if (e.clientX > rect.right - threshold) {
        // 向右滚动
        const ratio = 1 - (rect.right - e.clientX) / threshold
        autoScrollSpeed = maxSpeed * Math.max(0, ratio)
      } else {
        autoScrollSpeed = 0
      }
    }

    // 如果没有自动滚动，立即更新时间
    if (autoScrollSpeed === 0) {
      updateTime()
    }
  }

  const handleMouseUp = () => {
    isDraggingCursor.value = false
    document.body.style.userSelect = '' // 恢复文字选中
    if (rafId) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)

    // 拖拽结束时触发 seek 事件
    emit('seek', playbackStore.currentTime)
  }

  // 初始化鼠标位置
  // 注意：这里没有 event 参数，所以无法立即获取 mouseX，
  // 但 mousemove 会很快触发。或者我们可以让 handleCursorDragStart 接收 event
  // 不过为了保持简单，我们等待第一次 mousemove

  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)

  // 启动循环
  rafId = requestAnimationFrame(autoScrollLoop)
}

// 处理滚动
function handleScroll() {
  if (rulerWrapperRef.value) {
    emit('scroll', rulerWrapperRef.value.scrollLeft)
  }
}

// 监听外部滚动变化，同步到时间线
watch(() => props.scrollLeft, (newScrollLeft) => {
  if (rulerWrapperRef.value && rulerWrapperRef.value.scrollLeft !== newScrollLeft) {
    rulerWrapperRef.value.scrollLeft = newScrollLeft
  }
})

// 监听游标位置，自动滚动
watch(cursorPosition, (newPos) => {
  // 拖拽时不自动滚动，由拖拽逻辑控制
  if (isDraggingCursor.value) return
  if (!rulerWrapperRef.value) return

  const containerWidth = rulerWrapperRef.value.clientWidth
  const currentScrollLeft = rulerWrapperRef.value.scrollLeft

  // 如果游标超出可视区域，自动滚动
  if (newPos < currentScrollLeft) {
    rulerWrapperRef.value.scrollLeft = newPos
  } else if (newPos > currentScrollLeft + containerWidth) {
    rulerWrapperRef.value.scrollLeft = newPos - containerWidth + 50
  }
})
</script>

<style scoped>
.ruler {
  position: relative;
  width: 100%;
  height: 36px;
  background: var(--color-bg-elevated);
  border-bottom: 1px solid var(--color-border);
  overflow: visible;
  flex-shrink: 0;
  display: flex;
  transition: background-color var(--transition-base);
}

.ruler__placeholder {
  flex-shrink: 0;
  height: 100%;
  background: var(--color-bg-elevated);
}

.ruler__wrapper {
  flex: 1;
  overflow-x: auto;
  overflow-y: hidden;
  position: relative;
  cursor: pointer;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.ruler__wrapper::-webkit-scrollbar {
  display: none;
}

.ruler__content {
  position: relative;
  height: 100%;
}

.ruler__mark {
  position: absolute;
  bottom: 0;
  width: 1px;
  background: var(--color-border);
  transition: background var(--transition-fast);
  overflow: visible;
}

.ruler__mark--major {
  background: var(--color-border-light);
}

.ruler__mark-label {
  position: absolute;
  top: 4px;
  left: 4px;
  font-size: 11px;
  font-weight: 400;
  color: var(--color-text-tertiary);
  white-space: nowrap;
  user-select: none;
  font-family: 'Courier New', monospace;
  letter-spacing: 0.01em;
}

.ruler__cursor-handle {
  position: absolute;
  top: 0;
  left: 0;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 7px solid transparent;
  border-right: 7px solid transparent;
  border-top: 10px solid var(--color-primary);
  cursor: grab;
  pointer-events: auto;
  z-index: 10;
}

.ruler__cursor-handle:not(.ruler__cursor-handle--dragging):hover {
  transform: translateX(-50%) scale(1.2);
  filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.4)) drop-shadow(0 0 10px var(--color-primary));
}

.ruler__cursor-handle:active,
.ruler__cursor-handle--dragging {
  cursor: grabbing;
  transform: translateX(-50%) scale(1.1);
}

.ruler__cursor-line {
  position: absolute;
  top: -5px;
  left: 50%;
  transform: translateX(-50%);
  width: 2px;
  height: 100vh;
  background: var(--color-primary);
  pointer-events: auto;
  cursor: grab;
  z-index: 9;
}

.ruler__cursor-line:active,
.ruler__cursor-handle--dragging .ruler__cursor-line {
  cursor: grabbing;
}
</style>
