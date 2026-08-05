import { orders, products } from "./data/sampleData";
import { filterProducts, sortBy } from "./utils/collections";
import { binarySearch, linearSearch } from "./utils/search";
import { createOrderReport, createProductReport } from "./utils/transformations";
import { validateOrder, validateProduct } from "./utils/validations";

const sorted = sortBy(products, "sku");
console.log("Active outerwear:", filterProducts(products, { category: "Outerwear", status: "active" }));
console.log("Linear search:", linearSearch(products, (product): boolean => product.sku === "ML-RIV-2401"));
console.log("Binary search:", binarySearch(sorted, products[0]!, (left, right): number => left.sku.localeCompare(right.sku)));
console.log("Reports:", createProductReport(products), createOrderReport(orders));
console.log("Valid:", products.every((product): boolean => validateProduct(product).isValid), orders.every((order): boolean => validateOrder(order).isValid));
