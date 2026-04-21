# Epic 68-FE: Marketing Funnel Analytics

**Priority**: P1 (Marketing Analytics Q1 2026)
**Status**: ✅ Delivered (retroactive spec — code shipped before formal create-story workflow)
**Route**: `/analytics/funnel`
**Backend**: Request #151 (Funnel endpoints complete)
**Retroactive spec date**: 2026-04-15 (Story 88.5-FE)

---

## Numbering History

The number "Epic 68" is used by two distinct initiatives in this codebase:

- **This spec** documents **Marketing Funnel Analytics** — the shipped, in-production funnel page at `/analytics/funnel`. Code comments (e.g., `src/app/(dashboard)/analytics/funnel/page.tsx:3`) label it "Epic 68: Marketing Funnel".
- A separate, earlier planning doc `docs/epics/epic-68-fe-monitoring-health-dashboard.md` describes "Monitoring Health Dashboard" — a different Epic 68 initiative (route `/monitoring`) that was either never shipped or shipped under a different number. It is preserved as historical context and is **out of scope** for this spec.

The sprint-status.yaml does not include an `epic-68-fe` key because Epic 68 shipped pre-workflow. Retroactive delivery of the spec closes that documentation gap.

---

## Business Goal

Provide per-SKU (or time-series) marketing funnel visibility — views → cart → orders → buyouts → cancels — so sellers can diagnose conversion drops and optimize advertising spend. Complements Epic 69 (Buyout Rate) and Epic 73's ad-cost-discrepancy work to form the Marketing Analytics cluster.

**Primary users**: Business owners reviewing ad performance; CFOs auditing conversion trends.

---

## Delivered Stories (retroactive)

Epic 68 itself delivered the initial funnel page. Post-Epic-68 stories (72.x, 73.x, 87.x, 88.2) extended or fixed funnel functionality:

| Story | Title | Date | Scope |
|---|---|---|---|
| (Epic 68 base) | Funnel page + table + summary | Q1 2026 | Initial delivery — route registration, API client, types, page scaffold. **No per-story artifact** — delivered pre-workflow; code is the source of truth |
| 72.1-FE | Funnel/buyout type alignment | Q1 2026 | Backend contract alignment |
| 73.1-FE | Funnel table column refactor + brandName | 2026-02+ | UX polish |
| 73.2-FE | Funnel summary cards expansion | 2026-02+ | Added metric cards |
| 73.3-FE | Funnel WoW period comparison | 2026-02+ | Week-over-week comparison |
| 73.4-FE | Funnel product filter combobox | 2026-02+ | Multi-SKU filter UI |
| 73.8-FE | Funnel / advertising chart overlay | 2026-02+ | `FunnelOverlayChart.tsx` + overlay tooltip |
| 73.9-FE | Three-layer ad-cost discrepancy view | 2026-02+ | Adjacent; depends on funnel data |
| 87.x / 88.2-FE | Null-type audit touches | 2026-04 | Nullability corrections for margin/profit fields |

Per-story ACs exist in retrospective form at `_bmad-output/implementation-artifacts/{72.1,73.1,73.2,73.3,73.4,73.8,73.9,88-2}-fe-*.md`.

---

## File List (canonical locations)

**Route / page**:
- `src/app/(dashboard)/analytics/funnel/page.tsx` — Suspense boundary + `FunnelPageContent` mount

**Components** (`src/app/(dashboard)/analytics/funnel/components/`):
- `FunnelPageContent.tsx` — orchestrator (filters, data fetch, state)
- `FunnelTable.tsx` — main per-SKU table
- `FunnelChart.tsx` — time-series chart for groupBy=day
- `FunnelOverlayChart.tsx` — Story 73.8 overlay of funnel + ad-cost trends
- `FunnelOverlayTooltip.tsx` — Story 73.8 custom tooltip
- `FunnelSummaryCards.tsx` — Story 73.2 top-level summary
- `FunnelProductFilter.tsx` — Story 73.4 multi-SKU combobox
- `funnel-comparison-utils.ts` — Story 73.3 WoW helpers
- `funnel-overlay-config.ts` — Story 73.8 chart config
- `funnel-table-columns.tsx`, `funnel-table-cells.tsx` — Story 73.1 split
- `__tests__/` — unit coverage

**State / data layer**:
- `src/hooks/use-funnel-analytics.ts` — TanStack Query wrapper for `getFunnelData` + `getFunnelSyncStatus`
- `src/lib/api/funnel-analytics.ts` — API client (2 functions, query-keys factory, `FUNNEL_CACHE` constant)
- `src/types/analytics-funnel.ts` — `FunnelParams`, `FunnelResponse`, `FunnelSyncStatus`

**Navigation / routing**:
- `src/lib/routes.ts` — `/analytics/funnel` registration
- `src/components/custom/sidebar-navigation.ts` — sidebar entry

---

## Backend Dependencies

All endpoints documented in `docs/request-backend/151-EPICS-68-71-ANALYTICS-API.md`:

| Method | Endpoint | Cache TTL | Purpose |
|---|---|---|---|
| GET | `/v1/analytics/funnel` | 5 min | Per-SKU or time-series funnel data |
| GET | `/v1/analytics/funnel/sync-status` | — | Freshness indicator for the funnel view |

Runnable request examples: `test-api/29-funnel-analytics.http`.

---

## Key Decisions / Gotchas

- **Funnel cache staleTime = 4 min** (`src/lib/api/funnel-analytics.ts:62`) — deliberately shorter than backend TTL of 5 min to avoid serving expired data after the backend cache flips.
- **groupBy parameter** toggles between per-SKU rows (default) and daily time series. The table and chart components branch on this.
- **Chart overlay (Story 73.8)** joins funnel metrics with advertising cost data for aligned-time X-axis. This required a separate overlay-specific config because Recharts doesn't natively align stacked bars with line-chart overlays.
- **Product filter (Story 73.4)** accepts N SKUs and joins them in the `nmIds` query param. Backend limit: no enforced cap, but large lists (>100) truncate sensibly.
- **WoW comparison (Story 73.3)** is a frontend-side computation — backend returns two period responses, client computes the delta. Backend does NOT return pre-computed WoW.
- **Null-type audit (Story 88.2-FE)** widened nullable fields propagated to funnel-adjacent surfaces but didn't directly touch funnel — the scope was advertising + daily-COGS. Funnel has its own contract where nulls are rare.

---

## Dependencies / References

- Backend: `docs/request-backend/151-EPICS-68-71-ANALYTICS-API.md` (formal contract for all 8 endpoints across Epics 68-71).
- Sibling epic specs (Story 88.5-FE):
  - `docs/epics/epic-69-fe-buyout-rate-analytics.md`
  - `docs/epics/epic-70-fe-returns-analytics.md`
  - `docs/epics/epic-71-fe-search-analytics.md`
- Stories listed above under "Delivered Stories" — each has its own retrospective file under `_bmad-output/implementation-artifacts/`.
- Tracker: `docs/EPICS-AND-STORIES-TRACKER.md` (status updates post-Story 88.5).

---

## Out of Scope

- Renumbering — Epic 68 stays Epic 68 in both this spec and the parallel `epic-68-fe-monitoring-health-dashboard.md`. See "Numbering History".
- Runtime validation of backend responses (zod/valibot) — not yet introduced at the boundary (see `_bmad-output/planning-artifacts/boundary-normalizer-audit-2026-04-15.md`).
- Funnel drill-downs at the per-campaign or per-query level — covered by Epic 71 Search Analytics.
