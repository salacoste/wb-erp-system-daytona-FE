# Epic 102-FE: Expense Chart Redesign Completion

**Priority**: P3 (UI enhancement)
**Estimate**: ~3 SP
**Source**: `docs/backlog/expense-chart-redesign.md` — 4/6 ACs done, 2 remaining
**Created**: 2026-05-13

## Objective

Complete the expense chart redesign by adding revenue share + W-o-W data to the summary badge, percentage labels on bars, and responsive breakpoints.

## Current State (already done)
- Horizontal bars via recharts `layout="vertical"`
- Semantic colors via `getCategoryColor()`
- Small-category merging (<1% -> "Прочее", expandable on hover)
- Custom tooltip with sub-item expansion
- Files under 200 lines (ExpenseChart.tsx: 140, expense-chart-config.tsx: 116)

## Stories

### Story 102.1-FE: Add revenue share + W-o-W data (~1.5 SP)

**Data flow changes:**
- `useExpenses-utils.ts`: add `revenueShare` field to `ExpenseBreakdown` (total / sale_gross * 100)
- `useExpenses.ts`: fetch previous period expenses for W-o-W comparison
- `ExpenseChart.tsx`: pass revenue + revenueShare to `ExpenseSummaryBadge`
- `expense-chart-config.tsx`: show "% от выручки: XX%" in badge + W-o-W arrow badge

### Story 102.2-FE: Add percentage labels + responsive breakpoints (~1.5 SP)

**Bar labels:**
- Add percentage next to amount on each bar (e.g., "50 000 ₽ (50%)")
- Modify `LabelList` formatter in ExpenseChart.tsx

**Responsive breakpoints:**
- At ≤1024px: reduce Y-axis label width to 100, smaller font 11px
- At ≤768px: hide Y-axis labels, show category name in tooltip only
- Use CSS container queries on the chart card

**Tooltip enhancement:**
- Add `% от выручки` to tooltip
- Add W-o-W change to tooltip (if available)
