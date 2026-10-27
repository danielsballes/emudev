const isObjectLike = (value) => typeof value === 'object' && value !== null;

function isTypedArray(value) {
  return ArrayBuffer.isView(value) && !(value instanceof DataView);
}

function toBytes(buffer) {
  return buffer instanceof ArrayBuffer
    ? new Uint8Array(buffer)
    : new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
}

function isSameSequence(left, right) {
  return (
    left.length === right.length && left.every((item, index) => isDeepEqual(item, right[index]))
  );
}

/**
 * Pairs every left item with a distinct, structurally equal right item (one-to-one matching).
 */
function isSameUnordered(leftItems, rightItems) {
  if (leftItems.length !== rightItems.length) {
    return false;
  }
  const unmatched = [...rightItems];
  return leftItems.every((item) => {
    const index = unmatched.findIndex((candidate) => isDeepEqual(item, candidate));
    if (index === -1) {
      return false;
    }
    unmatched.splice(index, 1);
    return true;
  });
}

const objectMembers = (set) => [...set].filter((value) => isObjectLike(value));
const objectKeyedEntries = (map) => [...map].filter(([key]) => isObjectLike(key));

function isSameSet(left, right) {
  // Primitive members are looked up directly; object members are matched structurally.
  return (
    left.size === right.size &&
    [...left].every((value) => isObjectLike(value) || right.has(value)) &&
    isSameUnordered(objectMembers(left), objectMembers(right))
  );
}

function isSameMap(left, right) {
  return (
    left.size === right.size &&
    [...left].every(
      ([key, value]) => isObjectLike(key) || (right.has(key) && isDeepEqual(value, right.get(key))),
    ) &&
    isSameUnordered(objectKeyedEntries(left), objectKeyedEntries(right))
  );
}

function isSamePlainObject(left, right) {
  const leftKeys = Object.keys(left);
  return (
    leftKeys.length === Object.keys(right).length &&
    leftKeys.every((key) => Object.hasOwn(right, key) && isDeepEqual(left[key], right[key]))
  );
}

const isSameBytes = (left, right) => isSameSequence([...toBytes(left)], [...toBytes(right)]);

/**
 * Built-ins whose state lives in internal slots rather than enumerable keys, so the generic
 * key-by-key comparison would wrongly report any two instances as equal.
 */
const BUILT_IN_COMPARERS = [
  [ArrayBuffer, isSameBytes],
  [DataView, isSameBytes],
  [Date, (left, right) => left.getTime() === right.getTime()],
  [RegExp, (left, right) => left.source === right.source && left.flags === right.flags],
  [
    Error,
    (left, right) =>
      left.name === right.name && left.message === right.message && isSamePlainObject(left, right),
  ],
  [Map, isSameMap],
  [Set, isSameSet],
];

/**
 * Types whose contents cannot be inspected: equal only when they are the same instance, which
 * `isDeepEqual` already checks with `Object.is`.
 */
const OPAQUE_TYPES = [WeakMap, WeakSet, WeakRef, Promise];

function isSameObject(left, right) {
  if (Object.getPrototypeOf(left) !== Object.getPrototypeOf(right)) {
    return false;
  }
  if (Array.isArray(left) || isTypedArray(left)) {
    return isSameSequence([...left], [...right]);
  }
  if (OPAQUE_TYPES.some((Type) => left instanceof Type)) {
    return false;
  }
  const comparer = BUILT_IN_COMPARERS.find(([Type]) => left instanceof Type)?.[1];
  // Plain objects and class instances (e.g. the student's own CPU class) compare key by key.
  return (comparer ?? isSamePlainObject)(left, right);
}

/**
 * Structural equality for primitives, arrays, typed arrays, ArrayBuffers, DataViews, dates,
 * regular expressions, errors, maps, sets, plain objects and class instances. Map entries and set
 * members are compared structurally; opaque types (WeakMap, Promise…) only by identity.
 * @param {unknown} left
 * @param {unknown} right
 * @returns {boolean}
 */
export function isDeepEqual(left, right) {
  return Object.is(left, right)
    ? true
    : isObjectLike(left) && isObjectLike(right) && isSameObject(left, right);
}
