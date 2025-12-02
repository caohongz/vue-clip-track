import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Track, Clip, ClipType, TrackType, MediaClip, TransitionClip } from '@/types'
import { normalizeTime } from '@/utils/helpers'

export const useTracksStore = defineStore('tracks', () => {
  // 状态
  const tracks = ref<Track[]>([])
  const selectedClipIds = ref<Set<string>>(new Set())

  // 剪贴板状态
  const clipboard = ref<{
    clips: Clip[]
    operation: 'copy' | 'cut' | null
  }>({
    clips: [],
    operation: null
  })

  // 计算属性
  const mainTrack = computed(() => tracks.value.find((t) => t.isMain))

  const sortedTracks = computed(() => {
    return [...tracks.value].sort((a, b) => {
      // 定义轨道类型的优先级顺序，同类型的轨道会排在一起
      // 顺序：其他类型 < 特效 < 滤镜 < 贴纸 < 字幕 < 视频（非主轨道）< 主轨道 < 音频
      const getTypeWeight = (track: Track): number => {
        if (track.isMain) return 100 // 主轨道

        const typeWeights: Record<string, number> = {
          effect: 10,
          filter: 20,
          sticker: 30,
          subtitle: 40,
          video: 50,
          audio: 200 // 音频轨道放在最下面
        }

        return typeWeights[track.type] || 0
      }

      const weightA = getTypeWeight(a)
      const weightB = getTypeWeight(b)

      // 首先按类型权重排序
      if (weightA !== weightB) {
        return weightA - weightB
      }

      // 同类型按 order 排序
      return a.order - b.order
    })
  })

  const totalDuration = computed(() => {
    let maxDuration = 0
    tracks.value.forEach((track) => {
      track.clips.forEach((clip) => {
        if (clip.endTime > maxDuration) {
          maxDuration = clip.endTime
        }
      })
    })
    return maxDuration
  })

  const selectedClips = computed(() => {
    const clips: Clip[] = []
    tracks.value.forEach((track) => {
      track.clips.forEach((clip) => {
        if (selectedClipIds.value.has(clip.id)) {
          clips.push(clip)
        }
      })
    })
    return clips
  })

  /**
   * 规范化媒体 Clip 的时长（根据 playbackRate 修正 endTime）
   * @param clip - 要规范化的 clip
   * @returns 规范化后的 clip
   */
  function normalizeClipDuration(clip: Clip): Clip {
    if ((clip.type === 'video' || clip.type === 'audio') && 'playbackRate' in clip) {
      const mediaClip = clip as MediaClip
      const playbackRate = mediaClip.playbackRate || 1

      // 如果有裁剪信息，使用裁剪后的时长
      if (typeof mediaClip.trimStart === 'number' && typeof mediaClip.trimEnd === 'number') {
        const trimmedDuration = mediaClip.trimEnd - mediaClip.trimStart
        const correctTrackDuration = normalizeTime(trimmedDuration / playbackRate)
        return {
          ...mediaClip,
          endTime: normalizeTime(mediaClip.startTime + correctTrackDuration)
        }
      }
    }
    return clip
  }

  /**
   * 规范化轨道数据（处理所有 clips 的时长）
   * @param tracksData - 轨道数据数组
   * @returns 规范化后的轨道数据
   */
  function normalizeTracks(tracksData: Track[]): Track[] {
    return tracksData.map((track) => ({
      ...track,
      clips: track.clips ? track.clips.map(normalizeClipDuration) : []
    }))
  }

  /**
   * 设置轨道数据（会自动规范化 clips 的时长）
   * @param tracksData - 轨道数据数组
   */
  function setTracks(tracksData: Track[]) {
    tracks.value = normalizeTracks(tracksData)
  }

  // 方法：添加轨道
  function addTrack(track: Track) {
    // 处理轨道中的媒体 clips，自动根据 playbackRate 修正 endTime
    if (track.clips && track.clips.length > 0) {
      track.clips = track.clips.map(normalizeClipDuration)
    }
    tracks.value.push(track)
  }

  // 方法：删除轨道
  function removeTrack(trackId: string) {
    const index = tracks.value.findIndex((t) => t.id === trackId)
    if (index !== -1) {
      tracks.value.splice(index, 1)
    }
  }

  // 方法：更新轨道
  function updateTrack(trackId: string, updates: Partial<Track>) {
    const track = tracks.value.find((t) => t.id === trackId)
    if (track) {
      Object.assign(track, updates)
    }
  }

  // 方法：在指定轨道上方添加轨道
  function addTrackAbove(trackId: string, type: TrackType): Track | null {
    const index = tracks.value.findIndex(t => t.id === trackId)
    if (index === -1) return null

    const newTrack: Track = {
      id: `track-${Date.now()}`,
      type,
      name: `${type} ${getTrackCountByType(type) + 1}`,
      visible: true,
      locked: false,
      clips: [],
      order: index
    }

    // 更新后续轨道的 order
    tracks.value.forEach(t => {
      if (t.order >= index) {
        t.order++
      }
    })

    tracks.value.splice(index, 0, newTrack)
    return newTrack
  }

  // 方法：在指定轨道下方添加轨道
  function addTrackBelow(trackId: string, type: TrackType): Track | null {
    const index = tracks.value.findIndex(t => t.id === trackId)
    if (index === -1) return null

    const newTrack: Track = {
      id: `track-${Date.now()}`,
      type,
      name: `${type} ${getTrackCountByType(type) + 1}`,
      visible: true,
      locked: false,
      clips: [],
      order: index + 1
    }

    // 更新后续轨道的 order
    tracks.value.forEach(t => {
      if (t.order > index) {
        t.order++
      }
    })

    tracks.value.splice(index + 1, 0, newTrack)
    return newTrack
  }

  // 方法：获取指定类型的轨道数量
  function getTrackCountByType(type: TrackType): number {
    return tracks.value.filter((t) => t.type === type).length
  }

  // 方法：添加 Clip
  function addClip(trackId: string, clip: Clip) {
    const track = tracks.value.find((t) => t.id === trackId)
    if (track) {
      // 自动根据 playbackRate 修正 endTime
      const normalizedClip = normalizeClipDuration(clip)
      track.clips.push(normalizedClip)
    }
  }

  // 方法：删除 Clip
  function removeClip(clipId: string) {
    tracks.value.forEach((track) => {
      const index = track.clips.findIndex((c) => c.id === clipId)
      if (index !== -1) {
        const clip = track.clips[index]

        // 如果是视频类型的 clip，检查并删除关联的转场
        if (clip.type === 'video') {
          // 查找与该 clip 相关联的转场（转场的中心时间在 clip 边界附近）
          const relatedTransitions = track.clips.filter((c) => {
            if (c.type !== 'transition') return false
            const trans = c as TransitionClip
            const centerTime = (trans.startTime + trans.endTime) / 2
            // 检查转场是否与当前 clip 的开始或结束位置相关联
            const isAtStart = Math.abs(centerTime - clip.startTime) < trans.transitionDuration
            const isAtEnd = Math.abs(centerTime - clip.endTime) < trans.transitionDuration
            return isAtStart || isAtEnd
          })

          // 删除关联的转场
          relatedTransitions.forEach((trans) => {
            const transIndex = track.clips.findIndex((c) => c.id === trans.id)
            if (transIndex !== -1) {
              track.clips.splice(transIndex, 1)
              selectedClipIds.value.delete(trans.id)
            }
          })

          // 重新查找当前 clip 的索引（因为可能因为删除转场而改变）
          const newIndex = track.clips.findIndex((c) => c.id === clipId)
          if (newIndex !== -1) {
            track.clips.splice(newIndex, 1)
          }
        } else {
          track.clips.splice(index, 1)
        }
      }
    })
    selectedClipIds.value.delete(clipId)
  }

  // 方法：批量删除 Clip
  function removeClips(clipIds: string[]) {
    clipIds.forEach((id) => removeClip(id))
  }

  /**
   * 深度合并对象
   * 用于更新嵌套属性时保留未指定的字段
   */
  function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
    const result = { ...target }

    for (const key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        const sourceValue = source[key]
        const targetValue = target[key]

        // 如果源值是 null 或 undefined，直接赋值
        if (sourceValue === null || sourceValue === undefined) {
          result[key] = sourceValue as T[Extract<keyof T, string>]
        }
        // 如果两个值都是普通对象（非数组），递归合并
        else if (
          typeof sourceValue === 'object' &&
          !Array.isArray(sourceValue) &&
          typeof targetValue === 'object' &&
          targetValue !== null &&
          !Array.isArray(targetValue)
        ) {
          result[key] = deepMerge(targetValue, sourceValue)
        }
        // 否则直接覆盖（包括数组）
        else {
          result[key] = sourceValue as T[Extract<keyof T, string>]
        }
      }
    }

    return result
  }

  // 方法：更新 Clip（支持深度合并嵌套对象）
  function updateClip(clipId: string, updates: Partial<Clip>) {
    tracks.value.forEach((track) => {
      const clipIndex = track.clips.findIndex((c) => c.id === clipId)
      if (clipIndex !== -1) {
        const clip = track.clips[clipIndex]
        // 使用深度合并，保留嵌套对象中未指定的属性
        track.clips[clipIndex] = deepMerge(clip, updates) as Clip
      }
    })
  }

  // 方法：移动 Clip 到其他轨道
  function moveClipToTrack(clipId: string, targetTrackId: string) {
    let clip: Clip | null = null
    let sourceTrackId = ''

    // 找到并移除 clip
    for (const track of tracks.value) {
      const index = track.clips.findIndex((c) => c.id === clipId)
      if (index !== -1) {
        clip = track.clips.splice(index, 1)[0]
        sourceTrackId = track.id
        break
      }
    }

    // 添加到目标轨道
    if (clip) {
      const targetTrack = tracks.value.find((t) => t.id === targetTrackId)
      if (targetTrack) {
        clip.trackId = targetTrackId
        targetTrack.clips.push(clip)
      }
    }
  }

  // 方法：获取 Clip
  function getClip(clipId: string): Clip | undefined {
    for (const track of tracks.value) {
      const clip = track.clips.find((c) => c.id === clipId)
      if (clip) {
        return clip
      }
    }
    return undefined
  }

  // 方法：选中 Clip（单选或追加选择）
  function selectClip(clipId: string, append = false) {
    if (!append) {
      selectedClipIds.value.clear()
    }
    selectedClipIds.value.add(clipId)
  }

  // 方法：切换 Clip 选中状态
  function toggleClipSelection(clipId: string) {
    if (selectedClipIds.value.has(clipId)) {
      selectedClipIds.value.delete(clipId)
    } else {
      selectedClipIds.value.add(clipId)
    }
  }

  // 方法：取消选中 Clip
  function deselectClip(clipId: string) {
    selectedClipIds.value.delete(clipId)
  }

  // 方法：清空选中
  function clearSelection() {
    selectedClipIds.value.clear()
  }

  // 方法：检测时间区间是否重叠
  function hasOverlap(
    trackId: string,
    startTime: number,
    endTime: number,
    excludeClipId?: string
  ): boolean {
    const track = tracks.value.find((t) => t.id === trackId)
    if (!track) return false

    return track.clips.some((clip) => {
      if (excludeClipId && clip.id === excludeClipId) return false
      return clip.startTime < endTime && clip.endTime > startTime
    })
  }

  // 方法：重置所有状态
  function reset() {
    tracks.value = []
    selectedClipIds.value.clear()
  }

  // 方法：清理空轨道（删除没有 clip 且不是主轨道的轨道）
  function cleanupEmptyTracks() {
    const tracksToRemove: string[] = []

    tracks.value.forEach((track) => {
      // 主轨道不删除
      if (track.isMain) return

      // 检查是否有非转场的 clip
      const hasNonTransitionClips = track.clips.some(
        (clip) => clip.type !== 'transition'
      )

      // 如果没有非转场的 clip，标记为删除
      if (!hasNonTransitionClips) {
        tracksToRemove.push(track.id)
      }
    })

    // 删除标记的轨道
    tracksToRemove.forEach((trackId) => {
      removeTrack(trackId)
    })
  }

  // 方法：复制选中的 Clip
  function copyClips(clipIds?: string[]) {
    const ids = clipIds || Array.from(selectedClipIds.value)
    if (ids.length === 0) return false

    const clipsToCopy: Clip[] = []
    ids.forEach((id) => {
      const clip = getClip(id)
      if (clip) {
        // 深拷贝 clip
        clipsToCopy.push(JSON.parse(JSON.stringify(clip)))
      }
    })

    if (clipsToCopy.length > 0) {
      clipboard.value = {
        clips: clipsToCopy,
        operation: 'copy'
      }
      return true
    }
    return false
  }

  // 方法：剪切选中的 Clip
  function cutClips(clipIds?: string[]) {
    const ids = clipIds || Array.from(selectedClipIds.value)
    if (ids.length === 0) return false

    const clipsToCut: Clip[] = []
    ids.forEach((id) => {
      const clip = getClip(id)
      if (clip) {
        // 深拷贝 clip
        clipsToCut.push(JSON.parse(JSON.stringify(clip)))
      }
    })

    if (clipsToCut.length > 0) {
      clipboard.value = {
        clips: clipsToCut,
        operation: 'cut'
      }
      return true
    }
    return false
  }

  // 方法：查找不重叠的粘贴位置
  function findNonOverlappingPosition(
    trackId: string,
    startTime: number,
    duration: number,
    excludeClipIds: string[] = []
  ): number {
    const track = tracks.value.find((t) => t.id === trackId)
    if (!track) return startTime

    // 获取轨道上的所有 clips（排除指定的 clips）
    const existingClips = track.clips
      .filter((c) => !excludeClipIds.includes(c.id))
      .sort((a, b) => a.startTime - b.startTime)

    if (existingClips.length === 0) return startTime

    let proposedStart = startTime
    let proposedEnd = startTime + duration

    // 检查是否与现有 clips 重叠，如果重叠则调整位置
    for (const clip of existingClips) {
      // 检查是否重叠
      if (proposedStart < clip.endTime && proposedEnd > clip.startTime) {
        // 有重叠，将位置移动到该 clip 的末尾
        proposedStart = clip.endTime
        proposedEnd = proposedStart + duration
      }
    }

    return Math.max(0, proposedStart)
  }

  // 方法：粘贴 Clip（带碰撞检测）
  function pasteClips(targetTrackId: string, startTime: number): Clip[] | null {
    if (clipboard.value.clips.length === 0) return null

    const track = tracks.value.find((t) => t.id === targetTrackId)
    if (!track) return null

    const pastedClips: Clip[] = []
    const generateClipId = () => `clip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // 计算最小起始时间（用于计算相对位置）
    const minStartTime = Math.min(...clipboard.value.clips.map((c) => c.startTime))

    // 计算剪贴板中所有 clips 的总时间范围
    const totalDuration = Math.max(...clipboard.value.clips.map((c) => c.endTime - minStartTime))

    // 剪切操作时，排除原始 clips 进行碰撞检测
    const excludeIds = clipboard.value.operation === 'cut'
      ? clipboard.value.clips.map((c) => c.id)
      : []

    // 查找不重叠的起始位置
    const adjustedStartTime = findNonOverlappingPosition(
      targetTrackId,
      startTime,
      totalDuration,
      excludeIds
    )

    clipboard.value.clips.forEach((clipData) => {
      const clipDuration = clipData.endTime - clipData.startTime
      const relativeStart = clipData.startTime - minStartTime

      // 创建新的 clip
      const newClip: Clip = {
        ...clipData,
        id: generateClipId(),
        trackId: targetTrackId,
        // 使用调整后的位置，保持相对位置
        startTime: adjustedStartTime + relativeStart,
        endTime: adjustedStartTime + relativeStart + clipDuration,
        selected: false
      }

      track.clips.push(newClip)
      pastedClips.push(newClip)
    })

    // 如果是剪切操作，删除原始 clips
    if (clipboard.value.operation === 'cut') {
      clipboard.value.clips.forEach((clipData) => {
        removeClip(clipData.id)
      })
      // 清空剪贴板
      clipboard.value = { clips: [], operation: null }
    }

    return pastedClips.length > 0 ? pastedClips : null
  }

  // 方法：检查剪贴板是否有内容
  function hasClipboardContent(): boolean {
    return clipboard.value.clips.length > 0
  }

  // 方法：获取剪贴板内容
  function getClipboardContent() {
    return clipboard.value
  }

  // 方法：清空剪贴板
  function clearClipboard() {
    clipboard.value = { clips: [], operation: null }
  }

  // 方法：分割 Clip
  function splitClip(clipId: string, splitTime: number): { leftClip: Clip; rightClip: Clip } | null {
    // 找到 clip 和其所在的轨道
    let foundClip: Clip | null = null
    let foundTrack: Track | null = null
    let clipIndex = -1

    for (const track of tracks.value) {
      const index = track.clips.findIndex((c) => c.id === clipId)
      if (index !== -1) {
        foundClip = track.clips[index]
        foundTrack = track
        clipIndex = index
        break
      }
    }

    if (!foundClip || !foundTrack || clipIndex === -1) {
      return null
    }

    // 检查分割时间是否在 clip 范围内
    if (splitTime <= foundClip.startTime || splitTime >= foundClip.endTime) {
      return null
    }

    // 生成新的 clip ID
    const generateClipId = () => `clip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // 创建左侧 clip（修改原 clip）
    const leftClip: Clip = {
      ...JSON.parse(JSON.stringify(foundClip)),
      endTime: splitTime
    }

    // 创建右侧 clip（新 clip）
    const rightClip: Clip = {
      ...JSON.parse(JSON.stringify(foundClip)),
      id: generateClipId(),
      startTime: splitTime,
      selected: false
    }

    // 处理媒体类型的 clip（视频/音频）的 trimStart/trimEnd
    if ('trimStart' in foundClip && 'trimEnd' in foundClip && 'originalDuration' in foundClip) {
      const mediaClip = foundClip as MediaClip
      const clipDuration = mediaClip.endTime - mediaClip.startTime
      const trimDuration = mediaClip.trimEnd - mediaClip.trimStart
      const timeRatio = trimDuration / clipDuration

      // 计算分割点在原始媒体中的位置
      const splitOffset = (splitTime - mediaClip.startTime) * timeRatio
      const newTrimSplit = mediaClip.trimStart + splitOffset

        // 左侧 clip 的 trimEnd 更新
        ; (leftClip as MediaClip).trimEnd = newTrimSplit

        // 右侧 clip 的 trimStart 更新
        ; (rightClip as MediaClip).trimStart = newTrimSplit
    }

    // 更新轨道中的 clips
    foundTrack.clips.splice(clipIndex, 1, leftClip, rightClip)

    // 如果原 clip 被选中，保持左侧 clip 选中状态
    if (selectedClipIds.value.has(clipId)) {
      selectedClipIds.value.delete(clipId)
      selectedClipIds.value.add(leftClip.id)
    }

    return { leftClip, rightClip }
  }

  /**
   * 设置媒体 Clip 的播放倍速
   * 调整倍速会改变 clip 在轨道上的时长
   * 
   * @param clipId - Clip ID
   * @param newPlaybackRate - 新的播放倍速（0.25 ~ 4）
   * @param options - 配置选项
   * @returns 是否成功设置
   */
  function setClipPlaybackRate(
    clipId: string,
    newPlaybackRate: number,
    options?: {
      /** 是否允许缩短时长（向左收缩结束时间） */
      allowShrink?: boolean
      /** 是否允许扩展时长（可能导致碰撞） */
      allowExpand?: boolean
      /** 是否自动处理碰撞（推挤后续 clips） */
      handleCollision?: boolean
      /** 是否保持 clip 开始位置不变，默认为 true */
      keepStartTime?: boolean
    }
  ): {
    success: boolean
    message?: string
    removedTransitions?: string[]
    adjustedClips?: Array<{ id: string; startTime: number; endTime: number }>
  } {
    const {
      allowShrink = true,
      allowExpand = true,
      handleCollision = true,
      keepStartTime = true
    } = options || {}

    // 验证倍速范围
    if (newPlaybackRate < 0.25 || newPlaybackRate > 4) {
      return { success: false, message: '播放倍速必须在 0.25 到 4 之间' }
    }

    // 查找 clip 和所在轨道
    let foundClip: Clip | null = null
    let foundTrack: Track | null = null

    for (const track of tracks.value) {
      const clip = track.clips.find((c) => c.id === clipId)
      if (clip) {
        foundClip = clip
        foundTrack = track
        break
      }
    }

    if (!foundClip || !foundTrack) {
      return { success: false, message: '未找到指定的 Clip' }
    }

    // 只有媒体类型（video/audio）的 clip 才能调整倍速
    if (foundClip.type !== 'video' && foundClip.type !== 'audio') {
      return { success: false, message: '只有视频或音频类型的 Clip 可以调整倍速' }
    }

    const mediaClip = foundClip as MediaClip
    const currentPlaybackRate = mediaClip.playbackRate || 1

    // 如果倍速相同，直接返回
    if (Math.abs(currentPlaybackRate - newPlaybackRate) < 0.001) {
      return { success: true }
    }

    // 计算可用的媒体时长（考虑裁剪）
    const trimmedDuration = mediaClip.trimEnd - mediaClip.trimStart

    // 计算当前轨道时长
    const currentTrackDuration = mediaClip.endTime - mediaClip.startTime

    // 计算新的轨道时长
    // 公式：新时长 = 裁剪后的媒体时长 / 新倍速
    const newTrackDuration = normalizeTime(trimmedDuration / newPlaybackRate)

    // 判断是扩展还是收缩
    const isExpanding = newTrackDuration > currentTrackDuration
    const isShrinking = newTrackDuration < currentTrackDuration

    // 检查是否允许扩展/收缩
    if (isExpanding && !allowExpand) {
      return { success: false, message: '不允许扩展时长' }
    }
    if (isShrinking && !allowShrink) {
      return { success: false, message: '不允许收缩时长' }
    }

    // 计算新的时间范围
    let newStartTime: number
    let newEndTime: number

    if (keepStartTime) {
      newStartTime = mediaClip.startTime
      newEndTime = normalizeTime(mediaClip.startTime + newTrackDuration)
    } else {
      // 保持结束位置不变
      newEndTime = mediaClip.endTime
      newStartTime = normalizeTime(mediaClip.endTime - newTrackDuration)

      // 确保不会小于 0
      if (newStartTime < 0) {
        newStartTime = 0
        newEndTime = normalizeTime(newTrackDuration)
      }
    }

    const removedTransitions: string[] = []
    const adjustedClips: Array<{ id: string; startTime: number; endTime: number }> = []

    // 1. 检测并处理转场
    // 查找当前 clip 两端的转场
    const transitions = foundTrack.clips.filter((c) => {
      if (c.type !== 'transition') return false
      const trans = c as TransitionClip
      const centerTime = (trans.startTime + trans.endTime) / 2
      // 检查转场是否与当前 clip 的边界相关联
      const isAtStart = Math.abs(centerTime - mediaClip.startTime) < trans.transitionDuration
      const isAtEnd = Math.abs(centerTime - mediaClip.endTime) < trans.transitionDuration
      return isAtStart || isAtEnd
    })

    // 2. 检测碰撞
    // 获取轨道上的其他非转场 clips
    const otherClips = foundTrack.clips.filter((c) =>
      c.id !== clipId && c.type !== 'transition'
    ).sort((a, b) => a.startTime - b.startTime)

    // 检测新时间范围是否与其他 clips 碰撞
    const collidingClips = otherClips.filter((c) =>
      newStartTime < c.endTime && newEndTime > c.startTime
    )

    // 3. 处理碰撞
    if (collidingClips.length > 0) {
      if (!handleCollision) {
        return { success: false, message: '会与其他 Clip 产生碰撞' }
      }

      // 找到需要推挤的 clips（在当前 clip 右侧的）
      const rightSideClips = collidingClips.filter((c) => c.startTime >= mediaClip.startTime)

      // 计算需要推挤的距离
      const pushDistance = newEndTime - Math.min(...rightSideClips.map((c) => c.startTime))

      if (pushDistance > 0) {
        // 推挤右侧的所有 clips
        const clipsToAdjust = otherClips.filter((c) => c.startTime >= mediaClip.endTime)

        for (const clip of clipsToAdjust) {
          const adjustedStartTime = normalizeTime(clip.startTime + pushDistance)
          const adjustedEndTime = normalizeTime(clip.endTime + pushDistance)

          updateClip(clip.id, {
            startTime: adjustedStartTime,
            endTime: adjustedEndTime
          })

          adjustedClips.push({
            id: clip.id,
            startTime: adjustedStartTime,
            endTime: adjustedEndTime
          })
        }
      }
    }

    // 4. 更新当前 clip 的倍速和时间
    updateClip(clipId, {
      playbackRate: newPlaybackRate,
      startTime: newStartTime,
      endTime: newEndTime
    } as Partial<MediaClip>)

    // 5. 处理转场有效性
    // 检查每个转场是否仍然有效（两端的 clips 是否仍然相接）
    for (const trans of transitions) {
      const transClip = trans as TransitionClip
      const centerTime = (transClip.startTime + transClip.endTime) / 2

      // 查找转场前后的 clips
      const updatedClips = foundTrack.clips.filter((c) => c.type !== 'transition')

      // 获取更新后的当前 clip 信息
      const currentClipUpdated = { ...mediaClip, startTime: newStartTime, endTime: newEndTime }

      // 判断这个转场是在当前 clip 的开始还是结束位置
      const wasAtStart = Math.abs(centerTime - mediaClip.startTime) < transClip.transitionDuration
      const wasAtEnd = Math.abs(centerTime - mediaClip.endTime) < transClip.transitionDuration

      let stillValid = false

      if (wasAtEnd) {
        // 转场在当前 clip 的结束位置
        // 查找新的结束位置是否有相邻的 clip
        const adjacentClip = updatedClips.find((c) =>
          c.id !== clipId && Math.abs(c.startTime - newEndTime) < 0.01
        )
        stillValid = !!adjacentClip

        // 如果仍然有效，更新转场的位置
        if (stillValid && adjacentClip) {
          const newCenterTime = (newEndTime + adjacentClip.startTime) / 2
          const halfDuration = transClip.transitionDuration / 2
          updateClip(trans.id, {
            startTime: normalizeTime(newCenterTime - halfDuration),
            endTime: normalizeTime(newCenterTime + halfDuration)
          })
        }
      } else if (wasAtStart && !keepStartTime) {
        // 转场在当前 clip 的开始位置（只有当开始位置改变时才需要检查）
        const adjacentClip = updatedClips.find((c) =>
          c.id !== clipId && Math.abs(c.endTime - newStartTime) < 0.01
        )
        stillValid = !!adjacentClip

        if (stillValid && adjacentClip) {
          const newCenterTime = (adjacentClip.endTime + newStartTime) / 2
          const halfDuration = transClip.transitionDuration / 2
          updateClip(trans.id, {
            startTime: normalizeTime(newCenterTime - halfDuration),
            endTime: normalizeTime(newCenterTime + halfDuration)
          })
        }
      } else if (wasAtStart && keepStartTime) {
        // 开始位置没变，转场仍然有效
        stillValid = true
      }

      // 如果转场不再有效，删除它
      if (!stillValid) {
        removeClip(trans.id)
        removedTransitions.push(trans.id)
      }
    }

    return {
      success: true,
      removedTransitions: removedTransitions.length > 0 ? removedTransitions : undefined,
      adjustedClips: adjustedClips.length > 0 ? adjustedClips : undefined
    }
  }

  /**
   * 获取媒体 Clip 在指定倍速下的预计时长
   * 用于 UI 预览
   */
  function getClipDurationAtRate(clipId: string, playbackRate: number): number | null {
    const clip = getClip(clipId)
    if (!clip || (clip.type !== 'video' && clip.type !== 'audio')) {
      return null
    }

    const mediaClip = clip as MediaClip
    const trimmedDuration = mediaClip.trimEnd - mediaClip.trimStart
    return normalizeTime(trimmedDuration / playbackRate)
  }

  /**
   * 检查调整倍速后是否会产生碰撞
   */
  function checkPlaybackRateCollision(
    clipId: string,
    newPlaybackRate: number,
    keepStartTime = true
  ): {
    willCollide: boolean
    collidingClipIds?: string[]
    newDuration?: number
  } {
    const clip = getClip(clipId)
    if (!clip || (clip.type !== 'video' && clip.type !== 'audio')) {
      return { willCollide: false }
    }

    const mediaClip = clip as MediaClip
    const trimmedDuration = mediaClip.trimEnd - mediaClip.trimStart
    const newTrackDuration = normalizeTime(trimmedDuration / newPlaybackRate)

    let newStartTime: number
    let newEndTime: number

    if (keepStartTime) {
      newStartTime = mediaClip.startTime
      newEndTime = normalizeTime(mediaClip.startTime + newTrackDuration)
    } else {
      newEndTime = mediaClip.endTime
      newStartTime = normalizeTime(Math.max(0, mediaClip.endTime - newTrackDuration))
    }

    // 查找轨道
    let foundTrack: Track | null = null
    for (const track of tracks.value) {
      if (track.clips.some((c) => c.id === clipId)) {
        foundTrack = track
        break
      }
    }

    if (!foundTrack) {
      return { willCollide: false, newDuration: newTrackDuration }
    }

    // 检测碰撞
    const collidingClips = foundTrack.clips.filter((c) =>
      c.id !== clipId &&
      c.type !== 'transition' &&
      newStartTime < c.endTime &&
      newEndTime > c.startTime
    )

    return {
      willCollide: collidingClips.length > 0,
      collidingClipIds: collidingClips.map((c) => c.id),
      newDuration: newTrackDuration
    }
  }

  /**
   * 计算媒体 Clip 在轨道上应该显示的时长
   * 用于在创建 clip 之前计算正确的 endTime
   * 
   * @param trimStart - 裁剪起点（秒）
   * @param trimEnd - 裁剪终点（秒）
   * @param playbackRate - 播放倍速，默认为 1
   * @returns 在轨道上显示的时长（秒）
   */
  function calculateTrackDuration(
    trimStart: number,
    trimEnd: number,
    playbackRate: number = 1
  ): number {
    const trimmedDuration = trimEnd - trimStart
    return normalizeTime(trimmedDuration / playbackRate)
  }

  return {
    // 状态
    tracks,
    selectedClipIds,
    clipboard,

    // 计算属性
    mainTrack,
    sortedTracks,
    totalDuration,
    selectedClips,

    // 方法
    addTrack,
    addTrackAbove,
    addTrackBelow,
    removeTrack,
    updateTrack,
    getTrackCountByType,
    setTracks,
    normalizeTracks,
    normalizeClipDuration,
    addClip,
    removeClip,
    removeClips,
    updateClip,
    moveClipToTrack,
    getClip,
    selectClip,
    toggleClipSelection,
    deselectClip,
    clearSelection,
    hasOverlap,
    reset,
    cleanupEmptyTracks,
    // 剪贴板操作
    copyClips,
    cutClips,
    pasteClips,
    hasClipboardContent,
    getClipboardContent,
    clearClipboard,
    splitClip,
    // 倍速控制
    setClipPlaybackRate,
    getClipDurationAtRate,
    checkPlaybackRateCollision,
    calculateTrackDuration
  }
})

