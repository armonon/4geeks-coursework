import type { Customer, Order, Product } from "../types/models";

export const products: Product[] = [
  { id: "prod-001", sku: "ML-RIV-2401", name: "Rivoli Trench Coat", category: "Outerwear", size: "M", price: 189, stock: 12, status: "active" },
  { id: "prod-002", sku: "ML-MAR-2402", name: "Marais Poplin Shirt", category: "Shirts", size: "S", price: 76, stock: 20, status: "active" },
  { id: "prod-003", sku: "ML-SEI-2403", name: "Seine Straight Denim", category: "Pants", size: "32", price: 98, stock: 15, status: "active" },
  { id: "prod-004", sku: "ML-CAN-2404", name: "Canal Leather Sneaker", category: "Footwear", size: "42", price: 124, stock: 8, status: "active" },
  { id: "prod-005", sku: "ML-LOU-2405", name: "Louvre Silk Scarf", category: "Accessories", size: "One size", price: 54, stock: 25, status: "active" },
  { id: "prod-006", sku: "ML-PAL-2406", name: "Palais Wrap Dress", category: "Dresses", size: "M", price: 138, stock: 0, status: "discontinued" },
];
export const customers: Customer[] = [{
  id: "customer-001", firstName: "Camille", lastName: "Martin",
  email: "camille@example.com", createdAt: "2026-01-15T10:00:00.000Z",
}];
export const orders: Order[] = [{
  id: "order-001", customerId: "customer-001",
  items: [
    { productId: "prod-001", productName: "Rivoli Trench Coat", unitPrice: 189, quantity: 1 },
    { productId: "prod-003", productName: "Seine Straight Denim", unitPrice: 98, quantity: 2 },
    { productId: "prod-005", productName: "Louvre Silk Scarf", unitPrice: 54, quantity: 1 },
  ],
  status: "paid", createdAt: "2026-07-20T12:00:00.000Z", shippedAt: null,
}];
