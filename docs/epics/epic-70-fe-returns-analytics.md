# Epic 70-FE: Returns Analytics

**Priority**: P2 (Marketing Analytics Q1 2026)
**Status**: ✅ Delivered (retroactive spec — code shipped before formal create-story workflow)
**Route**: `/analytics/returns`
**Backend**: Request #151 (Returns endpoints complete)
**Retroactive spec date**: 2026-04-15 (Story 88.5-FE)

---

## Numbering History

The number "Epic 70" is used by two distinct initiatives in this codebase:

- **This spec** documents **Returns Analytics** — the shipped page at `/analytics/returns` for return-reason analysis. Backend Request #151 originally labeled this as "Epic 71: Returns", but by the time the frontend shipped it had settled on Epic 70 per the canonical story tracker.
- A separate, earlier epic `docs/epics/epic-70-fe-validation-fixes.md` documents "Frontend Validation Fixes" (6 stories, 13 SP, complete 2026-02-28). That Epic 70 is unrelated to Returns Analytics — it was a cross-cutting validation sweep. It is **out of scope** for this spec and remains as a separate artifact.

Adding to the confusion: the code at `src/app/(dashboard)/analytics/returns/components/ReturnsPageContent.tsx:3` originally had a stale "Epic 71: Return Analytics" label. Story 88.5-FE (this story) corrects that comment to "Epic 70-FE: Returns Analytics" so the code matches the canonical epic name.

Backend Request #151's internal numbering (Epic 71 = Returns) does NOT align with the frontend's canonical numbering. The rename history is documented here so future readers understand why BE #151 still shows Epic 71 for these endpoints.

---

## Business Goal

Give sellers a data-driven view of **why products get returned** — aggregated by reason categories (size, quality, damage, wrong-item, etc.) with per-SKU drill-down and anomaly detection. A SKU with 50% returns needs a different intervention than a SKU with 5% — this view surfaces the difference.

Sits in the Marketing Analytics cluster: Epic 68 (Funnel), Epic 69 (Buyout), Epic 70 (Returns, this spec), Epic 71 (Search).

**Primary users**: Business owners diagnosing product-quality or listing issues; CFOs monitoring refund exposure.

---

## Delivered Stories (retroactive)

Epic 70 Returns shipped pre-workflow; per-story ACs are not in `implementation-artifacts/`. The features below were delivered as one coherent epic:

| Capability | Evidence |
|---|---|
| Return reasons API integration | `src/lib/api/return-analytics.ts` — 2 endpoints |
| Aggregated pie chart view | `components/ReturnReasonsPieChart.tsx` |
| Summary cards (total returns, % rate, top reason) | `components/ReturnsSummaryCards.tsx` |
| Per-SKU return breakdown table with cursor pagination | `components/ReturnsTable.tsx` |
| Anomaly detection flags | `getReturnsBySku({ anomalyOnly })` parameter |
| Dual-format handling (raw classification vs pre-aggregated) | `return-analytics.ts:47-55` docstring (detection comment at lines 51-53) — auto-detects by checking first item for `returnCategory` (raw) vs `totalReturns` (aggregated) |
| Locale-aware reason labels | `getReturnReasons(from, to, locale)` supports `'ru' | 'en'` |

Post-Epic-70 touches: Story 88.5-FE (this story) — drive-by code-comment correction at `ReturnsPageContent.tsx:3`.

---

## File List

**Route / page**:
- `src/app/(dashboard)/analytics/returns/page.tsx`

**Components** (`src/app/(dashboard)/analytics/returns/components/`):
- `ReturnsPageContent.tsx` — orchestrator
- `ReturnReasonsPieChart.tsx` — category distribution pie chart
- `ReturnsSummaryCards.tsx` — top-level summary
- `ReturnsTable.tsx` — per-SKU breakdown with cursor pagination

**State / data layer**:
- `src/hooks/use-return-analytics.ts` — TanStack Query wrapper
- `src/lib/api/return-analytics.ts` — API client; includes dual-format detection helper
- `src/types/analytics-returns.ts` — `ReturnReasonsResponse`, `BySkuReturnResponse`, `ReturnsBySkuParams`

**Navigation**:
- `src/lib/routes.ts` — `/analytics/returns` registration

---

## Backend Dependencies

Per `docs/request-backend/151-EPICS-68-71-ANALYTICS-API.md` (note: BE #151 labels these as Epic 71; frontend canonicalizes to Epic 70):

| Method | Endpoint | Cache TTL | Purpose |
|---|---|---|---|
| GET | `/v1/analytics/returns/reasons` | 5 min | Aggregated return reasons by category (for pie chart) |
| GET | `/v1/analytics/returns/reasons/by-sku` | 5 min | Per-SKU breakdown with anomaly flags (cursor-paginated) |

Runnable examples: `test-api/33-return-analytics.http`.

---

## Key Decisions / Gotchas

- **Dual-format detection** (`return-analytics.ts:47-55` docstring, detection comment at lines 51-53): the `by-sku` endpoint can return either raw classification records OR pre-aggregated per-SKU data. The frontend detects format by checking if the first item has `returnCategory` (raw) or `totalReturns` (aggregated) and adapts. This is a pragmatic handling of a backend contract that evolved mid-implementation.
- **Locale parameter** on the reasons endpoint — backend returns Russian labels by default; frontend can request English via `locale=en`. Tied to broader i18n direction (not yet systematized across the app).
- **Anomaly detection** is computed server-side; client exposes `anomalyOnly=true` to filter the table to flagged SKUs only.
- **Cursor pagination** on the by-sku table — not offset-based. Pagination state is opaque from the frontend's perspective; the `cursor` param is a server-issued continuation token.
- **Mislabeled code comment** in `ReturnsPageContent.tsx:3` said "Epic 71: Return Analytics" until Story 88.5-FE corrected it. Any search for "Epic 71" in the codebase that returned Return components was a symptom of the pre-workflow numbering drift.

---

## Dependencies / References

- Backend: `docs/request-backend/151-EPICS-68-71-ANALYTICS-API.md` (returns endpoints despite "Epic 71" label inside the doc).
- Sibling epic specs:
  - `docs/epics/epic-68-fe-funnel-analytics.md`
  - `docs/epics/epic-69-fe-buyout-rate-analytics.md`
  - `docs/epics/epic-71-fe-search-analytics.md`
- Unrelated Epic 70 (validation fixes): `docs/epics/epic-70-fe-validation-fixes.md` — preserved as historical artifact; NOT related to returns analytics.
- Tracker: `docs/EPICS-AND-STORIES-TRACKER.md` lines 111-114 (updated by Story 88.5-FE to remove "pending" marker).

---

## Out of Scope

- Renumbering (the double use of "Epic 70" is acknowledged and left alone — see Numbering History).
- Automated interventions on flagged anomalies (would belong in a recommendations engine, not this analytics view).
- Supplier-specific return tracking — handled elsewhere (out of this app's scope).
