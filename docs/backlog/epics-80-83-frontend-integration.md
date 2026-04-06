# Frontend Integration — Backend Epics 80-83

> Date: 2026-04-06
> Backend delivery: 4 new endpoints + 3 breaking changes
> Priority order per backend team recommendation

---

## Story 1: Seller Info + Jam Status — handle `available` field [CRITICAL]

### 1A: Update Seller Info types and sidebar

**Why critical**: Backend now always returns 200. If `available: false`, data fields are empty/stale. Without handling this, sidebar shows empty name.

**Backend change**: `GET /v1/cabinets/:id/seller-info`
```typescript
interface SellerInfoResponse {
  name: string
  sid: string         // was number|string, now always string UUID
  tradeMark: string
  available: boolean  // NEW — false means WB API failed
  reason?: string     // NEW — "token_error" | "insufficient_permissions" | "timeout" | "wb_api_error"
}
```

**Files to change**:
- `src/types/cabinet.ts` — update `SellerInfo` type: add `available`, `reason`; change `sid` to `string`
- `src/components/custom/SidebarCabinetInfo.tsx` — check `available`, show fallback + reason hint on hover
- `src/components/custom/settings/CabinetInfoCard.tsx` — show warning banner when `available: false`
- `src/hooks/useSellerInfo.ts` — remove `retry: false` comment (backend always 200 now)

**AC**:
- [ ] `available: true` — show name/tradeMark as before
- [ ] `available: false` — sidebar shows "Кабинет" + warning icon, settings page shows reason in Russian
- [ ] `sid` type is `string` everywhere (no `number` union)
- [ ] No 500 error handling (removed)

**Estimate**: 2 hours

---

### 1B: Update Jam Status types and UI

**Why critical**: Breaking change — `available` field distinguishes "no subscription" from "couldn't check".

**Backend change**: `GET /v1/cabinets/:id/jam-status`
```typescript
interface JamStatusResponse {
  tier: 'none' | 'standard' | 'advanced'
  available: boolean    // NEW — false means probe failed
  checkedAt: string
  probeCallsMade: number
  searchTextsLimit: number
  reason?: string       // NEW — "no_products" | "token_error" | "insufficient_permissions" | "timeout" | "wb_api_error"
}
```

**Files to change**:
- `src/types/cabinet.ts` — update `JamStatusResponse` type: add `available`, `reason`
- `src/components/custom/SidebarCabinetInfo.tsx` — show badge only when `available: true && tier !== 'none'`
- `src/components/custom/jam/RequireJam.tsx` — gate on `available && tier !== 'none'`
- `src/components/custom/settings/CabinetInfoCard.tsx` — show "Не удалось проверить" when `available: false`
- `src/hooks/useJamStatus.ts` — remove retry: false (backend always 200)

**Logic**:
| available | tier | UI |
|:-:|:-:|---|
| true | none | "Нет подписки" (correct) |
| true | standard | "Джем Стандарт" badge |
| true | advanced | "Джем Продвинутый" badge |
| false | * | "Статус неизвестен" + reason tooltip |

**AC**:
- [ ] `available: true, tier: "none"` — "Нет подписки" on settings page, no badge in sidebar
- [ ] `available: true, tier: "standard"` — blue badge in sidebar
- [ ] `available: false` — no badge in sidebar, settings shows "Не удалось проверить: {reason}"
- [ ] Search analytics respects `available` before using `searchTextsLimit`

**Estimate**: 2 hours

---

## Story 2: Token Health Banner [HIGH]

**New endpoint**: `GET /v1/cabinets/:id/token-status`
```typescript
interface TokenHealthResponse {
  healthy: boolean
  lastError?: string
  lastErrorAt?: string       // ISO 8601
  firstErrorAt?: string
  errorCount?: number
  lastSuccessAt?: string
  recommendation?: string    // Russian text for user
}
```

**What to build**:
- New hook: `src/hooks/useTokenHealth.ts` — poll every 60s
- New component: `src/components/custom/TokenHealthBanner.tsx` — dismissable warning banner
- Wire into dashboard layout (all pages) — show below header when `healthy: false`

**Design**:
```
⚠️ Проблема с WB API токеном
   {recommendation}
   Последняя ошибка: {lastError} ({lastErrorAt})
   [Настройки кабинета →]                        [✕]
```
- Yellow/amber warning banner (not red error)
- Dismissable per session (localStorage flag)
- Re-appears if `errorCount` increases
- Link to `/settings/cabinet`

**AC**:
- [ ] Banner shows when `healthy: false`
- [ ] Banner dismissable, re-appears on new errors
- [ ] Shows `recommendation` text from backend
- [ ] Polls every 60s, stops when healthy
- [ ] Not shown on login/onboarding pages

**Estimate**: 3 hours

---

## Story 3: Trends — new metrics (wb_sales_gross, wb_returns_gross) [HIGH]

**Backend change**: 3 new metrics available in `GET /v1/analytics/weekly/trends?metrics=...`
- `wb_sales_gross` — seller revenue (after WB commission) — NOW AVAILABLE
- `wb_returns_gross` — gross returns
- `wb_commission_rub` — WB commission in rubles

**Files to change**:
- `src/hooks/useTrends.ts` — switch `sale_gross` back to `wb_sales_gross` (more accurate for P&L), add `wb_commission_rub`
- `src/components/custom/TrendGraph.tsx` — update labels, optionally allow metric toggling
- `src/types/api.ts` — update `WeeklyTrendsResponse` data point type

**Impact on efficiency calculation**:
- Current: `efficiencyPct = (payout - cogs) / sale_gross * 100`
- Better: `efficiencyPct = (payout - cogs) / wb_sales_gross * 100` (excludes WB commission from denominator)

**AC**:
- [ ] Trends use `wb_sales_gross` instead of `sale_gross` for revenue line
- [ ] Efficiency % recalculated with seller revenue as base
- [ ] Labels updated: "Выручка продавца" instead of "Продажи (розница)"
- [ ] No data gaps (wb_sales_gross available for all weeks)

**Estimate**: 1.5 hours

---

## Story 4: FCU Analytics — connect /shipment-cost/by-sku [MEDIUM]

**New endpoint**: `GET /v1/shipment-cost/by-sku` (Story 83.1) — IMPLEMENTED

**What to do**: Re-enable the disabled hook. Types already match the response.

**Files to change**:
- `src/hooks/use-fcu-aggregation.ts` — set `enabled: !!week` (was `false`), restore `getFcuBySku` import
- `src/hooks/__tests__/use-fcu-aggregation.test.ts` — restore fetch/error tests

**AC**:
- [ ] Unit-economics page shows "Доставка" column with FCU data
- [ ] Graceful: no FCU data → "—" in column (existing merge logic handles this)
- [ ] Tests pass

**Estimate**: 30 min

---

## Story 5: Bid Recommendations UI [LOW]

**New endpoint**: `GET /v1/cabinets/:id/campaigns/:advertId/bid-recommendations?nmId=X`

**What to build**:
- New API function: `src/lib/api/advertising/bid-recommendations-api.ts`
- New hook: `src/hooks/useBidRecommendations.ts`
- New component: integrate into campaign detail page (advertising analytics)
- Display: competitive, leaders, top-2 bids + per-keyword ranges

**Prerequisites**: Campaign detail UI exists? Check current advertising page structure.

**AC**:
- [ ] Bid recommendations shown on campaign/SKU detail view
- [ ] Both `advertId` (number) and `nmId` (number) validated
- [ ] Cache-aware (30min backend cache)
- [ ] Error handling for rate limits

**Estimate**: 4-6 hours (new UI section)

---

## Story 6: Client Info (PII) for FBS Orders [LOW]

**New endpoint**: `GET /v1/cabinets/:id/orders/client-info?orderIds=123,456`

**What to build**:
- New API function: `src/lib/api/orders/client-info-api.ts`
- New hook: `src/hooks/useClientInfo.ts`
- Integrate into orders table — expandable row or tooltip with client name/phone
- Gate on `user.role === 'Owner'`

**Constraints**:
- Max 100 orderIds per request
- Only Owner role (403 for others)
- PII data — no caching in localStorage, no logging

**AC**:
- [ ] Owner sees "Клиент" column/expandable in orders table
- [ ] Non-Owner: column hidden
- [ ] Batch requests (max 100 ids)
- [ ] PII not stored in browser storage

**Estimate**: 4-6 hours (new column + role gate)

---

## Execution Order

```
Week 1:
  Story 1A (seller-info available)     — 2h  ← CRITICAL
  Story 1B (jam-status available)      — 2h  ← CRITICAL
  Story 4  (FCU by-sku re-enable)      — 30m ← quick win

Week 2:
  Story 2  (token health banner)       — 3h  ← HIGH
  Story 3  (trends wb_sales_gross)     — 1.5h ← HIGH

Week 3+:
  Story 5  (bid recommendations)       — 4-6h ← LOW
  Story 6  (client info PII)           — 4-6h ← LOW
```

**Total estimate**: ~17-21 hours across 3 weeks

---

## Dependencies

| Story | Depends on |
|-------|-----------|
| 1A, 1B | Backend deployed (Epics 80-83) |
| 2 | Redis token health data populated |
| 3 | `wb_sales_gross` available in trends API (confirmed) |
| 4 | Confirmed shipments in DB (test data needed) |
| 5 | Campaign management UI (check if exists) |
| 6 | FBS orders page (exists) |
