<template>
  <teleport to="body">
    <div v-if="visible" class="context-menu" :style="menuStyle" @contextmenu.prevent>
      <div v-for="item in menuItems" :key="item.key" class="context-menu__item" :class="{
        'context-menu__item--disabled': item.disabled,
        'context-menu__item--divider': item.divider,
        'context-menu__item--danger': item.danger
      }" @click="handleItemClick(item)">
        <template v-if="item.divider">
          <div class="context-menu__divider" />
        </template>
        <template v-else-if="item.slot">
          <slot :name="item.slot" :item="item" />
        </template>
        <template v-else>
          <span v-if="item.icon" class="context-menu__icon">{{ item.icon }}</span>
          <span class="context-menu__label">{{ item.label }}</span>
          <span v-if="item.shortcut" class="context-menu__shortcut">{{ item.shortcut }}</span>
        </template>
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { ContextMenuItem } from '@/types'

// Props
interface Props {
  items?: ContextMenuItem[]
}

const props = withDefaults(defineProps<Props>(), {
  items: () => []
})

// Emits
const emit = defineEmits<{
  select: [key: string]
  close: []
}>()

// Refs
const visible = ref(false)
const position = ref({ x: 0, y: 0 })

// Computed
const menuItems = computed(() => props.items)

const menuStyle = computed(() => ({
  left: `${position.value.x}px`,
  top: `${position.value.y}px`
}))

// 显示菜单
function show(x: number, y: number) {
  position.value = { x, y }
  visible.value = true

  // 防止菜单超出屏幕
  setTimeout(() => {
    adjustPosition()
  }, 0)
}

// 隐藏菜单
function hide() {
  visible.value = false
  emit('close')
}

// 调整位置（防止超出屏幕）
function adjustPosition() {
  const menu = document.querySelector('.context-menu') as HTMLElement
  if (!menu) return

  const rect = menu.getBoundingClientRect()
  const windowWidth = window.innerWidth
  const windowHeight = window.innerHeight

  let { x, y } = position.value

  // 右侧超出
  if (rect.right > windowWidth) {
    x = windowWidth - rect.width - 10
  }

  // 底部超出
  if (rect.bottom > windowHeight) {
    y = windowHeight - rect.height - 10
  }

  // 左侧超出
  if (x < 0) {
    x = 10
  }

  // 顶部超出
  if (y < 0) {
    y = 10
  }

  position.value = { x, y }
}

// 处理菜单项点击
function handleItemClick(item: ContextMenuItem) {
  if (item.disabled || item.divider) return

  emit('select', item.key)
  hide()
}

// 监听点击外部关闭菜单
function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement
  // 只在左键点击时隐藏菜单，忽略右键菜单事件
  if (visible.value && !target.closest('.context-menu') && event.button === 0) {
    hide()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('contextmenu', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('contextmenu', handleClickOutside)
})

// 暴露方法
defineExpose({
  show,
  hide
})
</script>

<style>
.context-menu {
  position: fixed;
  z-index: 9999;
  min-width: 180px;
  background: var(--color-bg-light);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  padding: 4px;
  animation: contextMenuFadeIn 0.12s ease-out;
}

@keyframes contextMenuFadeIn {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(-5px);
  }

  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.context-menu__item {
  display: flex;
  align-items: center;
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 400;
  color: var(--color-text-primary);
  cursor: pointer;
  transition: all var(--transition-fast);
  user-select: none;
  border-radius: var(--radius-sm);
  gap: 8px;
}

.context-menu__item:hover:not(.context-menu__item--disabled):not(.context-menu__item--divider) {
  background: var(--color-bg-medium);
  color: var(--color-primary);
}

.context-menu__item--disabled {
  color: var(--color-text-tertiary);
  cursor: not-allowed;
  opacity: 0.5;
}

.context-menu__item--danger {
  color: var(--color-error, #ef4444);
}

.context-menu__item--danger:hover:not(.context-menu__item--disabled) {
  background: rgba(239, 68, 68, 0.1);
  color: var(--color-error, #ef4444);
}

.context-menu__item--divider {
  padding: 0;
  cursor: default;
  margin: 4px 0;
}

.context-menu__divider {
  height: 1px;
  background: var(--color-border);
  margin: 0;
}

.context-menu__icon {
  width: 16px;
  text-align: center;
  flex-shrink: 0;
  font-size: 12px;
}

.context-menu__label {
  flex: 1;
}

.context-menu__shortcut {
  color: var(--color-text-tertiary);
  font-size: 10px;
  margin-left: auto;
  padding-left: 16px;
}
</style>
