export const productCategories = ["Footwear", "Shirts", "Pants", "Accessories", "Outerwear", "Dresses"] as const;
export type ProductCategory = (typeof productCategories)[number];
export type ProductStatus = "active" | "discontinued";
export type OrderStatus = "pending" | "paid" | "shipped" | "delivered" | "cancelled";

export interface Product {
  id: string; sku: string; name: string; category: ProductCategory;
  size: string; price: number; stock: number; status: ProductStatus;
}
export interface Customer {
  id: string; firstName: string; lastName: string; email: string; createdAt: string;
}
export interface OrderItem {
  productId: string; productName: string; unitPrice: number; quantity: number;
}
export interface Order {
  id: string; customerId: string; items: OrderItem[]; status: OrderStatus;
  createdAt: string; shippedAt: string | null;
}
export interface ProductFilters {
  category?: ProductCategory; minimumPrice?: number; maximumPrice?: number;
  status?: ProductStatus; inStock?: boolean;
}
export interface ValidationResult { isValid: boolean; errors: string[]; }
export interface ProductReport {
  countByCategory: Partial<Record<ProductCategory, number>>;
  totalInventoryValue: number; averagePrice: number | null;
  lowestPricedProduct: Product | null; highestPricedProduct: Product | null;
}
export interface OrderReport {
  countByStatus: Partial<Record<OrderStatus, number>>;
  revenue: number; averageOrderValue: number | null;
}
