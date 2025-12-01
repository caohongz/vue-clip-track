import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { HistoryItem } from '@/types'
import { useTracksStore } from './tracks'

export const useHistoryStore = defineStore('history', () => {
  // 状态
  const historyStack = ref<HistoryItem[]>([])
  const currentIndex = ref(-1)
  const maxHistorySize = ref(50) // 最多保存 50 条历史记录

  // 计算属性
  const canUndo = computed(() => currentIndex.value > 0)
  const canRedo = computed(() => currentIndex.value < historyStack.value.length - 1)

  // 方法：创建快照
  function createSnapshot(description?: string): HistoryItem {
    const tracksStore = useTracksStore()
    const snapshot: HistoryItem = {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
      snapshot: JSON.stringify({
        tracks: tracksStore.tracks,
        selectedClipIds: Array.from(tracksStore.selectedClipIds)
      }),
      description
    }
    return snapshot
  }

  // 方法：保存快照
  function pushSnapshot(description?: string) {
    const snapshot = createSnapshot(description)

    // 如果当前不在栈顶，删除当前位置之后的所有历史
    if (currentIndex.value < historyStack.value.length - 1) {
      historyStack.value = historyStack.value.slice(0, currentIndex.value + 1)
    }

    // 添加新快照
    historyStack.value.push(snapshot)

    // 限制历史记录数量
    if (historyStack.value.length > maxHistorySize.value) {
      historyStack.value.shift()
    } else {
      currentIndex.value++
    }
  }

  // 方法：恢复快照
  function restoreSnapshot(snapshot: HistoryItem) {
    const tracksStore = useTracksStore()
    const data = JSON.parse(snapshot.snapshot)

    // 恢复轨道数据
    tracksStore.tracks = data.tracks

    // 恢复选中状态
    tracksStore.selectedClipIds.clear()
    data.selectedClipIds.forEach((id: string) => {
      tracksStore.selectedClipIds.add(id)
    })
  }

  // 方法：撤销
  function undo() {
    if (!canUndo.value) return

    currentIndex.value--
    const snapshot = historyStack.value[currentIndex.value]
    restoreSnapshot(snapshot)
  }

  // 方法：重做
  function redo() {
    if (!canRedo.value) return

    currentIndex.value++
    const snapshot = historyStack.value[currentIndex.value]
    restoreSnapshot(snapshot)
  }

  // 方法：初始化历史（保存初始状态）
  function initialize() {
    historyStack.value = []
    currentIndex.value = -1
    pushSnapshot('初始状态')
  }

  // 方法：清空历史
  function clear() {
    historyStack.value = []
    currentIndex.value = -1
  }

  // 方法：重置
  function reset() {
    clear()
  }

  return {
    // 状态
    historyStack,
    currentIndex,
    maxHistorySize,

    // 计算属性
    canUndo,
    canRedo,

    // 方法
    createSnapshot,
    pushSnapshot,
    restoreSnapshot,
    undo,
    redo,
    initialize,
    clear,
    reset
  }
})

