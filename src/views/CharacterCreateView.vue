<script setup>
import { computed, nextTick, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

import { AVATARS, DEFAULT_AVATAR } from '@/components/player/avatars.js';
import PixelButton from '@/components/ui/PixelButton.vue';
import { useBootSequence } from '@/composables/use-boot-sequence.js';
import { ROUTE } from '@/router/player-guard.js';
import {
  PLAYER_NAME_ERROR,
  PLAYER_NAME_MAX_LENGTH,
  useSaveStore,
  validatePlayerName,
} from '@/stores/save.js';

const { t } = useI18n();
const router = useRouter();
const store = useSaveStore();

const bootLines = computed(() => [
  t('characterCreate.boot.bios', { version: __APP_VERSION__ }),
  t('characterCreate.boot.memory'),
  t('characterCreate.boot.cartridges'),
  t('characterCreate.boot.map'),
]);
const { visibleLines, isDone, skip } = useBootSequence(bootLines.value.length);

const avatarNames = computed(() => ({
  at: t('avatars.at'),
  ampersand: t('avatars.ampersand'),
  section: t('avatars.section'),
  pilcrow: t('avatars.pilcrow'),
  hash: t('avatars.hash'),
  currency: t('avatars.currency'),
}));

const name = ref('');
const avatar = ref(DEFAULT_AVATAR);
const nameError = ref(null);
const nameInput = ref(null);

const nameErrorMessage = computed(
  () =>
    ({
      [PLAYER_NAME_ERROR.EMPTY]: t('characterCreate.errors.empty'),
      [PLAYER_NAME_ERROR.TOO_LONG]: t('characterCreate.errors.tooLong', {
        max: PLAYER_NAME_MAX_LENGTH,
      }),
    })[nameError.value],
);

watch(isDone, async (done) => {
  if (!done) {
    return;
  }
  await nextTick();
  nameInput.value?.focus();
});

function submit() {
  nameError.value = validatePlayerName(name.value);
  if (nameError.value) {
    nameInput.value?.focus();
    return;
  }
  store.createPlayer({ name: name.value, avatar: avatar.value });
  router.push({ name: ROUTE.HOME });
}
</script>

<template>
  <main class="crt min-h-screen glow">
    <div class="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-10">
      <ol aria-live="polite" class="text-ink-dim">
        <li v-for="line in bootLines.slice(0, visibleLines)" :key="line">{{ line }}</li>
      </ol>

      <PixelButton v-if="!isDone" variant="secondary" class="self-start" @click="skip">
        {{ t('characterCreate.skip') }}
      </PixelButton>

      <form v-else class="flex flex-col gap-6" novalidate @submit.prevent="submit">
        <p>{{ t('characterCreate.motd') }}</p>

        <div class="flex flex-col gap-1">
          <div class="flex items-baseline gap-3">
            <label for="player-name">{{ t('characterCreate.login') }}</label>
            <input
              id="player-name"
              ref="nameInput"
              v-model="name"
              type="text"
              autocomplete="off"
              spellcheck="false"
              class="min-w-0 flex-1 border-b-2 border-dotted border-ink-dim bg-transparent text-ink caret-ink outline-none focus:border-ink"
              :aria-invalid="nameError !== null"
              :aria-describedby="nameError ? 'player-name-error' : undefined"
            />
          </div>
          <p v-if="nameError" id="player-name-error" role="alert" class="self-start px-2 inverse">
            {{ nameErrorMessage }}
          </p>
        </div>

        <fieldset class="flex flex-col gap-3">
          <legend class="mb-3">{{ t('characterCreate.avatar') }}</legend>
          <div class="flex flex-wrap gap-3">
            <label
              v-for="option in AVATARS"
              :key="option.id"
              class="flex size-16 cursor-pointer items-center justify-center text-4xl frame has-focus-visible:outline-(length:--era-border-width) has-focus-visible:outline-offset-2 has-focus-visible:outline-focus has-focus-visible:outline-solid"
              :class="{ inverse: avatar === option.id }"
            >
              <input
                v-model="avatar"
                type="radio"
                name="avatar"
                :value="option.id"
                class="sr-only"
              />
              <span aria-hidden="true">{{ option.glyph }}</span>
              <span class="sr-only">{{ avatarNames[option.id] }}</span>
            </label>
          </div>
        </fieldset>

        <PixelButton type="submit" class="self-start">
          {{ t('characterCreate.submit') }}
        </PixelButton>
      </form>
    </div>
  </main>
</template>
