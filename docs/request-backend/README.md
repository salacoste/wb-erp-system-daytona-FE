# Frontend → Backend Requests Index

Документация запросов от frontend команды к backend команде и ответов backend команды.

---

## ✅ Recently Resolved

### Request #87: Backend Response - imtId Field in SKU Mode ✅ **IMPLEMENTED**
**Date**: 2025-12-28
**Priority**: High
**Status**: ✅ **IMPLEMENTED** - Ready for frontend integration
**Component**: Backend API - Advertising Analytics (Epic 36)
**В ответ на**: [Request #86](./86-epic-36-sku-mode-imtid-field.md)

**Summary**: Backend реализовал добавление поля `imtId: number | null` в API response для режима `group_by='sku'`.

**Реализованные изменения**:
- ✅ Поле `imtId` теперь **обязательное** (не optional) - всегда присутствует в response
- ✅ Возвращает `number` для артикулов в склейке или `null` для одиночных артикулов
- ✅ Использует существующий JOIN с `products` таблицей
- ✅ **NO breaking changes** - backward compatible
- ✅ Unit tests updated and passing

**Frontend может теперь**:
- ✅ Показывать badge "Товар в склейке #328632" для дочерних артикулов (spend=0)
- ✅ Показывать badge "Главный в склейке #328632" для главных артикулов (spend>0)
- ✅ Объяснять почему ROAS/ROI = null (артикул в склейке, метрики на группу)
- ✅ Добавить кнопку "Показать метрики склейки" → переход на `group_by='imtId'` с фильтром

**TypeScript Type Update Required**:
```typescript
// BEFORE
imtId?: number | null;  // optional

// AFTER
imtId: number | null;   // required (всегда в response)
```

**Estimated Frontend Effort**: 2-3 hours (types + `ProductRowBadge` component + tests)

**Documentation**:
- **[87-epic-36-backend-response-imtid-sku.md](./87-epic-36-backend-response-imtid-sku.md)** ← **BACKEND RESPONSE & INTEGRATION GUIDE**
- **[86-epic-36-sku-mode-imtid-field.md](./86-epic-36-sku-mode-imtid-field.md)** ← Frontend request

---

### Request #86: Epic 36 - Добавить imtId в режиме group_by='sku' ✅ **RESOLVED**
**Date**: 2025-12-28
**Priority**: High (блокирует полную реализацию Epic 36 UX)
**Status**: ✅ **RESOLVED** - Backend implemented (Request #87)
**Component**: Backend API - Advertising Analytics (Epic 36)
**Related**: Request #82-85 (Epic 36 documentation chain)

**Summary**: Запрос на добавление поля `imtId` в API response для режима `group_by='sku'`.

**Backend Response**: ✅ **IMPLEMENTED** - See [Request #87](./87-epic-36-backend-response-imtid-sku.md)

**Frontend Action Required**: Integrate `ProductRowBadge` component (2-3 hours)

**Documentation**: [86-epic-36-sku-mode-imtid-field.md](./86-epic-36-sku-mode-imtid-field.md)

---

### Request #85: Epic 36 Production Status & Critical Bugfix ✅ **PRODUCTION READY**
**Date**: 2025-12-28
**Priority**: 🚨 **CRITICAL UPDATE** - Production ready after bugfix
**Status**: ✅ **PRODUCTION READY** - Frontend integration approved
**Component**: Backend API - Product Card Linking (Epic 36)
**Related**: Request #82 (Card Linking Investigation), Request #83 (API Contract), Request #84 (Frontend Guide)

**Summary**: Epic 36 **Product Card Linking** достиг production readiness после исправления критической ошибки WB API pagination.

**Critical Bugfix Applied (2025-12-28)**:
- 🐛 **Problem**: WB Content API rejected sync requests with `ValidationError` (HTTP 400)
- 🔧 **Fix**: Changed pagination limit from 1000 to **100 cards/batch** (WB API maximum)
- ✅ **Validated**: Production sync successful (47 products, 1.4s)
- ✅ **Impact on Frontend**: **NO breaking changes** - API contract unchanged

**Epic 36 Features** (Ready for Frontend Integration):
- ✅ `products` table populated with `imtId` (WB merged card identifier)
- ✅ Daily automatic sync at 06:00 MSK
- ✅ Analytics API supports `group_by=imtId` parameter
- ✅ Aggregated metrics for merged product groups (склейки)
- ✅ Manual sync endpoint: `POST /v1/imports/products/sync-imt-ids`
- ✅ Backward compatible with existing `group_by=sku` mode

**Frontend Integration Status**:
- ✅ API Contract: Request #83 (updated with bugfix info)
- ✅ Integration Guide: Request #84 (step-by-step plan)
- ✅ Estimated Effort: 3-4 hours development + 1-2 hours testing
- ✅ No breaking changes - safe to proceed

**PO Approval**: 10/10 ⭐⭐⭐⭐⭐ (All 26 acceptance criteria met)

**Documentation**:
- **[85-epic-36-production-status.md](./85-epic-36-production-status.md)** ← **PRODUCTION STATUS & BUGFIX DETAILS**
- **[83-epic-36-api-contract.md](./83-epic-36-api-contract.md)** ← **API CONTRACT** (TypeScript types, examples)
- **[84-epic-36-frontend-integration-guide.md](./84-epic-36-frontend-integration-guide.md)** ← **INTEGRATION GUIDE** (step-by-step)
- **[82-card-linking-product-bundles.md](./82-card-linking-product-bundles.md)** ← **PROBLEM CONTEXT**
- [docs/epics/epic-36-product-card-linking.md](../../../docs/epics/epic-36-product-card-linking.md) - Backend epic overview
- [docs/stories/epic-36/story-36.2-content-api-sync.md](../../../docs/stories/epic-36/story-36.2-content-api-sync.md) - Bugfix details
- [test-api/04-imports.http](../../../test-api/04-imports.http) - Sync endpoint examples
- [test-api/07-advertising-analytics.http](../../../test-api/07-advertising-analytics.http) - Analytics with groupBy

**Next Steps for Frontend**:
1. Review Request #83-84 documentation
2. Implement TypeScript types (`GroupByMode`, `MergedProduct`)
3. Add UI toggle `[По артикулам] [По склейкам]`
4. Create `MergedProductBadge` component
5. Write tests (unit, integration, E2E)

---

### Request #76: Efficiency Filter Implementation ✅ NEW
**Date**: 2025-12-24 → **Resolved**: 2025-12-26
**Priority**: 🟡 High - Feature Implementation
**Status**: ✅ **RESOLVED** - Backend complete, ready for frontend integration
**Component**: Backend API - Advertising Analytics Module
**Related**: Request #71 (Epic 33 Advertising Analytics), Story 33.4-FE (Efficiency Status Filter)

**Problem**: Backend rejected `efficiency_filter` query parameter with 400 BAD_REQUEST validation error, despite being documented in Request #71. Frontend already implemented UI for filtering but couldn't use it.

**Solution Implemented**: Server-side filtering by efficiency status
- ✅ Added `efficiency_filter` to DTO with enum validation
- ✅ Implemented filter logic in service (applied after classification, before sorting)
- ✅ Summary calculated on FILTERED items (accurate totals)
- ✅ Swagger documentation added
- ✅ Test cases added (test-api #11-12)

**Filter Options**:
| Value | Criteria | Use Case |
|-------|----------|----------|
| `all` | No filter (default) | Show all campaigns/SKUs |
| `excellent` | ROAS > 5, ROI > 1 | High performers |
| `good` | ROAS 3-5, ROI 0.5-1 | Profitable campaigns |
| `moderate` | ROAS 2-3, ROI 0.2-0.5 | Needs optimization |
| `poor` | ROAS 1-2, ROI 0-0.2 | Review needed |
| `loss` | ROAS < 1, ROI < 0 | Losing money |
| `unknown` | No profit data | Missing COGS |

**Example API Call**:
```http
GET /v1/analytics/advertising?from=2025-12-01&to=2025-12-23&efficiency_filter=loss
Authorization: Bearer <token>
X-Cabinet-Id: <cabinet-id>
```

**Frontend Impact**: ✅ No breaking changes - additive feature
- Remove client-side workaround if implemented
- Test with test-api examples #11-12
- Mark Story 33.4-FE as COMPLETE

**Performance**: < 1ms filter overhead, overall p95 < 500ms maintained

**Documentation**:
- **[76-efficiency-filter-not-implemented.md](./76-efficiency-filter-not-implemented.md)** ← **PROBLEM DESCRIPTION**
- **[76-efficiency-filter-not-implemented-backend.md](./76-efficiency-filter-not-implemented-backend.md)** ← **IMPLEMENTATION GUIDE**
- [test-api/07-advertising-analytics.http](../../../test-api/07-advertising-analytics.http) ← **API EXAMPLES** (#11-12)

---

### Request #78: Epic 35 Critical Bugfix & SDK v2.4.0 Upgrade ✅ CRITICAL FIX
**Date**: 2025-12-25
**Priority**: 🚨 **CRITICAL BUGFIX** + 🔄 **SDK UPGRADE**
**Status**: ✅ **RESOLVED** - Bug fixed, SDK upgraded, all tests passing
**Component**: Backend API - Advertising Analytics Service + SDK Migration
**Epic**: Epic 35 - Total Sales & Organic vs Ad-Attributed Revenue Split
**Story**: Story 35.7 - Critical Bug Fix: docType Filter Mismatch

**Problem**: Epic 35 deployed but ALL products showed `totalSales=0₽` in advertising analytics dashboard (100% impact).

**Root Cause**: Hybrid query used wrong `docType` filter value:
- **Used**: `docType: 'Продажа'` (Russian capitalized from `daily_sales_raw` convention)
- **Expected**: `docType: 'sale'` (English lowercase for `wb_finance_raw` table)
- **Result**: Query returned 0 rows → totalSales=0₽ for ALL SKUs

**Fix Applied** (80 min resolution):
```typescript
// Changed 3 locations in advertising-analytics.service.ts (lines 503, 582, 741)
docType: 'Продажа'  →  docType: 'sale'
```

**Results After Fix**:
| Metric | Before | After |
|--------|--------|-------|
| Total Sales | 0₽ ❌ | 1,079,457.71₽ ✅ |
| Organic Sales | 0₽ ❌ | 939,203.71₽ ✅ |
| Organic % | 0% ❌ | 87.01% ✅ |
| Ad Revenue | 140,254₽ ✅ | 140,254₽ ✅ |

**SDK v2.4.0 Upgrade**:
- ✅ Upgraded from v2.3.2 → v2.4.0
- ✅ Type 9 API compliance verified
- ✅ No deprecated methods used (0/4)
- ✅ No migration required - already using recommended APIs
- ✅ Deadline: February 2, 2026 - no action needed

**Frontend Impact**: ✅ No breaking changes - all Epic 35 fields remain additive and backward compatible.

**Performance**: Hybrid query maintains **17-37ms p95** latency (27× better than target).

**Documentation**:
- **[78-epic-35-bugfix-sdk-upgrade.md](./78-epic-35-bugfix-sdk-upgrade.md)** ← **FULL DETAILS & FAQ**
- [docs/SDK-MIGRATION-V2.4.0-ANALYSIS.md](../../../docs/SDK-MIGRATION-V2.4.0-ANALYSIS.md) - Migration analysis
- [docs/stories/epic-35/35.7-critical-bugfix-doctype-mismatch.md](../../../docs/stories/epic-35/35.7-critical-bugfix-doctype-mismatch.md) - Detailed bugfix
- [docs/ADVERTISING-ANALYTICS-GUIDE.md](../../../docs/ADVERTISING-ANALYTICS-GUIDE.md) - v1.4 (updated)
- [docs/CHANGELOG.md](../../../docs/CHANGELOG.md) - SDK upgrade + bugfix entries

---

### Request #73: Telegram Notifications API (Epic 34) ✅ NEW
**Date**: 2025-12-24
**Priority**: 🆕 **NEW FEATURE**
**Status**: ✅ **COMPLETE** - Backend + Bot Integration deployed
**Component**: Backend API - Notifications Module + Telegram Bot
**Epic**: Epic 34 - Telegram Notifications

**Summary**: Система push-уведомлений в Telegram о выполнении фоновых задач.

**Key Features**:
- 📱 Привязка Telegram-аккаунта через 6-значный код
- ⚙️ Настройка предпочтений (типы событий, язык, тихие часы)
- 🤖 Telegram bot с командами (/start, /status, /settings, /help)
- 🌍 Multi-language support (ru/en)
- 🔕 Quiet hours с timezone support
- ⏱️ Rate limiting (30 msg/s global, 1 msg/s per chat)

**API Endpoints**:
```http
POST /v1/notifications/telegram/bind        # Запустить привязку
GET  /v1/notifications/telegram/status      # Проверить статус
DELETE /v1/notifications/telegram/unbind    # Отвязать Telegram
GET  /v1/notifications/preferences          # Получить настройки
PUT  /v1/notifications/preferences          # Обновить настройки
POST /v1/notifications/test                 # Тест-уведомление
```

**Event Types**:
| Type | Default | Описание |
|------|---------|----------|
| `task_completed` | ✅ | Задача успешно выполнена |
| `task_failed` | ✅ | Задача завершилась с ошибкой |
| `task_stalled` | ❌ | Задача зависла (>30 min) |
| `daily_digest` | ✅ | Ежедневный дайджест (08:00) |

**Bot Commands**:
| Команда | Описание |
|---------|----------|
| `/start <code>` | Привязать аккаунт |
| `/status` | Статус подключения |
| `/settings` | Настройки (inline keyboard) |
| `/help` | Список команд |

**Documentation**:
- **[73-telegram-notifications-epic-34.md](./73-telegram-notifications-epic-34.md)** ← **FRONTEND INTEGRATION GUIDE**
- [TELEGRAM-NOTIFICATIONS-GUIDE.md](../../../docs/TELEGRAM-NOTIFICATIONS-GUIDE.md) - Complete guide
- [test-api/13-notifications.http](../../../test-api/13-notifications.http) - API examples

**Frontend TODO**:
- [ ] Создать `/settings/notifications` страницу
- [ ] Реализовать привязку Telegram (с polling)
- [ ] Добавить панель настроек уведомлений
- [ ] Показывать статус привязки в UI

---

### Request #89: Telegram Notifications Integration Guide ✅ COMPLETE
**Date**: 2025-12-30
**Priority**: 📚 **DOCUMENTATION**
**Status**: ✅ **COMPLETE** - Frontend integration guide
**Component**: Frontend Documentation - Epic 34
**Related**: Request #73 (Epic 34 API), Request #90 (Architecture)

**Summary**: Полное руководство по интеграции Telegram уведомлений во фронтенде.

**Content**:
- TypeScript типы для TelegramBinding и NotificationPreferences
- React hooks: `useTelegramBinding`, `useNotificationPreferences`, `useQuietHours`
- API клиент с методами для всех endpoints
- UI компоненты: TelegramBindingCard, PreferencesPanel, QuietHoursSelector
- Примеры использования и best practices

**Documentation**:
- **[89-telegram-notifications-integration.md](./89-telegram-notifications-integration.md)** ← **IMPLEMENTATION GUIDE**

---

### Request #90: Telegram Notifications System Architecture ✅ COMPLETE
**Date**: 2025-12-30
**Priority**: 📚 **DOCUMENTATION**
**Status**: ✅ **COMPLETE** - System architecture guide
**Component**: Frontend Documentation - Epic 34
**Related**: Request #73 (Epic 34 API), Request #89 (Integration)

**Summary**: Полная архитектурная документация системы Telegram уведомлений для фронтенд команды.

**Key Sections**:
- 🏗️ System Architecture - Backend vs Frontend responsibilities (Backend 100% content ownership)
- 📡 Event System - event types, flow, preference checks
- 📊 Notification Structure - message format, templates, variables
- 🔧 Task Types & Metrics - detailed task-specific metrics (2025-12-30 update)
- 📝 Message Templates - Handlebars syntax, formatting, emojis
- ⚙️ User Preferences API - all endpoints with examples
- 📱 Telegram Binding Flow - step-by-step process
- 🔍 Real-time Status - notification log, history API
- 🛠️ Troubleshooting - common issues and solutions

**Key Features Documented**:
- ✅ Task-specific detailed metrics (products fetched/added/removed for products_sync)
- ✅ Advertising sync metrics (campaigns/stats/costs for adv_sync)
- ✅ Storage import metrics (records imported for paid_storage_import)
- ✅ Product linking metrics (products/groups for product_imt_sync)
- ✅ Emoji-enhanced task type labels (📦📢📊🔗💰)
- ✅ Number formatting with thousands separators
- ✅ Multi-language support (ru/en)
- ✅ Rate limiting (60 messages/hour per chat)
- ✅ Quiet hours with timezone support

**Documentation**:
- **[90-telegram-notifications-system-architecture.md](./90-telegram-notifications-system-architecture.md)** ← **ARCHITECTURE GUIDE**
- [NOTIFICATION-IMPROVEMENTS-2025-12-30.md](../../../docs/notifications/NOTIFICATION-IMPROVEMENTS-2025-12-30.md) - Backend improvements
- [Epic 34](../../../docs/epics/epic-34-telegram-notifications.md) - Epic overview

**Frontend Integration Checklist**:
- [ ] Review architecture documentation (responsibilities, event system)
- [ ] Implement TypeScript types (Request #89)
- [ ] Create React hooks for binding and preferences (Request #89)
- [ ] Build UI components (binding card, preferences panel)
- [ ] Add notification history view (optional)
- [ ] Test with real Telegram bot

---

### Request #75: Advertising Revenue Always Zero ✅ FIXED
**Date**: 2025-12-24
**Priority**: 🔴 **CRITICAL BUG**
**Status**: ✅ **FIXED** - Backend fix deployed
**Component**: Backend API - Advertising Analytics Service
**Related**: Request #71 (Epic 33)

**Problem**: Backend returned `revenue: 0` for ALL items, causing:
- ROAS always 0.0x (should be revenue / spend)
- All items classified as "loss" even with ROI > 100%
- Example: Items with profit 77,844₽ (ROI 131.88%) shown as "Убыток" ❌

**Root Cause**: Backend incorrectly queried `wb_finance_raw` table (general sales NOT ad-attributed) instead of using WB API `orderSum` field (actual ad revenue).

**Fix Applied** (commit `a9931cf`):
```typescript
// ❌ BEFORE: Wrong source (wb_finance_raw)
const revenue = revenueMap.get(stat.nmId) || 0;

// ✅ AFTER: Correct source (WB API orderSum)
const revenue = stat.orderSum;
```

**Impact**:
- ✅ Revenue correctly populated from WB API
- ✅ ROAS calculated correctly (revenue / spend)
- ✅ Efficiency status correct (excellent/good/moderate/poor/loss)
- ✅ Performance improved (removed unnecessary DB query)

**Verification Results**:
```
Sample: nmId 193775258 → Revenue: 7975₽, Spend: 932.91₽, ROAS: 8.55x ✅
Sample: nmId 255211393 → Revenue: 4848₽, Spend: 136.14₽, ROAS: 35.61x ✅
Average ROAS: 9.38x ✅
```

**Documentation**:
- **[75-advertising-revenue-zero.md](./75-advertising-revenue-zero.md)** ← **PROBLEM + SOLUTION**

---

### Request #71: Advertising Analytics API (Epic 33) ✅ UPDATED 2025-12-24
**Date**: 2025-12-22 → **Updated**: 2025-12-24
**Priority**: 🆕 **NEW FEATURE** + 🔴 **CRITICAL FIX**
**Status**: ✅ **COMPLETE** + ✅ **Stats Sync Fixed**
**Component**: Backend API - Analytics Module + WB Promotion SDK
**Epic**: Epic 33 - Advertising Analytics
**SDK Version**: daytona-wildberries-typescript-sdk **v2.3.1+**

**Latest Update (2025-12-24)**: ✅ **Critical stats sync fix** applied - eliminated "nmId: undefined" errors.

**Root Causes Fixed**:
1. ✅ Missing ADV_SYNC queue routing
2. ✅ Wrong WB API parameters (v2 → v3 migration)
3. ✅ Optional chaining hiding API errors
4. ✅ Parser not handling nested response: `stats[].days[].apps[].nms[].nmId`

**Changes**:
- **SDK**: Upgraded v2.3.0 → v2.3.1 (proper TypeScript types for nested responses)
- **WB API**: Fixed fullstats parameters `{ids, beginDate, endDate}` (batch up to 100 campaigns)
- **Queue**: Added ADV_SYNC queue injection and routing
- **Parser**: Updated for nested structure with nms[] array iteration
- **Rate Limits**: 3 req/min (20s interval)

**Verification Results**:
- ✅ 54 stats records successfully synced
- ✅ 10 unique SKUs tracked
- ✅ Zero "nmId: undefined" errors

**Backend Commits**:
- `4c37521` - SDK upgrade and stats parser fix
- `180fd13` - Documentation updates
- `716ab52` - Test-API documentation updates

**Documentation**:
- **[71-advertising-analytics-epic-33.md](./71-advertising-analytics-epic-33.md)** ← **UPDATED WITH v2.3.1 DETAILS**
- [ADVERTISING-ANALYTICS-GUIDE.md](../../../docs/ADVERTISING-ANALYTICS-GUIDE.md) - Complete guide with troubleshooting
- [test-api/07-advertising-analytics.http](../../../test-api/07-advertising-analytics.http) - API examples

📖 **Troubleshooting**: [ADVERTISING-ANALYTICS-GUIDE.md#stats-sync-fix](../../../docs/ADVERTISING-ANALYTICS-GUIDE.md#problem-stats-sync-failing-with-nmid-undefined-fixed-2025-12-24)

---

## 🟡 Pending Requests



### Request #61: WB Column Rename - Paid Acceptance → Operations at Acceptance ✅ CODE READY
**Date**: 2024-12-15
**Priority**: 🔴 HIGH - Breaking Change
**Status**: ✅ **CODE READY** - Backward-compatible synonyms added
**Effective Date**: 2024-12-22 (WB reports)
**Component**: Backend - Excel Import Parser
**File**: [61-wb-column-rename-dec-2024.md](./61-wb-column-rename-dec-2024.md)

**Summary**: Wildberries переименовал категории затрат в финансовых отчётах (с 22.12.2024):

| Старое название | Новое название |
|-----------------|----------------|
| `Платная приёмка` (столбец) | `Операции при приёмке` |
| `Платная приёмка` (reason) | `Обработка товара` |
| `Платная приёмка МП по коробам` | `Обработка товара МП по коробам` |
| `Номер короба для платной приёмки` | `Номер короба для обработки товара` |

**Backend Changes**:
- ✅ `src/imports/column-mapper/synonym-dictionary.const.ts` - Added new synonyms
- ✅ `src/imports/column-mapper/required-columns.const.ts` - Added comments
- ✅ `CLAUDE.md` - Updated Column Synonym Dictionary section

**API Impact**: ❌ **NONE** - Internal field names unchanged (`paid_acceptance_cost`)

📖 **Full Documentation**: `docs/WB-COLUMN-RENAME-2024-12-22.md`

---

### Request #58: Агрегация retail_price_total (Сумма по ВАШИМ ценам) 🟡 ОЖИДАЕТ
**Date**: 2025-12-14
**Priority**: 🔴 HIGH - Core Financial Feature
**Status**: 🟡 **ОЖИДАЕТ РЕАЛИЗАЦИИ**
**Component**: Backend - Weekly Aggregation
**Related**: PM Request #02 (Financial Data Presentation Concept)
**File**: [58-retail-price-total-aggregation.md](./58-retail-price-total-aggregation.md)

**Бизнес-потребность**: Показать владельцу бизнеса полную воронку продаж, начиная с его установленной цены (до скидок WB).

**Новые поля**:
- `retail_price_total` = SUM(retail_price) WHERE doc_type='sale' — сумма по ВАШИМ ценам
- `retail_price_returns` = SUM(retail_price) WHERE doc_type='return' — возвраты по ВАШИМ ценам

**Зачем**: Дельта `retail_price_total - sales_gross` покажет, сколько "съела" скидка WB (СПП/акции).

---

## ✅ Recently Resolved

### Request #64: Per-SKU Margin Missing Expenses - Complete SKU Financial Analytics ✅ IMPLEMENTED
**Date**: 2025-12-18
**Priority**: 🔴 High - Core Financial Feature
**Status**: ✅ **IMPLEMENTED** - Epic 31 Complete (26 unit tests)
**Component**: Backend API - Analytics Module (Epic 31)
**Related**: Request #47 (Epic 26 Operating Profit), Request #60 (Per-SKU Ops Costs), Epic 24 (Paid Storage)
**File**: [64-per-sku-margin-missing-expenses-backend-response.md](./64-per-sku-margin-missing-expenses-backend-response.md)

**Problem Solved**: Frontend requested complete per-SKU financial breakdown including all operating expenses, storage costs from paid_storage_daily, and profitability classification.

**New API Endpoint**:
```http
GET /v1/analytics/sku-financials?week=2025-W49&cabinetId=<uuid>
Authorization: Bearer <token>
X-Cabinet-Id: <uuid>
```

**Response Structure**:
```json
{
  "items": [{
    "nmId": "173589742",
    "productName": "Tape Диспенсер...",
    "revenue": { "gross": 1500, "net": 1200 },
    "costs": {
      "cogs": 300, "logistics": 150, "storage": 25,
      "penalties": 0, "paidAcceptance": 0
    },
    "visibility": { "commission": 180, "acquiring": 15 },
    "profit": {
      "gross": 900,          // net - cogs
      "operating": 725,      // gross - logistics - storage - penalties - acceptance
      "operatingMarginPct": 60.42
    },
    "profitabilityStatus": "excellent",  // >25% = excellent
    "missingCogs": false
  }],
  "summary": { "totalItems": 34, "withCogs": 32, "withoutCogs": 2 },
  "meta": { "week": "2025-W49", "cacheHit": false }
}
```

**Key Design Decisions**:
| Aspect | Implementation |
|--------|----------------|
| Storage source | `paid_storage_daily` (Epic 24), NOT `wb_finance_raw` |
| Commission/Acquiring | **Visibility only** — NOT operating expenses (already in net_for_pay) |
| Operating Profit | `grossProfit - logistics - storage - penalties - paidAcceptance` |
| COGS lookup | Week Midpoint Strategy (Thursday) |
| Cache | Redis 30min TTL, event-based invalidation |

**Profitability Classification**:
| Status | Margin % | Color |
|--------|----------|-------|
| excellent | > 25% | 🟢 Green |
| good | 15-25% | 🟡 Light Green |
| warning | 5-15% | 🟠 Yellow |
| critical | 0-5% | 🟠 Orange |
| loss | < 0% | 🔴 Red |
| unknown | N/A (no COGS) | ⚪ Gray |

**Documentation**:
- **[64-per-sku-margin-missing-expenses-backend-response.md](./64-per-sku-margin-missing-expenses-backend-response.md)** ← **FRONTEND INTEGRATION GUIDE**
- [Epic 31 Documentation](../../../docs/epics/epic-31-complete-per-sku-financial-analytics.md)
- [test-api/06-analytics-advanced.http](../../../test-api/06-analytics-advanced.http) ← **API Examples**

---

### Request #62: Storage Data Sources Comparison Guide ✅ DOCUMENTATION
**Date**: 2025-12-16
**Priority**: 📚 Documentation
**Status**: ✅ **COMPLETE** - Integration guide published
**Component**: Frontend Integration Guide
**Related**: Request #36 (Epic 24 Storage API), Request #51 (paid-storage-import)
**File**: [62-storage-data-sources-comparison.md](./62-storage-data-sources-comparison.md)

**Summary**: Руководство по работе с двумя источниками данных о хранении:

| Source | Table | Use Case |
|--------|-------|----------|
| **Storage API** | `paid_storage_daily` | Детализация по SKU, топ потребителей, тренды |
| **Weekly Reports** | `weekly_payout_summary` | Финансовая сводка, payout_total |

**Key Finding**: Оба источника показывают **одинаковые суммы** (~100% match):
| Week | Weekly Report | Storage API | Match |
|------|---------------|-------------|-------|
| W49 | 1,923.34₽ | 1,923.38₽ | 100.00% |
| W48 | 1,849.95₽ | 1,850.21₽ | 100.01% |
| W47 | 1,763.35₽ | 1,763.75₽ | 100.02% |
| W46 | 1,849.69₽ | 1,849.85₽ | 100.01% |

**Documentation includes**:
- API endpoints for both sources
- TypeScript types
- React hooks examples
- UI integration examples
- When to use which source

---

### Request #59: Loyalty Fields Verification Against WB Dashboard ✅ VERIFIED
**Date**: 2025-12-14
**Priority**: 🟢 Low - Verification/Documentation
**Status**: ✅ **VERIFIED** - All loyalty fields match WB Dashboard exactly
**Component**: Backend API - Analytics Module
**Related**: Request #51 (payout formula), Request #57 (wb_sales_gross)
**File**: [59-loyalty-fields-verification.md](./59-loyalty-fields-verification.md)

**Summary**: Full verification of loyalty fields against WB Dashboard for W49:

| Field | WB Dashboard | Backend | Match |
|-------|--------------|---------|-------|
| Стоимость участия в лояльности | 0 | `loyalty_fee` = 0 | ✅ |
| Сумма за баллы лояльности | 0 | `loyalty_points_withheld` = 0 | ✅ |
| В т.ч. Компенсация скидки | 336₽ | `loyalty_compensation` = 336₽ | ✅ |

**Key Finding**: `loyalty_compensation` is shown as "В том числе" (including) under "Продажа" — it's **already included in `gross`**, NOT a separate addition to payout_total.

**Conclusion**:
- ✅ Current formula is correct — loyalty fields are informational only
- ✅ No changes needed to payout_total calculation
- ✅ 100% match with WB Dashboard

---

### Request #57: WB Dashboard Exact Match Fields (`wb_sales_gross`) ✅ IMPLEMENTED
**Date**: 2025-12-13
**Priority**: 🟡 Medium - UX Enhancement
**Status**: ✅ **IMPLEMENTED** - Backend + Frontend Complete
**Component**: Backend API - Analytics Module + Frontend Integration
**Related**: PM Request #01, Request #41 (sales/returns), Request #51 (payout formula)
**File**: [57-wb-dashboard-exact-match-fields.md](./57-wb-dashboard-exact-match-fields.md)

**Problem Solved**: Показатель "Продажи" теперь **точно совпадает** с WB Dashboard:
- `wb_sales_gross` = SUM(gross) WHERE doc_type='sale' — **точное соответствие WB "Продажа"**
- `wb_returns_gross` = SUM(gross) WHERE doc_type='return' — **точное соответствие WB "Возврат"**

**New API Fields**:
```json
{
  "summary_rus": {
    "wb_sales_gross": 131134.76,      // ✅ WB Dashboard "Продажа" exact
    "wb_returns_gross": 809.00        // ✅ WB Dashboard "Возврат" exact
  },
  "summary_total": {
    "wb_sales_gross_total": 135285.09,  // RUS + EAEU
    "wb_returns_gross_total": 809.00
  }
}
```

**Verification (W49)**:
| Field | API Value | WB Dashboard | Match |
|-------|-----------|--------------|-------|
| wb_sales_gross | 131,134.76₽ | "Продажа" | ✅ 100% |
| wb_returns_gross | 809.00₽ | "Возврат" | ✅ 100% |

---

### Request #56: WB Services Expenses Visibility (Реклама, Джем, Прочие сервисы) ✅ DEPLOYED
**Date**: 2025-12-13
**Priority**: 🟡 Medium - Financial Visibility Gap
**Status**: ✅ **DEPLOYED** - Backend + Frontend Complete
**Component**: Backend API - Analytics Module + Frontend Integration
**Related**: Request #51 (wb_commission_adj), Technical Debt (commission-separation.md)
**File**: [56-wb-services-expenses-visibility.md](./56-wb-services-expenses-visibility.md) | [56-wb-services-breakdown.md](./56-wb-services-breakdown.md)

**Problem Solved**: Расходы на **рекламу (WB.Promotion)**, **подписку Джем** и **прочие сервисы WB** теперь **ВИДНЫ** в UI (ранее были скрыты в `other_adjustments_net`).

**Backend Implementation** (2025-12-13):
- ✅ Added 4 new fields to `weekly_payout_summary` and `weekly_payout_total` tables
- ✅ SQL CASE statements with `bonus_type_name` pattern matching
- ✅ API endpoints return `wb_services_cost`, `wb_promotion_cost`, `wb_jam_cost`, `wb_other_services_cost`
- ✅ Cabinet Summary includes `wb_services_breakdown` object

**Frontend Integration** (2025-12-13):
- ✅ `src/hooks/useDashboard.ts` - Added WB services fields to `FinanceSummary` interface
- ✅ `src/types/analytics.ts` - Added WB services fields to `CabinetSummaryTotals` interface
- ✅ `src/hooks/useExpenses.ts` - Added WB.Продвижение, Джем, Прочие сервисы WB categories
- ✅ `src/components/custom/ExpenseChart.tsx` - New colors for WB services categories
- ✅ `src/components/custom/FinancialSummaryTable.tsx` - New "Сервисы WB" section with breakdown
- ✅ `src/components/custom/PnLWaterfall.tsx` - WB services breakdown in "Прочие удержания" section

**Example Data (W49)**:
| Service | Amount (₽) | Pattern |
|---------|------------|---------|
| WB.Promotion | 32,073 | `Оказание услуг «WB Продвижение»` |
| Джем | 18,990 | `Предоставление услуг по подписке «Джем»` |
| **Total** | **51,063** | = other_adjustments_net |

**Documentation**: [56-wb-services-breakdown.md](./56-wb-services-breakdown.md)

---

### Request #51: WB Commission Adjustment Missing from Payout Formula ✅ FIXED
**Date**: 2025-12-12
**Priority**: 🔴 Critical - Financial Calculation Error
**Status**: ✅ **FIXED** - Formula corrected, 100% WB Dashboard match
**Component**: Backend API - Analytics Module
**Related**: Request #49 (payout_total fix), Request #43 (WB Dashboard alignment)
**File**: [51-wb-commission-adj-payout.md](./51-wb-commission-adj-payout.md)

**Problem**: `payout_total` was missing "Корректировка ВВ" deduction, causing **2,153.28₽ discrepancy** with WB Dashboard for W49.

**Root Cause**:
1. Formula didn't subtract `wbCommissionAdj`
2. Aggregator summed ALL `commission_other` instead of only `reason='Удержание'`

**Fix Applied**:
```typescript
// src/aggregation/formulas/payout-total.formula.ts
payout_total = toPayGoods - logistics - storage - acceptance - penalties - otherAdjustments - wbCommissionAdj

// src/aggregation/weekly-payout-aggregator.service.ts (line 302-304)
SUM(CASE WHEN reason = 'Удержание' THEN ABS(commission_other) ELSE 0 END) as wb_commission_adj
```

**Verification (W49)**:
| Report | WB Dashboard | Backend | Match |
|--------|--------------|---------|-------|
| Основной | 53,907.27₽ | 53,907.27₽ | ✅ 100% |
| По выкупам | 3,034.09₽ | 3,034.09₽ | ✅ 100% |
| **ИТОГО** | **56,941.36₽** | **56,941.36₽** | ✅ 100% |

**Additional Verification (W47 - 17-23 Nov 2025)**:
| Report | WB Dashboard | Backend | Match |
|--------|--------------|---------|-------|
| Основной | 132,213.73₽ | 132,213.73₽ | ✅ 100% |
| По выкупам | 6,767.95₽ | 6,767.95₽ | ✅ 100% |
| **ИТОГО** | **138,981.68₽** | **138,981.68₽** | ✅ 100% |

**⚠️ commission_other Filtering** (Critical):
```sql
-- CORRECT: Only reason='Удержание'
SUM(CASE WHEN reason = 'Удержание' THEN ABS(commission_other) ELSE 0 END) as wb_commission_adj

-- WRONG: All commission_other (double-counting!)
SUM(ABS(commission_other)) as wb_commission_adj
```

| reason | Include? | Why |
|--------|----------|-----|
| Продажа | ❌ NO | Already in `total_commission_rub` |
| Возврат | ❌ NO | Already in `total_commission_rub` |
| Возмещение за ПВЗ | ❌ NO | This is INCOME, not expense |
| **Удержание** | ✅ YES | Real deduction = WB "Корректировка ВВ" |

📖 **Full Documentation**: [51-wb-commission-adj-payout.md](./51-wb-commission-adj-payout.md) | [docs/WB-DASHBOARD-METRICS.md](../../../docs/WB-DASHBOARD-METRICS.md)

---

### Request #50: Logistics Cost Discrepancy with WB Dashboard ✅ ROOT CAUSE IDENTIFIED
**Date**: 2025-12-07
**Priority**: 🟢 Low - Informational (Root Cause Found)
**Status**: ✅ **RESOLVED** - WB Dashboard Platform Fee Identified
**Component**: Backend API - Analytics Module
**Related**: Request #49 (payout_total fix)
**File**: [50-logistics-cost-discrepancy.md](./50-logistics-cost-discrepancy.md)

**Root Cause**: WB Dashboard adds **~1.47% hidden platform fee** to logistics costs that is NOT present in Excel/API data.

**Evidence** (W42):
| Metric | Our DB (Excel/API) | × 1.01467 | WB Dashboard | Diff |
|--------|-------------------|-----------|--------------|------|
| Total | 46,962.87₽ | 47,653.22₽ | 47,652.04₽ | **1.18₽** |

**Multiplier by Report Type**:
| Report Type | Our DB | WB Dashboard | Multiplier |
|-------------|--------|--------------|------------|
| Основной (RUS) | 44,839.91₽ | 45,381.57₽ | **+1.21%** |
| По выкупам (EAEU) | 2,122.96₽ | 2,270.47₽ | **+6.95%** |
| **Weighted Avg** | | | **+1.47%** |

**Resolution**: Document as known difference. Our data correctly reflects Excel/API - no code change needed.

---

### Request #49: Payout Total Formula Bug - Wrong Base Value ✅ FIXED
**Date**: 2025-12-07
**Priority**: 🔴 Critical - Financial Calculation Error
**Status**: ✅ **FIXED** - Formula corrected, all weeks recalculated
**Component**: Backend API - Analytics Module
**File**: [49-payout-total-formula-bug.md](./49-payout-total-formula-bug.md)

**Problem**: `payout_total` used wrong base value (`saleGross - totalCommissionRub` instead of `toPayGoods`), causing **~100K₽ discrepancy** with WB Dashboard.

**Root Cause**:
```typescript
// WRONG (before):
payout = saleGross - totalCommissionRub - logistics - storage - other

// CORRECT (after):
payout = toPayGoods - logistics - storage - paidAcceptance - penalties - other
```

**Key Insight**: `toPayGoods ≠ saleGross - totalCommissionRub` (difference can be >100K₽)

**Fix Applied**:
1. ✅ Updated formula in `src/aggregation/formulas/payout-total.formula.ts`
2. ✅ Updated 11 unit tests - all passing
3. ✅ Recalculated 26 WeeklyPayoutSummary records across 13 weeks
4. ✅ Verified against WB Dashboard (W42: diff reduced from 139K to 689₽)

---

### Request #48: Storage Analytics Multi-Brand Filter Bug ✅ FIXED
**Date**: 2025-12-06
**Priority**: 🔴 High - Feature Not Working
**Status**: ✅ **FIXED** - Backend updated with IN clause support
**Component**: Backend API - Storage Analytics Module
**File**: [48-storage-multi-brand-filter-bug.md](./48-storage-multi-brand-filter-bug.md)

**Problem**: Multi-brand selection (e.g., "Protape,Space Chemical") returned no results - backend was matching literal string instead of parsing into array.

**Solution**:
- Added `parseMultiValueFilter()` helper to split comma-separated values
- Refactored `getStorageBySku()` to use `IN` clause for multi-value brand/warehouse filters
- Uses `Prisma.join()` for parameterized queries (SQL injection safe)

**Files Changed**:
- `src/analytics/services/storage-analytics.service.ts`
- `src/analytics/dto/query/storage-by-sku-query.dto.ts`

---

### Request #47: Epic 26 - Per-SKU Operating Profit & Expense Tracking ✅ COMPLETE
**Date**: 2025-12-06
**Priority**: 🟢 Complete - Backend & Frontend Implemented
**Status**: ✅ **COMPLETE** - Backend implemented, Frontend integrated
**Component**: Backend API + Frontend Integration
**Related**: Epic 26, Request #45 (Cabinet Summary P&L), Request #46 (COGS Coverage)

**Summary**: Full **Operating Profit & Expense Tracking** at SKU, Brand, Category, and Cabinet levels.

**Backend Fields Available** (when `includeCogs=true`):
- **Expenses**: `logistics_cost_rub`, `storage_cost_rub`, `penalties_rub`, `paid_acceptance_cost_rub`, `acquiring_fee_rub`, `loyalty_fee_rub`, `loyalty_compensation_rub`, `commission_rub`
- **Calculated**: `total_expenses_rub`, `operating_profit_rub`, `operating_margin_pct`
- **Dormant Inventory**: `has_revenue` (false = expense-only SKU), `skus_with_expenses_only` (count)

**Frontend Implementation** ✅:
- ✅ TypeScript types updated (`src/types/analytics.ts`, `src/types/cogs.ts`)
- ✅ "Опер. прибыль" column added to all 3 margin tables (SKU/Brand/Category)
- ✅ Operating Profit section added to Cabinet Summary Dashboard
- ✅ Dormant inventory indicator (💤) for expense-only products
- ✅ Red color for losses (negative operating profit)

**Key Formula**:
```
Operating Profit = Gross Profit - Total Expenses
(может быть отрицательной = убыток)
```

**Documentation**:
- **[47-epic-26-operating-profit-expense-tracking.md](./47-epic-26-operating-profit-expense-tracking.md)** ← Backend API Guide
- **[CHANGELOG-EPIC-26.md](../CHANGELOG-EPIC-26.md)** ← Frontend Implementation Details

---

### Request #46: Product COGS Coverage Counting Bug ✅ FIXED
**Date**: 2025-12-06
**Priority**: 🟠 Medium - Data Accuracy Issue
**Status**: ✅ **FIXED** - SQL query updated with CTE
**Component**: Backend API - Analytics Module
**File**: [46-product-cogs-coverage-counting-bug.md](./46-product-cogs-coverage-counting-bug.md)

**Problem**: Cabinet Summary showed `with_cogs: 11` + `without_cogs: 9` = 20, but `total: 18`

**Root Cause**: SQL logic counted same product in both categories if it had COGS in some weeks but not others.

**Solution**: CTE with MAX aggregation - each product counted in exactly one category (with_cogs if ANY week has COGS).

**Additional Issue** (unrelated): Only 18 products in `margin_fact` vs 34 in `wb_finance_raw` - may need margin recalculation.

---

### Request #45: Cabinet Summary Missing P&L Fields ✅ RESOLVED
**Date**: 2025-12-06
**Priority**: 🔴 High - Dashboard Not Functional
**Status**: ✅ **RESOLVED** - Backend rebuilt, all fields now returned
**Component**: Backend API - Analytics Module
**Endpoint**: `GET /v1/analytics/weekly/cabinet-summary` (WITH `/weekly/` prefix!)

**Resolution**:
1. Backend was not rebuilt after Story 25.3 - fixed with `npm run build && pm2 restart`
2. API now returns `total_commission_rub_total` correctly
- Clear browser cache

**Documentation**:
- **[45-cabinet-summary-missing-pnl-fields.md](./45-cabinet-summary-missing-pnl-fields.md)** ← **FULL INVESTIGATION**

---

## ✅ Recently Completed

### Request #44: Add COGS Section to Finance Summary Endpoint ✅ NEW
**Date**: 2025-12-06
**Priority**: 🟡 Medium - UX Enhancement
**Status**: ✅ **COMPLETED** - Backend & Frontend Implementation Done
**Component**: Backend API - Analytics Module
**Related**: Epic 25 Story 25.2, Story 6.4 (Cabinet Summary)
**Endpoint**: `GET /v1/analytics/weekly/finance-summary`

**Solution**: Backend extended `finance-summary` endpoint with COGS data from `weekly_margin_fact`. Frontend added COGS section to `FinancialSummaryTable.tsx`.

**New Fields** in `summary_total`, `summary_rus`, `summary_eaeu`:
```typescript
{
  cogs_total: number | null;           // SUM(cogs_rub) from weekly_margin_fact
  cogs_coverage_pct: number | null;    // % of products with COGS assigned
  products_with_cogs: number | null;   // Count of products with COGS
  products_total: number | null;       // Total unique products in week
  gross_profit: number | null;         // payout_total - cogs_total (only when coverage = 100%)
}
```

**Documentation**:
- **[44-cogs-section-in-finance-summary.md](./44-cogs-section-in-finance-summary.md)** ← **FULL DETAILS**
- Epic 25 Story 25.2: `frontend/docs/stories/epic-25-dashboard-data-accuracy.md`

---

### Request #40: Epic 6-FE Deferred Items - Backend Clarification ✅ NEW
**Date**: 2025-12-05
**Priority**: 🟢 Low - Documentation/Clarification
**Status**: ✅ **RESOLVED** - All features already supported by backend
**Component**: Backend API - Analytics Module
**Related**: Epic 6-FE QA Review (Stories 6.1-FE through 6.5-FE)

**Summary**: В результате QA Review Epic 6-FE были выявлены deferred items. **Все они уже поддерживаются backend!**

| Deferred Item | Backend Status | Action | Status |
|---------------|----------------|--------|--------|
| DEFER-001: `weeks_with_sales` display | ✅ **Already supported** | Frontend: use existing fields | ✅ **RESOLVED** |
| DEFER-002: Summary row in comparison | ❌ Frontend-only | Table refactoring | ✅ **RESOLVED** |
| DEFER-003: TopTables unit tests | ❌ Frontend-only | Add tests | ✅ **RESOLVED** |

**Key Fields Available** (в date range режиме `weekStart`/`weekEnd`):
```typescript
interface SkuAnalyticsItem {
  // ... existing fields
  weeks_with_sales?: number   // ✅ Count of weeks with qty > 0
  weeks_with_cogs?: number    // ✅ Count of weeks with COGS assigned
}
```

**Documentation**:
- **[40-epic-6-fe-deferred-items-backend-response.md](./40-epic-6-fe-deferred-items-backend-response.md)** ← **FRONTEND INTEGRATION GUIDE**

**Frontend Completed** (2025-12-05):
1. ✅ Обновлены TypeScript types для `weeks_with_sales` / `weeks_with_cogs` — `src/types/cogs.ts`
2. ✅ Добавлено отображение в MarginBySkuTable — tooltip на названии товара
3. ✅ Task 6.2 и Task 6.3 в Story 6.1-FE завершены

---

### Request #36: Epic 24 - Paid Storage Analytics API ✅
**Date**: 2025-11-29
**Priority**: 📊 **NEW FEATURE**
**Status**: ✅ **COMPLETE** - All 5 stories implemented (43+ unit tests)
**Component**: Backend API - Analytics Module + Imports Module + Tasks Module + Products Module

**New Feature**: Аналитика расходов на хранение по артикулам — новая функциональность для детального анализа затрат на платное хранение товаров по каждому SKU.

**Key Capabilities**:
- 📊 `GET /v1/analytics/storage/by-sku` — затраты на хранение по SKU с пагинацией
- 🏆 `GET /v1/analytics/storage/top-consumers` — топ-N товаров по стоимости хранения
- 📈 `GET /v1/analytics/storage/trends` — тренды расходов по неделям
- ⏰ Автоматический импорт данных каждый вторник 08:00 MSK
- 📥 `POST /v1/imports/paid-storage` — ручной импорт (макс 8 дней)
- 📦 **`GET /v1/products?include_storage=true`** — затраты на хранение в списке товаров (Story 24.5)

**Story 24.5: Storage Cost in Products API** (NEW):
```http
# С данными о хранении (+50ms)
GET /v1/products?include_storage=true&limit=25

# Маржа И хранение (~350ms)
GET /v1/products?include_cogs=true&include_storage=true&limit=25
```

**Новые поля** (когда `include_storage=true`):
- `storage_cost_daily_avg` (number | null) — среднедневная стоимость (₽/день)
- `storage_cost_weekly` (number | null) — общая стоимость за неделю (₽)
- `storage_period` (string | null) — ISO-неделя данных (напр. "2025-W47")

**Documentation**:
- **[36-epic-24-paid-storage-analytics-api.md](./36-epic-24-paid-storage-analytics-api.md)** ← **FRONTEND INTEGRATION GUIDE**
- **[docs/STORAGE-API-GUIDE.md](../../../docs/STORAGE-API-GUIDE.md)** ← **SDK WORKFLOW, СРАВНЕНИЕ ДАННЫХ, TROUBLESHOOTING** (2025-12-15)
- [51-paid-storage-import-methods.md](./51-paid-storage-import-methods.md) ← **SMART/MANUAL IMPORT**
- [39-storage-data-sources-discrepancy.md](./39-storage-data-sources-discrepancy.md) ← **АНАЛИЗ РАСХОЖДЕНИЙ** (W46: 0.67%)
- [Epic 24 Overview](../../../docs/epics/epic-24-paid-storage-by-article.md)
- [Story 24.5](../../../docs/stories/epic-24/story-24.5-storage-in-products-api.md)

**Frontend Next Steps**:
1. Создать страницу "Аналитика хранения"
2. Добавить компонент тренда расходов (график)
3. Добавить таблицу топ-N дорогих SKU
4. **Добавить колонку "Хранение" в таблицу товаров** (используя `include_storage=true`)
5. Интегрировать данные о хранении в карточку товара

---

### Request #31: Add `applicable_cogs` Field to Products API ✅ IMPLEMENTED
**Date**: 2025-11-28
**Priority**: 🟡 Medium - UX Improvement
**Status**: ✅ **IMPLEMENTED** (2025-11-28)
**Component**: Backend API - Products Module + COGS Module

**Problem Solved**: When latest COGS has future valid_from date, users now see which COGS is actually used for margin calculation.

**API Response** (now includes `applicable_cogs`):
```json
{
  "nm_id": "173589742",
  "cogs": { "unit_cost_rub": 11, "valid_from": "2025-11-23" },
  "applicable_cogs": {
    "unit_cost_rub": 121,
    "valid_from": "2025-11-07",
    "applies_to_week": "2025-W46",
    "is_same_as_current": false
  }
}
```

**Use Cases**:
1. ✅ Latest = Applicable → `is_same_as_current: true`
2. ✅ Latest ≠ Applicable (future date) → `is_same_as_current: false`
3. ✅ No Applicable (first COGS in future) → `applicable_cogs: null`
4. ✅ No COGS → `cogs: null, applicable_cogs: null`

**Endpoints Updated**:
- `GET /v1/products/:nmId` - Always includes `applicable_cogs`
- `GET /v1/products?include_cogs=true` - Includes `applicable_cogs` for each product

**API Tests**: See `test-api/08-products.http` (COGS Assignment examples)

**Frontend Changes** (2025-11-28):
- `src/types/cogs.ts` - Added `ApplicableCogs` interface
- `src/components/custom/ProductMarginCell.tsx` - Display applicable COGS info

**Documentation**:
- [Backend Implementation](./31-cogs-display-improvement-show-applicable-cogs-backend.md)
- [Guide #29: COGS Temporal Versioning](./29-cogs-temporal-versioning-and-margin-calculation.md)

---

## 📋 Active Requests

### Request #33: createCogs() Does Not Close Previous COGS Versions ✅ IMPLEMENTED
**Date**: 2025-11-28
**Priority**: 🔴 High - Data Integrity Issue
**Status**: ✅ **IMPLEMENTED** - 2025-11-28
**Component**: Backend API - COGS Module

**Problem Solved**: `createCogs()` now properly closes previous COGS versions when creating new ones with different `valid_from` dates. Previously all versions had `valid_to = NULL`.

**Fix Logic**:
- Same `valid_from` → UPDATE existing (unchanged)
- `new_valid_from > current.valid_from` → Transaction: close old + create new ✅
- `new_valid_from < current.valid_from` → Create historical with `valid_to` ✅

**Migration Script**: `scripts/fix-cogs-valid-to.ts`
```bash
npx ts-node scripts/fix-cogs-valid-to.ts --dry-run  # Preview changes
npx ts-node scripts/fix-cogs-valid-to.ts            # Fix all affected products
```

**Documentation**:
- **[33-cogs-createCogs-not-closing-previous-versions.md](./33-cogs-createCogs-not-closing-previous-versions.md)** ← **DETAILS**

---

### Request #32: Historical Margin Context Not Showing for Products Without COGS ✅ IMPLEMENTED
**Date**: 2025-11-28
**Priority**: 🟡 Medium - UX Bug
**Status**: ✅ **IMPLEMENTED** - 2025-11-28
**Component**: Backend API - Products Module

**Problem**: Товар "Карты Таро" (nm_id: 201916739) не показывает информацию "Нет продаж за последние 12 недель", в отличие от аналогичного товара "Обруч для похудения" (nm_id: 395996251).

**Root Cause**: Bug в `src/products/products.service.ts:653`:
```typescript
// Текущий код (БАГ):
missing_reason: hasCogs ? 'NO_SALES_DATA' : 'NO_SALES_DATA'

// Должно быть:
missing_reason: hasCogs ? 'NO_SALES_DATA' : 'COGS_NOT_ASSIGNED'
```

Также проблема в логике строк 588-589: товары с записями `service` (хранение) но без продаж получают `NO_SALES_IN_PERIOD` вместо `NO_SALES_DATA`.

**Documentation**:
- **[32-historical-margin-context-not-showing-for-products-without-cogs.md](./32-historical-margin-context-not-showing-for-products-without-cogs.md)** ← **DETAILS**

---

### Request #27: COGS History Management & Advanced Analytics Roadmap ✅ EPIC 6 COMPLETE
**Date**: 2025-11-26 → **Updated: 2025-11-27**
**Priority**: 🔴 High - Core Business Features
**Status**: ✅ **EPIC 6 COMPLETE** - All 5 Advanced Analytics stories deployed! Epic 5 partial.
**Component**: Backend API - COGS Module + Analytics Module

**Summary**: Two major feature sets for the platform:

**Epic 5: COGS History & Management** ✅ **COMPLETE** (2025-11-27, Avg 90/100)
| Story | Feature | Document | QA Score | Status |
|-------|---------|----------|----------|--------|
| 5.1 | View COGS history per product | [Story 5.1](../../../docs/stories/epic-5/story-5.1-view-cogs-history.md) | 90/100 | ✅ **DONE** |
| 5.2 | Edit past COGS + auto-recalculate margin | [Story 5.2](../../../docs/stories/epic-5/story-5.2-edit-cogs.md) | 90/100 | ✅ **DONE** |
| 5.3 | Delete/deactivate COGS + auto-recalculate | [Story 5.3](../../../docs/stories/epic-5/story-5.3-delete-cogs.md) | 90/100 | ✅ **DONE** |

**Epic 6: Advanced Analytics & Reporting** ✅ **COMPLETE** (2025-11-27, Avg 91.5/100)
| Story | Feature | Document | QA Score | Status |
|-------|---------|----------|----------|--------|
| 6.1 | Date range selector (week-from to week-to) | [Story 6.1](../../../docs/stories/epic-6/story-6.1-date-range-analytics.md) | 90/100 | ✅ **DONE** |
| 6.2 | Period comparison (W46 vs W45) | [Story 6.2](../../../docs/stories/epic-6/story-6.2-period-comparison.md) | 91/100 | ✅ **DONE** |
| 6.3 | New metrics: ROI, profit per unit | [Story 6.3](../../../docs/stories/epic-6/story-6.3-roi-profit-metrics.md) | 95/100 | ✅ **DONE** |
| 6.4 | Cabinet-level KPI dashboard | [Story 6.4](../../../docs/stories/epic-6/story-6.4-cabinet-summary.md) | 92/100 | ✅ **DONE** |
| 6.5 | Export to CSV/Excel | [Story 6.5](../../../docs/stories/epic-6/story-6.5-export-analytics.md) | 90/100 | ✅ **DONE** |
| 6.6 | Dedicated trends endpoint | [Story 6.6](../../../docs/stories/epic-6/story-6.6-dedicated-trends-endpoint.md) | 92/100 | ✅ **DONE** |

**🆕 New API Endpoints Available (Epic 6 Complete)**:
```http
# Story 6.1: Date Range Analytics
GET /v1/analytics/weekly/by-sku?weekStart=2025-W40&weekEnd=2025-W47&includeCogs=true

# Story 6.2: Period Comparison
GET /v1/analytics/weekly/by-sku?week=2025-W46&compare_to=2025-W45

# Story 6.3: ROI & Profit Metrics (in all analytics responses when includeCogs=true)
# New fields: roi, profit_per_unit

# Story 6.4: Cabinet Summary Dashboard
GET /v1/analytics/cabinet-summary?weeks=12

# Story 6.5: Export Analytics
POST /v1/exports/analytics
  { "type": "by-sku", "weekStart": "2025-W40", "weekEnd": "2025-W47", "format": "xlsx" }

# Story 6.6: Dedicated Trends Endpoint (NEW - replaces N separate requests)
GET /v1/analytics/weekly/trends?from=2025-W44&to=2025-W47&metrics=payout_total,sale_gross
```

**Key Technical Decisions**:
- `cogs_id` (UUID) ✅ available
- `valid_to` ✅ automatic versioning implemented
- `created_by` ✅ audit trail exists
- Soft delete with `is_active` flag ✅ implemented
- ROI when cogs=0 → return `null` ✅ implemented
- Async export via BullMQ ✅ implemented (15 unit tests)

**Documentation**:
- [Frontend Request](./27-cogs-history-and-advanced-analytics-roadmap.md)
- [Backend Response](./27-cogs-history-and-advanced-analytics-roadmap-backend.md) ← **ALL ANSWERS HERE**
- [Epic 5 Overview](../../../docs/epics/epic-5-cogs-history-management.md) ← **COGS HISTORY**
- [Epic 6 Overview](../../../docs/epics/epic-6-advanced-analytics.md) ← **ADVANCED ANALYTICS ✅ COMPLETE**
- [API Reference](../../../docs/API-PATHS-REFERENCE.md) ← **All new endpoints documented**

**🆕 New API Endpoints (Epic 5 - COGS Management)**:
```http
# Story 5.1: View COGS History
GET /v1/cogs/history?nm_id=12345678&limit=50
Authorization: Bearer <token>
X-Cabinet-Id: <cabinet-uuid>

# Story 5.2: Edit COGS Record
PATCH /v1/cogs/:cogsId
Authorization: Bearer <token>
X-Cabinet-Id: <cabinet-uuid>
Content-Type: application/json

{
  "unit_cost_rub": 950.00,        // Optional, > 0
  "notes": "Исправленная сумма"   // Optional, max 1000 chars
}

# Story 5.3: Delete COGS Record (Soft Delete)
DELETE /v1/cogs/:cogsId
Authorization: Bearer <token>
X-Cabinet-Id: <cabinet-uuid>

# Response (200 OK):
# {
#   "deleted": true,
#   "cogs_id": "uuid",
#   "deletion_type": "soft",
#   "previous_version_reopened": true,  // if deleting current version
#   "margin_recalculation": { triggered, task_uuid, affected_weeks }
# }
```

**Next Step**: Frontend can start full integration with Epic 5 (COGS Management) and Epic 6 (Advanced Analytics) APIs. Both epics complete!

---

## ✅ Resolved Requests

### Request #28: Dedicated Trends API Endpoint ✅ NEW
**Date**: 2025-11-27
**Priority**: ✅ **RESOLVED** (Was: Low - Optional Enhancement)
**Status**: ✅ **IMPLEMENTED** - Story 6.6 deployed
**Source**: QA Review Recommendation (Story 3.4)
**Component**: Backend API - Analytics Module (Epic 6)

**Problem**: TrendGraph component (Story 3.4) makes N separate API requests for N weeks of trend data. This is inefficient.

**Solution**: Created dedicated endpoint `GET /v1/analytics/weekly/trends?from=YYYY-Www&to=YYYY-Www` that returns trend data for date range in a single request.

**Key Benefits**:
- ✅ Single request instead of N requests
- ✅ ~50-70% faster response time (1 request vs N parallel)
- ✅ Optimized single SQL query
- ✅ Optional summary statistics (min, max, avg, trend %)
- ✅ Dynamic metric selection

**New Endpoint**:
```http
GET /v1/analytics/weekly/trends?from=2025-W44&to=2025-W47&metrics=payout_total,sale_gross
Authorization: Bearer <token>
X-Cabinet-Id: <cabinet-uuid>
```

**Documentation**:
- [Original Request](./28-dedicated-trends-api-endpoint.md)
- [Backend Response & Integration Guide](./28-dedicated-trends-api-endpoint-backend.md) ← **START HERE**
- [Story 6.6](../../../docs/stories/epic-6/story-6.6-dedicated-trends-endpoint.md)

**QA Status**: ✅ PASS (92/100)

---

### Request #26: Frontend Text Clarification - Margin Calculation Week Lookback ✅
**Date**: 2025-11-26
**Priority**: ✅ **RESOLVED** (Was: Low - UI Text Correction)
**Status**: ✅ **COMPLETED** - Frontend text updated
**Component**: Frontend UI - COGS Assignment Form Text

**Issue**: Frontend displayed "Если продаж не было, будут проанализированы последние 4 недели" which was misleading about actual backend behavior.

**Solution**: Updated text in two files:
- `frontend/src/app/(dashboard)/cogs/page.tsx` - Alert banner
- `frontend/src/components/custom/SingleCogsForm.tsx` - Tip text

**New Text**:
> "После назначения себестоимости маржа будет рассчитана автоматически на основе данных продаж за последнюю завершённую неделю. Для товаров без продаж в этот период будет показан исторический контекст за последние 12 недель."

**Documentation**:
- [Clarification Details](./26-margin-calculation-text-clarification.md)

---

### Request #25: Historical Margin Discovery Endpoint ✅ NEW
**Date**: 2025-11-26 → 2025-01-27
**Priority**: ✅ **RESOLVED** (Was: Medium - UX Enhancement)
**Status**: ✅ **IMPLEMENTED** - Stories 23.8 & 23.9 deployed
**Component**: Backend API - Products Module + Analytics Module (Epic 23)
**Related**: Story 4.9, Request #15 (include_cogs), Guide #24

**Problem**: When `missing_data_reason: "NO_SALES_DATA"` for last completed week (W47), users see "нет продаж" but product may have sales with margin in previous weeks (e.g., W44 with 92% margin). No way to discover historical margin without manual navigation.

**Solution**: Backend implemented both UX recommendations from Frontend:

| Story | Endpoint | Frontend Use |
|-------|----------|--------------|
| **23.9** | `GET /v1/products?include_cogs=true` + 4 new fields | Inline context in ProductList |
| **23.8** | `GET /v1/analytics/weekly/product-weeks?nm_id=...` | "История продаж" detail page |

**New Fields (Story 23.9)**:
- `last_sales_week` (string | null) - ISO week of last sale (e.g., "2025-W44")
- `last_sales_margin_pct` (number | null) - Margin % from that week
- `last_sales_qty` (number | null) - Units sold
- `weeks_since_last_sale` (number | null) - Gap in weeks

**UX Result**: Users see "Последняя: W44 (92.32%, 5 шт, 3 нед. назад)" directly in product list!

**Documentation**:
- [Request Details](./25-historical-margin-discovery-endpoint.md)
- [Backend Response & Code Examples](./25-historical-margin-discovery-endpoint-backend.md) ← **START HERE**
- [Story 4.9](../stories/4.9.historical-margin-discovery.md)

---

### Request #21: Margin Calculation Status Endpoint - Backend Response ✅
**Date**: 2025-01-27  
**Priority**: ✅ **RESOLVED** (Was: Medium - Implementation Question)  
**Status**: ✅ **COMPLETED** - Endpoint Implemented & QA Verified  
**Component**: Backend API - Products Module (Epic 22 Story 22.1)  
**Related**: Request #20 (Frontend Polling Implementation Issues)

**Solution**: Backend implemented lightweight status endpoint `GET /v1/products/:nmId/margin-status` to solve frontend polling inefficiency. Endpoint provides real-time margin calculation task status without requiring full product data fetch.

**Features**:
- ✅ Checks BullMQ queue for pending/active/failed jobs
- ✅ Verifies margin data existence in database
- ✅ Returns status: `pending`, `in_progress`, `completed`, `not_found`, `failed`
- ✅ Provides estimated completion time
- ✅ Includes error information for failed tasks
- ✅ Performance: < 100ms p95 (QA verified)

**QA Status**: ✅ **PASS** - All tests passing, production-ready

**Documentation**:
- [Backend Response & API Guide](./21-margin-calculation-status-endpoint-backend.md) ← **START HERE**
- [Original Request](./20-frontend-polling-implementation-issues.md)
- [Epic 22: Status Endpoint Solution](../../../docs/epics/epic-22-margin-calculation-status-endpoint.md)
- [Story 22.1: Implementation Details](../../../docs/stories/epic-22/story-22.1-margin-calculation-status-endpoint.md)

---

### Request #20: Frontend Polling Implementation Issues - Backend Guidance Needed ✅
**Date**: 2025-01-27  
**Priority**: ✅ **RESOLVED** (Was: Medium - Implementation Question)  
**Status**: ✅ **COMPLETED** - Solution Implemented  
**Component**: Frontend - Polling Implementation for Margin Calculation  
**Related**: Request #14 (Epic 20), Request #18 (Missing Margin Scenarios), Request #21 (Solution)

**Problem**: Frontend team was implementing polling mechanism for margin calculation status updates but encountering issues:
1. Polling hook not restarting after COGS assignment
2. Infinite re-render loop in pending products detection
3. No efficient way to check if margin calculation task is queued/processing

**Solution**: Backend created Epic 22 and implemented `GET /v1/products/:nmId/margin-status` endpoint (see Request #21).

**Documentation**:
- [Request Details](./20-frontend-polling-implementation-issues.md)
- [Backend Response & Solution](./21-margin-calculation-status-endpoint-backend.md) ← **SOLUTION**
- [Epic 22: Status Endpoint Solution](../../../docs/epics/epic-22-margin-calculation-status-endpoint.md)

---

### Request #19: Margin Returned Without COGS - Data Inconsistency ✅
**Date**: 2025-01-27  
**Priority**: ✅ **RESOLVED** (Was: High - Data Integrity Issue)  
**Status**: ✅ **COMPLETED** - Bug Fixed  
**Component**: Backend API - Products Module + Analytics Module (Epic 17/20)

**Problem**: Backend returned `current_margin_pct: 100.0` for products where `has_cogs: false` and `cogs: null`. This was a bug - margin calculation service stores records in `weekly_margin_fact` even when COGS is missing (margin = 100% when cogs = 0), and ProductsService did not validate COGS existence before returning margin data.

**Solution**: Added COGS validation in `ProductsService.getMarginDataForProducts()`. If `margin_pct` exists but COGS is missing, backend now sets `margin_pct = null` and `missing_reason = 'COGS_NOT_ASSIGNED'`.

**Documentation**:
- [Request Details](./19-margin-returned-without-cogs.md)
- [Backend Response & Fix](./19-margin-returned-without-cogs-backend.md) ← **START HERE**

---

### Request #18: Missing Margin and Missing Data Reason - Edge Case Scenarios ✅
**Date**: 2025-01-27  
**Priority**: ✅ **RESOLVED** (Was: Medium - Clarification Request)  
**Status**: ✅ **COMPLETED** - Backend Response Provided  
**Component**: Backend API - Products Module + Analytics Module (Epic 17/20)

**Question**: Why do some products return `current_margin_pct: null` and `missing_data_reason: null` simultaneously when COGS exists and sales data is present? Is this expected? How should frontend handle this?

**Answer**: Yes, this is expected behavior. `missing_data_reason: null` when `current_margin_pct: null` and COGS exists means "margin calculation in progress" (Epic 20 design). Frontend should show "(расчёт маржи...)" in this case.

**Documentation**:
- [Request Details](./18-missing-margin-and-missing-data-reason-scenarios.md)
- [Backend Response & Guidance](./18-missing-margin-and-missing-data-reason-scenarios-backend.md) ← **START HERE**

---

### Request #17: COGS Assigned After Completed Week - Manual Recalculation Required ✅
**Date**: 2025-01-27  
**Priority**: ✅ **RESOLVED** (Was: Medium - Documentation Request)  
**Status**: ✅ **COMPLETED** - Backend Behavior Documented  
**Component**: Backend API - COGS Module + Margin Calculation (Epic 20)

**Problem**: When COGS is assigned with date after last completed week, automatic margin recalculation is skipped (empty affected weeks array).

**Solution**: Documented behavior and manual recalculation workaround via `POST /v1/tasks/enqueue`.

**Documentation**:
- [Backend Response & Guide](./17-cogs-assigned-after-completed-week-recalculation.md)

---

### Request #16: COGS History and Margin Data Structure Guide ✅
**Date**: 2025-01-26  
**Priority**: ✅ **RESOLVED** (Was: Medium - Documentation Request)  
**Status**: ✅ **COMPLETED** - Backend Documentation Provided  
**Component**: Backend API - COGS Module + Analytics Module

**Problem**: Frontend team needs guidance on checking historical COGS assignments, understanding margin calculation mechanics, and data structure (week uniqueness).

**Solution**: Comprehensive API guide with endpoints, examples, and data structure explanations for COGS history queries and margin analytics.

**Documentation**:
- [Backend Response & Guide](./16-cogs-history-and-margin-data-structure.md) ← **START HERE** (Contains up-to-date `missing_data_reason` values and margin data structure)

---

### Request #15: Add includeCogs Parameter to Product List Endpoint ✅
**Date**: 2025-11-23  
**Priority**: ✅ **RESOLVED** (Was: P2 - Enhancement)  
**Status**: ✅ **COMPLETED**  
**Component**: Backend API - Products Module + Epic 17 Analytics

**Problem**: Product list endpoint didn't return margin data despite COGS being assigned.

**Solution**: Added `include_cogs=true` parameter with batch analytics query optimization.

**Documentation**:
- [Original Request](./15-add-includecogs-to-product-list-endpoint.md)
- [Implementation Plan](./15-add-includecogs-to-product-list-endpoint-implementation-plan.md)
- [Completion Summary](./15-add-includecogs-to-product-list-endpoint-completion-summary.md)

---

### Request #14: Automatic Margin Recalculation on COGS Update ✅
**Date**: 2025-11-24  
**Priority**: ✅ **RESOLVED** (Was: High - Blocks good UX)  
**Status**: ✅ **COMPLETED** - Epic 20 Implementation Complete  
**Component**: Backend API - Analytics Module + COGS Module + Task Queue

**Problem**: After assigning COGS through UI, margin was not displayed in product list.

**Solution**: Implemented automatic background margin recalculation triggered after COGS assignment/update using BullMQ queue processing.

**Documentation**:
- [Original Request](./14-automatic-margin-recalculation-on-cogs-update.md)
- [Backend Response & Integration Guide](./14-automatic-margin-recalculation-on-cogs-update-backend.md) ← **START HERE**
- [Backend Implementation Checklist](./14-automatic-margin-recalculation-on-cogs-update-checklist.md)

---

### Request #14a: Search by Partial Article Number Not Working ✅
**Date**: 2025-11-23  
**Priority**: ✅ **RESOLVED** (Was: High)  
**Status**: ✅ **FIXED**  
**Component**: Backend API - Products Module + WB SDK Integration

**Problem**: Searching for products by partial article number (e.g., "3216") returned no results.

**Solution**: Implemented client-side filtering for partial article matching when WB API textSearch doesn't support it.

**Documentation**:
- [Backend Response](./14-search-by-partial-article-not-working.md)

---

### Request #13: Fix Products List Pagination - WB SDK Returns Duplicates ✅
**Date**: 2025-11-23  
**Priority**: ✅ **RESOLVED** (Was: High User-Facing Bug)  
**Status**: ✅ **COMPLETED** - Client-Side Pagination Workaround Implemented  
**Component**: Backend API - Products Module + WB SDK Integration

**Problem**: Product list page 2 showed duplicate products from page 1 instead of next products.

**Solution**: Client-side pagination workaround (getAllProductsList + findIndex + slice, Redis cache).

**Documentation**:
- [Original Request](./13-products-pagination-wb-sdk-issue.md)
- [Backend Response](./13-products-pagination-wb-sdk-issue-backend.md)
- [Final Completion Summary](./13-products-pagination-wb-sdk-issue-final-completion.md)

---

### Request #12: COGS Update Returns 409 Conflict Instead of Updating ✅
**Date**: 2025-11-23  
**Priority**: ✅ **RESOLVED** (Was: High)  
**Status**: ✅ **FIXED** - Idempotent UPDATE Logic Implemented  
**Component**: Backend API - COGS Module

**Problem**: Backend returned 409 Conflict when trying to update COGS with same `valid_from` date.

**Solution**: Modified `createCogs()` to UPDATE existing records instead of throwing ConflictException.

**Documentation**:
- [Original Request](./12-cogs-update-conflict-409-error.md)
- [Backend Response](./12-cogs-update-conflict-409-error-backend.md)
- [Validation Summary](./12-cogs-update-conflict-409-error-validation-summary.md)

---

### Request #11: Undefined Fields in COGS Assignment Response ✅
**Date**: 2025-11-23  
**Priority**: ✅ **RESOLVED** (Was: High)  
**Status**: ✅ **FIXED** - Return Type Changed to ProductResponseDto  
**Component**: Backend API - Products Module

**Problem**: `POST /v1/products/:nmId/cogs` returned `undefined` for critical fields (`has_cogs`, `cogs.id`, `current_margin_pct`).

**Solution**: Changed return type from `AssignCogsResponseDto` to `ProductResponseDto` (calls `getProduct()` after COGS creation).

**Documentation**:
- [Original Request](./11-undefined-fields-in-cogs-assignment-response.md)
- [Backend Response](./11-undefined-fields-in-cogs-assignment-response-backend.md)

---

### Request #10: Margin Analysis Time Series Endpoint ✅ BUGFIXES APPLIED
**Date**: 2025-11-23 → **Bugfixes: 2025-12-04**
**Status**: ✅ **IMPLEMENTED & WORKING** - 3 Critical Bugfixes Applied
**Component**: Backend API - Analytics Module

**Endpoint**: `GET /v1/analytics/weekly/margin-trends?weeks=12`

**Bugfixes Applied (2025-12-04)**:
| # | Error | Fix |
|---|-------|-----|
| 1 | `column "qty" does not exist` | `SUM(qty)` → `SUM(quantity_sold)` |
| 2 | `uuid = text` type mismatch | Added `::uuid` PostgreSQL cast |
| 3 | `Cannot mix BigInt and other types` | Added `Number()` conversion |

**Files Changed**:
- `src/analytics/weekly-analytics.service.ts` - 3 fixes in `getMarginTrends()` method
- `test-api/06-analytics-advanced.http` - Margin Trends examples

**Verification**: 200 OK with 12 weeks of margin trend data (2025-W37 to 2025-W48)

**Story 4.7 Unblocked**: Frontend can now integrate with `useMarginTrends` hook

**Documentation**: [10-margin-analysis-time-series-endpoint.md](./10-margin-analysis-time-series-endpoint.md)

---

### Request #09: Epic 18 COGS Management API ✅
**Date**: 2025-11-23  
**Status**: ✅ **RESOLVED**  
**Component**: Backend API - Products Module + COGS Module

**Documentation**:
- [Original Request](./09-epic-18-cogs-management-api.md)
- [Backend Response](./09-epic-18-backend-response.md)

---

### Request #08: Epic 17 Documentation Navigation ✅
**Date**: 2025-11-23  
**Status**: ✅ **RESOLVED**  
**Component**: Documentation

**Documentation**: [08-epic-17-documentation-navigation.md](./08-epic-17-documentation-navigation.md)

---

### Request #07: COGS Margin Analytics includeCogs Parameter ✅
**Date**: 2025-11-23  
**Status**: ✅ **RESOLVED**  
**Component**: Backend API - Analytics Module

**Documentation**: [07-cogs-margin-analytics-includecogs-parameter.md](./07-cogs-margin-analytics-includecogs-parameter.md)

---

### Request #06: Missing Expense Fields in Finance Summary ✅
**Date**: 2025-11-23  
**Status**: ✅ **RESOLVED**  
**Component**: Backend API - Analytics Module

**Documentation**: [06-missing-expense-fields-in-finance-summary.md](./06-missing-expense-fields-in-finance-summary.md)

---

### Request #05: Workaround Available Weeks from Weekly Payout Total ✅
**Date**: 2025-11-23  
**Status**: ✅ **RESOLVED**  
**Component**: Backend API - Analytics Module

**Documentation**: [05-workaround-available-weeks-from-weekly-payout-total.md](./05-workaround-available-weeks-from-weekly-payout-total.md)

---

### Request #04: Analytics API Response Format Clarification ✅
**Date**: 2025-11-23  
**Status**: ✅ **RESOLVED**  
**Component**: Backend API - Analytics Module

**Documentation**: [04-analytics-api-response-format-clarification.md](./04-analytics-api-response-format-clarification.md)

---

### Request #03: Fix CORS for Frontend Port 3100 ✅
**Date**: 2025-11-23  
**Status**: ✅ **RESOLVED**  
**Component**: Backend API - CORS Configuration

**Documentation**: [03-fix-cors-for-frontend-port-3100.md](./03-fix-cors-for-frontend-port-3100.md)

---

### Request #02: Update WB API Token in Cabinet ✅
**Date**: 2025-11-23  
**Status**: ✅ **RESOLVED**  
**Component**: Backend API - Cabinets Module

**Documentation**: [02-update-wb-api-token-in-cabinet.md](./02-update-wb-api-token-in-cabinet.md)

---

### Request #01: JWT Token Refresh on Cabinet Creation ✅
**Date**: 2025-11-23  
**Status**: ✅ **RESOLVED**  
**Component**: Backend API - Auth Module

**Documentation**: [01-jwt-token-refresh-on-cabinet-creation.md](./01-jwt-token-refresh-on-cabinet-creation.md)

---

## 📚 Request Workflow

### Frontend Team → Backend Team

1. **Discovery**: Frontend finds issue during development/testing
2. **Investigation**: Root cause analysis (frontend vs backend)
3. **Documentation**: Create detailed request file in `frontend/docs/request-backend/`
4. **Notification**: Inform backend team (Slack/GitHub/email)
5. **Implementation**: Backend team implements solution
6. **Backend Response**: Backend team documents fix (creates `*-backend.md` or updates original file)
7. **Testing**: Frontend team validates fix
8. **Closure**: Update request status to ✅ RESOLVED

### Request Template

```markdown
# Request #XX: [Title]

**Date**: YYYY-MM-DD
**Priority**: 🔴 High / 🟡 Medium / 🟢 Low
**Status**: 🟡 Investigation / 🔵 In Progress / ✅ Resolved
**Component**: Backend API - [Module Name]

## Executive Summary
[Brief description of problem and recommended solution]

## Problem Description
[Current vs Expected behavior with examples]

## Investigation Results
[Evidence: logs, API responses, test results]

## Proposed Solution
[Detailed solution with code examples]

## Acceptance Criteria
[Checklist for testing]

## Recommended Next Steps
[Action items for backend team]
```

---

## 📂 File Organization

```
frontend/docs/request-backend/
├── README.md                                    # This file (index)
├── 00-[special-document].md                    # Special documents (e.g., documentation updates)
├── XX-[request-title].md                        # Original frontend requests
├── XX-[request-title]-backend.md                # Backend implementation responses
├── XX-[request-title]-[type].md                 # Backend summaries (completion, validation, etc.)
└── [archive/]                                   # Resolved requests (future)
```

**Naming Convention**:
- Original requests: `XX-[kebab-case-title].md`
- Backend responses: `XX-[kebab-case-title]-backend.md`
- Backend summaries: `XX-[kebab-case-title]-[type].md` (e.g., `15-add-includecogs-to-product-list-endpoint-completion-summary.md`)
- Special documents: `00-[title].md` (e.g., `00-documentation-update-2025-01-26.md`)

---

## 📊 Integration Guides

### Guide #24: Margin & COGS Integration Guide ✅ NEW
**Date**: 2025-01-27
**Type**: 📊 **COMPREHENSIVE GUIDE**
**Component**: Backend API - Products + Analytics + COGS Modules

**Description**: Полное руководство по интеграции маржи и себестоимости (COGS) для frontend. Содержит:
- Архитектуру данных (таблицы, формулы)
- Все API endpoints с примерами запросов/ответов
- 5 сценариев ответов (A-E) с рекомендациями для UI
- Справочник `missing_data_reason` значений
- Логику расчёта недель (ISO week)
- Стратегию polling после назначения COGS
- HTTP статусы и коды ошибок
- Checklist для frontend

**Documentation**:
- **[24-margin-cogs-integration-guide.md](./24-margin-cogs-integration-guide.md)** ← **START HERE**
- Backend source: [docs/MARGIN-COGS-INTEGRATION-GUIDE.md](../../../docs/MARGIN-COGS-INTEGRATION-GUIDE.md)

---

### Guide #30: SKU Analytics Data Architecture ✅ NEW
**Date**: 2025-11-28
**Type**: 📊 **TECHNICAL GUIDE**
**Component**: Backend Analytics + Frontend Display

**Description**: Документация архитектуры данных для SKU-аналитики:
- Обработку строк без артикула (nm_id = 'UNKNOWN')
- Формулу маржи по SKU и её ограничения
- Схему распределения данных из WB Excel
- Fix для `missing_cogs_flag` (показывал 0₽ вместо "Не назначена")

**Ключевая схема**:
```
WB Excel → qty=1 (Product) → SKU Analytics ✅
         → qty=0 (Service) → Excluded from SKU ❌
         → qty=2 (Transport) → Informational KPI ❌
         → All rows → weekly_payout_summary ✅
```

**UI Recommendation**: Показывать пользователю что маржа по SKU не включает операционные расходы.

**Documentation**:
- **[30-sku-analytics-data-architecture.md](./30-sku-analytics-data-architecture.md)** ← **START HERE**

---

### Request #31: COGS Display Improvement - Show Applicable COGS 📋 PROPOSED
**Date**: 2025-11-28
**Priority**: 🟡 Medium - UX Improvement
**Status**: 📋 **PROPOSED** - Waiting for implementation
**Component**: Backend API + Frontend Display

**Problem**: Когда последний COGS назначен с датой после midpoint текущей недели:
- UI показывает только последний COGS (например, 11₽)
- Сообщение "COGS с будущей даты" не объясняет какой COGS реально применяется
- Пользователь не понимает что для текущей недели используется предыдущий COGS (например, 121₽)

**Proposed Solution**:
```
Текущий UI:          11,00 ₽ с 23.11.2025
                     (COGS с будущей даты)

Улучшенный UI:       11,00 ₽ с 23.11.2025
                     ⓘ Для W46 используется: 121₽
                     ⓘ Новый COGS (11₽) применится с W48
```

**Documentation**:
- **[31-cogs-display-improvement-show-applicable-cogs-backend.md](./31-cogs-display-improvement-show-applicable-cogs-backend.md)** ← **BACKEND REQUEST**
- [31-cogs-display-improvement-show-applicable-cogs.md](./31-cogs-display-improvement-show-applicable-cogs.md) ← Overview
- [Guide #29: COGS Temporal Versioning](./29-cogs-temporal-versioning-and-margin-calculation.md)

---

### Guide #29: COGS Temporal Versioning & Margin Calculation ✅ NEW
**Date**: 2025-11-28
**Type**: 📊 **TECHNICAL GUIDE**
**Component**: Backend API - COGS Module + Analytics Module

**Description**: Подробное объяснение логики выбора себестоимости для расчёта маржи:
- **Week Midpoint Strategy** — система использует середину недели (≈ четверг) для определения актуальной COGS
- Модель временного версионирования (`valid_from` / `valid_to`)
- 4 сценария применения COGS с визуальными схемами
- Пример расчёта маржи с реальными данными
- Алгоритм автоматического пересчёта при изменении COGS
- UX рекомендации для отображения истории COGS
- Edge cases и FAQ

**Ключевой вывод**: Если COGS изменена в Пт-Вс текущей недели, она применится только со **следующей недели**.

**Documentation**:
- **[29-cogs-temporal-versioning-and-margin-calculation.md](./29-cogs-temporal-versioning-and-margin-calculation.md)** ← **START HERE**

---

## 🔗 Related Documentation

**Backend Documentation**:
- `docs/stories/` - Backend epic stories and requirements
- `docs/architecture/` - System architecture documentation
- `docs/PRODUCTS-API-GUIDE.md` - Products API guide
- `docs/MARGIN-COGS-INTEGRATION-GUIDE.md` - **📊 Margin & COGS Integration Guide**

**Frontend Documentation**:
- `frontend/docs/stories/` - Frontend epic stories and requirements
- `frontend/docs/api-integration-guide.md` - Frontend integration guide

**Documentation Updates**:
- [Documentation Update Summary (2025-01-26)](./00-documentation-update-2025-01-26.md) - Summary of recent documentation cleanup and corrections

---

**Last Updated**: 2025-12-30
**Active Requests**: 1 (Request #61 - WB Column Rename)
**Backlog Requests**: 1 (Request #58 - retail_price_total)
**Resolved Requests**: 68 (Request #01 through #64) + Guide #24, #29, #30 + **Epic 33 Fix** + **Epic 34 Complete**
**Latest Update**:
- ✅ **Request #90 (2025-12-30)** - Telegram Notifications System Architecture - Complete frontend integration guide with event system, templates, and API reference
- ✅ **Request #89 (2025-12-30)** - Telegram Notifications Integration - TypeScript types, React hooks, and UI components guide
- ✅ **Request #73 (2025-12-24)** - Epic 34 Telegram Notifications - Complete API guide with bot integration
- ✅ **Request #71 UPDATED (2025-12-24)** - Epic 33 SDK v2.3.1 upgrade and critical stats sync fix

**Epic 31 Complete** ✅ (2025-12-18):
- ✅ Story 31.1: SKU Financials Service - Complete financial aggregation with storage from Epic 24
- ✅ Story 31.2: SKU Financials Controller - `GET /v1/analytics/sku-financials` endpoint
- ✅ Story 31.3: Profitability Classification - Status calculation (excellent/good/warning/critical/loss/unknown)
- ✅ Story 31.4: Redis Caching - 30min TTL with event-based invalidation
- ✅ **26 Unit Tests** - Full test coverage for service, controller, and edge cases

**Epic 26 Complete** ✅ (2025-12-06):
- ✅ Story 26.1: Schema Migration - Expense columns added to weekly_margin_fact
- ✅ Story 26.2: Expense Aggregation - aggregateExpensesBySku() in MarginCalculationService
- ✅ Story 26.3: Analytics Endpoints - By SKU/Brand/Category include expense fields
- ✅ Story 26.4: Cabinet Summary - Full expenses + operating profit
- ✅ Story 26.5: Historical Recalculation - 16 weeks populated with expense data

**Epic 6-FE Complete** ✅ (2025-12-05, Avg QA Score 94/100):
- ✅ Story 6.1-FE: Date Range Support - DateRangePicker component (92/100)
- ✅ Story 6.2-FE: Period Comparison - DeltaIndicator, ComparisonPeriodSelector (94/100)
- ✅ Story 6.3-FE: ROI & Profit Metrics - Display in analytics tables (96/100)
- ✅ Story 6.4-FE: Cabinet Summary Dashboard - KPICard, TopProductsTable, TopBrandsTable (93/100)
- ✅ Story 6.5-FE: Export Analytics UI - ExportDialog, ExportStatusDisplay (95/100)

**Epic 6 Backend** (2025-11-27, Avg QA Score 91.5/100):
- ✅ Story 6.1: Date Range Analytics - `weekStart`/`weekEnd` filters (90/100)
- ✅ Story 6.2: Period Comparison - `compare_to` param with deltas (91/100)
- ✅ Story 6.3: ROI & Profit Metrics - `roi`, `profit_per_unit` fields (95/100)
- ✅ Story 6.4: Cabinet Summary Dashboard - `GET /v1/analytics/cabinet-summary` (92/100)
- ✅ Story 6.5: Export Analytics - `POST /v1/exports/analytics` CSV/XLSX (90/100)
- ✅ Story 6.6: Dedicated Trends Endpoint - `GET /v1/analytics/weekly/trends` (92/100)

**Epic 5 Complete** ✅ (2025-11-27, Avg QA Score 90/100):
- ✅ Story 5.1: View COGS History - `GET /v1/cogs/history` endpoint (90/100)
- ✅ Story 5.2: Edit COGS - `PATCH /v1/cogs/:cogsId` endpoint (90/100)
- ✅ Story 5.3: Delete COGS - `DELETE /v1/cogs/:cogsId` endpoint (90/100)

---

## 📋 Complete Summary

**[Request #23: All Requests Completed Summary](./23-all-requests-completed-summary.md)** ← **START HERE**

Comprehensive summary of all 22 completed requests with:
- Implementation status for each request
- Key API endpoints added/enhanced
- `missing_data_reason` values reference
- Frontend stories unblocked
- Documentation references

---

**Frontend Integration Status:**
- Request #14: ✅ Frontend polling implemented (Story 4.8 - Done)
- Request #15: ✅ Margin display in product list implemented
- Request #16: ✅ COGS history guide documented
- Request #17: ✅ Manual recalculation warning and button implemented
- Request #20-21: ✅ Margin status endpoint (Epic 22) implemented
- Request #22: ✅ W47 margin calculation triggered
- Epic 23: ✅ Automatic weekly import scheduling (complete)
- **Story 23.10**: ✅ **JWT Auth on Tasks & Schedules APIs** - Frontend role check implemented (2025-11-26)
- **Story 5.1**: ✅ **COGS History endpoint** - `GET /v1/cogs/history` deployed (2025-11-26)

---

## 🔐 Backend Update: Story 23.10 - JWT Authentication on Task & Schedule APIs

**Date**: 2025-11-26
**Status**: ✅ **DEPLOYED**
**Impact**: All `/v1/tasks/*` and `/v1/schedules/*` endpoints now require JWT authentication

### Breaking Change for Frontend

**Before Story 23.10**: Tasks and Schedules APIs were accessible without authentication (security gap).

**After Story 23.10**: All requests to Tasks and Schedules APIs require:

```http
Authorization: Bearer <jwt_token>
X-Cabinet-Id: <cabinet_uuid>
```

### Role Requirements

| Endpoint | Admin | Owner | Manager | Analyst | Service |
|----------|-------|-------|---------|---------|---------|
| `GET /v1/schedules` | ✅ | ✅ | ✅ | ✅ | ❌ |
| `GET /v1/schedules/:id` | ✅ | ✅ | ✅ | ✅ | ❌ |
| `PUT /v1/schedules/:id` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `POST /v1/schedules/:id/trigger` | ✅ | ✅ | ✅ | ❌ | ✅ |
| `POST /v1/tasks/enqueue` | ✅ | ✅ | ✅ | ❌ | ✅ |
| `GET /v1/tasks/:uuid` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `GET /v1/tasks` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `GET /v1/tasks/workers/health` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `GET /v1/tasks/queues/stats` | ✅ | ✅ | ✅ | ✅ | ✅ |

### Error Responses

| HTTP Status | Code | Description |
|-------------|------|-------------|
| 401 | `UNAUTHORIZED` | Missing/invalid/expired JWT token |
| 403 | `FORBIDDEN` | Insufficient role or wrong cabinet |

### Frontend Action Required

**If using manual margin recalculation** (Request #17):
- Ensure `Authorization: Bearer <token>` header is present
- Ensure user has `Manager` role or higher for `POST /v1/tasks/enqueue`
- Analyst users **cannot** trigger manual recalculation (403 error)

### Frontend Implementation (2025-11-26) ✅

Role-based access control implemented in:
- `src/components/custom/ProductMarginCell.tsx` - Button hidden for Analyst
- `src/components/custom/SingleCogsForm.tsx` - Button hidden for Analyst

**Helper function** (`canEnqueueTasks`):
```typescript
function canEnqueueTasks(role: string | undefined): boolean {
  if (!role) return false
  return ['Owner', 'Manager', 'Service'].includes(role)
}
```

**Stories updated**:
- [Story 4.8: Margin Recalculation Polling](../stories/4.8.margin-recalculation-polling.md) - AC13 added
- [Story 4.1: Single Product COGS Assignment](../stories/4.1.single-product-cogs-assignment.md) - Updated with auth info

**Example - Manual Margin Recalculation**:
```http
POST /v1/tasks/enqueue
Authorization: Bearer <jwt_token>  # Required (Story 23.10)
X-Cabinet-Id: <cabinet_uuid>       # Required
Content-Type: application/json

{
  "task_type": "recalculate_weekly_margin",
  "payload": {
    "cabinet_id": "<cabinet_id>",
    "weeks": ["2025-W46"],
    "nm_ids": ["321678606"]
  }
}
```

### Documentation References

- **Story**: [`docs/stories/epic-23/story-23.10-enable-jwt-auth-on-task-apis.md`](../../../docs/stories/epic-23/story-23.10-enable-jwt-auth-on-task-apis.md)
- **QA Gate**: [`docs/qa/gates/23.10-enable-jwt-auth-on-task-apis.yml`](../../../docs/qa/gates/23.10-enable-jwt-auth-on-task-apis.yml)
- **CLAUDE.md Section**: Search for "Story 23.10: Task & Schedule API Authentication"
