<template>
  <div class="track-area" ref="trackAreaRef" @scroll="handleScroll" @mousedown="handleMouseDown"
    @contextmenu.prevent="handleTrackContextMenu" @dragover.prevent="handleDragOver" @drop.prevent="handleDrop"
    @dragleave="handleDragLeave">
    <div class="track-area__content" :style="{ width: contentWidth + 'px', minHeight: trackHeight + 'px' }"
      :data-track-id="track.id" :class="{ 'track-area__content--drag-over': isDragOver }">
      <!-- Clips -->
      <ClipItem v-for="clip in track.clips" :key="clip.id" :clip="clip" :track="track" :data-clip-id="clip.id"
        @drag-start="handleClipDragStart" @resize-start="handleClipResizeStart" @click="handleClipClick"
        @dblclick="handleClipDblClick" @context-menu="handleClipContextMenu" @add-transition="handleAddTransition" />

      <!-- 拖拽预览框 -->
      <DragPreview v-if="showDragPreview" :track="track" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useScaleStore } from '@/stores/scale'
import { useTracksStore } from '@/stores/tracks'
import { useDragStore } from '@/stores/drag'
import { useResize } from '@/composables/useResize'
import { normalizeTime } from '@/utils/helpers'
import ClipItem from './ClipItem.vue'
import DragPreview from './DragPreview.vue'
import type { Track, Clip } from '@/types'

// Props
interface Props {
  track: Track
  scrollLeft?: number
}

const props = withDefaults(defineProps<Props>(), {
  scrollLeft: 0
})

// Emits
const emit = defineEmits<{
  scroll: [left: number]
  contextMenu: [clip: Clip, event: MouseEvent]
  trackContextMenu: [track: Track, time: number, event: MouseEvent]
  addTransition: [beforeClipId: string, afterClipId: string]
  dropMedia: [mediaData: any, trackId: string, startTime: number]
  seek: [time: number]
}>()

// Stores
const scaleStore = useScaleStore()
const tracksStore = useTracksStore()
const dragStore = useDragStore()

import { usePlaybackStore } from '@/stores/playback'
const playbackStore = usePlaybackStore()

// Composables
const { startResize } = useResize()

// Refs
const trackAreaRef = ref<HTMLElement>()
const isDragOver = ref(false)
const dragDropPosition = ref<number | null>(null)

// Computed
const actualPixelsPerSecond = computed(() => scaleStore.actualPixelsPerSecond)

// 是否显示拖拽预览（当前轨道是目标轨道时显示）
const showDragPreview = computed(() => {
  if (!dragStore.isDragging) return false
  if (!dragStore.previewPosition.visible) return false

  // 当目标轨道是当前轨道时显示预览
  return dragStore.previewPosition.trackId === props.track.id
})

const contentWidth = computed(() => {
  const maxDuration = Math.max(
    tracksStore.totalDuration,
    dragStore.previewEndTime, // 拖拽预览的结束时间
    60 // 最少显示 60 秒
  )
  return Math.ceil(maxDuration * actualPixelsPerSecond.value)
})

// 计算轨道高度
const trackHeight = computed(() => {
  if (props.track.isMain) {
    return 80
  }
  // 简单的类型判断，实际可能需要更复杂的逻辑
  const isVideoTrack = props.track.clips.some(c => c.type === 'video') || props.track.type === 'video'
  if (isVideoTrack) {
    return 64
  }
  return 48
})

// 处理滚动
function handleScroll() {
  if (trackAreaRef.value) {
    emit('scroll', trackAreaRef.value.scrollLeft)
  }
}

// 监听外部滚动变化
watch(() => props.scrollLeft, (newLeft) => {
  if (trackAreaRef.value && trackAreaRef.value.scrollLeft !== newLeft) {
    trackAreaRef.value.scrollLeft = newLeft
  }
})

// 处理 Clip 拖拽开始
function handleClipDragStart(clip: Clip, event: MouseEvent) {
  // 传递正确的 document（支持 iframe 环境）
  const doc = trackAreaRef.value?.ownerDocument || document
  dragStore.startDrag(clip, event, doc)
}

// 处理 Clip 调整大小开始
function handleClipResizeStart(clip: Clip, edge: 'left' | 'right', event: MouseEvent) {
  startResize(clip, edge, event)
}

// 处理鼠标按下（点击空白区域取消选中并改变播放时间）
function handleMouseDown(event: MouseEvent) {
  // 排除右键点击
  if (event.button !== 0) {
    return
  }

  const target = event.target as HTMLElement

  // 如果点击的是 clip 或其子元素，不处理
  if (target.closest('.clip')) {
    return
  }

  // 点击空白区域，清空选择
  tracksStore.clearSelection()

  // 计算点击位置对应的时间并设置播放时间
  if (trackAreaRef.value) {
    const rect = trackAreaRef.value.getBoundingClientRect()
    const x = event.clientX - rect.left + trackAreaRef.value.scrollLeft
    const time = normalizeTime(x / actualPixelsPerSecond.value)
    playbackStore.seekTo(time)
    emit('seek', time)
  }
}

// 处理 Clip 点击（单选）
function handleClipClick(clip: Clip, _event: MouseEvent) {
  // 单选模式：直接选中当前 clip
  tracksStore.selectClip(clip.id)
}

// 处理 Clip 双击（改变播放时间）
function handleClipDblClick(clip: Clip, time: number) {
  playbackStore.seekTo(time)
  emit('seek', time)
}

// 处理 Clip 右键菜单
function handleClipContextMenu(clip: Clip, event: MouseEvent) {
  emit('contextMenu', clip, event)
}

// 处理轨道空白区域右键菜单
function handleTrackContextMenu(event: MouseEvent) {
  const target = event.target as HTMLElement

  // 如果点击的是 clip 或其子元素，不触发轨道右键菜单（由 ClipItem 处理）
  if (target.closest('.clip')) {
    return
  }

  // 计算点击位置对应的时间
  if (!trackAreaRef.value) return

  const rect = trackAreaRef.value.getBoundingClientRect()
  const x = event.clientX - rect.left + trackAreaRef.value.scrollLeft
  const time = x / actualPixelsPerSecond.value

  // 触发轨道右键菜单事件
  emit('trackContextMenu', props.track, time, event)
}

// 处理添加转场请求
function handleAddTransition(beforeClipId: string, afterClipId: string) {
  emit('addTransition', beforeClipId, afterClipId)
}

// 处理拖拽悬停
function handleDragOver(event: DragEvent) {
  if (!trackAreaRef.value) return

  isDragOver.value = true

  // 计算拖放位置
  const rect = trackAreaRef.value.getBoundingClientRect()
  const x = event.clientX - rect.left + trackAreaRef.value.scrollLeft
  dragDropPosition.value = x
}

// 处理拖拽离开
function handleDragLeave(event: DragEvent) {
  // 只在真正离开 track-area 时才重置
  if (event.target === trackAreaRef.value) {
    isDragOver.value = false
    dragDropPosition.value = null
  }
}

// 处理放置
function handleDrop(event: DragEvent) {
  isDragOver.value = false
  dragDropPosition.value = null

  if (!trackAreaRef.value || !event.dataTransfer) return

  try {
    // 尝试解析拖拽数据
    const jsonData = event.dataTransfer.getData('application/json')
    if (!jsonData) return

    const mediaData = JSON.parse(jsonData)

    // 计算放置的时间点
    const rect = trackAreaRef.value.getBoundingClientRect()
    const x = event.clientX - rect.left + trackAreaRef.value.scrollLeft
    const startTime = normalizeTime(x / actualPixelsPerSecond.value)

    // 向上发射事件
    emit('dropMedia', mediaData, props.track.id, startTime)
  } catch (error) {
    console.error('处理拖放失败:', error)
  }
}

</script>

<style scoped>
.track-area {
  flex: 1;
  overflow-x: auto;
  overflow-y: hidden;
  background: var(--color-bg-dark);
  position: relative;
  scrollbar-width: none;
  -ms-overflow-style: none;
  transition: background-color var(--transition-base);
}

.track-area::-webkit-scrollbar {
  display: none;
}

.track-area__content {
  position: relative;
  height: 100%;
  /* min-height 由内联样式控制 */
  overflow: visible;
  /* 确保转场按钮等绝对定位元素能完全显示 */
}

.track-area__content--drag-over {
  background: hsla(var(--theme-hue), var(--theme-saturation), var(--theme-lightness), 0.06);
}

.track-area__drop-indicator {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  background: var(--color-primary);
  pointer-events: none;
  z-index: 60;
  box-shadow: 0 0 12px var(--color-primary), 0 0 4px var(--color-primary);
  filter: brightness(1.2);
}

.track-area__drop-indicator::before {
  content: '';
  position: absolute;
  top: -1px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-top: 10px solid var(--color-primary);
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}
</style>
