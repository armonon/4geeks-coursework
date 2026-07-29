# Maison Lumière Company Context

Maison Lumière is a French fashion e-commerce company. This document is the
source of truth for the Milestone 2 TypeScript utilities.

## Entities and rules

- `Product`: `id`, `sku`, `name`, `category`, `size`, `price`, `stock`, and
  `status`. SKU uses `ML-XXX-0000`; names/sizes are required; price is positive
  USD with at most two decimals; stock is a non-negative integer. Categories
  are Footwear, Shirts, Pants, Accessories, Outerwear, or Dresses. Status is
  active or discontinued.
- `Customer`: required `id`, `firstName`, `lastName`, valid `email`, and valid
  ISO `createdAt`.
- `OrderItem`: required `productId` and `productName`, positive two-decimal
  `unitPrice`, and integer `quantity` from 1 through 20.
- `Order`: required `id` and `customerId`, at least one valid item, a status of
  pending, paid, shipped, delivered, or cancelled, valid ISO `createdAt`, and
  nullable `shippedAt`. Shipped/delivered orders require a shipped date on or
  after the created date.

## Required reports

Product count by category, total inventory value, average price, lowest and
highest priced products, non-cancelled order revenue, average order value, and
order count by status. Money is rounded to two decimals.
