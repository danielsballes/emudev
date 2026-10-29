<script setup>
import { computed, watchEffect } from 'vue';
import { RouterView, useRoute } from 'vue-router';

import EraUnlockedOverlay from '@/components/EraUnlockedOverlay.vue';
import TheHud from '@/components/TheHud.vue';
import { provideEra } from '@/composables/use-era.js';
import { useSaveStore } from '@/stores/save.js';

const store = useSaveStore();
const route = useRoute();

const era = computed(() => store.shellEra);
provideEra(era);
watchEffect(() => {
  document.documentElement.dataset.era = era.value;
});

const showHud = computed(() => store.hasPlayer && !route.meta.hideHud);
</script>

<template>
  <div class="min-h-screen bg-surface text-ink">
    <div v-if="showHud" class="px-4 pt-4">
      <TheHud />
    </div>
    <RouterView />
    <EraUnlockedOverlay />
  </div>
</template>
