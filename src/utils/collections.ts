import type { Product, ProductFilters } from "../types/models";

export type SortDirection = "ascending" | "descending";
export interface SortCriterion<T> { key: keyof T; direction: SortDirection; }

export function filterProducts(products: readonly Product[], filters: ProductFilters): Product[] {
  return products.filter((product: Product): boolean => {
    if (filters.category !== undefined && product.category !== filters.category) return false;
    if (filters.minimumPrice !== undefined && product.price < filters.minimumPrice) return false;
    if (filters.maximumPrice !== undefined && product.price > filters.maximumPrice) return false;
    if (filters.status !== undefined && product.status !== filters.status) return false;
    return filters.inStock === undefined || (product.stock > 0) === filters.inStock;
  });
}
function compareValues<T>(left: T, right: T): number {
  if (typeof left === "string" && typeof right === "string") return left.localeCompare(right);
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}
export function sortBy<T>(items: readonly T[], key: keyof T, direction: SortDirection = "ascending"): T[] {
  const multiplier: number = direction === "ascending" ? 1 : -1;
  return [...items].sort((left: T, right: T): number => compareValues(left[key], right[key]) * multiplier);
}
export function sortByMultiple<T>(items: readonly T[], criteria: readonly SortCriterion<T>[]): T[] {
  return [...items].sort((left: T, right: T): number => {
    for (const criterion of criteria) {
      const result: number = compareValues(left[criterion.key], right[criterion.key]);
      if (result !== 0) return criterion.direction === "ascending" ? result : -result;
    }
    return 0;
  });
}
export function groupBy<T, K extends PropertyKey>(items: readonly T[], selectKey: (item: T) => K): Partial<Record<K, T[]>> {
  return items.reduce<Partial<Record<K, T[]>>>((groups, item) => {
    const key: K = selectKey(item);
    groups[key] = [...(groups[key] ?? []), item];
    return groups;
  }, {});
}
