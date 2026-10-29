<script setup>
import { onMounted, ref, watch } from 'vue';

import { DISPLAY_HEIGHT, DISPLAY_WIDTH } from '../core/index.js';

const props = defineProps({
  display: { type: Uint8Array, required: true },
  label: { type: String, required: true },
});

const canvas = ref(null);

function draw() {
  const element = canvas.value;
  const context = element?.getContext('2d');
  if (!context) {
    return;
  }
  // Colors come from the era tokens through CSS (`color` = lit pixel, `background` = unlit).
  const { color, backgroundColor } = getComputedStyle(element);
  const image = context.createImageData(DISPLAY_WIDTH, DISPLAY_HEIGHT);
  const lit = parseCssColor(color);
  const unlit = parseCssColor(backgroundColor);
  for (const [index, pixel] of props.display.entries()) {
    image.data.set(pixel ? lit : unlit, index * 4);
  }
  context.putImageData(image, 0, 0);
}

function parseCssColor(value) {
  const channels = value.match(/\d+(\.\d+)?/g)?.map(Number) ?? [0, 0, 0];
  return [channels[0], channels[1], channels[2], 255];
}

onMounted(draw);
watch(() => props.display, draw);
</script>

<template>
  <canvas
    ref="canvas"
    role="img"
    :aria-label="label"
    :width="DISPLAY_WIDTH"
    :height="DISPLAY_HEIGHT"
    class="aspect-[2/1] w-full bg-surface text-ink [image-rendering:pixelated] frame"
  />
</template>
