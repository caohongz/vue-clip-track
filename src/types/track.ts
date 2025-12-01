import type { Clip } from './clip'

// 轨道接口
export interface Track {
  id: string
  type: TrackType
  name: string
  isMain?: boolean // 是否为主轨道
  visible: boolean // 是否可见
  locked: boolean // 是否锁定（锁定后不可编辑 clip）
  clips: Clip[]
  order: number // 轨道顺序（用于排序显示）
}

// 轨道类型
export type TrackType =
  | 'video'
  | 'audio'
  | 'subtitle'
  | 'sticker'
  | 'filter'
  | 'effect'
  | 'transition'
  | string // 支持自定义轨道类型

