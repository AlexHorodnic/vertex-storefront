# Vertex Storefront

[![CI](https://github.com/AlexHorodnic/vertex-storefront/actions/workflows/ci.yml/badge.svg)](https://github.com/AlexHorodnic/vertex-storefront/actions/workflows/ci.yml)

A production-inspired Angular commerce experience connecting product discovery, variant selection,
persistent cart state, and a responsive four-step checkout.

[Live storefront](https://vertex-storefront.alexhorodnic.com/) |
[Portfolio case study](https://alexhorodnic.com/projects/vertex-storefront)

![Vertex Storefront homepage](docs/screenshots/storefront-overview.png)

## Product Scope

Vertex models a complete frontend buying journey across:

- 40 typed demo products in 10 focused categories
- search, category, collection, price, and sorting controls
- responsive desktop filters and a mobile filter sheet
- product variants, stock states, image galleries, and related products
- persistent cart quantities with stock-safe updates
- promo codes, shipping methods, tax, discounts, and order totals
- a validated cart, shipping, payment, and review checkout flow
- mobile checkout progress and a sticky action bar

The checkout is a demo. It does not process payments, and card fields are deliberately excluded
from browser persistence.

## Engineering Decisions

### Feature-first Angular structure

Route features own page-level behavior, while core services and shared standalone components handle
reusable commerce state and UI. Home, catalog, product detail, and checkout routes are lazy-loaded.

### Signals for derived commerce state

Angular signals and computed values keep cart count, subtotal, promo discount, delivery cost, tax,
and final totals synchronized without duplicating derived values.

### Guarded browser persistence

Runtime type guards validate cart items, catalog filters, variant selections, and checkout shipping
data before stored JSON re-enters application state. Invalid or stale data falls back safely.

### Checkout continuity with privacy boundaries

Shipping details are saved through a debounced snapshot so customers can recover useful progress.
Payment fields are never persisted. Later checkout steps remain unavailable until their required
controls are valid.

## Responsive and Accessible UX

- keyboard-operable dual-handle price filtering
- desktop pointer and mobile sheet catalog controls
- product lightbox with keyboard navigation, touch swiping, and scroll locking
- loading, empty, invalid, disabled, low-stock, and out-of-stock states
- mobile-specific checkout progress and reachable primary actions
- labelled controls, visible focus states, semantic landmarks, and touch-friendly targets

## Screenshots

### Desktop storefront

![Vertex product discovery](docs/screenshots/storefront-overview.png)

### Mobile checkout

![Vertex mobile checkout](docs/screenshots/mobile-checkout.png)

## Technology

- Angular 21
- TypeScript
- Angular Signals
- RxJS
- Reactive Forms
- SCSS
- Vitest

## Local Development

Requirements:

- Node.js 24
- npm 11.6.2

```bash
npm ci
npm start
```

Open `http://localhost:4200`.

## Verification

```bash
npm run typecheck
npm run test:ci
npm run build
```

The test suite covers:

- cart totals, persistence, removal, and stock limits
- product search, combined filters, and sorting
- persisted-data runtime guards
- checkout shipping persistence
- checkout totals, discounts, tax, and delivery costs
- checkout step-access rules
- lazy route boundaries

GitHub Actions runs dependency installation, type checking, all tests, and a production build on
every push to `main` and on pull requests.

## Project Boundaries

Vertex is a frontend portfolio project. Products are typed mock data, imagery is sourced from
Unsplash, and checkout simulates order creation. A production system would require inventory and
pricing APIs, authentication, server-owned carts, payment-provider tokenization, analytics,
observability, and server-side validation.
