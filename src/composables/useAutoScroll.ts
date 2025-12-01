import { watch, type Ref } from 'vue'
import { usePlaybackStore } from '@/stores/playback'
import { useScaleStore } from '@/stores/scale'

interface UseAutoScrollOptions {
  scrollLeft: Ref<number>
  tracksWidth: Ref<number>
  setScrollLeft: (left: number) => void
}

export function useAutoScroll({ scrollLeft, tracksWidth, setScrollLeft }: UseAutoScrollOptions) {
  const playbackStore = usePlaybackStore()
  const scaleStore = useScaleStore()

  watch(
    () => playbackStore.currentTime,
    (currentTime) => {
      if (!playbackStore.isPlaying) return

      const pixelsPerSecond = scaleStore.actualPixelsPerSecond
      const currentPos = currentTime * pixelsPerSecond
      const visibleStart = scrollLeft.value
      // const visibleEnd = visibleStart + tracksWidth.value

      // 检查是否接近右边缘 (90%)
      const threshold = visibleStart + tracksWidth.value * 0.9

      if (currentPos > threshold) {
        // 向右滚动 80% 的可视宽度
        const scrollAmount = tracksWidth.value * 0.8
        const newScrollLeft = scrollLeft.value + scrollAmount
        setScrollLeft(newScrollLeft)
      }
    }
  )
}
