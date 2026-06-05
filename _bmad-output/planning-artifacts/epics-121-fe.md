# Epic 121-FE: Advertising + Search Cross-Analysis (Marketing Plan §3.6)

**Status**: backlog
**Priority**: P2
**Created**: 2026-06-05
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

**Revised scope**: 4 stories, ~18 SP (reduced from original ~25 SP due to Epic 120.7 iROAS already covering per-product cannibalization).

---

## Stories

### Track A: Cross-Reference Enhancement (2 stories, ~10 SP)

#### Story 121.1-FE: Keyword Overlap Analysis (~5 SP)

**Route**: `/analytics/cross-reference` (existing page, new tab/section)

**Scope**:
- Add "Overlap" tab to existing cross-reference page
- Query: match keywords from `search/by-query` against keywords from advertising campaign data
- Show overlap table: keyword | organic position | ad spend | organic clicks | ad clicks | overlap status (duplicated / organic-only / ad-only)
- Highlight "duplicated" keywords where seller pays for ads that already rank organically
- Summary card: X% of ad spend is on keywords with organic position ≤ 10

**Backend**: Uses existing `GET /v1/analytics/search/by-query` + advertising campaign data. No new endpoints needed.

**ACs**:
1. "Overlap" tab renders on `/analytics/cross-reference`
2. Table shows keyword + organic position + ad spend + overlap status
3. "Duplicated" keywords highlighted (organic position ≤ 10 AND ad spend > 0)
4. Summary card shows potential savings estimate
5. Null-safe: no organic data → "Нет данных" indicator
6. Responsive, 200-line file limit, Russian locale

#### Story 121.2-FE: Position-Spend Scatter Plot (~5 SP)

**Route**: `/analytics/cross-reference` (same tab or separate section)

**Scope**:
- Scatter plot: X-axis = organic search position, Y-axis = ad spend
- Each point = one keyword
- Quadrant labels: "Over-investing" (low position, high spend), "Sweet spot" (high position, moderate spend), etc.
- Tooltip on hover: keyword details
- Use recharts ScatterChart (established pattern from other analytics pages)

**Backend**: Same endpoints as 121.1 — client-side correlation computation.

**ACs**:
1. Scatter chart renders with position (X) vs spend (Y)
2. Four quadrant labels visible
3. Tooltip shows keyword + position + spend on hover
4. Handles edge cases: zero spend, no organic data
5. 200-line file limit

### Track B: Aggregate Cannibalization (1 story, ~5 SP)

#### Story 121.3-FE: Cannibalization Dashboard (~5 SP)

**Route**: `/analytics/advertising` (new section/tab on existing page) OR hub widget

**Scope**:
- Aggregate iROAS + cannibalization data from Epic 120.7 across products
- Brand/category-level cannibalization summary
- "Products to review" table: products with organicCannibalizationPct > 70% AND ad spend > threshold
- Hub widget: "Potential over-spend" count on Analytics Hub

**Backend**: Uses `GET /v1/analytics/product/:nmId/organic-share` + `incremental-roas` per product. Needs aggregation strategy (either client-side batch or request a new summary endpoint).

**Risk**: Per-product endpoint requires N calls for N products. May need a `PENDING BACKEND:` marker requesting an aggregate endpoint.

**ACs**:
1. Table of products with high cannibalization (organicCannibalizationPct > 70%)
2. Brand-level aggregation if data permits
3. "Potential over-spend" metric
4. Link to individual product analytics page (cross-link from Epic 120)
5. Null-safe rendering for missing data

### Track C: Polish + Tests (1 story, ~3 SP)

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
| Search by-query API | ✅ Done (Epic 71) | `GET /v1/analytics/search/by-query` |
| Advertising campaign data | ✅ Done (Epic 33) | Per-campaign metrics available |
| Organic share / iROAS | ✅ Done (Epic 120.7) | Per-product endpoints live |
| Aggregate cannibalization endpoint | ⚠️ May need backend | 121.3 may need `PENDING BACKEND:` |

---

## Out of Scope

- Competitive keyword intelligence (§3.7) — no API support
- Automated marketing recommendations (§3.8) — future AI feature
- Per-product cannibalization detail (already done in Epic 120.7)
