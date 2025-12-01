<template>
  <div class="transition-clip">
    <div class="transition-clip__icon">
      🔀
    </div>
    <div class="transition-clip__info">
      <div class="transition-clip__name">{{ transitionClip.name || 'Transition' }}</div>
      <div class="transition-clip__duration">{{ transitionClip.transitionDuration }}s</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { TransitionClip as TransitionClipType } from '@/types'

// Props
interface Props {
  clip: TransitionClipType
}

const props = defineProps<Props>()

// Computed
const transitionClip = computed(() => props.clip as TransitionClipType)
</script>

<style scoped>
.transition-clip {
  width: 100%;
  height: 95%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 6px;
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.3) 0%, rgba(8, 145, 178, 0.3) 100%);
  border-left: 2px solid #06b6d4;
  border-right: 2px solid #06b6d4;
  backdrop-filter: blur(2px);
}

.transition-clip__icon {
  font-size: 16px;
  opacity: 0.8;
}

.transition-clip__info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.transition-clip__name {
  font-size: 10px;
  font-weight: 600;
  color: #fff;
  white-space: nowrap;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.transition-clip__duration {
  font-size: 8px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.8);
}
</style>
