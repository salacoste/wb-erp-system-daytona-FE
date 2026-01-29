# Frontend Epics & Stories Tracker

> **Source of Truth** for all frontend epic statuses, sprint planning, and story tracking.
> Referenced from `CLAUDE.md` - do not duplicate this information elsewhere.

**Last Updated**: 2026-01-29
**Total Epics**: 16 (13 complete + 3 new)
**Total Stories**: 103 (76 legacy + 27 new)

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

### Completed Epics (13)

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

### New Epics (3) - Q1 2026

| Epic ID | Title | Stories | SP | Status | Sprint | Routes |
|---------|-------|---------|---:|--------|--------|--------|
| Epic 40-FE | Orders UI & WB Status History | 7 | 26 | 📋 Ready | 1-2 | `/orders` |
| Epic 53-FE | Supply Management UI | 8 | 34 | 📋 Ready | 3-4 | `/supplies`, `/supplies/:id` |
| Epic 51-FE | FBS Historical Analytics (365d) | 12 | 39 | 📋 Ready | 4-6 | `/analytics/orders`, `/settings/backfill` |

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

**Q1 2026 Routes** (planned):
- `/orders` - FBS Orders list & history (Epic 40-FE)
- `/supplies`, `/supplies/:id` - Supply management (Epic 53-FE)
- `/analytics/orders` - FBS Historical Analytics (Epic 51-FE)
- `/settings/backfill` - Admin backfill management (Epic 51-FE, Owner only)

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

| Story | Title | SP | Status | Owner |
|-------|-------|---:|--------|-------|
| 40.5-FE | History Timeline Components | 5 | 🚧 In Progress | - |
| 40.6-FE | Orders Analytics Dashboard | 5 | 🚧 In Progress | - |
| 40.7-FE | Integration & Polish | 2 | 🚧 In Progress | - |
| 51.1-FE | FBS Analytics Types | 2 | 🚧 In Progress | - |
| 51.2-FE | FBS Analytics Hooks | 3 | 🚧 In Progress | - |

**Sprint Goal**: Complete Epic 40-FE, start Epic 51-FE foundation

---

### Sprint 3 (Mar 3-14) - Supplies Foundation

| Story | Title | SP | Status | Owner |
|-------|-------|---:|--------|-------|
| 53.1-FE | Types & API Client | 2 | 📋 Ready | - |
| 53.2-FE | Supplies List Page | 5 | 📋 Ready | - |
| 53.3-FE | Create Supply Flow | 3 | 📋 Ready | - |
| 53.4-FE | Supply Detail Page | 5 | 📋 Ready | - |
| 51.3-FE | Extended Date Picker | 3 | 📋 Ready | - |

**Sprint Goal**: Supplies CRUD functional

---

### Sprint 4 (Mar 17-28) - Order Picker & Stickers

| Story | Title | SP | Status | Owner |
|-------|-------|---:|--------|-------|
| 53.5-FE | Order Picker Drawer | 8 | 📋 Ready | - |
| 53.6-FE | Close Supply & Stickers | 5 | 📋 Ready | - |
| 51.4-FE | FBS Trends Chart | 5 | 📋 Ready | - |

**Sprint Goal**: Complete supply workflow, FBS trends chart

---

### Sprint 5 (Mar 31 - Apr 11) - Analytics & Polish

| Story | Title | SP | Status | Owner |
|-------|-------|---:|--------|-------|
| 53.7-FE | Status Polling & Sync | 3 | 📋 Ready | - |
| 53.8-FE | E2E Tests & Polish | 3 | 📋 Ready | - |
| 51.5-FE | Trends Summary Cards | 2 | 📋 Ready | - |
| 51.6-FE | Seasonal Patterns | 5 | 📋 Ready | - |
| 51.7-FE | Period Comparison | 3 | 📋 Ready | - |
| 51.8-FE | FBS Analytics Page | 5 | 📋 Ready | - |

**Sprint Goal**: Complete Epic 53-FE, FBS analytics functional

---

### Sprint 6 (Apr 14-25) - Admin & Final

| Story | Title | SP | Status | Owner |
|-------|-------|---:|--------|-------|
| 51.9-FE | Hub Integration | 1 | 📋 Ready | - |
| 51.10-FE | Backfill Admin Types | 2 | 📋 Ready | - |
| 51.11-FE | Backfill Admin Page | 5 | 📋 Ready | - |
| 51.12-FE | E2E Tests | 3 | 📋 Ready | - |

**Sprint Goal**: Complete Epic 51-FE, all Q1 epics done

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

## Changelog

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
