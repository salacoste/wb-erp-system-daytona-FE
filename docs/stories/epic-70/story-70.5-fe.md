# Story 70.5-FE: [Backend Request] Funnel Buyout Data JOIN

| Field | Value |
|-------|-------|
| Epic | 70-FE Validation Fixes |
| Priority | P1 |
| SP | 2 |
| Status | 📋 Blocked (Backend) |
| Group | C (D-12) |
| Backend Request | Pending |

## Description

Как владелец бизнеса, я хочу видеть данные о выкупах и отменах в воронке продаж,
чтобы понимать полный путь клиента от просмотра до получения товара.

## Problem

Endpoint `GET /v1/analytics/funnel` возвращает `buyoutCount=0` и `cancelCount=0`
для **ВСЕХ** 32 товаров, хотя за тот же период на странице Buyout Analytics
отображается 677 продаж.

### Evidence

| Source | Views | Orders | Buyouts | Cancels |
|--------|-------|--------|---------|---------|
| Funnel API | 4,092 ✅ | 119 ✅ | **0** ❌ | **0** ❌ |
| Buyout API | — | — | 677 ✅ | 9 ✅ |

### Root Cause (Backend)

Funnel endpoint берёт `openCardCount`, `addToCartCount`, `ordersCount` из WB Content Analytics
(nmReport/product_funnel_daily), но **не JOIN'ит** с orders/finance таблицами для buyouts/cancels.

## Frontend Status

**Frontend полностью готов** — типы, компоненты, отображение buyoutCount/cancelCount
корректно реализованы:

| Component | Field | Status |
|-----------|-------|--------|
| `FunnelSummaryCards.tsx:51` | `summary?.buyoutCount` | ✅ Ready |
| `FunnelTable.tsx:139` | `item.buyoutCount` | ✅ Ready |
| `FunnelChart.tsx:80` | buyoutCount bar | ✅ Ready |
| `analytics-funnel.ts` (types) | `buyoutCount: number` | ✅ Defined |

## Backend Request

### What Backend Needs to Fix

1. In `FunnelAnalyticsService` (или аналог): добавить JOIN с таблицей заказов/финансов
2. Заполнить `buyoutCount` — количество выкупленных единиц за период (по SKU)
3. Заполнить `cancelCount` — количество отменённых заказов за период (по SKU)
4. Рассчитать `buyoutConversion` = buyoutCount / openCardCount
5. Рассчитать `cancelRate` = cancelCount / ordersCount
6. Рассчитать `totalConversion` = buyoutCount / openCardCount (сквозная)

### Data Source Suggestion

Использовать логику из работающего `BuyoutAnalyticsService`:
- `/v1/analytics/buyout/by-sku` правильно считает выкупы из orders/finance данных
- Merge эту логику в funnel aggregation

### API Contract (Unchanged)

```typescript
interface FunnelProductItem {
  nmId: number
  openCardCount: number      // ← works
  addToCartCount: number     // ← works
  ordersCount: number        // ← works
  buyoutCount: number        // ← needs fix: currently always 0
  cancelCount: number        // ← needs fix: currently always 0
  buyoutConversion: number   // ← needs fix: currently 0
  cancelRate: number         // ← needs fix: currently 0
  totalConversion: number    // ← needs fix: currently 0
}
```

## Acceptance Criteria

- AC1: Funnel API возвращает non-zero buyoutCount для товаров с выкупами
- AC2: buyoutConversion = buyoutCount / openCardCount (корректно)
- AC3: cancelRate = cancelCount / ordersCount (корректно)
- AC4: totalConversion = buyoutCount / openCardCount (сквозная конверсия)
- AC5: Frontend автоматически отображает данные (no frontend changes needed)

## Frontend Changes Required

**None** — frontend fully implemented and waiting for backend data.

## References

- Backend spec: `docs/request-backend/151-EPICS-68-71-ANALYTICS-API.md`
- Test API: `../test-api/29-funnel-analytics.http`
- Working buyout endpoint: `/v1/analytics/buyout/by-sku`
