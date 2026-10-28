<script setup>
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import { getAvatarGlyph } from '@/components/player/avatars.js';
import PixelNumber from '@/components/ui/PixelNumber.vue';
import XpBar from '@/components/ui/XpBar.vue';
import { useEra } from '@/composables/use-era.js';
import { useSaveStore } from '@/stores/save.js';

const { t } = useI18n();
const era = useEra();
const { player, levelInfo } = storeToRefs(useSaveStore());

const avatarGlyph = computed(() => getAvatarGlyph(player.value.avatar));
const xpNeeded = computed(() => levelInfo.value.nextLevelXp - levelInfo.value.levelStartXp);
</script>

<template>
  <header class="frame mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-2">
    <p class="flex items-center gap-2">
      <span aria-hidden="true" class="glow">{{ avatarGlyph }}</span>
      <span>{{ player.name }}</span>
    </p>
    <p v-if="era === 'terminal'">{{ t('hud.level', { level: levelInfo.level }) }}</p>
    <p v-else class="flex items-center gap-2">
      <span>{{ t('hud.levelLabel') }}</span>
      <PixelNumber :value="levelInfo.level" :label="t('hud.level', { level: levelInfo.level })" />
    </p>
    <p class="flex items-center gap-3">
      <XpBar
        :value="levelInfo.xpIntoLevel"
        :max="xpNeeded"
        :label="t('hud.progress', { level: levelInfo.level + 1 })"
      />
      <span class="text-ink-dim">
        {{ t('hud.xp', { current: levelInfo.xpIntoLevel, total: xpNeeded }) }}
      </span>
    </p>
  </header>
</template>
