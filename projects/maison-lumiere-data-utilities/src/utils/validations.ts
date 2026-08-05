import { productCategories, type Customer, type Order, type OrderItem, type Product, type ValidationResult } from "../types/models";

const skuPattern: RegExp = /^ML-[A-Z]{3}-\d{4}$/;
const emailPattern: RegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function required(value: string): boolean { return value.trim().length > 0; }
function validMoney(value: number): boolean {
  return Number.isFinite(value) && value > 0 && Number.isInteger(value * 100);
}
function validDate(value: string): boolean { return required(value) && !Number.isNaN(Date.parse(value)); }

export function validateProduct(product: Product): ValidationResult {
  const errors: string[] = [];
  if (!required(product.id)) errors.push("Product id is required.");
  if (!skuPattern.test(product.sku)) errors.push("SKU must match ML-XXX-0000.");
  if (!required(product.name)) errors.push("Product name is required.");
  if (!productCategories.includes(product.category)) errors.push("Product category is invalid.");
  if (!required(product.size)) errors.push("Product size is required.");
  if (!validMoney(product.price)) errors.push("Price must be positive with at most two decimals.");
  if (!Number.isInteger(product.stock) || product.stock < 0) errors.push("Stock must be a non-negative integer.");
  if (product.status !== "active" && product.status !== "discontinued") errors.push("Product status is invalid.");
  return { isValid: errors.length === 0, errors };
}
export function validateCustomer(customer: Customer): ValidationResult {
  const errors: string[] = [];
  if (!required(customer.id)) errors.push("Customer id is required.");
  if (!required(customer.firstName)) errors.push("First name is required.");
  if (!required(customer.lastName)) errors.push("Last name is required.");
  if (!emailPattern.test(customer.email)) errors.push("Email is invalid.");
  if (!validDate(customer.createdAt)) errors.push("Created date is invalid.");
  return { isValid: errors.length === 0, errors };
}
export function validateOrderItem(item: OrderItem): ValidationResult {
  const errors: string[] = [];
  if (!required(item.productId)) errors.push("Product id is required.");
  if (!required(item.productName)) errors.push("Product name is required.");
  if (!validMoney(item.unitPrice)) errors.push("Unit price must be positive with at most two decimals.");
  if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 20) errors.push("Quantity must be an integer from 1 through 20.");
  return { isValid: errors.length === 0, errors };
}
export function validateOrder(order: Order): ValidationResult {
  const errors: string[] = [];
  if (!required(order.id)) errors.push("Order id is required.");
  if (!required(order.customerId)) errors.push("Customer id is required.");
  if (order.items.length === 0) errors.push("Order must contain at least one item.");
  order.items.forEach((item, index): void => {
    validateOrderItem(item).errors.forEach((error): void => { errors.push(`Item ${index + 1}: ${error}`); });
  });
  if (!validDate(order.createdAt)) errors.push("Created date is invalid.");
  if ((order.status === "shipped" || order.status === "delivered") && order.shippedAt === null) errors.push("Shipped and delivered orders require a shipped date.");
  if (order.shippedAt !== null) {
    if (!validDate(order.shippedAt)) errors.push("Shipped date is invalid.");
    else if (validDate(order.createdAt) && Date.parse(order.shippedAt) < Date.parse(order.createdAt)) errors.push("Shipped date cannot be before the created date.");
  }
  return { isValid: errors.length === 0, errors };
}
