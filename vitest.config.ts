import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'dist/**',
        '**/*.d.ts',
        '**/*.config.*',
        '**/index.ts',
        'src/styles/**',
        'src/components/**/*.vue', // 排除 Vue 组件（需要专门的组件测试）
        'src/types/**', // 排除类型文件
      ],
      include: ['src/**/*.ts'],
      // 暂时禁用覆盖率阈值检查，在 CI 中可以启用
      // thresholds: {
      //   global: {
      //     branches: 75,
      //     functions: 75,
      //     lines: 75,
      //     statements: 75,
      //   },
      // },
    },
    setupFiles: ['./src/__tests__/setup.ts'],
    include: ['src/**/*.{test,spec}.{js,ts}'],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
})
