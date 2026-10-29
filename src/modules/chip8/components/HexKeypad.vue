<script setup>
defineProps({
  // Pressed state of the 16 keys.
  keys: { type: Uint8Array, required: true },
  label: { type: String, required: true },
});
const emit = defineEmits(['key']);

// Physical layout of the original COSMAC VIP keypad, mapped to the left of a QWERTY keyboard.
const LAYOUT = [
  [0x1, 0x2, 0x3, 0xc],
  [0x4, 0x5, 0x6, 0xd],
  [0x7, 0x8, 0x9, 0xe],
  [0xa, 0x0, 0xb, 0xf],
];
</script>

<template>
  <div role="group" :aria-label="label" class="grid grid-cols-4 gap-2">
    <template v-for="row in LAYOUT" :key="row[0]">
      <button
        v-for="key in row"
        :key="key"
        type="button"
        class="aspect-square min-h-11 frame"
        :class="{ inverse: keys[key] === 1 }"
        :aria-pressed="keys[key] === 1"
        @pointerdown.prevent="emit('key', key, true)"
        @pointerup="emit('key', key, false)"
        @pointerleave="emit('key', key, false)"
        @keydown.space.prevent="emit('key', key, true)"
        @keyup.space="emit('key', key, false)"
      >
        {{ key.toString(16).toUpperCase() }}
      </button>
    </template>
  </div>
</template>
