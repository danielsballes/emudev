import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';

import { createSandboxRunner } from '@/modules/chip8/sandbox-runner.js';
import { useSandbox } from '@/modules/chip8/use-sandbox.js';

const COUNTER_ROM = [0x60, 0x05, 0x70, 0x01, 0x12, 0x02];
const renderEmpty = () => h('div');

/**
 * Mounts a host component and a manual frame scheduler, so tests control time.
 */
function setup() {
  const frames = [];
  const cancel = vi.fn();
  const schedule = vi.fn((callback) => frames.push(callback));
  const runner = createSandboxRunner({ instructionsPerSecond: 1000 });
  let sandbox;
  const wrapper = mount(
    defineComponent({
      setup() {
        sandbox = useSandbox({ runner, schedule, cancel });
        return renderEmpty;
      },
    }),
  );
  const runFrame = (time) => frames.shift()(time);
  return { sandbox, wrapper, runner, runFrame, schedule, cancel };
}

describe('useSandbox', () => {
  it('shows a snapshot of the loaded ROM and stays paused', () => {
    const { sandbox } = setup();

    sandbox.load(COUNTER_ROM);

    expect(sandbox.isRunning.value).toBe(false);
    expect(sandbox.view.value.pc).toBe(0x2_00);
  });

  it('runs frame by frame while playing and updates the view', () => {
    const { sandbox, runFrame, schedule } = setup();
    sandbox.load(COUNTER_ROM);

    sandbox.play();
    expect(schedule).toHaveBeenCalledOnce();
    runFrame(1000);
    runFrame(1010);

    expect(sandbox.isRunning.value).toBe(true);
    expect(sandbox.view.value.v[0]).toBe(5 + 5);
    expect(schedule).toHaveBeenCalledTimes(3);
  });

  it('does not schedule twice when played twice or without a ROM', () => {
    const { sandbox, schedule } = setup();

    sandbox.play();
    expect(schedule).not.toHaveBeenCalled();

    sandbox.load(COUNTER_ROM);
    sandbox.play();
    sandbox.play();
    expect(schedule).toHaveBeenCalledOnce();
  });

  it('pauses, cancels the pending frame and resumes without a time jump', () => {
    const { sandbox, runFrame, cancel } = setup();
    sandbox.load(COUNTER_ROM);
    sandbox.play();
    runFrame(1000);

    sandbox.pause();
    expect(cancel).toHaveBeenCalled();
    expect(sandbox.isRunning.value).toBe(false);

    sandbox.play();
    runFrame(5000);
    expect(sandbox.view.value.v[0]).toBe(0);
  });

  it('steps, resets and changes quirks while paused', () => {
    const { sandbox } = setup();
    sandbox.load(COUNTER_ROM);

    sandbox.stepOnce();
    expect(sandbox.view.value.v[0]).toBe(5);

    sandbox.reset();
    expect(sandbox.view.value.v[0]).toBe(0);

    sandbox.setQuirks('schip');
    expect(sandbox.runner.quirks).toBe('schip');
  });

  it('exposes execution errors and stops the loop', () => {
    const { sandbox, runFrame, schedule } = setup();
    sandbox.load([0x00, 0xee]);

    sandbox.play();
    runFrame(0);
    runFrame(10);

    expect(sandbox.error.value).toMatchObject({ code: 'stack-underflow' });
    expect(sandbox.isRunning.value).toBe(false);
    expect(schedule).toHaveBeenCalledTimes(2);
  });

  it('sets keys and stops the loop when unmounted', () => {
    const { sandbox, wrapper, cancel } = setup();
    sandbox.load(COUNTER_ROM);
    sandbox.play();

    sandbox.setKey(3, true);
    expect(sandbox.view.value.keys[3]).toBe(1);

    wrapper.unmount();
    expect(cancel).toHaveBeenCalled();
  });
});
