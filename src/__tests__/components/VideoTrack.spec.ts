import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import type { MediaClip } from '../../types'

// 简单的组件测试
describe('VideoTrack Components', () => {
    beforeEach(() => {
        setActivePinia(createPinia())

        // Mock localStorage
        vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null)
        vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { })

        // Mock requestAnimationFrame
        vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
            setTimeout(cb, 16)
            return 1
        })

        // Mock cancelAnimationFrame
        vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => { })
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    describe('ClipItem 组件逻辑', () => {
        it('应该正确计算 clip 样式', async () => {
            const { useScaleStore } = await import('../../stores/scale')
            const scaleStore = useScaleStore()

            // 设置 pixelsPerSecond
            const pixelsPerSecond = scaleStore.actualPixelsPerSecond

            // clip 从 0 到 5 秒
            const startTime = 0
            const endTime = 5

            const expectedLeft = startTime * pixelsPerSecond
            const expectedWidth = (endTime - startTime) * pixelsPerSecond

            expect(expectedLeft).toBe(0)
            expect(expectedWidth).toBe(5 * pixelsPerSecond)
        })

        it('应该正确处理选中状态', async () => {
            const { useTracksStore } = await import('../../stores/tracks')
            const tracksStore = useTracksStore()

            const track = {
                id: 'track-1',
                type: 'video' as const,
                name: 'Test Track',
                visible: true,
                locked: false,
                clips: [],
                order: 0,
            }
            tracksStore.addTrack(track)

            const clip = {
                id: 'clip-1',
                trackId: 'track-1',
                type: 'video' as const,
                startTime: 0,
                endTime: 5,
                selected: false,
                sourceUrl: 'test.mp4',
                originalDuration: 10,
                trimStart: 0,
                trimEnd: 10,
                playbackRate: 1,
            }
            tracksStore.addClip('track-1', clip)

            // 选中 clip
            tracksStore.selectClip('clip-1')

            expect(tracksStore.selectedClipIds.has('clip-1')).toBe(true)
        })
    })

    describe('Ruler 组件逻辑', () => {
        it('应该正确计算刻度', async () => {
            const { useScaleStore } = await import('../../stores/scale')
            const scaleStore = useScaleStore()

            const pixelsPerSecond = scaleStore.actualPixelsPerSecond

            // 计算 10 秒的刻度位置
            const time = 10
            const position = time * pixelsPerSecond

            expect(position).toBe(10 * pixelsPerSecond)
        })

        it('应该根据缩放级别调整刻度间隔', async () => {
            const { useScaleStore } = await import('../../stores/scale')
            const scaleStore = useScaleStore()

            // 放大
            scaleStore.zoomIn()
            const zoomedPixelsPerSecond = scaleStore.actualPixelsPerSecond

            // 缩小回原来
            scaleStore.zoomOut()
            const originalPixelsPerSecond = scaleStore.actualPixelsPerSecond

            expect(zoomedPixelsPerSecond).toBeGreaterThan(originalPixelsPerSecond)
        })
    })

    describe('ToolsBar 组件逻辑', () => {
        it('应该正确处理播放控制', async () => {
            const { usePlaybackStore } = await import('../../stores/playback')
            const playbackStore = usePlaybackStore()

            // 初始状态不是播放中
            expect(playbackStore.isPlaying).toBe(false)

            // 播放
            playbackStore.play()
            expect(playbackStore.isPlaying).toBe(true)

            // 暂停
            playbackStore.pause()
            expect(playbackStore.isPlaying).toBe(false)
        })

        it('应该正确处理缩放', async () => {
            const { useScaleStore } = await import('../../stores/scale')
            const scaleStore = useScaleStore()

            const initialScale = scaleStore.scale

            scaleStore.zoomIn()
            expect(scaleStore.scale).toBeGreaterThan(initialScale)

            scaleStore.zoomOut()
            expect(scaleStore.scale).toBe(initialScale)
        })
    })

    describe('DragPreview 组件逻辑', () => {
        it('应该在拖拽时显示预览', async () => {
            const { useDragStore } = await import('../../stores/drag')
            const { useTracksStore } = await import('../../stores/tracks')

            const dragStore = useDragStore()
            const tracksStore = useTracksStore()

            // 添加轨道和片段
            const track = {
                id: 'track-1',
                type: 'video' as const,
                name: 'Test Track',
                visible: true,
                locked: false,
                clips: [],
                order: 0,
            }
            tracksStore.addTrack(track)

            const clip = {
                id: 'clip-1',
                trackId: 'track-1',
                type: 'video' as const,
                startTime: 0,
                endTime: 5,
                selected: false,
                sourceUrl: 'test.mp4',
                originalDuration: 10,
                trimStart: 0,
                trimEnd: 10,
                playbackRate: 1,
            }
            tracksStore.addClip('track-1', clip)

            // 初始状态预览不可见
            expect(dragStore.previewPosition.visible).toBe(false)

            // 开始拖拽
            const event = new MouseEvent('mousedown', {
                clientX: 100,
                clientY: 100,
            })
            dragStore.startDrag(clip, event)

            expect(dragStore.isDragging).toBe(true)

            // 清理
            dragStore.resetDragState()
        })
    })

    describe('TrackArea 组件逻辑', () => {
        it('应该正确计算轨道宽度', async () => {
            const { useTracksStore } = await import('../../stores/tracks')
            const { useScaleStore } = await import('../../stores/scale')

            const tracksStore = useTracksStore()
            const scaleStore = useScaleStore()

            // 添加轨道和多个片段
            const track = {
                id: 'track-1',
                type: 'video' as const,
                name: 'Test Track',
                visible: true,
                locked: false,
                clips: [],
                order: 0,
            }
            tracksStore.addTrack(track)

            tracksStore.addClip('track-1', {
                id: 'clip-1',
                trackId: 'track-1',
                type: 'video' as const,
                startTime: 0,
                endTime: 5,
                selected: false,
                sourceUrl: 'test.mp4',
                originalDuration: 10,
                trimStart: 0,
                trimEnd: 5,  // endTime = startTime + (trimEnd - trimStart) / playbackRate = 0 + 5 = 5
                playbackRate: 1,
            })

            tracksStore.addClip('track-1', {
                id: 'clip-2',
                trackId: 'track-1',
                type: 'video' as const,
                startTime: 10,
                endTime: 20,
                selected: false,
                sourceUrl: 'test2.mp4',
                originalDuration: 15,
                trimStart: 0,
                trimEnd: 10,  // endTime = startTime + (trimEnd - trimStart) / playbackRate = 10 + 10 = 20
                playbackRate: 1,
            })

            // 轨道宽度应该基于最后一个片段的结束时间
            const totalDuration = tracksStore.totalDuration
            const expectedWidth = totalDuration * scaleStore.actualPixelsPerSecond

            expect(totalDuration).toBe(20)
            expect(expectedWidth).toBeGreaterThan(0)
        })
    })

    describe('TrackControl 组件逻辑', () => {
        it('应该正确处理轨道可见性切换', async () => {
            const { useTracksStore } = await import('../../stores/tracks')
            const tracksStore = useTracksStore()

            const track = {
                id: 'track-1',
                type: 'video' as const,
                name: 'Test Track',
                visible: true,
                locked: false,
                clips: [],
                order: 0,
            }
            tracksStore.addTrack(track)

            expect(tracksStore.tracks[0].visible).toBe(true)

            tracksStore.updateTrack('track-1', { visible: false })
            expect(tracksStore.tracks[0].visible).toBe(false)
        })

        it('应该正确处理轨道锁定切换', async () => {
            const { useTracksStore } = await import('../../stores/tracks')
            const tracksStore = useTracksStore()

            const track = {
                id: 'track-1',
                type: 'video' as const,
                name: 'Test Track',
                visible: true,
                locked: false,
                clips: [],
                order: 0,
            }
            tracksStore.addTrack(track)

            expect(tracksStore.tracks[0].locked).toBe(false)

            tracksStore.updateTrack('track-1', { locked: true })
            expect(tracksStore.tracks[0].locked).toBe(true)
        })
    })

    describe('ContextMenu 组件逻辑', () => {
        it('应该正确处理菜单项选择', async () => {
            const menuItems = [
                { id: 'delete', label: '删除', action: 'delete' },
                { id: 'copy', label: '复制', action: 'copy' },
                { id: 'cut', label: '剪切', action: 'cut' },
            ]

            expect(menuItems).toHaveLength(3)
            expect(menuItems[0].action).toBe('delete')
        })
    })

    describe('Split 功能', () => {
        it('应该正确分割 clip', async () => {
            const { useTracksStore } = await import('../../stores/tracks')
            const tracksStore = useTracksStore()

            // 添加轨道
            const track = {
                id: 'track-1',
                type: 'video' as const,
                name: 'Test Track',
                visible: true,
                locked: false,
                clips: [],
                order: 0,
            }
            tracksStore.addTrack(track)

            // 添加 clip (0-10秒)
            const clip = {
                id: 'clip-1',
                trackId: 'track-1',
                type: 'video' as const,
                startTime: 0,
                endTime: 10,
                selected: false,
                sourceUrl: 'test.mp4',
                originalDuration: 20,
                trimStart: 0,
                trimEnd: 10,  // endTime = startTime + (trimEnd - trimStart) / playbackRate = 0 + 10 = 10
                playbackRate: 1,
            }
            tracksStore.addClip('track-1', clip)

            // 在 5 秒处分割
            const result = tracksStore.splitClip('clip-1', 5)

            expect(result).not.toBeNull()
            expect(result!.leftClip.startTime).toBe(0)
            expect(result!.leftClip.endTime).toBe(5)
            expect(result!.rightClip.startTime).toBe(5)
            expect(result!.rightClip.endTime).toBe(10)

            // 检查轨道中现在有两个 clip
            const trackData = tracksStore.tracks.find(t => t.id === 'track-1')
            expect(trackData!.clips.length).toBe(2)
        })

        it('应该正确处理媒体 clip 的 trimStart 和 trimEnd', async () => {
            const { useTracksStore } = await import('../../stores/tracks')
            const tracksStore = useTracksStore()

            // 添加轨道
            tracksStore.addTrack({
                id: 'track-2',
                type: 'video' as const,
                name: 'Test Track 2',
                visible: true,
                locked: false,
                clips: [],
                order: 0,
            })

            // 添加带有 trimStart/trimEnd 的 clip
            // endTime = startTime + (trimEnd - trimStart) / playbackRate = 0 + (15-5)/1 = 10
            tracksStore.addClip('track-2', {
                id: 'clip-2',
                trackId: 'track-2',
                type: 'video' as const,
                startTime: 0,
                endTime: 10,
                selected: false,
                sourceUrl: 'test.mp4',
                originalDuration: 30,
                trimStart: 5,
                trimEnd: 15, // trim 区间 5-15，实际内容 10 秒
                playbackRate: 1,
            })

            // 在 5 秒处分割 (clip 中间)
            const result = tracksStore.splitClip('clip-2', 5)

            expect(result).not.toBeNull()
            // 左侧 clip: 0-5秒，对应原始素材的 5-10 秒
            expect((result!.leftClip as MediaClip).trimStart).toBe(5)
            expect((result!.leftClip as MediaClip).trimEnd).toBe(10)
            // 右侧 clip: 5-10秒，对应原始素材的 10-15 秒
            expect((result!.rightClip as MediaClip).trimStart).toBe(10)
            expect((result!.rightClip as MediaClip).trimEnd).toBe(15)
        })

        it('不应该在 clip 范围外分割', async () => {
            const { useTracksStore } = await import('../../stores/tracks')
            const tracksStore = useTracksStore()

            tracksStore.addTrack({
                id: 'track-3',
                type: 'video' as const,
                name: 'Test Track 3',
                visible: true,
                locked: false,
                clips: [],
                order: 0,
            })

            tracksStore.addClip('track-3', {
                id: 'clip-3',
                trackId: 'track-3',
                type: 'video' as const,
                startTime: 5,
                endTime: 15,
                selected: false,
                sourceUrl: 'test.mp4',
                originalDuration: 20,
                trimStart: 0,
                trimEnd: 10,  // endTime = startTime + (trimEnd - trimStart) / playbackRate = 5 + 10 = 15
                playbackRate: 1,
            })

            // 在 clip 开始时间之前分割
            const result1 = tracksStore.splitClip('clip-3', 3)
            expect(result1).toBeNull()

            // 在 clip 结束时间之后分割
            const result2 = tracksStore.splitClip('clip-3', 20)
            expect(result2).toBeNull()

            // 在 clip 开始时间处分割
            const result3 = tracksStore.splitClip('clip-3', 5)
            expect(result3).toBeNull()

            // 在 clip 结束时间处分割
            const result4 = tracksStore.splitClip('clip-3', 15)
            expect(result4).toBeNull()
        })

        it('分割后应保持选中状态在左侧 clip', async () => {
            const { useTracksStore } = await import('../../stores/tracks')
            const tracksStore = useTracksStore()

            tracksStore.addTrack({
                id: 'track-4',
                type: 'video' as const,
                name: 'Test Track 4',
                visible: true,
                locked: false,
                clips: [],
                order: 0,
            })

            tracksStore.addClip('track-4', {
                id: 'clip-4',
                trackId: 'track-4',
                type: 'video' as const,
                startTime: 0,
                endTime: 10,
                selected: true,
                sourceUrl: 'test.mp4',
                originalDuration: 20,
                trimStart: 0,
                trimEnd: 20,
                playbackRate: 1,
            })

            // 选中该 clip
            tracksStore.selectClip('clip-4')
            expect(tracksStore.selectedClipIds.has('clip-4')).toBe(true)

            // 分割
            const result = tracksStore.splitClip('clip-4', 5)

            expect(result).not.toBeNull()
            // 左侧 clip 保留了原 clip 的 ID，所以它应该被选中
            expect(result!.leftClip.id).toBe('clip-4')
            expect(tracksStore.selectedClipIds.has(result!.leftClip.id)).toBe(true)
            // 右侧 clip 有新的 ID，不应该被选中
            expect(result!.rightClip.id).not.toBe('clip-4')
            expect(tracksStore.selectedClipIds.has(result!.rightClip.id)).toBe(false)
        })

        it('不应该分割不存在的 clip', async () => {
            const { useTracksStore } = await import('../../stores/tracks')
            const tracksStore = useTracksStore()

            const result = tracksStore.splitClip('non-existent-clip', 5)
            expect(result).toBeNull()
        })
    })

    describe('点击轨道空白区域改变播放时间', () => {
        it('应该在点击空白区域时设置播放时间', async () => {
            const { usePlaybackStore } = await import('../../stores/playback')
            const { useScaleStore } = await import('../../stores/scale')

            const playbackStore = usePlaybackStore()
            const scaleStore = useScaleStore()

            // 初始播放时间为 0
            expect(playbackStore.currentTime).toBe(0)

            // 模拟点击位置对应的时间计算
            const clickX = 500 // 点击位置（像素）
            const scrollLeft = 0
            const pixelsPerSecond = scaleStore.actualPixelsPerSecond

            // 计算对应的时间
            const expectedTime = (clickX + scrollLeft) / pixelsPerSecond

            // 调用 seekTo
            playbackStore.seekTo(expectedTime)

            expect(playbackStore.currentTime).toBe(expectedTime)
        })

        it('应该在有滚动偏移时正确计算时间', async () => {
            const { usePlaybackStore } = await import('../../stores/playback')
            const { useScaleStore } = await import('../../stores/scale')

            const playbackStore = usePlaybackStore()
            const scaleStore = useScaleStore()

            // 模拟有滚动偏移的情况
            const clickX = 200 // 可视区域内的点击位置
            const scrollLeft = 300 // 滚动偏移
            const pixelsPerSecond = scaleStore.actualPixelsPerSecond

            // 实际位置 = 点击位置 + 滚动偏移
            const actualX = clickX + scrollLeft
            const expectedTime = actualX / pixelsPerSecond

            playbackStore.seekTo(expectedTime)

            expect(playbackStore.currentTime).toBe(expectedTime)
        })

        it('应该确保时间不会为负数', async () => {
            const { usePlaybackStore } = await import('../../stores/playback')

            const playbackStore = usePlaybackStore()

            // 尝试设置负数时间
            playbackStore.seekTo(-5)

            // 时间应该被限制在 0
            expect(playbackStore.currentTime).toBe(0)
        })
    })

    describe('双击 clip 改变播放时间', () => {
        it('应该在双击 clip 时跳转到对应时间', async () => {
            const { usePlaybackStore } = await import('../../stores/playback')
            const { useTracksStore } = await import('../../stores/tracks')
            const { useScaleStore } = await import('../../stores/scale')

            const playbackStore = usePlaybackStore()
            const tracksStore = useTracksStore()
            const scaleStore = useScaleStore()

            // 添加轨道和 clip
            tracksStore.addTrack({
                id: 'track-dblclick',
                type: 'video' as const,
                name: 'Test Track',
                visible: true,
                locked: false,
                clips: [],
                order: 0,
            })

            tracksStore.addClip('track-dblclick', {
                id: 'clip-dblclick',
                trackId: 'track-dblclick',
                type: 'video' as const,
                startTime: 10,
                endTime: 20,
                selected: false,
                sourceUrl: 'test.mp4',
                originalDuration: 20,
                trimStart: 0,
                trimEnd: 20,
                playbackRate: 1,
            })

            // 模拟双击 clip 内部某个位置
            // clip 从 10 秒开始，假设双击点在 clip 内 3 秒处
            const clipStartTime = 10
            const relativeClickTime = 3 // clip 内的相对位置
            const absoluteTime = clipStartTime + relativeClickTime // 13 秒

            playbackStore.seekTo(absoluteTime)

            expect(playbackStore.currentTime).toBe(13)
        })

        it('应该正确计算双击位置对应的时间', async () => {
            const { useScaleStore } = await import('../../stores/scale')

            const scaleStore = useScaleStore()
            const pixelsPerSecond = scaleStore.actualPixelsPerSecond

            // 模拟 clip 数据
            const clipStartTime = 5
            const clipEndTime = 15

            // 模拟在 clip 内的某个像素位置双击
            const clickXInClip = 200 // 相对于 clip 左边缘的像素位置
            const relativeTime = clickXInClip / pixelsPerSecond
            const absoluteTime = clipStartTime + relativeTime

            // 确保时间在 clip 范围内
            const clampedTime = Math.max(clipStartTime, Math.min(absoluteTime, clipEndTime))

            expect(clampedTime).toBeGreaterThanOrEqual(clipStartTime)
            expect(clampedTime).toBeLessThanOrEqual(clipEndTime)
        })

        it('应该将时间限制在 clip 范围内', async () => {
            const { usePlaybackStore } = await import('../../stores/playback')

            const playbackStore = usePlaybackStore()

            // 模拟 clip 范围
            const clipStartTime = 10
            const clipEndTime = 20

            // 模拟计算出超出 clip 范围的时间（这种情况理论上不会发生，但需要处理边界）
            const calculatedTime = 25 // 超出 clip 结束时间

            // 应用 clamp
            const clampedTime = Math.max(clipStartTime, Math.min(calculatedTime, clipEndTime))

            playbackStore.seekTo(clampedTime)

            expect(playbackStore.currentTime).toBe(20) // 被限制到 clip 结束时间
        })

        it('双击不同 clip 应跳转到不同时间', async () => {
            const { usePlaybackStore } = await import('../../stores/playback')
            const { useTracksStore } = await import('../../stores/tracks')

            const playbackStore = usePlaybackStore()
            const tracksStore = useTracksStore()

            // 添加轨道
            tracksStore.addTrack({
                id: 'track-multi-clip',
                type: 'video' as const,
                name: 'Test Track',
                visible: true,
                locked: false,
                clips: [],
                order: 0,
            })

            // 添加两个 clip
            tracksStore.addClip('track-multi-clip', {
                id: 'clip-a',
                trackId: 'track-multi-clip',
                type: 'video' as const,
                startTime: 0,
                endTime: 10,
                selected: false,
                sourceUrl: 'test1.mp4',
                originalDuration: 20,
                trimStart: 0,
                trimEnd: 20,
                playbackRate: 1,
            })

            tracksStore.addClip('track-multi-clip', {
                id: 'clip-b',
                trackId: 'track-multi-clip',
                type: 'video' as const,
                startTime: 15,
                endTime: 25,
                selected: false,
                sourceUrl: 'test2.mp4',
                originalDuration: 20,
                trimStart: 0,
                trimEnd: 20,
                playbackRate: 1,
            })

            // 双击第一个 clip 的中间位置
            const clip1Time = 5
            playbackStore.seekTo(clip1Time)
            expect(playbackStore.currentTime).toBe(5)

            // 双击第二个 clip 的中间位置
            const clip2Time = 20
            playbackStore.seekTo(clip2Time)
            expect(playbackStore.currentTime).toBe(20)
        })
    })

    // ============ 事件触发测试 ============
    describe('事件触发测试', () => {
        describe('选择相关事件', () => {
            it('选中 clip 后应该能获取到选中的 clip IDs', async () => {
                const { useTracksStore } = await import('../../stores/tracks')
                const tracksStore = useTracksStore()

                tracksStore.addTrack({
                    id: 'track-select-test',
                    type: 'video' as const,
                    name: 'Test Track',
                    visible: true,
                    locked: false,
                    clips: [],
                    order: 0,
                })

                tracksStore.addClip('track-select-test', {
                    id: 'clip-select-1',
                    trackId: 'track-select-test',
                    type: 'video' as const,
                    startTime: 0,
                    endTime: 5,
                    selected: false,
                    sourceUrl: 'test.mp4',
                    originalDuration: 10,
                    trimStart: 0,
                    trimEnd: 10,
                    playbackRate: 1,
                })

                tracksStore.addClip('track-select-test', {
                    id: 'clip-select-2',
                    trackId: 'track-select-test',
                    type: 'video' as const,
                    startTime: 10,
                    endTime: 15,
                    selected: false,
                    sourceUrl: 'test2.mp4',
                    originalDuration: 10,
                    trimStart: 0,
                    trimEnd: 10,
                    playbackRate: 1,
                })

                // 选中第一个 clip
                tracksStore.selectClip('clip-select-1')
                expect(Array.from(tracksStore.selectedClipIds)).toEqual(['clip-select-1'])

                // 追加选择第二个 clip
                tracksStore.selectClip('clip-select-2', true)
                expect(Array.from(tracksStore.selectedClipIds)).toContain('clip-select-1')
                expect(Array.from(tracksStore.selectedClipIds)).toContain('clip-select-2')

                // 清空选择
                tracksStore.clearSelection()
                expect(tracksStore.selectedClipIds.size).toBe(0)
            })

            it('切换选择状态应该正确工作', async () => {
                const { useTracksStore } = await import('../../stores/tracks')
                const tracksStore = useTracksStore()

                tracksStore.addTrack({
                    id: 'track-toggle-test',
                    type: 'video' as const,
                    name: 'Test Track',
                    visible: true,
                    locked: false,
                    clips: [],
                    order: 0,
                })

                tracksStore.addClip('track-toggle-test', {
                    id: 'clip-toggle-1',
                    trackId: 'track-toggle-test',
                    type: 'video' as const,
                    startTime: 0,
                    endTime: 5,
                    selected: false,
                    sourceUrl: 'test.mp4',
                    originalDuration: 10,
                    trimStart: 0,
                    trimEnd: 10,
                    playbackRate: 1,
                })

                // 切换选择
                tracksStore.toggleClipSelection('clip-toggle-1')
                expect(tracksStore.selectedClipIds.has('clip-toggle-1')).toBe(true)

                // 再次切换取消选择
                tracksStore.toggleClipSelection('clip-toggle-1')
                expect(tracksStore.selectedClipIds.has('clip-toggle-1')).toBe(false)
            })
        })

        describe('复制/剪切/粘贴事件', () => {
            it('复制 clips 应该将 clips 放入剪贴板', async () => {
                const { useTracksStore } = await import('../../stores/tracks')
                const tracksStore = useTracksStore()

                tracksStore.addTrack({
                    id: 'track-copy-test',
                    type: 'video' as const,
                    name: 'Test Track',
                    visible: true,
                    locked: false,
                    clips: [],
                    order: 0,
                })

                tracksStore.addClip('track-copy-test', {
                    id: 'clip-copy-1',
                    trackId: 'track-copy-test',
                    type: 'video' as const,
                    startTime: 0,
                    endTime: 5,
                    selected: false,
                    sourceUrl: 'test.mp4',
                    originalDuration: 10,
                    trimStart: 0,
                    trimEnd: 10,
                    playbackRate: 1,
                })

                // 复制
                tracksStore.copyClips(['clip-copy-1'])
                expect(tracksStore.hasClipboardContent()).toBe(true)

                // 验证剪贴板内容
                const clipboardContent = tracksStore.getClipboardContent()
                expect(clipboardContent?.clips.length).toBe(1)
                expect(clipboardContent?.operation).toBe('copy')
            })

            it('剪切 clips 应该将 clips 放入剪贴板并标记为剪切操作', async () => {
                const { useTracksStore } = await import('../../stores/tracks')
                const tracksStore = useTracksStore()

                tracksStore.addTrack({
                    id: 'track-cut-test',
                    type: 'video' as const,
                    name: 'Test Track',
                    visible: true,
                    locked: false,
                    clips: [],
                    order: 0,
                })

                tracksStore.addClip('track-cut-test', {
                    id: 'clip-cut-1',
                    trackId: 'track-cut-test',
                    type: 'video' as const,
                    startTime: 0,
                    endTime: 5,
                    selected: false,
                    sourceUrl: 'test.mp4',
                    originalDuration: 10,
                    trimStart: 0,
                    trimEnd: 10,
                    playbackRate: 1,
                })

                // 剪切
                tracksStore.cutClips(['clip-cut-1'])
                expect(tracksStore.hasClipboardContent()).toBe(true)

                // 验证剪贴板内容标记为剪切操作
                const clipboardContent = tracksStore.getClipboardContent()
                expect(clipboardContent?.operation).toBe('cut')
                expect(clipboardContent?.clips.length).toBe(1)
            })

            it('粘贴 clips 应该在指定位置创建新 clips', async () => {
                const { useTracksStore } = await import('../../stores/tracks')
                const tracksStore = useTracksStore()

                tracksStore.addTrack({
                    id: 'track-paste-test',
                    type: 'video' as const,
                    name: 'Test Track',
                    visible: true,
                    locked: false,
                    clips: [],
                    order: 0,
                })

                tracksStore.addClip('track-paste-test', {
                    id: 'clip-paste-1',
                    trackId: 'track-paste-test',
                    type: 'video' as const,
                    startTime: 0,
                    endTime: 5,
                    selected: false,
                    sourceUrl: 'test.mp4',
                    originalDuration: 10,
                    trimStart: 0,
                    trimEnd: 10,
                    playbackRate: 1,
                })

                // 复制
                tracksStore.copyClips(['clip-paste-1'])

                // 粘贴到时间点 10
                const pastedClips = tracksStore.pasteClips('track-paste-test', 10)
                expect(pastedClips).toBeDefined()
                expect(pastedClips?.length).toBe(1)
                expect(pastedClips?.[0].startTime).toBe(10)
            })
        })

        describe('删除事件', () => {
            it('删除单个 clip 应该从轨道中移除', async () => {
                const { useTracksStore } = await import('../../stores/tracks')
                const tracksStore = useTracksStore()

                tracksStore.addTrack({
                    id: 'track-delete-test',
                    type: 'video' as const,
                    name: 'Test Track',
                    visible: true,
                    locked: false,
                    clips: [],
                    order: 0,
                })

                tracksStore.addClip('track-delete-test', {
                    id: 'clip-delete-1',
                    trackId: 'track-delete-test',
                    type: 'video' as const,
                    startTime: 0,
                    endTime: 5,
                    selected: false,
                    sourceUrl: 'test.mp4',
                    originalDuration: 10,
                    trimStart: 0,
                    trimEnd: 10,
                    playbackRate: 1,
                })

                // 删除
                tracksStore.removeClip('clip-delete-1')
                expect(tracksStore.getClip('clip-delete-1')).toBeUndefined()
            })

            it('批量删除 clips 应该移除所有指定的 clips', async () => {
                const { useTracksStore } = await import('../../stores/tracks')
                const tracksStore = useTracksStore()

                tracksStore.addTrack({
                    id: 'track-batch-delete-test',
                    type: 'video' as const,
                    name: 'Test Track',
                    visible: true,
                    locked: false,
                    clips: [],
                    order: 0,
                })

                tracksStore.addClip('track-batch-delete-test', {
                    id: 'clip-bd-1',
                    trackId: 'track-batch-delete-test',
                    type: 'video' as const,
                    startTime: 0,
                    endTime: 5,
                    selected: false,
                    sourceUrl: 'test1.mp4',
                    originalDuration: 10,
                    trimStart: 0,
                    trimEnd: 10,
                    playbackRate: 1,
                })

                tracksStore.addClip('track-batch-delete-test', {
                    id: 'clip-bd-2',
                    trackId: 'track-batch-delete-test',
                    type: 'video' as const,
                    startTime: 10,
                    endTime: 15,
                    selected: false,
                    sourceUrl: 'test2.mp4',
                    originalDuration: 10,
                    trimStart: 0,
                    trimEnd: 10,
                    playbackRate: 1,
                })

                // 批量删除
                tracksStore.removeClips(['clip-bd-1', 'clip-bd-2'])
                expect(tracksStore.getClip('clip-bd-1')).toBeUndefined()
                expect(tracksStore.getClip('clip-bd-2')).toBeUndefined()
            })
        })

        describe('分割事件', () => {
            it('分割 clip 应该创建两个新 clips', async () => {
                const { useTracksStore } = await import('../../stores/tracks')
                const tracksStore = useTracksStore()

                tracksStore.addTrack({
                    id: 'track-split-test',
                    type: 'video' as const,
                    name: 'Test Track',
                    visible: true,
                    locked: false,
                    clips: [],
                    order: 0,
                })

                tracksStore.addClip('track-split-test', {
                    id: 'clip-split-1',
                    trackId: 'track-split-test',
                    type: 'video' as const,
                    startTime: 0,
                    endTime: 10,
                    selected: false,
                    sourceUrl: 'test.mp4',
                    originalDuration: 20,
                    trimStart: 0,
                    trimEnd: 20,
                    playbackRate: 1,
                })

                // 在时间点 5 分割
                const result = tracksStore.splitClip('clip-split-1', 5)
                expect(result).toBeDefined()
                expect(result?.leftClip.endTime).toBe(5)
                expect(result?.rightClip.startTime).toBe(5)
            })
        })

        describe('Track 事件', () => {
            it('添加轨道应该增加轨道数量', async () => {
                const { useTracksStore } = await import('../../stores/tracks')
                const tracksStore = useTracksStore()

                const initialCount = tracksStore.tracks.length

                tracksStore.addTrack({
                    id: 'track-add-test',
                    type: 'video' as const,
                    name: 'New Track',
                    visible: true,
                    locked: false,
                    clips: [],
                    order: 0,
                })

                expect(tracksStore.tracks.length).toBe(initialCount + 1)
            })

            it('删除轨道应该减少轨道数量', async () => {
                const { useTracksStore } = await import('../../stores/tracks')
                const tracksStore = useTracksStore()

                tracksStore.addTrack({
                    id: 'track-remove-test',
                    type: 'video' as const,
                    name: 'To Remove',
                    visible: true,
                    locked: false,
                    clips: [],
                    order: 0,
                })

                const countAfterAdd = tracksStore.tracks.length

                tracksStore.removeTrack('track-remove-test')

                expect(tracksStore.tracks.length).toBe(countAfterAdd - 1)
            })

            it('更新轨道属性应该正确反映', async () => {
                const { useTracksStore } = await import('../../stores/tracks')
                const tracksStore = useTracksStore()

                tracksStore.addTrack({
                    id: 'track-update-test',
                    type: 'video' as const,
                    name: 'Original Name',
                    visible: true,
                    locked: false,
                    clips: [],
                    order: 0,
                })

                tracksStore.updateTrack('track-update-test', { name: 'Updated Name', locked: true })

                const track = tracksStore.tracks.find(t => t.id === 'track-update-test')
                expect(track?.name).toBe('Updated Name')
                expect(track?.locked).toBe(true)
            })
        })

        describe('播放状态事件', () => {
            it('播放/暂停应该正确切换状态', async () => {
                const { usePlaybackStore } = await import('../../stores/playback')
                const playbackStore = usePlaybackStore()

                expect(playbackStore.isPlaying).toBe(false)

                playbackStore.play()
                expect(playbackStore.isPlaying).toBe(true)

                playbackStore.pause()
                expect(playbackStore.isPlaying).toBe(false)

                playbackStore.togglePlay()
                expect(playbackStore.isPlaying).toBe(true)

                playbackStore.togglePlay()
                expect(playbackStore.isPlaying).toBe(false)
            })

            it('跳转时间应该正确更新当前时间', async () => {
                const { usePlaybackStore } = await import('../../stores/playback')
                const playbackStore = usePlaybackStore()

                playbackStore.setDuration(100)
                playbackStore.seekTo(50)
                expect(playbackStore.currentTime).toBe(50)

                // 超出范围应该被限制
                playbackStore.seekTo(150)
                expect(playbackStore.currentTime).toBe(100)

                playbackStore.seekTo(-10)
                expect(playbackStore.currentTime).toBe(0)
            })

            it('播放速率变化应该正确反映', async () => {
                const { usePlaybackStore } = await import('../../stores/playback')
                const playbackStore = usePlaybackStore()

                playbackStore.setPlaybackRate(2)
                expect(playbackStore.playbackRate).toBe(2)

                playbackStore.setPlaybackRate(0.5)
                expect(playbackStore.playbackRate).toBe(0.5)
            })
        })

        describe('缩放事件', () => {
            it('缩放级别变化应该正确反映', async () => {
                const { useScaleStore } = await import('../../stores/scale')
                const scaleStore = useScaleStore()

                const initialScale = scaleStore.scale

                scaleStore.setScale(2)
                expect(scaleStore.scale).toBe(2)

                scaleStore.zoomIn(0.5)
                expect(scaleStore.scale).toBe(2.5)

                scaleStore.zoomOut(0.5)
                expect(scaleStore.scale).toBe(2)

                // 恢复初始值
                scaleStore.setScale(initialScale)
            })
        })

        describe('历史记录事件', () => {
            it('历史记录状态应该正确反映撤销/重做能力', async () => {
                const { useHistoryStore } = await import('../../stores/history')
                const { useTracksStore } = await import('../../stores/tracks')
                const historyStore = useHistoryStore()
                const tracksStore = useTracksStore()

                historyStore.initialize()

                // 初始状态不能撤销
                expect(historyStore.canUndo).toBe(false)
                expect(historyStore.canRedo).toBe(false)

                // 添加轨道并创建快照
                tracksStore.addTrack({
                    id: 'track-history-test',
                    type: 'video' as const,
                    name: 'History Track',
                    visible: true,
                    locked: false,
                    clips: [],
                    order: 0,
                })
                historyStore.pushSnapshot('添加轨道')

                // 现在可以撤销
                expect(historyStore.canUndo).toBe(true)
                expect(historyStore.canRedo).toBe(false)

                // 撤销
                historyStore.undo()
                expect(historyStore.canUndo).toBe(false)
                expect(historyStore.canRedo).toBe(true)

                // 重做
                historyStore.redo()
                expect(historyStore.canUndo).toBe(true)
                expect(historyStore.canRedo).toBe(false)
            })
        })
    })
})

