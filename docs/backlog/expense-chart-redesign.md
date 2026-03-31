# Expense Chart Redesign — Horizontal Bars with Business Context

> UX Design: Sally (BMM UX Designer), 2026-03-31
> Source: Browser audit + user feedback on dashboard "Разбивка расходов" card

## Problem

Current vertical bar chart is unreadable: rotated labels, no values on bars, no totals, no % of revenue, no W-o-W comparison, random colors.

## Design Decision

**Horizontal bar chart** with summary header:
- Header: Total expenses + % of revenue + W-o-W change badge
- Horizontal bars: category label (left) → bar → amount + % (right)
- Merge <1% categories into "Прочее"
- Semantic color scheme
- Hover tooltip: amount, %, W-o-W, % of revenue

## Files to Change

- `src/components/custom/ExpenseChart.tsx` — rewrite to horizontal layout
- `src/components/custom/expense-chart-config.tsx` — new colors, tooltip, skeleton

## Color Scheme

| Category | Color | Hex |
|----------|-------|-----|
| Комиссия WB | Red | #E53935 |
| Логистика | Blue | #3B82F6 |
| Продвижение | Purple | #7C4DFF |
| Эквайринг | Amber | #F59E0B |
| Хранение | Teal | #14B8A6 |
| Прочее | Gray | #9CA3AF |

## AC

- [ ] Horizontal bars with inline labels + amount + %
- [ ] Summary header: total, % of revenue, W-o-W badge
- [ ] Merge <1% into "Прочее" (expandable on hover)
- [ ] Semantic colors
- [ ] Responsive (1024px, 768px)
- [ ] Files < 200 lines each
