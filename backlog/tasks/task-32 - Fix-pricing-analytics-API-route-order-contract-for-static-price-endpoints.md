---
id: task-32
title: Fix pricing analytics API route-order contract for static price endpoints
status: Done
assignee: []
created_date: '2026-06-16 15:52'
updated_date: '2026-06-16 16:23'
labels:
  - qa-audit
  - backend-contract
  - pricing
  - ui-validation
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
UI/data validation found /analytics/pricing calls backend endpoints that are currently intercepted as product nmId routes. Evidence: browser smoke for /analytics/pricing recorded 400 responses from /v1/products/price-elasticity?limit=50 and /v1/products/price-recommendations?limit=50&target_margin_pct=15. Direct authenticated backend calls returned messages like "Invalid nmId format: price-elasticity" and "Invalid nmId format: price-recommendations", indicating static subroutes are being matched by /v1/products/:nmId before their handlers. Frontend clients/types currently expect GET /v1/products/price-elasticity and GET /v1/products/price-recommendations.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 /analytics/pricing loads without 400 console/network errors for price-elasticity and price-recommendations requests.
- [x] #2 Backend route ordering or API contract is corrected so static /v1/products/price-* endpoints are not parsed as nmId.
- [x] #3 Regression coverage verifies static price endpoints with auth + X-Cabinet-Id and preserves numeric /v1/products/:nmId behavior.
- [x] #4 Frontend API client paths and backend OpenAPI/route docs are consistent after the fix.
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
2026-06-16 validation/fix: backend ProductsController numeric nmId routes constrained with regex so static routes (/v1/products/price-elasticity, /v1/products/price-recommendations, /v1/products/search) are not captured by /v1/products/:nmId. AppModule imports now document PricingModule-before-ProductsModule route-order invariant.

Evidence: backend unit/integration tests passed: `npm test -- --runInBand --runTestsByPath src/products/__tests__/products-route-order.spec.ts` (3 passed), `npm test -- --runInBand src/app.module.spec.ts` (1 passed), `npm run type-check:raw`, `npm run lint:check -- src/app.module.ts src/app.module.spec.ts src/products/products.controller.ts src/products/__tests__/products-route-order.spec.ts`.

Live evidence after `npm run rebuild`: authenticated API calls to `/v1/products/price-elasticity?limit=50`, `/v1/products/price-recommendations?limit=50&target_margin_pct=15`, and `/v1/products/search?q=test` returned HTTP 200 (log `/tmp/backend-route-order-live-api.log`). Frontend smoke `node /tmp/ui-validation-route-smoke.mjs` returned total=62, failing=0, missingH1=0, multiH1=0 (log `/tmp/ui-validation-route-smoke-after-pricing-backend-fix.log`). Pricing live browser check returned H1 `Рекомендации по ценам`, recommendations/elasticity visible, console/page/API errors=0 (log `/tmp/pricing-live-ui-check.log`). Pricing Playwright suite passed 12/12 (log `/tmp/pricing-page-e2e-after-backend-fix.log`).
<!-- SECTION:NOTES:END -->
