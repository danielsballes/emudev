<script setup>
import { storeToRefs } from 'pinia';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { getAvatarGlyph } from '@/components/player/avatars.js';
import PixelButton from '@/components/ui/PixelButton.vue';
import { useEraNames } from '@/composables/use-era-names.js';
import { useEngine } from '@/engine/plugin.js';
import { hasBadge } from '@/engine/progression/index.js';
import { SaveFormatError } from '@/engine/storage/index.js';
import { useSaveStore } from '@/stores/save.js';

const { t } = useI18n();
const { registry } = useEngine();
const store = useSaveStore();
const { player, save, levelInfo, unlockedEras } = storeToRefs(store);

const eraNames = useEraNames();
const importErrors = computed(() => ({
  'invalid-json': t('profile.importErrors.invalid-json'),
  'invalid-format': t('profile.importErrors.invalid-format'),
  'unsupported-version': t('profile.importErrors.unsupported-version'),
}));
const unknownImportError = computed(() => t('profile.importErrors.unknown'));

const badgeStatus = computed(() => ({
  earned: t('profile.badgeEarned'),
  locked: t('profile.badgeLocked'),
}));

const badges = computed(() =>
  registry.modules.flatMap((module) =>
    module.badges.map((badge) => ({
      key: `${module.id}/${badge.id}`,
      title: t(badge.titleKey),
      isEarned: hasBadge(save.value, module.id, badge.id),
    })),
  ),
);

const skin = computed({
  get: () => save.value.skin ?? '',
  set: (value) => store.setSkin(value === '' ? null : value),
});

const importMessage = ref('');

function exportSave() {
  const url = URL.createObjectURL(new Blob([store.exportSave()], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `emudev-${player.value.name}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

async function importSave(event) {
  const [file] = event.target.files;
  if (!file) {
    return;
  }
  try {
    store.importSave(await file.text());
    importMessage.value = t('profile.imported');
  } catch (error) {
    if (!(error instanceof SaveFormatError)) {
      throw error;
    }
    importMessage.value = importErrors.value[error.code] ?? unknownImportError.value;
  } finally {
    event.target.value = '';
  }
}
</script>

<template>
  <main class="mx-auto flex max-w-5xl flex-col gap-10 px-6 py-8 glow">
    <header class="flex items-center gap-4">
      <span aria-hidden="true" class="flex size-16 items-center justify-center text-4xl frame">
        {{ getAvatarGlyph(player.avatar) }}
      </span>
      <div>
        <h1 class="font-display text-2xl">{{ player.name }}</h1>
        <p class="text-ink-dim">
          {{ t('profile.stats', { level: levelInfo.level, xp: levelInfo.xp }) }}
        </p>
      </div>
    </header>

    <section class="flex flex-col gap-3">
      <h2 class="font-display text-xl">{{ t('profile.badges') }}</h2>
      <p v-if="badges.length === 0" class="text-ink-dim">{{ t('profile.noBadges') }}</p>
      <ul v-else class="flex flex-wrap gap-3">
        <li
          v-for="badge in badges"
          :key="badge.key"
          class="px-3 py-2 frame"
          :class="badge.isEarned ? 'inverse' : 'text-ink-dim'"
        >
          {{ badge.title }}
          <span class="sr-only">
            {{ badgeStatus[badge.isEarned ? 'earned' : 'locked'] }}
          </span>
        </li>
      </ul>
    </section>

    <section class="flex flex-col gap-3">
      <h2 class="font-display text-xl">{{ t('profile.skin') }}</h2>
      <fieldset class="flex flex-col gap-2">
        <legend class="sr-only">{{ t('profile.skin') }}</legend>
        <label class="flex items-center gap-3">
          <input v-model="skin" type="radio" name="skin" value="" class="accent-current" />
          {{ t('profile.skinAuto') }}
        </label>
        <label v-for="era in unlockedEras" :key="era" class="flex items-center gap-3">
          <input v-model="skin" type="radio" name="skin" :value="era" class="accent-current" />
          {{ eraNames[era] }}
        </label>
      </fieldset>
    </section>

    <section class="flex flex-col gap-3">
      <h2 class="font-display text-xl">{{ t('profile.save') }}</h2>
      <p class="text-ink-dim">{{ t('profile.saveHelp') }}</p>
      <div class="flex flex-wrap gap-3">
        <PixelButton @click="exportSave">{{ t('profile.export') }}</PixelButton>
        <label class="cursor-pointer px-4 py-2 frame hover:inverse has-focus-visible:inverse">
          {{ t('profile.import') }}
          <input type="file" accept="application/json,.json" class="sr-only" @change="importSave" />
        </label>
      </div>
      <p v-if="importMessage" role="status">{{ importMessage }}</p>
    </section>
  </main>
</template>
