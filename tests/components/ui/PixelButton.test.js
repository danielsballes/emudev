import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import PixelButton from '@/components/ui/PixelButton.vue';

describe('PixelButton', () => {
  it('renders slot content as a primary (inverse video) button by default', () => {
    const wrapper = mount(PixelButton, { slots: { default: 'Jugar' } });

    expect(wrapper.text()).toBe('Jugar');
    expect(wrapper.attributes('type')).toBe('button');
    expect(wrapper.classes()).toContain('inverse');
  });

  it('applies the secondary style and the submit type', () => {
    const wrapper = mount(PixelButton, { props: { variant: 'secondary', type: 'submit' } });

    expect(wrapper.classes()).toContain('bg-surface');
    expect(wrapper.attributes('type')).toBe('submit');
  });
});
