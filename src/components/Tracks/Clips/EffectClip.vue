<template>
  <div class="effect-clip">
    <div class="effect-clip__icon">
      ⭐
    </div>
    <div class="effect-clip__info">
      <div class="effect-clip__name">{{ effectClip.name || 'Effect' }}</div>
      <div class="effect-clip__type">{{ effectClip.effectType }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { EffectClip as EffectClipType } from '@/types'

// Props
interface Props {
  clip: EffectClipType
}

const props = defineProps<Props>()

// Computed
const effectClip = computed(() => props.clip as EffectClipType)
</script>

<style scoped>
.effect-clip {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
}

.effect-clip__icon {
  font-size: 20px;
}

.effect-clip__info {
  flex: 1;
  overflow: hidden;
}

.effect-clip__name {
  font-size: 11px;
  font-weight: 600;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.effect-clip__type {
  font-size: 9px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.8);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-transform: uppercase;
}
</style>
