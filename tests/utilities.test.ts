import assert from "node:assert/strict";
import test from "node:test";
import { orders, products } from "../src/data/sampleData";
import { filterProducts, groupBy, sortBy, sortByMultiple } from "../src/utils/collections";
import { binarySearch, linearSearch, linearSearchIndex } from "../src/utils/search";
import { calculateOrderTotal, createOrderReport, createProductReport } from "../src/utils/transformations";
import { validateOrder, validateProduct } from "../src/utils/validations";

test("filters by multiple criteria and handles empty input", (): void => {
  assert.deepEqual(filterProducts(products, { category: "Outerwear", inStock: true }).map((p) => p.id), ["prod-001"]);
  assert.deepEqual(filterProducts([], { inStock: true }), []);
});
test("sorts ascending, descending, and by multiple fields without mutation", (): void => {
  const ids: string[] = products.map((p) => p.id);
  assert.equal(sortBy(products, "price")[0]?.price, 54);
  assert.equal(sortBy(products, "price", "descending")[0]?.price, 189);
  assert.equal(sortByMultiple(products, [{ key: "category", direction: "ascending" }, { key: "price", direction: "descending" }]).length, 6);
  assert.deepEqual(products.map((p) => p.id), ids);
});
test("groups by category", (): void => {
  assert.equal(groupBy(products, (p) => p.category).Outerwear?.length, 1);
});
test("linear search returns matches and missing sentinel values", (): void => {
  assert.equal(linearSearch(products, (p) => p.id === "prod-003")?.name, "Seine Straight Denim");
  assert.equal(linearSearchIndex(products, (p) => p.id === "missing"), -1);
  assert.equal(linearSearch([], () => true), undefined);
});
test("binary search returns index or -1", (): void => {
  const values: number[] = [2, 4, 6, 8, 10];
  assert.equal(binarySearch(values, 6, (a, b) => a - b), 2);
  assert.equal(binarySearch(values, 7, (a, b) => a - b), -1);
  assert.equal(binarySearch([], 1, (a, b) => a - b), -1);
});
test("creates aggregations and reports", (): void => {
  const report = createProductReport(products);
  assert.equal(report.countByCategory.Outerwear, 1);
  assert.equal(report.lowestPricedProduct?.name, "Louvre Silk Scarf");
  assert.equal(report.highestPricedProduct?.name, "Rivoli Trench Coat");
  assert.equal(calculateOrderTotal(orders[0]!), 439);
  assert.equal(createOrderReport(orders).revenue, 439);
  assert.equal(createProductReport([]).averagePrice, null);
});
test("validates Maison Lumière rules", (): void => {
  assert.equal(products.every((p) => validateProduct(p).isValid), true);
  assert.equal(orders.every((o) => validateOrder(o).isValid), true);
  assert.equal(validateProduct({ ...products[0]!, sku: "bad", stock: -1 }).isValid, false);
  assert.equal(validateOrder({ ...orders[0]!, status: "shipped", shippedAt: null }).isValid, false);
});
