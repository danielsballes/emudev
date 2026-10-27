import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';

import { prefersReducedMotion, useBootSequence } from '@/composables/use-boot-sequence.js';

const renderEmpty = () => h('div');

function mountSequence(options) {
  let sequence;
  const Host = defineComponent({
    setup() {
      sequence = useBootSequence(3, options);
      return renderEmpty;
    },
  });
  const wrapper = mount(Host);
  return { wrapper, sequence };
}

describe('useBootSequence', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('reveals one line per interval and stops when done', async () => {
    vi.useFakeTimers();
    const { sequence } = mountSequence({ interval: 100, reducedMotion: false });

    await vi.advanceTimersByTimeAsync(100);
    expect(sequence.visibleLines.value).toBe(1);
    await vi.advanceTimersByTimeAsync(500);
    expect(sequence.visibleLines.value).toBe(3);
    expect(sequence.isDone.value).toBe(true);
  });

  it('shows everything at once with reduced motion', () => {
    const { sequence } = mountSequence({ reducedMotion: true });

    expect(sequence.isDone.value).toBe(true);
  });

  it('can be skipped and stops on unmount', async () => {
    vi.useFakeTimers();
    const { wrapper, sequence } = mountSequence({ reducedMotion: false });

    sequence.skip();
    expect(sequence.visibleLines.value).toBe(3);
    wrapper.unmount();
    await vi.advanceTimersByTimeAsync(2000);
    expect(sequence.visibleLines.value).toBe(3);
  });

  it('reads the reduced motion preference from the browser', () => {
    expect(prefersReducedMotion()).toBe(false);
    vi.stubGlobal('matchMedia', () => ({ matches: true }));
    expect(prefersReducedMotion()).toBe(true);
  });
});
