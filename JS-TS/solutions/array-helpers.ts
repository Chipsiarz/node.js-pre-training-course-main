/* eslint-disable @typescript-eslint/no-unused-vars */
// Task 02: Mini functional–utility library
// All helpers are declared but not implemented.

export function mapArray<T, R>(
  source: readonly T[],
  mapper: (item: T, index: number) => R
): R[] {
  if (source === null || source === undefined) {
    throw new TypeError("mapArray: source is null or undefined");
  }

  const result: R[] = [];
  let idx = 0;
  for (const item of source) {
    const mapped = mapper(item, idx);
    result.push(mapped);
    idx++;
  }
  return result;
}

export function filterArray<T>(
  source: readonly T[],
  predicate: (item: T, index: number) => boolean
): T[] {
  if (source === null || source === undefined) {
    throw new TypeError("filterArray: source is null or undefined");
  }

  const result: T[] = [];
  let idx = 0;
  for (const item of source) {
    if (predicate(item, idx)) {
      result.push(item);
    }
    idx++;
  }
  return result;
}

export function reduceArray<T, R>(
  source: readonly T[],
  reducer: (acc: R, item: T, index: number) => R,
  initial: R
): R {
  if (source === null || source === undefined) {
    throw new TypeError("reduceArray: source is null or undefined");
  }

  let acc: R = initial;
  let idx = 0;
  for (const item of source) {
    acc = reducer(acc, item, idx);
    idx++;
  }
  return acc;
}

export function partition<T>(
  source: readonly T[],
  predicate: (item: T) => boolean
): [T[], T[]] {
  if (source === null || source === undefined) {
    throw new TypeError("partition: source is null or undefined");
  }

  const pass: T[] = [];
  const fail: T[] = [];
  for (const item of source) {
    if (predicate(item)) {
      pass.push(item);
    } else {
      fail.push(item);
    }
  }
  return [pass, fail];
}

export function groupBy<T, K extends PropertyKey>(
  source: readonly T[],
  keySelector: (item: T) => K
): Record<K, T[]> {
  if (source === null || source === undefined) {
    throw new TypeError("groupBy: source is null or undefined");
  }

  const result: Record<PropertyKey, T[]> = Object.create(null);

  for (const item of source) {
    const key = keySelector(item) as PropertyKey;

    if (!Object.prototype.hasOwnProperty.call(result, key)) {
      (result as any)[key] = [];
    }
    (result as any)[key].push(item);
  }

  return result as Record<K, T[]>;
}

