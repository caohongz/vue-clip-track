<template>
  <div class="tracks" ref="tracksRef">
    <!-- 游标线（穿过控制区域） -->
    <div v-if="cursorInControlArea" class="tracks__cursor-line" :style="{ left: cursorDisplayPosition + 'px' }" />

    <!-- 空状态提示 -->
    <div v-if="sortedTracks.length === 0" class="tracks__empty">
      <div class="tracks__empty-content">
        <span class="tracks__empty-icon">🎬</span>
        <span class="tracks__empty-text">{{ locale?.emptyTip || '拖拽媒体文件到此处添加' }}</span>
      </div>
    </div>

    <!-- 轨道滚动容器 -->
    <div v-else class="tracks__scroll-container" ref="scrollContainerRef" @scroll="handleScrollContainerScroll">
      <!-- 轨道表格 -->
      <div class="tracks__table" ref="tableRef">
        <!-- 轨道列表 -->
        <div v-for="(track, index) in sortedTracks" :key="track.id" class="tracks__track" :class="{
          'tracks__track--locked': track.locked,
          'tracks__track--hidden': !track.visible
        }" :data-track-id="track.id">
          <!-- 轨道操作栏 -->
          <div class="tracks__track-control-cell" :ref="el => setControlCellRef(el, index)">
            <TrackControl :track="track" :locale="locale" @update="handleTrackUpdate" @delete="handleTrackDelete" />
          </div>

          <!-- 轨道区域 -->
          <div class="tracks__track-area-cell">
            <TrackArea :track="track" :scroll-left="scrollLeft" @scroll="handleAreaScroll"
              @context-menu="handleContextMenu" @track-context-menu="handleTrackContextMenu"
              @add-transition="handleAddTransition" @drop-media="handleDropMedia" @seek="handleSeek" />
          </div>
        </div>
      </div>
    </div>

    <!-- 横向滚动条（底部） -->
    <div class="tracks__scrollbar" @scroll="handleScrollbarScroll" ref="scrollbarRef">
      <div class="tracks__scrollbar-content" :style="{ width: contentWidth + 'px' }" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, inject, provide, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useTracksStore } from '@/stores/tracks'
import { useHistoryStore } from '@/stores/history'
import { useScaleStore } from '@/stores/scale'
import { useDragStore } from '@/stores/drag'
import { usePlaybackStore } from '@/stores/playback'
import TrackControl from './TrackControl.vue'
import TrackArea from './TrackArea.vue'
import type { Track } from '@/types'
import type { LocaleConfig } from '@/types/config'

// Props
interface Props {
  scrollLeft?: number
  locale?: LocaleConfig
}

const props = withDefaults(defineProps<Props>(), {
  scrollLeft: 0,
  locale: () => ({})
})

// Emits
const emit = defineEmits<{
  scroll: [left: number]
  contextMenu: [clip: any, event: MouseEvent]
  trackContextMenu: [track: Track, time: number, event: MouseEvent]
  trackDelete: [trackId: string]
  addTransition: [beforeClipId: string, afterClipId: string]
  dropMedia: [mediaData: any, trackId: string, startTime: number]
  'update:trackControlWidth': [width: number]
  seek: [time: number]
}>()

// Stores
const tracksStore = useTracksStore()
const historyStore = useHistoryStore()
const scaleStore = useScaleStore()
const dragStore = useDragStore()
const playbackStore = usePlaybackStore()

// Inject config from parent
const config = inject<any>('config', {})

// Refs
const tracksRef = ref<HTMLElement>()
const scrollContainerRef = ref<HTMLElement>()
const tableRef = ref<HTMLElement>()
const scrollbarRef = ref<HTMLElement>()
const scrollLeft = ref(props.scrollLeft)
const isScrollingSelf = ref(false)
const firstControlCell = ref<HTMLElement | null>(null)

// Computed
const sortedTracks = computed(() => tracksStore.sortedTracks)

const actualPixelsPerSecond = computed(() => scaleStore.actualPixelsPerSecond)

const contentWidth = computed(() => {
  const maxDuration = Math.max(
    tracksStore.totalDuration,
    dragStore.previewEndTime, // 拖拽预览的结束时间
    60 // 最少显示 60 秒
  )
  return Math.ceil(maxDuration * actualPixelsPerSecond.value)
})

// 控制栏宽度
const trackControlWidth = ref(200)

// 游标在内容中的位置
const cursorPosition = computed(() => {
  return playbackStore.currentTime * actualPixelsPerSecond.value
})

// 游标显示位置（考虑滚动和控制栏偏移）
const cursorDisplayPosition = computed(() => {
  return trackControlWidth.value + cursorPosition.value - scrollLeft.value
})

// 游标是否在控制区域内（需要显示额外的游标线）
const cursorInControlArea = computed(() => {
  return cursorDisplayPosition.value > 0 && cursorDisplayPosition.value <= trackControlWidth.value
})

// Watchers
watch(() => props.scrollLeft, (newVal) => {
  if (!isScrollingSelf.value && newVal !== scrollLeft.value) {
    scrollLeft.value = newVal
    if (scrollbarRef.value) {
      scrollbarRef.value.scrollLeft = newVal
    }
  }
})

// 监听轨道变化，当从空变为有轨道时设置 ResizeObserver
watch(sortedTracks, (newTracks, oldTracks) => {
  const wasEmpty = !oldTracks || oldTracks.length === 0
  const hasTracksNow = newTracks && newTracks.length > 0

  if (wasEmpty && hasTracksNow) {
    // 从空变为有轨道，需要重新设置 ResizeObserver
    nextTick(() => {
      if (tableRef.value && !resizeObserver) {
        resizeObserver = new ResizeObserver(() => {
          measureControlWidth()
        })
        resizeObserver.observe(tableRef.value)
      }
      // 立即测量一次
      measureControlWidth()
    })
  }
}, { immediate: true })

// 设置第一个控制单元格的 ref
function setControlCellRef(el: any, index: number) {
  if (index === 0) {
    firstControlCell.value = el as HTMLElement
  }
}

// 测量控制栏宽度
let resizeObserver: ResizeObserver | null = null

// 边缘滚动回调 - 当拖拽时边缘滚动触发，更新 scrollLeft 状态
function handleEdgeScroll(left: number) {
  if (!isScrollingSelf.value) {
    isScrollingSelf.value = true
    scrollLeft.value = left
    emit('scroll', left)
    requestAnimationFrame(() => {
      isScrollingSelf.value = false
    })
  }
}

onMounted(() => {
  if (tableRef.value) {
    resizeObserver = new ResizeObserver(() => {
      measureControlWidth()
    })
    resizeObserver.observe(tableRef.value)
  }

  // 设置拖拽边缘滚动的容器引用
  nextTick(() => {
    // tracksRef 作为滚动区域的边界检测容器
    // scrollbarRef 作为实际执行滚动的容器
    dragStore.setScrollContainers(
      tracksRef.value || null,
      scrollbarRef.value || null,
      handleEdgeScroll
    )
  })

  // 初始滚动到主轨道
  nextTick(() => {
    scrollToMainTrack()
  })
})

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
  }
})

function measureControlWidth() {
  if (firstControlCell.value) {
    const width = firstControlCell.value.getBoundingClientRect().width
    trackControlWidth.value = width
    emit('update:trackControlWidth', width)
  }
}

// 滚动到主轨道
function scrollToMainTrack() {
  const mainTrack = tracksStore.mainTrack
  if (!mainTrack || !tableRef.value) return

  const trackEl = tableRef.value.querySelector(`[data-track-id="${mainTrack.id}"]`)
  if (trackEl) {
    trackEl.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }
}

// 监听主轨道变化，自动滚动
watch(() => tracksStore.mainTrack, (newVal) => {
  if (newVal) {
    nextTick(() => {
      scrollToMainTrack()
    })
  }
})

// 处理滚动容器滚动（垂直滚动）
function handleScrollContainerScroll() {
  // 这里可以处理垂直同步，如果需要的话
}

// 处理底部滚动条滚动
function handleScrollbarScroll() {
  if (scrollbarRef.value && !isScrollingSelf.value) {
    isScrollingSelf.value = true
    scrollLeft.value = scrollbarRef.value.scrollLeft
    emit('scroll', scrollLeft.value)
    requestAnimationFrame(() => {
      isScrollingSelf.value = false
    })
  }
}

// 处理轨道区域滚动（同步到统一滚动条）
function handleAreaScroll(left: number) {
  if (!isScrollingSelf.value) {
    isScrollingSelf.value = true
    scrollLeft.value = left
    if (scrollbarRef.value && scrollbarRef.value.scrollLeft !== left) {
      scrollbarRef.value.scrollLeft = left
    }
    emit('scroll', left)
    requestAnimationFrame(() => {
      isScrollingSelf.value = false
    })
  }
}

// 处理轨道更新
function handleTrackUpdate(trackId: string, updates: Partial<Track>) {
  tracksStore.updateTrack(trackId, updates)
  historyStore.pushSnapshot('更新轨道')
}

// 处理轨道删除
function handleTrackDelete(trackId: string) {
  const track = tracksStore.tracks.find((t) => t.id === trackId)
  if (track?.isMain) {
    alert('主轨道不能删除')
    return
  }

  tracksStore.removeTrack(trackId)
  historyStore.pushSnapshot('删除轨道')
  emit('trackDelete', trackId)
}

// 处理 Clip 右键菜单
function handleContextMenu(clip: any, event: MouseEvent) {
  emit('contextMenu', clip, event)
}

// 处理轨道空白区域右键菜单
function handleTrackContextMenu(track: Track, time: number, event: MouseEvent) {
  emit('trackContextMenu', track, time, event)
}

// 处理添加转场
function handleAddTransition(beforeClipId: string, afterClipId: string) {
  emit('addTransition', beforeClipId, afterClipId)
}

// 处理拖放媒体
function handleDropMedia(mediaData: any, trackId: string, startTime: number) {
  emit('dropMedia', mediaData, trackId, startTime)
}

// 处理 seek 事件
function handleSeek(time: number) {
  emit('seek', time)
}

// 提供配置给子组件
provide('config', config)
</script>

<style scoped>
.tracks {
  flex: 1;
  overflow: hidden;
  background: var(--color-bg-dark);
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
  transition: background-color var(--transition-base);
  position: relative;
}

/* 游标线（穿过控制区域） */
.tracks__cursor-line {
  position: absolute;
  top: 0;
  width: 2px;
  height: 100%;
  background: var(--color-primary);
  transform: translateX(-50%);
  pointer-events: none;
  z-index: 300;
}

.tracks__scroll-container {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  min-height: 0;
}

.tracks__table {
  display: table;
  width: 100%;
  table-layout: auto;
  border-collapse: collapse;
  /* 不设置 height: 100%，让其由内容撑开 */
}

.tracks__track {
  display: table-row;
  border-bottom: 1px solid var(--color-border);
  min-height: 48px;
  transition: all var(--transition-fast);
}

.tracks__track:hover {
  background: hsla(var(--theme-hue), var(--theme-saturation), var(--theme-lightness), 0.02);
}

.tracks__track--locked {
  opacity: 0.5;
  background: repeating-linear-gradient(45deg,
      transparent,
      transparent 10px,
      var(--color-bg-light) 10px,
      var(--color-bg-light) 11px);
}

.tracks__track--hidden {
  opacity: 0.25;
}

.tracks__track-control-cell {
  display: table-cell;
  width: 1px;
  /* 让单元格尽可能小，由内容撑开 */
  white-space: nowrap;
  vertical-align: top;
  border-bottom: 1px solid var(--color-border);
  height: 100%;
  background-color: var(--color-bg-elevated);
  /* 确保 track-control 在拖拽 clip 之上 */
  position: relative;
  z-index: 200;
}

.tracks__track-area-cell {
  display: table-cell;
  vertical-align: top;
  border-bottom: 1px solid var(--color-border);
  max-width: 0;
  /* 关键：允许 table-cell 内部的 overflow 生效 */
  width: 100%;
  height: 100%;
}

/* 确保 TrackArea 填满单元格 */
.tracks__track-area-cell :deep(.track-area) {
  height: 100%;
  min-height: 48px;
}

/* 确保 TrackControl 填满单元格 */
.tracks__track-control-cell :deep(.track-control) {
  height: 100%;
  min-height: 48px;
}

.tracks__scrollbar {
  width: 100%;
  height: 12px;
  overflow-x: auto;
  overflow-y: hidden;
  flex-shrink: 0;
  background: var(--color-bg-elevated);
  border-top: 1px solid var(--color-border);
}

.tracks__scrollbar-content {
  height: 1px;
}

/* 空状态提示 */
.tracks__empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  background: var(--color-bg-dark);
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-lg);
  margin: 16px;
}

.tracks__empty-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: var(--color-text-muted);
}

.tracks__empty-icon {
  font-size: 48px;
  opacity: 0.5;
}

.tracks__empty-text {
  font-size: 14px;
  font-weight: 500;
}
</style>
