// 性能优化工具函数

// 请求动画帧节流
export function rafThrottle<T extends (...args: any[]) => any>(fn: T): T {
  let rafId: number | null = null

  return ((...args: Parameters<T>) => {
    if (rafId !== null) {
      return
    }

    rafId = requestAnimationFrame(() => {
      fn(...args)
      rafId = null
    })
  }) as T
}

// 懒加载图片
export class LazyImageLoader {
  private observer: IntersectionObserver | null = null
  private pendingImages = new Map<HTMLElement, string>()

  constructor() {
    if (typeof IntersectionObserver !== 'undefined') {
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const target = entry.target as HTMLElement
              const src = this.pendingImages.get(target)

              if (src) {
                this.loadImage(target, src)
                this.pendingImages.delete(target)
                this.observer?.unobserve(target)
              }
            }
          })
        },
        {
          rootMargin: '50px'
        }
      )
    }
  }

  observe(element: HTMLElement, src: string) {
    if (this.observer) {
      this.pendingImages.set(element, src)
      this.observer.observe(element)
    } else {
      // 降级处理：直接加载
      this.loadImage(element, src)
    }
  }

  unobserve(element: HTMLElement) {
    this.observer?.unobserve(element)
    this.pendingImages.delete(element)
  }

  private loadImage(element: HTMLElement, src: string) {
    if (element instanceof HTMLImageElement) {
      element.src = src
    } else {
      element.style.backgroundImage = `url(${src})`
    }
  }

  destroy() {
    this.observer?.disconnect()
    this.pendingImages.clear()
  }
}

// 批量 DOM 更新
export class BatchDOMUpdater {
  private updates: Array<() => void> = []
  private rafId: number | null = null

  add(update: () => void) {
    this.updates.push(update)
    this.scheduleFlush()
  }

  private scheduleFlush() {
    if (this.rafId !== null) {
      return
    }

    this.rafId = requestAnimationFrame(() => {
      this.flush()
    })
  }

  private flush() {
    const updates = this.updates.slice()
    this.updates = []
    this.rafId = null

    updates.forEach((update) => {
      update()
    })
  }

  destroy() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
    this.updates = []
  }
}

// 缓存管理器（LRU）
export class LRUCache<K, V> {
  private cache = new Map<K, V>()
  private maxSize: number

  constructor(maxSize = 50) {
    this.maxSize = maxSize
  }

  get(key: K): V | undefined {
    if (!this.cache.has(key)) {
      return undefined
    }

    // 移到最后（最近使用）
    const value = this.cache.get(key)!
    this.cache.delete(key)
    this.cache.set(key, value)
    return value
  }

  set(key: K, value: V) {
    // 如果已存在，先删除
    if (this.cache.has(key)) {
      this.cache.delete(key)
    }

    // 添加到最后
    this.cache.set(key, value)

    // 如果超过最大容量，删除最早的项
    if (this.cache.size > this.maxSize) {
      const firstKey = this.cache.keys().next().value
      if (firstKey !== undefined) {
        this.cache.delete(firstKey)
      }
    }
  }

  has(key: K): boolean {
    return this.cache.has(key)
  }

  clear() {
    this.cache.clear()
  }
}

