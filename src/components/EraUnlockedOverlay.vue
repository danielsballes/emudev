<script setup>
import { storeToRefs } from 'pinia';
import { computed, nextTick, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import PixelButton from '@/components/ui/PixelButton.vue';
import { useEraNames } from '@/composables/use-era-names.js';
import { resolveImplementedEra } from '@/engine/eras.js';
import { useSaveStore } from '@/stores/save.js';

const { t } = useI18n();
const store = useSaveStore();
const { pendingEras } = storeToRefs(store);

const eraNames = useEraNames();
const era = computed(() => pendingEras.value[0]);
const dialog = ref(null);

// The overlay is drawn in the new era, so the "reboot" shows the next generation right away.
watch(era, async (value) => {
  if (!value) {
    return;
  }
  await nextTick();
  dialog.value?.focus();
});
</script>

<template>
  <div
    v-if="era"
    ref="dialog"
    role="alertdialog"
    aria-modal="true"
    aria-labelledby="era-unlocked-title"
    tabindex="-1"
    :data-era="resolveImplementedEra(era)"
    class="era-reboot fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-surface p-6 text-center text-ink"
  >
    <h2 id="era-unlocked-title" class="font-display text-3xl">
      {{ t('eraUnlocked.title', { era: eraNames[era] }) }}
    </h2>
    <p class="max-w-prose">{{ t('eraUnlocked.body') }}</p>
    <PixelButton @click="store.acknowledgeNextEra()">{{ t('eraUnlocked.continue') }}</PixelButton>
  </div>
</template>

<style scoped>
/* One short "power cycle" flash; skipped entirely with reduced motion. */
@media (prefers-reduced-motion: no-preference) {
  .era-reboot {
    animation: reboot 600ms steps(4) both;
  }
}

@keyframes reboot {
  0% {
    filter: brightness(3);
    clip-path: inset(49% 0);
  }

  60% {
    filter: brightness(1.5);
    clip-path: inset(0);
  }

  100% {
    filter: none;
  }
}
</style>
