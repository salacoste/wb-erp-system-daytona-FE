# Story 69.3-FE: Buyout Summary Widget

| Field | Value |
|-------|-------|
| Epic | 69-FE Buyout Analytics |
| Priority | P2 |
| SP | 5 |
| Status | ✅ Complete |

## Description

Как владелец бизнеса, я хочу видеть общий процент выкупа кабинета с визуальной шкалой и списком проблемных SKU, чтобы быстро оценить ситуацию.

## Acceptance Criteria

- AC1: Overall buyout rate displayed as green/red progress bar
- AC2: Return count and sales count shown below bar
- AC3: FBS return reason breakdown bar (blue=cancel, orange=PVZ, red=after receipt)
- AC4: Return breakdown only shown when `total > 0`
- AC5: Classification coverage warning when `< 100%`
- AC6: Top decliners section with TrendingDown icon when non-empty
- AC7: Per-decliner row shows nmId, buyoutRatePct, trendDelta in percentage points
- AC8: Loading skeleton while data fetches
- AC9: Error state with retry button

## Files

| File | Action | Lines |
|------|--------|-------|
| `src/app/(dashboard)/analytics/buyout/components/BuyoutSummaryWidget.tsx` | Created | 147 |

## Dependencies
- Blocked by: 69.1, 69.2
