# Frontend Epics & Stories Tracker

> **Source of Truth** for all frontend epic statuses, sprint planning, and story tracking.
> Referenced from `CLAUDE.md` - do not duplicate this information elsewhere.

**Last Updated**: 2026-01-29
**Total Epics**: 17 (17 complete)
**Total Stories**: 107 (76 legacy + 27 Q1 2026 + 4 Epic 42-FE)

---

## Status Legend

| Status | Meaning |
|--------|---------|
| ✅ | Complete |
| 🚧 | In Progress |
| 📋 | Ready for Dev |
| ⏸️ | On Hold |
| ❌ | Blocked |

---

## Epic Overview

### Completed Epics (15)

| Epic ID | Title | Stories | Status | Key Routes |
|---------|-------|---------|--------|------------|
| Epic 1-FE | Foundation & Authentication | 5 | ✅ | `/login`, `/register` |
| Epic 2-FE | Onboarding & Initial Data Setup | 4 | ✅ | `/cabinet`, `/wb-token`, `/processing` |
| Epic 3-FE | Dashboard & Financial Overview | 6 | ✅ | `/dashboard` |
| Epic 4-FE | COGS Management & Margin Analysis | 10 | ✅ | `/cogs`, `/cogs/bulk` |
| Epic 5-FE | COGS History Management | 3 | ✅ | `/cogs/history` |
| Epic 6-FE | Advanced Analytics & Reporting | 5 | ✅ | `/analytics/*` |
| Epic 24-FE | Paid Storage Analytics UI | 11 | ✅ | `/analytics/storage` |
| Epic 33-FE | Advertising Analytics UI | 8 | ✅ | `/analytics/advertising` |
| Epic 34-FE | Telegram Notifications UI | 6 | ✅ | `/settings/notifications` |
| Epic 36-FE | Product Card Linking UI | 5 | ✅ | (modal in product list) |
| Epic 37-FE | Merged Group Table Display UI | 5 | ✅ | (advertising page) |
| Epic 44-FE | Price Calculator UI | 6 | ✅ | `/cogs/price-calculator` |
| Epic 52-FE | Tariff Settings Admin UI | 7 | ✅ | `/settings/tariffs` |
| Epic 42-FE | Task Handlers Adaptation | 4 | ✅ | `/tasks` |

### New Epics (3) - Q1 2026 (3 complete)

| Epic ID | Title | Stories | SP | Status | Sprint | Routes |
|---------|-------|---------|---:|--------|--------|--------|
| Epic 40-FE | Orders UI & WB Status History | 7 | 26 | ✅ Complete | 1-2 | `/orders` |
| Epic 53-FE | Supply Management UI | 8 | 34 | ✅ Complete | 3-5 | `/supplies`, `/supplies/:id` |
| Epic 51-FE | FBS Historical Analytics (365d) | 12 | 39 | ✅ Complete | 2-6 | `/analytics/orders`, `/settings/backfill` |

---

## Current Route Structure (24+ Pages)

### Public Routes `(auth)`
- `/login` - Login page
- `/register` - Registration page

### Onboarding `(onboarding)`
- `/cabinet` - Cabinet creation
- `/wb-token` - WB API token entry
- `/processing` - Initial data processing status

### Protected Routes `(dashboard)`

**Dashboard & COGS**:
- `/dashboard` - Main dashboard
- `/cogs` - Product list with COGS form
- `/cogs/bulk` - Bulk COGS assignment
- `/cogs/history` - COGS version history
- `/cogs/price-calculator` - Price calculator (Epic 44)

**Analytics**:
- `/analytics` - Analytics hub
- `/analytics/dashboard` - Cabinet summary (Epic 6.4)
- `/analytics/sku` - Margin by SKU
- `/analytics/brand` - Margin by brand
- `/analytics/category` - Margin by category
- `/analytics/time-period` - Time-period comparison
- `/analytics/storage` - Storage analytics (Epic 24)
- `/analytics/supply-planning` - Stockout prediction
- `/analytics/unit-economics` - Unit economics (Epic 5)
- `/analytics/liquidity` - Liquidity analysis (Epic 7)
- `/analytics/advertising` - Advertising ROAS (Epic 33)

**Settings**:
- `/settings/notifications` - Telegram settings (Epic 34)
- `/settings/tariffs` - Tariff settings admin (Epic 52, Admin only)

**Q1 2026 Routes** (complete):
- `/orders` - FBS Orders list & history (Epic 40-FE) ✅
- `/supplies`, `/supplies/:id` - Supply management (Epic 53-FE) ✅
- `/analytics/orders` - FBS Historical Analytics (Epic 51-FE) ✅
- `/settings/backfill` - Admin backfill management (Epic 51-FE, Owner only) ✅

**Routes reference**: `src/lib/routes.ts`

---

## Q1 2026 Sprint Plan

### Sprint 1 (Feb 3-14) - Orders Foundation

**Status**: ✅ Complete

| Story | Title | SP | Status | Owner |
|-------|-------|---:|--------|-------|
| 40.1-FE | Types & API Client Foundation | 3 | ✅ Complete | - |
| 40.2-FE | React Query Hooks | 3 | ✅ Complete | - |
| 40.3-FE | Orders List Page | 5 | ✅ Complete | - |
| 40.4-FE | Order Details Modal | 3 | ✅ Complete | - |

**Sprint Goal**: ~~Orders list page functional, navigation in sidebar~~
- [x] Orders list page functional
- [x] Navigation in sidebar
- [x] 40+ WB status codes mapped with Russian translations
- [x] Full, WB, and Local history tabs working

---

### Sprint 2 (Feb 17-28) - Orders History & Analytics

**Status**: ✅ Complete

| Story | Title | SP | Status | Owner |
|-------|-------|---:|--------|-------|
| 40.5-FE | History Timeline Components | 5 | ✅ Complete | - |
| 40.6-FE | Orders Analytics Dashboard | 5 | ✅ Complete | - |
| 40.7-FE | Integration & Polish | 2 | ✅ Complete | - |
| 51.1-FE | FBS Analytics Types | 2 | ✅ Complete | - |
| 51.2-FE | FBS Analytics Hooks | 3 | ✅ Complete | - |

**Sprint Goal**: ~~Complete Epic 40-FE, start Epic 51-FE foundation~~
- [x] Epic 40-FE fully complete (7 stories, 26 SP)
- [x] Timeline components with 40+ WB status visualization
- [x] Analytics dashboard with SLA/Velocity widgets
- [x] FBS Analytics foundation (types, API, hooks)

---

### Sprint 3 (Mar 3-14) - Supplies Foundation

**Status**: ✅ Complete

| Story | Title | SP | Status | Owner |
|-------|-------|---:|--------|-------|
| 53.1-FE | Types & API Client | 2 | ✅ Complete | - |
| 53.2-FE | Supplies List Page | 5 | ✅ Complete | - |
| 53.3-FE | Create Supply Flow | 3 | ✅ Complete | - |
| 53.4-FE | Supply Detail Page | 5 | ✅ Complete | - |
| 51.3-FE | Extended Date Picker | 3 | ✅ Complete | - |

**Sprint Goal**: ~~Supplies CRUD functional~~
- [x] Supply types & API client foundation
- [x] Supplies list page with status badges
- [x] Create supply modal flow
- [x] Supply detail page with stepper
- [x] Extended date picker (365-day support)

---

### Sprint 4 (Mar 17-28) - Order Picker & Stickers

**Status**: ✅ Complete

| Story | Title | SP | Status | Owner |
|-------|-------|---:|--------|-------|
| 53.5-FE | Order Picker Drawer | 8 | ✅ Complete | - |
| 53.6-FE | Close Supply & Stickers | 5 | ✅ Complete | - |
| 51.4-FE | FBS Trends Chart | 5 | ✅ Complete | - |

**Sprint Goal**: ~~Complete supply workflow, FBS trends chart~~
- [x] Order picker drawer with virtualized list
- [x] Multi-select batch operations
- [x] Close supply & stickers download
- [x] FBS trends chart with multi-line visualization

---

### Sprint 5 (Mar 31 - Apr 11) - Analytics & Polish

**Status**: ✅ Complete

| Story | Title | SP | Status | Owner |
|-------|-------|---:|--------|-------|
| 53.7-FE | Status Polling & Sync | 3 | ✅ Complete | - |
| 53.8-FE | E2E Tests & Polish | 3 | ✅ Complete | - |
| 51.5-FE | Trends Summary Cards | 2 | ✅ Complete | - |
| 51.6-FE | Seasonal Patterns | 5 | ✅ Complete | - |
| 51.7-FE | Period Comparison | 3 | ✅ Complete | - |
| 51.8-FE | FBS Analytics Page | 5 | ✅ Complete | - |

**Sprint Goal**: ~~Complete Epic 53-FE, FBS analytics functional~~
- [x] Status polling & sync for supplies
- [x] E2E tests for supply workflow
- [x] Trends summary cards
- [x] Seasonal patterns visualization
- [x] Period comparison component
- [x] FBS Analytics page integration

---

### Sprint 6 (Apr 14-25) - Admin & Final

**Status**: ✅ Complete

| Story | Title | SP | Status | Owner |
|-------|-------|---:|--------|-------|
| 51.9-FE | Hub Integration | 1 | ✅ Complete | - |
| 51.10-FE | Backfill Admin Types | 2 | ✅ Complete | - |
| 51.11-FE | Backfill Admin Page | 5 | ✅ Complete | - |
| 51.12-FE | E2E Tests | 3 | ✅ Complete | - |

**Sprint Goal**: ~~Complete Epic 51-FE, all Q1 epics done~~
- [x] Hub integration navigation card
- [x] Backfill admin types & hooks
- [x] Backfill admin page (Owner only)
- [x] E2E tests for analytics + backfill

---

## Story Details by Epic

### Epic 40-FE: Orders UI & WB Status History

**File**: `docs/epics/epic-40-fe-orders-wb-history.md`
**Backend**: Epic 40, Story 40.9
**Priority**: P0 (Foundation)

| Story | Title | SP | Acceptance Criteria |
|-------|-------|---:|---------------------|
| 40.1-FE | Types & API Client | 3 | Types match API, error messages |
| 40.2-FE | React Query Hooks | 3 | All hooks with proper caching |
| 40.3-FE | Orders List Page | 5 | Route, table, filters, pagination |
| 40.4-FE | Order Details Modal | 3 | Tabs, header, loading states |
| 40.5-FE | History Timeline | 5 | 3 views, source badges, duration |
| 40.6-FE | Analytics Dashboard | 5 | SLA, velocity, at-risk widgets |
| 40.7-FE | Integration & Polish | 2 | E2E, docs, lazy loading |

**Dependencies**: None (foundation epic)

---

### Epic 53-FE: Supply Management UI

**File**: `docs/epics/epic-53-fe-supply-management.md`
**Backend**: Epic 53
**Priority**: P1 (High Business Value)

| Story | Title | SP | Acceptance Criteria |
|-------|-------|---:|---------------------|
| 53.1-FE | Types & API Client | 2 | 9 endpoint types |
| 53.2-FE | Supplies List Page | 5 | Route, table, status badges |
| 53.3-FE | Create Supply Flow | 3 | Modal, mutation, redirect |
| 53.4-FE | Supply Detail Page | 5 | Header, stepper, orders table |
| 53.5-FE | Order Picker Drawer | 8 | Virtualized, multi-select, batch |
| 53.6-FE | Close & Stickers | 5 | Format selector, preview, download |
| 53.7-FE | Polling & Sync | 3 | Auto-refresh, rate limit |
| 53.8-FE | E2E Tests | 3 | Full lifecycle test |

**Dependencies**: Epic 40-FE (useOrders hook)

---

### Epic 51-FE: FBS Historical Analytics (365d)

**File**: `docs/epics/epic-51-fe-fbs-historical-analytics.md`
**Backend**: Epic 51
**Priority**: P2 (Enhancement)

| Story | Title | SP | Acceptance Criteria |
|-------|-------|---:|---------------------|
| 51.1-FE | Types & API | 2 | All analytics types |
| 51.2-FE | Hooks | 3 | Trends, seasonal, compare |
| 51.3-FE | Date Range Picker | 3 | 365-day support, presets |
| 51.4-FE | Trends Chart | 5 | Multi-line, source indicator |
| 51.5-FE | Summary Cards | 2 | Total, avg, rates |
| 51.6-FE | Seasonal Patterns | 5 | Monthly/weekly/quarterly tabs |
| 51.7-FE | Period Comparison | 3 | Side-by-side with deltas |
| 51.8-FE | Analytics Page | 5 | Tab navigation, integration |
| 51.9-FE | Hub Integration | 1 | Navigation card |
| 51.10-FE | Backfill Types | 2 | Admin hooks |
| 51.11-FE | Backfill Admin | 5 | Owner-only page |
| 51.12-FE | E2E Tests | 3 | Analytics + backfill tests |

**Dependencies**: None (independent)

---

## Legacy Epic Details

For completed epics (1-6, 24, 33-34, 36-37, 44, 52), see:
- `docs/stories/STORIES-STATUS-REPORT.md` - Legacy status report
- `docs/stories/epic-{N}/` - Individual story files

---

## Q1 2026 Final Summary

**Q1 2026 Development Complete** - All planned epics delivered on schedule.

### Delivery Metrics
| Metric | Value |
|--------|-------|
| **Total Stories Delivered** | 27 |
| **Total Story Points** | 99 |
| **Epics Completed** | 3/3 (100%) |
| **Sprints Completed** | 6/6 (100%) |
| **Duration** | Feb 3 - Apr 25, 2026 |

### Features Delivered

**Epic 40-FE: Orders UI & WB Status History** (26 SP)
- FBS Orders list page with advanced filtering
- Order details modal with tabbed interface
- Full WB status history timeline with 40+ status codes
- WB-native and local status tracking
- Analytics dashboard with SLA/Velocity widgets

**Epic 53-FE: Supply Management UI** (34 SP)
- Supplies list page with status badges
- Create supply wizard flow
- Supply detail page with progress stepper
- Order picker drawer with virtualized list
- Batch order operations
- Stickers download (PDF/PNG/ZPL)
- Real-time status polling

**Epic 51-FE: FBS Historical Analytics** (39 SP)
- 365-day date range support
- Multi-line trends chart
- Seasonal patterns visualization (monthly/weekly/quarterly)
- Period comparison with delta indicators
- FBS Analytics page with tab navigation
- Hub integration navigation
- Backfill admin page (Owner-only)
- Comprehensive E2E test coverage

### New Routes Added
- `/orders` - FBS Orders management
- `/supplies` - Supply list
- `/supplies/:id` - Supply details
- `/analytics/orders` - FBS Historical Analytics
- `/settings/backfill` - Admin backfill management

---

## Changelog

### 2026-01-29 (Epic 42-FE Complete)
- **Epic 42-FE Task Handlers Adaptation fully complete** (4 stories):
  - Story 42.1-FE: Types & API Client - Task type definitions and API integration
  - Story 42.2-FE: React Query Hooks - useTasks, useTaskStatus hooks
  - Story 42.3-FE: Tasks Page Components - TaskList, TaskStatusBadge, TaskFilters
  - Story 42.4-FE: Integration & Polish - E2E tests, error handling
- New route `/tasks` added for task management
- Total epics: 17 (all complete)
- Total stories: 107 (76 legacy + 27 Q1 2026 + 4 Epic 42-FE)

### 2026-01-29 (Q1 2026 Complete)
- **Sprint 6 completed** (4 stories, 11 SP)
- **Epic 51-FE FBS Historical Analytics fully complete** (12 stories, 39 SP):
  - Hub integration navigation card
  - Backfill admin types & hooks
  - Backfill admin page (Owner only)
  - E2E tests for analytics + backfill
- **Q1 2026 Development Complete**:
  - All 3 epics delivered (40-FE, 53-FE, 51-FE)
  - 27 stories, 99 story points
  - 6 sprints completed on schedule
  - 4 new routes added to application

### 2026-01-29 (Sprint 5 Complete)
- Sprint 5 completed (6 stories, 21 SP)
- **Epic 53-FE Supply Management UI fully complete** (8 stories, 34 SP):
  - Status polling & sync for real-time updates
  - E2E tests covering full supply lifecycle
- **FBS Analytics functional** (4 stories):
  - Trends summary cards with key metrics
  - Seasonal patterns visualization (monthly/weekly/quarterly)
  - Period comparison component with delta indicators
  - FBS Analytics page integrated with tab navigation
- Sprint 6 started (4 stories, 11 SP) - Final sprint

### 2026-01-29 (Sprint 4 Complete)
- Sprint 4 completed (3 stories, 18 SP)
- Order Picker Drawer complete:
  - Virtualized list for large order sets
  - Multi-select with batch operations
  - Search and filter capabilities
- Close Supply & Stickers complete:
  - Format selector (PDF/PNG/ZPL)
  - Stickers preview and download
  - Close supply workflow
- FBS Trends Chart complete:
  - Multi-line visualization
  - Source indicators (WB/Local)
  - Date range support
- Sprint 5 started (6 stories, 21 SP)

### 2026-01-29 (Sprint 3 Complete)
- Sprint 3 completed (5 stories, 18 SP)
- Supply Management foundation complete:
  - Types & API client with 9 endpoints
  - Supplies list page with status badges
  - Create supply modal flow
  - Supply detail page with stepper navigation
- Extended date picker (365-day support) for FBS analytics
- Sprint 4 started (3 stories, 18 SP)

### 2026-01-29 (Sprint 2 Complete)
- Sprint 2 completed (5 stories, 17 SP)
- Epic 40-FE Orders UI fully complete (7 stories, 26 SP)
- Timeline components with 40+ WB status visualization
- Analytics dashboard with SLA/Velocity widgets
- FBS Analytics foundation (types, API, hooks)
- Sprint 3 started (5 stories, 18 SP)

### 2026-01-29
- Sprint 1 completed (4 stories, 14 SP)
- Orders module implemented: list page, filters, modal, history tabs
- 40+ WB status codes mapped with Russian translations
- Sprint 2 started (5 stories, 17 SP)

### 2026-01-29 (earlier)
- Restructured tracker as single source of truth
- Added route structure
- Added 3 new epics: 40-FE, 51-FE, 53-FE
- Created 6-sprint plan for Q1 2026
- Total: 27 new stories, 99 SP

### 2026-01-20
- Epic 44-FE Phase 4 completed (6 stories)
- Price Calculator V2 enhancements done

### Previous
- See `docs/stories/STORIES-STATUS-REPORT.md` for legacy epic history

---

## Quick Links

| Resource | Location |
|----------|----------|
| Sprint Plan | `docs/sprint-planning/sprint-plan-2026-q1-orders-supplies.md` |
| Epic 40-FE | `docs/epics/epic-40-fe-orders-wb-history.md` |
| Epic 51-FE | `docs/epics/epic-51-fe-fbs-historical-analytics.md` |
| Epic 53-FE | `docs/epics/epic-53-fe-supply-management.md` |
| Story Files | `docs/stories/epic-{N}/story-{N}.{M}-*.md` |
| Backend APIs | `../test-api/*.http` |
| Routes Code | `src/lib/routes.ts` |
