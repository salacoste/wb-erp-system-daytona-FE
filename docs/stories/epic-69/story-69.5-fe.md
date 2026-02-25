# Story 69.5-FE: Page Scaffold & Routing

| Field | Value |
|-------|-------|
| Epic | 69-FE Buyout Analytics |
| Priority | P1 |
| SP | 3 |
| Status | ✅ Complete |

## Description

Как пользователь, я хочу перейти на страницу аналитики выкупов через навигацию, выбрать период и источник данных.

## Acceptance Criteria

- AC1: Route `/analytics/buyout` defined in `routes.ts`
- AC2: Thin `page.tsx` Server Component delegates to `BuyoutPageContent`
- AC3: Page title "Аналитика выкупов", subtitle "Процент выкупа и тренды по SKU"
- AC4: DateRangePickerExtended with maxDays=365, default last 30 days
- AC5: Source selector with 3 options: Комбинированный, Еженедельный отчёт, Реалтайм
- AC6: Source selector controls both summary widget and table
- AC7: FBS return breakdown fetched via `useFulfillmentSummary` and passed to summary widget

## Files

| File | Action | Lines |
|------|--------|-------|
| `src/app/(dashboard)/analytics/buyout/page.tsx` | Created | 10 |
| `src/app/(dashboard)/analytics/buyout/components/BuyoutPageContent.tsx` | Created | 89 |
| `src/lib/routes.ts` | Edited (line 42) | — |

## Known Issues
- Uses native `<select>` instead of shadcn `Select` component — design system inconsistency

## Dependencies
- Blocked by: 69.2
