import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it } from 'vitest';

import { createTestApp, seedPlayer } from '../helpers/app.js';
import HomeView from '@/views/HomeView.vue';

describe('HomeView', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('greets the player and shows the build version', () => {
    const testApp = createTestApp();
    seedPlayer(testApp);

    const wrapper = mount(HomeView, { global: { plugins: testApp.plugins } });

    expect(wrapper.find('h1').text()).toBe('Hola, Ada.');
    expect(wrapper.find('footer').text()).toBe('Versión dev');
  });
});
