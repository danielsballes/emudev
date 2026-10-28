import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createTestApp } from '../helpers/app.js';
import { useSaveStore } from '@/stores/save.js';
import CharacterCreateView from '@/views/CharacterCreateView.vue';

async function mountView() {
  const testApp = createTestApp();
  const wrapper = mount(CharacterCreateView, {
    attachTo: document.body,
    global: { plugins: testApp.plugins },
  });
  // Navigate after mounting: the player guard needs the engine installed by the app.
  await testApp.router.push('/crear-personaje');
  return { wrapper, testApp };
}

async function skipBoot(wrapper) {
  await wrapper.find('button').trigger('click');
  await flushPromises();
}

describe('CharacterCreateView', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.replaceChildren();
  });

  it('reveals the boot lines one by one, then the login form', async () => {
    vi.useFakeTimers();
    const { wrapper } = await mountView();

    expect(wrapper.findAll('li')).toHaveLength(0);
    await vi.advanceTimersByTimeAsync(350);
    expect(wrapper.findAll('li')).toHaveLength(1);
    expect(wrapper.find('li').text()).toBe('emudev bios dev');

    await vi.advanceTimersByTimeAsync(350 * 3);
    expect(wrapper.findAll('li')).toHaveLength(4);
    expect(wrapper.find('form').exists()).toBe(true);
    expect(document.activeElement?.id).toBe('player-name');
  });

  it('lets the player skip the boot sequence', async () => {
    const { wrapper } = await mountView();

    await skipBoot(wrapper);

    expect(wrapper.findAll('li')).toHaveLength(4);
    expect(wrapper.find('form').exists()).toBe(true);
  });

  it('explains invalid names next to the field', async () => {
    const { wrapper } = await mountView();
    await skipBoot(wrapper);

    await wrapper.find('form').trigger('submit');
    const input = wrapper.find('#player-name');

    expect(wrapper.find('[role="alert"]').text()).toBe('Escribe un nombre para continuar.');
    expect(input.attributes('aria-invalid')).toBe('true');
    expect(input.attributes('aria-describedby')).toBe('player-name-error');

    await input.setValue('x'.repeat(21));
    await wrapper.find('form').trigger('submit');
    expect(wrapper.find('[role="alert"]').text()).toBe(
      'El nombre puede tener hasta 20 caracteres.',
    );
  });

  it('creates the player with the chosen avatar and opens the home screen', async () => {
    const { wrapper, testApp } = await mountView();
    await skipBoot(wrapper);

    await wrapper.find('#player-name').setValue('  Ada ');
    await wrapper.find('input[value="section"]').setValue(true);
    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(useSaveStore(testApp.pinia).player).toMatchObject({ name: 'Ada', avatar: 'section' });
    // The home view is lazy-loaded, so navigation resolves after the import.
    await vi.waitFor(() => expect(testApp.router.currentRoute.value.name).toBe('home'));
  });

  it('names every avatar for screen readers', async () => {
    const { wrapper } = await mountView();
    await skipBoot(wrapper);

    const names = wrapper.findAll('fieldset .sr-only').map((node) => node.text());

    expect(names.filter(Boolean)).toEqual([
      'arroba',
      'et',
      'párrafo',
      'calderón',
      'almohadilla',
      'moneda',
    ]);
  });
});
