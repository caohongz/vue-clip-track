import { describe, it, expect } from 'vitest'
import {
    createMockVideoTrack,
    createMockAudioTrack,
    createMockSubtitleTrack,
    createMockFilterTrack,
    createMockTracks,
    createMockMainTrackWithTransitions,
    createMockMainTrack,
} from '../../utils/mockData'
import type { MediaClip, SubtitleClip, FilterClip, TransitionClip } from '../../types'

describe('mockData', () => {
    describe('createMockVideoTrack', () => {
        it('应该创建视频轨道', () => {
            const track = createMockVideoTrack(1)

            expect(track.type).toBe('video')
            expect(track.order).toBe(1)
            expect(track.isMain).toBeFalsy()
            expect(track.visible).toBe(true)
            expect(track.locked).toBe(false)
        })

        it('应该创建主轨道', () => {
            const track = createMockVideoTrack(1, true)

            expect(track.isMain).toBe(true)
            expect(track.name).toBe('主轨道（视频）')
        })

        it('轨道应该包含视频片段', () => {
            const track = createMockVideoTrack(1)

            expect(track.clips.length).toBeGreaterThan(0)
            track.clips.forEach((clip) => {
                expect(clip.type).toBe('video')
                expect(clip.trackId).toBe(track.id)
            })
        })

        it('视频片段应该有正确的属性', () => {
            const track = createMockVideoTrack(1)
            const clip = track.clips[0] as MediaClip

            expect(clip.sourceUrl).toBeDefined()
            expect(clip.originalDuration).toBeDefined()
            expect(clip.trimStart).toBeDefined()
            expect(clip.trimEnd).toBeDefined()
            expect(clip.playbackRate).toBeDefined()
        })
    })

    describe('createMockAudioTrack', () => {
        it('应该创建音频轨道', () => {
            const track = createMockAudioTrack(1)

            expect(track.type).toBe('audio')
            expect(track.order).toBe(1)
            expect(track.visible).toBe(true)
            expect(track.locked).toBe(false)
        })

        it('轨道应该包含音频片段', () => {
            const track = createMockAudioTrack(1)

            expect(track.clips.length).toBeGreaterThan(0)
            track.clips.forEach((clip) => {
                expect(clip.type).toBe('audio')
                expect(clip.trackId).toBe(track.id)
            })
        })

        it('音频片段应该有音量属性', () => {
            const track = createMockAudioTrack(1)
            const clip = track.clips[0] as MediaClip

            expect(clip.volume).toBeDefined()
        })
    })

    describe('createMockSubtitleTrack', () => {
        it('应该创建字幕轨道', () => {
            const track = createMockSubtitleTrack(1)

            expect(track.type).toBe('subtitle')
            expect(track.order).toBe(1)
        })

        it('轨道应该包含字幕片段', () => {
            const track = createMockSubtitleTrack(1)

            expect(track.clips.length).toBeGreaterThan(0)
            track.clips.forEach((clip) => {
                expect(clip.type).toBe('subtitle')
                expect(clip.trackId).toBe(track.id)
            })
        })

        it('字幕片段应该有文本和样式属性', () => {
            const track = createMockSubtitleTrack(1)
            const clip = track.clips[0] as SubtitleClip

            expect(clip.text).toBeDefined()
            expect(clip.fontFamily).toBeDefined()
            expect(clip.fontSize).toBeDefined()
            expect(clip.color).toBeDefined()
            expect(clip.textAlign).toBeDefined()
        })
    })

    describe('createMockFilterTrack', () => {
        it('应该创建滤镜轨道', () => {
            const track = createMockFilterTrack(1)

            expect(track.type).toBe('filter')
            expect(track.order).toBe(1)
        })

        it('轨道应该包含滤镜片段', () => {
            const track = createMockFilterTrack(1)

            expect(track.clips.length).toBeGreaterThan(0)
            track.clips.forEach((clip) => {
                expect(clip.type).toBe('filter')
                expect(clip.trackId).toBe(track.id)
            })
        })

        it('滤镜片段应该有滤镜属性', () => {
            const track = createMockFilterTrack(1)
            const clip = track.clips[0] as FilterClip

            expect(clip.filterType).toBeDefined()
            expect(clip.filterValue).toBeDefined()
            expect(clip.name).toBeDefined()
        })
    })

    describe('createMockTracks', () => {
        it('普通模式应该创建完整的轨道列表', () => {
            const tracks = createMockTracks(false)

            expect(tracks.length).toBe(5)

            // 检查轨道类型
            const trackTypes = tracks.map((t) => t.type)
            expect(trackTypes).toContain('video')
            expect(trackTypes).toContain('audio')
            expect(trackTypes).toContain('subtitle')
            expect(trackTypes).toContain('filter')
        })

        it('主轨道模式应该创建带主轨道的列表', () => {
            const tracks = createMockTracks(true)

            expect(tracks.length).toBe(5)

            // 第一条轨道应该是主轨道
            expect(tracks[0].isMain).toBe(true)
        })

        it('默认应该是普通模式', () => {
            const tracks = createMockTracks()

            // 检查没有主轨道
            const hasMain = tracks.some((t) => t.isMain)
            expect(hasMain).toBe(false)
        })
    })

    describe('createMockMainTrackWithTransitions', () => {
        it('应该创建带转场的主轨道', () => {
            const track = createMockMainTrackWithTransitions()

            expect(track.isMain).toBe(true)
            expect(track.type).toBe('video')
        })

        it('应该包含转场片段', () => {
            const track = createMockMainTrackWithTransitions()

            const transitionClips = track.clips.filter((c) => c.type === 'transition')
            expect(transitionClips.length).toBeGreaterThan(0)
        })

        it('转场片段应该有正确的属性', () => {
            const track = createMockMainTrackWithTransitions()

            const transitionClip = track.clips.find((c) => c.type === 'transition') as TransitionClip

            expect(transitionClip.transitionType).toBeDefined()
            expect(transitionClip.transitionDuration).toBeDefined()
            expect(transitionClip.name).toBeDefined()
        })
    })

    describe('createMockMainTrack', () => {
        it('应该创建主轨道', () => {
            const track = createMockMainTrack()

            expect(track.isMain).toBe(true)
            expect(track.type).toBe('video')
            expect(track.order).toBe(0)
        })

        it('片段应该连续排列', () => {
            const track = createMockMainTrack()

            // 验证片段连续（后一个的开始时间等于前一个的结束时间）
            for (let i = 1; i < track.clips.length; i++) {
                const prev = track.clips[i - 1]
                const curr = track.clips[i]
                expect(curr.startTime).toBe(prev.endTime)
            }
        })

        it('所有片段应该关联到正确的轨道', () => {
            const track = createMockMainTrack()

            track.clips.forEach((clip) => {
                expect(clip.trackId).toBe(track.id)
            })
        })
    })
})
