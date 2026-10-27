import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import PixelButton from './PixelButton.vue';

describe('PixelButton', () => {
  it('renders slot content with the primary style by default', () => {
    const wrapper = mount(PixelButton, { slots: { default: 'Jugar' } });

    expect(wrapper.text()).toBe('Jugar');
    expect(wrapper.classes()).toContain('bg-gold');
  });

  it('applies the secondary style', () => {
    const wrapper = mount(PixelButton, { props: { variant: 'secondary' } });

    expect(wrapper.classes()).toContain('bg-slate');
  });
});
