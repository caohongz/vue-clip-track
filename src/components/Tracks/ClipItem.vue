<template>
  <div class="clip" ref="clipRef" :class="clipClasses" :style="clipStyle" @mousedown="handleMouseDown"
    @dblclick="handleDblClick" @mousemove="handleMouseMove" @mouseleave="handleMouseLeave"
    @contextmenu.prevent="handleContextMenu">
    <!-- 左侧调整手柄 -->
    <div v-if="!track.locked && canShowResizeHandle" class="clip__handle clip__handle--left"
      @mousedown.stop="handleResizeStart('left', $event)" />

    <!-- Clip 内容 -->
    <div class="clip__content">
      <component :is="clipComponent" :clip="clip as any" />
    </div>

    <!-- 右侧调整手柄 -->
    <div v-if="!track.locked && canShowResizeHandle" class="clip__handle clip__handle--right"
      @mousedown.stop="handleResizeStart('right', $event)" />

    <!-- 添加转场按钮 -->
    <div v-if="showTransitionBtn && adjacentClip && !hasTransition && clip.type === 'video'"
      class="clip__transition-btn" :style="{
        left: transitionBtnPosition.x + 'px',
        top: transitionBtnPosition.y + 'px'
      }" @mousedown.stop @click="handleAddTransitionClick" title="点击添加转场">
      <span class="clip__transition-icon">🔀</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, inject, watch } from 'vue'
import { useTracksStore } from '@/stores/tracks'
import { useScaleStore } from '@/stores/scale'
import { useDragStore } from '@/stores/drag'
import VideoClip from './Clips/VideoClip.vue'
import AudioClip from './Clips/AudioClip.vue'
import SubtitleClip from './Clips/SubtitleClip.vue'
import TextClip from './Clips/TextClip.vue'
import StickerClip from './Clips/StickerClip.vue'
import FilterClip from './Clips/FilterClip.vue'
import EffectClip from './Clips/EffectClip.vue'
import TransitionClip from './Clips/TransitionClip.vue'
import type { Clip, Track } from '@/types'

// Props
interface Props {
  clip: Clip
  track: Track
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  dragStart: [clip: Clip, event: MouseEvent]
  resizeStart: [clip: Clip, edge: 'left' | 'right', event: MouseEvent]
  contextMenu: [clip: Clip, event: MouseEvent]
  click: [clip: Clip, event: MouseEvent]
  dblclick: [clip: Clip, time: number]
  addTransition: [beforeClipId: string, afterClipId: string]
}>()

// Stores
const tracksStore = useTracksStore()
const scaleStore = useScaleStore()
const dragStore = useDragStore()

// Inject config
const config = inject<any>('config', {})

// Refs
const clipRef = ref<HTMLElement>()

// Local state
const isResizing = ref(false)
const showTransitionBtn = ref(false)
const transitionBtnPosition = ref({ x: 0, y: 0 })

// 拖拽延迟启动相关
let dragPending = false
let dragStartEvent: MouseEvent | null = null
const DRAG_THRESHOLD = 3 // 移动超过3px才启动拖拽

// Computed
const isSelected = computed(() => tracksStore.selectedClipIds.has(props.clip.id))

// 检查当前 clip 是否正在被拖拽
const isBeingDragged = computed(() => dragStore.draggedClipIds.has(props.clip.id))

// 监听拖拽状态，拖拽结束时清理初始位置
watch(() => dragStore.isDragging, (isDragging) => {
  if (!isDragging) {
    dragStartRect.value = null
  }
})

const actualPixelsPerSecond = computed(() => scaleStore.actualPixelsPerSecond)

// 获取当前 clip 的配置
const clipConfig = computed(() => {
  const clipConfigs = config.clipConfigs || {}
  return clipConfigs[props.clip.type] || {}
})

const clipClasses = computed(() => ({
  'clip--selected': isSelected.value,
  'clip--locked': props.track.locked,
  'clip--dragging': isBeingDragged.value && dragStore.isDragging,
  'clip--resizing': isResizing.value,
  'clip--show-transition-btn': showTransitionBtn.value
}))

// 记录拖拽开始时的初始位置
const dragStartRect = ref<DOMRect | null>(null)

const clipStyle = computed(() => {
  const duration = props.clip.endTime - props.clip.startTime
  const width = duration * actualPixelsPerSecond.value
  const left = props.clip.startTime * actualPixelsPerSecond.value

  const config = clipConfig.value

  // 计算高度和位置
  let height = 32
  let top = 8

  if (props.track.isMain) {
    height = 64
    top = 8 // (80 - 64) / 2
  } else if (props.clip.type === 'video' || props.track.type === 'video') {
    height = 48
    top = 8 // (64 - 48) / 2
  } else {
    height = 32
    top = 8 // (48 - 32) / 2
  }

  // 如果配置中有覆盖，则使用配置
  if (config.height) height = config.height
  if (config.top) top = config.top

  // 基础样式
  const style: Record<string, any> = {
    left: `${left}px`,
    width: `${width}px`,
    height: `${height}px`,
    top: `${top}px`,
    '--clip-bg-color': config.backgroundColor,
    '--clip-border-color': config.borderColor,
    '--clip-selected-bg-color': config.selected?.backgroundColor,
    '--clip-selected-border-color': config.selected?.borderColor,
    '--clip-hover-border-color': config.hover?.borderColor,
    '--clip-border-width': config.borderWidth ? `${config.borderWidth}px` : '1px',
    '--clip-border-radius': typeof config.borderRadius === 'number' ? `${config.borderRadius}px` : (config.borderRadius || 'var(--radius-sm)'),
    '--clip-opacity': config.opacity,
    '--clip-selected-box-shadow': config.selected?.boxShadow
  }

  // 如果正在被拖拽，使用 fixed 定位跟随鼠标
  if (isBeingDragged.value && dragStore.isDragging && dragStartRect.value) {
    const offset = dragStore.dragOffset
    const rect = dragStartRect.value
    // 使用初始屏幕位置 + 偏移量计算 fixed 定位的坐标
    style.position = 'fixed'
    style.left = `${rect.left + offset.x}px`
    style.top = `${rect.top + offset.y}px`
    style.width = `${rect.width}px`
    style.height = `${rect.height}px`
    style.zIndex = 1000 // 拖拽时的层级需要足够高以覆盖其他轨道
    style.pointerEvents = 'none'
    // 不需要 transform，因为位置已经通过 left/top 计算
    style.transform = 'none'
  }

  return style
})

// 根据类型选择对应的组件
const clipComponent = computed(() => {
  const config = clipConfig.value

  // 如果配置中指定了自定义组件，使用自定义组件
  if (config.component) {
    return config.component
  }

  // 否则使用默认组件映射
  const componentMap = {
    video: VideoClip,
    audio: AudioClip,
    subtitle: SubtitleClip,
    text: TextClip,
    sticker: StickerClip,
    filter: FilterClip,
    effect: EffectClip,
    transition: TransitionClip
  }
  return componentMap[props.clip.type as keyof typeof componentMap] || VideoClip
})

// 检查右侧是否有相接的clip（用于显示添加转场按钮）
const adjacentClip = computed(() => {
  // 转场clip不显示添加转场按钮
  if (props.clip.type === 'transition') return null

  // 获取同轨道的所有clips
  const trackClips = props.track.clips.filter(c => c.type !== 'transition')

  // 查找在当前clip右侧紧邻的clip
  return trackClips.find(c =>
    c.id !== props.clip.id &&
    Math.abs(c.startTime - props.clip.endTime) < 0.01 // 允许0.01秒的误差
  ) || null
})

// 检查是否已经有转场
const hasTransition = computed(() => {
  if (!adjacentClip.value) return false

  // 检查轨道上是否已经存在转场
  return props.track.clips.some(c =>
    c.type === 'transition' &&
    c.startTime < props.clip.endTime &&
    c.endTime > props.clip.endTime
  )
})


// Resize手柄显示逻辑：
// 1. 转场clip：始终可以调整
// 2. 普通clip：根据配置决定是否可调整大小
const canShowResizeHandle = computed(() => {
  if (props.clip.type === 'transition') return true // 转场始终可以调整
  const config = clipConfig.value
  return config.resizable !== false // 默认可调整大小
})

// 处理鼠标按下（拖拽）
function handleMouseDown(event: MouseEvent) {
  if (props.track.locked) return

  // 发送点击事件
  emit('click', props.clip, event)

  // 如果是右键或中键，不启动拖拽
  if (event.button !== 0) return

  // 转场clip不启动拖拽，但需要处理选中逻辑
  if (props.clip.type === 'transition') {
    // 选中该clip
    tracksStore.selectClip(props.clip.id)
    return
  }

  // 延迟启动拖拽，等待鼠标移动超过阈值
  dragPending = true
  dragStartEvent = event

  const startX = event.clientX
  const startY = event.clientY

  // 获取正确的 document（支持 iframe 环境）
  const doc = clipRef.value?.ownerDocument || document

  const handleMouseMove = (moveEvent: MouseEvent) => {
    if (!dragPending) return

    const deltaX = Math.abs(moveEvent.clientX - startX)
    const deltaY = Math.abs(moveEvent.clientY - startY)

    // 只有移动超过阈值才真正启动拖拽
    if (deltaX > DRAG_THRESHOLD || deltaY > DRAG_THRESHOLD) {
      dragPending = false
      if (dragStartEvent) {
        // 记录拖拽开始时 clip 的屏幕位置
        if (clipRef.value) {
          dragStartRect.value = clipRef.value.getBoundingClientRect()
        }
        emit('dragStart', props.clip, dragStartEvent)
      }
      cleanup()
    }
  }

  const handleMouseUp = () => {
    // 鼠标释放时取消待启动的拖拽
    dragPending = false
    dragStartEvent = null
    cleanup()
  }

  const cleanup = () => {
    doc.removeEventListener('mousemove', handleMouseMove)
    doc.removeEventListener('mouseup', handleMouseUp)
  }

  doc.addEventListener('mousemove', handleMouseMove)
  doc.addEventListener('mouseup', handleMouseUp)
}

// 处理调整大小开始
function handleResizeStart(edge: 'left' | 'right', event: MouseEvent) {
  if (props.track.locked) return

  // 选中该clip
  tracksStore.selectClip(props.clip.id)

  isResizing.value = true
  emit('resizeStart', props.clip, edge, event)

  // 获取正确的 document（支持 iframe 环境）
  const doc = clipRef.value?.ownerDocument || document

  // 监听鼠标松开
  const handleMouseUp = () => {
    isResizing.value = false
    doc.removeEventListener('mouseup', handleMouseUp)
  }
  doc.addEventListener('mouseup', handleMouseUp)
}

// 处理右键菜单
function handleContextMenu(event: MouseEvent) {
  emit('contextMenu', props.clip, event)
}

// 处理双击（跳转到点击位置的时间）
function handleDblClick(event: MouseEvent) {
  if (!clipRef.value) return

  const rect = clipRef.value.getBoundingClientRect()
  const x = event.clientX - rect.left
  const actualPixels = scaleStore.actualPixelsPerSecond
  // 计算在 clip 内的相对时间，加上 clip 的起始时间
  const relativeTime = x / actualPixels
  const absoluteTime = props.clip.startTime + relativeTime
  // 确保时间在 clip 范围内
  const clampedTime = Math.max(props.clip.startTime, Math.min(absoluteTime, props.clip.endTime))
  emit('dblclick', props.clip, clampedTime)
}

// 处理鼠标移动（检测是否在转场添加区域）
function handleMouseMove(event: MouseEvent) {
  if (!adjacentClip.value || hasTransition.value || props.track.locked) {
    showTransitionBtn.value = false
    return
  }

  const target = event.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  const mouseX = event.clientX - rect.left
  const clipWidth = rect.width

  // 检测是否在右边缘2px范围内
  if (mouseX >= clipWidth - 2 && mouseX <= clipWidth) {
    showTransitionBtn.value = true

    // 计算两个clip中间的时间点
    const middleTime = (props.clip.endTime + adjacentClip.value.startTime) / 2
    // 转换为像素位置（相对于当前clip的开始位置）
    const middlePixel = (middleTime - props.clip.startTime) * actualPixelsPerSecond.value

    transitionBtnPosition.value = {
      x: middlePixel, // 两个clip的中间位置
      y: rect.height / 2
    }
  } else {
    showTransitionBtn.value = false
  }
}

// 处理鼠标离开
function handleMouseLeave() {
  showTransitionBtn.value = false
}

// 处理添加转场点击
function handleAddTransitionClick(event: MouseEvent) {
  event.stopPropagation()
  if (adjacentClip.value) {
    emit('addTransition', props.clip.id, adjacentClip.value.id)
  }
  showTransitionBtn.value = false
}
</script>

<style scoped>
.clip {
  position: absolute;
  background: var(--clip-bg-color, var(--color-bg-lighter));
  border: var(--clip-border-width, 1px) solid var(--clip-border-color, var(--color-border));
  border-radius: var(--clip-border-radius, var(--radius-sm));
  opacity: var(--clip-opacity, 1);
  cursor: move;
  overflow: hidden;
  user-select: none;
  z-index: 1;
}


/* 显示转场按钮时允许按钮完全显示 */
.clip--show-transition-btn {
  overflow: visible;
  /* 确保转场按钮显示时clip本身有足够高的层级 */
  z-index: 5000;
}

/* 转场 Clip 特殊样式 */
.clip:has(.transition-clip) {
  background: transparent;
  border: none;
  cursor: default;
  z-index: 2;
  /* 转场背景层级较低 */
}

.clip:not(.clip--dragging):not(.clip--resizing) {
  transition: border-color var(--transition-fast);
}

/* 拖拽时的样式 */
.clip--dragging {
  opacity: 0.9;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5);
  cursor: grabbing;
  border-color: var(--color-primary);
}

.clip:hover {
  border-color: var(--clip-hover-border-color, var(--color-primary));
}

.clip--selected {
  background: var(--clip-selected-bg-color, var(--clip-bg-color, var(--color-bg-lighter)));
  border-color: var(--clip-selected-border-color, var(--color-primary));
  border-width: 2px;
  box-shadow:
    var(--clip-selected-box-shadow,
      0 0 0 2px rgba(102, 126, 234, 0.4),
      0 0 12px rgba(102, 126, 234, 0.3),
      0 4px 16px rgba(0, 0, 0, 0.25));
  z-index: 3;
}

.clip--selected .clip__content {
  z-index: 3;
  /* 选中clip的内容层级 */
}

.clip--selected .clip__handle {
  z-index: 4;
  /* 选中clip的把手层级最高 */
}

.clip--locked {
  cursor: not-allowed;
  opacity: 0.6;
  filter: grayscale(0.5);
}

.clip__content {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  pointer-events: none;
  position: relative;
  z-index: 1;
}

/* 转场clip的内容层级 */
.clip:has(.transition-clip) .clip__content {
  z-index: 4;
}

.clip__handle {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 4px;
  background: rgba(255, 255, 255, 0.2);
  cursor: ew-resize;
  z-index: 3;
  opacity: 0;
  transition: opacity var(--transition-fast);
  border-radius: 2px;
  margin: 0 2px;
}

/* hover时显示handle */
.clip:hover .clip__handle {
  opacity: 1;
}

/* 选中时始终显示handle */
.clip--selected .clip__handle {
  opacity: 1;
}

.clip__handle:hover {
  background: rgba(255, 255, 255, 0.5);
}

.clip__handle--left {
  left: 0;
}

.clip__handle--right {
  right: 0;
}

.clip__transition-btn {
  position: absolute;
  transform: translate(-50%, -50%);
  width: 24px;
  height: 24px;
  background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
  border: 2px solid white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10000;
  /* 最高层级，确保按钮在所有元素之上，包括其他clip、选择框、拖拽指示器等 */
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5), 0 0 0 2px rgba(255, 255, 255, 0.9);
  transition: all var(--transition-fast);
  animation: pulse 1.5s infinite;
  /* 确保按钮在任何情况下都可见 */
  pointer-events: auto;
  isolation: isolate;
}

.clip__transition-btn:hover {
  transform: translate(-50%, -50%) scale(1.15);
  box-shadow: 0 4px 12px rgba(6, 182, 212, 0.5);
}

.clip__transition-icon {
  font-size: 12px;
  line-height: 1;
}

@keyframes pulse {

  0%,
  100% {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3), 0 0 0 0 rgba(6, 182, 212, 0.7);
  }

  50% {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3), 0 0 0 6px rgba(6, 182, 212, 0);
  }
}
</style>
