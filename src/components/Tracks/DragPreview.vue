<template>
    <div class="drag-preview" :class="{
        'drag-preview--new-track': dragStore.previewPosition.needNewTrack
    }" :style="previewStyle">
        <div class="drag-preview__inner">
            <span v-if="dragStore.previewPosition.needNewTrack" class="drag-preview__label">
                新建轨道
            </span>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDragStore } from '@/stores/drag'
import { useScaleStore } from '@/stores/scale'
import type { Track } from '@/types'

// Props
interface Props {
    track: Track
}

const props = defineProps<Props>()

const dragStore = useDragStore()
const scaleStore = useScaleStore()

// 计算预览框样式
const previewStyle = computed(() => {
    const preview = dragStore.previewPosition
    if (!preview.visible) return {}

    const left = preview.startTime * scaleStore.actualPixelsPerSecond
    const width = (preview.endTime - preview.startTime) * scaleStore.actualPixelsPerSecond

    // 计算高度
    let height = 32
    if (props.track.isMain) {
        height = 64
    } else if (preview.clipType === 'video' || props.track.type === 'video') {
        height = 48
    }

    // 计算垂直位置（相对于轨道区域）
    let top = 8

    // 基础样式
    const style: Record<string, any> = {
        left: `${left}px`,
        width: `${width}px`,
        height: `${height}px`,
        top: `${top}px`,
    }

    // 如果需要新建轨道，调整样式
    if (preview.needNewTrack) {
        // 显示在目标轨道上方的位置
        style.top = `-${height + 8}px`
    }

    return style
})
</script>

<style scoped>
.drag-preview {
    position: absolute;
    border: 2px dashed var(--color-primary);
    background: hsla(var(--theme-hue), var(--theme-saturation), var(--theme-lightness), 0.15);
    border-radius: var(--radius-sm);
    pointer-events: none;
    z-index: 100;
    box-sizing: border-box;
}

.drag-preview--new-track {
    border-color: var(--color-success, #22c55e);
    background: hsla(142, 71%, 45%, 0.15);
}

.drag-preview__inner {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.drag-preview__label {
    font-size: 12px;
    color: var(--color-success, #22c55e);
    font-weight: 500;
    background: rgba(0, 0, 0, 0.6);
    padding: 2px 8px;
    border-radius: var(--radius-xs);
    white-space: nowrap;
}
</style>
