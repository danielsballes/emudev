<script setup>
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';

import { useSaveStore } from '@/stores/save.js';

const { t } = useI18n();
const { player } = storeToRefs(useSaveStore());
const version = __APP_VERSION__;
</script>

<template>
  <main class="glow mx-auto flex max-w-5xl flex-col gap-4 px-6 py-10">
    <h1 class="font-display text-2xl">{{ t('home.welcome', { name: player.name }) }}</h1>
    <p class="text-ink-dim">{{ t('home.prompt') }}</p>
    <p>{{ t('home.comingSoon') }}</p>
    <footer class="text-ink-dim">{{ t('app.version', { version }) }}</footer>
  </main>
</template>
