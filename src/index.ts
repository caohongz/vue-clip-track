/**
 * VideoTrack Component Library
 * 音视频轨道编辑组件库
 * 
 * @packageDocumentation
 */

// 导入样式
import './styles/global.css'

// 导出主组件
export { default as VideoTrack } from './components/index.vue'

// 导出所有类型
export type {
    // Clip 类型
    BaseClip,
    MediaClip,
    SubtitleClip,
    TextClip,
    StickerClip,
    FilterClip,
    EffectClip,
    TransitionClip,
    Clip,
    ClipType,
    Animation,
} from './types/clip'

export type {
    // Track 类型
    Track,
    TrackType,
} from './types/track'

export type {
    // 配置类型
    OperationButton,
    CustomButton,
    ScaleConfigButton,
    TrackTypeConfig,
    ClipTypeConfig,
    ContextMenuItem,
    TrackContextMenuConfig,
    ClipContextMenuConfig,
    VideoTrackConfig,
    PlaybackState,
    ScaleState,
    HistoryItem,
    // 国际化和主题
    LocaleConfig,
    ThemeConfig,
} from './types/config'

// 导出预设语言包
export { locales } from './types/config'

// 导出 Stores（供高级用户直接操作）
export { useTracksStore } from './stores/tracks'
export { usePlaybackStore } from './stores/playback'
export { useHistoryStore } from './stores/history'
export { useScaleStore } from './stores/scale'
export { useDragStore } from './stores/drag'

// 导出 Composables
export { useKeyboard } from './composables/useKeyboard'
export { useResize } from './composables/useResize'
export { useAutoScroll } from './composables/useAutoScroll'
export { useSelection } from './composables/useSelection'

// 导出工具函数
export {
    generateId,
    formatTime,
    hasTimeOverlap,
    clamp,
    throttle,
    debounce,
    isMac,
    deepClone,
    normalizeTime,
    normalizeClipTime,
} from './utils/helpers'

// 导出媒体处理工具
export {
    extractVideoThumbnails,
    extractAudioWaveform,
    extractVideoAudioWaveform,
} from './utils/mediaProcessor'

// 导出项目数据接口
export interface VideoTrackProjectData {
    version: string
    tracks: import('./types/track').Track[]
    currentTime: number
    scale: number
    snapEnabled: boolean
}

// 版本号
export const VERSION = '0.1.0'

// Vue 插件安装方法
import type { App } from 'vue'
import VideoTrackComponent from './components/index.vue'

export const VideoTrackPlugin = {
    install(app: App) {
        app.component('VideoTrack', VideoTrackComponent)
    }
}
