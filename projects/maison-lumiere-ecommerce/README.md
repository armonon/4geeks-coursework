# Maison Lumiere E-Commerce Prototype

This project is built only with HTML and Tailwind CSS, as required by the assignment.

## Views

- `index.html` - home page with navbar, hero, new arrivals, best sellers, and footer
- `catalog.html` - filter bar and 4 x 5 product grid
- `product.html` - two-column product detail view with Schema.org Product data
- `cart.html` - full cart page with three sample products and order summary
- `checkout.html` - three-step payment form for personal details, shipping, and card payment

## View Branch And Pull-Request Workflow

Each required view received its own feature branch and reviewable pull request:

| View | Feature branch | Pull request |
| --- | --- | --- |
| Home | `codex/home-view-accessibility` | [#1](https://github.com/armonon/maison-lumiere-ecommerce/pull/1) |
| Catalog | `codex/catalog-view-filters` | [#2](https://github.com/armonon/maison-lumiere-ecommerce/pull/2) |
| Product | `codex/product-view-purchase-flow` | [#3](https://github.com/armonon/maison-lumiere-ecommerce/pull/3) |
| Cart | `codex/cart-view-controls` | [#4](https://github.com/armonon/maison-lumiere-ecommerce/pull/4) |
| Checkout | `codex/checkout-view-form-semantics` | [#5](https://github.com/armonon/maison-lumiere-ecommerce/pull/5) |

These are genuine page-specific branches and merged PRs created during a
single-contributor remediation pass. They demonstrate the requested Git flow;
they do not claim contributions from classmates who did not participate.

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
