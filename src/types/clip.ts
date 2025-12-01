// 基础 Clip 接口
export interface BaseClip {
  id: string
  trackId: string
  name?: string // Clip 名称（可选）
  startTime: number // 轨道内开始时间（秒）
  endTime: number // 轨道内结束时间（秒）
  selected: boolean
  // 通用配置
  position?: { x: number; y: number }
  size?: { width: number; height: number }
  rotation?: number
  scale?: number
  opacity?: number
  animations?: Animation[]
  // 用户自定义配置（可扩展）
  config?: Record<string, any>
}

// 动画配置
export interface Animation {
  type: 'move' | 'scale' | 'rotate' | 'fade'
  from: Record<string, number>
  to: Record<string, number>
  duration: number // 秒
  easing?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out'
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

