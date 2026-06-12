# Fix Plan: QA Audit Backlog task-23 through task-30

Date: 2026-06-12
Mode: Autopilot RALPlan
Source audit: `docs/qa/ui-data-backend-validation-report.md`
Scope: implement confirmed fixes for `task-23` through `task-30` and verify with unit/static/browser/E2E checks.

## Requirements summary

- `task-23`: Funnel CSV export must not request `limit > 500`; export must still collect all rows via supported pagination.
- `task-24`: Dashboard processing status must not hit a 404 for `/v1/imports/historical?limit=5`; preserve cabinet authorization.
- `task-25`: Dashboard shell navbar must not render a global H1; page-specific H1 remains the single H1.
- `task-26`: Settings pages must not nest `<main>` under the dashboard layout main; backfill strict `locator('main')` failures should disappear.
- `task-27`: Dashboard/storage React duplicate-key/static-flag warnings must be traced and fixed without muting console warnings.
- `task-28`: Storage tariff fallback logging must be rate-limited/deduped while preserving safe fallback behavior and data-quality visibility.
- `task-29`: Advertising E2E selectors must target the intended table when multiple tables are visible.
- `task-30`: Recharts `width/height = -1` warnings on affected analytics pages must be prevented by correcting chart container sizing, not by muting warnings.

## Implementation plan

1. **Contract fixes**
   - `task-23`: replace the single `limit: 10000` funnel export query with a small pagination helper/hook that repeatedly fetches `/v1/analytics/funnel` pages at `limit=500` until pagination indicates completion. Add a regression test that asserts all requests respect `limit <= 500` and combine rows across pages.
   - `task-24`: fix the concrete backend route precedence owner. `../src/imports/imports.module.ts` registers `ImportsController` before `HistoricalImportController`; because both use the same `v1/imports` prefix, the generic `ImportsController @Get(':id')` can shadow `HistoricalImportController @Get('historical')` and produce the observed 404. Prefer registering specific subcontrollers before the generic `ImportsController` and add a backend route regression proving `GET /v1/imports/historical?limit=5` reaches the historical-list handler and preserves `X-Cabinet-Id` handling.

2. **Accessibility/DOM semantics**
   - `task-25`: change navbar `Dashboard` from `<h1>` to a styled non-heading element and add representative component/route tests for heading hierarchy.
   - `task-26`: replace nested page-level `<main>` in settings pages/loading states with `<section>`/`<div>` preserving classes. Add tests to prevent nested `main` regression for representative settings pages.

3. **React warning cleanup**
   - `task-27`: inspect dashboard/storage components that render lists with non-unique/empty keys. Fix by using stable composite keys for duplicate-prone data (expense categories, warehouse names, top consumers, etc.) and add targeted regression tests or console-clean route checks.
   - Avoid suppressing React warnings.

4. **Console observability cleanup**
   - `task-28`: avoid a client module-global mute. Keep fallback data intact, but aggregate fallback warnings per route/fetch/calculation cycle so a page load logs one summarized warning with count/source details instead of one warning per row. Preserve `usingFallback` return data and tests for zero/invalid values, including repeated rows warning once per cycle and later cycles warning again.

5. **E2E selector stability**
   - `task-29`: scope advertising table assertions by a stable container, role/name, test id, or specific column header. Prefer test-only selector improvements unless product accessibility labels are missing.

6. **Chart sizing**
   - `task-30`: add a reusable `ChartContainer`/class pattern with explicit min-height and dimensions for affected Recharts wrappers, or update existing wrappers to guarantee positive height before `ResponsiveContainer` mounts. Add representative component/browser regression coverage.

## Verification plan

- Focused tests for changed units/components/hooks.
- `npm run type-check` and `npm run lint` in `frontend`.
- Backend focused tests for imports historical route if backend is edited.
- Targeted Playwright routes: `/dashboard`, `/analytics/funnel`, `/analytics/storage`, `/analytics/advertising`, `/analytics/buyout`, `/analytics/returns`, `/analytics/unit-economics`, `/settings/notifications`, `/settings/backfill`, `/settings/tariffs`, `/cogs/price-calculator`.
- Browser console/network assertions for: no funnel 400 from export, no imports historical 404, no duplicate-key/static-flag warnings, no repeated storage fallback flood, no Recharts `-1` warnings.

## Risks / constraints

- `task-24` likely requires backend code outside the frontend package. This is still in the same monorepo and directly required by the task; keep backend diff minimal and route-specific.
- Full Playwright may be expensive; run targeted E2E plus route smoke first, then broaden only if failures suggest cross-route regression.
- Do not mark backlog tasks done until acceptance criteria are verified.
