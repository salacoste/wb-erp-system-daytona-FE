# Epic 71-FE: Search Analytics & Jam Gating

**Priority**: P0 (Marketing Analytics Q1 2026)
**Status**: ✅ Complete — 8/8 stories, 21 SP (per sprint-status.yaml)
**Route**: `/analytics/search`
**Backend**: Task-139 (search endpoints complete)
**Retroactive spec date**: 2026-04-15 (Story 88.5-FE)

---

## Numbering Note

Backend Request #151 and an earlier tracker note used "Epic 71" for Returns Analytics. The **frontend canonical Epic 71** is Search Analytics (per `sprint-status.yaml`, which tracks Stories 71.1 through 71.8 as done). Returns Analytics is documented as Epic 70-FE in `docs/epics/epic-70-fe-returns-analytics.md`. See that spec's "Numbering History" for the full rename trail.

The Search codebase already labels itself correctly: `src/app/(dashboard)/analytics/search/page.tsx:3` says "Epic 71-FE: Search Analytics & Jam Gating". The OTHER half of the Epic 71 conflict — the stale "Epic 71: Return Analytics" comment at `ReturnsPageContent.tsx:3` and 8 sibling files — was corrected to "Epic 70-FE" by this same Story 88.5-FE.

---

## Business Goal

Give Jam-subscribed sellers visibility into **organic search performance** — which queries drive traffic to their products, which products rank for high-value queries, and how many orders came from organic search. Complements advertising analytics (Epic 33) by surfacing the non-ad-spend part of the demand mix.

**Primary users**: Business owners optimizing listings (title/keywords); marketing managers balancing paid vs organic spend; CFOs evaluating brand organic equity.

**Jam gating**: This epic's endpoints require a paid Jam subscription. Non-Jam users see a `RequireJam` gating component (Story 71.3) instead of the analytics view.

---

## Delivered Stories

All stories are DONE per sprint-status (from the Q1 2026 Search Analytics push). Full retrospectives available:

| Story | Title | Artifact |
|---|---|---|
| 71.1-FE | Fix Jam-tier naming + Search foundation types | `_bmad-output/implementation-artifacts/71.1-fe-fix-jam-tier-naming-search-foundation-types.md` |
| 71.2-FE | Search analytics API client + hooks | `71.2-fe-search-analytics-api-client-hooks.md` |
| 71.3-FE | `RequireJam` gating component | `71.3-fe-requirejam-gating-component.md` |
| 71.4-FE | Search page scaffold + route registration | `71.4-fe-search-page-scaffold-route-registration.md` |
| 71.5-FE | Search Orders tab | `71.5-fe-search-orders-tab.md` |
| 71.6-FE | By-Product keyword explorer tab | `71.6-fe-by-product-keyword-explorer-tab.md` |
| 71.7-FE | By-Query product ranking tab | `71.7-fe-by-query-product-ranking-tab.md` |
| 71.8-FE | Tests + polish | `71.8-fe-search-analytics-tests-polish.md` |

Epic-71-FE retrospective: `epic-71-fe-retrospective` (done per sprint-status).

---

## File List

**Route / page**:
- `src/app/(dashboard)/analytics/search/page.tsx` — thin entry, mounts `SearchPageContent`

**Components** (`src/app/(dashboard)/analytics/search/components/`):
- `SearchPageContent.tsx` — orchestrator with tab state
- `SearchOrdersTab.tsx` + `SearchOrdersTable.tsx` — Orders tab (Story 71.5)
- `SearchByProductTab.tsx` + `SearchByProductTable.tsx` — By-Product keyword explorer (Story 71.6)
- `SearchByQueryTab.tsx` + `SearchByQueryTable.tsx` — By-Query product ranking (Story 71.7)
- `ProductCombobox.tsx` — SKU selector for the by-product tab
- `SortButton.tsx` — table column sort control

**State / data layer**:
- `src/hooks/use-search-analytics.ts` — TanStack Query wrappers (3 queries)
- `src/hooks/__tests__/use-search-analytics.test.ts` — hook tests
- `src/lib/api/search-analytics.ts` — API client (3 endpoints, `searchQueryKeys` factory, `SEARCH_CACHE` config)
- `src/types/search-analytics.ts` — request/response types for all 3 endpoints

**Gating**:
- `src/components/custom/RequireJam.tsx` (or equivalent) — Story 71.3 gating component
- Jam-tier state: `src/stores/authStore.ts` (role + subscription tier)

**Navigation**:
- `src/lib/routes.ts` — `/analytics/search` registration (Story 71.4)
- `src/components/custom/sidebar-navigation.ts` — sidebar entry gated on Jam

---

## Backend Dependencies

Task-139 (backend) delivered 3 endpoints:

| Method | Endpoint | Cache TTL | Purpose |
|---|---|---|---|
| GET | `/v1/analytics/search/by-product` | 5 min | Queries driving traffic to a specific product |
| GET | `/v1/analytics/search/by-query` | 5 min | Product ranking for a specific search query |
| GET | `/v1/analytics/search/orders` | 5 min | Orders attributed to organic search |

Runnable examples: see `test-api/` folder (search-specific examples).

---

## Key Decisions / Gotchas

- **Jam gating** (Story 71.3): `RequireJam` component wraps the route and redirects or renders an upgrade prompt for non-Jam users. Jam tier is read from `authStore` (populated by cabinet `GET /jam-status` — see Story 84.2).
- **Three independent tabs** (Stories 71.5 / 71.6 / 71.7) — each tab fetches from a separate endpoint. Switching tabs remounts the content, so each tab has its own loading / empty / error state.
- **Cache staleTime = 4 min** (`search-analytics.ts:93`) — shorter than backend TTL of 5 min to avoid stale hits after the backend cache rotates.
- **By-product tab requires an `nmId`** — enforced at the component level via `ProductCombobox`; the tab renders an empty state until the user picks a SKU.
- **`groupBy` parameter on orders endpoint** — `'query'` (default) or `'day'`. Used by the Orders tab for different views.
- **Jam-tier naming** (Story 71.1): backend was inconsistent about Jam tier naming (`'basic'` vs `'standard'` etc.). Story 71.1 added a frontend-side mapping analogous to `authStore.normalizeUser`'s role-case bridging. See the `normalizeJamTier` helper if you need it.

---

## Dependencies / References

- Backend: Task-139 endpoints (Search analytics). See `test-api/` folder for the search-specific HTTP examples.
- Dependency on Epic 84-FE (Cabinet Health & API Stability): Jam-status detection must work before Jam gating can be enforced.
- Sibling epic specs:
  - `docs/epics/epic-68-fe-funnel-analytics.md`
  - `docs/epics/epic-69-fe-buyout-rate-analytics.md`
  - `docs/epics/epic-70-fe-returns-analytics.md`
- Related stories (cross-references from the broader Marketing Analytics cluster):
  - 73.7-FE (search / advertising cross-reference) — uses search endpoints alongside advertising data
- Tracker: `docs/EPICS-AND-STORIES-TRACKER.md` (Epic 71-FE reference — updated by Story 88.5-FE).

---

## Out of Scope

- Renumbering: "Epic 71" refers to Search Analytics in this spec. The parallel use of "Epic 71" for Returns Analytics in BE #151 is acknowledged and left alone (documented in `epic-70-fe-returns-analytics.md`).
- Paid search analytics — handled by Epic 33 advertising analytics.
- Keyword suggestions / optimization recommendations — would be a follow-on ML / heuristics feature, not this analytics view.
