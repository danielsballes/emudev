function isTypedArray(value) {
  return ArrayBuffer.isView(value) && !(value instanceof DataView);
}

function isSameSequence(left, right) {
  return (
    left.length === right.length && left.every((item, index) => isDeepEqual(item, right[index]))
  );
}

function isSameMap(left, right) {
  return (
    left.size === right.size &&
    [...left].every(([key, value]) => right.has(key) && isDeepEqual(value, right.get(key)))
  );
}

function isSameSet(left, right) {
  return left.size === right.size && [...left].every((value) => right.has(value));
}

function isSamePlainObject(left, right) {
  const leftKeys = Object.keys(left);
  return (
    leftKeys.length === Object.keys(right).length &&
    leftKeys.every((key) => Object.hasOwn(right, key) && isDeepEqual(left[key], right[key]))
  );
}

function isSameObject(left, right) {
  if (Object.getPrototypeOf(left) !== Object.getPrototypeOf(right)) {
    return false;
  }
  if (Array.isArray(left) || isTypedArray(left)) {
    return isSameSequence([...left], [...right]);
  }
  if (left instanceof Date) {
    return left.getTime() === right.getTime();
  }
  if (left instanceof Map) {
    return isSameMap(left, right);
  }
  if (left instanceof Set) {
    return isSameSet(left, right);
  }
  return isSamePlainObject(left, right);
}

/**
 * Structural equality for primitives, arrays, typed arrays, plain objects, dates, maps and sets.
 * @param {unknown} left
 * @param {unknown} right
 * @returns {boolean}
 */
export function isDeepEqual(left, right) {
  if (Object.is(left, right)) {
    return true;
  }
  const areBothObjects =
    typeof left === 'object' && left !== null && typeof right === 'object' && right !== null;
  return areBothObjects && isSameObject(left, right);
}
