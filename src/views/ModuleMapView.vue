<script setup>
import { computed, watchEffect } from 'vue';
import { useI18n } from 'vue-i18n';
import { RouterLink, useRoute, useRouter } from 'vue-router';

import PixelNumber from '@/components/ui/PixelNumber.vue';
import { provideEra } from '@/composables/use-era.js';
import { resolveImplementedEra } from '@/engine/eras.js';
import { useEngine } from '@/engine/plugin.js';
import { ROUTE } from '@/router/player-guard.js';
import { useSaveStore } from '@/stores/save.js';

const STATUS = { DONE: 'done', OPEN: 'open', LOCKED: 'locked' };
const STATUS_GLYPHS = { done: '[x]', open: '[>]', locked: '[ ]' };

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const { registry } = useEngine();
const store = useSaveStore();

const module = computed(() => registry.getModule(route.params.moduleId));
const isAvailable = computed(
  () => module.value !== undefined && store.isModuleUnlocked(module.value.id),
);
const era = computed(() => resolveImplementedEra(module.value?.era));
provideEra(era);

watchEffect(() => {
  if (!isAvailable.value) {
    router.replace({ name: ROUTE.HOME });
  }
});

const statusLabels = computed(() => ({
  [STATUS.DONE]: t('moduleMap.status.done'),
  [STATUS.OPEN]: t('moduleMap.status.open'),
  [STATUS.LOCKED]: t('moduleMap.status.locked'),
}));

function lessonStatus(lessonId) {
  if (store.isLessonCompleted(module.value.id, lessonId)) {
    return STATUS.DONE;
  }
  return store.isLessonUnlocked(module.value.id, lessonId) ? STATUS.OPEN : STATUS.LOCKED;
}

// Lessons are numbered in hex across the whole module, like memory addresses.
const chapters = computed(() => {
  let index = 0;
  return module.value.chapters.map((chapter) => ({
    id: chapter.id,
    title: t(chapter.titleKey),
    lessons: chapter.lessons.map((lesson) => ({
      id: lesson.id,
      title: t(lesson.titleKey),
      index: index++,
      status: lessonStatus(lesson.id),
    })),
  }));
});
</script>

<template>
  <div v-if="isAvailable" :data-era="era" class="min-h-screen bg-surface text-ink glow">
    <main class="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-8">
      <RouterLink :to="{ name: ROUTE.HOME }" class="self-start text-ink-dim hover:underline">
        {{ t('moduleMap.back') }}
      </RouterLink>
      <h1 class="font-display text-3xl">{{ t(module.region.titleKey) }}</h1>

      <section v-for="chapter in chapters" :key="chapter.id" class="flex flex-col gap-3">
        <h2 class="font-display text-xl">{{ chapter.title }}</h2>
        <ol class="flex flex-col gap-2">
          <li
            v-for="lesson in chapter.lessons"
            :key="lesson.id"
            class="flex items-center gap-4"
            :class="{ 'text-ink-dim': lesson.status === STATUS.LOCKED }"
          >
            <span v-if="era === 'terminal'" aria-hidden="true" class="whitespace-pre">
              {{ `${STATUS_GLYPHS[lesson.status]} 0x${lesson.index.toString(16)}` }}
            </span>
            <span
              v-else
              aria-hidden="true"
              class="relative flex size-14 items-center justify-center frame"
              :class="{
                inverse: lesson.status === STATUS.DONE,
                dither: lesson.status === STATUS.LOCKED,
              }"
            >
              <PixelNumber
                v-if="lesson.status !== STATUS.LOCKED"
                :value="lesson.index"
                :radix="16"
              />
            </span>
            <span>{{ lesson.title }}</span>
            <span class="sr-only">{{ statusLabels[lesson.status] }}</span>
          </li>
        </ol>
      </section>
    </main>
  </div>
</template>
