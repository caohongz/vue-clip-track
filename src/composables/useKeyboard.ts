import { ref, onMounted, onUnmounted, type Ref } from 'vue'
import { useTracksStore } from '@/stores/tracks'
import { usePlaybackStore } from '@/stores/playback'
import { useHistoryStore } from '@/stores/history'
import { useScaleStore } from '@/stores/scale'
import { isMac } from '@/utils/helpers'

interface KeyboardCallbacks {
  onCopy?: (clipIds: string[]) => void
  onCut?: (clipIds: string[]) => void
  onDelete?: (clipIds: string[]) => void
  onPaste?: (clips: any[], trackId: string, time: number) => void
  onPlay?: () => void
  onPause?: () => void
}

interface UseKeyboardOptions {
  containerRef?: Ref<HTMLElement | undefined>
  callbacks?: KeyboardCallbacks
}

export function useKeyboard(options: UseKeyboardOptions = {}) {
  const tracksStore = useTracksStore()
  const playbackStore = usePlaybackStore()
  const historyStore = useHistoryStore()
  const scaleStore = useScaleStore()
  const callbacks = options.callbacks || {}

  // 追踪组件是否处于激活状态（鼠标在组件内或组件有焦点）
  const isActive = ref(false)

  // 检查事件目标是否在容器内
  function isEventInContainer(event: Event): boolean {
    if (!options.containerRef?.value) return true // 没有容器则全局生效
    const target = event.target as HTMLElement
    return options.containerRef.value.contains(target)
  }

  // 检查焦点是否在容器内
  function isFocusInContainer(): boolean {
    if (!options.containerRef?.value) return true
    const activeElement = document.activeElement
    if (!activeElement) return false
    return options.containerRef.value.contains(activeElement)
  }

  // 检查是否应该处理快捷键
  function shouldHandleShortcut(): boolean {
    // 如果没有提供容器，则全局生效（向后兼容）
    if (!options.containerRef?.value) return true

    // 检查是否激活状态
    return isActive.value
  }

  // 处理键盘事件
  function handleKeyDown(event: KeyboardEvent) {
    // 首先检查是否应该处理快捷键
    if (!shouldHandleShortcut()) return

    // 检查是否在输入框中
    if (isInputFocused(event)) return

    const isMacOS = isMac()
    const modKey = isMacOS ? event.metaKey : event.ctrlKey

    // 空格：播放/暂停
    if (event.code === 'Space') {
      event.preventDefault()
      if (playbackStore.isPlaying) {
        playbackStore.pause()
        callbacks.onPause?.()
      } else {
        playbackStore.play()
        callbacks.onPlay?.()
      }
      return
    }

    // Ctrl/Cmd + Z：撤销
    if (modKey && event.code === 'KeyZ' && !event.shiftKey) {
      event.preventDefault()
      historyStore.undo()
      return
    }

    // Ctrl/Cmd + Y 或 Ctrl/Cmd + Shift + Z：重做
    if (
      (modKey && event.code === 'KeyY') ||
      (modKey && event.shiftKey && event.code === 'KeyZ')
    ) {
      event.preventDefault()
      historyStore.redo()
      return
    }

    // Ctrl/Cmd + C：复制
    if (modKey && event.code === 'KeyC') {
      event.preventDefault()
      handleCopy()
      return
    }

    // Ctrl/Cmd + X：剪切
    if (modKey && event.code === 'KeyX') {
      event.preventDefault()
      handleCut()
      return
    }

    // Ctrl/Cmd + V：粘贴
    if (modKey && event.code === 'KeyV') {
      event.preventDefault()
      handlePaste()
      return
    }

    // Delete/Backspace：删除
    if (event.code === 'Delete' || event.code === 'Backspace') {
      event.preventDefault()
      handleDelete()
      return
    }

    // Ctrl/Cmd + +：放大
    if (modKey && (event.code === 'Equal' || event.code === 'NumpadAdd')) {
      event.preventDefault()
      scaleStore.zoomIn(0.1)
      return
    }

    // Ctrl/Cmd + -：缩小
    if (modKey && (event.code === 'Minus' || event.code === 'NumpadSubtract')) {
      event.preventDefault()
      scaleStore.zoomOut(0.1)
      return
    }

    // 方向键 →：时间前进
    if (event.code === 'ArrowRight') {
      event.preventDefault()
      playbackStore.adjustTime(0.1)
      return
    }

    // 方向键 ←：时间后退
    if (event.code === 'ArrowLeft') {
      event.preventDefault()
      playbackStore.adjustTime(-0.1)
      return
    }

    // Esc：取消选中
    if (event.code === 'Escape') {
      event.preventDefault()
      tracksStore.clearSelection()
      return
    }
  }

  // 检查是否有输入框聚焦（排除 VideoTrack 组件内的非输入元素）
  function isInputFocused(event: KeyboardEvent): boolean {
    const target = event.target as HTMLElement

    // 检查是否是输入元素
    if (
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target.isContentEditable
    ) {
      // 如果输入元素不在我们的容器内，不处理事件
      if (options.containerRef?.value && !options.containerRef.value.contains(target)) {
        return true // 返回 true 表示不处理此事件
      }
      // 输入元素在容器内，也不处理（让输入正常工作）
      return true
    }

    return false
  }

  // 复制选中的 clips
  function handleCopy() {
    const selectedClipIds = Array.from(tracksStore.selectedClipIds)
    if (selectedClipIds.length === 0) return

    tracksStore.copyClips(selectedClipIds)
    callbacks.onCopy?.(selectedClipIds)
  }

  // 剪切选中的 clips
  function handleCut() {
    const selectedClipIds = Array.from(tracksStore.selectedClipIds)
    if (selectedClipIds.length === 0) return

    tracksStore.cutClips(selectedClipIds)
    callbacks.onCut?.(selectedClipIds)
  }

  // 粘贴 clips
  function handlePaste() {
    if (!tracksStore.hasClipboardContent()) return

    // 获取当前选中的第一个 clip 所在的轨道，或使用主轨道
    const selectedClips = tracksStore.selectedClips
    let targetTrackId: string | undefined

    if (selectedClips.length > 0) {
      targetTrackId = selectedClips[0].trackId
    } else if (tracksStore.mainTrack) {
      targetTrackId = tracksStore.mainTrack.id
    }

    if (!targetTrackId) return

    // 获取当前播放时间作为粘贴位置
    const startTime = playbackStore.currentTime

    const pastedClips = tracksStore.pasteClips(targetTrackId, startTime)
    if (pastedClips) {
      historyStore.pushSnapshot('粘贴片段')
      callbacks.onPaste?.(pastedClips, targetTrackId, startTime)
    }
  }

  // 删除选中的 clips
  function handleDelete() {
    const selectedClipIds = Array.from(tracksStore.selectedClipIds)
    if (selectedClipIds.length === 0) return

    tracksStore.removeClips(selectedClipIds)
    historyStore.pushSnapshot('删除片段')
    callbacks.onDelete?.(selectedClipIds)
  }

  // 鼠标进入容器
  function handleMouseEnter() {
    isActive.value = true
  }

  // 鼠标离开容器
  function handleMouseLeave() {
    // 如果焦点仍在容器内，保持激活状态
    if (!isFocusInContainer()) {
      isActive.value = false
    }
  }

  // 容器获得焦点
  function handleFocusIn() {
    isActive.value = true
  }

  // 容器失去焦点
  function handleFocusOut(event: FocusEvent) {
    // 检查焦点是否移到了容器外
    const relatedTarget = event.relatedTarget as HTMLElement
    if (options.containerRef?.value && relatedTarget) {
      if (!options.containerRef.value.contains(relatedTarget)) {
        isActive.value = false
      }
    }
  }

  // 设置容器事件监听
  function setupContainerEvents() {
    const container = options.containerRef?.value
    if (!container) return

    container.addEventListener('mouseenter', handleMouseEnter)
    container.addEventListener('mouseleave', handleMouseLeave)
    container.addEventListener('focusin', handleFocusIn)
    container.addEventListener('focusout', handleFocusOut)
  }

  // 清理容器事件监听
  function cleanupContainerEvents() {
    const container = options.containerRef?.value
    if (!container) return

    container.removeEventListener('mouseenter', handleMouseEnter)
    container.removeEventListener('mouseleave', handleMouseLeave)
    container.removeEventListener('focusin', handleFocusIn)
    container.removeEventListener('focusout', handleFocusOut)
  }

  // 挂载和卸载事件监听
  onMounted(() => {
    document.addEventListener('keydown', handleKeyDown)
    setupContainerEvents()
  })

  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeyDown)
    cleanupContainerEvents()
  })

  return {
    handleKeyDown,
    isActive
  }
}
