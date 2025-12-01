<template>
  <div class="filter-clip">
    <div class="filter-clip__icon">
      🎨
    </div>
    <div class="filter-clip__info">
      <div class="filter-clip__name">{{ filterClip.name || 'Filter' }}</div>
      <div class="filter-clip__type">{{ filterClip.filterType }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { FilterClip as FilterClipType } from '@/types'

// Props
interface Props {
  clip: FilterClipType
}

const props = defineProps<Props>()

// Computed
const filterClip = computed(() => props.clip as FilterClipType)
</script>

<style scoped>
.filter-clip {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}

.filter-clip__icon {
  font-size: 20px;
}

.filter-clip__info {
  flex: 1;
  overflow: hidden;
}

.filter-clip__name {
  font-size: 11px;
  font-weight: 600;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.filter-clip__type {
  font-size: 9px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.8);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-transform: uppercase;
}
</style>
