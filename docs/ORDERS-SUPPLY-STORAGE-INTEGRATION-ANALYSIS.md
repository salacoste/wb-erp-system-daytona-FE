# Orders/Supply/Storage Integration Analysis

**Date:** 2026-01-30
**Status:** ✅ Backend Complete | 📋 Frontend Analysis Complete
**Scope:** Orders FBS, Supply Management, Paid Storage Analytics
**Related Epics:** Epic 40, Epic 51, Epic 53, Epic 24

---

## Executive Summary

Backend реализовал полную функциональность для Orders FBS, Supply Management и Paid Storage Analytics. Фронтенд требует интеграции 27 endpoint'ов across 3 модуля.

**Статус бэкенда:** ✅ Все critical endpoint'ы реализованы
**Статус фронтенда:** 📋 Требуется разработка 3 эпиков (99 SP total)

---

## Orders Module (Epic 40)

### Backend Endpoint Status

| Endpoint | Status | Frontend Integration |
|----------|--------|----------------------|
| `GET /v1/orders` | ✅ Complete | ⚠️ To verify |
| `GET /v1/orders/:orderId` | ✅ Complete | ❌ Not implemented |
| `GET /v1/orders/:orderId/history` | ✅ Complete | ❌ Not implemented |
| `GET /v1/orders/:orderId/wb-history` | ✅ Complete | ❌ Not implemented |
| `GET /v1/orders/:orderId/full-history` | ✅ Complete | ❌ Not implemented |
| `GET /v1/analytics/orders/velocity` | ✅ Complete | ❌ Not implemented |
| `GET /v1/analytics/orders/sla` | ✅ Complete | ❌ Not implemented |
| `POST /v1/orders/sync` | ✅ Complete | ❌ Not implemented |

### Key Features

**1. WB Native Status History (Story 40.9)**
- 40+ детальных статус-кодов WB API
- Расчёт длительности в каждом статусе
- Хронологическая сортировка
- Объединённая timeline (local + WB)

**2. Историческая аналитика заказов (Epic 51)**
- 365 дней аналитики (vs 30 дней раньше)
- Tiered resolution: daily (0-90d) → weekly (91-365d)
- Сезонные паттерны (monthly/weekly/quarterly)
- Сравнение периодов (MoM, QoQ, YoY)

### Frontend Requirements

**Epic 40-FE:** 26 SP (7 stories) - ✅ Complete (2026-01-29)
**Epic 51-FE:** 39 SP (12 stories) - 📋 Ready for Dev

#### Компоненты для разработки (Epic 40-FE):
- `/orders` route - Orders hub
- `OrdersTable` - Data table with sorting
- `OrderDetailsModal` - Modal with tabbed history
- `OrderHistoryTimeline` - Full merged history
- `WbHistoryTimeline` - WB-only view (40+ статусов)
- `LocalHistoryTimeline` - Local-only view
- `OrdersAnalyticsDashboard` - SLA/velocity widgets
- `SlaComplianceWidget` - SLA % с цветовой кодировкой
- `VelocityMetricsWidget` - Average confirmation/completion times
- `AtRiskOrdersCard` - At-risk orders list
- `OrderSyncStatus` - Sync indicator

#### Компоненты для разработки (Epic 51-FE):
- `/analytics/orders` route - FBS Orders Analytics
- `FbsTrendsChart` - Line chart (orders/revenue/cancellations)
- `SeasonalPatternsChart` - Bar charts (monthly/weekly/quarterly)
- `PeriodComparisonTable` - Side-by-side comparison
- `DataSourceIndicator` - Source badges (Реалтайм/Ежедневно/Еженедельно)
- `AggregationToggle` - Day/Week/Month switcher
- `DateRangePickerExtended` - 365-day picker
- `SeasonalInsightsCard` - Peak/low insights
- `TrendsSummaryCards` - Total, avg, rates

### Integration Gaps

**❌ Frontend не реализует:**
1. Orders UI module полностью отсутствует
2. WB Native Status History (40+ статусов) не интегрирован
3. Историческая аналитика (365 дней) недоступна
4. Сезонные паттерны не визуализированы
5. Сравнение периодов не реализовано

**⚠️ Фронтенд требования:**
- Requires `/orders` route
- Requires `/analytics/orders` route
- Requires 24 components for Epic 40-FE
- Requires 12 components for Epic 51-FE
- Requires integration of 8 API endpoints for orders
- Requires integration of 7 API endpoints for analytics

---

## Supply Management Module (Epic 53)

### Backend Endpoint Status

| Endpoint | Status | Frontend Integration |
|----------|--------|----------------------|
| `GET /v1/supplies` | ✅ Complete | ❌ Not implemented |
| `POST /v1/supplies` | ✅ Complete | ❌ Not implemented |
| `GET /v1/supplies/:id` | ✅ Complete | ❌ Not implemented |
| `POST /v1/supplies/:id/orders` | ✅ Complete | ❌ Not implemented |
| `DELETE /v1/supplies/:id/orders` | ✅ Complete | ❌ Not implemented |
| `POST /v1/supplies/:id/close` | ✅ Complete | ❌ Not implemented |
| `POST /v1/supplies/:id/stickers` | ✅ Complete | ❌ Not implemented |
| `GET /v1/supplies/:id/documents/:docType` | ✅ Complete | ❌ Not implemented |
| `POST /v1/supplies/sync` | ✅ Complete | ❌ Not implemented |

### Key Features

**1. Full Supply Lifecycle**
```
OPEN → CLOSED → DELIVERING → DELIVERED
  ↓                     ↓
CANCELLED            (auto-sync with WB)
```

**2. Batch Operations**
- Add up to 1000 orders at once
- Remove orders from OPEN supply
- Partial success handling

**3. Sticker Generation**
- PNG (standard printers)
- SVG (high quality)
- ZPL (Zebra thermal printers)

**4. Status Tracking**
- 5 supply statuses with color coding
- Automatic WB sync
- Manual sync trigger (rate limited: 1/5min)

### Frontend Requirements

**Epic 53-FE:** 34 SP (8 stories) - 📋 Ready for Dev

#### Компоненты для разработки:

**List Components (7):**
- `SuppliesTable` - Main table with status badges
- `SupplyStatusBadge` - Status indicator (blue/orange/purple/green/red)
- `SupplyFilters` - Filter controls (status, date)
- `SupplyRow` - Table row
- `SuppliesEmptyState` - Empty prompt
- `SuppliesLoadingSkeleton` - Loading state
- `CreateSupplyModal` - Create dialog

**Detail Components (10):**
- `SupplyHeader` - Info + status
- `SupplyStatusStepper` - Lifecycle progress
- `SupplyOrdersTable` - Orders in supply
- `SupplyDocumentsList` - Generated docs
- `OrderPickerDrawer` - Select orders (⚡ **Most Complex**)
- `OrderPickerTable` - Virtualized list (1000+ rows)
- `OrderPickerFilters` - Search/filter
- `CloseSupplyDialog` - Confirmation
- `StickerFormatSelector` - PNG/SVG/ZPL
- `StickerPreview` - Preview image
- `SyncStatusIndicator` - Sync status

### Integration Gaps

**❌ Frontend не реализует:**
1. Supply Management UI полностью отсутствует
2. `/supplies` route не существует
3. Order Picker с виртуализацией не реализован
4. Sticker generation (PNG/SVG/ZPL) не интегрирован
5. Status polling не настроен

**⚠️ Критические зависимости:**
- **Requires Epic 40.9-FE** (useOrders hook для Order Picker)
- Requires `react-window` package for virtualization
- Requires blob handling for document downloads

**⚠️ Technical Complexity:**
- Order Picker: 8 SP (most complex story)
- Virtualized list for 1000+ orders
- Multi-select checkboxes with batch operations
- Document download with blob handling
- Status polling with 30s intervals

---

## Storage Analytics Module (Epic 24)

### Backend Endpoint Status

| Endpoint | Status | Frontend Integration | Issues |
|----------|--------|----------------------|--------|
| `GET /v1/analytics/storage/by-sku` | ✅ Complete | ⚠️ Partial | Multi-brand filter bug (✅ Fixed) |
| `GET /v1/analytics/storage/top-consumers` | ✅ Complete | ⚠️ Partial | Empty data handling |
| `GET /v1/analytics/storage/trends` | ✅ Complete | ⚠️ Partial | Week range validation |
| `GET /v1/products?include_storage=true` | ✅ Complete | ⚠️ Partial | Storage fields in products |
| `POST /v1/imports/paid-storage` | ✅ Complete | ❌ Not implemented | Manual import trigger |

### Key Features

**1. Storage Analytics (3 endpoint'а)**
- `by-sku`: Per-SKU storage costs with filters
- `top-consumers`: Top-N products by storage cost
- `trends`: Weekly trends with metrics

**2. Storage in Products API**
- `include_storage=true` parameter
- Returns `storage_cost_daily_avg`, `storage_cost_weekly`, `storage_period`
- Combined with `include_cogs=true` for full profitability

**3. Data Sources**
| Source | Granularity | SKU Breakdown | Update Freq |
|--------|-------------|---------------|-------------|
| `weekly_payout_summary.storageCost` | Weekly total | ❌ No | Weekly (Mon 12:00 MSK) |
| `paid_storage_daily` | Daily per-SKU | ✅ Yes | Daily (06:00 MSK) |

**Data Accuracy:** 98.6% match (1-2% variance expected)

### Known Issues & Fixes

**Issue #37: Storage Endpoints 404** - ✅ RESOLVED
- **Problem:** Frontend page `/analytics/storage` returned 404
- **Fix:** Backend circular dependency fixed
- **Status:** All endpoints now return 200

**Issue #38: Empty Data Handling** - ✅ RESOLVED
- **Problem:** Frontend showed errors for empty periods
- **Fix:** Added `has_data: boolean` field to all responses
- **Status:** Frontend can show empty states instead of errors

**Issue #48: Multi-Brand Filter Bug** - ✅ RESOLVED
- **Problem:** Multi-select brands returned `has_data: false`
- **Fix:** Added `parseMultiValueFilter()` with IN clause logic
- **Status:** Works correctly: `WHERE brand IN ('Protape', 'Space Chemical')`

### Frontend Requirements

**Epic 24:** ✅ Backend Complete (5 stories, 43+ tests)
**Frontend:** ⚠️ Partially implemented

#### Реализовано:
- `src/app/(dashboard)/analytics/storage/page.tsx`
- `src/lib/api/storage-analytics.ts`
- `src/types/storage-analytics.ts`
- `src/hooks/useStorageAnalytics.ts`

#### Требует доработки:
1. **Empty State Handling** (Issue #38)
   - Использовать `has_data` field вместо проверки на пустой массив
   - Показывать информационные сообщения вместо ошибок

2. **Multi-Select Filters** (Issue #48)
   - Backend теперь поддерживает `brand=Protape,Space Chemical`
   - Frontend использует `MultiSelectDropdown` - работает корректно

3. **Storage in Products List** (Story 24.5)
   - Добавить колонку "Хранение" в таблицу товаров
   - Использовать `include_storage=true` параметр
   - Показывать `storage_cost_daily_avg`, `storage_cost_weekly`

### Integration Gaps

**❌ Frontend не реализует:**
1. Empty State handling для storage analytics
2. Storage cost column in products table
3. Per-SKU storage breakdown в weekly reports
4. Manual import trigger UI

**⚠️ Parameter Naming Convention:**
- Frontend sends: `week_start`, `week_end` (snake_case)
- Backend accepts: Both formats
- Documentation shows: `weekStart`, `weekEnd` (camelCase)

---

## Logistics & Tariffs (Epic 43)

### Backend Endpoint Status

| Endpoint | Status | Frontend Integration | Notes |
|----------|--------|----------------------|-------|
| `GET /v1/tariffs/warehouses` | ✅ Complete | ⚠️ Partial | Response wrapped in `{data: {warehouses}}` |
| `GET /v1/tariffs/warehouses-with-tariffs` | ✅ Complete | ❌ Not implemented | Inventory system |
| `GET /v1/tariffs/commissions` | ✅ Complete | ❌ Not implemented | 7346 categories |
| `GET /v1/tariffs/settings` | ✅ Complete | ❌ Not implemented | Global settings |
| `GET /v1/tariffs/acceptance/coefficients` | ✅ Complete | ❌ Not implemented | Supply system |
| `GET /v1/tariffs/acceptance/coefficients/all` | ✅ Complete | ❌ Not implemented | 14-day forecast |

### Two Tariff Systems

**⚠️ CRITICAL:** Wildberries has **TWO** different tariff systems:

| System | Purpose | Endpoint | Rates |
|---------|---------|----------|-------|
| **Inventory** | Actual storage costs | `/warehouses-with-tariffs` | Base (current) |
| **Supply** | 14-day planning | `/acceptance/coefficients/all` | Higher (20-60%) |

**When to use:**
- **Price Calculator** (current costs) → Inventory system
- **Price Calculator** (planning) → Supply system
- **Financial reports** → Inventory system
- **Supply planning** → Supply system

### Key Features

**1. Commission Rates (7346 categories)**
- FBO, FBS, DBS, EDBS types
- FBS commission 96.5% higher than FBO on average (+3.38%)
- Cache TTL: 24 hours

**2. Warehouses List (50 warehouses)**
- ID, name, city, federal district
- Coordinates, cargo type, delivery types
- Cache TTL: 24 hours

**3. Acceptance Coefficients (Supply System)**
- 14-day forward-looking forecast
- Date-specific coefficients
- Box types: Boxes (2), Pallets (5), Supersafe (6)
- Cache TTL: 1 hour
- Rate limit: 6 req/min (stricter than tariffs)

**4. Storage Fallback Logic**
- When WB API returns zero, backend uses defaults
- Default: `base_per_day_rub = 0.07 ₽`, `liter_per_day_rub = 0.05 ₽`
- Frontend doesn't need to implement fallback

### Frontend Requirements

**Epic 44-FE:** Price Calculator UI - 📋 Ready for Dev

#### Компоненты для разработки:
- `WarehouseSelector` - Dropdown with warehouses
- `CommissionCategorySelector` - Category dropdown (7346 options)
- `TariffDisplay` - Show current tariffs
- `AcceptanceCoefficientsDisplay` - Show 14-day forecast
- `StorageCostCalculator` - Calculate storage per day
- `LogisticsCostCalculator` - Calculate delivery cost

### Integration Gaps

**❌ Frontend не реализует:**
1. Price Calculator UI полностью отсутствует
2. Warehouse selector не интегрирован
3. Commission category dropdown не реализован
4. Acceptance coefficients display не показан
5. Tariff calculation logic не реализована

**⚠️ Warehouse ID Mapping:**
Different systems use different warehouse IDs:
- **Inventory ID**: 507 (Краснодар)
- **Supply ID**: 130744 (Краснодар Тихорецкая)

**Solution:** Use `/acceptance/coefficients/all` to discover valid SUPPLY warehouse IDs

---

## Recommendations

### Priority 1: Critical Path (Epic 40-FE → Epic 53-FE)

**Шаг 1: Implement Epic 40-FE (Orders Module)** - 26 SP
- **Почему:** Foundation for Supply Management (Epic 53-FE)
- **Что реализовать:**
  - Types & API Client (3 SP)
  - React Query Hooks (3 SP)
  - Orders List Page (5 SP)
  - Order Details Modal (3 SP)
  - History Timeline Components (5 SP)
  - Orders Analytics Dashboard (5 SP)
  - Integration & Polish (2 SP)
- **Зависимости:** Backend ✅ Complete
- **Сроки:** Sprint 1 (Feb 3-14), Sprint 2 (Feb 17-28)

**Шаг 2: Implement Epic 53-FE (Supply Management)** - 34 SP
- **Почему:** High business value, daily seller operations
- **Что реализовать:**
  - Types & API Client (2 SP)
  - Supplies List Page (5 SP)
  - Create Supply Flow (3 SP)
  - Supply Detail Page (5 SP)
  - **Order Picker Drawer** (8 SP) ⚡ Most Complex
  - Close Supply & Stickers (5 SP)
  - Status Polling & Sync (3 SP)
  - E2E Tests & Polish (3 SP)
- **Зависимости:** Requires Epic 40.9-FE (useOrders hook)
- **Сроки:** Sprint 3 (Mar 3-14), Sprint 4 (Mar 17-28)

**Шаг 3: Fix Storage Analytics (Epic 24)** - 5 SP
- **Почему:** Backend complete, frontend gaps exist
- **Что реализовать:**
  - Empty State Handling (2 SP)
    - Use `has_data` field from backend
    - Show informational messages instead of errors
  - Storage in Products List (2 SP)
    - Add "Хранение" column to products table
    - Use `include_storage=true` parameter
  - Manual Import UI (1 SP)
    - Button to trigger POST /v1/imports/paid-storage
    - Progress tracking
- **Зависимости:** Backend ✅ Complete
- **Сроки:** Sprint 1 (Feb 3-14)

### Priority 2: Enhancement (Epic 51-FE + Epic 43-FE)

**Шаг 4: Implement Epic 51-FE (FBS Historical Analytics)** - 39 SP
- **Почему:** 365-day analytics for business planning
- **Что реализовать:**
  - Types & API Module (2 SP)
  - FBS Analytics Hooks (3 SP)
  - Extended Date Range Picker (3 SP)
  - FBS Trends Chart (5 SP)
  - Trends Summary Cards (2 SP)
  - Seasonal Patterns Components (5 SP)
  - Period Comparison UI (3 SP)
  - FBS Orders Analytics Page (5 SP)
  - Analytics Hub Integration (1 SP)
  - Backfill Admin (9 SP)
  - E2E Tests (3 SP)
- **Зависимости:** Backend ✅ Complete
- **Сроки:** Sprint 5 (Mar 31 - Apr 11), Sprint 6 (Apr 14-25)

**Шаг 5: Implement Epic 43-FE (Price Calculator)** - TBD SP
- **Почему:** Complete price calculation with tariffs
- **Что реализовать:**
  - Warehouse Selector
  - Commission Category Selector
  - Tariff Display (Inventory vs Supply)
  - Acceptance Coefficients Display
  - Storage Cost Calculator
  - Logistics Cost Calculator
- **Зависимости:** Backend ✅ Complete
- **Сроки:** TBD

### Priority 3: Data Quality & Monitoring

**Шаг 6: Implement Discrepancy Tracking**
- **Почему:** Data sources may have 1-2% variance
- **Что реализовать:**
  - Compare `weekly_payout_summary.storageCost` vs `paid_storage_daily` sum
  - Show discrepancy badge in UI
  - Status: <3% (OK), 3-5% (warning), >5% (error)
- **Ссылка:** Request #52: Storage SKU Breakdown

**Шаг 7: Implement Status Polling for Supplies**
- **Почему:** Automatic WB sync status tracking
- **Что реализовать:**
  - Poll every 30s while CLOSED/DELIVERING
  - Stop polling on DELIVERED/CANCELLED
  - Show "Обновить статусы" button with countdown
  - Rate limit display (1 per 5 min)
- **Ссылка:** Epic 53-FE Story 53.7

---

## Open Questions

1. **Orders Analytics Backend Endpoint**
   - Status: "To verify"
   - Required: `GET /v1/orders` endpoint verification
   - Action: Check Swagger UI or test-api/14-orders.http

2. **WB Status Translations**
   - Question: Backend endpoint or frontend mapping?
   - Recommendation: Frontend mapping in `src/lib/wb-status-mapping.ts`
   - 40+ status codes with Russian labels

3. **Week Range Validation for Storage**
   - Frontend sends: `week_start`, `week_end` (snake_case)
   - Backend accepts: Both formats
   - Action: Update documentation to reflect both formats

4. **Warehouse ID Mapping**
   - Different systems use different IDs
   - Action: Use `/acceptance/coefficients/all` for SUPPLY IDs
   - Document mapping in code comments

---

## Success Metrics

### Completion Criteria

**Epic 40-FE (Orders Module):**
- [ ] `/orders` route accessible from sidebar
- [ ] Orders table with sorting and pagination
- [ ] Order details modal with 3 history tabs
- [ ] WB Native History showing 40+ status codes
- [ ] Full merged timeline with source badges
- [ ] SLA compliance widget (color-coded)
- [ ] Velocity metrics widget
- [ ] At-risk orders tracking
- [ ] E2E tests passing

**Epic 53-FE (Supply Management):**
- [ ] `/supplies` route accessible from sidebar
- [ ] Supplies table with status badges
- [ ] Create supply modal
- [ ] Supply detail page with stepper
- [ ] Order picker drawer with virtualization
- [ ] Batch add/remove orders (1000 max)
- [ ] Close supply dialog
- [ ] Sticker generation (PNG/SVG/ZPL)
- [ ] Document download (blob handling)
- [ ] Status polling (30s intervals)
- [ ] Manual sync button with rate limit
- [ ] E2E tests passing

**Epic 24 (Storage Analytics):**
- [ ] Empty state handling using `has_data`
- [ ] Multi-brand filter working (Issue #48 verified)
- [ ] Storage column in products table
- [ ] Per-SKU storage breakdown in weekly reports
- [ ] Manual import trigger UI
- [ ] Discrepancy tracking badge

**Epic 51-FE (FBS Analytics):**
- [ ] `/analytics/orders` route accessible
- [ ] 365-day date range picker
- [ ] Trends chart with 3 metrics
- [ ] Seasonal patterns (monthly/weekly/quarterly)
- [ ] Period comparison table
- [ ] Data source badges (tiered resolution)
- [ ] Backfill admin page (Owner only)
- [ ] E2E tests passing

**Epic 43-FE (Price Calculator):**
- [ ] Warehouse selector with 50 warehouses
- [ ] Commission category selector (7346 options)
- [ ] Tariff display (Inventory vs Supply)
- [ ] Acceptance coefficients display (14-day)
- [ ] Storage cost calculator
- [ ] Logistics cost calculator
- [ ] FBO/FBS toggle
- [ ] Box type selector (Boxes/Pallets/Supersafe)

---

## References

### Backend Documentation
- [Request #109: Epic 40 WB Native Status History API](./request-backend/109-epic-40-wb-native-status-history-api.md)
- [Request #110: Epic 51 FBS Historical Analytics API](./request-backend/110-epic-51-fbs-historical-analytics-api.md)
- [Request #111: Epic 53 Supply Management API](./request-backend/111-epic-53-supply-management-api.md)
- [Request #36: Epic 24 Paid Storage Analytics API](./request-backend/36-epic-24-paid-storage-analytics-api.md)
- [Request #37: Epic 24 Storage Endpoints Not Implemented](./request-backend/37-epic-24-storage-endpoints-not-implemented.md)
- [Request #38: Storage Analytics Improve Empty Data Handling](./request-backend/38-storage-analytics-improve-empty-data-handling.md)
- [Request #48: Storage Multi-Brand Filter Bug](./request-backend/48-storage-multi-brand-filter-bug.md)
- [Request #52: Storage SKU Breakdown for Weekly Reports](./request-backend/52-storage-sku-breakdown-for-weekly-reports.md)
- [Request #98: Warehouses & Tariffs Coefficients API](./request-backend/98-warehouses-tariffs-coefficients-api.md)
- [Request #98: Warehouses Tariffs Backend Response](./request-backend/98-warehouses-tariffs-BACKEND-RESPONSE.md)

### Frontend Epics
- [Epic 40-FE: Orders UI & WB Native Status History](./epics/epic-40-fe-orders-wb-history.md)
- [Epic 51-FE: FBS Historical Analytics UI](./epics/epic-51-fe-fbs-historical-analytics.md)
- [Epic 53-FE: Supply Management UI](./epics/epic-53-fe-supply-management.md)
- [Epic 24: Paid Storage by Article](../backend/docs/epics/epic-24-paid-storage-by-article.md)

### API Test Collections
- [test-api/14-orders.http](../test-api/14-orders.http)
- [test-api/16-supplies.http](../test-api/16-supplies.http)
- [test-api/18-tariffs.http](../test-api/18-tariffs.http)

### External References
- [WB Seller Portal - Logistics](https://seller.wildberries.ru/instructions/ru/ru/material/logistics-acceptance-warehouse-storage-costs)
- [WB API Docs - Tariffs](https://dev.wildberries.ru/openapi/wb-tariffs)
- [WB API Docs - OrdersFBW](https://dev.wildberries.ru/openapi/wb-fulfillment-supplies)

---

**Analysis Complete:** 2026-01-30
**Total Endpoints Analyzed:** 27 (Orders: 8, Supply: 9, Storage: 5, Tariffs: 6)
**Backend Status:** ✅ 100% Complete
**Frontend Status:** 📋 Requires 3 epics (99 SP total)
