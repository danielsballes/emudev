import { describe, expect, it } from 'vitest';

import { createSandboxRunner } from '@/modules/chip8/sandbox-runner.js';

// 0x200: LD V0, 0x05 / 0x202: ADD V0, 0x01 / 0x204: JP 0x202 (counts forever).
const COUNTER_ROM = [0x60, 0x05, 0x70, 0x01, 0x12, 0x02];
// 0x200: RET (stack underflow on the first step).
const BROKEN_ROM = [0x00, 0xee];

function createLoadedRunner(options, rom = COUNTER_ROM) {
  const runner = createSandboxRunner({ instructionsPerSecond: 1000, ...options });
  runner.load(rom);
  return runner;
}

describe('createSandboxRunner', () => {
  it('starts empty and paused', () => {
    const runner = createSandboxRunner();

    expect(runner).toMatchObject({ isRunning: false, hasRom: false, error: null });
    runner.play();
    runner.stepOnce();
    runner.reset();
    expect(runner.isRunning).toBe(false);
    expect(runner.chip8.state.pc).toBe(0x2_00);
  });

  it('loads a ROM paused at 0x200', () => {
    const runner = createLoadedRunner();

    expect(runner).toMatchObject({ hasRom: true, isRunning: false });
    expect(runner.chip8.state.pc).toBe(0x2_00);
  });

  it('executes one instruction per step and pauses', () => {
    const runner = createLoadedRunner();
    runner.play();

    runner.stepOnce();

    expect(runner.isRunning).toBe(false);
    expect(runner.chip8.state.v[0]).toBe(5);
    expect(runner.chip8.state.pc).toBe(0x2_02);
  });

  it('runs instructions at the configured rate while playing', () => {
    const runner = createLoadedRunner();
    runner.play();

    runner.advance(10);

    // 10 ms at 1000 instructions per second = 10 instructions: LD, then 5 ADDs (each followed
    // by a JP, except the last one).
    expect(runner.chip8.state.v[0]).toBe(5 + 5);
  });

  it('does nothing while paused and caps long gaps', () => {
    const runner = createLoadedRunner();

    runner.advance(1000);
    expect(runner.chip8.state.pc).toBe(0x2_00);

    runner.play();
    runner.advance(60_000);
    // Capped to 100 ms = 100 instructions: LD plus 50 ADDs.
    expect(runner.chip8.state.v[0]).toBe(5 + 50);
  });

  it('ticks timers at 60 Hz independently of the CPU rate', () => {
    const runner = createLoadedRunner();
    runner.chip8.state.delayTimer = 10;
    runner.play();

    runner.advance(52);

    expect(runner.chip8.state.delayTimer).toBe(10 - 3);
  });

  it('stops on errors and keeps the error until reset', () => {
    const runner = createLoadedRunner({}, BROKEN_ROM);
    runner.play();

    runner.advance(5);

    expect(runner.isRunning).toBe(false);
    expect(runner.error).toMatchObject({ code: 'stack-underflow' });
    runner.play();
    runner.stepOnce();
    expect(runner.isRunning).toBe(false);

    runner.reset();
    expect(runner.error).toBeNull();
  });

  it('reports errors raised by a manual step', () => {
    const runner = createLoadedRunner({}, BROKEN_ROM);

    runner.stepOnce();

    expect(runner.error).toMatchObject({ code: 'stack-underflow' });
  });

  it('reset restarts the ROM from a clean machine', () => {
    const runner = createLoadedRunner();
    runner.play();
    runner.advance(5);

    runner.reset();

    expect(runner.chip8.state.pc).toBe(0x2_00);
    expect(runner.chip8.state.v[0]).toBe(0);
  });

  it('switches quirk presets and restarts the ROM', () => {
    const runner = createLoadedRunner();
    runner.play();
    runner.advance(5);

    runner.setQuirks('schip');

    expect(runner.quirks).toBe('schip');
    expect(runner.chip8.quirks.shiftUsesVy).toBe(false);
    expect(runner.chip8.state.pc).toBe(0x2_00);
  });

  it('remembers the quirk preset when no ROM is loaded yet', () => {
    const runner = createSandboxRunner();

    runner.setQuirks('schip');
    runner.load(COUNTER_ROM);

    expect(runner.chip8.quirks.jumpUsesVx).toBe(true);
  });

  it('forwards key presses to the machine', () => {
    const runner = createLoadedRunner();

    runner.setKey(0xa, true);

    expect(runner.chip8.state.keys[0xa]).toBe(1);
  });

  it('produces immutable snapshots of the machine', () => {
    const runner = createLoadedRunner();
    runner.stepOnce();

    const snapshot = runner.snapshot();
    runner.stepOnce();

    expect(snapshot.pc).toBe(0x2_02);
    expect(snapshot.v[0]).toBe(5);
    expect(runner.snapshot().v[0]).toBe(6);
    expect(snapshot.memory).toHaveLength(4096);
    expect(snapshot.display).toHaveLength(64 * 32);
  });
});
