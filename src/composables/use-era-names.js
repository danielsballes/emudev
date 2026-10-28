import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

/**
 * Spanish names of every era, keyed by era id.
 */
export function useEraNames() {
  const { t } = useI18n();
  return computed(() => ({
    terminal: t('eras.terminal'),
    chip8: t('eras.chip8'),
    gameboy: t('eras.gameboy'),
    nes: t('eras.nes'),
    gba: t('eras.gba'),
    'early-3d': t('eras.early-3d'),
    modern: t('eras.modern'),
  }));
}
