import { ref, computed, watch } from 'vue'

interface VirtualScrollOptions {
  itemHeight: number
  buffer?: number
}

export function useVirtualScroll<T>(
  items: T[],
  containerHeight: number,
  options: VirtualScrollOptions
) {
  const { itemHeight, buffer = 3 } = options

  const scrollTop = ref(0)

  // 计算可见范围
  const visibleRange = computed(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop.value / itemHeight) - buffer)
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop.value + containerHeight) / itemHeight) + buffer
    )

    return { startIndex, endIndex }
  })

  // 可见的项目
  const visibleItems = computed(() => {
    const { startIndex, endIndex } = visibleRange.value
    return items.slice(startIndex, endIndex + 1).map((item, index) => ({
      item,
      index: startIndex + index,
      top: (startIndex + index) * itemHeight
    }))
  })

  // 总高度
  const totalHeight = computed(() => items.length * itemHeight)

  // 更新滚动位置
  function updateScrollTop(newScrollTop: number) {
    scrollTop.value = newScrollTop
  }

  return {
    scrollTop,
    visibleItems,
    visibleRange,
    totalHeight,
    updateScrollTop
  }
}

