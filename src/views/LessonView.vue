<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { RouterLink, useRoute, useRouter } from 'vue-router';

import CodeEditor from '@/components/lesson/CodeEditor.vue';
import { describeOutcome, describeTestError } from '@/components/lesson/outcome-messages.js';
import { renderMarkdown } from '@/components/lesson/render-markdown.js';
import PixelButton from '@/components/ui/PixelButton.vue';
import { provideEra } from '@/composables/use-era.js';
import { resolveImplementedEra } from '@/engine/eras.js';
import { useEngine } from '@/engine/plugin.js';
import { RUN_STATUS } from '@/engine/runner/index.js';
import { ROUTE } from '@/router/player-guard.js';
import { useSaveStore } from '@/stores/save.js';

const SAVE_CODE_DELAY_MS = 500;

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const { registry, runner } = useEngine();
const store = useSaveStore();

const moduleId = computed(() => route.params.moduleId);
const module = computed(() => registry.getModule(moduleId.value));
const lesson = computed(() => registry.getLesson(moduleId.value, route.params.lessonId));
const isAvailable = computed(
  () => lesson.value !== undefined && store.isLessonUnlocked(moduleId.value, lesson.value.id),
);
const hasExercise = computed(() => ['exercise', 'boss'].includes(lesson.value?.type));
const era = computed(() => resolveImplementedEra(module.value?.era));
provideEra(era);

const html = ref('');
const exercise = ref(null);
const code = ref('');
const outcome = ref(null);
const isRunning = ref(false);
const reward = ref(null);
const isLoading = ref(true);
const hasLoadError = ref(false);

const isCompleted = computed(() => store.isLessonCompleted(moduleId.value, lesson.value?.id));
const nextLesson = computed(() =>
  isCompleted.value ? registry.getNextLesson(moduleId.value, lesson.value.id) : undefined,
);
const runLabels = computed(() => ({ idle: t('lesson.run'), running: t('lesson.running') }));
const runLabel = computed(() => runLabels.value[isRunning.value ? 'running' : 'idle']);
const outcomeText = computed(() => outcome.value && describeOutcome(outcome.value, t));

async function load() {
  if (route.name !== ROUTE.LESSON) {
    return;
  }
  if (!isAvailable.value) {
    router.replace({ name: ROUTE.MODULE, params: { moduleId: moduleId.value } });
    return;
  }
  outcome.value = null;
  reward.value = null;
  hasLoadError.value = false;
  isLoading.value = true;
  try {
    const { default: source } = await lesson.value.content();
    html.value = renderMarkdown(source);
    exercise.value = hasExercise.value ? await lesson.value.exercise() : null;
    code.value = store.getCode(moduleId.value, lesson.value.id) ?? exercise.value?.starter ?? '';
  } catch {
    // Usually a lazy chunk that failed to download (offline, or a new deploy).
    hasLoadError.value = true;
  } finally {
    isLoading.value = false;
  }
}

// Code is saved shortly after typing stops. The target lesson is captured when typing, and any
// pending save is written before leaving, so code never lands in another lesson.
const pendingSave = { timer: undefined, write: undefined };
function flushPendingSave() {
  clearTimeout(pendingSave.timer);
  pendingSave.write?.();
  pendingSave.write = undefined;
}
function updateCode(value) {
  code.value = value;
  const target = { moduleId: moduleId.value, lessonId: lesson.value.id };
  clearTimeout(pendingSave.timer);
  pendingSave.write = () => store.saveCode(target.moduleId, target.lessonId, value);
  pendingSave.timer = setTimeout(flushPendingSave, SAVE_CODE_DELAY_MS);
}

watch(
  () => route.fullPath,
  () => {
    flushPendingSave();
    load();
  },
  { immediate: true },
);
onBeforeUnmount(flushPendingSave);

function complete() {
  const result = store.completeLesson({ moduleId: moduleId.value, lessonId: lesson.value.id });
  if (!result.isAlreadyCompleted) {
    reward.value = result;
  }
}

async function run() {
  isRunning.value = true;
  try {
    outcome.value = await runner.run({
      studentSource: code.value,
      testsSource: exercise.value.tests,
    });
  } finally {
    isRunning.value = false;
  }
  if (outcome.value.status === RUN_STATUS.PASSED) {
    complete();
  }
}
</script>

<template>
  <div v-if="isAvailable" :data-era="era" class="min-h-screen bg-surface text-ink">
    <main class="mx-auto grid max-w-6xl gap-8 px-6 py-8" :class="{ 'lg:grid-cols-2': hasExercise }">
      <article class="flex flex-col gap-6">
        <RouterLink
          :to="{ name: ROUTE.MODULE, params: { moduleId } }"
          class="self-start text-ink-dim glow hover:underline"
        >
          {{ t('lesson.back') }}
        </RouterLink>
        <p v-if="hasLoadError" role="alert" class="self-start px-2 inverse">
          {{ t('lesson.loadError') }}
        </p>
        <!-- Content is our own Markdown rendered with raw HTML disabled (render-markdown.js). -->
        <!-- eslint-disable-next-line vue/no-v-html -->
        <div class="lesson-prose" v-html="html" />

        <PixelButton v-if="!hasExercise && !isCompleted" class="self-start" @click="complete">
          {{ t('lesson.complete') }}
        </PixelButton>
      </article>

      <section
        v-if="hasExercise && !isLoading && !hasLoadError"
        class="flex flex-col gap-4"
        :aria-label="t('lesson.exercise')"
      >
        <CodeEditor
          :model-value="code"
          :label="t('lesson.editor')"
          @update:model-value="updateCode"
        />
        <PixelButton class="self-start" :disabled="isRunning" @click="run">
          {{ runLabel }}
        </PixelButton>

        <div v-if="outcomeText" role="status" class="flex flex-col gap-3">
          <p :class="{ inverse: outcome.status === RUN_STATUS.PASSED }" class="self-start px-2">
            {{ outcomeText.summary }}
          </p>
          <p v-if="outcomeText.problem">{{ outcomeText.problem }}</p>
          <ul v-if="outcome.results.length > 0" class="flex flex-col gap-2 font-code">
            <li v-for="result in outcome.results" :key="result.name">
              <p>{{ `${result.passed ? '[x]' : '[ ]'} ${result.name}` }}</p>
              <p v-if="!result.passed" class="pl-6 text-ink-dim">
                {{ describeTestError(result.error, t) }}
              </p>
              <p v-if="result.hint" class="pl-6 text-ink-dim">
                {{ t('lesson.hint', { hint: result.hint }) }}
              </p>
            </li>
          </ul>
          <section v-if="outcome.logs.length > 0" class="p-3 font-code frame">
            <h2 class="mb-2 text-ink-dim">{{ t('lesson.console') }}</h2>
            <pre v-for="(log, index) in outcome.logs" :key="index">{{ log.text }}</pre>
          </section>
        </div>
      </section>

      <div v-if="isCompleted" role="status" class="flex flex-col gap-3 lg:col-span-full">
        <p v-if="reward" class="self-start px-2 inverse">
          {{ t('lesson.reward', { xp: reward.xpGained }) }}
        </p>
        <p v-if="reward?.levelUp">{{ t('lesson.levelUp', { level: reward.levelUp.to }) }}</p>
        <p v-for="badge in reward?.newBadges ?? []" :key="badge.id">
          {{ t('lesson.badge', { badge: t(badge.titleKey) }) }}
        </p>
        <RouterLink
          v-if="nextLesson"
          :to="{ name: ROUTE.LESSON, params: { moduleId, lessonId: nextLesson.id } }"
          class="self-start px-4 py-2 frame hover:inverse"
        >
          {{ t('lesson.next', { title: t(nextLesson.titleKey) }) }}
        </RouterLink>
        <RouterLink
          v-else
          :to="{ name: ROUTE.HOME }"
          class="self-start px-4 py-2 frame hover:inverse"
        >
          {{ t('lesson.toMap') }}
        </RouterLink>
      </div>
    </main>
  </div>
</template>
