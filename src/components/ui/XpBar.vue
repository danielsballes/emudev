<script setup>
import { computed } from 'vue';

import { useEra } from '@/composables/use-era.js';

const props = defineProps({
  value: { type: Number, required: true },
  max: { type: Number, required: true },
  label: { type: String, required: true },
});

const SEGMENTS = 10;

const era = useEra();
const filled = computed(() => Math.min(SEGMENTS, Math.floor((props.value / props.max) * SEGMENTS)));
const asciiBar = computed(
  () => `[${'#'.repeat(filled.value)}${'.'.repeat(SEGMENTS - filled.value)}]`,
);
</script>

<template>
  <span
    role="progressbar"
    :aria-label="label"
    :aria-valuenow="value"
    aria-valuemin="0"
    :aria-valuemax="max"
    class="inline-flex items-center"
  >
    <span v-if="era === 'terminal'" aria-hidden="true" class="whitespace-pre">{{ asciiBar }}</span>
    <span v-else aria-hidden="true" class="flex gap-(--era-pixel)">
      <span
        v-for="segment in SEGMENTS"
        :key="segment"
        data-segment
        class="size-[calc(var(--era-pixel)*3)] frame"
        :class="{ 'bg-ink': segment <= filled }"
      />
    </span>
  </span>
</template>
