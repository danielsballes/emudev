const MAX_ITEMS = 16;
const MAX_DEPTH = 2;
const MAX_STRING_LENGTH = 200;
const UNPRINTABLE = '[unprintable value]';

/**
 * Formats an integer in decimal and hexadecimal, the way emulator developers read numbers.
 * @param {number} value
 * @returns {string}
 */
export function formatInteger(value) {
  return value < 10 || !Number.isSafeInteger(value)
    ? String(value)
    : `${value} (0x${value.toString(16).toUpperCase()})`;
}

function truncate(text) {
  return text.length > MAX_STRING_LENGTH ? `${text.slice(0, MAX_STRING_LENGTH)}…` : text;
}

/**
 * Appends the "… (+n)" suffix when only part of a collection is shown.
 * Collections are cut to `MAX_ITEMS` before formatting, so huge buffers stay cheap to describe.
 */
function withHiddenCount(shown, total) {
  const hidden = total - shown.length;
  return hidden > 0 ? [...shown, `… (+${hidden})`] : shown;
}

function describeList(items, total, depth) {
  return withHiddenCount(
    Array.from(items, (item) => describeAt(item, depth + 1)),
    total,
  );
}

function describeEntries(value, depth) {
  const keys = Object.keys(value);
  const shown = keys
    .slice(0, MAX_ITEMS)
    .map((key) => `${key}: ${describeAt(value[key], depth + 1)}`);
  return keys.length === 0 ? '{}' : `{ ${withHiddenCount(shown, keys.length).join(', ')} }`;
}

function describeDate(value) {
  return Number.isNaN(value.getTime()) ? 'Date(Invalid)' : `Date(${value.toISOString()})`;
}

function describeObject(value, depth) {
  if (value instanceof Error) {
    return `${value.name}: ${value.message}`;
  }
  if (value instanceof Date) {
    return describeDate(value);
  }
  if (ArrayBuffer.isView(value) && !(value instanceof DataView)) {
    const items = describeList(value.subarray(0, MAX_ITEMS), value.length, depth);
    return `${value.constructor.name}(${value.length}) [${items.join(', ')}]`;
  }
  if (depth >= MAX_DEPTH) {
    return Array.isArray(value) ? `Array(${value.length})` : '{…}';
  }
  if (Array.isArray(value)) {
    return `[${describeList(value.slice(0, MAX_ITEMS), value.length, depth).join(', ')}]`;
  }
  return describeEntries(value, depth);
}

function describeAt(value, depth) {
  switch (typeof value) {
    case 'number': {
      return Number.isSafeInteger(value) ? formatInteger(value) : String(value);
    }
    case 'string': {
      return truncate(JSON.stringify(value));
    }
    case 'bigint': {
      return `${value}n`;
    }
    case 'function': {
      return `[Function ${value.name || 'anonymous'}]`;
    }
    case 'object': {
      return value === null ? 'null' : describeObject(value, depth);
    }
    default: {
      return String(value);
    }
  }
}

/**
 * Returns a short, human readable, serializable description of any value.
 * Used to report expected/actual values from the sandbox, where values cannot be cloned.
 * Never throws: values that cannot be inspected (throwing getters, revoked proxies…) are reported
 * as unprintable instead of breaking the test run.
 * @param {unknown} value
 * @returns {string}
 */
export function describeValue(value) {
  try {
    return describeAt(value, 0);
  } catch {
    return UNPRINTABLE;
  }
}
