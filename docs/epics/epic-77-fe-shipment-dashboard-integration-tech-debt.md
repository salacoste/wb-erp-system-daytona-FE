---
stepsCompleted: ['step-01-validate-prerequisites', 'step-02-design-epics', 'step-03-create-stories']
inputDocuments:
  - docs/epics/epic-75-76-fe-shipment-cost-allocation.md
  - _bmad-output/implementation-artifacts/epic-76-fe-retro-2026-03-11.md
  - _bmad-output/implementation-artifacts/epic-75-fe-retro-2026-03-11.md
  - src/lib/unit-economics-utils.ts
  - src/types/unit-economics.ts
  - src/types/shipment-cost.ts
  - CLAUDE.md
---

# Epic 77-FE: Shipment Cost Dashboard Integration & Tech Debt Cleanup

## Overview

This epic combines two scopes:
1. **Tech Debt Cleanup** (Stories 77.1-77.2) — HIGH-priority items carried across 74→75→76 retros, no backend dependency
2. **Shipment Cost Dashboard Integration** (Stories 77.3-77.6) — Deferred from Epic 76-FE Decision #6: integrate FCU (Final Cost per Unit) into unit economics dashboard

**Total**: ~18 SP across 6 stories

## Key Decisions

| # | Decision | Choice | Rationale |
|---|----------|--------|-----------|
| 1 | Epic scope | Combined tech debt + dashboard integration | Tech debt items are quick wins that unblock quality; dashboard integration is the next logical feature after 76-FE |
| 2 | Hooks symlink resolution | Rename `hooks-v1/` → `hooks/` (remove symlink) | 256 files import via `@/hooks/`; renaming the real directory preserves all imports and eliminates the symlink |
| 3 | jsx-a11y config | Add `plugin:jsx-a11y/recommended` to ESLint extends | Plugin already installed transitively via eslint-config-next; explicit config activates full WCAG rules |
| 4 | FCU aggregation | Backend request for new endpoint | Frontend-only aggregation across shipments is fragile and slow; backend should provide per-SKU FCU summary |
| 5 | Dashboard integration approach | New cost category `delivery_to_warehouse` in unit economics | Seller's shipment cost is distinct from WB's logistics_delivery; separate category preserves accounting clarity |
| 6 | E2E test scope | Shipment CRUD + calculate + confirm flow | Mirrors e2e/supplies/ pattern (4 specs: list, detail, lifecycle, a11y) |

## Requirements Inventory

### Functional Requirements

FR1: Resolve `src/hooks` → `src/hooks-v1` symlink — rename real directory, remove symlink, fix the 1 direct `hooks-v1` import in `shipments/page.tsx`
FR2: Enable `eslint-plugin-jsx-a11y/recommended` in ESLint config — add to `devDependencies` and `.eslintrc.json` extends, fix any new violations
FR3: Create shipment E2E test suite — list page, detail page, create/edit/delete lifecycle, calculate+confirm flow, accessibility checks
FR4: Request backend FCU aggregation endpoint — document requirements for `GET /v1/shipment-cost/by-sku` that returns latest confirmed FCU per nmId
FR5: Add `delivery_to_warehouse` cost category to unit economics types (`CostsPct`, `CostsRub`) and waterfall chart config
FR6: Add FCU column to dashboard UnitEconomicsTable — show delivery cost per unit alongside existing COGS%, margin%
FR7: Update health score formula to optionally factor in delivery cost coverage (SKUs with confirmed shipment costs)
FR8: Tests and polish for all new integration code

### Non-Functional Requirements

Same as Epic 76-FE (NFR1-NFR8). Additionally:
- NFR9: All new ESLint jsx-a11y violations from enabling the plugin must be fixed before merging 77.1
- NFR10: E2E tests must run in CI with Playwright (existing infrastructure)

## Story Breakdown

### Story 77.1: Resolve Hooks Symlink & Enable jsx-a11y (2 SP)

**As a** developer,
**I want** the hooks directory properly named and accessibility linting automated,
**So that** ESLint noise is eliminated and ARIA violations are caught at lint time.

**Acceptance Criteria:**
1. `src/hooks-v1/` renamed to `src/hooks/` (real directory, not symlink)
2. Symlink `src/hooks` removed (replaced by the actual directory)
3. All 256+ imports via `@/hooks/` continue to work unchanged
4. The 1 direct `@/hooks-v1/use-sku-packaging` import in `shipments/page.tsx` updated to `@/hooks/use-sku-packaging`
5. `eslint-plugin-jsx-a11y` added to `devDependencies` in package.json
6. `"plugin:jsx-a11y/recommended"` added to `.eslintrc.json` extends array
7. Any new ESLint violations from jsx-a11y rules are fixed (estimate: icon-only buttons already have aria-labels from 75-FE/76-FE work)
8. `npm run lint && npm run type-check && npm run build` passes with 0 errors
9. All existing tests pass (no regressions from directory rename)

**Tasks:**
- Task 1: Remove symlink, rename `hooks-v1/` to `hooks/`
- Task 2: Fix direct `hooks-v1` import in `shipments/page.tsx`
- Task 3: Add `eslint-plugin-jsx-a11y` to devDependencies, update `.eslintrc.json`
- Task 4: Run lint, fix any new jsx-a11y violations
- Task 5: Verify full test suite passes

**Dev Notes:**
- `git mv` may not handle symlink→directory rename cleanly — may need: remove symlink, rename directory, stage both changes
- The symlink is relative (`hooks -> hooks-v1`), so only the frontend workspace is affected
- `next/core-web-vitals` already enables a SUBSET of jsx-a11y rules; adding `recommended` enables the full set
- Known jsx-a11y rules that may fire: `anchor-is-valid`, `click-events-have-key-events`, `no-static-element-interactions`

---

### Story 77.2: Shipment E2E Tests (3 SP)

**As a** QA engineer,
**I want** end-to-end test coverage for the shipment workflow,
**So that** the full CRUD + calculate + confirm flow is validated against a real browser.

**Acceptance Criteria:**
1. `e2e/shipments/shipments-list.spec.ts` — list page loads, status filter works, pagination works, create dialog opens
2. `e2e/shipments/shipments-detail.spec.ts` — detail page loads, pallet accordion expands, box line table renders, calculate button triggers calculation
3. `e2e/shipments/shipments-lifecycle.spec.ts` — create → add pallets → add box lines → calculate → confirm → verify readonly state → delete
4. `e2e/shipments/shipments-a11y.spec.ts` — axe-core accessibility audit on list and detail pages
5. All E2E tests pass in CI (Playwright + Chromium)
6. Test patterns follow existing `e2e/supplies/` spec structure

**Tasks:**
- Task 1: Create `e2e/shipments/` directory with 4 spec files
- Task 2: Implement list page E2E (navigation, filter, pagination)
- Task 3: Implement detail page E2E (accordion, box lines, calculation results)
- Task 4: Implement lifecycle E2E (full CRUD + calculate + confirm flow)
- Task 5: Implement accessibility E2E (axe-core audit)
- Task 6: Verify all specs pass locally and in CI

**Dev Notes:**
- Follow `e2e/supplies/` as the template — 4 specs covering list/detail/lifecycle/a11y
- Backend must be running with seeded data for E2E to work
- Use `page.waitForSelector` for async content (calculation results, validation errors)
- Shipment detail page has nested accordions — test expand/collapse interactions
- The calculate endpoint may take >1s — increase timeout for that assertion

---

### Story 77.3: Backend Request — FCU Aggregation Endpoint (1 SP)

**As a** product owner,
**I want** a documented backend request for FCU aggregation,
**So that** the backend team can implement the API before dashboard integration begins.

**Acceptance Criteria:**
1. `docs/request-backend/162-FCU-AGGREGATION-ENDPOINT.md` created with full specification
2. Endpoint spec: `GET /v1/shipment-cost/by-sku` with query params: `week` (ISO week), `cabinetId` (from JWT)
3. Response spec: array of `{ nmId, productName, latestFcu, latestDcu, latestPcu, shipmentId, confirmedAt }`
4. Aggregation logic: for each nmId, return the FCU from the most recently confirmed shipment containing that SKU
5. Performance requirement: p95 < 500ms for cabinets with up to 5000 SKUs
6. Integration notes: response should follow existing `{ data: [...] }` envelope pattern
7. Story marked done when request doc is written (backend implementation is separate)

**Tasks:**
- Task 1: Write the request document following existing format in `docs/request-backend/`
- Task 2: Include SQL sketch for the aggregation query (JOIN shipments + pallets + box_lines, WHERE status = CONFIRMED, latest per nmId)

**Dev Notes:**
- This is a documentation-only story — no code changes
- Backend may choose to implement this as a materialized view or a query with `DISTINCT ON (nm_id) ORDER BY confirmed_at DESC`
- The response shape should be compatible with `CalculationResultItem` type from Epic 76-FE
- Alternative: backend could add FCU fields to the existing `GET /v1/products` endpoint with `include_fcu=true` param (simpler integration but larger response)

---

### Story 77.4: Unit Economics Types & Waterfall — Add Delivery Cost Category (3 SP)

**As a** seller,
**I want** to see my delivery-to-warehouse costs in the unit economics breakdown,
**So that** I can understand the true total cost per unit including logistics.

**Acceptance Criteria:**
1. `CostsPct` and `CostsRub` types in `src/types/unit-economics.ts` have new `delivery_to_warehouse` field (optional, for backward compat)
2. `COST_CATEGORIES` in `src/lib/unit-economics-config.ts` includes new `delivery_to_warehouse` category (label: "Доставка на склад", color: teal/cyan)
3. `transformToWaterfallData()` in `src/lib/unit-economics-utils.ts` handles the new category
4. Waterfall chart shows the new bar when delivery cost data is present, omits it when absent
5. `calculateWbFeesPct/Rub()` does NOT include delivery_to_warehouse (it's a seller cost, not a WB fee)
6. API integration: new hook `useFcuBySku(week)` calls the backend endpoint from 77.3 (when available)
7. Fallback: if FCU endpoint not yet available, delivery_to_warehouse shows as "—" (not 0)
8. Unit tests for new waterfall category, type extensions, and hook

**Tasks:**
- Task 1: Extend `CostsPct` and `CostsRub` types with `delivery_to_warehouse?: number`
- Task 2: Add category to `COST_CATEGORIES` config
- Task 3: Update `transformToWaterfallData()` to include new category
- Task 4: Create `fcu-aggregation-api.ts` with `getFcuBySku(week)` function
- Task 5: Create `use-fcu-aggregation.ts` hook with TanStack Query
- Task 6: Wire FCU data into unit economics page data flow
- Task 7: Unit tests for types, waterfall, API, hook

**Dev Notes:**
- `delivery_to_warehouse` is the seller's cost to ship TO the WB warehouse — distinct from `logistics_delivery` (WB's cost to ship FROM warehouse to customer)
- Making the field optional ensures backward compatibility — pages that don't have FCU data won't break
- Color: use teal/cyan (#06B6D4) to distinguish from existing cost categories (green=positive, red=negative, blue=info, purple=storage)
- The waterfall chart position: after `storage` and before `penalties` (delivery is a known, planned cost like storage)

**Dependencies:** Story 77.3 (backend request) should be submitted before starting, but implementation can begin with mock data

---

### Story 77.5: Dashboard Unit Economics Table — FCU Column (3 SP)

**As a** seller,
**I want** to see delivery cost per unit in the unit economics table,
**So that** I can compare FCU across SKUs and identify expensive-to-ship products.

**Acceptance Criteria:**
1. `UnitEconomicsTable.tsx` has new "Доставка" column showing DCU (delivery cost per unit) from FCU data
2. `UnitEconomicsTableRow.tsx` renders DCU value with `formatCurrency()`, or "—" if no confirmed shipment
3. Column is sortable (ascending/descending by DCU)
4. Column has tooltip explaining: "Стоимость доставки на единицу товара из последней подтверждённой отправки"
5. Dashboard `UnitEconomicsSummaryCards` has new card: "Ср. доставка" showing average DCU across all SKUs with confirmed shipments
6. `calculateHealthScore()` optionally factors in delivery cost coverage: bonus points if >80% of revenue-generating SKUs have confirmed FCU
7. All files remain under 200 lines
8. Unit tests for new column, sort, summary card, health score update

**Tasks:**
- Task 1: Add DCU column to UnitEconomicsTable + row component
- Task 2: Add sort capability for DCU column
- Task 3: Add "Ср. доставка" summary card
- Task 4: Update health score formula (optional delivery cost coverage bonus)
- Task 5: Wire FCU data from `useFcuBySku` hook into table data
- Task 6: Unit tests

**Dev Notes:**
- Match existing column patterns in UnitEconomicsTable (sticky header, responsive widths)
- DCU sort: null values (no shipment data) sort last
- Health score change is additive — existing score calculation unchanged, delivery cost coverage adds 0-5 bonus points
- If UnitEconomicsTable approaches 200 lines, extract column definitions to `unit-economics-columns.ts` (proactive extraction per 76-FE lesson)

**Dependencies:** Story 77.4 (types + hook)

---

### Story 77.6: Tests & Polish (3 SP)

**As a** QA engineer,
**I want** comprehensive test coverage for the dashboard integration,
**So that** FCU data displays correctly across all unit economics views.

**Acceptance Criteria:**
1. Unit tests for `fcu-aggregation-api.ts` (CRUD + error handling)
2. Unit tests for `use-fcu-aggregation.ts` hook (query, error propagation, cache invalidation)
3. Component tests for updated waterfall chart with delivery_to_warehouse category
4. Component tests for UnitEconomicsTable DCU column (render, sort, null handling)
5. Component tests for updated health score display
6. `npm run lint && npm run type-check && npm run build` passes with 0 errors
7. All files ≤ 200 lines
8. No unexpected console warnings in test output

**Tasks:**
- Task 1: API client tests for FCU aggregation endpoint
- Task 2: Hook tests with error propagation + cache invalidation
- Task 3: Waterfall chart tests with new category
- Task 4: Table column tests (render, sort, null values)
- Task 5: Health score tests with delivery cost coverage
- Task 6: Quality gates (lint, type-check, build)

**Dev Notes:**
- Follow 76.6 test patterns: `createTestQueryClient`, `createQueryWrapper`, `mockRejectedValueOnce` (not `mockRejectedValue`)
- Mock FCU API responses for component tests — don't depend on backend availability
- Test null/undefined FCU gracefully — many SKUs won't have shipment data

---

## Story Dependency Graph

```
77.1 (hooks symlink + jsx-a11y) ──→ can start immediately
77.2 (E2E tests)                ──→ can start immediately (independent of 77.1)
77.3 (backend request doc)      ──→ can start immediately
77.4 (types + waterfall)        ──→ after 77.3 submitted (can use mock data)
77.5 (table + dashboard)        ──→ after 77.4
77.6 (tests + polish)           ──→ after 77.4 + 77.5
```

**Parallelizable**: 77.1, 77.2, and 77.3 are fully independent.

## SP Summary

| Story | SP | Scope |
|-------|-----|-------|
| 77.1 | 2 | Tech debt: hooks symlink + jsx-a11y |
| 77.2 | 3 | Tech debt: E2E tests |
| 77.3 | 1 | Backend request doc |
| 77.4 | 3 | Types + waterfall integration |
| 77.5 | 3 | Dashboard table + summary |
| 77.6 | 3 | Tests + polish |
| **Total** | **15** | |

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Backend FCU endpoint delayed | MEDIUM | HIGH — blocks 77.4-77.6 | Start 77.4 with mock data; FCU hook uses `enabled: !!endpoint` guard |
| jsx-a11y enables many new violations | LOW | MEDIUM — could bloat 77.1 scope | `next/core-web-vitals` already covers most rules; 75-FE/76-FE added aria-labels proactively |
| git rename of hooks directory breaks history | LOW | LOW — history preserved with `git mv` | Use `git mv src/hooks-v1 src/hooks` after removing symlink |
| Unit economics table exceeds 200 lines | MEDIUM | LOW — extraction pattern is well-established | Proactive extraction at 150 lines per 76-FE lesson |
| E2E tests flaky due to backend timing | MEDIUM | MEDIUM | Use `page.waitForResponse` for calculate endpoint; increase timeouts for cost calculation |
