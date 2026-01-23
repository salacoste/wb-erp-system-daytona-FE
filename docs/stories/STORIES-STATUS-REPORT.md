# Stories Status Report

**Generated:** 2025-11-23
**Last Updated:** 2026-01-23
**Total Stories:** 93 (86 Done, 4 Ready for Dev)

## Summary

- ✅ **Completed (Done):** 86 stories (92%)
- 📋 **Ready for Development:** 4 stories (Epic 42-FE 4 stories)
- 📝 **Draft (Not Started):** 0 stories
- ⚠️ **Partially Complete:** 0 stories

---

## ⚠️ Major Documentation Update (2026-01-02)

**CRITICAL FIX**: This document was significantly outdated (last update 2025-12-04). Multiple epics were marked as "Ready for Development" but were actually **COMPLETE** in code.

**Corrected Statuses:**
| Epic | Previous Status | Actual Status |
|------|-----------------|---------------|
| Epic 6-FE | "0/5 Ready for Dev" | ✅ **COMPLETE** (5/5, 21 pts) |
| Epic 33-FE | "0/8 Ready for Dev" | ✅ **COMPLETE** (8/8, 26 pts) |
| Epic 34-FE | Not listed | ✅ **PRODUCTION READY** (6/6, 21 pts) |
| Epic 36-FE | Not listed | ✅ **COMPLETE** (5/5, 16 pts, 91 tests) |
| Epic 37 | Not listed | ✅ **DONE** (5/5, 89.4/100 quality) |

---

## Epic Overview

### ✅ Epic 1: Authentication & Foundation — COMPLETE (5/5 stories)
### ✅ Epic 2: Onboarding Flow — COMPLETE (4/4 stories, 32 tests)
### ✅ Epic 3: Dashboard & Analytics — COMPLETE (6/6 stories, 97 tests)
### ✅ Epic 4: COGS Management & Margin Analysis — COMPLETE (10/10 stories)
### ✅ Epic 5: COGS History Management — COMPLETE (3/3 stories, 92 tests)
### ✅ Epic 6: Advanced Analytics — COMPLETE (5/5 stories, 21 pts)
### ✅ Epic 24: Paid Storage Analytics — COMPLETE (11/11 stories, 39 pts)
### ✅ Epic 33-FE: Advertising Analytics — COMPLETE (8/8 stories, 26 pts)
### ✅ Epic 34-FE: Telegram Notifications — PRODUCTION READY (6/6 stories, 21 pts)
### ✅ Epic 36-FE: Product Card Linking — COMPLETE (5/5 stories, 91 tests)
### ✅ Epic 37: Merged Group Table Display — DONE (5/5 stories, 89.4/100)
### ✅ Epic 44: Price Calculator UI — COMPLETE (27/27 stories, 63 pts)
### ✅ Epic 52-FE: Tariff Settings Admin UI — COMPLETE (7/7 stories, 26 pts)
### 📋 Epic 42-FE: Task Handlers Adaptation — READY FOR DEV (4 stories, 7 pts)

---

## Epic 1: Authentication & Foundation (5 stories)

### ✅ 1.1: Project Foundation & Infrastructure Setup
**Status:** Done
**Completion:** 100%
**All Tasks:** ✅ Completed
**Notes:** All infrastructure setup tasks completed successfully.

### ✅ 1.2: User Registration
**Status:** Done
**Completion:** 100%
**All Tasks:** ✅ Completed
**Notes:** Registration form, validation, API integration, and tests all complete.

### ✅ 1.3: User Login
**Status:** Done
**Completion:** 100%
**All Tasks:** ✅ Completed
**Notes:** Protected route middleware was implemented in Story 1.4 (`src/middleware.ts`), completing all requirements. Story is effectively 100% complete.

### ⚠️ 1.4: Session Management & Logout
**Status:** Done
**Completion:** ~95%
**Uncompleted Tasks:**
- [ ] Implement session timeout handling (AC: 7)
  - **Note:** Deferred - will implement based on backend API support
  - **Status:** Backend API may not support timeout detection yet

**Notes:** Session timeout handling deferred pending backend API capabilities. All other session management features complete.

### ✅ 1.5: API Client Layer & Authentication Headers
**Status:** Done
**Completion:** 100%
**All Tasks:** ✅ Completed
**Notes:** API client with automatic JWT and Cabinet-ID header injection fully implemented.

---

## Epic 2: Onboarding Flow (4 stories) ✅ **COMPLETE**

### ✅ 2.1: Cabinet Creation Interface
**Status:** Done
**Completion:** 100%
**All Tasks:** ✅ Completed
**QA Review:** PASS (2025-11-27) - 8 tests
**Notes:** Cabinet creation form, validation, API integration, and token refresh handling complete.

### ✅ 2.2: WB Token Input & Validation
**Status:** Done
**Completion:** 100%
**All Tasks:** ✅ Completed
**QA Review:** PASS (2025-11-27) - 8 tests
**Notes:** Token input form with validation, masking, and API integration complete.

### ✅ 2.3: Data Processing Status Indicators
**Status:** Done
**Completion:** 100%
**All Tasks:** ✅ Completed
**QA Review:** PASS (2025-11-27) - 8 tests
**Notes:** Processing status page with polling, progress indicators, and auto-redirect complete.

### ✅ 2.4: Initial Data Display After Processing
**Status:** Done
**Completion:** 100%
**All Tasks:** ✅ Completed
**QA Review:** PASS (2025-11-27) - 8 tests
**Notes:** Initial data summary with product count, metrics, and call-to-action complete.

---

## Epic 3: Dashboard & Analytics (6 stories) ✅ **COMPLETE**

### ✅ 3.1: Main Dashboard Layout & Navigation
**Status:** Done
**Completion:** 100%
**All Tasks:** ✅ Completed
**QA Review:** PASS (2025-11-27) - 14 tests
**Notes:** Dashboard layout, sidebar, navbar, responsive design, and mobile menu complete.

### ✅ 3.2: Key Metric Cards Display
**Status:** Done
**Completion:** 100%
**All Tasks:** ✅ Completed
**QA Review:** PASS (2025-11-27) - 18 tests
**Notes:** MetricCard component with loading/error states, currency formatting, and dashboard integration complete.

### ✅ 3.3: Expense Breakdown Visualization
**Status:** Done
**Completion:** 100%
**All Tasks:** ✅ Completed
**QA Review:** PASS (2025-11-27) - 18 tests
**Notes:** ExpenseChart component with 9 expense categories, Recharts bar chart, interactive tooltips complete.

### ✅ 3.4: Trend Graphs for Key Metrics
**Status:** Done
**Completion:** 100%
**All Tasks:** ✅ Completed
**QA Review:** PASS (2025-11-27) - 18 tests
**Notes:** TrendGraph component with line chart, weekly data trends, date formatting complete.

### ✅ 3.5: Financial Summary View
**Status:** Done
**Completion:** 100%
**All Tasks:** ✅ Completed
**QA Review:** PASS (2025-11-27) - 18 tests
**Notes:** Full financial analytics hub with week selector, period comparison, 15+ metrics complete.

### ✅ 3.4a: Trends API Optimization
**Status:** Done
**Completion:** 100%
**All Tasks:** ✅ Completed
**QA Review:** PASS (2025-11-27) - 11 tests
**Notes:** 87.5% reduction in API calls (8 → 1) via dedicated trends endpoint.

---

## Epic 4: COGS Management & Margin Analysis (10 stories) ✅ **COMPLETE**

### ✅ 4.1: Single Product COGS Assignment — Done
### ✅ 4.2: Bulk COGS Assignment — Done
### ✅ 4.3: COGS Input Validation & Error Handling — Done (67 tests)
### ✅ 4.4: Automatic Margin Calculation & Display — Done (35 tests)
### ✅ 4.5: Margin Analysis by SKU — Done
### ✅ 4.6: Margin Analysis by Brand & Category — Done
### ✅ 4.7: Margin Analysis by Time Period — Done
### ✅ 4.8: Margin Recalculation Polling — Done (23 tests)
### ✅ 4.9: Historical Margin Discovery — Done (45 tests)
### ✅ 4.10: Slide-out COGS Panel — Done

---

## Epic 5: COGS History Management (3 stories) ✅ **COMPLETE**

### ✅ 5.1-fe: COGS History View — Done (50 tests)
### ✅ 5.2-fe: COGS Edit Dialog — Done (24 tests)
### ✅ 5.3-fe: COGS Delete Confirmation — Done (18 tests, QA PASS 95/100)

---

## Epic 6: Advanced Analytics (5 stories) ✅ **COMPLETE**

**Status:** ✅ Complete (100%)
**Total Points:** 21/21
**Completed:** 2025-12-05
**Documentation:** `docs/CHANGELOG-EPIC-6-FE.md`, `docs/stories/epic-6/README.md`

### ✅ 6.1-fe: Date Range Support — Done (5 pts)
DateRangePicker component, weekStart/weekEnd params, quick presets.

### ✅ 6.2-fe: Period Comparison Enhancement — Done (3 pts)
DeltaIndicator component (↑↓—), ComparisonPeriodSelector, 33 tests.

### ✅ 6.3-fe: ROI & Profit Metrics Display — Done (3 pts)
ColumnVisibilityToggle, ROI color-coding, localStorage persistence.

### ✅ 6.4-fe: Cabinet Summary Dashboard — Done (5 pts)
KPICard, TopProductsTable, TopBrandsTable, `/analytics/dashboard` page.

### ✅ 6.5-fe: Export Analytics UI — Done (5 pts)
ExportDialog, ExportStatusDisplay, CSV/Excel export with polling.

---

## Epic 24: Paid Storage Analytics (8 stories) 🔍 **READY FOR QA**

**Status:** 8/8 stories implemented, 4 in QA
**Last Update:** 2025-12-04 (bugfixes applied)

### ✅ 24.1-fe: TypeScript Types & API Client — Done
### ✅ 24.2-fe: Storage Analytics Page Layout — Done
### 🔍 24.3-fe: Storage by SKU Table — In QA
### 🔍 24.4-fe: Top Consumers Widget — In QA
### ✅ 24.5-fe: Storage Trends Chart — Done
### ✅ 24.6-fe: Manual Import UI — Done
### ✅ 24.7-fe: Product Card Storage Info — Done
### 🔍 24.8-fe: High Storage Ratio Alert — In QA

**Bugfixes Applied (2025-12-04):**
- ✅ Fixed missing `formatIsoWeek` import
- ✅ Fixed API client auto-unwrap bug
- ✅ Fixed Sidebar double-highlight issue

---

## Epic 33-FE: Advertising Analytics (8 stories) ✅ **COMPLETE**

**Status:** ✅ Complete (100%)
**Total Points:** 26
**Completed:** 2025-12-29
**Documentation:** `docs/stories/epic-33/README.md`

### ✅ 33.1-fe: TypeScript Types & API Client — Done (3 pts)
`advertising-analytics.ts` types, API client, `useAdvertisingAnalytics` hook.

### ✅ 33.2-fe: Advertising Analytics Page Layout — Done (5 pts)
`/analytics/advertising/page.tsx` (406 lines), filters, summary cards.

### ✅ 33.3-fe: Performance Metrics Table — Done (5 pts)
PerformanceMetricsTable with 27+ columns, pagination, sorting.

### ✅ 33.4-fe: Efficiency Status Indicators — Done (3 pts)
EfficiencyBadge, EfficiencyAlertBanner, 5 status levels.

### ✅ 33.5-fe: Campaign List & Filtering — Done (3 pts)
CampaignSelector, EfficiencyFilterDropdown.

### ✅ 33.6-fe: Sync Status Display — Done (2 pts)
SyncStatusIndicator in header.

### ✅ 33.7-fe: Dashboard Widget — Done (3 pts)
AdvertisingDashboardWidget for main dashboard.

### ✅ 33.8-fe: Integration Testing — Done (2 pts)
All E2E and integration tests passing.

---

## Epic 34-FE: Telegram Notifications (6 stories) ✅ **PRODUCTION READY**

**Status:** ✅ Production Ready
**Total Points:** 21
**Completed:** 2025-12-30
**Documentation:** `docs/CHANGELOG-EPIC-34-FE.md`, `docs/DEV-HANDOFF-EPIC-34-FE.md`

### ✅ 34.1-FE: Types & API Client — Done (2 pts)
3 types, 6 API functions, 3 hooks, 7 tests. SSR-safe, React Query v5.

### ✅ 34.2-FE: Telegram Binding Flow — Done (5 pts)
TelegramBindingCard, TelegramBindingModal, countdown timer, 3s polling.

### ✅ 34.3-FE: Notification Preferences Panel — Done (5 pts)
NotificationPreferencesPanel, 4 event types, manual save, dirty detection.

### ✅ 34.4-FE: Quiet Hours & Timezone — Done (3 pts)
QuietHoursPanel, TimezoneSelect, 13 timezones.

### ✅ 34.5-FE: Settings Page Layout — Done (3 pts)
`/settings/notifications/page.tsx`, hero banner, lock overlays.

### ✅ 34.6-FE: Testing & Documentation — Done (3 pts)
WCAG 2.1 AA compliance, CHANGELOG updated.

---

## Epic 36-FE: Product Card Linking (5 stories) ✅ **COMPLETE**

**Status:** ✅ Complete
**Total Points:** 16
**Test Coverage:** 91 tests (5 E2E + 21 Integration + 65 Unit)
**Completed:** 2025-12-28
**Documentation:** `docs/CHANGELOG-EPIC-36-FE.md`

### ✅ 36.1-fe: TypeScript Types Update — Done (3 pts)
GroupByMode, MergedProduct types, extended AdvertisingItem.

### ✅ 36.2-fe: API Client & Hooks Update — Done (2 pts)
`group_by` parameter, `useAdvertisingMergedGroups` hook.

### ✅ 36.3-fe: MergedProductBadge Component — Done (3 pts)
`🔗 Склейка (N)` badge with tooltip, 40 unit tests.

### ✅ 36.4-fe: Page Layout & Toggle UI — Done (5 pts)
GroupByToggle ("По артикулам" / "По склейкам"), URL state sync.

### ✅ 36.5-fe: Testing & Documentation — Done (3 pts)
5 E2E + 21 integration + 65 unit tests = 91 total.

---

## Epic 37: Merged Group Table Display (5 stories) ✅ **DONE**

**Status:** ✅ Done
**Quality Score:** 89.4/100 🏆
**Completed:** 2025-12-29
**Documentation:** `docs/stories/epic-37/STATUS.md`, `docs/CHANGELOG-EPIC-37-FE.md`

### ✅ 37.1: Backend API Validation — Done
API endpoint validation, Epic 36 imtId field presence verified.

### ✅ 37.2: MergedGroupTable Component — Done
3-tier rowspan table structure, MergedGroupRows, ProductRowBadge.

### ✅ 37.3: Aggregate Metrics Display — Done
Epic 35 formulas: totalSales, revenue, organicSales, ROAS calculations.

### ✅ 37.4: Visual Styling & Hierarchy — Done
Design tokens, responsive behavior, crown icon (👑) for main products.

### ✅ 37.5: Testing & Documentation — Done
Unit tests ≥90%, E2E tests, WCAG 2.1 AA compliance.

---

## Epic 42-FE: Task Handlers Adaptation (4 stories) 📋 **READY FOR DEVELOPMENT**

**Status:** 📋 Ready for Development
**Total Points:** 7 (3 required, 4 optional)
**Created:** 2026-01-06
**Backend Epic:** Epic 42 (Complete)
**Documentation:** `docs/epics/epic-42-fe-task-handlers-adaptation.md`

**Key Change:** `enrich_cogs` task DEPRECATED → use `recalculate_weekly_margin`

### 📋 42.1-FE: TypeScript Types Update — Ready (1 pt, Required)
Update Task.type union, add `recalculate_weekly_margin`, mark deprecated.

### 📋 42.2-FE: Sanity Check Hook — Backlog (2 pts, Optional)
`useSanityCheck` hook for data quality validation, polling support.

### 📋 42.3-FE: Missing COGS Alert — Backlog (2 pts, Optional)
`MissingCogsAlert` component, depends on 42.2-FE.

### 📋 42.4-FE: Documentation & Tests — Ready (2 pts, Required)
Update README, api-integration-guide, verify tests.

**Note:** Frontend already uses `recalculate_weekly_margin` in existing code. Changes minimal.

---

## Epic 52-FE: Tariff Settings Admin UI (7 stories) ✅ **COMPLETE**

**Status:** ✅ Complete
**Total Points:** 26
**Completed:** 2026-01-23
**Documentation:** `docs/stories/epic-52-fe/README.md`

### ✅ 52-FE.1: Version History Table — Done (3 pts)
VersionHistoryTable, VersionStatusBadge, loading/empty/error states.

### ✅ 52-FE.2: Tariff Settings Edit Form — Done (8 pts)
TariffSettingsForm with 6 collapsible sections, 21 fields, PUT/PATCH support, validation.

### ✅ 52-FE.3: Schedule Future Version — Done (5 pts)
ScheduleVersionModal, ScheduleVersionForm, date picker, pre-fill from current settings.

### ✅ 52-FE.4: Audit Log Viewer — Done (4 pts)
AuditLogTable with server-side pagination, field filter, value formatting, action badges.

### ✅ 52-FE.5: Delete Scheduled Version — Done (2 pts)
DeleteVersionDialog with confirmation, loading state, cache invalidation.

### ✅ 52-FE.6: Rate Limit UX & Error Handling — Done (2 pts)
RateLimitIndicator, tariffRateLimitStore, countdown timer, error handling.

### ✅ 52-FE.7: Page Layout, Types & Integration — Done (2 pts)
Page at `/settings/tariffs`, admin check, 3 tabs, types for 21 fields, API client.

---

## Epic 44-FE: Price Calculator UI (27 stories) ✅ **100% COMPLETE**

**Status:** ✅ 100% Complete (27/27 stories)
**Total Points:** 63
**Completed:** 2026-01-23
**Documentation:** `docs/stories/epic-44/README.md`

### Phase 1: Core Calculator (6/6 Complete)
- ✅ 44.1-FE: TypeScript Types & API Client — Done (2 pts)
- ✅ 44.2-FE: Input Form Component — Done (3 pts)
- ✅ 44.3-FE: Results Display Component — Done (3 pts)
- ✅ 44.4-FE: Page Layout & Integration — Done (2 pts)
- ✅ 44.5-FE: Real-time Calculation & UX — Done (2 pts)
- ✅ 44.6-FE: Testing & Documentation — Done (2 pts)

### Phase 2: Enhanced Logistics (4/4 Complete)
- ✅ 44.7-FE: Dimension-Based Volume Calculation — Done (2 pts)
- ✅ 44.8-FE: Logistics Tariff Calculation — Done (2 pts)
- ✅ 44.9-FE: Logistics Coefficients UI — Done (2 pts)
- ✅ 44.10-FE: Return Logistics Calculation — Done (2 pts)

### Phase 3: Warehouse & Tariffs (5/5 Complete)
- ✅ 44.12-FE: Warehouse Selection Dropdown — Done (3 pts)
- ✅ 44.13-FE: Auto-fill Coefficients — Done (3 pts)
- ✅ 44.14-FE: Storage Cost Calculation — Done (2 pts)
- ✅ 44.27-FE: Warehouse & Coefficients Integration — Done (2 pts)

### Phase 4: V2 Enhancements (6/6 Complete)
- ✅ 44.15-FE: FBO/FBS Fulfillment Type Selection — Done (2 pts)
- ✅ 44.16-FE: Category Selection with Search — Done (3 pts)
- ✅ 44.17-FE: Tax Configuration — Done (2 pts)
- ✅ 44.18-FE: DRR Input (Advertising %) — Done (1 pt)
- ✅ 44.19-FE: SPP Display (Customer Price) — Done (1 pt)
- ✅ 44.20-FE: Two-Level Pricing Display — Done (3 pts)

### Phase 5: Bug Fixes & Improvements (7/7 Complete)
- ✅ 44.32-FE: Missing Price Calculator Fields — Done (5 pts)
- ✅ 44.33-FE: Type Mismatch & Field Name Fixes — Done (2 pts)
- ✅ 44.34-FE: Debounce Warehouse Selection — Done (2 pts)
- ✅ 44.35-FE: FBO/FBS Toggle Crash Fix — Done (3 pts)
- ✅ 44.36-FE: API Field Mismatch — Done (2 pts)
- ✅ 44.37-FE: API Field Mismatch Warehouse — Done (2 pts)
- ✅ 44.38-FE: Units Per Package — Done (3 pts)

---

## Statistics

### By Status
- **Done:** 86 stories (92%)
- **Ready for Development:** 4 stories (4%) — Epic 42-FE (4)
- **Draft:** 0 stories

### By Epic
| Epic | Status | Stories | Points |
|------|--------|---------|--------|
| Epic 1 | ✅ Complete | 5/5 | - |
| Epic 2 | ✅ Complete | 4/4 (32 tests) | - |
| Epic 3 | ✅ Complete | 6/6 (97 tests) | - |
| Epic 4 | ✅ Complete | 10/10 | - |
| Epic 5 | ✅ Complete | 3/3 (92 tests) | - |
| Epic 6 | ✅ Complete | 5/5 | 21 pts |
| Epic 24 | ✅ Complete | 11/11 | 39 pts |
| Epic 33-FE | ✅ Complete | 8/8 | 26 pts |
| Epic 34-FE | ✅ Production Ready | 6/6 | 21 pts |
| Epic 36-FE | ✅ Complete | 5/5 (91 tests) | 16 pts |
| Epic 37 | ✅ Done | 5/5 (89.4/100) | - |
| Epic 42-FE | 📋 Ready for Dev | 4/4 | 7 pts |
| Epic 44-FE | ✅ Complete | 27/27 | 63 pts |
| Epic 52-FE | ✅ Complete | 7/7 | 26 pts |

### Overall Progress
- **Total Stories:** 93
- **Completed:** 86 (92%)
- **Ready for Dev:** 4 (4%)
- **Total Tests:** 800+ (estimated)

---

## Progress Timeline

| Date | Milestone |
|------|-----------|
| 2025-11-21 | 48% complete (10/21 MVP stories) |
| 2025-11-24 | 100% MVP complete (21/21 stories) 🎉 |
| 2025-11-27 | QA Review complete for Epic 2-3 |
| 2025-11-28 | Epic 5 complete (COGS History) |
| 2025-11-29 | Epic 24 implemented (Paid Storage) |
| 2025-12-04 | Epic 24 bugfixes applied |
| 2025-12-05 | **Epic 6 complete** (Advanced Analytics, 21 pts) |
| 2025-12-28 | **Epic 36-FE complete** (Product Card Linking, 91 tests) |
| 2025-12-29 | **Epic 33-FE complete** (Advertising Analytics, 26 pts) |
| 2025-12-29 | **Epic 37 done** (Merged Group Table, 89.4/100) |
| 2025-12-30 | **Epic 34-FE production ready** (Telegram Notifications) |
| 2026-01-02 | Documentation sync — 94% complete (62/66 stories) |
| 2026-01-06 | **Epic 42-FE created** (Task Handlers Adaptation, 4 stories, 7 pts) |
| 2026-01-17 | **Epic 44-FE Phase 1 complete** (Price Calculator UI Core, 6 stories, 14 pts) |
| 2026-01-23 | **Epic 52-FE complete** (Tariff Settings Admin UI, 7 stories, 26 pts) |
| 2026-01-23 | **Epic 44-FE Phases 2-5 complete** (Price Calculator UI Full, 26/27 stories, 61 pts) |

---

## Recommendations

### ✅ 86/93 STORIES COMPLETE (2026-01-23)

**Achievement Summary:**
- ✅ **86/93 Stories Complete** (92%)
- ✅ **Epic 1-6:** Core MVP complete with 300+ tests
- ✅ **Epic 24:** Paid Storage Analytics (39 pts, 11 stories)
- ✅ **Epic 33-FE:** Advertising Analytics (26 pts)
- ✅ **Epic 34-FE:** Telegram Notifications (Production Ready)
- ✅ **Epic 36-FE:** Product Card Linking (91 tests)
- ✅ **Epic 37:** Merged Group Table (89.4/100 quality)
- ✅ **Epic 44-FE:** Price Calculator UI (63 pts, 27/27 stories) — **COMPLETE**
- ✅ **Epic 52-FE:** Tariff Settings Admin UI (26 pts, 7 stories)
- ✅ **Total: 800+ tests**

### Next Steps

1. **Epic 42-FE** — Task Handlers Adaptation (4 stories, 7 pts) — Ready for Dev
3. **End-to-end testing** with real Wildberries data
4. **Performance testing** — verify API response times
5. **Security audit** — final security review
6. **Production Deployment**

### Deferred Items

- **Session Timeout Handling (1.4):** Pending backend API support
  - **Impact:** Low — basic session management works without timeout handling

---

## Related Documentation

### Changelogs
- `docs/CHANGELOG-EPIC-6-FE.md` — Epic 6 completion (2025-12-05)
- `docs/CHANGELOG-EPIC-33-FE.md` — Epic 33 completion (if exists)
- `docs/CHANGELOG-EPIC-34-FE.md` — Epic 34 production ready (2025-12-30)
- `docs/CHANGELOG-EPIC-36-FE.md` — Epic 36 completion (2025-12-28)
- `docs/CHANGELOG-EPIC-37-FE.md` — Epic 37 done (2025-12-29)

### Epic READMEs
- `docs/stories/epic-6/README.md` — Advanced Analytics (5/5 ✅)
- `docs/stories/epic-24/README.md` — Paid Storage Analytics (11/11 ✅)
- `docs/stories/epic-33/README.md` — Advertising Analytics (8/8 ✅)
- `docs/stories/epic-36/README.md` — Product Card Linking (5/5 ✅)
- `docs/stories/epic-37/STATUS.md` — Merged Group Table (5/5 ✅)
- `docs/stories/epic-42/README.md` — Task Handlers Adaptation (4 stories 📋)
- `docs/stories/epic-44/README.md` — Price Calculator UI (6/6 ✅)
- `docs/stories/epic-52-fe/README.md` — Tariff Settings Admin UI (7/7 ✅)

### Backend Requests
- `docs/request-backend/README.md` — All backend requests index
- `docs/request-backend/73-telegram-notifications-epic-34.md` — Epic 34 API
- `docs/request-backend/83-epic-36-api-contract.md` — Epic 36 API
- `docs/request-backend/94-epic-42-tech-debt-task-handlers.md` — Epic 42 Task Handlers

---

**Legend:**
- ✅ Done — Story completed
- 📋 Ready for Development — Story ready to implement
- 📝 Draft — Story not started
- ⚠️ Partially Complete — Story done but has deferred tasks
