import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { withSetup } from '../setup'

describe('useTheme', () => {
  let pinia: ReturnType<typeof createPinia>

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)

    // Mock localStorage
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null)
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { })

    // Mock matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('应该正确导入', async () => {
    const { useTheme, PRESET_COLORS } = await import('../../composables/useTheme')
    expect(useTheme).toBeDefined()
    expect(typeof useTheme).toBe('function')
    expect(PRESET_COLORS).toBeDefined()
    expect(Array.isArray(PRESET_COLORS)).toBe(true)
  })

  it('应该返回正确的属性和方法', async () => {
    const { useTheme } = await import('../../composables/useTheme')

    const { result, unmount } = withSetup(() => useTheme(), [pinia])

    expect(result).toHaveProperty('theme')
    expect(result).toHaveProperty('currentColor')
    expect(result).toHaveProperty('toggleTheme')
    expect(result).toHaveProperty('setTheme')
    expect(result).toHaveProperty('setColor')
    expect(result).toHaveProperty('presetColors')
    unmount()
  })

  it('初始主题应该是 dark', async () => {
    const { useTheme } = await import('../../composables/useTheme')

    const { result, unmount } = withSetup(() => useTheme(), [pinia])

    expect(result.theme.value).toBe('dark')
    unmount()
  })

  it('预设颜色应该包含多个选项', async () => {
    const { PRESET_COLORS } = await import('../../composables/useTheme')

    expect(PRESET_COLORS.length).toBeGreaterThan(0)
    expect(PRESET_COLORS[0]).toHaveProperty('name')
    expect(PRESET_COLORS[0]).toHaveProperty('hue')
    expect(PRESET_COLORS[0]).toHaveProperty('saturation')
    expect(PRESET_COLORS[0]).toHaveProperty('lightness')
  })

  describe('toggleTheme', () => {
    it('应该在 dark 和 light 之间切换', async () => {
      const { useTheme } = await import('../../composables/useTheme')

      const { result, unmount } = withSetup(() => useTheme(), [pinia])

      expect(result.theme.value).toBe('dark')

      result.toggleTheme()
      expect(result.theme.value).toBe('light')

      result.toggleTheme()
      expect(result.theme.value).toBe('dark')
      unmount()
    })
  })

  describe('setTheme', () => {
    it('应该能设置主题', async () => {
      const { useTheme } = await import('../../composables/useTheme')

      const { result, unmount } = withSetup(() => useTheme(), [pinia])

      result.setTheme('light')
      expect(result.theme.value).toBe('light')

      result.setTheme('dark')
      expect(result.theme.value).toBe('dark')
      unmount()
    })
  })

  describe('setColor', () => {
    it('应该能设置主色调', async () => {
      const { useTheme, PRESET_COLORS } = await import('../../composables/useTheme')

      const { result, unmount } = withSetup(() => useTheme(), [pinia])

      const newColor = PRESET_COLORS[1]
      result.setColor(newColor)

      expect(result.currentColor.value).toEqual(newColor)
      unmount()
    })

    it('应该将颜色保存到 localStorage', async () => {
      const { useTheme, PRESET_COLORS } = await import('../../composables/useTheme')

      const { result, unmount } = withSetup(() => useTheme(), [pinia])

      const newColor = PRESET_COLORS[2]
      result.setColor(newColor)

      // 验证颜色已更新
      expect(result.currentColor.value).toEqual(newColor)
      unmount()
    })

    it('应该更新 CSS 变量', async () => {
      const { useTheme, PRESET_COLORS } = await import('../../composables/useTheme')

      const { result, unmount } = withSetup(() => useTheme(), [pinia])

      const newColor = PRESET_COLORS[3]
      result.setColor(newColor)

      const root = document.documentElement
      expect(root.style.getPropertyValue('--theme-hue')).toBe(String(newColor.hue))
      expect(root.style.getPropertyValue('--theme-saturation')).toBe(`${newColor.saturation}%`)
      expect(root.style.getPropertyValue('--theme-lightness')).toBe(`${newColor.lightness}%`)
      unmount()
    })
  })

  describe('setTheme', () => {
    it('应该能设置主题为 light', async () => {
      const { useTheme } = await import('../../composables/useTheme')

      const { result, unmount } = withSetup(() => useTheme(), [pinia])

      result.setTheme('light')

      expect(result.theme.value).toBe('light')
      expect(document.documentElement.getAttribute('data-theme')).toBe('light')
      unmount()
    })

    it('应该能设置主题为 dark', async () => {
      const { useTheme } = await import('../../composables/useTheme')

      const { result, unmount } = withSetup(() => useTheme(), [pinia])

      result.setTheme('dark')

      expect(result.theme.value).toBe('dark')
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
      unmount()
    })

    it('应该将主题保存到 localStorage', async () => {
      const { useTheme } = await import('../../composables/useTheme')

      const { result, unmount } = withSetup(() => useTheme(), [pinia])

      result.setTheme('light')

      // 验证主题已更新
      expect(result.theme.value).toBe('light')
      expect(document.documentElement.getAttribute('data-theme')).toBe('light')
      unmount()
    })
  })

  describe('从 localStorage 恢复', () => {
    it('初始主题应该来自默认值或系统偏好', async () => {
      const { useTheme } = await import('../../composables/useTheme')

      const { result, unmount } = withSetup(() => useTheme(), [pinia])

      // 默认主题是 dark
      expect(result.theme.value).toBe('dark')
      unmount()
    })

    it('初始颜色应该是第一个预设颜色', async () => {
      const { useTheme, PRESET_COLORS } = await import('../../composables/useTheme')

      const { result, unmount } = withSetup(() => useTheme(), [pinia])

      expect(result.currentColor.value).toEqual(PRESET_COLORS[0])
      unmount()
    })
  })

  describe('系统主题变化监听', () => {
    it('用户未手动设置时系统主题变化应该自动更新', async () => {
      vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null)

      let changeCallback: ((e: { matches: boolean }) => void) | undefined = undefined

      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query: string) => ({
          matches: query === '(prefers-color-scheme: dark)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn((event: string, callback: (e: { matches: boolean }) => void) => {
            if (event === 'change') {
              changeCallback = callback
            }
          }),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      })

      const { useTheme } = await import('../../composables/useTheme')

      const { result, unmount } = withSetup(() => useTheme(), [pinia])

      // 模拟系统主题变化
      if (changeCallback) {
        (changeCallback as (e: { matches: boolean }) => void)({ matches: false }) // 切换到浅色
      }

      expect(result.theme.value).toBe('light')
      unmount()
    })
  })

  describe('presetColors', () => {
    it('应该返回预设颜色列表', async () => {
      const { useTheme, PRESET_COLORS } = await import('../../composables/useTheme')

      const { result, unmount } = withSetup(() => useTheme(), [pinia])

      expect(result.presetColors).toEqual(PRESET_COLORS)
      expect(result.presetColors.length).toBeGreaterThan(0)
      unmount()
    })
  })
})
