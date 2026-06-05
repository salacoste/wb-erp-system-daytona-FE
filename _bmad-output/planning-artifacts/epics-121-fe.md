# Epic 121-FE: Advertising + Search Cross-Analysis (Marketing Plan §3.6)

**Status**: ready-for-dev
**Priority**: P2
**Created**: 2026-06-05
**Revised**: 2026-06-05 (BMad Master — reduced scope, deferred keyword-level to future)
**Source**: Marketing Analytics Product Plan §3.6 + Epic 120-FE retro carry-forward
**Spec author**: BMad Master (auto-generated from product plan + codebase audit)

---

## Context

Marketing Plan §3.6 defines three sub-features for ad/search cross-analysis. After Epics 71-120, significant infrastructure already exists:

| Sub-Feature | Pre-existing Infrastructure | Gap |
|-------------|---------------------------|-----|
| **Ad Keyword vs Organic Keyword Overlap** | Cross-reference page (`/analytics/cross-reference`, Epic 73-FE) | ⚠️ **BLOCKED**: Advertising API returns spend/clicks per **SKU/campaign**, NOT per keyword. `bid-recommendations` has keyword bids but no spend data. Requires backend endpoint for per-keyword ad spend. |
| **Search Position vs Ad Spend Correlation** | Search `by-product`/`by-query` API + advertising campaign data | Can be done at **product level** (scatter: organic position vs ad spend per SKU). Keyword-level would need same backend endpoint as above. |
| **Advertising Cannibalization Analysis** | iROAS + organic cannibalization % per product (Epic 120.7) | Only per-product; no aggregate/brand/category view. Can be extended to a summary dashboard. |

**Revised scope (2026-06-05)**: Keyword-level overlap analysis is **PENDING BACKEND** (need per-keyword ad spend endpoint). Available work: product-level scatter plot + cannibalization dashboard.

**Revised scope (2026-06-05)**: 3 stories, ~13 SP. Keyword-level overlap (Story 121.1) **DEFERRED** — WB API does not expose per-keyword ad spend. Product-level scatter + cannibalization dashboard are fully buildable with existing endpoints.

---

## Stories

### Story 121.1-FE: Keyword Overlap Analysis — DEFERRED

**Status**: DEFERRED — requires per-keyword ad spend endpoint that WB API does not provide.
**Rationale**: Advertising endpoint returns spend aggregated per SKU/campaign, NOT per keyword. No WB Promotion API endpoint exposes search-term-level ad spend. Requires new backend data pipeline (search-term reports) that doesn't exist in WB API.
**Action**: File `docs/request-backend/209-CROSS-ANALYSIS-KEYWORD-AD-SPEND.md` requesting keyword-level ad reporting. Revisit when/if WB API adds this capability.

### Story 121.2-FE: Product-Level Position-Spend Scatter (~5 SP)

**Route**: `/analytics/cross-reference` (existing page, existing scatter chart + new product-level view)

**Scope**:
- Enhance existing ad-hoc ScatterChart (X=totalOrders, Y=adSpend) with product-level correlation view
- Join advertising data (spend per nmId) with search analytics (organic position per query per nmId)
- Four quadrant labels: "Over-investing" (low position, high spend), "Sweet spot" (high position, moderate spend), "Organic strong" (high position, low spend), "Opportunity" (low position, low spend)
- Tooltip: product name + vendor code + spend + top organic position
- Tab switch between existing channel-scatter and new product-scatter views

**Backend**: Uses existing `GET /v1/analytics/advertising` (spend per nmId) + `GET /v1/analytics/search/by-product` (organic position per nmId). Client-side correlation computation. No new endpoints needed.

**ACs**:
1. "По продуктам" tab renders on `/analytics/cross-reference`
2. Scatter chart shows X=organic position, Y=ad spend, each point = one product
3. Four quadrant labels visible
4. Tooltip shows product details on hover
5. Null-safe: no organic data → point excluded with count indicator
6. 200-line file limit, Russian locale, Boundary Normalizer Pattern

### Story 121.3-FE: Cannibalization Dashboard (~5 SP)

**Route**: `/analytics/advertising` (new section/tab on existing page) OR hub widget

**Scope**:
- Aggregate advertising data to identify cannibalization: products where `organicContribution` is high AND `spend` is high
- "Products to review" table: nmId | vendorCode | spend | organicContribution | dependencyLevel | iROAS | cannibalization risk
- Risk categories: High (organicContribution > 70% AND spend > threshold), Medium, Low
- Hub widget: "Potential over-spend" count on Analytics Hub
- Cross-link to individual product analytics page (Epic 120)

**Backend**: Uses existing `GET /v1/analytics/advertising` (spend + organicContribution per nmId). No new endpoints needed. Client-side risk computation.

**ACs**:
1. "Каннибализация" tab/section renders on advertising page
2. Table shows products with cannibalization metrics
3. Risk categories color-coded (high=red, medium=yellow, low=green)
4. Hub widget shows "Potential over-spend" product count
5. Cross-links to `/analytics/product/[nmId]` for individual analysis
6. Null-safe rendering, 200-line file limit, Russian locale

### Track B: Polish + Tests (1 story, ~3 SP)

#### Story 121.4-FE: Tests, E2E, and Cross-Link Polish (~3 SP)

**Scope**:
- Cabinet-isolation tests for new hooks (Pattern 4 from CLAUDE.md)
- E2E smoke tests for cross-reference enhancements
- Cross-link from advertising page to product detail for high-cannibalization items
- Verify all quality gates (type-check, ESLint, locale-percent, check:docs)

---

## Dependencies

| Dependency | Status | Notes |
|------------|--------|-------|
| Search by-product API | ✅ Done (Epic 71) | `GET /v1/analytics/search/by-product` |
| Advertising analytics API | ✅ Done (Epic 33/35) | Per-SKU spend + organicContribution available |
| Organic share / iROAS | ✅ Done (Epic 120.7) | Per-product endpoints live |
| Keyword-level ad spend | ❌ NOT AVAILABLE | WB API does not expose per-keyword ad spend — Story 121.1 DEFERRED |

---

## Out of Scope

- Competitive keyword intelligence (§3.7) — no API support
- Automated marketing recommendations (§3.8) — future AI feature
- Per-product cannibalization detail (already done in Epic 120.7)
- **Keyword-level ad/search overlap** (Story 121.1) — DEFERRED, WB API limitation
