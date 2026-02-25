# Story 69.4-FE: Per-SKU Buyout Table

| Field | Value |
|-------|-------|
| Epic | 69-FE Buyout Analytics |
| Priority | P2 |
| SP | 8 |
| Status | ✅ Complete |

## Description

Как владелец бизнеса, я хочу видеть таблицу с процентом выкупа по каждому SKU с сортировкой и пагинацией, чтобы находить проблемные товары.

## Acceptance Criteria

- AC1: 12-column table: nmId, Артикул, Товар, Бренд, Продажи, Возвраты, Выкуп %, До отправки, Отказ ПВЗ, После получ., Тренд, Уверенность
- AC2: Server-side sorting on buyoutRate, salesCount, returnRate, trend columns
- AC3: Pagination with 50 items/page, offset-based, "Назад"/"Далее" buttons
- AC4: Confidence badges: high=none, medium="Мало данных" (gray), low="Недостаточно данных" (yellow)
- AC5: Trend indicators: TrendingUp (green), TrendingDown (red), Minus (muted) with delta
- AC6: Return reason columns color-coded: blue, orange, red; show "—" when null
- AC7: Product enrichment via `useProducts` for vendorCode/brand fallback
- AC8: Empty state: "Нет данных за выбранный период"
- AC9: Error state: "Не удалось загрузить данные выкупов" with retry

## Files

| File | Action | Lines |
|------|--------|-------|
| `src/app/(dashboard)/analytics/buyout/components/BuyoutTable.tsx` | Created | 281 ⚠️ |

## Known Issues
- File exceeds 200-line ESLint limit — needs refactoring (extract sub-components)
- `useProducts({ limit: 200 })` cap silently degrades for large catalogs
- Sort order toggle doesn't reset pagination offset

## Dependencies
- Blocked by: 69.1, 69.2
