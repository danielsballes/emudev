<script setup>
defineProps({
  variant: {
    type: String,
    default: 'primary',
    validator: (value) => ['primary', 'secondary'].includes(value),
  },
});
</script>

<template>
  <button
    type="button"
    class="border-4 border-night px-6 py-4 font-pixel text-xs shadow-[4px_4px_0_0] shadow-night transition-transform active:translate-1 active:shadow-none"
    :class="variant === 'primary' ? 'bg-gold text-night' : 'bg-slate text-snow'"
  >
    <slot />
  </button>
</template>
