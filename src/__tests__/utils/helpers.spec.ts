import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
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
} from '../../utils/helpers'

describe('helpers', () => {
  describe('generateId', () => {
    it('应该生成唯一 ID', () => {
      const id1 = generateId()
      const id2 = generateId()
      expect(id1).not.toBe(id2)
    })

    it('应该支持自定义前缀', () => {
      const id = generateId('clip-')
      expect(id.startsWith('clip-')).toBe(true)
    })

    it('应该生成包含时间戳和随机字符串的 ID', () => {
      const id = generateId()
      expect(id).toMatch(/^\d+-[a-z0-9]+$/)
    })
  })

  describe('formatTime', () => {
    it('应该正确格式化 0 秒', () => {
      expect(formatTime(0)).toBe('00:00:00:00')
    })

    it('应该正确格式化秒', () => {
      expect(formatTime(1)).toBe('00:00:01:00')
      expect(formatTime(30)).toBe('00:00:30:00')
    })

    it('应该正确格式化分钟', () => {
      expect(formatTime(60)).toBe('00:01:00:00')
      expect(formatTime(90)).toBe('00:01:30:00')
    })

    it('应该正确格式化小时', () => {
      expect(formatTime(3600)).toBe('01:00:00:00')
      expect(formatTime(3661)).toBe('01:01:01:00')
    })

    it('应该正确格式化帧数', () => {
      expect(formatTime(0.5, 30)).toBe('00:00:00:15')
      expect(formatTime(0.1, 30)).toBe('00:00:00:03')
    })

    it('应该支持自定义帧率', () => {
      expect(formatTime(1, 24)).toBe('00:00:01:00')
      expect(formatTime(0.5, 24)).toBe('00:00:00:12')
    })
  })

  describe('hasTimeOverlap', () => {
    it('完全重叠时应该返回 true', () => {
      expect(hasTimeOverlap(0, 5, 0, 5)).toBe(true)
    })

    it('部分重叠时应该返回 true', () => {
      expect(hasTimeOverlap(0, 5, 3, 8)).toBe(true)
      expect(hasTimeOverlap(3, 8, 0, 5)).toBe(true)
    })

    it('一个区间包含另一个时应该返回 true', () => {
      expect(hasTimeOverlap(0, 10, 2, 5)).toBe(true)
      expect(hasTimeOverlap(2, 5, 0, 10)).toBe(true)
    })

    it('相邻但不重叠时应该返回 false', () => {
      expect(hasTimeOverlap(0, 5, 5, 10)).toBe(false)
    })

    it('完全不重叠时应该返回 false', () => {
      expect(hasTimeOverlap(0, 5, 10, 15)).toBe(false)
      expect(hasTimeOverlap(10, 15, 0, 5)).toBe(false)
    })
  })

  describe('clamp', () => {
    it('值在范围内时应该返回原值', () => {
      expect(clamp(5, 0, 10)).toBe(5)
    })

    it('值小于最小值时应该返回最小值', () => {
      expect(clamp(-5, 0, 10)).toBe(0)
    })

    it('值大于最大值时应该返回最大值', () => {
      expect(clamp(15, 0, 10)).toBe(10)
    })

    it('值等于边界值时应该返回边界值', () => {
      expect(clamp(0, 0, 10)).toBe(0)
      expect(clamp(10, 0, 10)).toBe(10)
    })
  })

  describe('throttle', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('应该立即执行第一次调用', () => {
      const fn = vi.fn()
      const throttled = throttle(fn, 100)

      throttled()
      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('在延迟时间内的调用应该被忽略', () => {
      const fn = vi.fn()
      const throttled = throttle(fn, 100)

      throttled()
      throttled()
      throttled()

      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('延迟时间后应该可以再次调用', () => {
      const fn = vi.fn()
      const throttled = throttle(fn, 100)

      throttled()
      vi.advanceTimersByTime(100)
      throttled()

      expect(fn).toHaveBeenCalledTimes(2)
    })

    it('应该传递正确的参数', () => {
      const fn = vi.fn()
      const throttled = throttle(fn, 100)

      throttled('arg1', 'arg2')

      expect(fn).toHaveBeenCalledWith('arg1', 'arg2')
    })
  })

  describe('debounce', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('应该在延迟后执行', () => {
      const fn = vi.fn()
      const debounced = debounce(fn, 100)

      debounced()
      expect(fn).not.toHaveBeenCalled()

      vi.advanceTimersByTime(100)
      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('连续调用时应该重置延迟', () => {
      const fn = vi.fn()
      const debounced = debounce(fn, 100)

      debounced()
      vi.advanceTimersByTime(50)
      debounced()
      vi.advanceTimersByTime(50)
      debounced()
      vi.advanceTimersByTime(100)

      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('应该传递正确的参数', () => {
      const fn = vi.fn()
      const debounced = debounce(fn, 100)

      debounced('arg1', 'arg2')
      vi.advanceTimersByTime(100)

      expect(fn).toHaveBeenCalledWith('arg1', 'arg2')
    })
  })

  describe('isMac', () => {
    it('应该返回布尔值', () => {
      const result = isMac()
      expect(typeof result).toBe('boolean')
    })
  })

  describe('deepClone', () => {
    it('应该深拷贝对象', () => {
      const original = { a: 1, b: { c: 2 } }
      const cloned = deepClone(original)

      expect(cloned).toEqual(original)
      expect(cloned).not.toBe(original)
      expect(cloned.b).not.toBe(original.b)
    })

    it('应该深拷贝数组', () => {
      const original = [1, 2, [3, 4]]
      const cloned = deepClone(original)

      expect(cloned).toEqual(original)
      expect(cloned).not.toBe(original)
      expect(cloned[2]).not.toBe(original[2])
    })

    it('应该拷贝嵌套结构', () => {
      const original = {
        arr: [1, 2, { deep: 'value' }],
        obj: { nested: { value: 123 } },
      }
      const cloned = deepClone(original)

      expect(cloned).toEqual(original)
      cloned.obj.nested.value = 456
      expect(original.obj.nested.value).toBe(123)
    })
  })

  describe('normalizeTime', () => {
    it('应该规范化为毫秒精度', () => {
      expect(normalizeTime(1.0001)).toBe(1)
      expect(normalizeTime(1.5)).toBe(1.5)
      expect(normalizeTime(1.123456)).toBe(1.123)
    })

    it('应该处理整数', () => {
      expect(normalizeTime(5)).toBe(5)
    })

    it('应该四舍五入', () => {
      expect(normalizeTime(1.1235)).toBe(1.124)
      expect(normalizeTime(1.1234)).toBe(1.123)
    })
  })

  describe('normalizeClipTime', () => {
    it('应该规范化 clip 的时间属性', () => {
      const clip = {
        startTime: 1.0001,
        endTime: 5.5555,
        transitionDuration: 0.3333,
      }

      const normalized = normalizeClipTime(clip)

      expect(normalized.startTime).toBe(1)
      expect(normalized.endTime).toBe(5.556)
      expect(normalized.transitionDuration).toBe(0.333)
    })

    it('没有时间属性时不应该报错', () => {
      const clip = { name: 'test' }
      const normalized = normalizeClipTime(clip)
      expect(normalized).toEqual({ name: 'test' })
    })

    it('应该返回同一个对象引用', () => {
      const clip = { startTime: 1.1234 }
      const normalized = normalizeClipTime(clip)
      expect(normalized).toBe(clip)
    })
  })
})
