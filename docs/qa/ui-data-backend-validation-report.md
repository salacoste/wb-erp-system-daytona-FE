# UI/UX + Business Data + Backend Correctness Validation Report

Date: 2026-06-12 16:04 MSK
Mode: Autopilot QA audit
Branch: `codex/ui-data-qa-audit`
Plan: `docs/qa/ui-data-backend-validation-plan.md`
Artifacts: `docs/qa/artifacts/ui-data-backend-validation/`

## Executive summary

Audit completed with automated, browser, and API evidence. Static quality and targeted unit/business normalizer checks are clean. Browser/E2E validation found several actionable issues, mostly frontend/backend contract drift, DOM semantics/accessibility, React/chart console warnings, and test-selector drift.

No product code was changed in this audit. Findings were logged as Backlog.md tasks for later implementation (`task-23` through `task-30`).

## Evidence collected

### Static and unit/business checks

| Check | Result | Evidence |
|---|---:|---|
| `npm run type-check` | Pass | `artifacts/.../type-check.log` |
| `npm run lint` | Pass, 0 errors / 1 known warning | `artifacts/.../lint.log` |
| `npm run check:eslint-rules` | Pass | `artifacts/.../check-eslint-rules.log` |
| `npm run check:max-lines` | Pass | `artifacts/.../check-max-lines.log` |
| `npm run check:next-params` | Pass | `artifacts/.../check-next-params.log` |
| `npm run check:locale-percent` | Pass | `artifacts/.../check-locale-percent.log` |
| `npm run check:docs` | Pass against baseline: 101 broken citations | `artifacts/.../check-docs.log` |
| Targeted business/API normalizer unit suite | Pass: 123 files, 1937 tests | `artifacts/.../unit-business.log` |

### Live backend/API readiness

- Backend health: `/v1/health` returned healthy; database/redis/queue `up`.
- Owner auth setup succeeded in Playwright and API probes.
- Manager auth setup succeeded in Playwright and manual persona check.
- Cabinet context present: `f75836f7-c0bc-4b2c-823c-a1f3508cce8e`.
- API probes saved in `artifacts/.../api-probes.json`.

### Browser/E2E coverage

- Targeted E2E: `e2e-targeted-live.log`
  - 92 passed, 29 failed, 13 skipped.
  - Setup/auth tests passed for Owner, Manager, login, register.
  - Passing coverage included dashboard login flow, funnel, analytics smoke, settings pages, SKU, storage, unit economics.
  - Failures were concentrated in `/settings/backfill` E2E strict selectors caused by nested `main`, plus one advertising selector drift.
- Route sweep: `route-sweep.json` and `route-sweep.md`
  - 26 authenticated routes plus unauth redirect smoke.
  - Unauthenticated `/dashboard` correctly redirects to `/login?redirect=%2Fdashboard`.
  - No `NaN`, `undefined`, `Infinity`, `Invalid Date`, or `[object Object]` text anomalies were found in visible route text.
- Persona check: `backfill-persona-check.log`
  - Owner can access `/settings/backfill` and sees table/status data.
  - Manager is redirected to dashboard; direct backfill API returns 403 before redirect completes.

## Business data/backend correctness observations

Checked high-risk surfaces against browser/API evidence:

1. Dashboard — core API calls mostly 200, but `/v1/imports/historical?limit=5` returns 404 and logs an error.
2. Funnel — table data endpoint works at `limit=500`, but export hook requests `limit=10000` and receives backend 400.
3. Advertising — main API calls return 200; summary labels are visible manually (`Всего продаж`, `Общий ROAS`). E2E failure is selector drift from multiple visible tables.
4. SKU/storage/unit-economics — route smoke and targeted E2E passed; direct bare API probes without required params returned expected validation errors and are not classified as product bugs.
5. Backfill/settings — Owner and Manager role behavior is correct functionally, but DOM landmarks are invalid/nested.

## Findings logged

| ID | Severity | Type | Summary | Evidence | Backlog |
|---|---|---|---|---|---|
| F-01 | High | Frontend/backend contract | Funnel export fetch uses `limit=10000`, backend max is 500, causing 400 on `/analytics/funnel`. | `route-sweep.json`, `api-probes.json`, `src/app/(dashboard)/analytics/funnel/components/useFunnelExportData.ts` | `task-23` |
| F-02 | High | Backend contract / dashboard | Dashboard processing-status hook calls `/v1/imports/historical?limit=5`, backend returns 404. | `console-detail.log`, `api-probes.json` | `task-24` |
| F-03 | Medium | A11y/UX | Authenticated shell renders navbar `Dashboard` as H1, so every dashboard route has two H1 headings. | `route-sweep.md`, `src/components/custom/Navbar.tsx` | `task-25` |
| F-04 | Medium | A11y/DOM semantics | Settings pages render nested `<main>` inside dashboard layout `<main>`; backfill E2E fails with strict-mode `locator('main')` violations. | `route-sweep.md`, `e2e-targeted-live.log`, `src/app/(dashboard)/settings/*` | `task-26` |
| F-05 | High | React stability | `/dashboard` and `/analytics/storage` emit repeated duplicate-key warnings; dashboard also logs React static-flag internal error. | `console-detail.log`, `route-sweep.json` | `task-27` |
| F-06 | Low | Data quality / observability | `/cogs/price-calculator` floods console with repeated `[StorageTariffs] baseLiterRub=0, applying fallback` warnings (~200 during route sweep). | `route-sweep.json`, `src/lib/tariff-extraction-utils.ts` | `task-28` |
| F-07 | Low | Test reliability | Advertising Epic 36 E2E uses unscoped `page.locator('table')`; page now has two visible tables. Manual browser check confirms summary cards exist. | `e2e-advertising-single.log`, manual Playwright check | `task-29` |
| F-08 | Medium | Chart responsiveness / console hygiene | Recharts emits width/height `-1` warnings on `/analytics/advertising`, `/analytics/buyout`, `/analytics/returns`, and `/analytics/unit-economics`. | `route-sweep.json`, `route-sweep.md` | `task-30` |

## Coverage gaps / notes

- `orders-client-info` E2E tests were skipped in the targeted run; manager credentials exist, but the spec has its own skip conditions. Privacy/PII coverage should be revisited when implementing related tasks.
- Full repo-wide Playwright was not run; the targeted set was chosen for critical UI/business/backend surfaces per the approved plan.
- Initial attempt to store audit logs under `test-results/qa-audit/` was invalid because Playwright cleans `test-results/` at run start. Final artifacts were moved to `docs/qa/artifacts/ui-data-backend-validation/`.
- Direct API probes without required query params intentionally returned 400 for some endpoints (`sku-financials`, `unit-economics`, products with unsupported `offset`). These are not listed as product defects unless the frontend emits the same invalid requests.

## Artifact index

- `check-summary.csv` — command summary.
- `type-check.log`, `lint.log`, `check-*.log`, `unit-business.log` — static/unit evidence.
- `e2e-targeted-live.log` — targeted Playwright run.
- `e2e-advertising-single.log` — advertising test rerun evidence.
- `route-sweep.json`, `route-sweep.md`, `route-*.png` — browser route sweep and screenshots.
- `api-probes.json`, `api-probes.log` — backend/API probes.
- `console-detail.log` — exact console evidence for dashboard/storage warnings.
- `backfill-persona-check.log` — Owner/Manager backfill behavior.

## Conclusion

The application is broadly operational in the tested local environment: auth works, backend is healthy, most critical pages render, and business normalizer tests pass. The audit found 8 actionable bugs/improvements and created Backlog tasks `task-23` through `task-30` for follow-up implementation.
