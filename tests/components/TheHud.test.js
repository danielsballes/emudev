import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it } from 'vitest';
import { ref } from 'vue';

import { createTestApp, seedPlayer } from '../helpers/app.js';
import TheHud from '@/components/TheHud.vue';
import { ERA_KEY } from '@/composables/use-era.js';

function mountHud(era) {
  const testApp = createTestApp();
  seedPlayer(testApp, { xp: 140 });
  return mount(TheHud, {
    global: { plugins: testApp.plugins, provide: { [ERA_KEY]: ref(era) } },
  });
}

describe('TheHud', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('shows avatar, name, level and xp as text in the terminal era', () => {
    const text = mountHud('terminal').text();

    expect(text).toContain('¶');
    expect(text).toContain('Ada');
    expect(text).toContain('nivel 2');
    expect(text).toContain('[##........]');
    expect(text).toContain('40 / 200 xp');
  });

  it('draws the level with the CHIP-8 font in the chip8 era', () => {
    const wrapper = mountHud('chip8');

    expect(wrapper.find('svg[role="img"]').attributes('aria-label')).toBe('nivel 2');
    expect(wrapper.find('[role="progressbar"]').attributes()).toMatchObject({
      'aria-valuenow': '40',
      'aria-valuemax': '200',
      'aria-label': 'Progreso hacia el nivel 3',
    });
  });
});
