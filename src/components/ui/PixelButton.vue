<script setup>
defineProps({
  variant: {
    type: String,
    default: 'primary',
    validator: (value) => ['primary', 'secondary'].includes(value),
  },
  type: {
    type: String,
    default: 'button',
    validator: (value) => ['button', 'submit'].includes(value),
  },
});
</script>

<template>
  <button
    :type="type"
    class="px-4 py-2 font-ui frame disabled:cursor-not-allowed"
    :class="variant === 'primary' ? 'inverse' : 'bg-surface text-ink'"
  >
    <slot />
  </button>
</template>
