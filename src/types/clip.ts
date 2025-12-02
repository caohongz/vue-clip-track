// =====================
// 空间属性（Rect）配置
// =====================

/**
 * 基础空间属性 - 参考 WebAV 的 IRectBaseProps
 * 定义 clip 在画布中的位置、尺寸和旋转
 */
export interface RectProps {
  /** X 坐标位置 */
  x: number
  /** Y 坐标位置 */
  y: number
  /** 宽度 */
  w: number
  /** 高度 */
  h: number
  /** 旋转角度（弧度） */
  angle: number
}

/**
 * Rect 配置 - 扩展空间属性
 * 参考 WebAV 的 Rect 类
 */
export interface RectConfig extends RectProps {
  /** 是否固定宽高比 */
  fixedAspectRatio?: boolean
  /** 缩放时是否以中心点为基准 */
  fixedScaleCenter?: boolean
}

// =====================
// 翻转配置（Flip）
// =====================

/**
 * 翻转类型
 */
export type FlipType = 'horizontal' | 'vertical' | null

// =====================
// 动画配置（Animation）
// =====================

/**
 * 可动画属性 - 参考 WebAV 的 TAnimateProps
 * 包含 rect 的基础属性和 opacity
 */
export interface AnimatableProps extends Partial<RectProps> {
  /** 透明度 (0-1) */
  opacity?: number
}

/**
 * 动画关键帧定义
 * 支持百分比格式的关键帧（如 '0%', '50%', '100%'）
 * 也支持 'from' 和 'to' 的别名
 */
export type AnimationKeyframes = {
  [key: string]: Partial<AnimatableProps>
}

/**
 * 动画选项 - 参考 WebAV 的 IAnimationOpts
 */
export interface AnimationOptions {
  /** 动画时长（微秒） */
  duration: number
  /** 延迟时间（微秒） */
  delay?: number
  /** 迭代次数，undefined 或 Infinity 表示无限循环 */
  iterCount?: number
  /** 缓动函数 */
  easing?: 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | string
  /** 动画方向 */
  direction?: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse'
  /** 填充模式 */
  fillMode?: 'none' | 'forwards' | 'backwards' | 'both'
}

/**
 * 完整动画配置
 * 包含关键帧和动画选项
 */
export interface AnimationConfig {
  /** 动画唯一标识 */
  id?: string
  /** 动画名称 */
  name?: string
  /** 关键帧定义 */
  keyframes: AnimationKeyframes
  /** 动画选项 */
  options: AnimationOptions
  /** 是否启用 */
  enabled?: boolean
}

// =====================
// 交互配置
// =====================

/**
 * 交互模式 - 参考 WebAV 的 VisibleSprite.interactable
 */
export type InteractableMode = 'interactive' | 'selectable' | 'disabled'

// =====================
// 基础 Clip 接口
// =====================

/**
 * 基础 Clip 接口 - 增强版
 * 参考 WebAV 的 VisibleSprite 属性配置
 */
export interface BaseClip {
  /** 唯一标识符 */
  id: string
  /** 所属轨道 ID */
  trackId: string
  /** Clip 名称（可选） */
  name?: string

  // ===== 时间配置 =====
  /** 轨道内开始时间（秒） */
  startTime: number
  /** 轨道内结束时间（秒） */
  endTime: number

  // ===== 空间配置（Rect） =====
  /**
   * 空间属性配置 - 参考 WebAV 的 Rect
   * 定义 clip 在画布中的位置、尺寸和旋转
   */
  rect?: RectConfig

  // ===== 可见性和透明度 =====
  /** 是否可见 - 参考 WebAV 的 VisibleSprite.visible */
  visible?: boolean
  /** 透明度 (0-1) - 参考 WebAV 的 VisibleSprite.opacity */
  opacity?: number

  // ===== 翻转配置 =====
  /** 翻转模式 - 参考 WebAV 的 VisibleSprite.flip */
  flip?: FlipType

  // ===== 交互配置 =====
  /** 是否被选中 */
  selected: boolean
  /** 交互模式 */
  interactable?: InteractableMode
  /** Z-index 层级 */
  zIndex?: number

  // ===== 动画配置 =====
  /**
   * 动画列表 - 支持关键帧动画
   * 参考 WebAV 的 setAnimation
   */
  animations?: AnimationConfig[]

  // ===== 用户自定义配置（可扩展） =====
  config?: Record<string, unknown>
}

// 视频/音频 Clip
export interface MediaClip extends BaseClip {
  type: 'video' | 'audio'
  sourceUrl: string
  originalDuration: number
  trimStart: number // 裁剪开始时间
  trimEnd: number // 裁剪结束时间
  playbackRate: number // 倍速
  volume?: number // 音量（音频特有，0-1）
  thumbnails?: string[] // 缩略图 URL 列表（视频特有）
  waveformData?: number[] // 波形数据（音频特有）
}

// 字幕 Clip
export interface SubtitleClip extends BaseClip {
  type: 'subtitle'
  text: string
  fontFamily: string
  fontSize: number
  color: string
  backgroundColor?: string
  textAlign?: 'left' | 'center' | 'right'
}

// 文本 Clip
export interface TextClip extends BaseClip {
  type: 'text'
  text: string
  fontFamily?: string
  fontSize?: number
  color?: string
  backgroundColor?: string
}

// 贴纸 Clip
export interface StickerClip extends BaseClip {
  type: 'sticker'
  sourceUrl: string
}

// 滤镜 Clip
export interface FilterClip extends BaseClip {
  type: 'filter'
  filterType: string // 滤镜类型（如 'blur', 'brightness', 'contrast' 等）
  filterValue: number | Record<string, number> // 滤镜值
}

// 特效 Clip
export interface EffectClip extends BaseClip {
  type: 'effect'
  effectType: string // 特效类型
  effectDuration: number // 特效持续时间
}

// 转场 Clip
export interface TransitionClip extends BaseClip {
  type: 'transition'
  transitionType: string // 转场类型（如 'fade', 'slide', 'wipe' 等）
  transitionDuration: number // 转场时长（0.1~5s）
}

// 所有 Clip 类型的联合类型
export type Clip =
  | MediaClip
  | SubtitleClip
  | TextClip
  | StickerClip
  | FilterClip
  | EffectClip
  | TransitionClip

// Clip 类型字符串
export type ClipType =
  | 'video'
  | 'audio'
  | 'subtitle'
  | 'text'
  | 'sticker'
  | 'filter'
  | 'effect'
  | 'transition'

// =====================
// 辅助类型和工具
// =====================

/**
 * 创建 Rect 的默认值
 */
export const DEFAULT_RECT: RectProps = {
  x: 0,
  y: 0,
  w: 100,
  h: 100,
  angle: 0,
}

/**
 * 预设动画类型
 */
export type PresetAnimationType =
  | 'fadeIn'
  | 'fadeOut'
  | 'slideInLeft'
  | 'slideInRight'
  | 'slideInTop'
  | 'slideInBottom'
  | 'slideOutLeft'
  | 'slideOutRight'
  | 'slideOutTop'
  | 'slideOutBottom'
  | 'zoomIn'
  | 'zoomOut'
  | 'rotateIn'
  | 'rotateOut'
  | 'bounceIn'
  | 'bounceOut'

/**
 * 预设动画配置
 */
export interface PresetAnimation {
  type: PresetAnimationType
  options?: Partial<AnimationOptions>
}

/**
 * Clip 创建选项（不包含必填字段）
 */
export type ClipCreateOptions<T extends Clip> = Omit<T, 'id' | 'trackId' | 'startTime' | 'endTime' | 'selected'>

/**
 * Clip 更新选项（部分更新）
 */
export type ClipUpdateOptions<T extends Clip> = Partial<Omit<T, 'id' | 'trackId' | 'type'>>

/**
 * 时间单位转换常量
 */
export const TIME_UNITS = {
  /** 1秒 = 1,000,000 微秒 */
  SECOND_TO_MICROSECOND: 1_000_000,
  /** 1毫秒 = 1,000 微秒 */
  MILLISECOND_TO_MICROSECOND: 1_000,
} as const

/**
 * 时间单位转换工具函数
 */
export const timeUtils = {
  /** 秒转微秒 */
  secondsToMicroseconds: (seconds: number): number => seconds * TIME_UNITS.SECOND_TO_MICROSECOND,
  /** 微秒转秒 */
  microsecondsToSeconds: (microseconds: number): number => microseconds / TIME_UNITS.SECOND_TO_MICROSECOND,
  /** 帧转微秒 (给定帧率) */
  framesToMicroseconds: (frames: number, fps: number): number => (frames / fps) * TIME_UNITS.SECOND_TO_MICROSECOND,
  /** 微秒转帧 (给定帧率) */
  microsecondsToFrames: (microseconds: number, fps: number): number =>
    (microseconds / TIME_UNITS.SECOND_TO_MICROSECOND) * fps,
}

