<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { RouterLink } from 'vue-router';

import { useEra } from '@/composables/use-era.js';
import { useEngine } from '@/engine/plugin.js';
import { ROUTE } from '@/router/player-guard.js';
import { useSaveStore } from '@/stores/save.js';

// Unix-style permissions: readable regions can be entered, locked ones cannot.
const PERMISSIONS = { unlocked: 'drwxr-x', locked: 'd------' };

const { t } = useI18n();
const era = useEra();
const { registry } = useEngine();
const store = useSaveStore();
const version = __APP_VERSION__;

const regions = computed(() =>
  registry.modules.map((module) => ({
    module,
    title: t(module.region.titleKey),
    isUnlocked: store.isModuleUnlocked(module.id),
    progress: store.getModuleProgress(module.id),
    requires: module.requires.map((id) => t(registry.getModule(id).region.titleKey)).join(', '),
  })),
);
</script>

<template>
  <main class="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-8 glow">
    <h1 class="sr-only">{{ t('worldMap.title') }}</h1>

    <template v-if="era === 'terminal'">
      <p class="text-ink-dim">{{ t('worldMap.command') }}</p>
      <ul class="flex flex-col gap-1">
        <li v-for="region in regions" :key="region.module.id">
          <RouterLink
            v-if="region.isUnlocked"
            :to="{ name: ROUTE.MODULE, params: { moduleId: region.module.id } }"
            class="grid grid-cols-[8ch_16ch_1fr] gap-4 hover:underline"
          >
            <span>{{ PERMISSIONS.unlocked }}</span>
            <span>{{ `${region.title.toLowerCase()}/` }}</span>
            <span>{{ t('worldMap.lessons', region.progress) }}</span>
          </RouterLink>
          <p v-else class="grid grid-cols-[8ch_16ch_1fr] gap-4 text-ink-dim">
            <span>{{ PERMISSIONS.locked }}</span>
            <span>{{ `${region.title.toLowerCase()}/` }}</span>
            <span>{{ t('worldMap.requires', { modules: region.requires }) }}</span>
          </p>
        </li>
      </ul>
    </template>

    <ol v-else class="grid gap-6 sm:grid-cols-2">
      <li v-for="region in regions" :key="region.module.id" class="relative frame">
        <RouterLink
          v-if="region.isUnlocked"
          :to="{ name: ROUTE.MODULE, params: { moduleId: region.module.id } }"
          class="flex h-full flex-col gap-3 p-4 hover:inverse"
        >
          <span class="font-display text-xl">{{ region.title }}</span>
          <span>{{ t('worldMap.lessons', region.progress) }}</span>
        </RouterLink>
        <div v-else class="flex h-full flex-col gap-3 p-4">
          <span class="absolute inset-0 dither opacity-30" aria-hidden="true" />
          <span class="relative font-display text-xl">{{ region.title }}</span>
          <span class="relative">{{ t('worldMap.requires', { modules: region.requires }) }}</span>
        </div>
      </li>
    </ol>

    <footer class="text-ink-dim">{{ t('app.version', { version }) }}</footer>
  </main>
</template>
