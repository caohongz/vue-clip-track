import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Clip, Track, TrackType } from '@/types';
import { useTracksStore } from './tracks';
import { useScaleStore } from './scale';
import { useHistoryStore } from './history';
import { generateId, normalizeTime } from '@/utils/helpers';

// 预览位置类型
export interface DragPreviewPosition {
  trackId: string;
  startTime: number;
  endTime: number;
  needNewTrack: boolean;
  visible: boolean;
  clipType: string;
}

// 拖拽偏移类型
export interface DragOffset {
  x: number;
  y: number;
}

// 边缘滚动配置
export interface EdgeScrollConfig {
  enabled: boolean;
  edgeThreshold: number; // 距离边缘多少像素时开始滚动
  scrollSpeed: number; // 每帧滚动的像素数
  maxScrollSpeed: number; // 最大滚动速度
}

export const useDragStore = defineStore('drag', () => {
  const tracksStore = useTracksStore();
  const scaleStore = useScaleStore();
  const historyStore = useHistoryStore();

  // 基础拖拽状态
  const isDragging = ref(false);
  const draggedClips = ref<Clip[]>([]);
  const dragStartX = ref(0);
  const dragStartY = ref(0);
  const dragStartTrackId = ref('');
  const dragStartPositions = ref<
    Map<string, { startTime: number; endTime: number; trackId: string }>
  >(new Map());
  const currentMouseX = ref(0);
  const currentMouseY = ref(0);
  const modifierKeys = ref({ shift: false });

  // 配置
  const enableCrossTrackDrag = ref(true);

  // 拖拽偏移（用于 CSS transform）
  const dragOffset = ref<DragOffset>({ x: 0, y: 0 });

  // 边缘滚动配置和状态
  const edgeScrollConfig = ref<EdgeScrollConfig>({
    enabled: true,
    edgeThreshold: 80, // 距离边缘 80px 时开始滚动
    scrollSpeed: 8, // 基础滚动速度
    maxScrollSpeed: 25, // 最大滚动速度
  });
  const scrollContainerRef = ref<HTMLElement | null>(null);
  const scrollbarRef = ref<HTMLElement | null>(null);
  const edgeScrollAnimationId = ref<number | null>(null);
  const onScrollCallback = ref<((left: number) => void) | null>(null);
  // 累积的边缘滚动偏移量（用于计算时间位置，不影响视觉位置）
  const accumulatedScrollOffset = ref(0);

  // 预览放置位置
  const previewPosition = ref<DragPreviewPosition>({
    trackId: '',
    startTime: 0,
    endTime: 0,
    needNewTrack: false,
    visible: false,
    clipType: '',
  });

  // 当前目标轨道ID
  const currentTargetTrackId = ref('');

  // 当前使用的 document（支持 iframe 环境）
  let activeDocument: Document = document;

  // 被拖拽的 clip IDs
  const draggedClipIds = computed(
    () => new Set(draggedClips.value.map((c) => c.id))
  );

  // 设置配置
  function setConfig(config: {
    enableCrossTrackDrag?: boolean;
    edgeScroll?: Partial<EdgeScrollConfig>;
  }) {
    if (config.enableCrossTrackDrag !== undefined) {
      enableCrossTrackDrag.value = config.enableCrossTrackDrag;
    }
    if (config.edgeScroll) {
      Object.assign(edgeScrollConfig.value, config.edgeScroll);
    }
  }

  // 设置滚动容器引用
  function setScrollContainers(
    container: HTMLElement | null,
    scrollbar: HTMLElement | null,
    onScroll?: (left: number) => void
  ) {
    scrollContainerRef.value = container;
    scrollbarRef.value = scrollbar;
    onScrollCallback.value = onScroll || null;
  }

  // 执行滚动
  function performScroll(deltaX: number) {
    if (!scrollbarRef.value) return;

    const newScrollLeft = Math.max(0, scrollbarRef.value.scrollLeft + deltaX);
    scrollbarRef.value.scrollLeft = newScrollLeft;

    // 调用回调更新 scrollLeft 状态
    if (onScrollCallback.value) {
      onScrollCallback.value(newScrollLeft);
    }
  }

  // 边缘滚动检测和执行
  function checkAndPerformEdgeScroll() {
    if (!isDragging.value || !edgeScrollConfig.value.enabled) {
      stopEdgeScroll();
      return;
    }

    const container = scrollContainerRef.value;
    const scrollbar = scrollbarRef.value;
    if (!container || !scrollbar) return;

    const containerRect = container.getBoundingClientRect();
    const { edgeThreshold, scrollSpeed, maxScrollSpeed } =
      edgeScrollConfig.value;

    // 计算鼠标相对于容器的位置
    const mouseRelativeX = currentMouseX.value - containerRect.left;

    let scrollDelta = 0;

    // 检测左边缘
    if (mouseRelativeX < edgeThreshold && scrollbar.scrollLeft > 0) {
      // 距离边缘越近，滚动越快
      const distance = Math.max(0, edgeThreshold - mouseRelativeX);
      const speedFactor = distance / edgeThreshold;
      scrollDelta = -Math.min(
        scrollSpeed + speedFactor * (maxScrollSpeed - scrollSpeed),
        maxScrollSpeed
      );
    }
    // 检测右边缘
    else if (mouseRelativeX > containerRect.width - edgeThreshold) {
      const maxScrollLeft = scrollbar.scrollWidth - scrollbar.clientWidth;
      if (scrollbar.scrollLeft < maxScrollLeft) {
        const distance = Math.max(
          0,
          mouseRelativeX - (containerRect.width - edgeThreshold)
        );
        const speedFactor = distance / edgeThreshold;
        scrollDelta = Math.min(
          scrollSpeed + speedFactor * (maxScrollSpeed - scrollSpeed),
          maxScrollSpeed
        );
      }
    }

    // 执行滚动
    if (scrollDelta !== 0) {
      performScroll(scrollDelta);

      // 滚动时同步更新拖拽位置计算
      // 需要重新触发 handleDragMove 的计算逻辑，但不通过事件
      updateDragPositionAfterScroll(scrollDelta);
    }

    // 继续下一帧检测
    edgeScrollAnimationId.value = requestAnimationFrame(
      checkAndPerformEdgeScroll
    );
  }

  // 滚动后更新拖拽位置（只更新预览位置，不影响视觉跟随）
  function updateDragPositionAfterScroll(scrollDelta: number) {
    if (!isDragging.value || draggedClips.value.length === 0) return;

    // 累积滚动偏移量（用于时间位置计算）
    accumulatedScrollOffset.value += scrollDelta;

    // 视觉偏移保持不变（clip 跟随鼠标）
    const deltaX = currentMouseX.value - dragStartX.value;
    const deltaY = currentMouseY.value - dragStartY.value;
    // dragOffset 不变，clip 视觉位置跟随鼠标

    // 时间位置计算需要加上累积的滚动偏移
    const totalDeltaX = deltaX + accumulatedScrollOffset.value;
    const deltaTime = totalDeltaX / scaleStore.actualPixelsPerSecond;

    const primaryClip = draggedClips.value[0];
    const initialPos = dragStartPositions.value.get(primaryClip.id);
    if (!initialPos) return;

    const isMovingVertically = Math.abs(deltaY) > 40;
    let targetTrackId = dragStartTrackId.value;
    if (enableCrossTrackDrag.value && isMovingVertically) {
      const detectedTrackId = getTargetTrackId(currentMouseY.value);
      if (detectedTrackId) {
        targetTrackId = detectedTrackId;
      }
    }
    currentTargetTrackId.value = targetTrackId;

    let desiredStartTime = normalizeTime(initialPos.startTime + deltaTime);
    if (scaleStore.snapEnabled && !modifierKeys.value.shift) {
      desiredStartTime = snapToPositions(
        desiredStartTime,
        primaryClip,
        targetTrackId
      );
    }
    desiredStartTime = Math.max(0, desiredStartTime);

    const duration = initialPos.endTime - initialPos.startTime;
    const desiredEndTime = desiredStartTime + duration;

    calculatePreviewPosition(
      targetTrackId,
      desiredStartTime,
      desiredEndTime,
      primaryClip.type
    );
  }

  // 开始边缘滚动检测
  function startEdgeScroll() {
    if (edgeScrollAnimationId.value !== null) return;
    edgeScrollAnimationId.value = requestAnimationFrame(
      checkAndPerformEdgeScroll
    );
  }

  // 停止边缘滚动
  function stopEdgeScroll() {
    if (edgeScrollAnimationId.value !== null) {
      cancelAnimationFrame(edgeScrollAnimationId.value);
      edgeScrollAnimationId.value = null;
    }
  }

  // 开始拖拽（单个 clip）
  function startDrag(clip: Clip, event: MouseEvent, doc?: Document) {
    // 转场不能拖拽
    if (clip.type === 'transition') return;

    // 设置当前使用的 document（支持 iframe 环境）
    activeDocument = doc || (event.target as Element)?.ownerDocument || document;

    // 选中该 clip
    tracksStore.selectClip(clip.id);

    // 只拖拽当前 clip
    draggedClips.value = [clip];

    isDragging.value = true;
    dragStartX.value = event.clientX;
    dragStartY.value = event.clientY;
    currentMouseX.value = event.clientX;
    currentMouseY.value = event.clientY;
    dragStartTrackId.value = clip.trackId;
    currentTargetTrackId.value = clip.trackId;

    // 记录当前 clip 的初始位置
    dragStartPositions.value.clear();
    dragStartPositions.value.set(clip.id, {
      startTime: clip.startTime,
      endTime: clip.endTime,
      trackId: clip.trackId,
    });

    // 重置拖拽偏移和预览位置
    dragOffset.value = { x: 0, y: 0 };
    accumulatedScrollOffset.value = 0; // 重置累积滚动偏移
    previewPosition.value = {
      trackId: clip.trackId,
      startTime: clip.startTime,
      endTime: clip.endTime,
      needNewTrack: false,
      visible: false,
      clipType: clip.type,
    };

    activeDocument.addEventListener('mousemove', handleDragMove);
    activeDocument.addEventListener('mouseup', handleDragEnd);

    // 启动边缘滚动检测
    startEdgeScroll();
  }

  // 拖拽移动 - 只计算偏移和预览位置，不更新实际数据
  function handleDragMove(event: MouseEvent) {
    if (!isDragging.value || draggedClips.value.length === 0) return;

    // 更新修饰键状态
    modifierKeys.value.shift = event.shiftKey;

    currentMouseX.value = event.clientX;
    currentMouseY.value = event.clientY;

    // 计算鼠标偏移（用于视觉跟随）
    const deltaX = event.clientX - dragStartX.value;
    const deltaY = event.clientY - dragStartY.value;

    // 更新拖拽偏移（用于 CSS transform，只跟随鼠标）
    dragOffset.value = { x: deltaX, y: deltaY };

    // 计算时间偏移（鼠标移动 + 累积的边缘滚动）
    const totalDeltaX = deltaX + accumulatedScrollOffset.value;
    const deltaTime = totalDeltaX / scaleStore.actualPixelsPerSecond;

    // 获取主 clip 的初始位置
    const primaryClip = draggedClips.value[0];
    const initialPos = dragStartPositions.value.get(primaryClip.id);
    if (!initialPos) return;

    // 判断是否垂直移动
    const isMovingVertically = Math.abs(deltaY) > 40;

    // 确定目标轨道
    let targetTrackId = dragStartTrackId.value;
    if (enableCrossTrackDrag.value && isMovingVertically) {
      const detectedTrackId = getTargetTrackId(currentMouseY.value);
      if (detectedTrackId) {
        targetTrackId = detectedTrackId;
      }
    }
    currentTargetTrackId.value = targetTrackId;

    // 计算期望的新开始时间
    let desiredStartTime = normalizeTime(initialPos.startTime + deltaTime);

    // 吸附处理
    if (scaleStore.snapEnabled && !modifierKeys.value.shift) {
      desiredStartTime = snapToPositions(
        desiredStartTime,
        primaryClip,
        targetTrackId
      );
    }

    // 限制不能小于 0
    desiredStartTime = Math.max(0, desiredStartTime);

    const duration = initialPos.endTime - initialPos.startTime;
    const desiredEndTime = desiredStartTime + duration;

    // 计算预览位置（处理碰撞）
    calculatePreviewPosition(
      targetTrackId,
      desiredStartTime,
      desiredEndTime,
      primaryClip.type
    );
  }

  // 计算预览放置位置（处理碰撞检测）
  function calculatePreviewPosition(
    targetTrackId: string,
    desiredStartTime: number,
    desiredEndTime: number,
    clipType: string
  ) {
    const targetTrack = tracksStore.tracks.find((t) => t.id === targetTrackId);
    const sourceTrackId = dragStartTrackId.value;
    const isCrossTrack = targetTrackId !== sourceTrackId;
    const duration = desiredEndTime - desiredStartTime;

    // 默认预览位置
    let previewStartTime = desiredStartTime;
    let previewEndTime = desiredEndTime;
    let needNewTrack = false;

    if (isCrossTrack) {
      // 跨轨移动逻辑
      if (!targetTrack) {
        needNewTrack = true;
      } else {
        // 检查轨道类型是否匹配
        const desiredTrackType = clipType as TrackType;
        const typeMatches = targetTrack.type === desiredTrackType;

        if (!typeMatches) {
          // 类型不匹配，需要创建新轨道
          needNewTrack = true;
        } else {
          // 类型匹配，检查是否有重叠
          const hasOverlap = wouldOverlapInTrack(
            targetTrackId,
            desiredStartTime,
            desiredEndTime
          );

          if (hasOverlap) {
            // 有重叠，需要创建新轨道
            needNewTrack = true;
          }
        }
      }
    } else {
      // 同轨移动逻辑 - 处理碰撞
      const adjustedPosition = calculateSameTrackPosition(
        targetTrackId,
        desiredStartTime,
        duration
      );
      previewStartTime = adjustedPosition.startTime;
      previewEndTime = adjustedPosition.endTime;
    }

    // 更新预览位置
    previewPosition.value = {
      trackId: targetTrackId,
      startTime: previewStartTime,
      endTime: previewEndTime,
      needNewTrack,
      visible: true,
      clipType,
    };
  }

  // 计算同轨移动的实际放置位置（处理碰撞）
  function calculateSameTrackPosition(
    trackId: string,
    desiredStartTime: number,
    duration: number
  ): { startTime: number; endTime: number } {
    const track = tracksStore.tracks.find((t) => t.id === trackId);
    if (!track) {
      return {
        startTime: desiredStartTime,
        endTime: desiredStartTime + duration,
      };
    }

    const selectedIds = new Set(draggedClips.value.map((c) => c.id));
    const otherClips = track.clips
      .filter((c) => !selectedIds.has(c.id) && c.type !== 'transition')
      .sort((a, b) => a.startTime - b.startTime);

    let finalStartTime = desiredStartTime;
    let finalEndTime = desiredStartTime + duration;

    // 检查与其他 clip 的重叠
    for (const otherClip of otherClips) {
      const wouldOverlap =
        finalStartTime < otherClip.endTime &&
        finalEndTime > otherClip.startTime;

      if (wouldOverlap) {
        // 决定放在前面还是后面
        const movingCenter = (finalStartTime + finalEndTime) / 2;
        const existingCenter = (otherClip.startTime + otherClip.endTime) / 2;
        const position = movingCenter < existingCenter ? 'before' : 'after';

        if (position === 'before') {
          // 放在前面（紧贴 otherClip 的开始位置）
          finalStartTime = normalizeTime(otherClip.startTime - duration);

          // 如果放不下，尝试放到 0 位置
          if (finalStartTime < 0) {
            finalStartTime = 0;

            // 如果 0 位置还是重叠，放到后面
            if (finalStartTime + duration > otherClip.startTime) {
              finalStartTime = normalizeTime(otherClip.endTime);
            }
          }
        } else {
          // 放在后面（紧贴 otherClip 的结束位置）
          finalStartTime = normalizeTime(otherClip.endTime);
        }

        finalEndTime = finalStartTime + duration;
        break; // 找到第一个重叠的就处理
      }
    }

    return { startTime: finalStartTime, endTime: finalEndTime };
  }

  // 检查在指定轨道是否会重叠（排除当前拖拽的 clips）
  function wouldOverlapInTrack(
    trackId: string,
    startTime: number,
    endTime: number
  ): boolean {
    const track = tracksStore.tracks.find((t) => t.id === trackId);
    if (!track) return false;

    const selectedIds = new Set(draggedClips.value.map((c) => c.id));

    return track.clips.some((clip) => {
      if (selectedIds.has(clip.id)) return false;
      if (clip.type === 'transition') return false;
      return clip.startTime < endTime && clip.endTime > startTime;
    });
  }

  // 拖拽结束 - 根据预览位置更新实际数据
  function handleDragEnd() {
    if (!isDragging.value || draggedClips.value.length === 0) {
      resetDragState();
      return;
    }

    const isCrossTrack = currentTargetTrackId.value !== dragStartTrackId.value;

    // 检查是否禁用跨轨但尝试跨轨移动
    if (!enableCrossTrackDrag.value && isCrossTrack) {
      // 禁用跨轨移动，不做任何更改
      resetDragState();
      return;
    }

    if (isCrossTrack) {
      // 跨轨移动
      handleCrossTrackDrop();
    } else {
      // 同轨移动 - 应用预览位置
      applySameTrackPosition();
    }

    // 检测并删除不再相接的转场
    checkAndRemoveOrphanedTransitions();

    // 清理空轨道
    tracksStore.cleanupEmptyTracks();

    // 保存历史
    historyStore.pushSnapshot('移动片段');

    resetDragState();
  }

  // 应用同轨位置
  function applySameTrackPosition() {
    const preview = previewPosition.value;
    const primaryClip = draggedClips.value[0];
    const initialPos = dragStartPositions.value.get(primaryClip.id);
    if (!initialPos) return;

    // 计算时间偏移
    const timeDelta = preview.startTime - initialPos.startTime;

    // 收集所有更新后的 clip 位置
    const updatedClips = new Map<
      string,
      { startTime: number; endTime: number }
    >();

    // 更新所有选中的 clips
    draggedClips.value.forEach((clip) => {
      const pos = dragStartPositions.value.get(clip.id);
      if (pos) {
        const duration = pos.endTime - pos.startTime;
        const newStartTime = normalizeTime(
          Math.max(0, pos.startTime + timeDelta)
        );
        const newEndTime = normalizeTime(newStartTime + duration);

        tracksStore.updateClip(clip.id, {
          startTime: newStartTime,
          endTime: newEndTime,
        });

        updatedClips.set(clip.id, {
          startTime: newStartTime,
          endTime: newEndTime,
        });
      }
    });

    // 调整轨道中的 clips，消除重叠
    resolveTrackOverlaps(preview.trackId, updatedClips);
  }

  // 解决轨道中的 clip 重叠问题
  function resolveTrackOverlaps(
    trackId: string,
    updatedClips: Map<string, { startTime: number; endTime: number }>
  ) {
    const track = tracksStore.tracks.find((t) => t.id === trackId);
    if (!track) {
      return;
    }

    // 获取所有非 transition 的 clips，使用更新后的位置信息
    const clips = [...track.clips]
      .filter((c) => c.type !== 'transition')
      .map((c) => {
        const updated = updatedClips.get(c.id);
        return {
          id: c.id,
          startTime: updated ? updated.startTime : c.startTime,
          endTime: updated ? updated.endTime : c.endTime,
        };
      })
      .sort((a, b) => a.startTime - b.startTime);

    if (clips.length < 2) {
      return;
    }

    // 计算每个 clip 的最终位置，避免重叠
    const updates: Array<{ id: string; startTime: number; endTime: number }> =
      [];

    for (let i = 0; i < clips.length - 1; i++) {
      const currentClip = clips[i];
      const nextClip = clips[i + 1];

      // 检查是否重叠（当前 clip 的结束时间大于下一个 clip 的开始时间）
      if (currentClip.endTime > nextClip.startTime) {
        const duration = nextClip.endTime - nextClip.startTime;

        // 计算新位置
        const newStartTime = normalizeTime(currentClip.endTime);
        const newEndTime = normalizeTime(newStartTime + duration);

        // 更新 clips 数组中的值，以便后续检查能使用最新位置
        nextClip.startTime = newStartTime;
        nextClip.endTime = newEndTime;

        // 记录需要更新的 clip
        updates.push({
          id: nextClip.id,
          startTime: newStartTime,
          endTime: newEndTime,
        });
      }
    }

    // 批量应用所有更新
    updates.forEach((update) => {
      tracksStore.updateClip(update.id, {
        startTime: update.startTime,
        endTime: update.endTime,
      });
    });
  }

  // 处理跨轨放置
  function handleCrossTrackDrop() {
    const preview = previewPosition.value;
    const primaryClip = draggedClips.value[0];
    const initialPos = dragStartPositions.value.get(primaryClip.id);
    if (!initialPos) return;

    const desiredTrackType = primaryClip.type as TrackType;
    let finalTargetTrack: Track | null = null;

    if (preview.needNewTrack) {
      // 需要创建新轨道
      const newTrack = createNewTrack(desiredTrackType);
      tracksStore.addTrack(newTrack);
      finalTargetTrack = newTrack;
    } else {
      // 使用目标轨道
      finalTargetTrack =
        tracksStore.tracks.find((t) => t.id === preview.trackId) || null;
    }

    if (!finalTargetTrack) return;

    // 计算时间偏移
    const timeDelta = preview.startTime - initialPos.startTime;

    // 收集所有更新后的 clip 位置
    const updatedClips = new Map<
      string,
      { startTime: number; endTime: number }
    >();

    // 移动所有选中的 clips
    draggedClips.value.forEach((clip) => {
      const pos = dragStartPositions.value.get(clip.id);
      if (pos) {
        const duration = pos.endTime - pos.startTime;
        const newStartTime = normalizeTime(
          Math.max(0, pos.startTime + timeDelta)
        );
        const newEndTime = normalizeTime(newStartTime + duration);

        // 移动到目标轨道
        if (clip.trackId !== finalTargetTrack!.id) {
          tracksStore.moveClipToTrack(clip.id, finalTargetTrack!.id);
        }

        // 更新时间位置
        tracksStore.updateClip(clip.id, {
          startTime: newStartTime,
          endTime: newEndTime,
        });

        updatedClips.set(clip.id, {
          startTime: newStartTime,
          endTime: newEndTime,
        });
      }
    });

    // 调整目标轨道中的 clips，消除重叠
    resolveTrackOverlaps(finalTargetTrack.id, updatedClips);
  }

  // 重置拖拽状态
  function resetDragState() {
    // 停止边缘滚动
    stopEdgeScroll();

    isDragging.value = false;
    draggedClips.value = [];
    dragStartPositions.value.clear();
    dragOffset.value = { x: 0, y: 0 };
    accumulatedScrollOffset.value = 0; // 重置累积滚动偏移
    previewPosition.value = {
      trackId: '',
      startTime: 0,
      endTime: 0,
      needNewTrack: false,
      visible: false,
      clipType: '',
    };
    currentTargetTrackId.value = '';

    activeDocument.removeEventListener('mousemove', handleDragMove);
    activeDocument.removeEventListener('mouseup', handleDragEnd);
  }

  // 创建新轨道
  function createNewTrack(type: TrackType): Track {
    const trackCount = tracksStore.getTrackCountByType(type);
    const trackNames: Record<string, string> = {
      video: '视频',
      audio: '音频',
      subtitle: '字幕',
      sticker: '贴纸',
      filter: '滤镜',
      effect: '特效',
    };

    return {
      id: generateId('track-'),
      type,
      name: `${trackNames[type] || type}${trackCount + 1}`,
      visible: true,
      locked: false,
      clips: [],
      order: tracksStore.tracks.length,
    };
  }

  // 吸附到附近的时间点
  function snapToPositions(time: number, clip: Clip, trackId: string): number {
    // 按住 Shift 键或未启用吸附时跳过吸附
    if (modifierKeys.value.shift || !scaleStore.snapEnabled) {
      return time;
    }

    const track = tracksStore.tracks.find((t) => t.id === trackId);
    if (!track) return time;

    const snapPositions: number[] = [];
    const selectedIds = new Set(tracksStore.selectedClipIds);

    track.clips.forEach((c) => {
      if (
        c.id !== clip.id &&
        !selectedIds.has(c.id) &&
        c.type !== 'transition'
      ) {
        snapPositions.push(c.startTime);
        snapPositions.push(c.endTime);
      }
    });

    if (snapPositions.length === 0) {
      return time;
    }

    const pixelPosition = scaleStore.timeToPixels(time);
    const snappedPixelPosition = scaleStore.snapToPosition(
      pixelPosition,
      snapPositions.map((t) => scaleStore.timeToPixels(t))
    );

    return normalizeTime(scaleStore.pixelsToTime(snappedPixelPosition));
  }

  // 获取鼠标下方的轨道ID
  function getTargetTrackId(mouseY: number): string | null {
    const trackElements = document.querySelectorAll('.tracks__track');

    for (const element of trackElements) {
      const rect = element.getBoundingClientRect();
      if (mouseY >= rect.top && mouseY <= rect.bottom) {
        const trackId = (element as HTMLElement).dataset.trackId;
        return trackId || null;
      }
    }

    return null;
  }

  // 检测并删除不再相接的转场
  function checkAndRemoveOrphanedTransitions() {
    tracksStore.tracks.forEach((track) => {
      const transitionsToRemove: string[] = [];

      track.clips.forEach((clip) => {
        if (clip.type !== 'transition') return;

        const centerTime = (clip.startTime + clip.endTime) / 2;

        const beforeClip = track.clips.find(
          (c) =>
            c.type !== 'transition' && Math.abs(c.endTime - centerTime) < 0.1
        );

        const afterClip = track.clips.find(
          (c) =>
            c.type !== 'transition' &&
            c !== beforeClip &&
            Math.abs(c.startTime - centerTime) < 0.1
        );

        if (
          !beforeClip ||
          !afterClip ||
          Math.abs(beforeClip.endTime - afterClip.startTime) > 0.1
        ) {
          transitionsToRemove.push(clip.id);
        }
      });

      transitionsToRemove.forEach((clipId) => {
        tracksStore.removeClip(clipId);
      });
    });
  }

  return {
    // 状态
    isDragging,
    draggedClips,
    draggedClipIds,
    dragOffset,
    previewPosition,
    currentTargetTrackId,
    dragStartTrackId,
    edgeScrollConfig,

    // 方法
    setConfig,
    setScrollContainers,
    startDrag,
    handleDragMove,
    handleDragEnd,
    resetDragState,
    startEdgeScroll,
    stopEdgeScroll,
  };
});
