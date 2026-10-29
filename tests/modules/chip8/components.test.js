import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createTestApp } from '../../helpers/app.js';
import Chip8Screen from '@/modules/chip8/components/Chip8Screen.vue';
import HexKeypad from '@/modules/chip8/components/HexKeypad.vue';
import MachineDebugger from '@/modules/chip8/components/MachineDebugger.vue';
import { createSandboxRunner } from '@/modules/chip8/sandbox-runner.js';

// 0x200: LD V1, 0x2A / 0x202: CALL 0x206 / 0x204: JP 0x204 / 0x206: DRW V0, V0, 1.
const ROM = [0x61, 0x2a, 0x22, 0x06, 0x12, 0x04, 0xd0, 0x01];

function createView(steps = 0) {
  const runner = createSandboxRunner();
  runner.load(ROM);
  for (let step = 0; step < steps; step += 1) {
    runner.stepOnce();
  }
  return runner.snapshot();
}

describe('Chip8Screen', () => {
  let context;

  beforeEach(() => {
    context = {
      createImageData: (width, height) => ({ data: new Uint8ClampedArray(width * height * 4) }),
      putImageData: vi.fn(),
    };
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('is a labelled 64x32 canvas', () => {
    const wrapper = mount(Chip8Screen, {
      props: { display: createView().display, label: 'Pantalla' },
    });

    expect(wrapper.attributes()).toMatchObject({ role: 'img', 'aria-label': 'Pantalla' });
    expect(wrapper.attributes('width')).toBe('64');
    expect(wrapper.attributes('height')).toBe('32');
  });

  it('paints lit and unlit pixels with the colors of the active era', async () => {
    vi.spyOn(globalThis, 'getComputedStyle').mockReturnValue({
      color: 'rgb(220, 238, 255)',
      backgroundColor: 'rgb(11, 22, 38)',
    });
    const display = new Uint8Array(64 * 32);
    display[1] = 1;
    const wrapper = mount(Chip8Screen, { props: { display, label: 'Pantalla' } });

    const [image] = context.putImageData.mock.calls.at(-1);
    expect(image.data.slice(0, 8)).toEqual(
      new Uint8ClampedArray([11, 22, 38, 255, 220, 238, 255, 255]),
    );

    const next = new Uint8Array(64 * 32);
    await wrapper.setProps({ display: next });
    expect(context.putImageData).toHaveBeenCalledTimes(2);
  });

  it('tolerates canvases without a 2D context', () => {
    HTMLCanvasElement.prototype.getContext.mockReturnValue(null);

    expect(() =>
      mount(Chip8Screen, { props: { display: createView().display, label: 'Pantalla' } }),
    ).not.toThrow();
  });
});

describe('HexKeypad', () => {
  it('lays keys out like the original keypad and marks the pressed ones', () => {
    const keys = new Uint8Array(16);
    keys[0xa] = 1;
    const wrapper = mount(HexKeypad, { props: { keys, label: 'Teclado' } });
    const buttons = wrapper.findAll('button');

    expect(buttons.map((button) => button.text()).join('')).toBe('123C456D789EA0BF');
    expect(wrapper.attributes('aria-label')).toBe('Teclado');
    expect(buttons[12].attributes('aria-pressed')).toBe('true');
    expect(buttons[12].classes()).toContain('inverse');
    expect(buttons[0].attributes('aria-pressed')).toBe('false');
  });

  it('emits key presses and releases from pointer and keyboard', async () => {
    const wrapper = mount(HexKeypad, { props: { keys: new Uint8Array(16), label: 'Teclado' } });
    const [one] = wrapper.findAll('button');

    await one.trigger('pointerdown');
    await one.trigger('pointerup');
    await one.trigger('pointerleave');
    await one.trigger('keydown', { key: ' ' });
    await one.trigger('keyup', { key: ' ' });

    expect(wrapper.emitted('key')).toEqual([
      [1, true],
      [1, false],
      [1, false],
      [1, true],
      [1, false],
    ]);
  });
});

function mountDebugger(view) {
  return mount(MachineDebugger, {
    props: { view },
    global: { plugins: createTestApp().plugins },
  });
}

const valueOf = (wrapper, label) =>
  wrapper.findAll('dt').find((term) => term.text() === label).element.nextElementSibling
    .textContent;

describe('MachineDebugger', () => {
  it('shows registers, pointers and the next instructions with the current one highlighted', () => {
    const wrapper = mountDebugger(createView(1));

    expect(valueOf(wrapper, 'V1')).toBe('2A');
    expect(valueOf(wrapper, 'V0')).toBe('00');
    expect(valueOf(wrapper, 'PC')).toBe('202');
    expect(wrapper.text()).toContain('Pila: vacía');
    const lines = wrapper.findAll('ol li');
    expect(lines).toHaveLength(8);
    expect(lines[0].findAll('span').map((cell) => cell.text())).toEqual([
      '202',
      '2206',
      'CALL 0x206',
    ]);
    expect(lines[0].classes()).toContain('inverse');
    expect(lines[1].classes()).not.toContain('inverse');
  });

  it('shows the call stack after a CALL', () => {
    const wrapper = mountDebugger(createView(2));

    expect(valueOf(wrapper, 'SP')).toBe('1');
    expect(valueOf(wrapper, 'PC')).toBe('206');
    expect(wrapper.text()).toContain('Pila: 204');
  });
});
