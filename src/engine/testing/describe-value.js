const MAX_ITEMS = 16;
const MAX_DEPTH = 2;
const MAX_STRING_LENGTH = 200;

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

function limitItems(items) {
  const hidden = items.length - MAX_ITEMS;
  return hidden > 0 ? [...items.slice(0, MAX_ITEMS), `… (+${hidden})`] : items;
}

function describeEntries(value, depth) {
  const entries = Object.entries(value).map(
    ([key, item]) => `${key}: ${describeAt(item, depth + 1)}`,
  );
  return entries.length === 0 ? '{}' : `{ ${limitItems(entries).join(', ')} }`;
}

function describeObject(value, depth) {
  if (value instanceof Error) {
    return `${value.name}: ${value.message}`;
  }
  if (value instanceof Date) {
    return `Date(${value.toISOString()})`;
  }
  if (ArrayBuffer.isView(value) && !(value instanceof DataView)) {
    const items = limitItems([...value].map((item) => describeAt(item, depth + 1)));
    return `${value.constructor.name}(${value.length}) [${items.join(', ')}]`;
  }
  if (depth >= MAX_DEPTH) {
    return Array.isArray(value) ? `Array(${value.length})` : '{…}';
  }
  if (Array.isArray(value)) {
    return `[${limitItems(value.map((item) => describeAt(item, depth + 1))).join(', ')}]`;
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
 * @param {unknown} value
 * @returns {string}
 */
export function describeValue(value) {
  return describeAt(value, 0);
}
