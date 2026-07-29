export function linearSearch<T>(items: readonly T[], predicate: (item: T) => boolean): T | undefined {
  for (const item of items) if (predicate(item)) return item;
  return undefined;
}
export function linearSearchIndex<T>(items: readonly T[], predicate: (item: T) => boolean): number {
  for (let index: number = 0; index < items.length; index += 1) {
    const item: T | undefined = items[index];
    if (item !== undefined && predicate(item)) return index;
  }
  return -1;
}
export function binarySearch<T>(sortedItems: readonly T[], target: T, compare: (left: T, right: T) => number): number {
  let low: number = 0;
  let high: number = sortedItems.length - 1;
  while (low <= high) {
    const middle: number = Math.floor((low + high) / 2);
    const item: T | undefined = sortedItems[middle];
    if (item === undefined) return -1;
    const comparison: number = compare(item, target);
    if (comparison === 0) return middle;
    if (comparison < 0) low = middle + 1;
    else high = middle - 1;
  }
  return -1;
}
