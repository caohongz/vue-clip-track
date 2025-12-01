import type { Preview } from '@storybook/vue3'

// 引入组件样式
import '../src/styles/global.css'

const preview: Preview = {
    parameters: {
        controls: {
            matchers: {
                color: /(background|color)$/i,
                date: /Date$/i,
            },
        },
        backgrounds: {
            default: 'dark',
            values: [
                {
                    name: 'dark',
                    value: '#1a1a2e',
                },
                {
                    name: 'light',
                    value: '#ffffff',
                },
            ],
        },
        layout: 'fullscreen',
        // 在 Docs 页面中使用 iframe 隔离每个 story，避免状态共享问题
        docs: {
            story: {
                inline: false,
                iframeHeight: 500,
            },
        },
    },
}

export default preview
