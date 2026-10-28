import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

import { createFixtureModule, createSingleLessonModule } from '../fixtures/modules.js';
import { createTestApp, seedPlayer } from '../helpers/app.js';
import { ERA_KEY } from '@/composables/use-era.js';
import ModuleMapView from '@/views/ModuleMapView.vue';
import WorldMapView from '@/views/WorldMapView.vue';

const modules = [createSingleLessonModule('zero', 0), createFixtureModule({ requires: ['zero'] })];

function setup(saveOverrides) {
  const testApp = createTestApp({ modules });
  seedPlayer(testApp, saveOverrides);
  return testApp;
}

const zeroDone = { lessons: { 'zero/only-lesson': { completedAt: 'x', xpAwarded: 5 } } };

async function mountModule(testApp, moduleId) {
  const wrapper = mount(ModuleMapView, { global: { plugins: testApp.plugins } });
  await testApp.router.push(`/modulo/${moduleId}`);
  await flushPromises();
  return wrapper;
}

describe('WorldMapView', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('lists regions as a directory listing in the terminal era', () => {
    const wrapper = mount(WorldMapView, {
      global: { plugins: setup().plugins, provide: { [ERA_KEY]: ref('terminal') } },
    });
    const rows = wrapper.findAll('li');

    expect(rows[0].text()).toContain('drwxr-x');
    expect(rows[0].find('a').exists()).toBe(true);
    expect(rows[0].text()).toContain('0/1 lecciones');
    expect(rows[1].text()).toContain('d------');
    expect(rows[1].text()).toContain('requiere: modules.zero.title');
    expect(rows[1].find('a').exists()).toBe(false);
  });

  it('draws regions as tiles, dithering locked ones, in pixel eras', () => {
    const wrapper = mount(WorldMapView, {
      global: { plugins: setup().plugins, provide: { [ERA_KEY]: ref('chip8') } },
    });
    const tiles = wrapper.findAll('li');

    expect(tiles[0].find('a').exists()).toBe(true);
    expect(tiles[1].find('.dither').exists()).toBe(true);
  });
});

describe('ModuleMapView', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('shows lessons by chapter with hex numbers and status, in the module era', async () => {
    const testApp = setup(zeroDone);
    const wrapper = await mountModule(testApp, 'alpha');

    expect(wrapper.find('[data-era]').attributes('data-era')).toBe('chip8');
    expect(wrapper.findAll('h2')).toHaveLength(2);
    const lessons = wrapper.findAll('li');
    expect(lessons).toHaveLength(4);
    expect(lessons[0].text()).toContain('disponible');
    expect(lessons[1].text()).toContain('bloqueada');
    expect(lessons[0].find('svg').attributes('aria-label')).toBe('0');
    expect(lessons[1].find('.dither').exists()).toBe(true);
  });

  it('uses status glyphs in the terminal era', async () => {
    const testApp = setup();
    const wrapper = await mountModule(testApp, 'zero');

    expect(wrapper.find('li').text()).toContain('[>] 0x0');
  });

  it('sends the player back to the world map for locked or unknown modules', async () => {
    const testApp = setup();
    await mountModule(testApp, 'alpha');
    await vi.waitFor(() => expect(testApp.router.currentRoute.value.name).toBe('home'));

    await testApp.router.push('/modulo/missing');
    await vi.waitFor(() => expect(testApp.router.currentRoute.value.name).toBe('home'));
  });
});
