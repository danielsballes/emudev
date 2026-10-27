import { describe, expect, it } from 'vitest';

import { createConsoleCapture, installConsole } from '@/engine/runner/console-capture.js';
import { BLOCKED_GLOBALS, lockdownGlobals } from '@/engine/runner/lockdown.js';

describe('createConsoleCapture', () => {
  it('records every console level, formatting non-string values', () => {
    const capture = createConsoleCapture();

    capture.console.log('pc =', 0x2_00);
    capture.console.warn({ v: [1] });
    capture.console.error('bad');
    capture.console.info('info');
    capture.console.debug('debug');

    expect(capture.entries).toEqual([
      { level: 'log', text: 'pc = 512 (0x200)' },
      { level: 'warn', text: '{ v: [1] }' },
      { level: 'error', text: 'bad' },
      { level: 'info', text: 'info' },
      { level: 'debug', text: 'debug' },
    ]);
  });

  it('keeps at most `limit` entries and counts the dropped ones', () => {
    const capture = createConsoleCapture({ limit: 2 });

    for (let index = 0; index < 5; index += 1) {
      capture.console.log(index);
    }

    expect(capture.entries).toHaveLength(2);
    expect(capture.dropped).toBe(3);
  });

  it('returns a copy of the entries', () => {
    const capture = createConsoleCapture();
    capture.entries.push({ level: 'log', text: 'tampered' });

    expect(capture.entries).toEqual([]);
  });
});

describe('installConsole', () => {
  it('replaces the console of the scope', () => {
    const scope = { console: { log: () => {} } };
    const capture = createConsoleCapture();

    installConsole(scope, capture.console);
    scope.console.log('captured');

    expect(capture.entries).toEqual([{ level: 'log', text: 'captured' }]);
  });
});

describe('lockdownGlobals', () => {
  it('hides network and storage globals from the scope', () => {
    const scope = { fetch: () => {}, indexedDB: {} };

    lockdownGlobals(scope);

    for (const name of BLOCKED_GLOBALS) {
      expect(scope[name]).toBeUndefined();
    }
    expect(() => {
      scope.fetch = () => {};
    }).toThrow(TypeError);
  });
});
