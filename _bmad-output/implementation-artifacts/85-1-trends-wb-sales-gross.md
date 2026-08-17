# Story 85.1: Trends — use wb_sales_gross for accurate seller revenue

Status: ready-for-dev

## Story

As a seller analyzing my weekly trends,
I want to see my actual seller revenue (after WB commission) instead of retail price,
so that my efficiency percentage reflects reality.

## Acceptance Criteria

1. Trends request uses `wb_sales_gross` instead of `sale_gross`
2. Revenue line labeled "Выручка продавца" (not "Продажи (розница)")
3. Efficiency: `(payout - cogs) / wb_sales_gross * 100`
4. Fallback: if `wb_sales_gross` null for a week, use `sale_gross`
5. One-time info tooltip on legend: "Метрика обновлена: теперь показывает выручку продавца без комиссии WB"

## Tasks / Subtasks

- [ ] Task 1: Update trends endpoint metrics (AC: #1)
  - [ ] 1.1: Change `metrics=sale_gross,...` to `metrics=wb_sales_gross,sale_gross,...` in useTrends.ts
  - [ ] 1.2: Update mapping: `revenue = point.wb_sales_gross ?? point.sale_gross ?? 0`

- [ ] Task 2: Update label (AC: #2)
  - [ ] 2.1: Change `revenue: 'Продажи (розница)'` to `revenue: 'Выручка продавца'` in TrendGraph.tsx

- [ ] Task 3: Verify efficiency formula (AC: #3)
  - [ ] 3.1: Confirm `efficiencyPct` uses `revenue` (which is now wb_sales_gross)

- [ ] Task 4: Lint + type-check

## Dev Notes

### Changes (2 files, ~5 lines)

**useTrends.ts line 91**: Add `wb_sales_gross` to metrics, update mapping at line 128
**TrendGraph.tsx line 38**: Update label string

### Fallback Logic

```typescript
// Request both metrics for fallback
const endpoint = `...&metrics=wb_sales_gross,sale_gross,to_pay_goods,payout_total,logistics_cost`

// Use wb_sales_gross, fall back to sale_gross
const revenue = point.wb_sales_gross ?? point.sale_gross ?? 0
```

### Efficiency Impact

Current: `(payout - cogs) / sale_gross` → ~24% (denominator includes WB commission)
New: `(payout - cogs) / wb_sales_gross` → ~35% (denominator is seller revenue only)

Higher % = more accurate representation of business efficiency.

### References

- [Source: _bmad-output/planning-artifacts/epics-80-83-fe.md#Story-851]
- [Source: src/hooks/useTrends.ts:88-143]
- [Source: src/components/custom/TrendGraph.tsx:38]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Completion Notes List

### File List
