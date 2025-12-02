import type { Meta, StoryObj } from '@storybook/vue3'
import { ref, onMounted, defineComponent } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import VideoTrack from './index.vue'
import type { Track, MediaClip, SubtitleClip, FilterClip } from '@/types'
import { generateId } from '@/utils/helpers'

// 创建模拟数据的辅助函数
function createMockVideoTrack(order: number, isMain = false): Track {
    const clips: MediaClip[] = [
        {
            id: generateId('clip-'),
            trackId: '',
            type: 'video',
            startTime: 0,
            endTime: 5,
            selected: false,
            sourceUrl: '',
            originalDuration: 23,
            trimStart: 0,
            trimEnd: 5,
            playbackRate: 1,
            thumbnails: [],
        },
        {
            id: generateId('clip-'),
            trackId: '',
            type: 'video',
            startTime: 6,
            endTime: 12,
            selected: false,
            sourceUrl: '',
            originalDuration: 20,
            trimStart: 2,
            trimEnd: 8,
            playbackRate: 1,
            thumbnails: [],
        },
        {
            id: generateId('clip-'),
            trackId: '',
            type: 'video',
            startTime: 15,
            endTime: 22,
            selected: false,
            sourceUrl: '',
            originalDuration: 16,
            trimStart: 1,
            trimEnd: 8,
            playbackRate: 1,
            thumbnails: [],
        },
    ]

    const track: Track = {
        id: generateId('track-'),
        type: 'video',
        name: isMain ? '主轨道（视频）' : `视频 ${order}`,
        visible: true,
        locked: false,
        clips: [],
        order,
        isMain,
    }

    clips.forEach((clip) => {
        clip.trackId = track.id
    })
    track.clips = clips

    return track
}

function createMockAudioTrack(order: number): Track {
    const clips: MediaClip[] = [
        {
            id: generateId('clip-'),
            trackId: '',
            type: 'audio',
            startTime: 0,
            endTime: 8,
            selected: false,
            sourceUrl: '',
            originalDuration: 30,
            trimStart: 0,
            trimEnd: 8,
            playbackRate: 1,
            volume: 0.8,
            waveformData: [],
        },
        {
            id: generateId('clip-'),
            trackId: '',
            type: 'audio',
            startTime: 10,
            endTime: 18,
            selected: false,
            sourceUrl: '',
            originalDuration: 25,
            trimStart: 1,
            trimEnd: 9,
            playbackRate: 1,
            volume: 1.0,
            waveformData: [],
        },
    ]

    const track: Track = {
        id: generateId('track-'),
        type: 'audio',
        name: `音频 ${order}`,
        visible: true,
        locked: false,
        clips: [],
        order,
    }

    clips.forEach((clip) => {
        clip.trackId = track.id
    })
    track.clips = clips

    return track
}

function createMockSubtitleTrack(order: number): Track {
    const clips: SubtitleClip[] = [
        {
            id: generateId('clip-'),
            trackId: '',
            type: 'subtitle',
            startTime: 1,
            endTime: 4,
            selected: false,
            text: '这是第一段字幕',
            fontFamily: 'Arial',
            fontSize: 24,
            color: '#ffffff',
            textAlign: 'center',
        },
        {
            id: generateId('clip-'),
            trackId: '',
            type: 'subtitle',
            startTime: 6,
            endTime: 10,
            selected: false,
            text: '这是第二段字幕',
            fontFamily: 'Arial',
            fontSize: 24,
            color: '#ffff00',
            textAlign: 'center',
        },
        {
            id: generateId('clip-'),
            trackId: '',
            type: 'subtitle',
            startTime: 12,
            endTime: 16,
            selected: false,
            text: 'This is English subtitle',
            fontFamily: 'Arial',
            fontSize: 24,
            color: '#00ffff',
            textAlign: 'center',
        },
    ]

    const track: Track = {
        id: generateId('track-'),
        type: 'subtitle',
        name: `字幕 ${order}`,
        visible: true,
        locked: false,
        clips: [],
        order,
    }

    clips.forEach((clip) => {
        clip.trackId = track.id
    })
    track.clips = clips

    return track
}

function createMockFilterTrack(order: number): Track {
    const clips: FilterClip[] = [
        {
            id: generateId('clip-'),
            trackId: '',
            type: 'filter',
            startTime: 0,
            endTime: 5,
            selected: false,
            filterType: 'blur',
            filterValue: 0.5,
        },
        {
            id: generateId('clip-'),
            trackId: '',
            type: 'filter',
            startTime: 8,
            endTime: 14,
            selected: false,
            filterType: 'brightness',
            filterValue: 0.8,
        },
    ]

    const track: Track = {
        id: generateId('track-'),
        type: 'filter',
        name: `滤镜 ${order}`,
        visible: true,
        locked: false,
        clips: [],
        order,
    }

    clips.forEach((clip) => {
        clip.trackId = track.id
    })
    track.clips = clips

    return track
}

// Meta 配置
const meta: Meta<typeof VideoTrack> = {
    title: 'Components/VideoTrack',
    component: VideoTrack,
    tags: ['autodocs'],
    parameters: {
        layout: 'fullscreen',
        docs: {
            description: {
                component: `
# VideoTrack 视频轨道编辑组件

一个功能丰富的视频轨道编辑组件，支持多轨道、拖拽编辑、时间线缩放等功能。

## 主要特性

- 🎬 **多轨道编辑** - 支持视频、音频、字幕、滤镜等多种轨道类型
- 🎯 **精准时间控制** - 支持帧级别的时间精度控制
- 🔄 **拖放操作** - 直观的拖放式编辑体验
- ⏱️ **时间轴缩放** - 灵活的时间轴缩放和定位
- ⌨️ **键盘快捷键** - 内置常用快捷键支持
- ↩️ **撤销/重做** - 完整的操作历史管理

## 快捷键

| 快捷键 | 功能 |
|--------|------|
| \`Ctrl/Cmd + C\` | 复制 |
| \`Ctrl/Cmd + X\` | 剪切 |
| \`Ctrl/Cmd + V\` | 粘贴 |
| \`Ctrl/Cmd + Z\` | 撤销 |
| \`Ctrl/Cmd + Shift + Z\` | 重做 |
| \`Delete\` | 删除 |
| \`Space\` | 播放/暂停 |
        `,
            },
        },
    },
    argTypes: {
        operationButtons: {
            control: 'object',
            description: '工具栏操作按钮配置',
            table: {
                type: { summary: 'OperationButton[]' },
                defaultValue: { summary: "['reset', 'undo', 'redo', 'delete']" },
            },
        },
        scaleConfigButtons: {
            control: 'object',
            description: '缩放配置按钮',
            table: {
                type: { summary: 'ScaleConfigButton[]' },
                defaultValue: { summary: "['snap']" },
            },
        },
        trackTypes: {
            control: 'object',
            description: '轨道类型及数量限制配置',
            table: {
                type: { summary: 'TrackTypeConfig' },
                defaultValue: { summary: '{ video: { max: 5 }, audio: { max: 3 }, subtitle: { max: 2 } }' },
            },
        },
        showToolsBar: {
            control: 'boolean',
            description: '是否显示工具栏',
        },
        enableMainTrackMode: {
            control: 'boolean',
            description: '是否启用主轨道模式',
        },
        enableCrossTrackDrag: {
            control: 'boolean',
            description: '是否启用跨轨道拖拽',
        },
        enableSnap: {
            control: 'boolean',
            description: '是否启用吸附',
        },
        snapThreshold: {
            control: { type: 'number', min: 1, max: 50, step: 1 },
            description: '吸附阈值（像素）',
        },
        fps: {
            control: { type: 'number', min: 1, max: 120, step: 1 },
            description: '帧率',
        },
        pixelsPerSecond: {
            control: { type: 'number', min: 10, max: 500, step: 10 },
            description: '每秒像素数',
        },
        minScale: {
            control: { type: 'number', min: 0.01, max: 1, step: 0.01 },
            description: '最小缩放比例',
        },
        maxScale: {
            control: { type: 'number', min: 1, max: 20, step: 1 },
            description: '最大缩放比例',
        },
        defaultScale: {
            control: { type: 'number', min: 0.1, max: 5, step: 0.1 },
            description: '默认缩放比例',
        },
        trackControlWidth: {
            control: { type: 'number', min: 100, max: 300, step: 10 },
            description: '轨道控制区宽度',
        },
        locale: {
            control: 'select',
            options: ['zh-CN', 'en-US'],
            description: '国际化配置',
        },
    },
}

export default meta
type Story = StoryObj<typeof VideoTrack>

// 基础用法
export const Default: Story = {
    name: '基础用法',
    render: (args) => ({
        components: { VideoTrack },
        setup() {
            // 为每个 Story 创建独立的 Pinia 实例
            const pinia = createPinia()
            setActivePinia(pinia)

            const videoTrackRef = ref()

            onMounted(() => {
                if (videoTrackRef.value) {
                    videoTrackRef.value.addTrack(createMockVideoTrack(1))
                    videoTrackRef.value.addTrack(createMockAudioTrack(2))
                    videoTrackRef.value.addTrack(createMockSubtitleTrack(3))
                }
            })

            return { args, videoTrackRef }
        },
        template: `
      <div style="height: 450px; background: #1a1a2e;">
        <VideoTrack
          ref="videoTrackRef"
          v-bind="args"
          style="height: 100%;"
        />
      </div>
    `,
    }),
    args: {
        operationButtons: ['reset', 'undo', 'redo', 'split', 'delete'],
        scaleConfigButtons: ['snap'],
        trackTypes: {
            video: { max: 5 },
            audio: { max: 3 },
            subtitle: { max: 2 },
        },
        showToolsBar: true,
        enableCrossTrackDrag: true,
        enableSnap: true,
        locale: 'zh-CN',
    },
}

// 英文界面
export const EnglishLocale: Story = {
    name: '英文界面',
    render: (args) => ({
        components: { VideoTrack },
        setup() {
            const pinia = createPinia()
            setActivePinia(pinia)

            const videoTrackRef = ref()

            onMounted(() => {
                if (videoTrackRef.value) {
                    videoTrackRef.value.addTrack(createMockVideoTrack(1))
                    videoTrackRef.value.addTrack(createMockAudioTrack(2))
                }
            })

            return { args, videoTrackRef }
        },
        template: `
      <div style="height: 400px; background: #1a1a2e;">
        <VideoTrack
          ref="videoTrackRef"
          v-bind="args"
          style="height: 100%;"
        />
      </div>
    `,
    }),
    args: {
        operationButtons: ['reset', 'undo', 'redo', 'split', 'delete'],
        scaleConfigButtons: ['snap'],
        trackTypes: {
            video: { max: 5 },
            audio: { max: 3 },
        },
        showToolsBar: true,
        enableCrossTrackDrag: true,
        enableSnap: true,
        locale: 'en-US',
    },
}

// 多轨道编辑
export const MultiTrack: Story = {
    name: '多轨道编辑',
    render: (args) => ({
        components: { VideoTrack },
        setup() {
            const pinia = createPinia()
            setActivePinia(pinia)

            const videoTrackRef = ref()

            onMounted(() => {
                if (videoTrackRef.value) {
                    videoTrackRef.value.addTrack(createMockVideoTrack(1))
                    videoTrackRef.value.addTrack(createMockVideoTrack(2))
                    videoTrackRef.value.addTrack(createMockAudioTrack(3))
                    videoTrackRef.value.addTrack(createMockAudioTrack(4))
                    videoTrackRef.value.addTrack(createMockSubtitleTrack(5))
                    videoTrackRef.value.addTrack(createMockFilterTrack(6))
                }
            })

            return { args, videoTrackRef }
        },
        template: `
      <div style="height: 550px; background: #1a1a2e;">
        <VideoTrack
          ref="videoTrackRef"
          v-bind="args"
          style="height: 100%;"
        />
      </div>
    `,
    }),
    args: {
        operationButtons: ['reset', 'undo', 'redo', 'split', 'delete'],
        scaleConfigButtons: ['snap'],
        trackTypes: {
            video: { max: 5 },
            audio: { max: 5 },
            subtitle: { max: 3 },
            filter: { max: 2 },
        },
        showToolsBar: true,
        enableCrossTrackDrag: true,
        enableSnap: true,
        locale: 'zh-CN',
    },
}

// 主轨道模式
export const MainTrackMode: Story = {
    name: '主轨道模式',
    render: (args) => ({
        components: { VideoTrack },
        setup() {
            const pinia = createPinia()
            setActivePinia(pinia)

            const videoTrackRef = ref()

            onMounted(() => {
                if (videoTrackRef.value) {
                    videoTrackRef.value.addTrack(createMockVideoTrack(1, true)) // 主轨道
                    videoTrackRef.value.addTrack(createMockAudioTrack(2))
                    videoTrackRef.value.addTrack(createMockSubtitleTrack(3))
                }
            })

            return { args, videoTrackRef }
        },
        template: `
      <div style="height: 450px; background: #1a1a2e;">
        <VideoTrack
          ref="videoTrackRef"
          v-bind="args"
          style="height: 100%;"
        />
      </div>
    `,
    }),
    args: {
        operationButtons: ['reset', 'undo', 'redo', 'split', 'delete'],
        scaleConfigButtons: ['snap'],
        trackTypes: {
            video: { max: 5 },
            audio: { max: 3 },
            subtitle: { max: 2 },
        },
        showToolsBar: true,
        enableMainTrackMode: true,
        enableCrossTrackDrag: true,
        enableSnap: true,
        locale: 'zh-CN',
    },
    parameters: {
        docs: {
            description: {
                story: '启用主轨道模式后，会有一个主轨道作为时间基准，其他轨道的 Clip 不能超出主轨道的时间范围。',
            },
        },
    },
}

// 禁用跨轨道拖拽
export const DisableCrossTrackDrag: Story = {
    name: '禁用跨轨道拖拽',
    render: (args) => ({
        components: { VideoTrack },
        setup() {
            const pinia = createPinia()
            setActivePinia(pinia)

            const videoTrackRef = ref()

            onMounted(() => {
                if (videoTrackRef.value) {
                    videoTrackRef.value.addTrack(createMockVideoTrack(1))
                    videoTrackRef.value.addTrack(createMockVideoTrack(2))
                    videoTrackRef.value.addTrack(createMockAudioTrack(3))
                }
            })

            return { args, videoTrackRef }
        },
        template: `
      <div style="height: 450px; background: #1a1a2e;">
        <VideoTrack
          ref="videoTrackRef"
          v-bind="args"
          style="height: 100%;"
        />
      </div>
    `,
    }),
    args: {
        operationButtons: ['reset', 'undo', 'redo', 'split', 'delete'],
        scaleConfigButtons: ['snap'],
        trackTypes: {
            video: { max: 5 },
            audio: { max: 3 },
        },
        showToolsBar: true,
        enableCrossTrackDrag: false,
        enableSnap: true,
        locale: 'zh-CN',
    },
    parameters: {
        docs: {
            description: {
                story: '禁用跨轨道拖拽后，Clip 只能在当前轨道内移动，不能拖拽到其他轨道。',
            },
        },
    },
}

// 自定义工具栏
export const CustomToolbar: Story = {
    name: '自定义工具栏',
    render: (args) => ({
        components: { VideoTrack },
        setup() {
            const pinia = createPinia()
            setActivePinia(pinia)

            const videoTrackRef = ref()

            onMounted(() => {
                if (videoTrackRef.value) {
                    videoTrackRef.value.addTrack(createMockVideoTrack(1))
                    videoTrackRef.value.addTrack(createMockAudioTrack(2))
                }
            })

            return { args, videoTrackRef }
        },
        template: `
      <div style="height: 400px; background: #1a1a2e;">
        <VideoTrack
          ref="videoTrackRef"
          v-bind="args"
          style="height: 100%;"
        />
      </div>
    `,
    }),
    args: {
        operationButtons: ['undo', 'redo'],
        scaleConfigButtons: [],
        showToolsBar: true,
        enableCrossTrackDrag: true,
        enableSnap: true,
        locale: 'zh-CN',
    },
    parameters: {
        docs: {
            description: {
                story: '可以自定义工具栏显示的按钮，只保留需要的功能。',
            },
        },
    },
}

// 隐藏工具栏
export const HideToolbar: Story = {
    name: '隐藏工具栏',
    render: (args) => ({
        components: { VideoTrack },
        setup() {
            const pinia = createPinia()
            setActivePinia(pinia)

            const videoTrackRef = ref()

            onMounted(() => {
                if (videoTrackRef.value) {
                    videoTrackRef.value.addTrack(createMockVideoTrack(1))
                    videoTrackRef.value.addTrack(createMockAudioTrack(2))
                }
            })

            return { args, videoTrackRef }
        },
        template: `
      <div style="height: 350px; background: #1a1a2e;">
        <VideoTrack
          ref="videoTrackRef"
          v-bind="args"
          style="height: 100%;"
        />
      </div>
    `,
    }),
    args: {
        showToolsBar: false,
        enableCrossTrackDrag: true,
        enableSnap: true,
        locale: 'zh-CN',
    },
    parameters: {
        docs: {
            description: {
                story: '可以隐藏工具栏，通过外部控制组件的操作。',
            },
        },
    },
}

// 事件监听示例
export const WithEvents: Story = {
    name: '事件监听',
    render: (args) => ({
        components: { VideoTrack },
        setup() {
            const pinia = createPinia()
            setActivePinia(pinia)

            const videoTrackRef = ref()
            const eventLog = ref<string[]>([])

            const logEvent = (eventName: string, ...eventArgs: any[]) => {
                const log = `[${new Date().toLocaleTimeString()}] ${eventName}: ${JSON.stringify(eventArgs).slice(0, 80)}`
                eventLog.value.unshift(log)
                if (eventLog.value.length > 8) {
                    eventLog.value.pop()
                }
            }

            onMounted(() => {
                if (videoTrackRef.value) {
                    videoTrackRef.value.addTrack(createMockVideoTrack(1))
                    videoTrackRef.value.addTrack(createMockAudioTrack(2))
                }
            })

            return { args, videoTrackRef, eventLog, logEvent }
        },
        template: `
      <div style="display: flex; flex-direction: column; height: 500px; background: #1a1a2e;">
        <div style="flex: 1; min-height: 0;">
          <VideoTrack
            ref="videoTrackRef"
            v-bind="args"
            @clip-select="(ids) => logEvent('clipSelect', ids)"
            @clip-delete="(id) => logEvent('clipDelete', id)"
            @clip-copy="(ids) => logEvent('clipCopy', ids)"
            @clip-cut="(ids) => logEvent('clipCut', ids)"
            @selection:changed="(ids, prev) => logEvent('selection:changed', { current: ids, previous: prev })"
            @playback:play="() => logEvent('playback:play')"
            @playback:pause="() => logEvent('playback:pause')"
            @playback:seek="(time) => logEvent('playback:seek', time)"
            @scale:changed="(scale) => logEvent('scale:changed', scale)"
            style="height: 100%;"
          />
        </div>
        <div style="padding: 12px; background: #0d1117; border-top: 1px solid #30363d; height: 140px; overflow-y: auto; flex-shrink: 0;">
          <div style="color: #8b949e; font-size: 12px; margin-bottom: 8px;">📋 事件日志（点击 Clip、播放、缩放等操作会触发事件）</div>
          <div v-for="(log, index) in eventLog" :key="index" style="color: #58a6ff; font-family: monospace; font-size: 11px; padding: 2px 0;">
            {{ log }}
          </div>
          <div v-if="eventLog.length === 0" style="color: #6e7681; font-size: 11px;">暂无事件，请尝试点击 Clip 或进行其他操作</div>
        </div>
      </div>
    `,
    }),
    args: {
        operationButtons: ['reset', 'undo', 'redo', 'split', 'delete'],
        scaleConfigButtons: ['snap'],
        showToolsBar: true,
        enableCrossTrackDrag: true,
        enableSnap: true,
        locale: 'zh-CN',
    },
    parameters: {
        docs: {
            description: {
                story: '组件提供丰富的事件，可以监听用户的各种操作。尝试点击 Clip、使用播放控制、缩放时间线等操作查看事件触发。',
            },
        },
    },
}

// 空状态
export const EmptyState: Story = {
    name: '空状态',
    render: (args) => ({
        components: { VideoTrack },
        setup() {
            const pinia = createPinia()
            setActivePinia(pinia)

            return { args }
        },
        template: `
      <div style="height: 300px; background: #1a1a2e;">
        <VideoTrack v-bind="args" style="height: 100%;" />
      </div>
    `,
    }),
    args: {
        operationButtons: ['reset', 'undo', 'redo', 'split', 'delete'],
        scaleConfigButtons: ['snap'],
        showToolsBar: true,
        enableCrossTrackDrag: true,
        enableSnap: true,
        locale: 'zh-CN',
    },
    parameters: {
        docs: {
            description: {
                story: '组件初始化后的空状态，可以通过 API 动态添加轨道和 Clip。',
            },
        },
    },
}

// 不同缩放配置
export const ScaleConfig: Story = {
    name: '缩放配置',
    render: (args) => ({
        components: { VideoTrack },
        setup() {
            const pinia = createPinia()
            setActivePinia(pinia)

            const videoTrackRef = ref()

            onMounted(() => {
                if (videoTrackRef.value) {
                    videoTrackRef.value.addTrack(createMockVideoTrack(1))
                    videoTrackRef.value.addTrack(createMockAudioTrack(2))
                }
            })

            return { args, videoTrackRef }
        },
        template: `
      <div style="height: 400px; background: #1a1a2e;">
        <VideoTrack
          ref="videoTrackRef"
          v-bind="args"
          style="height: 100%;"
        />
      </div>
    `,
    }),
    args: {
        operationButtons: ['reset', 'undo', 'redo', 'delete'],
        scaleConfigButtons: ['snap'],
        showToolsBar: true,
        enableCrossTrackDrag: true,
        enableSnap: true,
        minScale: 0.2,
        maxScale: 5,
        defaultScale: 1.5,
        pixelsPerSecond: 150,
        locale: 'zh-CN',
    },
    parameters: {
        docs: {
            description: {
                story: '可以配置时间线的缩放范围和默认缩放比例，以及每秒显示的像素数。',
            },
        },
    },
}

// 新属性示例 - 展示 rect, time, opacity, visible, flip, animations 等属性
export const NewClipProperties: Story = {
    name: '新 Clip 属性',
    render: (args) => ({
        components: { VideoTrack },
        setup() {
            const pinia = createPinia()
            setActivePinia(pinia)

            const videoTrackRef = ref()

            // 创建带有新属性的视频 Clip
            function createEnhancedVideoTrack(): Track {
                const clips: MediaClip[] = [
                    {
                        id: generateId('clip-'),
                        trackId: '',
                        type: 'video',
                        startTime: 0,
                        endTime: 5,
                        selected: false,
                        sourceUrl: '',
                        originalDuration: 23,
                        trimStart: 0,
                        trimEnd: 5,
                        playbackRate: 1,
                        thumbnails: [],
                        // 空间配置
                        rect: {
                            x: 0,
                            y: 0,
                            w: 1920,
                            h: 1080,
                            angle: 0,
                            fixedAspectRatio: true,
                        },
                        // 可见性和透明度
                        visible: true,
                        opacity: 1,
                        // 翻转
                        flip: null,
                        // 交互模式
                        interactable: 'interactive',
                        zIndex: 1,
                    },
                    {
                        id: generateId('clip-'),
                        trackId: '',
                        type: 'video',
                        startTime: 6,
                        endTime: 12,
                        selected: false,
                        sourceUrl: '',
                        originalDuration: 20,
                        trimStart: 2,
                        trimEnd: 8,
                        playbackRate: 1,
                        thumbnails: [],
                        // 新属性示例：带翻转和半透明
                        rect: {
                            x: 100,
                            y: 100,
                            w: 800,
                            h: 600,
                            angle: Math.PI / 6, // 30度
                        },
                        visible: true,
                        opacity: 0.8,
                        flip: 'horizontal',
                        // 新属性：带动画
                        animations: [
                            {
                                id: 'fadeIn',
                                name: '淡入效果',
                                keyframes: {
                                    'from': { opacity: 0 },
                                    'to': { opacity: 0.8 },
                                },
                                options: {
                                    duration: 500_000, // 0.5秒
                                    easing: 'ease-out',
                                    fillMode: 'forwards',
                                },
                                enabled: true,
                            },
                        ],
                    },
                ]

                const track: Track = {
                    id: generateId('track-'),
                    type: 'video',
                    name: '视频轨道（新属性示例）',
                    visible: true,
                    locked: false,
                    clips: [],
                    order: 1,
                }

                clips.forEach((clip) => {
                    clip.trackId = track.id
                })
                track.clips = clips

                return track
            }

            onMounted(() => {
                if (videoTrackRef.value) {
                    videoTrackRef.value.addTrack(createEnhancedVideoTrack())
                }
            })

            // 演示如何更新 clip 属性（深度合并，无需展开原有属性）
            const updateClipDemo = () => {
                if (videoTrackRef.value) {
                    const clips = videoTrackRef.value.getTracks()[0]?.clips
                    if (clips && clips.length > 0) {
                        // 使用 updateClip 方法更新属性
                        // 深度合并：只需指定要更新的字段，其他字段会自动保留
                        videoTrackRef.value.updateClip(clips[0].id, {
                            rect: {
                                angle: (clips[0].rect?.angle ?? 0) + Math.PI / 12, // 只更新 angle，保留 x, y, w, h
                            },
                            opacity: Math.max(0.3, (clips[0].opacity ?? 1) - 0.1),
                        })
                    }
                }
            }

            return { args, videoTrackRef, updateClipDemo }
        },
        template: `
      <div style="display: flex; flex-direction: column; height: 450px; background: #1a1a2e;">
        <div style="padding: 8px; background: #0d1117; border-bottom: 1px solid #30363d;">
          <button 
            @click="updateClipDemo" 
            style="padding: 6px 12px; background: #238636; color: white; border: none; border-radius: 4px; cursor: pointer;"
          >
            更新第一个 Clip（旋转+降低透明度）
          </button>
        </div>
        <div style="flex: 1; min-height: 0;">
          <VideoTrack
            ref="videoTrackRef"
            v-bind="args"
            style="height: 100%;"
          />
        </div>
      </div>
    `,
    }),
    args: {
        operationButtons: ['reset', 'undo', 'redo', 'split', 'delete'],
        scaleConfigButtons: ['snap'],
        showToolsBar: true,
        enableCrossTrackDrag: true,
        enableSnap: true,
        locale: 'zh-CN',
    },
    parameters: {
        docs: {
            description: {
                story: `
展示新增的 Clip 属性配置，包括：

- **rect**: 空间属性（x, y, w, h, angle）
- **visible**: 可见性控制
- **opacity**: 透明度 (0-1)
- **flip**: 翻转模式 ('horizontal' | 'vertical' | null)
- **interactable**: 交互模式 ('interactive' | 'selectable' | 'disabled')
- **zIndex**: 层级
- **animations**: 关键帧动画配置
- **playbackRate**: 播放速率（仅 MediaClip 音视频有）

点击按钮可以演示如何使用 \`updateClip\` 方法更新这些属性。
                `,
            },
        },
    },
}
