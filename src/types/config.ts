import type { Component, FunctionalComponent } from 'vue'
import type { TrackType } from './track'

// 自定义按钮（用于插槽）
export interface CustomButton {
  type: 'custom'
  key: string
}

// 操作按钮对象配置
export interface OperationButtonConfig {
  /** 按钮标识 */
  key: string
  /** 按钮标签文本 */
  label?: string
  /** 图标 - 支持字符串(emoji/图标字符)或Vue组件 */
  icon?: string | Component | FunctionalComponent
  /** 是否禁用 - 支持布尔值或返回布尔值的函数 */
  disabled?: boolean | (() => boolean)
  /** 点击回调 */
  onClick?: () => void
  /** 悬停提示 */
  title?: string
  /** 自定义CSS类名 */
  className?: string
}

// 操作按钮配置 - 支持字符串简写、自定义按钮或完整配置对象
export type OperationButton =
  | 'reset'
  | 'undo'
  | 'redo'
  | 'split'
  | 'delete'
  | CustomButton
  | OperationButtonConfig

// 缩放配置按钮对象配置
export interface ScaleConfigButtonConfig {
  /** 按钮标识 */
  key: string
  /** 图标 - 支持字符串(emoji/图标字符)或Vue组件 */
  icon?: string | Component | FunctionalComponent
  /** 是否激活状态 - 支持布尔值或返回布尔值的函数 */
  active?: boolean | (() => boolean)
  /** 是否禁用 - 支持布尔值或返回布尔值的函数 */
  disabled?: boolean | (() => boolean)
  /** 点击回调 */
  onClick?: () => void
  /** 悬停提示 */
  title?: string
  /** 自定义CSS类名 */
  className?: string
}

// 缩放配置按钮
export type ScaleConfigButton = 'snap' | CustomButton | ScaleConfigButtonConfig

// 轨道类型配置
export interface TrackTypeConfig {
  [key: string]: {
    max: number // 最大轨道数量
    name?: string // 轨道类型显示名称（可选，用于自定义类型）
  }
}

// Clip 类型配置
export interface ClipTypeConfig {
  [clipType: string]: {
    // 样式配置
    backgroundColor?: string
    borderColor?: string
    borderWidth?: number
    borderRadius?: string | number
    height?: number
    top?: number
    opacity?: number

    // 选中状态样式
    selected?: {
      backgroundColor?: string
      borderColor?: string
      boxShadow?: string
    }

    // 悬停状态样式
    hover?: {
      backgroundColor?: string
      borderColor?: string
    }

    // 自定义组件（可选）
    component?: any // Vue 组件

    // 显示名称
    name?: string

    // 是否可调整大小
    resizable?: boolean

    // 是否可拖拽
    draggable?: boolean
  }
}

// 右键菜单项配置
export interface ContextMenuItem {
  label: string
  key: string
  icon?: string // 图标
  slot?: string // 自定义 slot 名称
  disabled?: boolean
  divider?: boolean // 是否为分割线
  danger?: boolean // 是否为危险操作（红色）
  shortcut?: string // 快捷键提示
}

// 轨道右键菜单配置（所有轨道通用）
export interface TrackContextMenuConfig {
  items?: ContextMenuItem[] // 菜单项
  enabled?: boolean // 是否启用，默认 true
}

// Clip 右键菜单配置
export interface ClipContextMenuConfig {
  // 通用菜单项（所有 clip 类型都有）
  commonItems?: Array<'copy' | 'cut' | 'delete' | ContextMenuItem>
  // 是否显示通用项，默认 true
  showCommonItems?: boolean
  // 按 clip 类型配置额外的菜单项
  byType?: {
    [clipType: string]: ContextMenuItem[]
  }
  // 全局额外菜单项
  extraItems?: ContextMenuItem[]
}

// 组件配置项
export interface VideoTrackConfig {
  // 工具栏配置
  operationButtons?: OperationButton[]
  scaleConfigButtons?: ScaleConfigButton[]
  showToolsBar?: boolean

  // 轨道配置
  trackTypes?: TrackTypeConfig
  enableMainTrackMode?: boolean // 是否启用主轨道模式
  enableCrossTrackDrag?: boolean // 是否允许跨轨移动，默认 true

  // Clip 配置
  clipConfigs?: ClipTypeConfig // 各类型 clip 的样式和行为配置

  // 时间线配置
  maxDuration?: number // 最大时长（秒），不设置则自动扩展
  fps?: number // 帧率，默认 30
  pixelsPerSecond?: number // 每秒像素数，默认 100

  // 缩放配置
  minScale?: number // 最小缩放比例，默认 0.1
  maxScale?: number // 最大缩放比例，默认 10
  defaultScale?: number // 默认缩放比例，默认 1

  // 吸附配置
  enableSnap?: boolean // 是否启用吸附，默认 true
  snapThreshold?: number // 吸附阈值（像素），默认 10

  // 播放配置
  playbackRates?: number[] // 支持的播放速率，默认 [0.5, 1, 2, 4]

  // 转场配置
  enableTransitions?: boolean // 是否启用转场，默认 true
  defaultTransitionDuration?: number // 默认转场时长（秒），默认 1

  // 自定义菜单
  customMenu?: ContextMenuItem[]

  // 轨道操作栏宽度
  trackControlWidth?: number // 默认 200px
}

// 播放状态
export interface PlaybackState {
  isPlaying: boolean
  currentTime: number // 当前播放时间（秒）
  playbackRate: number // 播放速率
  duration: number // 总时长（秒）
}

// 缩放状态
export interface ScaleState {
  scale: number // 当前缩放比例
  pixelsPerSecond: number // 每秒像素数
}

// 历史记录项
export interface HistoryItem {
  id: string
  timestamp: number
  snapshot: string // 序列化的状态快照（JSON 字符串）
  description?: string // 操作描述
}

// 国际化配置
export interface LocaleConfig {
  // 工具栏
  reset?: string
  undo?: string
  redo?: string
  delete?: string
  play?: string
  pause?: string
  // 吸附
  snapOn?: string
  snapOff?: string
  // 右键菜单 - Clip
  copy?: string
  cut?: string
  paste?: string
  selectAll?: string
  splitClip?: string
  deleteClip?: string
  // 右键菜单 - 轨道
  deleteTrack?: string
  lockTrack?: string
  unlockTrack?: string
  muteTrack?: string
  unmuteTrack?: string
  // 轨道控制
  mainTrack?: string
  videoTrack?: string
  audioTrack?: string
  subtitleTrack?: string
  textTrack?: string
  stickerTrack?: string
  filterTrack?: string
  effectTrack?: string
  mainBadge?: string
  show?: string
  hide?: string
  lock?: string
  unlock?: string
  // 提示
  emptyTip?: string
  emptyTrackHint?: string
  noClipSelected?: string
  confirmDelete?: string
  confirmDeleteTrack?: string
  // 时间格式
  timeFormat?: string
}

// 预设的语言包
export const locales: Record<string, LocaleConfig> = {
  'zh-CN': {
    reset: '重置',
    undo: '撤销',
    redo: '重做',
    delete: '删除',
    play: '播放',
    pause: '暂停',
    snapOn: '关闭吸附',
    snapOff: '开启吸附',
    // 右键菜单 - Clip
    copy: '复制',
    cut: '剪切',
    paste: '粘贴',
    selectAll: '全选',
    splitClip: '分割',
    deleteClip: '删除片段',
    // 右键菜单 - 轨道
    deleteTrack: '删除轨道',
    lockTrack: '锁定轨道',
    unlockTrack: '解锁轨道',
    muteTrack: '静音轨道',
    unmuteTrack: '取消静音',
    // 轨道控制
    mainTrack: '主轨道',
    videoTrack: '视频轨道',
    audioTrack: '音频轨道',
    subtitleTrack: '字幕轨道',
    textTrack: '文本轨道',
    stickerTrack: '贴纸轨道',
    filterTrack: '滤镜轨道',
    effectTrack: '特效轨道',
    mainBadge: '主',
    show: '显示',
    hide: '隐藏',
    lock: '锁定',
    unlock: '解锁',
    // 提示
    emptyTip: '拖拽媒体文件到此处添加',
    emptyTrackHint: '拖拽媒体到这里',
    noClipSelected: '未选中片段',
    confirmDelete: '确定要删除吗？',
    confirmDeleteTrack: '确定要删除轨道"{name}"吗？'
  },
  'en-US': {
    reset: 'Reset',
    undo: 'Undo',
    redo: 'Redo',
    delete: 'Delete',
    play: 'Play',
    pause: 'Pause',
    snapOn: 'Disable Snap',
    snapOff: 'Enable Snap',
    // 右键菜单 - Clip
    copy: 'Copy',
    cut: 'Cut',
    paste: 'Paste',
    selectAll: 'Select All',
    splitClip: 'Split',
    deleteClip: 'Delete Clip',
    // 右键菜单 - 轨道
    deleteTrack: 'Delete Track',
    lockTrack: 'Lock Track',
    unlockTrack: 'Unlock Track',
    muteTrack: 'Mute Track',
    unmuteTrack: 'Unmute Track',
    // 轨道控制
    mainTrack: 'Main Track',
    videoTrack: 'Video Track',
    audioTrack: 'Audio Track',
    subtitleTrack: 'Subtitle Track',
    textTrack: 'Text Track',
    stickerTrack: 'Sticker Track',
    filterTrack: 'Filter Track',
    effectTrack: 'Effect Track',
    mainBadge: 'Main',
    show: 'Show',
    hide: 'Hide',
    lock: 'Lock',
    unlock: 'Unlock',
    // 提示
    emptyTip: 'Drag and drop media files here to add',
    emptyTrackHint: 'Drop media here',
    noClipSelected: 'No clip selected',
    confirmDelete: 'Are you sure to delete?',
    confirmDeleteTrack: 'Are you sure to delete track "{name}"?'
  }
}

// 主题配置
export interface ThemeConfig {
  // 主色调
  primaryColor?: string
  primaryHue?: number
  primarySaturation?: number
  primaryLightness?: number

  // 背景色
  bgDark?: string
  bgMedium?: string
  bgLight?: string
  bgElevated?: string

  // 文字色
  textPrimary?: string
  textSecondary?: string
  textMuted?: string

  // 边框色
  borderColor?: string

  // 轨道尺寸
  trackHeight?: {
    main?: number
    video?: number
    audio?: number
    default?: number
  }

  // 圆角
  borderRadius?: {
    sm?: number
    md?: number
    lg?: number
  }
}

