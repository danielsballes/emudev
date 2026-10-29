import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createFixtureModule, createSingleLessonModule } from '../fixtures/modules.js';
import { createTestApp, seedPlayer } from '../helpers/app.js';
import EraUnlockedOverlay from '@/components/EraUnlockedOverlay.vue';
import { SaveFormatError } from '@/engine/storage/index.js';
import { useSaveStore } from '@/stores/save.js';
import ProfileView from '@/views/ProfileView.vue';

const modules = [createSingleLessonModule('zero', 0), createFixtureModule({ requires: ['zero'] })];
// Completing `zero` unlocks two eras at once: chip8 (alpha) and gameboy (beta).
const twoEraModules = [
  ...modules,
  createSingleLessonModule('beta', 2, { era: 'gameboy', requires: ['zero'] }),
];
const zeroDone = { lessons: { 'zero/only-lesson': { completedAt: 'x', xpAwarded: 5 } } };

function setup(save, appModules = modules) {
  const testApp = createTestApp({ modules: appModules });
  seedPlayer(testApp, save);
  return testApp;
}

function selectFile(input, content) {
  const file = new File([content], 'save.json', { type: 'application/json' });
  Object.defineProperty(input.element, 'files', { value: [file], configurable: true });
  return input.trigger('change');
}

describe('ProfileView', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows the player, level and badges with their status', () => {
    const wrapper = mount(ProfileView, { global: { plugins: setup().plugins } });

    expect(wrapper.find('h1').text()).toBe('Ada');
    expect(wrapper.text()).toContain('Nivel 1, 40 xp en total');
    const badges = wrapper.findAll('li');
    expect(badges).toHaveLength(3);
    expect(badges[0].text()).toContain('pendiente');
  });

  it('switches the shell skin among unlocked eras', async () => {
    const testApp = setup(zeroDone);
    const wrapper = mount(ProfileView, { global: { plugins: testApp.plugins } });
    const store = useSaveStore(testApp.pinia);

    expect(wrapper.findAll('input[name="skin"]')).toHaveLength(3);
    expect(store.shellEra).toBe('chip8');

    await wrapper.find('input[value="terminal"]').setValue(true);
    expect(store.shellEra).toBe('terminal');

    await wrapper.find('input[value=""]').setValue(true);
    expect(store.save.skin).toBeNull();
  });

  it('downloads the save as a JSON file', async () => {
    const createUrl = vi.fn(() => 'blob:save');
    vi.stubGlobal('URL', { ...URL, createObjectURL: createUrl, revokeObjectURL: vi.fn() });
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const wrapper = mount(ProfileView, { global: { plugins: setup().plugins } });

    await wrapper.find('button').trigger('click');

    expect(createUrl).toHaveBeenCalledWith(expect.any(Blob));
    expect(click).toHaveBeenCalledOnce();
    vi.unstubAllGlobals();
  });

  it('imports a save and explains invalid files', async () => {
    const testApp = setup();
    const wrapper = mount(ProfileView, { global: { plugins: testApp.plugins } });
    const store = useSaveStore(testApp.pinia);
    const backup = store.exportSave().replace('"xp": 40', '"xp": 99');
    const input = wrapper.find('input[type="file"]');

    await selectFile(input, backup);
    await flushPromises();
    expect(wrapper.find('[role="status"]').text()).toBe('Partida importada.');
    expect(store.save.xp).toBe(99);

    await selectFile(input, 'not json');
    await flushPromises();
    expect(wrapper.find('[role="status"]').text()).toBe(
      'El archivo no es una partida válida (JSON incorrecto).',
    );
  });

  it('shows a generic message for unexpected import errors', async () => {
    const testApp = setup();
    testApp.repository.importSave = () => {
      throw new SaveFormatError('something-new', 'unexpected');
    };
    const wrapper = mount(ProfileView, { global: { plugins: testApp.plugins } });

    await selectFile(wrapper.find('input[type="file"]'), '{}');
    await flushPromises();

    expect(wrapper.find('[role="status"]').text()).toBe(
      'No se pudo importar la partida. Comprueba el archivo e inténtalo de nuevo.',
    );
  });

  it('ignores an empty file selection', async () => {
    const wrapper = mount(ProfileView, { global: { plugins: setup().plugins } });
    const input = wrapper.find('input[type="file"]');
    Object.defineProperty(input.element, 'files', { value: [], configurable: true });

    await input.trigger('change');

    expect(wrapper.find('[role="status"]').exists()).toBe(false);
  });
});

describe('EraUnlockedOverlay', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('announces eras unlocked by a completion and closes on continue', async () => {
    const testApp = setup();
    const wrapper = mount(EraUnlockedOverlay, {
      attachTo: document.body,
      global: { plugins: testApp.plugins },
    });
    const store = useSaveStore(testApp.pinia);

    const result = store.completeLesson({ moduleId: 'zero', lessonId: 'only-lesson' });
    await flushPromises();

    expect(result.newEras).toEqual(['chip8']);
    const dialog = wrapper.find('[role="alertdialog"]');
    expect(dialog.text()).toContain('Nueva era desbloqueada: CHIP-8');
    expect(dialog.attributes('data-era')).toBe('chip8');
    expect(document.activeElement).toBe(dialog.element);

    await wrapper.find('button').trigger('click');
    expect(wrapper.find('[role="alertdialog"]').exists()).toBe(false);
    wrapper.unmount();
  });

  it('announces several unlocked eras one at a time, oldest first', async () => {
    const testApp = setup(undefined, twoEraModules);
    const wrapper = mount(EraUnlockedOverlay, { global: { plugins: testApp.plugins } });
    const store = useSaveStore(testApp.pinia);

    const result = store.completeLesson({ moduleId: 'zero', lessonId: 'only-lesson' });
    await flushPromises();

    expect(result.newEras).toEqual(['chip8', 'gameboy']);
    expect(wrapper.find('[role="alertdialog"]').text()).toContain('CHIP-8');

    await wrapper.find('button').trigger('click');
    expect(wrapper.find('[role="alertdialog"]').text()).toContain('Game Boy');

    await wrapper.find('button').trigger('click');
    expect(wrapper.find('[role="alertdialog"]').exists()).toBe(false);
  });

  it('forgets pending announcements when the save is imported or reset', () => {
    const testApp = setup(undefined, twoEraModules);
    mount(EraUnlockedOverlay, { global: { plugins: testApp.plugins } });
    const store = useSaveStore(testApp.pinia);
    const backup = store.exportSave();

    store.completeLesson({ moduleId: 'zero', lessonId: 'only-lesson' });
    expect(store.pendingEras).toHaveLength(2);
    store.importSave(backup);
    expect(store.pendingEras).toEqual([]);

    store.completeLesson({ moduleId: 'zero', lessonId: 'only-lesson' });
    store.resetSave();
    expect(store.pendingEras).toEqual([]);
  });

  it('does not announce anything when no era is unlocked', () => {
    const testApp = setup(zeroDone);
    const wrapper = mount(EraUnlockedOverlay, { global: { plugins: testApp.plugins } });
    const store = useSaveStore(testApp.pinia);

    const result = store.completeLesson({ moduleId: 'alpha', lessonId: 'intro' });
    const again = store.completeLesson({ moduleId: 'alpha', lessonId: 'intro' });

    expect(result.newEras).toEqual([]);
    expect(again.newEras).toEqual([]);
    expect(wrapper.find('[role="alertdialog"]').exists()).toBe(false);
  });
});
