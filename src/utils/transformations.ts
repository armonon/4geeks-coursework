import type { Order, OrderReport, Product, ProductCategory, ProductReport } from "../types/models";

export function roundMoney(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}
export function sumBy<T>(items: readonly T[], selectValue: (item: T) => number): number {
  return items.reduce((total: number, item: T): number => total + selectValue(item), 0);
}
export function averageBy<T>(items: readonly T[], selectValue: (item: T) => number): number | null {
  return items.length === 0 ? null : sumBy(items, selectValue) / items.length;
}
export function findMinimumBy<T>(items: readonly T[], selectValue: (item: T) => number): T | null {
  if (items.length === 0) return null;
  return items.reduce((minimum: T, item: T): T => selectValue(item) < selectValue(minimum) ? item : minimum);
}
export function findMaximumBy<T>(items: readonly T[], selectValue: (item: T) => number): T | null {
  if (items.length === 0) return null;
  return items.reduce((maximum: T, item: T): T => selectValue(item) > selectValue(maximum) ? item : maximum);
}
export function countProductsByCategory(products: readonly Product[]): Partial<Record<ProductCategory, number>> {
  return products.reduce<Partial<Record<ProductCategory, number>>>((counts, product) => ({
    ...counts, [product.category]: (counts[product.category] ?? 0) + 1,
  }), {});
}
export function calculateOrderTotal(order: Order): number {
  return roundMoney(sumBy(order.items, (item): number => item.unitPrice * item.quantity));
}
export function createProductReport(products: readonly Product[]): ProductReport {
  const averagePrice: number | null = averageBy(products, (product): number => product.price);
  return {
    countByCategory: countProductsByCategory(products),
    totalInventoryValue: roundMoney(sumBy(products, (product): number => product.price * product.stock)),
    averagePrice: averagePrice === null ? null : roundMoney(averagePrice),
    lowestPricedProduct: findMinimumBy(products, (product): number => product.price),
    highestPricedProduct: findMaximumBy(products, (product): number => product.price),
  };
}
export function createOrderReport(orders: readonly Order[]): OrderReport {
  const countByStatus: OrderReport["countByStatus"] = orders.reduce<OrderReport["countByStatus"]>((counts, order) => ({
    ...counts, [order.status]: (counts[order.status] ?? 0) + 1,
  }), {});
  const eligible: Order[] = orders.filter((order): boolean => order.status !== "cancelled");
  const revenue: number = roundMoney(sumBy(eligible, calculateOrderTotal));
  return {
    countByStatus, revenue,
    averageOrderValue: eligible.length === 0 ? null : roundMoney(revenue / eligible.length),
  };
}
