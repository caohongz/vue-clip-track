import { describe, it, expect } from 'vitest'

describe('useVirtualScroll', () => {
  it('应该正确导入', async () => {
    const { useVirtualScroll } = await import('../../composables/useVirtualScroll')
    expect(useVirtualScroll).toBeDefined()
    expect(typeof useVirtualScroll).toBe('function')
  })

  it('应该返回正确的属性和方法', async () => {
    const { useVirtualScroll } = await import('../../composables/useVirtualScroll')

    const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    const containerHeight = 300
    const options = { itemHeight: 50 }

    const result = useVirtualScroll(items, containerHeight, options)

    expect(result).toHaveProperty('scrollTop')
    expect(result).toHaveProperty('visibleItems')
    expect(result).toHaveProperty('visibleRange')
    expect(result).toHaveProperty('totalHeight')
    expect(result).toHaveProperty('updateScrollTop')
  })

  it('应该正确计算总高度', async () => {
    const { useVirtualScroll } = await import('../../composables/useVirtualScroll')

    const items = [1, 2, 3, 4, 5]
    const containerHeight = 200
    const options = { itemHeight: 50 }

    const { totalHeight } = useVirtualScroll(items, containerHeight, options)

    expect(totalHeight.value).toBe(250) // 5 items * 50px
  })

  it('应该正确计算可见范围', async () => {
    const { useVirtualScroll } = await import('../../composables/useVirtualScroll')

    const items = Array.from({ length: 100 }, (_, i) => i)
    const containerHeight = 300
    const options = { itemHeight: 50, buffer: 2 }

    const { visibleRange, updateScrollTop } = useVirtualScroll(items, containerHeight, options)

    // 初始滚动位置为 0
    expect(visibleRange.value.startIndex).toBe(0)
    // 可见项目: 300 / 50 = 6 项，加上 buffer 2
    expect(visibleRange.value.endIndex).toBeLessThanOrEqual(10)

    // 滚动到 500px 位置
    updateScrollTop(500)
    // startIndex 应该是 (500 / 50) - buffer = 8
    expect(visibleRange.value.startIndex).toBe(8)
  })

  it('应该正确返回可见项目', async () => {
    const { useVirtualScroll } = await import('../../composables/useVirtualScroll')

    const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    const containerHeight = 150
    const options = { itemHeight: 50, buffer: 0 }

    const { visibleItems } = useVirtualScroll(items, containerHeight, options)

    // 可见 3 项 (150 / 50)
    expect(visibleItems.value.length).toBeLessThanOrEqual(4)

    visibleItems.value.forEach((item) => {
      expect(item).toHaveProperty('item')
      expect(item).toHaveProperty('index')
      expect(item).toHaveProperty('top')
    })
  })

  it('应该正确更新滚动位置', async () => {
    const { useVirtualScroll } = await import('../../composables/useVirtualScroll')

    const items = Array.from({ length: 50 }, (_, i) => i)
    const containerHeight = 300
    const options = { itemHeight: 50 }

    const { scrollTop, updateScrollTop } = useVirtualScroll(items, containerHeight, options)

    expect(scrollTop.value).toBe(0)

    updateScrollTop(200)
    expect(scrollTop.value).toBe(200)

    updateScrollTop(500)
    expect(scrollTop.value).toBe(500)
  })

  it('应该支持自定义 buffer', async () => {
    const { useVirtualScroll } = await import('../../composables/useVirtualScroll')

    const items = Array.from({ length: 100 }, (_, i) => i)
    const containerHeight = 300

    const result1 = useVirtualScroll(items, containerHeight, { itemHeight: 50, buffer: 1 })
    const result2 = useVirtualScroll(items, containerHeight, { itemHeight: 50, buffer: 5 })

    // buffer 越大，可见范围应该越大
    const range1 = result1.visibleRange.value.endIndex - result1.visibleRange.value.startIndex
    const range2 = result2.visibleRange.value.endIndex - result2.visibleRange.value.startIndex

    expect(range2).toBeGreaterThan(range1)
  })

  it('应该正确处理空数组', async () => {
    const { useVirtualScroll } = await import('../../composables/useVirtualScroll')

    const items: number[] = []
    const containerHeight = 300
    const options = { itemHeight: 50 }

    const { totalHeight, visibleItems } = useVirtualScroll(items, containerHeight, options)

    expect(totalHeight.value).toBe(0)
    expect(visibleItems.value).toHaveLength(0)
  })
})
