import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { ref } from 'vue';

import PixelNumber from '@/components/ui/PixelNumber.vue';
import XpBar from '@/components/ui/XpBar.vue';
import { ERA_KEY } from '@/composables/use-era.js';
import { layoutNumber } from '@/themes/chip8/hex-font.js';

describe('layoutNumber', () => {
  it('lights the pixels of the CHIP-8 hex font', () => {
    // "0" is F0 90 90 90 F0: 4 + 2 + 2 + 2 + 4 pixels.
    expect(layoutNumber(0)).toMatchObject({ width: 4, text: '0' });
    expect(layoutNumber(0).pixels).toHaveLength(14);
    expect(layoutNumber(0).pixels[0]).toEqual({ x: 0, y: 0 });
  });

  it('spaces digits by one column and supports hexadecimal', () => {
    expect(layoutNumber(10)).toMatchObject({ width: 9, text: '10' });
    expect(layoutNumber(10).pixels.some((pixel) => pixel.x === 5)).toBe(true);
    expect(layoutNumber(0xb, 16).text).toBe('b');
  });
});

describe('PixelNumber', () => {
  it('renders one square per lit pixel with an accessible label', () => {
    const wrapper = mount(PixelNumber, { props: { value: 0 } });

    expect(wrapper.findAll('rect')).toHaveLength(14);
    expect(wrapper.attributes('aria-label')).toBe('0');
    expect(wrapper.attributes('viewBox')).toBe('0 0 4 5');
  });

  it('prefers an explicit label', () => {
    const wrapper = mount(PixelNumber, { props: { value: 2, label: 'nivel 2' } });

    expect(wrapper.attributes('aria-label')).toBe('nivel 2');
  });
});

describe('XpBar', () => {
  const props = { value: 30, max: 100, label: 'Progreso' };
  const withEra = (era) => ({ props, global: { provide: { [ERA_KEY]: ref(era) } } });

  it('draws an ASCII bar in the terminal era', () => {
    expect(mount(XpBar, withEra('terminal')).text()).toBe('[###.......]');
  });

  it('draws pixel segments in other eras', () => {
    const segments = mount(XpBar, withEra('chip8')).findAll('[data-segment]');

    expect(segments).toHaveLength(10);
    expect(segments.filter((segment) => segment.classes('bg-ink'))).toHaveLength(3);
  });

  it('defaults to the terminal era and never overflows', () => {
    const wrapper = mount(XpBar, { props: { ...props, value: 500 } });

    expect(wrapper.text()).toBe('[##########]');
    expect(wrapper.attributes('role')).toBe('progressbar');
  });
});
