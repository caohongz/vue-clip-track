import { defineConfig } from 'vitepress'

export default defineConfig({
    title: 'vue-clip-track',
    description: '基于 Vue 3 的专业级视频轨道编辑组件库',
    base: '/vue-clip-track/docs/',

    head: [
        ['link', { rel: 'icon', href: '/vue-clip-track/docs/favicon.ico' }],
    ],

    themeConfig: {
        logo: '/logo.svg',

        nav: [
            { text: '指南', link: '/guide/getting-started' },
            { text: 'API', link: '/api/props' },
            { text: '示例', link: '/examples/basic' },
            {
                text: '相关链接',
                items: [
                    { text: 'Storybook 演示', link: 'https://caohongz.github.io/vue-clip-track/' },
                    { text: 'GitHub', link: 'https://github.com/caohongz/vue-clip-track' },
                    { text: 'npm', link: 'https://www.npmjs.com/package/vue-clip-track' },
                ]
            }
        ],

        sidebar: {
            '/guide/': [
                {
                    text: '开始',
                    items: [
                        { text: '介绍', link: '/guide/introduction' },
                        { text: '快速开始', link: '/guide/getting-started' },
                    ]
                },
                {
                    text: '核心概念',
                    items: [
                        { text: '轨道与片段', link: '/guide/tracks-and-clips' },
                        { text: '播放倍速', link: '/guide/playback-rate' },
                        { text: '键盘快捷键', link: '/guide/keyboard-shortcuts' },
                        { text: '主题定制', link: '/guide/theming' },
                        { text: '国际化', link: '/guide/i18n' },
                    ]
                }
            ],
            '/api/': [
                {
                    text: '组件 API',
                    items: [
                        { text: 'Props', link: '/api/props' },
                        { text: 'Events', link: '/api/events' },
                        { text: 'Slots', link: '/api/slots' },
                        { text: '实例方法', link: '/api/methods' },
                    ]
                },
                {
                    text: '导出模块',
                    items: [
                        { text: 'Stores', link: '/api/stores' },
                        { text: 'Composables', link: '/api/composables' },
                        { text: '工具函数', link: '/api/utils' },
                        { text: '类型定义', link: '/api/types' },
                    ]
                }
            ],
            '/examples/': [
                {
                    text: '示例',
                    items: [
                        { text: '基础用法', link: '/examples/basic' },
                        { text: '自定义工具栏', link: '/examples/custom-toolbar' },
                        { text: '主轨道模式', link: '/examples/main-track-mode' },
                        { text: '转场效果', link: '/examples/transitions' },
                    ]
                }
            ]
        },

        socialLinks: [
            { icon: 'github', link: 'https://github.com/caohongz/vue-clip-track' }
        ],

        footer: {
            message: 'Released under the MIT License.',
            copyright: 'Copyright © 2024-present'
        },

        search: {
            provider: 'local',
            options: {
                translations: {
                    button: {
                        buttonText: '搜索文档',
                        buttonAriaLabel: '搜索文档'
                    },
                    modal: {
                        noResultsText: '无法找到相关结果',
                        resetButtonTitle: '清除查询条件',
                        footer: {
                            selectText: '选择',
                            navigateText: '切换'
                        }
                    }
                }
            }
        },

        outline: {
            label: '页面导航',
            level: [2, 3]
        },

        docFooter: {
            prev: '上一页',
            next: '下一页'
        },

        lastUpdated: {
            text: '最后更新于',
            formatOptions: {
                dateStyle: 'short',
                timeStyle: 'short'
            }
        }
    },

    markdown: {
        lineNumbers: true
    }
})
