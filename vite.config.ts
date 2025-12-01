import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'
import { resolve } from 'path'

export default defineConfig({
    plugins: [
        vue(),
        dts({
            insertTypesEntry: true,
            include: ['src/**/*.ts', 'src/**/*.vue'],
            outDir: 'dist',
            // 生成单独的类型声明文件
            staticImport: true,
            // 跳过诊断
            skipDiagnostics: true,
        }),
    ],
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src'),
        },
    },
    build: {
        lib: {
            entry: resolve(__dirname, 'src/index.ts'),
            name: 'VueClipTrack',
            fileName: 'vue-clip-track',
            formats: ['es', 'umd'],
        },
        rollupOptions: {
            // 确保外部化处理那些你不想打包进库的依赖
            external: ['vue', 'pinia'],
            output: {
                // 在 UMD 构建模式下为这些外部化的依赖提供一个全局变量
                globals: {
                    vue: 'Vue',
                    pinia: 'Pinia',
                },
                // 使用命名导出
                exports: 'named',
                // 保留 CSS 变量名
                assetFileNames: (assetInfo) => {
                    if (assetInfo.name === 'style.css') return 'style.css'
                    return assetInfo.name || ''
                },
            },
        },
        // 开启 sourcemap
        sourcemap: true,
        // CSS 代码分割
        cssCodeSplit: false,
    },
})
