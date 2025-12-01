import { ref } from 'vue';
import { useTracksStore } from '@/stores/tracks';
import { useScaleStore } from '@/stores/scale';
import { useHistoryStore } from '@/stores/history';
import { normalizeTime } from '@/utils/helpers';
import type { Clip, MediaClip, TransitionClip } from '@/types';

// 保存 resize 开始时的关联元素信息
interface LinkedElement {
  id: string;
  type: 'clip' | 'transition';
  originalStartTime: number;
  originalEndTime: number;
  duration: number;
}

export function useResize() {
  const tracksStore = useTracksStore();
  const scaleStore = useScaleStore();
  const historyStore = useHistoryStore();

  const isResizing = ref(false);
  const resizingClip = ref<Clip | null>(null);
  const resizingEdge = ref<'left' | 'right'>('left');
  const resizeStartX = ref(0);
  const resizeStartTime = ref(0);
  const resizeStartEndTime = ref(0);
  // MediaClip 专用：保存初始 trim 值
  const resizeStartTrimStart = ref(0);
  const resizeStartTrimEnd = ref(0);

  // 当前使用的 document（支持 iframe 环境）
  let activeDocument: Document = document;

  // 保存 resize 开始时所有需要联动的元素（按顺序）
  const linkedElementsRight = ref<LinkedElement[]>([]);
  const linkedElementsLeft = ref<LinkedElement[]>([]);

  // 开始调整大小
  function startResize(clip: Clip, edge: 'left' | 'right', event: MouseEvent) {
    // 转场clip不允许拖拽调整大小（通过专门的转场调整功能）
    if (clip.type === 'transition') {
      startTransitionResize(clip as TransitionClip, edge, event);
      return;
    }

    // 设置当前使用的 document（支持 iframe 环境）
    activeDocument = (event.target as Element)?.ownerDocument || document;

    isResizing.value = true;
    resizingClip.value = clip;
    resizingEdge.value = edge;
    resizeStartX.value = event.clientX;
    resizeStartTime.value = clip.startTime;
    resizeStartEndTime.value = clip.endTime;

    // 对于 MediaClip，保存初始 trim 值
    if (clip.type === 'video' || clip.type === 'audio') {
      const mediaClip = clip as MediaClip;
      resizeStartTrimStart.value = mediaClip.trimStart;
      resizeStartTrimEnd.value = mediaClip.trimEnd;
    }

    // 收集所有需要联动的元素
    collectLinkedElements(clip, edge);

    activeDocument.addEventListener('mousemove', handleResizeMove);
    activeDocument.addEventListener('mouseup', handleResizeEnd);
  }

  // 收集所有通过转场连接的元素
  function collectLinkedElements(clip: Clip, edge: 'left' | 'right') {
    linkedElementsRight.value = [];
    linkedElementsLeft.value = [];

    const track = tracksStore.tracks.find(t => t.id === clip.trackId);
    if (!track) return;

    if (edge === 'right') {
      // 收集右侧所有通过转场连接的元素
      const processedIds = new Set<string>([clip.id]);
      collectRightLinkedElements(track.clips, clip.endTime, processedIds);
    } else {
      // 收集左侧所有通过转场连接的元素
      const processedIds = new Set<string>([clip.id]);
      collectLeftLinkedElements(track.clips, clip.startTime, processedIds);
    }
  }

  // 收集右侧连接的元素
  function collectRightLinkedElements(clips: Clip[], currentEndTime: number, processedClipIds: Set<string>) {
    // 查找在当前结束位置右侧的转场（转场的中心点应该在当前位置附近或右侧）
    const transition = clips.find(c => {
      if (c.type !== 'transition') return false;
      const trans = c as TransitionClip;
      const centerTime = (trans.startTime + trans.endTime) / 2;
      // 转场的中心点应该接近当前结束位置（在当前位置 ± 转场时长范围内）
      // 且转场的开始位置不能远小于当前位置（说明是左侧的转场）
      return Math.abs(centerTime - currentEndTime) < trans.transitionDuration &&
        trans.startTime >= currentEndTime - trans.transitionDuration;
    }) as TransitionClip | undefined;

    if (!transition) return;

    // 保存转场信息
    linkedElementsRight.value.push({
      id: transition.id,
      type: 'transition',
      originalStartTime: transition.startTime,
      originalEndTime: transition.endTime,
      duration: transition.transitionDuration,
    });

    // 查找转场右侧的 clip
    const nextClip = clips.find(c =>
      c.type !== 'transition' &&
      !processedClipIds.has(c.id) &&
      // clip 的开始时间应该接近当前结束时间
      Math.abs(c.startTime - currentEndTime) < transition.transitionDuration + 0.5
    );

    if (!nextClip) return;

    // 保存 clip 信息
    linkedElementsRight.value.push({
      id: nextClip.id,
      type: 'clip',
      originalStartTime: nextClip.startTime,
      originalEndTime: nextClip.endTime,
      duration: nextClip.endTime - nextClip.startTime,
    });

    // 递归收集后续元素
    processedClipIds.add(nextClip.id);
    collectRightLinkedElements(clips, nextClip.endTime, processedClipIds);
  }

  // 收集左侧连接的元素
  function collectLeftLinkedElements(clips: Clip[], currentStartTime: number, processedClipIds: Set<string>) {
    // 查找在当前开始位置左侧的转场（转场的中心点应该在当前位置附近或左侧）
    const transition = clips.find(c => {
      if (c.type !== 'transition') return false;
      const trans = c as TransitionClip;
      const centerTime = (trans.startTime + trans.endTime) / 2;
      // 转场的中心点应该接近当前开始位置（在当前位置 ± 转场时长范围内）
      // 且转场的结束位置不能远大于当前位置（说明是右侧的转场）
      return Math.abs(centerTime - currentStartTime) < trans.transitionDuration &&
        trans.endTime <= currentStartTime + trans.transitionDuration;
    }) as TransitionClip | undefined;

    if (!transition) return;

    // 保存转场信息
    linkedElementsLeft.value.push({
      id: transition.id,
      type: 'transition',
      originalStartTime: transition.startTime,
      originalEndTime: transition.endTime,
      duration: transition.transitionDuration,
    });

    // 查找转场左侧的 clip
    const prevClip = clips.find(c =>
      c.type !== 'transition' &&
      !processedClipIds.has(c.id) &&
      Math.abs(c.endTime - currentStartTime) < transition.transitionDuration + 0.5
    );

    if (!prevClip) return;

    // 保存 clip 信息
    linkedElementsLeft.value.push({
      id: prevClip.id,
      type: 'clip',
      originalStartTime: prevClip.startTime,
      originalEndTime: prevClip.endTime,
      duration: prevClip.endTime - prevClip.startTime,
    });
  }

  // 转场专用的resize状态
  const resizingTransition = ref<TransitionClip | null>(null);
  const resizingTransitionEdge = ref<'left' | 'right'>('left');
  const transitionResizeStartDuration = ref(0);

  // 开始调整转场大小
  function startTransitionResize(
    transition: TransitionClip,
    edge: 'left' | 'right',
    event: MouseEvent
  ) {
    // 设置当前使用的 document（支持 iframe 环境）
    activeDocument = (event.target as Element)?.ownerDocument || document;

    isResizing.value = true;
    resizingTransition.value = transition;
    resizingTransitionEdge.value = edge;
    resizeStartX.value = event.clientX;
    transitionResizeStartDuration.value = transition.transitionDuration;

    activeDocument.addEventListener('mousemove', handleTransitionResizeMove);
    activeDocument.addEventListener('mouseup', handleTransitionResizeEnd);
  }

  // 调整转场大小移动
  function handleTransitionResizeMove(event: MouseEvent) {
    if (!isResizing.value || !resizingTransition.value) return;

    // 更新修饰键状态
    modifierKeys.value.shift = event.shiftKey;

    const deltaX = event.clientX - resizeStartX.value;
    const deltaTime = scaleStore.pixelsToTime(deltaX);

    // 计算新的转场时长（取决于拖拽哪一边，双倍变化）
    const deltaDuration =
      resizingTransitionEdge.value === 'left' ? -deltaTime * 2 : deltaTime * 2;
    let newDuration = transitionResizeStartDuration.value + deltaDuration;

    // 限制转场时长在 0.1s 到 5s 之间
    newDuration = Math.max(0.1, Math.min(5, newDuration));

    // 更新转场时长和位置
    updateTransitionDuration(resizingTransition.value, newDuration);
  }

  // 调整转场大小结束
  function handleTransitionResizeEnd() {
    if (isResizing.value) {
      historyStore.pushSnapshot('调整转场时长');
    }

    isResizing.value = false;
    resizingTransition.value = null;

    activeDocument.removeEventListener('mousemove', handleTransitionResizeMove);
    activeDocument.removeEventListener('mouseup', handleTransitionResizeEnd);
  }

  // 更新转场时长（同时调整两侧clip）
  function updateTransitionDuration(
    transition: TransitionClip,
    newDuration: number
  ) {
    const track = tracksStore.tracks.find((t) => t.id === transition.trackId);
    if (!track) return;

    // 找到转场两侧的clips
    const centerTime = (transition.startTime + transition.endTime) / 2;
    const beforeClip = track.clips.find(
      (c) => c.type !== 'transition' && Math.abs(c.endTime - centerTime) < 0.5
    );
    const afterClip = track.clips.find(
      (c) =>
        c.type !== 'transition' &&
        c !== beforeClip &&
        Math.abs(c.startTime - centerTime) < 0.5
    );

    if (beforeClip && afterClip) {
      const newStartTime = normalizeTime(centerTime - newDuration / 2);
      const newEndTime = normalizeTime(centerTime + newDuration / 2);
      const normalizedCenterTime = normalizeTime(centerTime);
      const normalizedDuration = normalizeTime(newDuration);

      // 更新转场
      tracksStore.updateClip(transition.id, {
        startTime: newStartTime,
        endTime: newEndTime,
        transitionDuration: normalizedDuration,
      } as Partial<TransitionClip>);

      // 更新两侧clips的边界
      tracksStore.updateClip(beforeClip.id, {
        endTime: normalizedCenterTime,
      });
      tracksStore.updateClip(afterClip.id, {
        startTime: normalizedCenterTime,
      });
    }
  }

  // 保存当前的修饰键状态
  const modifierKeys = ref({ shift: false });

  // 调整大小移动
  function handleResizeMove(event: MouseEvent) {
    if (!isResizing.value || !resizingClip.value) return;

    // 更新修饰键状态
    modifierKeys.value.shift = event.shiftKey;

    const deltaX = event.clientX - resizeStartX.value;
    const deltaTime = scaleStore.pixelsToTime(deltaX);

    if (resizingEdge.value === 'left') {
      handleLeftResize(deltaTime);
    } else {
      handleRightResize(deltaTime);
    }
  }

  // 左边缘调整
  function handleLeftResize(deltaTime: number) {
    if (!resizingClip.value) return;

    let newStartTime = normalizeTime(resizeStartTime.value + deltaTime);

    // 限制最小时长 0.1 秒
    const minDuration = 0.1;
    const maxStartTime = resizeStartEndTime.value - minDuration;
    newStartTime = Math.max(0, Math.min(newStartTime, maxStartTime));

    // 检查是否有左侧相邻的 clip（非转场连接的情况），防止重叠
    const trackForOverlapCheck = tracksStore.tracks.find(
      (t) => t.id === resizingClip.value!.trackId
    );
    if (trackForOverlapCheck) {
      // 查找是否有左侧转场
      const hasLeftTransition = trackForOverlapCheck.clips.some((c) => {
        if (c.type !== 'transition') return false;
        const transClip = c as TransitionClip;
        const centerTime = (transClip.startTime + transClip.endTime) / 2;
        return Math.abs(centerTime - resizeStartTime.value) < 0.01;
      });

      // 如果没有转场连接，检查左侧是否有其他 clip，限制不能重叠
      if (!hasLeftTransition) {
        const prevClipForOverlap = trackForOverlapCheck.clips
          .filter((c) => c.type !== 'transition' && c.id !== resizingClip.value!.id)
          .find((c) => c.endTime <= resizeStartTime.value + 0.01 && c.endTime > newStartTime);

        if (prevClipForOverlap) {
          // 不能超过前一个 clip 的结束时间
          newStartTime = Math.max(newStartTime, prevClipForOverlap.endTime);
        }
      }
    }

    // 对于视频/音频 clip，检查是否超过原始时长，同时计算新的 trimStart
    let newTrimStart = 0;
    if (
      resizingClip.value.type === 'video' ||
      resizingClip.value.type === 'audio'
    ) {
      const mediaClip = resizingClip.value as MediaClip;
      // 计算 trimStart 的变化量（与 startTime 变化量相同）
      const trimDelta = newStartTime - resizeStartTime.value;
      newTrimStart = normalizeTime(resizeStartTrimStart.value + trimDelta);

      // 限制 trimStart 不能小于 0
      if (newTrimStart < 0) {
        newStartTime = normalizeTime(resizeStartTime.value - resizeStartTrimStart.value);
        newTrimStart = 0;
      }

      // 限制 trimStart 不能超过 trimEnd（保持最小时长）
      const currentTrimEnd = resizeStartTrimEnd.value;
      if (newTrimStart > currentTrimEnd - minDuration) {
        newTrimStart = currentTrimEnd - minDuration;
        newStartTime = normalizeTime(resizeStartTime.value + (newTrimStart - resizeStartTrimStart.value));
      }
    }

    // 吸附处理
    if (scaleStore.snapEnabled) {
      const snappedStartTime = snapToTime(newStartTime);
      // 如果吸附后的时间变化了，同步更新 trimStart
      if (snappedStartTime !== newStartTime && (resizingClip.value.type === 'video' || resizingClip.value.type === 'audio')) {
        const snapDelta = snappedStartTime - newStartTime;
        newTrimStart = normalizeTime(newTrimStart + snapDelta);
        // 确保吸附后 trimStart 仍在有效范围内
        if (newTrimStart < 0) {
          newTrimStart = 0;
        }
      }
      newStartTime = snappedStartTime;
    }

    // 更新当前clip
    if (resizingClip.value.type === 'video' || resizingClip.value.type === 'audio') {
      tracksStore.updateClip(resizingClip.value.id, {
        startTime: newStartTime,
        trimStart: Math.max(0, newTrimStart),
      });
    } else {
      tracksStore.updateClip(resizingClip.value.id, {
        startTime: newStartTime,
      });
    }

    // 使用预先收集的关联元素来更新左侧位置
    updateLinkedElementsLeft(newStartTime);
  }

  // 使用预先收集的信息更新左侧关联元素
  function updateLinkedElementsLeft(newStartTime: number) {
    if (linkedElementsLeft.value.length === 0) return;

    // 计算当前 clip 的新时长
    const currentClipNewDuration = resizeStartEndTime.value - newStartTime;

    // 当前位置
    let currentNewStartTime = newStartTime;

    // 遍历所有预先收集的关联元素
    for (let i = 0; i < linkedElementsLeft.value.length; i++) {
      const element = linkedElementsLeft.value[i];

      if (element.type === 'transition') {
        // 检查当前 clip 的时长是否小于转场时长的一半
        let transitionDuration = element.duration;
        const minClipDurationForTransition = transitionDuration / 2;

        // 获取前一个 clip（如果有的话）
        const prevClipElement = linkedElementsLeft.value[i + 1];
        let prevClipNewDuration = prevClipElement
          ? prevClipElement.duration // 前一个 clip 保持原时长（只改 endTime）
          : Infinity;

        // 如果当前 clip 时长 < 转场时长/2，需要缩短转场
        if (currentClipNewDuration < minClipDurationForTransition) {
          // 新的转场时长 = 当前 clip 时长 * 2
          transitionDuration = Math.max(0.1, currentClipNewDuration * 2);
        }

        // 同时检查前一个 clip 的新时长（endTime 变为 currentNewStartTime）
        if (prevClipElement) {
          const prevClipNewEndTime = currentNewStartTime;
          prevClipNewDuration = prevClipNewEndTime - prevClipElement.originalStartTime;

          if (prevClipNewDuration < transitionDuration / 2) {
            transitionDuration = Math.max(0.1, prevClipNewDuration * 2);
          }
        }

        // 更新转场位置和时长
        const newCenterTime = currentNewStartTime;
        tracksStore.updateClip(element.id, {
          startTime: normalizeTime(newCenterTime - transitionDuration / 2),
          endTime: normalizeTime(newCenterTime + transitionDuration / 2),
          transitionDuration: normalizeTime(transitionDuration),
        } as Partial<TransitionClip>);

        // 更新 linkedElementsLeft 中的 duration，以便后续使用
        element.duration = transitionDuration;
      } else {
        // 更新前一个 clip 的结束时间（保持开始时间不变）
        tracksStore.updateClip(element.id, {
          endTime: normalizeTime(currentNewStartTime),
        });
        // 左边缘调整时，前一个 clip 只改变 endTime，不需要继续链式更新
      }
    }
  }

  // 右边缘调整
  function handleRightResize(deltaTime: number) {
    if (!resizingClip.value) return;

    let newEndTime = normalizeTime(resizeStartEndTime.value + deltaTime);

    // 限制最小时长 0.1 秒
    const minDuration = 0.1;
    const minEndTime = resizeStartTime.value + minDuration;
    newEndTime = Math.max(minEndTime, newEndTime);

    // 检查是否有右侧相邻的 clip（非转场连接的情况），防止重叠
    const trackForOverlapCheck = tracksStore.tracks.find(
      (t) => t.id === resizingClip.value!.trackId
    );
    if (trackForOverlapCheck) {
      // 查找是否有右侧转场
      const hasRightTransition = trackForOverlapCheck.clips.some((c) => {
        if (c.type !== 'transition') return false;
        const transClip = c as TransitionClip;
        const centerTime = (transClip.startTime + transClip.endTime) / 2;
        return Math.abs(centerTime - resizeStartEndTime.value) < 0.01;
      });

      // 如果没有转场连接，检查右侧是否有其他 clip，限制不能重叠
      if (!hasRightTransition) {
        const nextClipForOverlap = trackForOverlapCheck.clips
          .filter((c) => c.type !== 'transition' && c.id !== resizingClip.value!.id)
          .find((c) => c.startTime >= resizeStartEndTime.value - 0.01 && c.startTime < newEndTime);

        if (nextClipForOverlap) {
          // 不能超过后一个 clip 的开始时间
          newEndTime = Math.min(newEndTime, nextClipForOverlap.startTime);
        }
      }
    }

    // 对于视频/音频 clip，检查是否超过原始时长，同时计算新的 trimEnd
    let newTrimEnd = 0;
    if (
      resizingClip.value.type === 'video' ||
      resizingClip.value.type === 'audio'
    ) {
      const mediaClip = resizingClip.value as MediaClip;
      // 计算 trimEnd 的变化量（与 endTime 变化量相同）
      const trimDelta = newEndTime - resizeStartEndTime.value;
      newTrimEnd = normalizeTime(resizeStartTrimEnd.value + trimDelta);

      // 限制 trimEnd 不能超过原始时长
      if (newTrimEnd > mediaClip.originalDuration) {
        newTrimEnd = mediaClip.originalDuration;
        newEndTime = normalizeTime(resizeStartEndTime.value + (newTrimEnd - resizeStartTrimEnd.value));
      }

      // 限制 trimEnd 不能小于 trimStart（保持最小时长）
      const currentTrimStart = resizeStartTrimStart.value;
      if (newTrimEnd < currentTrimStart + minDuration) {
        newTrimEnd = currentTrimStart + minDuration;
        newEndTime = normalizeTime(resizeStartEndTime.value + (newTrimEnd - resizeStartTrimEnd.value));
      }
    }

    // 吸附处理
    if (scaleStore.snapEnabled) {
      const snappedEndTime = snapToTime(newEndTime);
      // 如果吸附后的时间变化了，同步更新 trimEnd
      if (snappedEndTime !== newEndTime && (resizingClip.value.type === 'video' || resizingClip.value.type === 'audio')) {
        const mediaClip = resizingClip.value as MediaClip;
        const snapDelta = snappedEndTime - newEndTime;
        newTrimEnd = normalizeTime(newTrimEnd + snapDelta);
        // 确保吸附后 trimEnd 仍在有效范围内
        if (newTrimEnd > mediaClip.originalDuration) {
          newTrimEnd = mediaClip.originalDuration;
        }
      }
      newEndTime = snappedEndTime;
    }

    // 更新当前clip
    if (resizingClip.value.type === 'video' || resizingClip.value.type === 'audio') {
      const mediaClip = resizingClip.value as MediaClip;
      tracksStore.updateClip(resizingClip.value.id, {
        endTime: newEndTime,
        trimEnd: Math.min(newTrimEnd, mediaClip.originalDuration),
      });
    } else {
      tracksStore.updateClip(resizingClip.value.id, {
        endTime: newEndTime,
      });
    }

    // 使用预先收集的关联元素来更新位置
    updateLinkedElementsRight(newEndTime);
  }

  // 使用预先收集的信息更新右侧关联元素
  function updateLinkedElementsRight(newEndTime: number) {
    if (linkedElementsRight.value.length === 0) return;

    // 计算当前 clip 的新时长
    const currentClipNewDuration = newEndTime - resizeStartTime.value;

    // 当前累计的新位置
    let currentNewEndTime = newEndTime;
    // 上一个处理的 clip 时长（用于检查转场是否超出）
    let prevClipDuration = currentClipNewDuration;

    // 遍历所有预先收集的关联元素
    for (let i = 0; i < linkedElementsRight.value.length; i++) {
      const element = linkedElementsRight.value[i];

      if (element.type === 'transition') {
        // 检查转场两侧 clip 的时长是否小于转场时长的一半
        let transitionDuration = element.duration;
        const minClipDurationForTransition = transitionDuration / 2;

        // 获取下一个 clip（如果有的话）
        const nextClipElement = linkedElementsRight.value[i + 1];
        const nextClipDuration = nextClipElement ? nextClipElement.duration : Infinity;

        // 如果前一个 clip 时长 < 转场时长/2，需要缩短转场
        if (prevClipDuration < minClipDurationForTransition) {
          // 新的转场时长 = 前一个 clip 时长 * 2
          transitionDuration = Math.max(0.1, prevClipDuration * 2);
        }

        // 如果下一个 clip 时长 < 转场时长/2，也需要缩短转场
        if (nextClipDuration < transitionDuration / 2) {
          transitionDuration = Math.max(0.1, nextClipDuration * 2);
        }

        // 更新转场位置和时长
        const newCenterTime = currentNewEndTime;
        tracksStore.updateClip(element.id, {
          startTime: normalizeTime(newCenterTime - transitionDuration / 2),
          endTime: normalizeTime(newCenterTime + transitionDuration / 2),
          transitionDuration: normalizeTime(transitionDuration),
        } as Partial<TransitionClip>);

        // 更新 linkedElementsRight 中的 duration，以便后续使用
        element.duration = transitionDuration;
      } else {
        // 更新 clip 位置（整体偏移，保持时长不变）
        const newStartTime = currentNewEndTime;
        const newClipEndTime = newStartTime + element.duration;

        tracksStore.updateClip(element.id, {
          startTime: normalizeTime(newStartTime),
          endTime: normalizeTime(newClipEndTime),
        });

        // 更新当前累计位置为这个 clip 的新结束时间
        currentNewEndTime = newClipEndTime;
        // 记录这个 clip 的时长，供下一个转场检查使用
        prevClipDuration = element.duration;
      }
    }
  }

  // 调整大小结束
  function handleResizeEnd() {
    if (isResizing.value) {
      historyStore.pushSnapshot('调整片段时长');
    }

    isResizing.value = false;
    resizingClip.value = null;
    // 清理关联元素
    linkedElementsRight.value = [];
    linkedElementsLeft.value = [];

    activeDocument.removeEventListener('mousemove', handleResizeMove);
    activeDocument.removeEventListener('mouseup', handleResizeEnd);
  }

  // 吸附到时间点
  function snapToTime(time: number): number {
    // 按住 Shift 键时禁用吸附，实现精细调整
    if (modifierKeys.value.shift || !scaleStore.snapEnabled) {
      return time;
    }

    // 获取当前clip所在的轨道
    const track = tracksStore.tracks.find(t => t.id === resizingClip.value!.trackId);
    if (!track) return time;

    const snapPositions: number[] = [];

    // 添加同轨道其他非转场、非选中 clip 的边缘（支持毫秒级精度）
    const selectedIds = new Set(tracksStore.selectedClipIds);
    track.clips.forEach((c) => {
      if (c.id !== resizingClip.value!.id && !selectedIds.has(c.id) && c.type !== 'transition') {
        snapPositions.push(c.startTime);
        snapPositions.push(c.endTime);
      }
    });

    // 如果没有其他clip边缘，则不进行吸附
    if (snapPositions.length === 0) {
      return time;
    }

    // 转换为像素位置进行吸附
    const pixelPosition = scaleStore.timeToPixels(time);
    const snappedPixelPosition = scaleStore.snapToPosition(
      pixelPosition,
      snapPositions.map((t) => scaleStore.timeToPixels(t))
    );

    return normalizeTime(scaleStore.pixelsToTime(snappedPixelPosition));
  }

  return {
    isResizing,
    resizingClip,
    resizingEdge,
    startResize,
    handleResizeMove,
    handleResizeEnd,
  };
}
