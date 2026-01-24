# Recently Resolved - Major Epics (33-36, 45)

[< Back to Index](./README.md) | [Next: Pending Requests >](./README-SHARD-02-pending-financial.md)

---

This shard contains recently resolved requests for major epics including Advertising Analytics (Epic 33), Telegram Notifications (Epic 34), Total Sales & Organic Revenue (Epic 35), and Product Card Linking (Epic 36).

---

## Request #99: Products API - Add Dimensions and Category

**Date**: 2026-01-21
**Priority**: P1 - Documentation Update
**Status**: DOCUMENTATION UPDATED - Product retrieval guide added
**Component**: Backend API - Products Module (Epic 45)
**Related**: Epic 44-FE (Price Calculator UI)

**Summary**: Added comprehensive guide for retrieving products by nm_id with dimensions and category data.

**New Documentation Section**:
- "How to Get Product by nm_id" - Quick reference table with endpoint, headers, params
- cURL examples for common scenarios
- Response structure with critical field warnings (nm_id is string, sa_name not title, category_hierarchy not category)
- TypeScript integration examples with proper type definitions
- Error handling patterns for missing dimensions
- Performance notes (cache hit ~150ms, cache miss ~350-550ms)
- Testing guide with REST Client examples

**Critical Warnings Added**:
- `nm_id` is `string` (not `number`)
- Use `sa_name` (not `title`)
- Use `category_hierarchy` (not `category`)

**Documentation**:
- **[99-products-dimensions-category-api.md](./99-products-dimensions-category-api.md)** - UPDATED with "How to Get Product by nm_id" section
- **[test-api/45-products-dimensions.http](../../../test-api/45-products-dimensions.http)** - API test examples

**Frontend Action Required**: Review new documentation section and update Price Calculator components if needed.

---

## Request #87: Backend Response - imtId Field in SKU Mode

**Date**: 2025-12-28
**Priority**: High
**Status**: IMPLEMENTED - Ready for frontend integration
**Component**: Backend API - Advertising Analytics (Epic 36)
**Related**: [Request #86](./86-epic-36-sku-mode-imtid-field.md)

**Summary**: Backend implemented adding `imtId: number | null` field in API response for `group_by='sku'` mode.

**Implemented Changes**:
- Field `imtId` is now **required** (not optional) - always present in response
- Returns `number` for articles in merged groups or `null` for single articles
- Uses existing JOIN with `products` table
- **NO breaking changes** - backward compatible
- Unit tests updated and passing

**Frontend Can Now**:
- Show badge "Product in group #328632" for child articles (spend=0)
- Show badge "Main in group #328632" for main articles (spend>0)
- Explain why ROAS/ROI = null (article in group, metrics on group level)
- Add button "Show group metrics" -> navigate to `group_by='imtId'` with filter

**TypeScript Type Update Required**:
```typescript
// BEFORE
imtId?: number | null;  // optional

// AFTER
imtId: number | null;   // required (always in response)
```

**Estimated Frontend Effort**: 2-3 hours (types + `ProductRowBadge` component + tests)

**Documentation**:
- **[87-epic-36-backend-response-imtid-sku.md](./87-epic-36-backend-response-imtid-sku.md)** - BACKEND RESPONSE & INTEGRATION GUIDE
- **[86-epic-36-sku-mode-imtid-field.md](./86-epic-36-sku-mode-imtid-field.md)** - Frontend request

---

## Request #86: Epic 36 - Add imtId in group_by='sku' Mode

**Date**: 2025-12-28
**Priority**: High (blocks full Epic 36 UX implementation)
**Status**: RESOLVED - Backend implemented (Request #87)
**Component**: Backend API - Advertising Analytics (Epic 36)
**Related**: Request #82-85 (Epic 36 documentation chain)

**Summary**: Request to add `imtId` field to API response for `group_by='sku'` mode.

**Backend Response**: IMPLEMENTED - See [Request #87](./87-epic-36-backend-response-imtid-sku.md)

**Frontend Action Required**: Integrate `ProductRowBadge` component (2-3 hours)

**Documentation**: [86-epic-36-sku-mode-imtid-field.md](./86-epic-36-sku-mode-imtid-field.md)

---

## Request #85: Epic 36 Production Status & Critical Bugfix

**Date**: 2025-12-28
**Priority**: CRITICAL UPDATE - Production ready after bugfix
**Status**: PRODUCTION READY - Frontend integration approved
**Component**: Backend API - Product Card Linking (Epic 36)
**Related**: Request #82 (Card Linking Investigation), Request #83 (API Contract), Request #84 (Frontend Guide)

**Summary**: Epic 36 **Product Card Linking** achieved production readiness after fixing critical WB API pagination bug.

**Critical Bugfix Applied (2025-12-28)**:
- **Problem**: WB Content API rejected sync requests with `ValidationError` (HTTP 400)
- **Fix**: Changed pagination limit from 1000 to **100 cards/batch** (WB API maximum)
- **Validated**: Production sync successful (47 products, 1.4s)
- **Impact on Frontend**: **NO breaking changes** - API contract unchanged

**Epic 36 Features** (Ready for Frontend Integration):
- `products` table populated with `imtId` (WB merged card identifier)
- Daily automatic sync at 06:00 MSK
- Analytics API supports `group_by=imtId` parameter
- Aggregated metrics for merged product groups
- Manual sync endpoint: `POST /v1/imports/products/sync-imt-ids`
- Backward compatible with existing `group_by=sku` mode

**Frontend Integration Status**:
- API Contract: Request #83 (updated with bugfix info)
- Integration Guide: Request #84 (step-by-step plan)
- Estimated Effort: 3-4 hours development + 1-2 hours testing
- No breaking changes - safe to proceed

**PO Approval**: 10/10 (All 26 acceptance criteria met)

**Documentation**:
- **[85-epic-36-production-status.md](./85-epic-36-production-status.md)** - PRODUCTION STATUS & BUGFIX DETAILS
- **[83-epic-36-api-contract.md](./83-epic-36-api-contract.md)** - API CONTRACT (TypeScript types, examples)
- **[84-epic-36-frontend-integration-guide.md](./84-epic-36-frontend-integration-guide.md)** - INTEGRATION GUIDE (step-by-step)
- **[82-card-linking-product-bundles.md](./82-card-linking-product-bundles.md)** - PROBLEM CONTEXT
- [docs/epics/epic-36-product-card-linking.md](../../../docs/epics/epic-36-product-card-linking.md) - Backend epic overview
- [docs/stories/epic-36/story-36.2-content-api-sync.md](../../../docs/stories/epic-36/story-36.2-content-api-sync.md) - Bugfix details
- [test-api/04-imports.http](../../../test-api/04-imports.http) - Sync endpoint examples
- [test-api/07-advertising-analytics.http](../../../test-api/07-advertising-analytics.http) - Analytics with groupBy

**Next Steps for Frontend**:
1. Review Request #83-84 documentation
2. Implement TypeScript types (`GroupByMode`, `MergedProduct`)
3. Add UI toggle `[By articles] [By groups]`
4. Create `MergedProductBadge` component
5. Write tests (unit, integration, E2E)

---

## Request #76: Efficiency Filter Implementation

**Date**: 2025-12-24 -> **Resolved**: 2025-12-26
**Priority**: High - Feature Implementation
**Status**: RESOLVED - Backend complete, ready for frontend integration
**Component**: Backend API - Advertising Analytics Module
**Related**: Request #71 (Epic 33 Advertising Analytics), Story 33.4-FE (Efficiency Status Filter)

**Problem**: Backend rejected `efficiency_filter` query parameter with 400 BAD_REQUEST validation error, despite being documented in Request #71. Frontend already implemented UI for filtering but couldn't use it.

**Solution Implemented**: Server-side filtering by efficiency status
- Added `efficiency_filter` to DTO with enum validation
- Implemented filter logic in service (applied after classification, before sorting)
- Summary calculated on FILTERED items (accurate totals)
- Swagger documentation added
- Test cases added (test-api #11-12)

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

**Frontend Impact**: No breaking changes - additive feature
- Remove client-side workaround if implemented
- Test with test-api examples #11-12
- Mark Story 33.4-FE as COMPLETE

**Performance**: < 1ms filter overhead, overall p95 < 500ms maintained

**Documentation**:
- **[76-efficiency-filter-not-implemented.md](./76-efficiency-filter-not-implemented.md)** - PROBLEM DESCRIPTION
- **[76-efficiency-filter-not-implemented-backend.md](./76-efficiency-filter-not-implemented-backend.md)** - IMPLEMENTATION GUIDE
- [test-api/07-advertising-analytics.http](../../../test-api/07-advertising-analytics.http) - API EXAMPLES (#11-12)

---

## Request #78: Epic 35 Critical Bugfix & SDK v2.4.0 Upgrade

**Date**: 2025-12-25
**Priority**: CRITICAL BUGFIX + SDK UPGRADE
**Status**: RESOLVED - Bug fixed, SDK upgraded, all tests passing
**Component**: Backend API - Advertising Analytics Service + SDK Migration
**Epic**: Epic 35 - Total Sales & Organic vs Ad-Attributed Revenue Split
**Story**: Story 35.7 - Critical Bug Fix: docType Filter Mismatch

**Problem**: Epic 35 deployed but ALL products showed `totalSales=0` in advertising analytics dashboard (100% impact).

**Root Cause**: Hybrid query used wrong `docType` filter value:
- **Used**: `docType: 'Prodaja'` (Russian capitalized from `daily_sales_raw` convention)
- **Expected**: `docType: 'sale'` (English lowercase for `wb_finance_raw` table)
- **Result**: Query returned 0 rows -> totalSales=0 for ALL SKUs

**Fix Applied** (80 min resolution):
```typescript
// Changed 3 locations in advertising-analytics.service.ts (lines 503, 582, 741)
docType: 'Prodaja'  ->  docType: 'sale'
```

**Results After Fix**:
| Metric | Before | After |
|--------|--------|-------|
| Total Sales | 0 | 1,079,457.71 |
| Organic Sales | 0 | 939,203.71 |
| Organic % | 0% | 87.01% |
| Ad Revenue | 140,254 | 140,254 |

**SDK v2.4.0 Upgrade**:
- Upgraded from v2.3.2 -> v2.4.0
- Type 9 API compliance verified
- No deprecated methods used (0/4)
- No migration required - already using recommended APIs
- Deadline: February 2, 2026 - no action needed

**Frontend Impact**: No breaking changes - all Epic 35 fields remain additive and backward compatible.

**Performance**: Hybrid query maintains **17-37ms p95** latency (27x better than target).

**Documentation**:
- **[78-epic-35-bugfix-sdk-upgrade.md](./78-epic-35-bugfix-sdk-upgrade.md)** - FULL DETAILS & FAQ
- [docs/SDK-MIGRATION-V2.4.0-ANALYSIS.md](../../../docs/SDK-MIGRATION-V2.4.0-ANALYSIS.md) - Migration analysis
- [docs/stories/epic-35/35.7-critical-bugfix-doctype-mismatch.md](../../../docs/stories/epic-35/35.7-critical-bugfix-doctype-mismatch.md) - Detailed bugfix
- [docs/ADVERTISING-ANALYTICS-GUIDE.md](../../../docs/ADVERTISING-ANALYTICS-GUIDE.md) - v1.4 (updated)
- [docs/CHANGELOG.md](../../../docs/CHANGELOG.md) - SDK upgrade + bugfix entries

---

## Request #73: Telegram Notifications API (Epic 34)

**Date**: 2025-12-24
**Priority**: NEW FEATURE
**Status**: COMPLETE - Backend + Bot Integration deployed
**Component**: Backend API - Notifications Module + Telegram Bot
**Epic**: Epic 34 - Telegram Notifications

**Summary**: Push notification system in Telegram for background task completion.

**Key Features**:
- Telegram account binding via 6-digit code
- Preference settings (event types, language, quiet hours)
- Telegram bot with commands (/start, /status, /settings, /help)
- Multi-language support (ru/en)
- Quiet hours with timezone support
- Rate limiting (30 msg/s global, 1 msg/s per chat)

**API Endpoints**:
```http
POST /v1/notifications/telegram/bind        # Start binding
GET  /v1/notifications/telegram/status      # Check status
DELETE /v1/notifications/telegram/unbind    # Unbind Telegram
GET  /v1/notifications/preferences          # Get preferences
PUT  /v1/notifications/preferences          # Update preferences
POST /v1/notifications/test                 # Test notification
```

**Event Types**:
| Type | Default | Description |
|------|---------|-------------|
| `task_completed` | Yes | Task completed successfully |
| `task_failed` | Yes | Task failed with error |
| `task_stalled` | No | Task stalled (>30 min) |
| `daily_digest` | Yes | Daily digest (08:00) |

**Bot Commands**:
| Command | Description |
|---------|-------------|
| `/start <code>` | Bind account |
| `/status` | Connection status |
| `/settings` | Settings (inline keyboard) |
| `/help` | Command list |

**Documentation**:
- **[73-telegram-notifications-epic-34.md](./73-telegram-notifications-epic-34.md)** - FRONTEND INTEGRATION GUIDE
- [TELEGRAM-NOTIFICATIONS-GUIDE.md](../../../docs/TELEGRAM-NOTIFICATIONS-GUIDE.md) - Complete guide
- [test-api/13-notifications.http](../../../test-api/13-notifications.http) - API examples

**Frontend TODO**:
- [ ] Create `/settings/notifications` page
- [ ] Implement Telegram binding (with polling)
- [ ] Add notification preferences panel
- [ ] Show binding status in UI

---

## Request #89: Telegram Notifications Integration Guide

**Date**: 2025-12-30
**Priority**: DOCUMENTATION
**Status**: COMPLETE - Frontend integration guide
**Component**: Frontend Documentation - Epic 34
**Related**: Request #73 (Epic 34 API), Request #90 (Architecture)

**Summary**: Complete guide for integrating Telegram notifications in frontend.

**Content**:
- TypeScript types for TelegramBinding and NotificationPreferences
- React hooks: `useTelegramBinding`, `useNotificationPreferences`, `useQuietHours`
- API client with methods for all endpoints
- UI components: TelegramBindingCard, PreferencesPanel, QuietHoursSelector
- Usage examples and best practices

**Documentation**:
- **[89-telegram-notifications-integration.md](./89-telegram-notifications-integration.md)** - IMPLEMENTATION GUIDE

---

## Request #90: Telegram Notifications System Architecture

**Date**: 2025-12-30
**Priority**: DOCUMENTATION
**Status**: COMPLETE - System architecture guide
**Component**: Frontend Documentation - Epic 34
**Related**: Request #73 (Epic 34 API), Request #89 (Integration)

**Summary**: Complete architectural documentation of Telegram notifications system for frontend team.

**Key Sections**:
- System Architecture - Backend vs Frontend responsibilities (Backend 100% content ownership)
- Event System - event types, flow, preference checks
- Notification Structure - message format, templates, variables
- Task Types & Metrics - detailed task-specific metrics (2025-12-30 update)
- Message Templates - Handlebars syntax, formatting, emojis
- User Preferences API - all endpoints with examples
- Telegram Binding Flow - step-by-step process
- Real-time Status - notification log, history API
- Troubleshooting - common issues and solutions

**Key Features Documented**:
- Task-specific detailed metrics (products fetched/added/removed for products_sync)
- Advertising sync metrics (campaigns/stats/costs for adv_sync)
- Storage import metrics (records imported for paid_storage_import)
- Product linking metrics (products/groups for product_imt_sync)
- Emoji-enhanced task type labels
- Number formatting with thousands separators
- Multi-language support (ru/en)
- Rate limiting (60 messages/hour per chat)
- Quiet hours with timezone support

**Documentation**:
- **[90-telegram-notifications-system-architecture.md](./90-telegram-notifications-system-architecture.md)** - ARCHITECTURE GUIDE
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

## Request #75: Advertising Revenue Always Zero

**Date**: 2025-12-24
**Priority**: CRITICAL BUG
**Status**: FIXED - Backend fix deployed
**Component**: Backend API - Advertising Analytics Service
**Related**: Request #71 (Epic 33)

**Problem**: Backend returned `revenue: 0` for ALL items, causing:
- ROAS always 0.0x (should be revenue / spend)
- All items classified as "loss" even with ROI > 100%
- Example: Items with profit 77,844 (ROI 131.88%) shown as "Loss"

**Root Cause**: Backend incorrectly queried `wb_finance_raw` table (general sales NOT ad-attributed) instead of using WB API `orderSum` field (actual ad revenue).

**Fix Applied** (commit `a9931cf`):
```typescript
// BEFORE: Wrong source (wb_finance_raw)
const revenue = revenueMap.get(stat.nmId) || 0;

// AFTER: Correct source (WB API orderSum)
const revenue = stat.orderSum;
```

**Impact**:
- Revenue correctly populated from WB API
- ROAS calculated correctly (revenue / spend)
- Efficiency status correct (excellent/good/moderate/poor/loss)
- Performance improved (removed unnecessary DB query)

**Verification Results**:
```
Sample: nmId 193775258 -> Revenue: 7975, Spend: 932.91, ROAS: 8.55x
Sample: nmId 255211393 -> Revenue: 4848, Spend: 136.14, ROAS: 35.61x
Average ROAS: 9.38x
```

**Documentation**:
- **[75-advertising-revenue-zero.md](./75-advertising-revenue-zero.md)** - PROBLEM + SOLUTION

---

## Request #71: Advertising Analytics API (Epic 33)

**Date**: 2025-12-22 -> **Updated**: 2025-12-24
**Priority**: NEW FEATURE + CRITICAL FIX
**Status**: COMPLETE + Stats Sync Fixed
**Component**: Backend API - Analytics Module + WB Promotion SDK
**Epic**: Epic 33 - Advertising Analytics
**SDK Version**: daytona-wildberries-typescript-sdk **v2.3.1+**

**Latest Update (2025-12-24)**: Critical stats sync fix applied - eliminated "nmId: undefined" errors.

**Root Causes Fixed**:
1. Missing ADV_SYNC queue routing
2. Wrong WB API parameters (v2 -> v3 migration)
3. Optional chaining hiding API errors
4. Parser not handling nested response: `stats[].days[].apps[].nms[].nmId`

**Changes**:
- **SDK**: Upgraded v2.3.0 -> v2.3.1 (proper TypeScript types for nested responses)
- **WB API**: Fixed fullstats parameters `{ids, beginDate, endDate}` (batch up to 100 campaigns)
- **Queue**: Added ADV_SYNC queue injection and routing
- **Parser**: Updated for nested structure with nms[] array iteration
- **Rate Limits**: 3 req/min (20s interval)

**Verification Results**:
- 54 stats records successfully synced
- 10 unique SKUs tracked
- Zero "nmId: undefined" errors

**Backend Commits**:
- `4c37521` - SDK upgrade and stats parser fix
- `180fd13` - Documentation updates
- `716ab52` - Test-API documentation updates

**Documentation**:
- **[71-advertising-analytics-epic-33.md](./71-advertising-analytics-epic-33.md)** - UPDATED WITH v2.3.1 DETAILS
- [ADVERTISING-ANALYTICS-GUIDE.md](../../../docs/ADVERTISING-ANALYTICS-GUIDE.md) - Complete guide with troubleshooting
- [test-api/07-advertising-analytics.http](../../../test-api/07-advertising-analytics.http) - API examples

**Troubleshooting**: [ADVERTISING-ANALYTICS-GUIDE.md#stats-sync-fix](../../../docs/ADVERTISING-ANALYTICS-GUIDE.md#problem-stats-sync-failing-with-nmid-undefined-fixed-2025-12-24)

---

[< Back to Index](./README.md) | [Next: Pending Requests >](./README-SHARD-02-pending-financial.md)
