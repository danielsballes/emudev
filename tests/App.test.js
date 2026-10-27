import { flushPromises, mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import App from '@/App.vue';
import { router } from '@/router';

describe('App', () => {
  it('renders the routed view', async () => {
    await router.push('/');
    await router.isReady();

    const wrapper = mount(App, { global: { plugins: [router] } });
    await flushPromises();

    expect(wrapper.find('h1').exists()).toBe(true);
  });
});
