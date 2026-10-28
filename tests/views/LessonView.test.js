import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createTestApp, seedPlayer } from '../helpers/app.js';
import { useSaveStore } from '@/stores/save.js';
import LessonView from '@/views/LessonView.vue';

const STARTER = 'export const add = () => 0;';

function createModule() {
  return {
    id: 'alpha',
    order: 0,
    era: 'chip8',
    region: { titleKey: 'modules.chip8.title' },
    chapters: [
      {
        id: 'basics',
        titleKey: 'modules.chip8.chapters.introduccion',
        lessons: [
          {
            id: 'intro',
            titleKey: 'modules.chip8.lessons.memoria',
            type: 'lesson',
            xp: 10,
            content: () => Promise.resolve({ default: '# Hola\n\nTexto con `código`.' }),
          },
          {
            id: 'sum',
            titleKey: 'modules.chip8.lessons.registros',
            type: 'exercise',
            xp: 50,
            content: () => Promise.resolve({ default: '# Suma' }),
            exercise: () => Promise.resolve({ starter: STARTER, tests: 'export default [];' }),
          },
        ],
      },
    ],
  };
}

const CodeEditorStub = {
  props: ['modelValue', 'label'],
  emits: ['update:modelValue'],
  template:
    '<textarea :aria-label="label" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
};

async function mountLesson(lessonId, { run, save } = {}) {
  const testApp = createTestApp({ modules: [createModule()] });
  seedPlayer(testApp, { xp: 0, ...save });
  if (run) {
    testApp.runner.run = run;
  }
  const wrapper = mount(LessonView, {
    global: { plugins: testApp.plugins, stubs: { CodeEditor: CodeEditorStub } },
  });
  await testApp.router.push(`/modulo/alpha/leccion/${lessonId}`);
  await flushPromises();
  return { wrapper, testApp };
}

const introDone = { lessons: { 'alpha/intro': { completedAt: 'x', xpAwarded: 10 } } };

describe('LessonView', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders the lesson Markdown in the module era and completes reading lessons', async () => {
    const { wrapper, testApp } = await mountLesson('intro');

    expect(wrapper.find('[data-era]').attributes('data-era')).toBe('chip8');
    expect(wrapper.find('.lesson-prose h1').text()).toBe('Hola');
    expect(wrapper.find('.lesson-prose code').text()).toBe('código');

    await wrapper.find('button').trigger('click');

    expect(useSaveStore(testApp.pinia).isLessonCompleted('alpha', 'intro')).toBe(true);
    expect(wrapper.text()).toContain('+10 xp');
    expect(wrapper.text()).toContain('Siguiente: Registros V0–VF, I y PC');
  });

  it('runs exercises, explains failures in Spanish and keeps the lesson open', async () => {
    const run = vi.fn().mockResolvedValue({
      status: 'failed',
      summary: { passed: 0, total: 1 },
      results: [
        {
          name: 'suma 2 + 3',
          passed: false,
          hint: 'Devuelve a + b',
          error: { matcher: 'toBe', expected: '5', actual: '0', negated: false, message: '' },
        },
      ],
      logs: [{ level: 'log', text: 'hola' }],
    });
    const { wrapper, testApp } = await mountLesson('sum', { run, save: introDone });

    expect(wrapper.find('textarea').element.value).toBe(STARTER);
    await wrapper.findAll('button').at(-1).trigger('click');
    await flushPromises();

    expect(run).toHaveBeenCalledWith({ studentSource: STARTER, testsSource: 'export default [];' });
    const text = wrapper.text();
    expect(text).toContain('Pasan 0 de 1 tests.');
    expect(text).toContain('[ ] suma 2 + 3');
    expect(text).toContain('Se esperaba 5 y se obtuvo 0.');
    expect(text).toContain('Pista: Devuelve a + b');
    expect(text).toContain('hola');
    expect(useSaveStore(testApp.pinia).isLessonCompleted('alpha', 'sum')).toBe(false);
  });

  it('completes the exercise when every test passes and saves the code', async () => {
    vi.useFakeTimers();
    const run = vi.fn().mockResolvedValue({ status: 'passed', results: [], logs: [] });
    const { wrapper, testApp } = await mountLesson('sum', { run, save: introDone });
    const store = useSaveStore(testApp.pinia);

    await wrapper.find('textarea').setValue('export const add = (a, b) => a + b;');
    await vi.advanceTimersByTimeAsync(500);
    expect(store.getCode('alpha', 'sum')).toBe('export const add = (a, b) => a + b;');

    await wrapper.findAll('button').at(-1).trigger('click');
    await vi.runAllTimersAsync();
    vi.useRealTimers();

    expect(store.isLessonCompleted('alpha', 'sum')).toBe(true);
    expect(wrapper.text()).toContain('Todos los tests pasan.');
    expect(wrapper.text()).toContain('Volver al mapa del mundo');
  });

  it('sends the player back to the module map for locked lessons', async () => {
    const { testApp } = await mountLesson('sum');

    await vi.waitFor(() => expect(testApp.router.currentRoute.value.name).toBe('module'));
  });
});
