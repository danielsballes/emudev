/**
 * Globals hidden from student code. This is a guard rail against accidents (network calls,
 * touching the platform's storage), not a security boundary: the code being run is the
 * student's own, in their own browser.
 */
export const BLOCKED_GLOBALS = Object.freeze([
  'fetch',
  'XMLHttpRequest',
  'WebSocket',
  'EventSource',
  'importScripts',
  'indexedDB',
  'caches',
  'BroadcastChannel',
]);

/**
 * Shadows the blocked globals with `undefined` on the given scope.
 * @param {object} scope Usually the worker's `globalThis`.
 */
export function lockdownGlobals(scope) {
  for (const name of BLOCKED_GLOBALS) {
    Object.defineProperty(scope, name, {
      value: undefined,
      writable: false,
      configurable: false,
    });
  }
}
