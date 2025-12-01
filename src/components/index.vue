<template>
  <div class="video-track" ref="containerRef">
    <!-- 工具栏前置插槽 -->
    <slot name="toolbar-before" />

    <!-- 工具栏 -->
    <ToolsBar v-if="showToolsBar" :operation-buttons="operationButtons" :scale-config-buttons="scaleConfigButtons"
      :locale="mergedLocale" @operation="handleOperation">
      <!-- 操作区域插槽 -->
      <template #operations-prepend>
        <slot name="operations-prepend" />
      </template>
      <template #operations-append>
        <slot name="operations-append" />
      </template>

      <!-- 播放控制区域插槽 -->
      <template #playback-prepend>
        <slot name="playback-prepend" />
      </template>
      <template #playback-append>
        <slot name="playback-append" />
      </template>

      <!-- 缩放区域插槽 -->
      <template #scale-prepend>
        <slot name="scale-prepend" />
      </template>
      <template #scale-append>
        <slot name="scale-append" />
      </template>

      <!-- 透传自定义按钮插槽 -->
      <template v-for="(_, name) in $slots" #[name]="slotProps">
        <slot :name="name" v-bind="slotProps" />
      </template>
    </ToolsBar>

    <!-- 工具栏后置插槽 -->
    <slot name="toolbar-after" />

    <!-- 时间线前置插槽 -->
    <slot name="ruler-before" />

    <!-- 时间线 -->
    <Ruler :width="tracksWidth" :scroll-left="scrollLeft" :track-control-width="currentTrackControlWidth"
      @scroll="handleRulerScroll" />

    <!-- 时间线后置插槽 -->
    <slot name="ruler-after" />

    <!-- 轨道组 -->
    <div class="video-track__body">
      <!-- 轨道前置插槽 -->
      <slot name="tracks-before" />

      <!-- 轨道 -->
      <Tracks :scroll-left="scrollLeft" :locale="mergedLocale" @scroll="handleTracksScroll"
        @context-menu="handleClipContextMenu" @track-context-menu="handleTrackContextMenu"
        @add-transition="handleAddTransition" @drop-media="handleDropMedia"
        @update:track-control-width="handleTrackControlWidthUpdate">
        <!-- 轨道控制区自定义 -->
        <template #track-control="slotProps">
          <slot name="track-control" v-bind="slotProps" />
        </template>

        <!-- 轨道区域自定义 -->
        <template #track-area="slotProps">
          <slot name="track-area" v-bind="slotProps" />
        </template>

        <!-- Clip 内容自定义 -->
        <template #clip-content="slotProps">
          <slot name="clip-content" v-bind="slotProps" />
        </template>

        <!-- 空轨道提示 -->
        <template #empty-track="slotProps">
          <slot name="empty-track" v-bind="slotProps">
            <div class="video-track__empty-hint">{{ mergedLocale.emptyTrackHint }}</div>
          </slot>
        </template>

        <!-- 透传其他插槽 -->
        <template v-for="(_, name) in $slots" #[name]="slotProps">
          <slot :name="name" v-bind="slotProps" />
        </template>
      </Tracks>

      <!-- 轨道后置插槽 -->
      <slot name="tracks-after" />
    </div>

    <!-- 右键菜单 -->
    <ContextMenu ref="contextMenuRef" :items="contextMenuItems" @select="handleContextMenuSelect">
      <!-- 自定义菜单项插槽 -->
      <template #menu-item="slotProps">
        <slot name="context-menu-item" v-bind="slotProps" />
      </template>
    </ContextMenu>

    <!-- 底部状态栏插槽 -->
    <slot name="statusbar" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, provide, computed, watch } from 'vue'
import { useTracksStore } from '@/stores/tracks'
import { usePlaybackStore } from '@/stores/playback'
import { useHistoryStore } from '@/stores/history'
import { useScaleStore } from '@/stores/scale'
import { useDragStore } from '@/stores/drag'
import { useKeyboard } from '@/composables/useKeyboard'
import { useAutoScroll } from '@/composables/useAutoScroll'
import ToolsBar from './ToolsBar/index.vue'
import Ruler from './Ruler/index.vue'
import Tracks from './Tracks/index.vue'
import ContextMenu from './ContextMenu/index.vue'
import type {
  OperationButton,
  ScaleConfigButton,
  TrackTypeConfig,
  ClipTypeConfig,
  TrackContextMenuConfig,
  ClipContextMenuConfig,
  ContextMenuItem,
  Track,
  LocaleConfig,
  ThemeConfig
} from '@/types'
import { locales } from '@/types/config'

// 默认 clip 配置
const defaultClipConfigs: ClipTypeConfig = {
  video: {
    name: '视频',
    backgroundColor: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    borderColor: 'rgba(255,255,255,0.2)',
    height: 32,
    top: 8,
    resizable: true,
    draggable: true,
    borderRadius: 6,
    selected: {
      borderColor: '#fff',
      boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.5), 0 4px 12px rgba(0,0,0,0.3)'
    },
    hover: {
      borderColor: 'rgba(255,255,255,0.5)'
    }
  },
  audio: {
    name: '音频',
    backgroundColor: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    borderColor: 'rgba(255,255,255,0.2)',
    height: 24,
    top: 12,
    resizable: true,
    draggable: true,
    borderRadius: 4,
    selected: {
      borderColor: '#fff',
      boxShadow: '0 0 0 2px rgba(16, 185, 129, 0.5), 0 4px 12px rgba(0,0,0,0.3)'
    },
    hover: {
      borderColor: 'rgba(255,255,255,0.5)'
    }
  },
  subtitle: {
    name: '字幕',
    backgroundColor: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    borderColor: 'rgba(255,255,255,0.2)',
    height: 24,
    top: 12,
    resizable: true,
    draggable: true,
    borderRadius: 4,
    selected: {
      borderColor: '#fff',
      boxShadow: '0 0 0 2px rgba(245, 158, 11, 0.5), 0 4px 12px rgba(0,0,0,0.3)'
    },
    hover: {
      borderColor: 'rgba(255,255,255,0.5)'
    }
  },
  sticker: {
    name: '贴纸',
    backgroundColor: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    borderColor: 'rgba(255,255,255,0.2)',
    height: 24,
    top: 12,
    resizable: false,
    draggable: true,
    borderRadius: 4,
    selected: {
      borderColor: '#fff',
      boxShadow: '0 0 0 2px rgba(139, 92, 246, 0.5), 0 4px 12px rgba(0,0,0,0.3)'
    },
    hover: {
      borderColor: 'rgba(255,255,255,0.5)'
    }
  },
  filter: {
    name: '滤镜',
    backgroundColor: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
    borderColor: 'rgba(255,255,255,0.2)',
    height: 16,
    top: 16,
    resizable: false,
    draggable: true,
    borderRadius: 4,
    selected: {
      borderColor: '#fff',
      boxShadow: '0 0 0 2px rgba(236, 72, 153, 0.5), 0 4px 12px rgba(0,0,0,0.3)'
    },
    hover: {
      borderColor: 'rgba(255,255,255,0.5)'
    }
  },
  effect: {
    name: '特效',
    backgroundColor: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
    borderColor: 'rgba(255,255,255,0.2)',
    height: 16,
    top: 16,
    resizable: false,
    draggable: true,
    borderRadius: 4,
    selected: {
      borderColor: '#fff',
      boxShadow: '0 0 0 2px rgba(99, 102, 241, 0.5), 0 4px 12px rgba(0,0,0,0.3)'
    },
    hover: {
      borderColor: 'rgba(255,255,255,0.5)'
    }
  },
  transition: {
    name: '转场',
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    height: 32,
    top: 8,
    resizable: false,
    draggable: false
  }
}

// 深度合并对象
function deepMerge<T>(target: T, source: Partial<T>): T {
  if (source === null || typeof source !== 'object') {
    return source as T
  }

  if (target === null || typeof target !== 'object') {
    return source as T
  }

  const result = { ...target } as any

  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      const sourceValue = (source as any)[key]
      const targetValue = (result as any)[key]

      if (sourceValue && typeof sourceValue === 'object' && !Array.isArray(sourceValue)) {
        result[key] = deepMerge(targetValue || {}, sourceValue)
      } else {
        result[key] = sourceValue
      }
    }
  }

  return result as T
}

// 合并用户配置和默认配置
function mergeClipConfigs(userConfigs?: ClipTypeConfig): ClipTypeConfig {
  if (!userConfigs) return defaultClipConfigs

  const merged: ClipTypeConfig = { ...defaultClipConfigs }

  // 合并每个 clip 类型的配置
  for (const clipType in userConfigs) {
    if (userConfigs.hasOwnProperty(clipType)) {
      merged[clipType] = deepMerge(merged[clipType] || {}, userConfigs[clipType])
    }
  }

  return merged
}

// Props
interface Props {
  operationButtons?: OperationButton[]
  scaleConfigButtons?: ScaleConfigButton[]
  trackTypes?: TrackTypeConfig
  clipConfigs?: ClipTypeConfig
  showToolsBar?: boolean
  enableMainTrackMode?: boolean
  enableCrossTrackDrag?: boolean
  maxDuration?: number
  fps?: number
  pixelsPerSecond?: number
  minScale?: number
  maxScale?: number
  defaultScale?: number
  enableSnap?: boolean
  snapThreshold?: number
  playbackRates?: number[]
  trackControlWidth?: number
  // 右键菜单配置
  trackContextMenu?: TrackContextMenuConfig
  clipContextMenu?: ClipContextMenuConfig
  // 国际化配置
  locale?: 'zh-CN' | 'en-US' | LocaleConfig
  // 主题配置
  theme?: ThemeConfig
}

const props = withDefaults(defineProps<Props>(), {
  operationButtons: () => ['reset', 'undo', 'redo', 'delete'],
  scaleConfigButtons: () => ['snap'],
  trackTypes: () => ({
    video: { max: 5 },
    audio: { max: 3 },
    subtitle: { max: 2 }
  }),
  clipConfigs: undefined, // 使用 undefined 让 mergeClipConfigs 处理默认值
  showToolsBar: true,
  enableMainTrackMode: false,
  enableCrossTrackDrag: true,
  fps: 30,
  pixelsPerSecond: 100,
  minScale: 0.1,
  maxScale: 10,
  defaultScale: 1,
  enableSnap: true,
  snapThreshold: 10,
  playbackRates: () => [0.5, 1, 2, 4],
  trackControlWidth: 160,
  // 右键菜单默认配置
  trackContextMenu: () => ({ enabled: true }),
  clipContextMenu: () => ({
    showCommonItems: true,
    commonItems: ['copy', 'cut', 'delete']
  }),
  // 国际化默认值
  locale: 'zh-CN',
  // 主题默认值
  theme: undefined
})

// 计算合并后的国际化配置
const mergedLocale = computed<LocaleConfig>(() => {
  const defaultLocale = locales['zh-CN']

  if (typeof props.locale === 'string') {
    // 使用预设语言包
    return { ...defaultLocale, ...(locales[props.locale] || {}) }
  } else if (props.locale) {
    // 使用自定义语言配置
    return { ...defaultLocale, ...props.locale }
  }

  return defaultLocale
})

// 计算合并后的 clip 配置
const mergedClipConfigs = computed(() => mergeClipConfigs(props.clipConfigs))

// Emits
const emit = defineEmits<{
  // Clip 基础事件
  clipMove: [clipId: string, trackId: string, startTime: number]
  clipDelete: [clipId: string]
  clipSelect: [clipIds: string[]]
  clipCopy: [clipIds: string[]]
  clipCut: [clipIds: string[]]
  clipPaste: [clips: any[], trackId: string, time: number]
  clipSplit: [originalClipId: string, leftClip: any, rightClip: any, splitTime: number]

  // Clip 生命周期事件
  'clip:added': [clip: any, trackId: string]
  'clip:updated': [clipId: string, changes: any, oldValues: any]
  'clip:removed': [clip: any, trackId: string]
  'clip:resize-start': [clip: any, edge: 'left' | 'right']
  'clip:resize-end': [clip: any, oldStartTime: number, oldEndTime: number]
  'clip:drag-start': [clip: any]
  'clip:drag-end': [clip: any, fromTrackId: string, toTrackId: string]

  // Track 事件
  trackCreate: [trackId: string]
  trackDelete: [trackId: string]
  'track:added': [track: Track]
  'track:removed': [track: Track]
  'track:updated': [trackId: string, changes: any]

  // 选择变化事件
  'selection:changed': [selectedClipIds: string[], previousIds: string[]]

  // 播放状态事件
  'playback:play': []
  'playback:pause': []
  'playback:seek': [time: number]
  'playback:timeupdate': [time: number]
  'playback:ratechange': [rate: number]

  // 缩放变化事件
  'scale:changed': [scale: number]

  // 历史变化事件
  'history:changed': [state: { canUndo: boolean, canRedo: boolean }]

  // 转场事件
  addTransition: [beforeClipId: string, afterClipId: string]
  transitionAdded: [transitionClip: any, beforeClipId: string, afterClipId: string]

  // 拖放媒体事件
  dropMedia: [mediaData: any, trackId: string, startTime: number]

  // 右键菜单事件
  trackContextMenuSelect: [key: string, track: Track, time: number]
  clipContextMenuSelect: [key: string, clip: any]

  // 数据变化事件
  'data:changed': []
}>()

// Stores
const tracksStore = useTracksStore()
const playbackStore = usePlaybackStore()
const historyStore = useHistoryStore()
const scaleStore = useScaleStore()
const dragStore = useDragStore()

// 监听跨轨拖拽配置变化
watch(() => props.enableCrossTrackDrag, (newVal) => {
  dragStore.setConfig({ enableCrossTrackDrag: newVal })
}, { immediate: true })

// Refs
const containerRef = ref<HTMLElement>()

// 上一次选中的 ID（用于触发选择变化事件）
let previousSelectedIds: string[] = []

// 监听选择变化，触发 selection:changed 事件
watch(
  () => Array.from(tracksStore.selectedClipIds),
  (newIds) => {
    // 检查是否真的发生了变化
    const newSet = new Set(newIds)
    const prevSet = new Set(previousSelectedIds)
    const hasChanged =
      newSet.size !== prevSet.size ||
      newIds.some((id) => !prevSet.has(id))

    if (hasChanged) {
      emit('selection:changed', newIds, previousSelectedIds)
      emit('clipSelect', newIds)
      previousSelectedIds = [...newIds]
    }
  },
  { deep: true }
)

// 键盘快捷键事件回调
const keyboardCallbacks = {
  onCopy: (clipIds: string[]) => {
    emit('clipCopy', clipIds)
  },
  onCut: (clipIds: string[]) => {
    emit('clipCut', clipIds)
  },
  onDelete: (clipIds: string[]) => {
    clipIds.forEach((id) => emit('clipDelete', id))
  },
  onPaste: (clips: any[], trackId: string, time: number) => {
    emit('clipPaste', clips, trackId, time)
  }
}

// Composables - 传入容器 ref 使快捷键只在组件内生效
useKeyboard({ containerRef, callbacks: keyboardCallbacks })

// 监听拖拽状态，在拖拽结束时触发 clipMove 事件
let dragStartPositionsCopy = new Map<string, { startTime: number; trackId: string }>()

watch(() => dragStore.isDragging, (isDragging, wasDragging) => {
  if (isDragging && !wasDragging) {
    // 拖拽开始时，保存初始位置
    dragStartPositionsCopy.clear()
    dragStore.draggedClips.forEach((clip) => {
      dragStartPositionsCopy.set(clip.id, {
        startTime: clip.startTime,
        trackId: clip.trackId
      })
    })
  } else if (!isDragging && wasDragging) {
    // 拖拽结束时，检查是否有位置变化并触发事件
    dragStartPositionsCopy.forEach((originalPos, clipId) => {
      const clip = tracksStore.getClip(clipId)
      if (clip) {
        const hasMoved = clip.startTime !== originalPos.startTime || clip.trackId !== originalPos.trackId
        if (hasMoved) {
          emit('clipMove', clipId, clip.trackId, clip.startTime)
          emit('clip:drag-end', clip, originalPos.trackId, clip.trackId)
        }
      }
    })
    dragStartPositionsCopy.clear()
  }
})

const scrollLeft = ref(0)
const tracksWidth = ref(0)
const currentTrackControlWidth = ref(props.trackControlWidth)

// 自动滚动
useAutoScroll({
  scrollLeft,
  tracksWidth,
  setScrollLeft: (left) => {
    scrollLeft.value = left
  }
})

// Context Menu
const contextMenuItems = ref<ContextMenuItem[]>([])
const contextMenuTargetClip = ref<any>(null)
const contextMenuTargetTrack = ref<Track | null>(null)
const contextMenuTargetTime = ref<number>(0)
const contextMenuType = ref<'clip' | 'track' | null>(null)
const contextMenuRef = ref<InstanceType<typeof ContextMenu>>()


// 初始化配置
onMounted(() => {
  // 初始化缩放配置
  scaleStore.minScale = props.minScale
  scaleStore.maxScale = props.maxScale
  scaleStore.pixelsPerSecond = props.pixelsPerSecond
  // 仅在没有保存的设置时使用默认值
  scaleStore.initScale(props.defaultScale)
  scaleStore.initSnapEnabled(props.enableSnap)
  scaleStore.snapThreshold = props.snapThreshold

  // 初始化历史记录
  historyStore.initialize()

  // 应用主题配置
  applyTheme(props.theme)

  // 监听窗口大小变化
  updateTracksWidth()
  window.addEventListener('resize', updateTracksWidth)
})

// 监听主题变化
watch(() => props.theme, (newTheme) => {
  applyTheme(newTheme)
}, { deep: true })

// 应用主题配置
function applyTheme(theme?: ThemeConfig) {
  if (!containerRef.value || !theme) return

  const el = containerRef.value

  // 应用主色调
  if (theme.primaryHue !== undefined) {
    el.style.setProperty('--theme-hue', String(theme.primaryHue))
  }
  if (theme.primarySaturation !== undefined) {
    el.style.setProperty('--theme-saturation', `${theme.primarySaturation}%`)
  }
  if (theme.primaryLightness !== undefined) {
    el.style.setProperty('--theme-lightness', `${theme.primaryLightness}%`)
  }
  if (theme.primaryColor) {
    el.style.setProperty('--color-primary', theme.primaryColor)
  }

  // 应用背景色
  if (theme.bgDark) el.style.setProperty('--color-bg-dark', theme.bgDark)
  if (theme.bgMedium) el.style.setProperty('--color-bg-medium', theme.bgMedium)
  if (theme.bgLight) el.style.setProperty('--color-bg-light', theme.bgLight)
  if (theme.bgElevated) el.style.setProperty('--color-bg-elevated', theme.bgElevated)

  // 应用文字色
  if (theme.textPrimary) el.style.setProperty('--color-text-primary', theme.textPrimary)
  if (theme.textSecondary) el.style.setProperty('--color-text-secondary', theme.textSecondary)
  if (theme.textMuted) el.style.setProperty('--color-text-muted', theme.textMuted)

  // 应用边框色
  if (theme.borderColor) el.style.setProperty('--color-border', theme.borderColor)

  // 应用圆角
  if (theme.borderRadius) {
    if (theme.borderRadius.sm !== undefined) el.style.setProperty('--radius-sm', `${theme.borderRadius.sm}px`)
    if (theme.borderRadius.md !== undefined) el.style.setProperty('--radius-md', `${theme.borderRadius.md}px`)
    if (theme.borderRadius.lg !== undefined) el.style.setProperty('--radius-lg', `${theme.borderRadius.lg}px`)
  }
}

onUnmounted(() => {
  window.removeEventListener('resize', updateTracksWidth)
})

// 更新轨道宽度
function updateTracksWidth() {
  if (containerRef.value) {
    const rect = containerRef.value.getBoundingClientRect()
    tracksWidth.value = rect.width - currentTrackControlWidth.value
  }
}

// 处理轨道控制栏宽度更新
function handleTrackControlWidthUpdate(width: number) {
  if (Math.abs(currentTrackControlWidth.value - width) > 1) {
    currentTrackControlWidth.value = width
    updateTracksWidth()
  }
}

// 处理时间线滚动
function handleRulerScroll(left: number) {
  scrollLeft.value = left
}

// 处理轨道组滚动
function handleTracksScroll(left: number) {
  scrollLeft.value = left
}

// 处理操作
function handleOperation(operation: string) {
  switch (operation) {
    case 'reset':
      handleReset()
      break
    case 'undo':
      historyStore.undo()
      break
    case 'redo':
      historyStore.redo()
      break
    case 'split':
      handleSplit()
      break
    case 'delete':
      handleDelete()
      break
  }
}

// 重置
function handleReset() {
  tracksStore.reset()
  playbackStore.reset()
  historyStore.reset()
  scaleStore.reset()

  // 如果是主轨道模式，初始化主轨道
  if (props.enableMainTrackMode) {
    tracksStore.addTrack({
      id: `track-main-${Date.now()}`,
      type: 'video',
      name: '主轨道',
      visible: true,
      locked: false,
      clips: [],
      order: 0,
      isMain: true
    })
  }

  historyStore.initialize()
}

// 删除
function handleDelete() {
  const selectedClipIds = Array.from(tracksStore.selectedClipIds)
  if (selectedClipIds.length === 0) return

  tracksStore.removeClips(selectedClipIds)
  historyStore.pushSnapshot('删除片段')

  selectedClipIds.forEach((id) => {
    emit('clipDelete', id)
  })
}

// 分割
function handleSplit() {
  const selectedClipIds = Array.from(tracksStore.selectedClipIds)
  if (selectedClipIds.length === 0) return

  const currentTime = playbackStore.currentTime

  selectedClipIds.forEach((clipId) => {
    const clip = tracksStore.getClip(clipId)
    if (!clip) return

    // 检查当前播放时间是否在 clip 范围内
    if (currentTime <= clip.startTime || currentTime >= clip.endTime) {
      return
    }

    const result = tracksStore.splitClip(clipId, currentTime)
    if (result) {
      emit('clipSplit', clipId, result.leftClip, result.rightClip, currentTime)
    }
  })

  historyStore.pushSnapshot('分割片段')
}

// 处理添加转场
function handleAddTransition(beforeClipId: string, afterClipId: string) {
  emit('addTransition', beforeClipId, afterClipId)
}

// 处理拖放媒体
function handleDropMedia(mediaData: any, trackId: string, startTime: number) {
  emit('dropMedia', mediaData, trackId, startTime)
}

// 通用菜单项定义（使用 locale）
const getCommonClipMenuItems = (): Record<string, ContextMenuItem> => ({
  copy: { key: 'copy', label: mergedLocale.value.copy || '复制', icon: '📋', shortcut: 'Ctrl+C' },
  cut: { key: 'cut', label: mergedLocale.value.cut || '剪切', icon: '✂️', shortcut: 'Ctrl+X' },
  delete: { key: 'delete', label: mergedLocale.value.deleteClip || '删除', icon: '🗑️', danger: true, shortcut: 'Delete' }
})

// 处理 Clip 右键菜单
function handleClipContextMenu(clip: any, event: MouseEvent) {
  contextMenuTargetClip.value = clip
  contextMenuTargetTrack.value = null
  contextMenuType.value = 'clip'

  const items: ContextMenuItem[] = []
  const config = props.clipContextMenu
  const commonClipMenuItems = getCommonClipMenuItems()

  // 添加通用菜单项
  if (config?.showCommonItems !== false) {
    const commonItems = config?.commonItems || ['copy', 'cut', 'delete']

    commonItems.forEach((item) => {
      if (typeof item === 'string') {
        // 预定义的通用项
        const menuItem = commonClipMenuItems[item]
        if (menuItem) {
          items.push({ ...menuItem })
        }
      } else {
        // 自定义菜单项
        items.push(item)
      }
    })
  }

  // 添加按 clip 类型配置的额外菜单项
  if (config?.byType && config.byType[clip.type]) {
    if (items.length > 0) {
      items.push({ key: 'divider-type', label: '', divider: true })
    }
    items.push(...config.byType[clip.type])
  }

  // 添加全局额外菜单项
  if (config?.extraItems && config.extraItems.length > 0) {
    if (items.length > 0) {
      items.push({ key: 'divider-extra', label: '', divider: true })
    }
    items.push(...config.extraItems)
  }

  contextMenuItems.value = items

  // 显示右键菜单
  contextMenuRef.value?.show(event.clientX, event.clientY)
}

// 处理轨道空白区域右键菜单
function handleTrackContextMenu(track: Track, time: number, event: MouseEvent) {
  // 检查是否启用轨道右键菜单
  if (props.trackContextMenu?.enabled === false) {
    return
  }

  contextMenuTargetClip.value = null
  contextMenuTargetTrack.value = track
  contextMenuTargetTime.value = time
  contextMenuType.value = 'track'

  // 默认轨道菜单项（使用 locale）
  const defaultTrackMenuItems: ContextMenuItem[] = [
    { key: 'paste', label: mergedLocale.value.paste || '粘贴', icon: '📋', shortcut: 'Ctrl+V', disabled: !tracksStore.hasClipboardContent() },
    { key: 'divider-1', label: '', divider: true },
    { key: 'lockTrack', label: track.locked ? (mergedLocale.value.unlockTrack || '解锁轨道') : (mergedLocale.value.lockTrack || '锁定轨道'), icon: track.locked ? '🔓' : '🔒' },
    { key: 'deleteTrack', label: mergedLocale.value.deleteTrack || '删除轨道', icon: '🗑️', danger: true, disabled: track.isMain }
  ]

  // 使用自定义菜单项或默认菜单项
  const items = props.trackContextMenu?.items || defaultTrackMenuItems

  contextMenuItems.value = items

  // 显示右键菜单
  contextMenuRef.value?.show(event.clientX, event.clientY)
}

// 处理右键菜单选择
function handleContextMenuSelect(key: string) {
  // 处理 Clip 右键菜单
  if (contextMenuType.value === 'clip' && contextMenuTargetClip.value) {
    const clip = contextMenuTargetClip.value

    switch (key) {
      case 'copy':
        handleCopyClip(clip)
        break
      case 'cut':
        handleCutClip(clip)
        break
      case 'delete':
        tracksStore.removeClip(clip.id)
        historyStore.pushSnapshot('删除片段')
        emit('clipDelete', clip.id)
        break
      default:
        // 自定义菜单项，触发事件让父组件处理
        emit('clipContextMenuSelect', key, clip)
    }
  }

  // 处理轨道右键菜单
  if (contextMenuType.value === 'track' && contextMenuTargetTrack.value) {
    const track = contextMenuTargetTrack.value
    const time = contextMenuTargetTime.value

    switch (key) {
      case 'paste':
        handlePasteClip(track.id, time)
        break
      case 'lockTrack':
        handleToggleTrackLock(track)
        break
      case 'deleteTrack':
        handleDeleteTrack(track)
        break
      default:
        // 自定义菜单项，触发事件让父组件处理
        emit('trackContextMenuSelect', key, track, time)
    }
  }

  // 清理状态
  contextMenuTargetClip.value = null
  contextMenuTargetTrack.value = null
  contextMenuType.value = null
  contextMenuItems.value = []
}

// 处理复制 Clip
function handleCopyClip(clip: any) {
  // 如果 clip 没有被选中，只复制当前 clip
  if (!tracksStore.selectedClipIds.has(clip.id)) {
    tracksStore.copyClips([clip.id])
    emit('clipCopy', [clip.id])
  } else {
    // 复制所有选中的 clips
    const clipIds = Array.from(tracksStore.selectedClipIds)
    tracksStore.copyClips(clipIds)
    emit('clipCopy', clipIds)
  }
}

// 处理剪切 Clip
function handleCutClip(clip: any) {
  // 如果 clip 没有被选中，只剪切当前 clip
  if (!tracksStore.selectedClipIds.has(clip.id)) {
    tracksStore.cutClips([clip.id])
    emit('clipCut', [clip.id])
  } else {
    // 剪切所有选中的 clips
    const clipIds = Array.from(tracksStore.selectedClipIds)
    tracksStore.cutClips(clipIds)
    emit('clipCut', clipIds)
  }
}

// 处理粘贴 Clip
function handlePasteClip(trackId: string, time: number) {
  const pastedClips = tracksStore.pasteClips(trackId, time)
  if (pastedClips) {
    historyStore.pushSnapshot('粘贴片段')
    emit('clipPaste', pastedClips, trackId, time)
  }
}

// 处理锁定/解锁轨道
function handleToggleTrackLock(track: Track) {
  tracksStore.updateTrack(track.id, { locked: !track.locked })
  historyStore.pushSnapshot(track.locked ? '解锁轨道' : '锁定轨道')
}

// 处理删除轨道
function handleDeleteTrack(track: Track) {
  if (track.isMain) return
  const confirmText = (mergedLocale.value.confirmDeleteTrack || '确定要删除轨道"{name}"吗？').replace('{name}', track.name)
  if (confirm(confirmText)) {
    tracksStore.removeTrack(track.id)
    historyStore.pushSnapshot('删除轨道')
    emit('trackDelete', track.id)
  }
}

// 提供配置给子组件（使用 computed 使其响应 props 的变化）
const config = computed(() => ({
  trackTypes: props.trackTypes,
  clipConfigs: mergedClipConfigs.value,
  enableMainTrackMode: props.enableMainTrackMode,
  enableCrossTrackDrag: props.enableCrossTrackDrag,
  maxDuration: props.maxDuration,
  fps: props.fps,
  playbackRates: props.playbackRates,
  trackControlWidth: props.trackControlWidth
}))

provide('config', config)

// 注册自定义 clip 类型
function registerClipType(type: string, config: any) {
  if (!mergedClipConfigs.value[type]) {
    mergedClipConfigs.value[type] = config
  } else {
    // 合并配置
    mergedClipConfigs.value[type] = deepMerge(mergedClipConfigs.value[type], config)
  }
}

// 触发转场添加成功事件
function emitTransitionAdded(transitionClip: any, beforeClipId: string, afterClipId: string) {
  emit('transitionAdded', transitionClip, beforeClipId, afterClipId)
}

// ============ 数据导入/导出 API ============

// 项目数据版本
const DATA_VERSION = '1.0.0'

// 导出项目数据
function exportData() {
  return {
    version: DATA_VERSION,
    tracks: JSON.parse(JSON.stringify(tracksStore.tracks)),
    currentTime: playbackStore.currentTime,
    scale: scaleStore.scale,
    snapEnabled: scaleStore.snapEnabled
  }
}

// 导入项目数据
function importData(data: {
  version?: string
  tracks: any[]
  currentTime?: number
  scale?: number
  snapEnabled?: boolean
}) {
  // 版本兼容性检查（未来可以在这里添加迁移逻辑）
  if (data.version && data.version !== DATA_VERSION) {
    console.warn(`[VideoTrack] 数据版本不匹配: ${data.version} -> ${DATA_VERSION}`)
  }

  // 导入轨道数据
  tracksStore.tracks = data.tracks || []

  // 导入播放状态
  if (data.currentTime !== undefined) {
    playbackStore.seekTo(data.currentTime)
  }

  // 导入缩放状态
  if (data.scale !== undefined) {
    scaleStore.setScale(data.scale)
  }

  // 导入吸附状态
  if (data.snapEnabled !== undefined) {
    scaleStore.setSnapEnabled(data.snapEnabled)
  }

  // 重置历史记录
  historyStore.initialize()

  // 触发数据变化事件
  emit('data:changed')
}

// 导出为 JSON 字符串
function exportAsJSON(): string {
  return JSON.stringify(exportData(), null, 2)
}

// 从 JSON 字符串导入
function importFromJSON(json: string): boolean {
  try {
    const data = JSON.parse(json)
    importData(data)
    return true
  } catch (error) {
    console.error('[VideoTrack] JSON 解析失败:', error)
    return false
  }
}

// ============ 轨道操作 API ============

// 添加轨道
function addTrack(track: Track) {
  tracksStore.addTrack(track)
  historyStore.pushSnapshot('添加轨道')
  emit('track:added', track)
  emit('trackCreate', track.id)
}

// 删除轨道
function removeTrack(trackId: string) {
  const track = tracksStore.tracks.find(t => t.id === trackId)
  if (track) {
    tracksStore.removeTrack(trackId)
    historyStore.pushSnapshot('删除轨道')
    emit('track:removed', track)
    emit('trackDelete', trackId)
  }
}

// 更新轨道
function updateTrack(trackId: string, updates: Partial<Track>) {
  tracksStore.updateTrack(trackId, updates)
  historyStore.pushSnapshot('更新轨道')
  emit('track:updated', trackId, updates)
}

// 获取所有轨道
function getTracks() {
  return tracksStore.tracks
}

// 获取排序后的轨道
function getSortedTracks() {
  return tracksStore.sortedTracks
}

// 根据 ID 获取轨道
function getTrackById(trackId: string) {
  return tracksStore.tracks.find(t => t.id === trackId)
}

// 获取主轨道
function getMainTrack() {
  return tracksStore.mainTrack
}

// ============ Clip 操作 API ============

// 添加 Clip
function addClip(trackId: string, clip: any) {
  tracksStore.addClip(trackId, clip)
  historyStore.pushSnapshot('添加片段')
  emit('clip:added', clip, trackId)
}

// 删除 Clip
function removeClip(clipId: string) {
  const clip = tracksStore.getClip(clipId)
  if (clip) {
    const trackId = clip.trackId
    tracksStore.removeClip(clipId)
    historyStore.pushSnapshot('删除片段')
    emit('clip:removed', clip, trackId)
    emit('clipDelete', clipId)
  }
}

// 更新 Clip
function updateClip(clipId: string, updates: any) {
  const clip = tracksStore.getClip(clipId)
  if (clip) {
    const oldValues = { ...clip }
    tracksStore.updateClip(clipId, updates)
    historyStore.pushSnapshot('更新片段')
    emit('clip:updated', clipId, updates, oldValues)
  }
}

// 获取 Clip
function getClipById(clipId: string) {
  return tracksStore.getClip(clipId)
}

// 移动 Clip 到指定位置
function moveClip(clipId: string, targetTrackId: string, startTime: number) {
  const clip = tracksStore.getClip(clipId)
  if (!clip) return false

  const fromTrackId = clip.trackId
  const duration = clip.endTime - clip.startTime

  // 如果跨轨道移动
  if (fromTrackId !== targetTrackId) {
    tracksStore.moveClipToTrack(clipId, targetTrackId)
  }

  // 更新时间位置
  tracksStore.updateClip(clipId, {
    startTime,
    endTime: startTime + duration
  })

  historyStore.pushSnapshot('移动片段')
  emit('clipMove', clipId, targetTrackId, startTime)
  emit('clip:drag-end', clip, fromTrackId, targetTrackId)

  return true
}

// ============ 选择操作 API ============

// 选中单个 Clip
function selectClip(clipId: string) {
  tracksStore.selectClip(clipId)
  // 事件会通过 watch 自动触发
}

// 选中多个 Clips
function selectClips(clipIds: string[]) {
  tracksStore.clearSelection()
  clipIds.forEach(id => tracksStore.selectedClipIds.add(id))
  // 事件会通过 watch 自动触发
}

// 清空选择
function clearSelection() {
  tracksStore.clearSelection()
  // 事件会通过 watch 自动触发
}

// 获取选中的 Clips
function getSelectedClips() {
  return tracksStore.selectedClips
}

// 获取选中的 Clip IDs
function getSelectedClipIds() {
  return Array.from(tracksStore.selectedClipIds)
}

// ============ 播放控制 API ============

// 播放
function play() {
  playbackStore.play()
  emit('playback:play')
}

// 暂停
function pause() {
  playbackStore.pause()
  emit('playback:pause')
}

// 切换播放/暂停
function togglePlay() {
  if (playbackStore.isPlaying) {
    pause()
  } else {
    play()
  }
}

// 跳转到指定时间
function seekTo(time: number) {
  playbackStore.seekTo(time)
  emit('playback:seek', time)
}

// 获取当前时间
function getCurrentTime() {
  return playbackStore.currentTime
}

// 设置播放速率
function setPlaybackRate(rate: number) {
  playbackStore.setPlaybackRate(rate)
  emit('playback:ratechange', rate)
}

// 获取播放速率
function getPlaybackRate() {
  return playbackStore.playbackRate
}

// 获取是否正在播放
function isPlaying() {
  return playbackStore.isPlaying
}

// 获取总时长
function getDuration() {
  return tracksStore.totalDuration
}

// ============ 缩放控制 API ============

// 设置缩放
function setScale(scale: number) {
  scaleStore.setScale(scale)
  emit('scale:changed', scale)
}

// 获取缩放
function getScale() {
  return scaleStore.scale
}

// 放大
function zoomIn(step = 0.1) {
  scaleStore.zoomIn(step)
  emit('scale:changed', scaleStore.scale)
}

// 缩小
function zoomOut(step = 0.1) {
  scaleStore.zoomOut(step)
  emit('scale:changed', scaleStore.scale)
}

// 启用吸附
function enableSnap() {
  scaleStore.setSnapEnabled(true)
}

// 禁用吸附
function disableSnap() {
  scaleStore.setSnapEnabled(false)
}

// 获取吸附状态
function isSnapEnabled() {
  return scaleStore.snapEnabled
}

// ============ 历史操作 API ============

// 获取历史状态
function getHistoryState() {
  return {
    canUndo: historyStore.canUndo,
    canRedo: historyStore.canRedo
  }
}

// 撤销（带事件）
function undo() {
  historyStore.undo()
  emit('history:changed', getHistoryState())
}

// 重做（带事件）
function redo() {
  historyStore.redo()
  emit('history:changed', getHistoryState())
}

// 暴露方法给父组件
defineExpose({
  // 基础操作
  reset: handleReset,
  registerClipType,
  emitTransitionAdded,

  // 数据导入/导出
  exportData,
  importData,
  exportAsJSON,
  importFromJSON,

  // 轨道操作
  addTrack,
  removeTrack,
  updateTrack,
  getTracks,
  getSortedTracks,
  getTrackById,
  getMainTrack,

  // Clip 操作
  addClip,
  removeClip,
  updateClip,
  getClipById,
  moveClip,

  // 选择操作
  selectClip,
  selectClips,
  clearSelection,
  getSelectedClips,
  getSelectedClipIds,

  // 播放控制
  play,
  pause,
  togglePlay,
  seekTo,
  getCurrentTime,
  setPlaybackRate,
  getPlaybackRate,
  isPlaying,
  getDuration,

  // 缩放控制
  setScale,
  getScale,
  zoomIn,
  zoomOut,
  enableSnap,
  disableSnap,
  isSnapEnabled,

  // 历史操作
  undo,
  redo,
  getHistoryState
})
</script>

<style scoped>
.video-track {
  width: 100%;
  height: 100%;
  min-width: 1024px;
  display: flex;
  flex-direction: column;
  background: var(--color-bg-medium);
  color: var(--color-text-primary);
  overflow: hidden;
  transition: background-color var(--transition-base);
}

.video-track__body {
  flex: 1;
  position: relative;
  overflow: hidden;
  min-height: 0;
  background: var(--color-bg-dark);
}
</style>
