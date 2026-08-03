# Frontend Epics & Stories Tracker

> **Source of Truth** for all frontend epic statuses and story tracking.
> Referenced from `CLAUDE.md` -- do not duplicate this information elsewhere.
> Detailed story artifacts: `_bmad-output/implementation-artifacts/`

<!-- CURRENT-STATUS:START -->
**Last Updated**: 2026-08-03
**Total Epics**: 89 unique (89 done, 0 in-progress) + 5 untracked operational features
**Total Stories**: 375+ (sprint-status mixes story rows and epic-level entries across Epics 71-156; Epics 157-161 are tracked at epic level, plus legacy Epics 1-70)
**Development Mode**: new product; frontend and backend are developed and tested locally
**Runtime Contract**: Node.js 24.18.0/npm 11.11.0; frontend `localhost:3100`; backend `localhost:3000`
**Current Validation**: ordinary Vitest, Playwright, coverage measurement, privacy check, lint, type-check, format, and local build smoke
<!-- CURRENT-STATUS:END -->
**Pre-flight Verification**: Epics 51, 52, 53, 66 verified as already implemented (2026-06-06)
**Epic-only convention**: `epic-only` rows are intentional epic-level status records with no corresponding `N.x` story or retrospective rows in `sprint-status.yaml`; they are excluded from story and retrospective counts and are complete when their epic-level entry is `done`. `deferred` story rows are documented parked work due external dependency/scope split and are not active work.

---

## Status Legend

| Status      | Meaning                                                                                                  |
| ----------- | -------------------------------------------------------------------------------------------------------- |
| DONE        | Complete; all tracked non-deferred stories shipped, or epic-level item complete when no story rows exist |
| DEFERRED    | Parked due external dependency/scope split; documented and not active work                               |
| IN-PROGRESS | Actively being worked on                                                                                 |
| READY       | Ready for development                                                                                    |
| BACKLOG     | Not yet started                                                                                          |

---

## Epic Overview

### Foundation & Core (Epics 1-7)

| Epic | Title                             | Stories | Status | Key Routes                             |
| ---- | --------------------------------- | ------- | ------ | -------------------------------------- |
| 1-FE | Foundation & Authentication       | 5       | DONE   | `/login`, `/register`                  |
| 2-FE | Onboarding & Initial Data Setup   | 4       | DONE   | `/cabinet`, `/wb-token`, `/processing` |
| 3-FE | Dashboard & Financial Overview    | 6       | DONE   | `/dashboard`                           |
| 4-FE | COGS Management & Margin Analysis | 10      | DONE   | `/cogs`, `/cogs/bulk`                  |
| 5-FE | COGS History Management           | 3       | DONE   | `/cogs/history`                        |
| 6-FE | Advanced Analytics & Reporting    | 5       | DONE   | `/analytics/*`                         |
| 7-FE | Liquidity Analysis                | --      | DONE   | `/analytics/liquidity`                 |

### Feature Epics (Epics 24-69)

| Epic  | Title                            | Stories | Status | Key Routes                                |
| ----- | -------------------------------- | ------- | ------ | ----------------------------------------- |
| 24-FE | Paid Storage Analytics UI        | 11      | DONE   | `/analytics/storage`                      |
| 33-FE | Advertising Analytics UI         | 8       | DONE   | `/analytics/advertising`                  |
| 34-FE | Telegram Notifications UI        | 6       | DONE   | `/settings/notifications`                 |
| 36-FE | Product Card Linking UI          | 5       | DONE   | (modal)                                   |
| 37-FE | Merged Group Table Display       | 5       | DONE   | (advertising page)                        |
| 40-FE | Orders UI & WB Status History    | 7       | DONE   | `/orders`, `/orders/list`                 |
| 42-FE | Task Handlers Adaptation         | 4       | DONE   | (internal)                                |
| 44-FE | Price Calculator UI              | 6       | DONE   | `/cogs/price-calculator`                  |
| 51-FE | FBS Historical Analytics (365d)  | 12      | DONE   | `/analytics/orders`, `/settings/backfill` |
| 52-FE | Tariff Settings Admin UI         | 7       | DONE   | `/settings/tariffs`                       |
| 53-FE | Supply Management UI             | 8       | DONE   | `/supplies`, `/supplies/:id`              |
| 61-FE | Dashboard Data Integration (API) | 17      | DONE   | `/dashboard`                              |
| 62-FE | Dashboard UI/UX Presentation     | 10      | DONE   | `/dashboard`                              |
| 63-FE | Dashboard Business Logic         | 12      | DONE   | `/dashboard`                              |
| 66-FE | Tax & VAT Accounting             | 7       | DONE   | `/settings/tax`, `/dashboard`             |
| 68-FE | Funnel Analytics                 | --      | DONE   | `/analytics/funnel`                       |
| 69-FE | Buyout Rate Analytics            | 7       | DONE   | `/analytics/buyout`                       |
| 70-FE | Frontend Validation Fixes        | 6       | DONE   | (bug fixes)                               |

### Search & Marketing (Epics 71-74)

| Epic  | Title                                 | Stories | Status | Key Routes                   |
| ----- | ------------------------------------- | ------- | ------ | ---------------------------- |
| 71-FE | Search Analytics & Jam Gating         | 8       | DONE   | `/analytics/search`          |
| 72-FE | Marketing Analytics Data Alignment    | 6       | DONE   | (data fixes)                 |
| 73-FE | Marketing Analytics Enhancements      | 9       | DONE   | `/analytics/cross-reference` |
| 74-FE | File Size Compliance & Code Splitting | 9       | DONE   | (structural)                 |

### Shipment & Reference Data (Epics 75-77)

| Epic  | Title                                                 | Stories | Status | Key Routes                                         |
| ----- | ----------------------------------------------------- | ------- | ------ | -------------------------------------------------- |
| 75-FE | Reference Data Management (Box Types & SKU Packaging) | 4       | DONE   | `/shipments/box-types`, `/shipments/sku-packaging` |
| 76-FE | Shipment Planning & Cost Calculation                  | 6       | DONE   | `/shipments`, `/shipments/:id`                     |
| 77-FE | Shipment Cost Dashboard Integration                   | 6       | DONE   | (unit economics, FCU column)                       |

### Stability & Bugfix (Epics 84-87)

| Epic  | Title                                 | Stories | Status | Key Routes                         |
| ----- | ------------------------------------- | ------- | ------ | ---------------------------------- |
| 84-FE | Cabinet Health & API Stability        | 4       | DONE   | (seller info, token health)        |
| 85-FE | Analytics Accuracy                    | 2       | DONE   | (trends, FCU fixes)                |
| 86-FE | Advertising & Orders New Features     | 2       | DONE   | `/analytics/advertising/campaigns` |
| 87-FE | Frontend Stability & Data Correctness | 3       | DONE   | (dashboard, daily breakdown)       |

### Tech Debt & Process (Epics 88-89)

| Epic  | Title                                 | Stories | Status | Key Routes                          |
| ----- | ------------------------------------- | ------- | ------ | ----------------------------------- |
| 88-FE | Tech Debt Cleanup & Process Hardening | 5       | DONE   | (normalizers, e2e, docs)            |
| 89-FE | Tech Debt Follow-ups (Epic 88)        | 5       | DONE   | (doc validator, defensive patterns) |

### Acquiring & Monitor (Epics 90-93)

| Epic  | Title                                      | Stories | Status | Key Routes                                            |
| ----- | ------------------------------------------ | ------- | ------ | ----------------------------------------------------- |
| 90-FE | Acquiring Cost Reports UI                  | 5       | DONE   | `/analytics/acquiring`, `/analytics/acquiring/period` |
| 91-FE | Backend Contract Updates (Epics 89-93)     | 3       | DONE   | (breaking change: totalRevenue removal)               |
| 92-FE | Monitor Dashboard                          | 6       | DONE   | `/monitor`                                            |
| 93-FE | Operational Cleanup & Pattern Codification | 5       | DONE   | (constants, thresholds, patterns)                     |

### Quality & Process Hardening (Epics 94-97)

| Epic  | Title                                       | Stories | Status | Key Routes                                                                            |
| ----- | ------------------------------------------- | ------- | ------ | ------------------------------------------------------------------------------------- |
| 94-FE | Process Hardening & Quality-Gate Automation | 7       | DONE   | (baselines, 2-pass review)                                                            |
| 95-FE | Backend-Closed Tickets Cleanup              | 3       | DONE   | (stale markers removal)                                                               |
| 96-FE | Backend Epics 101-109 Frontend Integration  | 17      | DONE   | `/analytics/fbs-stock`, `/analytics/fbs-enhanced`, `/analytics/buyout-reconciliation` |
| 97-FE | Process Hardening & Pattern-Codification    | 7       | DONE   | (fix-block, citation, cabinet-isolation)                                              |

### ESLint & Dead Code (Epics 98-100)

| Epic   | Title                                        | Stories | Status | Key Routes                   |
| ------ | -------------------------------------------- | ------- | ------ | ---------------------------- |
| 98-FE  | ESLint Cap Tightening & Enforcement          | 1       | DONE   | (400-line cap)               |
| 99-FE  | ESLint Cap Tightening Phase 2 & HALT Scripts | 2       | DONE   | (200-line cap, HALT scripts) |
| 100-FE | Dead Code & Deprecation Sweep                | 3       | DONE   | (deprecated removals)        |

### Documentation & Cleanup (Epics 101-102)

| Epic   | Title                             | Stories | Status | Key Routes                                 |
| ------ | --------------------------------- | ------- | ------ | ------------------------------------------ |
| 101-FE | Documentation & Backlog Cleanup   | 3       | DONE   | (archive, tracker rewrite, backlog triage) |
| 102-FE | Expense Chart Redesign Completion | 2       | DONE   | `/analytics/funnel` (expense chart)        |

### AI/ML Integration (Epics 103, 108-112)

| Epic   | Title                                     | Stories | Status | Key Routes                                    |
| ------ | ----------------------------------------- | ------- | ------ | --------------------------------------------- |
| 103-FE | AI Sales Forecast Integration             | 4       | DONE   | `/analytics/forecast`                         |
| 108-FE | AI Foundation + Readiness States          | 6       | DONE   | `/analytics/forecast` (16 endpoints)          |
| 109-FE | AI Forecast Enrichment + Model Management | 6       | DONE   | `/analytics/models`, `/analytics/models/[id]` |
| 110-FE | AI Evaluations + Feedback + CSV Export    | 5       | DONE   | `/analytics/models/[id]/evaluations`          |
| 111-FE | Epic 110 Carry-Forward (Scope-Cut)        | 1       | DONE   | (AP#10 rule, lessons-length validator)        |
| 112-FE | AI Admin Features + Epic 110 Carry-Overs  | 5       | DONE   | `/analytics/ai-admin/*`                       |

### Backend Coordination & Automation (Epics 104-107)

| Epic   | Title                                               | Stories | Status | Key Routes                                  |
| ------ | --------------------------------------------------- | ------- | ------ | ------------------------------------------- |
| 104-FE | Backend Coordination — Daily Breakdown + FCU        | 4       | DONE   | (daily finance/advertising, unit economics) |
| 105-FE | Process-Tooling — Anti-Pattern #8 Lint + Pre-Flight | 3       | DONE   | (ESLint rule, dev-story workflow)           |
| 106-FE | Triage Anti-Pattern #8 Allowlists                   | 4       | DONE   | (net_profit fix, pattern docs)              |
| 107-FE | Process Cleanup Bundle — Carry-Forward Small Wins   | 4       | DONE   | (nullPreservingSum, vitest wrapper)         |

### Discipline Codification (Epics 113-116, 118)

| Epic   | Title                                                        | Stories | Status | Key Routes                              |
| ------ | ------------------------------------------------------------ | ------- | ------ | --------------------------------------- |
| 113-FE | Multi-pass Triggers Codification                             | 2       | DONE   | (Trigger 4 meta-claim escalation)       |
| 114-FE | Multi-pass Discipline Refinement                             | 1       | DONE   | (Trigger 4 MANDATORY promotion)         |
| 115-FE | User-Invoked 4th-Pass Codification                           | 1       | DONE   | (4th-pass record, deferral disposition) |
| 116-FE | Discipline Codification Refinements                          | 1       | DONE   | (blanket qualifier, default 4-pass)     |
| 118-FE | Codification Discipline Refinements (Epic 116 Carry-Forward) | 1       | DONE   | (YAML drift, dual-attestation)          |

### Marketing Analytics (Epics 71-74, 117-120)

| Epic   | Title                                       | Stories | Status | Key Routes                                |
| ------ | ------------------------------------------- | ------- | ------ | ----------------------------------------- |
| 71-FE  | Search Analytics & Jam Gating               | 8       | DONE   | `/analytics/search`                       |
| 72-FE  | Marketing Analytics Data Alignment          | 6       | DONE   | (data fixes)                              |
| 73-FE  | Marketing Analytics Enhancements            | 9       | DONE   | `/analytics/cross-reference`              |
| 74-FE  | File Size Compliance & Code Splitting       | 9       | DONE   | (structural)                              |
| 117-FE | Search Analytics Enhancements (Gap Closure) | 4       | DONE   | `/analytics/search`                       |
| 119-FE | Funnel Search Attribution + Marketing §3.4  | 4       | DONE   | `/analytics/funnel`, `/analytics/search`  |
| 120-FE | Marketing Analytics Expansion               | 7       | DONE   | `/analytics/product/[nmId]`, hub redesign |

### Alerts & Pricing (Epic 121)

| Epic   | Title                               | Stories | Status | Key Routes                                                      |
| ------ | ----------------------------------- | ------- | ------ | --------------------------------------------------------------- |
| 121-FE | Alerts, Pricing & Reorder Dashboard | 3+1     | DONE   | `/analytics/alerts`, `/analytics/pricing`, `/analytics/reorder` |

### Quality & Maintenance (Epics 122-128)

| Epic   | Title                                       | Stories             | Status | Key Routes                             |
| ------ | ------------------------------------------- | ------------------- | ------ | -------------------------------------- |
| 122-FE | Funnel Search Attribution + E2E             | 3                   | DONE   | `/analytics/funnel`                    |
| 123-FE | AI Domain Frontend Integration              | 6                   | DONE   | `/analytics/forecast`, AI admin routes |
| 124-FE | Test Coverage Completion (2,737 TODO Stubs) | 1                   | DONE   | (test infrastructure)                  |
| 125-FE | Zero-Test Route Coverage                    | 11                  | DONE   | (baseline tests for 11 routes)         |
| 126-FE | Stale Markers + E2E + Edge-Case Tests       | 3                   | DONE   | (cleanup, forecast-accuracy E2E)       |
| 127-FE | Comparison Periods + Cross-Links            | 4 done + 2 deferred | DONE   | buyout, returns, advertising           |
| 128-FE | TypeScript Cleanup + Source Compliance      | 3                   | DONE   | (quality gate hardening)               |

### Code Quality & Refactoring (Epics 132, 152, epic-level only)

| Epic   | Title                                           | Stories   | Status | Key Routes                                             |
| ------ | ----------------------------------------------- | --------- | ------ | ------------------------------------------------------ |
| 132-FE | Validation Queue Flush + Code Quality Sweep     | epic-only | DONE   | (CSV defang, dashboard grid, storage DRY, stale stubs) |
| 152-FE | Proactive Code Splitting + API Normalizer Tests | epic-only | DONE   | (13 files split, 2 normalizer test files)              |

### Contract Reconciliation (Epic 129)

| Epic   | Title                                | Stories | Status | Key Routes                |
| ------ | ------------------------------------ | ------- | ------ | ------------------------- |
| 129-FE | FBS Enhanced Contract Reconciliation | 4       | DONE   | `/analytics/fbs-enhanced` |

### Operational Features (Untracked)

| Epic     | Title                             | Stories | Status | Key Routes           |
| -------- | --------------------------------- | ------- | ------ | -------------------- |
| (commit) | Expenses CRUD Page                | 1       | DONE   | `/settings/expenses` |
| (commit) | Alerts Enhancements               | 1       | DONE   | `/analytics/alerts`  |
| (commit) | Seller Rating on Cabinet          | 1       | DONE   | `/settings/cabinet`  |
| (commit) | Financial Gaps Remediation        | 1       | DONE   | `/analytics/gaps`    |
| (commit) | Orders Integrity & Reconciliation | 1       | DONE   | `/orders/integrity`  |

### Feature Enhancements (Epics 153-156)

| Epic   | Title                                        | Stories | Status | Key Routes                                       |
| ------ | -------------------------------------------- | ------- | ------ | ------------------------------------------------ |
| 153-FE | CSV Export for Analytics Tables              | 5       | DONE   | funnel, search, buyout, returns, cross-reference |
| 154-FE | Dark Mode / Theme Switching                  | 3       | DONE   | global                                           |
| 155-FE | CSV Gaps + Advertising Export + Funnel Split | 3       | DONE   | search/orders, advertising, funnel               |
| 156-FE | Preventative Code Splits (180-183 line zone) | 3       | DONE   | 15 files across types/lib/components             |

### Feature Enhancements (Epics 157-158, epic-level only)

| Epic   | Title                                   | Stories   | Status | Key Routes            |
| ------ | --------------------------------------- | --------- | ------ | --------------------- |
| 157-FE | Dark Mode Color Migration (Auth/Layout) | epic-only | DONE   | auth, sidebar, layout |
| 158-FE | Preventative Code Splits (180 zone)     | epic-only | DONE   | 28 files split        |

### Feature Enhancements (Epics 159-161, epic-level only)

| Epic   | Title                                      | Stories   | Status | Key Routes                           |
| ------ | ------------------------------------------ | --------- | ------ | ------------------------------------ |
| 159-FE | Funnel WoW/MoM Comparison Period           | epic-only | DONE   | `/analytics/funnel`                  |
| 160-FE | Dark Mode Migration: Dashboard + Analytics | epic-only | DONE   | dashboard, analytics hub, monitoring |
| 161-FE | Dark Mode Migration: Products/COGS/Supply  | epic-only | DONE   | cogs, supplies, orders, shipments    |

---

## Route Structure

Source: `src/lib/routes.ts` plus the 2026-07-25 `src/app/**/page.tsx` inventory. This table maps epic ownership; it is not live-rendering evidence.

### Public

| Route       | Purpose      | Epic |
| ----------- | ------------ | ---- |
| `/`         | Home         | 1-FE |
| `/login`    | Login        | 1-FE |
| `/register` | Registration | 1-FE |

### Onboarding

| Route         | Purpose                 | Epic |
| ------------- | ----------------------- | ---- |
| `/cabinet`    | Cabinet creation        | 2-FE |
| `/wb-token`   | WB API token            | 2-FE |
| `/processing` | Initial data processing | 2-FE |

### Dashboard & COGS

| Route                    | Purpose                | Epic           |
| ------------------------ | ---------------------- | -------------- |
| `/dashboard`             | Main dashboard         | 3-FE, 61-63-FE |
| `/cogs/single`           | Single COGS assignment | 4-FE           |
| `/cogs/bulk`             | Bulk COGS assignment   | 4-FE           |
| `/cogs/price-calculator` | Price calculator       | 44-FE          |

### Analytics

| Route                                | Purpose                                | Epic        |
| ------------------------------------ | -------------------------------------- | ----------- |
| `/analytics/dashboard`               | Cabinet summary                        | 6-FE        |
| `/analytics/sku`                     | Margin by SKU                          | 6-FE        |
| `/analytics/brand`                   | Margin by brand                        | 6-FE        |
| `/analytics/category`                | Margin by category                     | 6-FE        |
| `/analytics/time-period`             | Time-period comparison                 | 6-FE        |
| `/analytics/finance-history`         | Financial history                      | 6-FE        |
| `/analytics/storage`                 | Storage analytics                      | 24-FE       |
| `/analytics/supply-planning`         | Stockout prediction                    | 6-FE        |
| `/analytics/unit-economics`          | Unit economics                         | 6-FE, 77-FE |
| `/analytics/liquidity`               | Liquidity analysis                     | 7-FE        |
| `/analytics/advertising`             | Advertising ROAS                       | 33-FE       |
| `/analytics/advertising/campaigns`   | Campaign detail / bid recs             | 86-FE       |
| `/analytics/orders`                  | FBS Historical Analytics               | 51-FE       |
| `/analytics/funnel`                  | Marketing funnel                       | 68-FE       |
| `/analytics/buyout`                  | Buyout rate                            | 69-FE       |
| `/analytics/returns`                 | Return analytics                       | 70-FE       |
| `/analytics/search`                  | Search analytics                       | 71-FE       |
| `/analytics/cross-reference`         | Search + ad cross-reference            | 73-FE       |
| `/analytics/acquiring`               | Acquiring cost reports                 | 90-FE       |
| `/analytics/acquiring/period`        | Period detail                          | 90-FE       |
| `/analytics/fbs-stock`               | FBS stock breakdowns                   | 96-FE       |
| `/analytics/fbs-enhanced`            | FBS enhanced analytics                 | 96-FE       |
| `/analytics/buyout-reconciliation`   | Buyout reconciliation audit            | 96-FE       |
| `/analytics/product/[nmId]`          | Unified product analytics              | 120-FE      |
| `/analytics/alerts`                  | Alert rules & notification history     | 121-FE      |
| `/analytics/pricing`                 | Price recommendations                  | 121-FE      |
| `/analytics/reorder`                 | Warehouse reorder dashboard            | 121-FE      |
| `/analytics/gaps`                    | Financial gaps detection & remediation | (commit)    |
| `/analytics/forecast`                | AI Sales Forecast                      | 103-FE      |
| `/analytics/models`                  | AI Model Management                    | 109-FE      |
| `/analytics/models/[id]`             | AI Model Detail                        | 109-FE      |
| `/analytics/models/[id]/evaluations` | AI Model Evaluations                   | 110-FE      |
| `/analytics/models/[id]/performance` | AI Model Performance                   | 109-FE      |
| `/analytics/models/sku-accuracy`     | AI SKU Accuracy                        | 110-FE      |
| `/analytics/ai-admin/anomalies`      | AI Anomaly Resolution                  | 112-FE      |
| `/analytics/ai-admin/models`         | AI Model Admin                         | 112-FE      |
| `/analytics/ai-admin/preferences`    | AI Preferences                         | 112-FE      |

### Orders & Shipments

| Route                      | Purpose                         | Epic     |
| -------------------------- | ------------------------------- | -------- |
| `/orders/list`             | FBS orders list                 | 40-FE    |
| `/orders/fbo`              | FBO orders & sales              | (commit) |
| `/orders/integrity`        | Data integrity & reconciliation | (commit) |
| `/supplies`                | Supply list                     | 53-FE    |
| `/supplies/:id`            | Supply detail                   | 53-FE    |
| `/shipments`               | Shipment list                   | 76-FE    |
| `/shipments/:id`           | Shipment detail                 | 76-FE    |
| `/shipments/box-types`     | Box types CRUD                  | 75-FE    |
| `/shipments/sku-packaging` | SKU packaging                   | 75-FE    |

### AI & Settings

| Route                           | Purpose                | Epic   |
| ------------------------------- | ---------------------- | ------ |
| `/analytics/forecast`           | AI Sales Forecast      | 103-FE |
| `/analytics/models`             | AI Model Management    | 109-FE |
| `/analytics/ai-admin/anomalies` | AI Anomaly Resolution  | 112-FE |
| `/settings/tax`                 | Tax & VAT Settings     | 66-FE  |
| `/settings/tariffs`             | Tariff Settings Admin  | 52-FE  |
| `/settings/backfill`            | Backfill Admin (Owner) | 51-FE  |

### Monitoring

| Route         | Purpose                | Epic  |
| ------------- | ---------------------- | ----- |
| `/monitoring` | Ops health dashboard   | 68-FE |
| `/monitor`    | Business KPI dashboard | 92-FE |

### Settings

| Route                     | Purpose                         | Epic     |
| ------------------------- | ------------------------------- | -------- |
| `/settings/cabinet`       | Seller info + Jam status        | 84-FE    |
| `/settings/notifications` | Telegram settings               | 34-FE    |
| `/settings/tariffs`       | Tariff admin (Admin only)       | 52-FE    |
| `/settings/backfill`      | Backfill admin (Owner only)     | 51-FE    |
| `/settings/tax`           | Tax & VAT settings              | 66-FE    |
| `/settings/expenses`      | Operational Expenses Management | (commit) |

---

## Sprint History

Chronological log, newest first. Sprint-status source: `_bmad-output/implementation-artifacts/sprint-status.yaml`.

| Date        | Epic         | Summary                                                                                                                                       | Stories             |
| ----------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| 2026-06-09  | 152-FE       | Proactive code splitting: 13 files split, 2 API normalizer test files added                                                                   | epic-only           |
| 2026-06-09  | 132-FE       | Validation queue flush: CSV defang, dashboard grid fix, storage DRY, stale stubs cleanup                                                      | epic-only           |
| 2026-06-07  | 129-FE       | FBS Enhanced contract reconciliation: types + normalizer + 7 components rewritten for real backend (Request #202)                             | 4                   |
| 2026-06-07  | 128-FE       | TypeScript cleanup: 64 TS errors → 0, 15 files >200 lines → 0, 56 tests for 4 dirs                                                            | 3                   |
| 6/7 (cont.) | 127-FE       | Comparison periods on 3 pages + buyout↔returns cross-links                                                                                    | 4 done + 2 deferred |
| 6/7 (cont.) | 126-FE       | Stale markers removed, forecast-accuracy E2E, edge-case tests                                                                                 | 3                   |
| 6/7 (cont.) | 125-FE       | Baseline tests for 11 routes with zero coverage                                                                                               | 11                  |
| 6/7 (cont.) | 124-FE       | Flush 2,737 TODO stubs → 0 (largest single-session test delta, +3,663 tests)                                                                  | 1                   |
| 6/7 (cont.) | 123-FE       | AI domain integration: 6 stories, 7 backend requests resolved                                                                                 | 6                   |
| 2026-06-06  | 122-FE       | Funnel search attribution + price history + E2E                                                                                               | 3                   |
| 2026-06-05  | 121-FE       | Alerts, pricing recommendations, reorder dashboard                                                                                            | 3+1                 |
| 2026-06-05  | 120-FE       | Marketing Analytics Expansion: Hub redesign, Product Analytics, organic/paid split, iROAS                                                     | 7                   |
| 2026-06-05  | —            | Tech debt: Request #186 (bulk COGS v2), Request #203 (selling_price), Epic 121 scope                                                          | —                   |
| 2026-06-05  | —            | New domains: alerts, price-recommendations, reorder dashboard (33 files, +2212 lines)                                                         | —                   |
| 2026-05-13  | 101-FE       | Documentation & backlog cleanup                                                                                                               | 1+ (in-progress)    |
| 2026-05-12  | 100-FE       | Dead code & deprecation sweep (21 deprecated items removed)                                                                                   | 3                   |
| 2026-05-12  | 99-FE        | ESLint cap 200-line target + HALT scripts (rule validator, propagation checker)                                                               | 2                   |
| 2026-05-11  | 98-FE        | ESLint cap tightening (400-line target enforcement)                                                                                           | 1                   |
| 2026-05-10  | 97-FE        | Process hardening: fix-block propagation, citation discipline, cabinet-isolation, max-lines typo fix, HALT investigation                      | 7                   |
| 2026-05-06  | 96-FE        | Backend Epics 101-109 integration: tax, unit-economics, delivery, acquiring, FBS stock/enhanced, buyout reconciliation, returns, dead markers | 17                  |
| 2026-05-05  | 95-FE        | Backend-closed tickets cleanup: stale markers, request docs, monitor notice                                                                   | 3                   |
| 2026-05-04  | 94-FE        | Quality-gate automation: baseline tracking, 2-pass review, changelog lessons, doc grep                                                        | 7                   |
| 2026-05-03  | 93-FE        | Operational cleanup: shared constants, daily profit fallback, threshold docs, pattern codification                                            | 5                   |
| 2026-05-02  | 92-FE        | Monitor dashboard: KPI cards, metrics table, weekly chart, buyout pipeline health                                                             | 6                   |
| 2026-05-01  | 91-FE        | Backend contract updates: totalRevenue removal, daily finance fields, pipeline health                                                         | 3                   |
| 2026-04-30  | 90-FE        | Acquiring cost reports: list, detail, period views                                                                                            | 5                   |
| 2026-04-28  | 89-FE        | Tech debt follow-ups: high-risk normalizers, e2e fixes, doc validator, defensive frontend                                                     | 5                   |
| 2026-04-25  | 88-FE        | Tech debt cleanup: source TODOs, null audit, networkidle migration, normalizer pattern                                                        | 5                   |
| 2026-04-24  | 87-FE        | Frontend stability: dashboard profit hierarchy, daily breakdown, data quality                                                                 | 3                   |
| 2026-04-23  | 86-FE        | Bid recommendations UI, client info PII                                                                                                       | 2                   |
| 2026-04-22  | 85-FE        | Analytics accuracy: trends wb_sales_gross, FCU by-SKU re-enable                                                                               | 2                   |
| 2026-04-21  | 84-FE        | Cabinet health: seller info, Jam status, token health banner, batch reconciliation                                                            | 4                   |
| 2026-04-18  | 77-FE        | Shipment dashboard integration: hooks symlink, e2e, FCU column in unit economics                                                              | 6                   |
| 2026-04-17  | 76-FE        | Shipment planning & cost calculation: list, detail, box lines, calculate/confirm                                                              | 6                   |
| 2026-04-16  | 75-FE        | Reference data: box types CRUD, SKU packaging (single + bulk)                                                                                 | 4                   |
| 2026-03-15  | 74-FE        | File size compliance: 131 files split to <=200 lines (9 waves)                                                                                | 9                   |
| 2026-03-14  | 73-FE        | Marketing analytics enhancements: funnel WoW, product filter, cross-reference, 3-layer ad cost                                                | 9                   |
| 2026-03-13  | 72-FE        | Marketing data alignment: funnel/buyout types, advertising daily trend, buyout refactor                                                       | 6                   |
| 2026-03-12  | 71-FE        | Search analytics: API client, jam gating, orders tab, keyword explorer, product ranking                                                       | 8                   |
| 2026-02-28  | 70-FE        | Frontend validation fixes (23-page audit, 16 discrepancies)                                                                                   | 6                   |
| 2026-02-25  | 69-FE        | Buyout rate analytics (per-SKU breakdown + summary widget)                                                                                    | 7                   |
| 2026-02-23  | 66-FE        | Tax & VAT accounting integration (USN 6/15%, VAT 0/5/20/22%)                                                                                  | 7                   |
| 2026-01-31  | 63-FE        | Dashboard business logic (12 widgets)                                                                                                         | 12                  |
| 2026-01-31  | 62-FE        | Dashboard UI/UX (8-card grid, daily breakdown)                                                                                                | 10                  |
| 2026-01-31  | 61-FE        | Dashboard data integration (17 stories, 239 TDD tests)                                                                                        | 17                  |
| 2026-01-29  | 51-FE        | FBS Historical Analytics (365d)                                                                                                               | 12                  |
| 2026-01-29  | 53-FE        | Supply Management UI                                                                                                                          | 8                   |
| 2026-01-20  | 40-FE        | Orders UI & WB Status History                                                                                                                 | 7                   |
| 2026-01-20  | 44-FE        | Price Calculator V2                                                                                                                           | 6                   |
| Pre-2026    | 1-37, 42, 52 | Legacy epics (foundation, analytics, settings)                                                                                                | 76                  |

---

## Quick Links

| Resource              | Location                                                   |
| --------------------- | ---------------------------------------------------------- |
| Sprint Status (YAML)  | `_bmad-output/implementation-artifacts/sprint-status.yaml` |
| Story Artifacts       | `_bmad-output/implementation-artifacts/*.md`               |
| Epic Specs            | `_bmad-output/planning-artifacts/epics-*.md`               |
| Routes Code           | `src/lib/routes.ts`                                        |
| API Integration Guide | `docs/api-integration-guide.md`                            |
| UI/UX Spec            | `docs/front-end-spec.md`                                   |
| Architecture          | `docs/front-end-architecture.md`                           |
| Backend API Reference | `../docs/API-PATHS-REFERENCE.md`                           |
| Backend HTTP Tests    | `../test-api/*.http`                                       |
| Legacy Story Status   | `docs/stories/STORIES-STATUS-REPORT.md`                    |
