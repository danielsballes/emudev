import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { ROMS } from '@/modules/chip8/roms.js';
import { createChip8, DISPLAY_HEIGHT, DISPLAY_WIDTH } from '@/modules/chip8/core/index.js';

const STEPS = 200_000;

function loadRom(file) {
  return readFileSync(path.join(import.meta.dirname, '../../../public/roms/chip8', file));
}

/**
 * Runs a ROM until it settles and returns the machine.
 */
function runRom(file) {
  const chip8 = createChip8();
  chip8.loadRom(loadRom(file));
  for (let step = 0; step < STEPS; step += 1) {
    chip8.step();
  }
  return chip8;
}

function renderFrame(display) {
  return Array.from({ length: DISPLAY_HEIGHT }, (_, y) =>
    [...display.subarray(y * DISPLAY_WIDTH, (y + 1) * DISPLAY_WIDTH)]
      .map((pixel) => (pixel ? '#' : '.'))
      .join(''),
  ).join('\n');
}

// Sprites used by the Corax+ ROM for each result (3 pixels wide, 4 rows, first row empty).
const CORAX_OK = ['...', '#.#', '##.', '#..'].join('');
const CORAX_FAILED = ['...', '#.#', '.#.', '#.#'].join('');
// Result columns and rows (x = 11 + 16 * column, y = 1 + 5 * row), as in the suite's screenshot.
const CORAX_RESULT_CELLS = [0, 1, 2, 3].flatMap((column) =>
  [0, 1, 2, 3, 4, 5].map((row) => ({ x: 11 + 16 * column, y: 1 + 5 * row })),
);

function readCell(display, { x, y }) {
  return [0, 1, 2, 3]
    .flatMap((row) =>
      [0, 1, 2].map((column) =>
        display[(y + row) * DISPLAY_WIDTH + x + column] === 1 ? '#' : '.',
      ),
    )
    .join('');
}

describe('sandbox ROMs', () => {
  it('lists existing ROM files only', () => {
    for (const rom of ROMS) {
      expect(loadRom(rom.file).length).toBeGreaterThan(0);
    }
  });

  it.each(ROMS.map((rom) => [rom.id, rom.file]))('runs %s without errors', (_id, file) => {
    expect(() => runRom(file)).not.toThrow();
    expect(runRom(file).state.display.includes(1)).toBe(true);
  });

  // The IBM logo frame was checked against the suite's reference screenshot. The CHIP-8 logo has
  // no reference picture: its snapshot only guards against regressions.
  it('draws the IBM logo', () => {
    expect(renderFrame(runRom('2-ibm-logo.ch8').state.display)).toMatchSnapshot();
  });

  it('draws the CHIP-8 logo', () => {
    expect(renderFrame(runRom('1-chip8-logo.ch8').state.display)).toMatchSnapshot();
  });

  it('passes every opcode checked by Corax+', () => {
    const { display } = runRom('3-corax+.ch8').state;
    // The 4th column's last two rows hold the "registers" test and the ROM version label.
    const cells = CORAX_RESULT_CELLS.map((cell) => readCell(display, cell));
    const results = cells.filter((cell) => cell === CORAX_OK || cell === CORAX_FAILED);

    expect(cells).not.toContain(CORAX_FAILED);
    expect(results.filter((cell) => cell === CORAX_OK)).toHaveLength(22);
  });
});
