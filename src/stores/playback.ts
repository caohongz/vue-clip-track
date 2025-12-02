import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useTracksStore } from './tracks'

export const usePlaybackStore = defineStore('playback', () => {
  // 状态
  const isPlaying = ref(false)
  const currentTime = ref(0) // 当前播放时间（秒）
  const playbackRate = ref(1) // 播放速率
  const duration = ref(0) // 手动设置的总时长（秒）

  // 动画循环状态
  let animationFrameId: number | null = null
  let lastTime = 0

  // 实际使用的时长：优先使用轨道总时长，其次使用手动设置的时长
  const effectiveDuration = computed(() => {
    const tracksStore = useTracksStore()
    const tracksDuration = tracksStore.totalDuration
    // 使用轨道时长和手动设置时长中的较大值
    return Math.max(tracksDuration, duration.value)
  })

  // 计算属性：格式化时间 HH:MM:SS:FF
  const formattedCurrentTime = computed(() => formatTime(currentTime.value))
  const formattedDuration = computed(() => formatTime(effectiveDuration.value))

  // 方法：格式化时间
  function formatTime(seconds: number, fps = 30): string {
    const totalFrames = Math.floor(seconds * fps)
    const hours = Math.floor(totalFrames / (fps * 3600))
    const minutes = Math.floor((totalFrames % (fps * 3600)) / (fps * 60))
    const secs = Math.floor((totalFrames % (fps * 60)) / fps)
    const frames = totalFrames % fps

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}:${String(frames).padStart(2, '0')}`
  }

  // 动画循环
  function loop(timestamp: number) {
    if (!isPlaying.value) return

    if (lastTime > 0) {
      const deltaTime = (timestamp - lastTime) / 1000
      const newTime = currentTime.value + deltaTime * playbackRate.value
      const maxDuration = effectiveDuration.value

      if (newTime >= maxDuration) {
        currentTime.value = maxDuration
        pause()
        return
      }

      currentTime.value = newTime
    }

    lastTime = timestamp
    animationFrameId = requestAnimationFrame(loop)
  }

  // 开始循环
  function startLoop() {
    lastTime = 0
    animationFrameId = requestAnimationFrame(loop)
  }

  // 停止循环
  function stopLoop() {
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId)
      animationFrameId = null
    }
    lastTime = 0
  }

  // 方法：播放
  function play() {
    if (isPlaying.value) return
    isPlaying.value = true
    startLoop()
  }

  // 方法：暂停
  function pause() {
    if (!isPlaying.value) return
    isPlaying.value = false
    stopLoop()
  }

  // 方法：切换播放/暂停
  function togglePlay() {
    if (isPlaying.value) {
      pause()
    } else {
      play()
    }
  }

  // 方法：跳转到指定时间
  function seekTo(time: number) {
    // 当 effectiveDuration 为 0 时，允许跳转到任意非负时间（用于重置后或空轨道状态）
    const maxTime = effectiveDuration.value > 0 ? effectiveDuration.value : Infinity
    currentTime.value = Math.max(0, Math.min(time, maxTime))
  }

  // 方法：设置播放速率
  function setPlaybackRate(rate: number) {
    playbackRate.value = rate
  }

  // 方法：设置总时长
  function setDuration(dur: number) {
    duration.value = dur
  }

  // 方法：微调时间（用于快捷键）
  function adjustTime(delta: number) {
    const maxTime = effectiveDuration.value
    currentTime.value = Math.max(0, Math.min(currentTime.value + delta, maxTime))
  }

  // 方法：重置
  function reset() {
    pause()
    currentTime.value = 0
    playbackRate.value = 1
    duration.value = 0
  }

  return {
    // 状态
    isPlaying,
    currentTime,
    playbackRate,
    duration,
    effectiveDuration,

    // 计算属性
    formattedCurrentTime,
    formattedDuration,

    // 方法
    formatTime,
    play,
    pause,
    togglePlay,
    seekTo,
    setPlaybackRate,
    setDuration,
    adjustTime,
    reset
  }
})

