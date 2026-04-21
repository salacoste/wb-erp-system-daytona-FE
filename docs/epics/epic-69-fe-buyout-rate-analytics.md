# Epic 69-FE: Buyout Rate per-SKU Analytics

**Priority**: P2 (Marketing Analytics Q1 2026)
**Status**: ✅ Complete — 7/7 stories, 28 SP delivered (2026-02-25)
**Route**: `/analytics/buyout`
**Backend**: Request #151 (complete) + Request #154 (open — data source transparency)
**Retroactive spec date**: 2026-04-15 (Story 88.5-FE)

---

## Business Goal

Help sellers diagnose **buyout rate** (% of orders actually paid vs cancelled) at the per-SKU level, with summary rollups at the cabinet level. Low buyout rate signals bad listings, pricing, or logistics — this view surfaces the outliers.

Sits in the Marketing Analytics cluster alongside Epic 68 (Funnel), Epic 70 (Returns), Epic 71 (Search). Together they give sellers a complete conversion picture.

**Primary users**: Business owners diagnosing profitability leaks; CFOs auditing return/refund exposure.

---

## Delivered Stories

Per `docs/EPICS-AND-STORIES-TRACKER.md` (lines 103-109), 7 stories delivered 28 SP, completed 2026-02-25.

| # | Scope | Status |
|---|---|---|
| 69.1-FE | Types & API client foundation | ✅ |
| 69.2-FE | Buyout route + page scaffold | ✅ |
| 69.3-FE | Buyout summary widget (cabinet-level) | ✅ |
| 69.4-FE | Per-SKU buyout table | ✅ |
| 69.5-FE | Data source transparency badge (weekly report vs orders API) | ✅ |
| 69.6-FE | Empty / loading / error states | ✅ |
| 69.7-FE | Tests + polish | ✅ |

Post-Epic-69 touches:
- Story 72.4-FE (advertising profit multiplication warning) adjusted buyout-related profit calc
- Story 72.5-FE / 72.6-FE (buyout table refactor + enrichment fix + hook migration)

Detailed per-story retrospectives exist at `_bmad-output/implementation-artifacts/72.5-fe-*.md`, `72.6-fe-*.md` (note: Stories 72.x / 73.x / 87.x use dot separator; Stories 88.x use dash). Epic 69's own 7 stories shipped pre-workflow — per-story artifacts are not in the implementation-artifacts folder.

---

## File List

**Route / page**:
- `src/app/(dashboard)/analytics/buyout/page.tsx` — thin entry, mounts `BuyoutPageContent`

**Components** (`src/app/(dashboard)/analytics/buyout/components/`):
- `BuyoutPageContent.tsx` — orchestrator (state, data fetch, layout)
- `BuyoutSummaryWidget.tsx` — cabinet-level summary card
- `BuyoutTable.tsx` — per-SKU breakdown table
- `buyout-table-columns.tsx`, `buyout-table-cells.tsx` — column config + cell renderers
- `__tests__/` — unit coverage

**State / data layer**:
- `src/hooks/use-buyout-analytics.ts` — TanStack Query wrapper + refetch policy
- `src/hooks/__tests__/use-buyout-analytics.test.ts` — hook tests
- `src/lib/api/buyout-analytics.ts` — API client (passthrough; 2 endpoints)
- `src/types/buyout-analytics.ts` — request/response types

**Navigation / routing**:
- `src/lib/routes.ts` — `/analytics/buyout` route
- `src/components/custom/sidebar-navigation.ts` — sidebar entry

---

## Backend Dependencies

Per `docs/request-backend/151-EPICS-68-71-ANALYTICS-API.md`:

| Method | Endpoint | Cache TTL | Purpose |
|---|---|---|---|
| GET | `/v1/analytics/buyout/by-sku` | 30 min | Per-SKU buyout rate |
| GET | `/v1/analytics/buyout/summary` | 30 min | Cabinet-level summary |

Open backend request: `docs/request-backend/154-*` — data source mismatch between weekly report buyout rate and orders API buyout rate (handled client-side with a transparency badge until backend resolves).

Runnable examples: `test-api/32-buyout-analytics.http`.

---

## Key Decisions / Gotchas

- **Data source transparency badge** (Story 69.5-FE): the page shows which data source the current view was computed from (weekly report = financially authoritative; orders API = faster but may differ during reconciliation). This is a workaround for the open Backend Request #154.
- **30-min cache TTL** on both endpoints — longer than funnel (5 min) because buyout rate is a slower-moving metric. The frontend uses default TanStack Query `staleTime=60s` overridden by module-level cache settings.
- **Profit multiplication bug** (Story 72.4): pre-fix, profit was multiplied by quantity twice in the buyout calculation. Post-fix, the warning banner stays as a defensive UX mechanism.
- **Table + summary widget are decoupled** — they fetch from separate endpoints and display separate loading states, so a slow cabinet-summary call doesn't block the table.
- **Route registration** was pending at initial Epic 69 delivery; landed alongside Story 71.4-FE's route registration sweep.

---

## Dependencies / References

- Backend: `docs/request-backend/151-EPICS-68-71-ANALYTICS-API.md`, `docs/request-backend/154-*`.
- Sibling epic specs:
  - `docs/epics/epic-68-fe-funnel-analytics.md`
  - `docs/epics/epic-70-fe-returns-analytics.md`
  - `docs/epics/epic-71-fe-search-analytics.md`
- Legacy / superseded: `docs/epics/epic-69-fe-buyout-analytics.md` (preserved as historical reference).
- Tracker: `docs/EPICS-AND-STORIES-TRACKER.md` lines 103-109, 545-547.

---

## Out of Scope

- Reconciling the two buyout data sources (weekly report vs orders API) — backend's responsibility (Request #154).
- Extending per-SKU drill-downs to per-order level — belongs in Orders Analytics, not Buyout.
