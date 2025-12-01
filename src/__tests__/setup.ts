import { vi, beforeEach } from 'vitest'
import { config, mount } from '@vue/test-utils'
import { createPinia, setActivePinia, type Pinia } from 'pinia'
import { defineComponent, type App, type Plugin } from 'vue'

type PluginType = Plugin | Pinia

// Helper function to run composables in a component context
export function withSetup<T>(composable: () => T, plugins: PluginType[] = []): { result: T; unmount: () => void } {
  let result!: T
  const TestComponent = defineComponent({
    setup() {
      result = composable()
      return () => null
    },
  })
  const wrapper = mount(TestComponent, {
    global: {
      plugins: plugins.length ? plugins : [createPinia()],
    },
  })
  return {
    result,
    unmount: () => wrapper.unmount(),
  }
}

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', { value: localStorageMock })

// Mock requestAnimationFrame and cancelAnimationFrame
window.requestAnimationFrame = vi.fn((cb) => setTimeout(cb, 16) as unknown as number)
window.cancelAnimationFrame = vi.fn((id) => clearTimeout(id))

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Reset Pinia before each test
beforeEach(() => {
  const pinia = createPinia()
  setActivePinia(pinia)
  localStorageMock.getItem.mockClear()
  localStorageMock.setItem.mockClear()
  localStorageMock.removeItem.mockClear()
})

// Global Vue Test Utils config
config.global.plugins = []
