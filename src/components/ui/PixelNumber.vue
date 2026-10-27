<script setup>
import { computed } from 'vue';

import { GLYPH_HEIGHT, layoutNumber } from '@/themes/chip8/hex-font.js';

const props = defineProps({
  value: { type: Number, required: true },
  radix: { type: Number, default: 10, validator: (value) => [10, 16].includes(value) },
  label: { type: String, default: '' },
});

const layout = computed(() => layoutNumber(props.value, props.radix));
</script>

<template>
  <svg
    role="img"
    :aria-label="label || layout.text"
    :viewBox="`0 0 ${layout.width} ${GLYPH_HEIGHT}`"
    :width="`calc(var(--era-pixel) * ${layout.width})`"
    :height="`calc(var(--era-pixel) * ${GLYPH_HEIGHT})`"
    shape-rendering="crispEdges"
    class="inline-block fill-current align-middle"
  >
    <rect
      v-for="pixel in layout.pixels"
      :key="`${pixel.x}-${pixel.y}`"
      :x="pixel.x"
      :y="pixel.y"
      width="1"
      height="1"
    />
  </svg>
</template>
