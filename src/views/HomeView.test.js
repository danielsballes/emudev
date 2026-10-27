import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import HomeView from './HomeView.vue';

describe('HomeView', () => {
  it('renders the app name and tagline from the Spanish locale', () => {
    const wrapper = mount(HomeView);

    expect(wrapper.find('h1').text()).toBe('EmuDev Academy');
    expect(wrapper.text()).toContain('Aprende a construir emuladores');
  });

  it('shows the build version', () => {
    const wrapper = mount(HomeView);

    expect(wrapper.find('footer').text()).toBe('Versión dev');
  });
});
