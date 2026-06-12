# UI/UX + Business Data + Backend Correctness Validation Plan

Date: 2026-06-12
Mode: Autopilot QA audit
Primary goal: validate correctness and absence of obvious bugs in UI/UX, business data presentation, and frontend handling of backend data. Document/log findings for later implementation; do not fix product code in this audit unless required to unblock validation tooling.

## Scope

### In scope
- Authenticated application shell and critical dashboard/analytics/settings flows.
- Representative business-data pages where backend values are transformed and displayed.
- Frontend/backend contract checks: endpoint availability, response shape, normalizer behavior, missing/invalid data states, and UI/API value consistency where feasible.
- Automated checks: lint/typecheck/docs/static guard scripts, targeted Vitest suites, targeted Playwright suites.
- Manual/browser checks: route smoke, console/network errors, layout/empty/error/loading states, visible data sanity.
- Logging: one audit report and actionable backlog tasks for confirmed bugs/problems/improvements.

### Out of scope
- Fixing product bugs in this pass.
- Destructive backend mutations except already-existing safe read-only or test-environment flows.
- Production/external-user data validation.
- Exhaustive verification of every route when representative coverage already finds enough actionable issues; coverage gaps are logged.

## Environment assumptions discovered
- Frontend dev server: `npm run dev` on `http://localhost:3100`.
- Backend: `http://localhost:3000`, `/v1/health` healthy.
- E2E credentials exist in `.env.e2e`; Owner login succeeds against backend.
- Backend `/v1/auth/me`, `/v1/dashboard/summary`, `/v1/analytics/summary`, `/v1/analytics/orders` returned 404 in initial probes; this may be expected if frontend uses different endpoint paths and must be verified against actual API client usage.

## Persona / role coverage

| Persona | Credential source | Required checks | Notes |
|---|---|---|---|
| Owner | `E2E_TEST_EMAIL` / `E2E_TEST_PASSWORD` | Main audit persona; dashboard, analytics, COGS, orders, supplies, shipments, settings | Owner login already succeeds against local backend. |
| Manager / non-Owner | `E2E_MANAGER_EMAIL` / `E2E_MANAGER_PASSWORD` when valid | Permission-sensitive smoke: orders client-info visibility, settings/backfill access/redirect behavior | If manager credentials fail or are absent, log as coverage gap rather than silently passing. |
| Unauthenticated | no storage state | Login/register and protected-route redirect sanity | Should not access dashboard data. |

Owner-gated surfaces must be explicitly checked or logged as coverage gaps:
- Orders client-info/customer data visibility.
- `/settings/backfill` owner-only admin access.
- Any API calls exposing PII or owner-only data.

## Validation matrix

| Area | Evidence to collect | Pass criteria | Finding criteria |
|---|---|---|---|
| Static quality | `type-check`, lint, docs/static scripts | Commands pass or known baseline is documented | New errors, unexpected warnings above baseline, broken max-line/params/docs rules |
| Unit/business transforms | API normalizer and business-metric Vitest suites | Tests pass; no obvious missing normalizer coverage | Failing tests, missing coverage on high-risk endpoint normalizers |
| Auth/session/personas | Login via UI/API and dashboard shell for Owner; Manager/non-Owner if credentials work; unauth redirect | Login succeeds for configured personas; no auth loop; cabinet context present; gated routes enforce role | Redirect loop, missing cabinet, token/cookie mismatch, role-gated data leak |
| Route/UI smoke | Browser route sweep of critical pages | Page renders main content; no console errors; no 5xx/4xx API errors unless intentionally handled | Blank pages, hydration/console errors, broken loading/error states |
| Business data sanity | Compare selected UI values with backend/API data or normalized response | UI values match source/normalizer semantics; no impossible signs/percent/NaN | NaN/undefined, impossible percentages, mismatch with API, stale/missing fields |
| Backend data correctness | API probes for endpoints used by selected routes | Endpoints exist and response shapes match frontend expectations | 404/500, response field drift, nullability mismatch, unhandled backend errors |
| UX/a11y basics | Navigation, headings, buttons, table readability, empty/error states | Clear labels, stable layout, visible feedback | Missing H1, duplicate labels, clipped content, confusing/incorrect copy |

## Critical route sample

Initial route set for manual/browser audit:
- `/dashboard`
- `/analytics/dashboard`
- `/analytics/orders`
- `/analytics/funnel`
- `/analytics/advertising`
- `/analytics/buyout`
- `/analytics/returns`
- `/analytics/search`
- `/analytics/sku`
- `/analytics/storage`
- `/analytics/unit-economics`
- `/analytics/supply-planning`
- `/cogs`, `/cogs/price-calculator`, `/cogs/bulk`
- `/orders/list`, `/orders/integrity`
- `/supplies`, `/shipments`
- `/settings`, `/settings/notifications`, `/settings/backfill`, `/settings/cabinet`, `/settings/expenses`, `/settings/tax`, `/settings/tariffs`

## Deliverables
- `docs/qa/ui-data-backend-validation-report.md` with evidence, coverage, findings, and screenshots/log references.
- Backlog.md tasks for confirmed actionable bugs/improvements.
- Optional machine-readable route/API probe artifacts under `test-results/qa-audit/` if useful.

## Exit criteria / stop condition
Stop only after all measurable criteria below are satisfied or explicitly marked as blocked/coverage-gap in the report:

1. Static gates: run and record `type-check`, lint/static scripts selected for this audit, and targeted business-normalizer/unit suites.
2. Backend readiness: record `/v1/health`, Owner login result, cabinet context, and endpoint probes for API paths observed during browser route audit.
3. Persona coverage:
   - Owner route smoke completed for every route in the critical sample, or each skipped route has a reason.
   - Manager/non-Owner permission smoke completed for orders client-info and `/settings/backfill`, or manager credential failure is logged as a coverage gap.
   - Unauthenticated protected-route redirect smoke completed for at least one dashboard route.
4. UI route coverage: every critical sample route has pass/fail/coverage-gap status, console-error count, failed API request summary, and at least one human-readable observation.
5. Business data coverage: at least five high-risk business data surfaces are checked against API/normalizer evidence or logged as coverage gaps. Required initial set: dashboard, orders, funnel, advertising, SKU/storage/unit-economics depending on backend availability.
6. Findings: every confirmed bug/problem/improvement has severity, evidence, affected route/API/file, and a Backlog.md task or explicit report entry for later implementation.
7. Audit artifacts: `docs/qa/ui-data-backend-validation-report.md` exists and links any generated route/API probe artifacts.
8. Review gates: audit artifacts receive code-review `APPROVE` and architecture `CLEAR`; UltraQA pass or documented reason for additional iteration.
