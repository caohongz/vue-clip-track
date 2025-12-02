import { describe, it, expect } from 'vitest'
import {
    DEFAULT_RECT,
    TIME_UNITS,
    timeUtils,
} from '../../types/clip'
import type {
    RectProps,
    RectConfig,
    FlipType,
    AnimatableProps,
    AnimationKeyframes,
    AnimationOptions,
    AnimationConfig,
    InteractableMode,
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
    PresetAnimationType,
    PresetAnimation,
    ClipCreateOptions,
    ClipUpdateOptions,
} from '../../types/clip'

describe('clip types', () => {
    describe('DEFAULT_RECT', () => {
        it('应该有正确的默认值', () => {
            expect(DEFAULT_RECT).toEqual({
                x: 0,
                y: 0,
                w: 100,
                h: 100,
                angle: 0,
            })
        })

        it('应该包含所有 RectProps 属性', () => {
            expect(DEFAULT_RECT).toHaveProperty('x')
            expect(DEFAULT_RECT).toHaveProperty('y')
            expect(DEFAULT_RECT).toHaveProperty('w')
            expect(DEFAULT_RECT).toHaveProperty('h')
            expect(DEFAULT_RECT).toHaveProperty('angle')
        })
    })

    describe('TIME_UNITS', () => {
        it('应该定义正确的秒到微秒转换常量', () => {
            expect(TIME_UNITS.SECOND_TO_MICROSECOND).toBe(1_000_000)
        })

        it('应该定义正确的毫秒到微秒转换常量', () => {
            expect(TIME_UNITS.MILLISECOND_TO_MICROSECOND).toBe(1_000)
        })
    })

    describe('timeUtils', () => {
        describe('secondsToMicroseconds', () => {
            it('应该正确转换秒到微秒', () => {
                expect(timeUtils.secondsToMicroseconds(1)).toBe(1_000_000)
                expect(timeUtils.secondsToMicroseconds(0.5)).toBe(500_000)
                expect(timeUtils.secondsToMicroseconds(0)).toBe(0)
            })

            it('应该处理小数值', () => {
                expect(timeUtils.secondsToMicroseconds(0.001)).toBe(1_000)
                expect(timeUtils.secondsToMicroseconds(2.5)).toBe(2_500_000)
            })
        })

        describe('microsecondsToSeconds', () => {
            it('应该正确转换微秒到秒', () => {
                expect(timeUtils.microsecondsToSeconds(1_000_000)).toBe(1)
                expect(timeUtils.microsecondsToSeconds(500_000)).toBe(0.5)
                expect(timeUtils.microsecondsToSeconds(0)).toBe(0)
            })

            it('应该处理小数值', () => {
                expect(timeUtils.microsecondsToSeconds(1_000)).toBe(0.001)
                expect(timeUtils.microsecondsToSeconds(2_500_000)).toBe(2.5)
            })
        })

        describe('framesToMicroseconds', () => {
            it('应该正确转换帧数到微秒（30fps）', () => {
                expect(timeUtils.framesToMicroseconds(30, 30)).toBe(1_000_000)
                expect(timeUtils.framesToMicroseconds(15, 30)).toBe(500_000)
                expect(timeUtils.framesToMicroseconds(0, 30)).toBe(0)
            })

            it('应该正确转换帧数到微秒（24fps）', () => {
                expect(timeUtils.framesToMicroseconds(24, 24)).toBe(1_000_000)
                expect(timeUtils.framesToMicroseconds(12, 24)).toBe(500_000)
            })

            it('应该正确转换帧数到微秒（60fps）', () => {
                expect(timeUtils.framesToMicroseconds(60, 60)).toBe(1_000_000)
                expect(timeUtils.framesToMicroseconds(30, 60)).toBe(500_000)
            })
        })

        describe('microsecondsToFrames', () => {
            it('应该正确转换微秒到帧数（30fps）', () => {
                expect(timeUtils.microsecondsToFrames(1_000_000, 30)).toBe(30)
                expect(timeUtils.microsecondsToFrames(500_000, 30)).toBe(15)
                expect(timeUtils.microsecondsToFrames(0, 30)).toBe(0)
            })

            it('应该正确转换微秒到帧数（24fps）', () => {
                expect(timeUtils.microsecondsToFrames(1_000_000, 24)).toBe(24)
                expect(timeUtils.microsecondsToFrames(500_000, 24)).toBe(12)
            })

            it('应该正确转换微秒到帧数（60fps）', () => {
                expect(timeUtils.microsecondsToFrames(1_000_000, 60)).toBe(60)
                expect(timeUtils.microsecondsToFrames(500_000, 60)).toBe(30)
            })
        })

        describe('转换往返一致性', () => {
            it('秒 -> 微秒 -> 秒 应该一致', () => {
                const seconds = 5.5
                const microseconds = timeUtils.secondsToMicroseconds(seconds)
                const result = timeUtils.microsecondsToSeconds(microseconds)
                expect(result).toBe(seconds)
            })

            it('帧 -> 微秒 -> 帧 应该一致', () => {
                const frames = 45
                const fps = 30
                const microseconds = timeUtils.framesToMicroseconds(frames, fps)
                const result = timeUtils.microsecondsToFrames(microseconds, fps)
                expect(result).toBe(frames)
            })
        })
    })

    describe('类型定义验证', () => {
        describe('RectProps', () => {
            it('应该能创建有效的 RectProps 对象', () => {
                const rect: RectProps = {
                    x: 10,
                    y: 20,
                    w: 200,
                    h: 150,
                    angle: Math.PI / 4,
                }
                expect(rect.x).toBe(10)
                expect(rect.y).toBe(20)
                expect(rect.w).toBe(200)
                expect(rect.h).toBe(150)
                expect(rect.angle).toBe(Math.PI / 4)
            })
        })

        describe('RectConfig', () => {
            it('应该能创建有效的 RectConfig 对象', () => {
                const config: RectConfig = {
                    x: 0,
                    y: 0,
                    w: 100,
                    h: 100,
                    angle: 0,
                    fixedAspectRatio: true,
                    fixedScaleCenter: false,
                }
                expect(config.fixedAspectRatio).toBe(true)
                expect(config.fixedScaleCenter).toBe(false)
            })
        })

        describe('FlipType', () => {
            it('应该支持所有翻转类型', () => {
                const horizontal: FlipType = 'horizontal'
                const vertical: FlipType = 'vertical'
                const none: FlipType = null

                expect(horizontal).toBe('horizontal')
                expect(vertical).toBe('vertical')
                expect(none).toBeNull()
            })
        })

        describe('AnimatableProps', () => {
            it('应该能创建有效的 AnimatableProps 对象', () => {
                const props: AnimatableProps = {
                    x: 100,
                    opacity: 0.5,
                }
                expect(props.x).toBe(100)
                expect(props.opacity).toBe(0.5)
            })

            it('应该允许所有属性都是可选的', () => {
                const emptyProps: AnimatableProps = {}
                expect(emptyProps).toEqual({})
            })
        })

        describe('AnimationKeyframes', () => {
            it('应该能创建百分比格式的关键帧', () => {
                const keyframes: AnimationKeyframes = {
                    '0%': { opacity: 0 },
                    '50%': { opacity: 0.5 },
                    '100%': { opacity: 1 },
                }
                expect(keyframes['0%']?.opacity).toBe(0)
                expect(keyframes['50%']?.opacity).toBe(0.5)
                expect(keyframes['100%']?.opacity).toBe(1)
            })

            it('应该能创建 from/to 格式的关键帧', () => {
                const keyframes: AnimationKeyframes = {
                    from: { opacity: 0, x: 0 },
                    to: { opacity: 1, x: 100 },
                }
                expect(keyframes.from?.opacity).toBe(0)
                expect(keyframes.to?.opacity).toBe(1)
            })
        })

        describe('AnimationOptions', () => {
            it('应该能创建完整的动画选项', () => {
                const options: AnimationOptions = {
                    duration: 1_000_000,
                    delay: 500_000,
                    iterCount: 2,
                    easing: 'ease-in-out',
                    direction: 'alternate',
                    fillMode: 'both',
                }
                expect(options.duration).toBe(1_000_000)
                expect(options.delay).toBe(500_000)
                expect(options.iterCount).toBe(2)
                expect(options.easing).toBe('ease-in-out')
                expect(options.direction).toBe('alternate')
                expect(options.fillMode).toBe('both')
            })

            it('应该允许只有必需的 duration 属性', () => {
                const options: AnimationOptions = {
                    duration: 1_000_000,
                }
                expect(options.duration).toBe(1_000_000)
            })
        })

        describe('AnimationConfig', () => {
            it('应该能创建完整的动画配置', () => {
                const config: AnimationConfig = {
                    id: 'anim-1',
                    name: 'fadeIn',
                    keyframes: {
                        from: { opacity: 0 },
                        to: { opacity: 1 },
                    },
                    options: {
                        duration: 500_000,
                    },
                    enabled: true,
                }
                expect(config.id).toBe('anim-1')
                expect(config.name).toBe('fadeIn')
                expect(config.enabled).toBe(true)
            })
        })

        describe('InteractableMode', () => {
            it('应该支持所有交互模式', () => {
                const interactive: InteractableMode = 'interactive'
                const selectable: InteractableMode = 'selectable'
                const disabled: InteractableMode = 'disabled'

                expect(interactive).toBe('interactive')
                expect(selectable).toBe('selectable')
                expect(disabled).toBe('disabled')
            })
        })

        describe('BaseClip 扩展属性', () => {
            it('应该能创建带有新属性的 BaseClip', () => {
                const clip: BaseClip = {
                    id: 'clip-1',
                    trackId: 'track-1',
                    startTime: 0,
                    endTime: 5,
                    selected: false,
                    // 新增属性
                    rect: { ...DEFAULT_RECT, x: 50, y: 50 },
                    visible: true,
                    opacity: 0.8,
                    flip: 'horizontal',
                    interactable: 'interactive',
                    zIndex: 10,
                    animations: [
                        {
                            keyframes: { from: { opacity: 0 }, to: { opacity: 1 } },
                            options: { duration: 500_000 },
                        },
                    ],
                    config: { customKey: 'customValue' },
                }

                expect(clip.rect?.x).toBe(50)
                expect(clip.visible).toBe(true)
                expect(clip.opacity).toBe(0.8)
                expect(clip.flip).toBe('horizontal')
                expect(clip.interactable).toBe('interactive')
                expect(clip.zIndex).toBe(10)
                expect(clip.animations).toHaveLength(1)
                expect(clip.config?.customKey).toBe('customValue')
            })
        })

        describe('MediaClip', () => {
            it('应该能创建完整的 MediaClip', () => {
                const clip: MediaClip = {
                    id: 'clip-1',
                    trackId: 'track-1',
                    type: 'video',
                    startTime: 0,
                    endTime: 10,
                    selected: false,
                    sourceUrl: 'video.mp4',
                    originalDuration: 30,
                    trimStart: 0,
                    trimEnd: 10,
                    playbackRate: 1.5,
                    volume: 0.8,
                    thumbnails: ['thumb1.jpg', 'thumb2.jpg'],
                    // 新增属性
                    rect: DEFAULT_RECT,
                    opacity: 1,
                    flip: null,
                }

                expect(clip.type).toBe('video')
                expect(clip.playbackRate).toBe(1.5)
                expect(clip.rect).toEqual(DEFAULT_RECT)
            })
        })

        describe('SubtitleClip', () => {
            it('应该能创建完整的 SubtitleClip', () => {
                const clip: SubtitleClip = {
                    id: 'clip-1',
                    trackId: 'track-1',
                    type: 'subtitle',
                    startTime: 0,
                    endTime: 5,
                    selected: false,
                    text: 'Hello World',
                    fontFamily: 'Arial',
                    fontSize: 24,
                    color: '#ffffff',
                    backgroundColor: '#000000',
                    textAlign: 'center',
                    // 新增属性
                    visible: true,
                    opacity: 1,
                    animations: [],
                }

                expect(clip.type).toBe('subtitle')
                expect(clip.text).toBe('Hello World')
                expect(clip.visible).toBe(true)
            })
        })

        describe('TextClip', () => {
            it('应该能创建完整的 TextClip', () => {
                const clip: TextClip = {
                    id: 'clip-1',
                    trackId: 'track-1',
                    type: 'text',
                    startTime: 0,
                    endTime: 5,
                    selected: false,
                    text: 'Sample Text',
                    fontFamily: 'Helvetica',
                    fontSize: 32,
                    color: '#ff0000',
                    backgroundColor: 'transparent',
                    // 新增属性
                    rect: { ...DEFAULT_RECT, w: 200, h: 50 },
                    zIndex: 5,
                }

                expect(clip.type).toBe('text')
                expect(clip.rect?.w).toBe(200)
            })
        })

        describe('StickerClip', () => {
            it('应该能创建完整的 StickerClip', () => {
                const clip: StickerClip = {
                    id: 'clip-1',
                    trackId: 'track-1',
                    type: 'sticker',
                    startTime: 0,
                    endTime: 5,
                    selected: false,
                    sourceUrl: 'sticker.png',
                    // 新增属性
                    rect: DEFAULT_RECT,
                    flip: 'vertical',
                }

                expect(clip.type).toBe('sticker')
                expect(clip.flip).toBe('vertical')
            })
        })

        describe('FilterClip', () => {
            it('应该能创建完整的 FilterClip', () => {
                const clip: FilterClip = {
                    id: 'clip-1',
                    trackId: 'track-1',
                    type: 'filter',
                    startTime: 0,
                    endTime: 5,
                    selected: false,
                    filterType: 'blur',
                    filterValue: { radius: 5, strength: 0.8 },
                    // 新增属性
                    interactable: 'disabled',
                }

                expect(clip.type).toBe('filter')
                expect(clip.filterType).toBe('blur')
                expect(clip.interactable).toBe('disabled')
            })
        })

        describe('EffectClip', () => {
            it('应该能创建完整的 EffectClip', () => {
                const clip: EffectClip = {
                    id: 'clip-1',
                    trackId: 'track-1',
                    type: 'effect',
                    startTime: 0,
                    endTime: 5,
                    selected: false,
                    effectType: 'glow',
                    effectDuration: 2,
                    // 新增属性
                    animations: [
                        {
                            keyframes: { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
                            options: { duration: 1_000_000, iterCount: Infinity },
                        },
                    ],
                }

                expect(clip.type).toBe('effect')
                expect(clip.animations?.[0].options.iterCount).toBe(Infinity)
            })
        })

        describe('TransitionClip', () => {
            it('应该能创建完整的 TransitionClip', () => {
                const clip: TransitionClip = {
                    id: 'clip-1',
                    trackId: 'track-1',
                    type: 'transition',
                    startTime: 4.5,
                    endTime: 5.5,
                    selected: false,
                    transitionType: 'fade',
                    transitionDuration: 1,
                    // 新增属性
                    visible: true,
                }

                expect(clip.type).toBe('transition')
                expect(clip.transitionDuration).toBe(1)
            })
        })

        describe('ClipType', () => {
            it('应该包含所有 clip 类型', () => {
                const types: ClipType[] = [
                    'video',
                    'audio',
                    'subtitle',
                    'text',
                    'sticker',
                    'filter',
                    'effect',
                    'transition',
                ]
                expect(types).toHaveLength(8)
            })
        })

        describe('PresetAnimationType', () => {
            it('应该支持所有预设动画类型', () => {
                const presets: PresetAnimationType[] = [
                    'fadeIn',
                    'fadeOut',
                    'slideInLeft',
                    'slideInRight',
                    'slideInTop',
                    'slideInBottom',
                    'slideOutLeft',
                    'slideOutRight',
                    'slideOutTop',
                    'slideOutBottom',
                    'zoomIn',
                    'zoomOut',
                    'rotateIn',
                    'rotateOut',
                    'bounceIn',
                    'bounceOut',
                ]
                expect(presets).toHaveLength(16)
            })
        })

        describe('PresetAnimation', () => {
            it('应该能创建预设动画配置', () => {
                const preset: PresetAnimation = {
                    type: 'fadeIn',
                    options: {
                        duration: 500_000,
                        easing: 'ease-out',
                    },
                }
                expect(preset.type).toBe('fadeIn')
                expect(preset.options?.duration).toBe(500_000)
            })
        })
    })
})
