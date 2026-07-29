# Maison Lumière E-Commerce and Operations Utilities

This project is built only with HTML and Tailwind CSS, as required by the assignment.

Milestone 2 adds a reusable, strictly typed logic layer for the company's
products, customers, and orders. Exact rules are in `CONTEXT.md`.

## TypeScript Utilities

- `src/types/models.ts` — interfaces and report types
- `src/utils/collections.ts` — filtering, sorting, and grouping
- `src/utils/search.ts` — linear and binary search
- `src/utils/transformations.ts` — aggregations and reports
- `src/utils/validations.ts` — business validations

Run `npm run typecheck` to validate TypeScript, `npm test` for automated tests,
or `npm run demo` to execute the sample operations.

## Views

- `index.html` - home page with navbar, hero, new arrivals, best sellers, and footer
- `catalog.html` - filter bar and 4 x 5 product grid
- `product.html` - two-column product detail view with Schema.org Product data
- `cart.html` - full cart page with three sample products and order summary
- `checkout.html` - three-step payment form for personal details, shipping, and card payment

## SEO And Structure

The prototype uses semantic landmarks such as `header`, `nav`, `main`, `section`, `article`, `aside`, `footer`, and `form`. The home page includes Organization structured data, and the product page includes Product structured data.

## Run Locally

Install dependencies once:

```bash
npm install
```

Build the Tailwind stylesheet:

```bash
npm run build
```

Serve the project:

```bash
npm run serve
```

Then open `http://localhost:3000`.
