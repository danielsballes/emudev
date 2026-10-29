import { defineStore } from 'pinia';
import { computed, ref, shallowRef } from 'vue';

import { useEngine } from '@/engine/plugin.js';
import {
  completeLesson as applyLessonCompletion,
  getShellEra,
  getUnlockedEras,
  getLevelInfo,
  getModuleProgress as computeModuleProgress,
  isLessonCompleted as checkLessonCompleted,
  isLessonUnlocked as checkLessonUnlocked,
  isModuleUnlocked as checkModuleUnlocked,
  progressKey,
} from '@/engine/progression/index.js';
import { createEmptySave } from '@/engine/storage/index.js';

export const PLAYER_NAME_MAX_LENGTH = 20;

/**
 * Validation error codes for player names, usable as i18n keys by the UI.
 */
export const PLAYER_NAME_ERROR = Object.freeze({ EMPTY: 'empty', TOO_LONG: 'too-long' });

/**
 * @param {string} name
 * @returns {string | null} A `PLAYER_NAME_ERROR` code, or null when valid.
 */
export function validatePlayerName(name) {
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    return PLAYER_NAME_ERROR.EMPTY;
  }
  return trimmed.length > PLAYER_NAME_MAX_LENGTH ? PLAYER_NAME_ERROR.TOO_LONG : null;
}

/**
 * The player's save (profile, XP, completed lessons, code, badges).
 * The save is replaced immutably on every change and persisted through the engine repository.
 */
export const useSaveStore = defineStore('save', () => {
  const { registry, repository } = useEngine();
  const save = shallowRef(repository.load());

  // Write first: if storage fails (e.g. quota exceeded) the in-memory state stays unchanged and
  // the action can be retried.
  function persist(next) {
    repository.save(next);
    save.value = next;
  }

  const player = computed(() => save.value.player);
  const hasPlayer = computed(() => save.value.player !== null);
  const levelInfo = computed(() => getLevelInfo(save.value.xp));
  const unlockedEras = computed(() => getUnlockedEras(save.value, registry));
  const shellEra = computed(() => getShellEra(save.value, registry));

  function createPlayer({ name, avatar }) {
    const error = validatePlayerName(name);
    if (error) {
      throw new RangeError(`Invalid player name: ${error}`);
    }
    persist({
      ...save.value,
      player: { name: name.trim(), avatar, createdAt: new Date().toISOString() },
    });
  }

  // Eras unlocked by the last completion, waiting to be announced by the UI.
  const pendingEras = ref([]);

  function completeLesson({ moduleId, lessonId }) {
    const result = applyLessonCompletion(save.value, registry, { moduleId, lessonId });
    if (result.isAlreadyCompleted) {
      return { ...result, newEras: [] };
    }
    const erasBefore = unlockedEras.value;
    persist(result.save);
    const newEras = unlockedEras.value.filter((era) => !erasBefore.includes(era));
    pendingEras.value = [...pendingEras.value, ...newEras];
    return { ...result, newEras };
  }

  // Announcements are shown one at a time, oldest first.
  function acknowledgeNextEra() {
    pendingEras.value = pendingEras.value.slice(1);
  }

  const getCode = (moduleId, lessonId) => save.value.code[progressKey(moduleId, lessonId)];

  function saveCode(moduleId, lessonId, code) {
    persist({
      ...save.value,
      code: { ...save.value.code, [progressKey(moduleId, lessonId)]: code },
    });
  }

  const isLessonCompleted = (moduleId, lessonId) =>
    checkLessonCompleted(save.value, moduleId, lessonId);
  const isLessonUnlocked = (moduleId, lessonId) =>
    checkLessonUnlocked(save.value, registry, { moduleId, lessonId });
  const isModuleUnlocked = (moduleId) => checkModuleUnlocked(save.value, registry, moduleId);
  const getModuleProgress = (moduleId) => computeModuleProgress(save.value, registry, moduleId);

  /**
   * Chooses an unlocked era as the shell skin, or `null` to follow progress again.
   * @param {string | null} era
   */
  function setSkin(era) {
    if (era !== null && !unlockedEras.value.includes(era)) {
      throw new RangeError(`Era ${era} is not unlocked`);
    }
    persist({ ...save.value, skin: era });
  }

  const exportSave = () => repository.exportSave();

  function importSave(serialized) {
    save.value = repository.importSave(serialized);
    pendingEras.value = [];
  }

  function resetSave() {
    repository.clear();
    save.value = createEmptySave();
    pendingEras.value = [];
  }

  return {
    save,
    player,
    hasPlayer,
    levelInfo,
    unlockedEras,
    shellEra,
    setSkin,
    createPlayer,
    completeLesson,
    pendingEras,
    acknowledgeNextEra,
    getCode,
    saveCode,
    isLessonCompleted,
    isLessonUnlocked,
    isModuleUnlocked,
    getModuleProgress,
    exportSave,
    importSave,
    resetSave,
  };
});
