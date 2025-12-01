// 生成唯一 ID
export function generateId(prefix = ''): string {
  return `${prefix}${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// 时间格式化
export function formatTime(seconds: number, fps = 30): string {
  const totalFrames = Math.floor(seconds * fps)
  const hours = Math.floor(totalFrames / (fps * 3600))
  const minutes = Math.floor((totalFrames % (fps * 3600)) / (fps * 60))
  const secs = Math.floor((totalFrames % (fps * 60)) / fps)
  const frames = totalFrames % fps

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}:${String(frames).padStart(2, '0')}`
}

// 检测两个时间区间是否重叠
export function hasTimeOverlap(
  start1: number,
  end1: number,
  start2: number,
  end2: number
): boolean {
  return start1 < end2 && end1 > start2
}

// 限制值在范围内
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, max))
}

// 节流函数
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0
  return function (...args: Parameters<T>) {
    const now = Date.now()
    if (now - lastCall >= delay) {
      lastCall = now
      func(...args)
    }
  }
}

// 防抖函数
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null
  return function (...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    timeoutId = setTimeout(() => {
      func(...args)
    }, delay)
  }
}

// 检测是否为 Mac 系统
export function isMac(): boolean {
  return /Mac|iPod|iPhone|iPad/.test(navigator.platform)
}

// 深拷贝
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

// 时间精度规范化（最多保留3位小数，即毫秒级精度）
export function normalizeTime(time: number): number {
  return Math.round(time * 1000) / 1000
}

// 规范化Clip的时间属性
export function normalizeClipTime(clip: any): any {
  if (clip.startTime !== undefined) {
    clip.startTime = normalizeTime(clip.startTime)
  }
  if (clip.endTime !== undefined) {
    clip.endTime = normalizeTime(clip.endTime)
  }
  if (clip.transitionDuration !== undefined) {
    clip.transitionDuration = normalizeTime(clip.transitionDuration)
  }
  return clip
}

