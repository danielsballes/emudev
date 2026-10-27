<script setup>
import { useI18n } from 'vue-i18n';

import PixelButton from '@/components/ui/PixelButton.vue';

const { t } = useI18n();
const version = __APP_VERSION__;
</script>

<template>
  <main class="flex min-h-screen flex-col items-center justify-center gap-8 p-6 text-center">
    <h1 class="font-pixel text-2xl leading-relaxed text-gold sm:text-4xl">
      {{ t('app.name') }}
    </h1>
    <p class="max-w-xl text-mist">{{ t('app.tagline') }}</p>
    <PixelButton disabled>{{ t('home.start') }}</PixelButton>
    <p class="text-sm text-slate">{{ t('home.comingSoon') }}</p>
    <footer class="text-xs text-shadow">{{ t('app.version', { version }) }}</footer>
  </main>
</template>
