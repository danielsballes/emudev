import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it } from 'vitest';

import { createTestApp, seedPlayer } from './helpers/app.js';
import { createSingleLessonModule } from './fixtures/modules.js';
import App from '@/App.vue';

async function mountApp(testApp, path = '/') {
  const wrapper = mount(App, { global: { plugins: testApp.plugins } });
  await testApp.router.push(path);
  await flushPromises();
  return wrapper;
}

describe('App', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('sends new players to character creation, without HUD, in the terminal era', async () => {
    const testApp = createTestApp({ modules: [createSingleLessonModule('fundamentals', 0)] });

    const wrapper = await mountApp(testApp);

    expect(testApp.router.currentRoute.value.name).toBe('create-character');
    expect(wrapper.find('header').exists()).toBe(false);
    expect(document.documentElement.dataset.era).toBe('terminal');
  });

  it('shows the HUD and the shell era once the player exists', async () => {
    const testApp = createTestApp();
    seedPlayer(testApp);

    const wrapper = await mountApp(testApp);

    expect(testApp.router.currentRoute.value.name).toBe('home');
    expect(wrapper.find('header').text()).toContain('Ada');
    expect(document.documentElement.dataset.era).toBe('chip8');
  });

  it('keeps players with a character away from character creation', async () => {
    const testApp = createTestApp();
    seedPlayer(testApp);

    await mountApp(testApp, '/crear-personaje');

    expect(testApp.router.currentRoute.value.name).toBe('home');
  });
});
