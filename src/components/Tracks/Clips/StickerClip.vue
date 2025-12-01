<template>
  <div class="sticker-clip">
    <div
      v-if="stickerClip.sourceUrl"
      class="sticker-clip__image"
      :style="{ backgroundImage: `url(${stickerClip.sourceUrl})` }"
    />
    <div v-else class="sticker-clip__placeholder">
      ✨
    </div>
    <div class="sticker-clip__info">
      {{ stickerClip.name || 'Sticker' }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { StickerClip as StickerClipType } from '@/types'

// Props
interface Props {
  clip: StickerClipType
}

const props = defineProps<Props>()

// Computed
const stickerClip = computed(() => props.clip as StickerClipType)
</script>

<style scoped>
.sticker-clip {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #ec4899 0%, #be185d 100%);
}

.sticker-clip__image {
  flex: 1;
  background-size: contain;
  background-position: center;
  background-repeat: no-repeat;
}

.sticker-clip__placeholder {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  opacity: 0.5;
}

.sticker-clip__info {
  padding: 4px 8px;
  background: rgba(0, 0, 0, 0.3);
  font-size: 10px;
  font-weight: 500;
  color: #fff;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
