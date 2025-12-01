import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
    rafThrottle,
    LazyImageLoader,
    BatchDOMUpdater,
    LRUCache,
} from '../../utils/performance'

describe('performance utils', () => {
    beforeEach(() => {
        vi.useFakeTimers()
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    describe('rafThrottle', () => {
        it('应该在 requestAnimationFrame 中执行函数', () => {
            const fn = vi.fn()
            const throttled = rafThrottle(fn)

            throttled('arg1')

            expect(fn).not.toHaveBeenCalled()

            // 模拟 requestAnimationFrame 回调
            vi.advanceTimersByTime(16)

            expect(fn).toHaveBeenCalledWith('arg1')
        })

        it('应该节流多次调用', () => {
            const fn = vi.fn()
            const throttled = rafThrottle(fn)

            throttled('call1')
            throttled('call2')
            throttled('call3')

            vi.advanceTimersByTime(16)

            // 只应该执行第一次调用
            expect(fn).toHaveBeenCalledTimes(1)
            expect(fn).toHaveBeenCalledWith('call1')
        })

        it('节流完成后应该可以再次调用', () => {
            const fn = vi.fn()
            const throttled = rafThrottle(fn)

            throttled('first')
            vi.advanceTimersByTime(16)

            throttled('second')
            vi.advanceTimersByTime(16)

            expect(fn).toHaveBeenCalledTimes(2)
            expect(fn).toHaveBeenNthCalledWith(1, 'first')
            expect(fn).toHaveBeenNthCalledWith(2, 'second')
        })
    })

    describe('LazyImageLoader', () => {
        let mockObserve: ReturnType<typeof vi.fn>
        let mockUnobserve: ReturnType<typeof vi.fn>
        let mockDisconnect: ReturnType<typeof vi.fn>
        let observerCallback: IntersectionObserverCallback

        beforeEach(() => {
            mockObserve = vi.fn()
            mockUnobserve = vi.fn()
            mockDisconnect = vi.fn()

                // Mock IntersectionObserver
                ; (globalThis as any).IntersectionObserver = vi.fn((callback) => {
                    observerCallback = callback
                    return {
                        observe: mockObserve,
                        unobserve: mockUnobserve,
                        disconnect: mockDisconnect,
                        root: null,
                        rootMargin: '',
                        thresholds: [],
                        takeRecords: () => [],
                    }
                }) as any
        })

        afterEach(() => {
            // @ts-ignore
            delete (globalThis as any).IntersectionObserver
        })

        it('应该创建 IntersectionObserver', () => {
            const loader = new LazyImageLoader()
            expect((globalThis as any).IntersectionObserver).toHaveBeenCalled()
            loader.destroy()
        })

        it('observe 应该添加元素到观察列表', () => {
            const loader = new LazyImageLoader()
            const element = document.createElement('img')

            loader.observe(element, 'test.jpg')

            expect(mockObserve).toHaveBeenCalledWith(element)
            loader.destroy()
        })

        it('unobserve 应该从观察列表移除元素', () => {
            const loader = new LazyImageLoader()
            const element = document.createElement('img')

            loader.observe(element, 'test.jpg')
            loader.unobserve(element)

            expect(mockUnobserve).toHaveBeenCalledWith(element)
            loader.destroy()
        })

        it('元素进入视口时应该加载图片', () => {
            const loader = new LazyImageLoader()
            const imgElement = document.createElement('img')

            loader.observe(imgElement, 'test.jpg')

            // 模拟元素进入视口
            observerCallback(
                [
                    {
                        isIntersecting: true,
                        target: imgElement,
                    } as unknown as IntersectionObserverEntry,
                ],
                {} as IntersectionObserver
            )

            expect(imgElement.src).toContain('test.jpg')
            loader.destroy()
        })

        it('非图片元素应该设置背景图', () => {
            const loader = new LazyImageLoader()
            const divElement = document.createElement('div')

            loader.observe(divElement, 'test.jpg')

            // 模拟元素进入视口
            observerCallback(
                [
                    {
                        isIntersecting: true,
                        target: divElement,
                    } as unknown as IntersectionObserverEntry,
                ],
                {} as IntersectionObserver
            )

            expect(divElement.style.backgroundImage).toContain('test.jpg')
            loader.destroy()
        })

        it('destroy 应该断开观察器', () => {
            const loader = new LazyImageLoader()
            loader.destroy()

            expect(mockDisconnect).toHaveBeenCalled()
        })
    })

    describe('BatchDOMUpdater', () => {
        it('应该批量执行更新', () => {
            const updater = new BatchDOMUpdater()
            const update1 = vi.fn()
            const update2 = vi.fn()

            updater.add(update1)
            updater.add(update2)

            expect(update1).not.toHaveBeenCalled()
            expect(update2).not.toHaveBeenCalled()

            vi.advanceTimersByTime(16)

            expect(update1).toHaveBeenCalled()
            expect(update2).toHaveBeenCalled()

            updater.destroy()
        })

        it('多次调用 add 应该只触发一次 flush', () => {
            const updater = new BatchDOMUpdater()
            const updates: number[] = []

            updater.add(() => updates.push(1))
            updater.add(() => updates.push(2))
            updater.add(() => updates.push(3))

            vi.advanceTimersByTime(16)

            expect(updates).toEqual([1, 2, 3])

            updater.destroy()
        })

        it('destroy 应该清除待处理的更新', () => {
            const updater = new BatchDOMUpdater()
            const update = vi.fn()

            updater.add(update)
            updater.destroy()

            vi.advanceTimersByTime(16)

            expect(update).not.toHaveBeenCalled()
        })
    })

    describe('LRUCache', () => {
        it('应该能存储和获取值', () => {
            const cache = new LRUCache<string, number>(3)

            cache.set('a', 1)
            cache.set('b', 2)

            expect(cache.get('a')).toBe(1)
            expect(cache.get('b')).toBe(2)
        })

        it('获取不存在的键应该返回 undefined', () => {
            const cache = new LRUCache<string, number>(3)

            expect(cache.get('nonexistent')).toBeUndefined()
        })

        it('应该限制缓存大小', () => {
            const cache = new LRUCache<string, number>(3)

            cache.set('a', 1)
            cache.set('b', 2)
            cache.set('c', 3)
            cache.set('d', 4) // 这应该移除 'a'

            expect(cache.get('a')).toBeUndefined()
            expect(cache.get('b')).toBe(2)
            expect(cache.get('c')).toBe(3)
            expect(cache.get('d')).toBe(4)
        })

        it('获取值应该更新其最近使用时间', () => {
            const cache = new LRUCache<string, number>(3)

            cache.set('a', 1)
            cache.set('b', 2)
            cache.set('c', 3)

            // 访问 'a'，使其成为最近使用
            cache.get('a')

            // 添加新值，应该移除 'b'（最久未使用）
            cache.set('d', 4)

            expect(cache.get('a')).toBe(1) // 'a' 还在
            expect(cache.get('b')).toBeUndefined() // 'b' 被移除
        })

        it('has 应该检查键是否存在', () => {
            const cache = new LRUCache<string, number>(3)

            cache.set('a', 1)

            expect(cache.has('a')).toBe(true)
            expect(cache.has('b')).toBe(false)
        })

        it('clear 应该清空缓存', () => {
            const cache = new LRUCache<string, number>(3)

            cache.set('a', 1)
            cache.set('b', 2)
            cache.clear()

            expect(cache.has('a')).toBe(false)
            expect(cache.has('b')).toBe(false)
        })

        it('更新已存在的键应该更新值', () => {
            const cache = new LRUCache<string, number>(3)

            cache.set('a', 1)
            cache.set('a', 10)

            expect(cache.get('a')).toBe(10)
        })
    })
})
