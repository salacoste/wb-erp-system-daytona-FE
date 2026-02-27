# Story 70.3-FE: Fix Margin Calculations (Weighted Avg, Denominators)

| Field | Value |
|-------|-------|
| Epic | 70-FE Validation Fixes |
| Priority | P2 |
| SP | 2 |
| Status | 📋 Ready for Dev |
| Group | D (D-7, D-9) |

## Description

Как аналитик, я хочу видеть корректные и согласованные показатели маржи
на страницах SKU и Brand, чтобы принимать верные решения.

## Problem

### D-7: Три маржи на SKU-странице

| Location | Value | Formula | Denominator |
|----------|-------|---------|-------------|
| Header card | 11.3% | operating_profit / (sales_gross - returns) | Gross sales |
| Footer table | 16.6% | operating_profit / revenue_net | Net revenue |
| API | 15.86% | operating_margin_pct | Backend calculation |

**Root cause**: Header и footer используют разные знаменатели без пояснения.

### D-9: Brand footer — simple average вместо weighted

| Location | Value | Formula |
|----------|-------|---------|
| Header card | 10.83% | total_profit / total_sales (weighted) |
| Footer table | 51.47% | (margin₁ + margin₂ + ... + marginₙ) / n (unweighted!) |

**Root cause**: Footer использует `simple arithmetic average` маржей брендов.
Бренд с 80K₽ выручки и бренд с 0₽ имеют одинаковый вес.

## Root Cause Code

### D-7: SKU page header
**File**: `src/app/(dashboard)/analytics/sku/page.tsx`, lines 199-212

```typescript
avgMargin: (() => {
  const totalProfit = withCogs.reduce((sum, item) => sum + item.profit.operating, 0)
  const salesGross = cabinetExpenses?.sales_gross ?? 0
  const returnsGross = cabinetExpenses?.returns_gross ?? 0
  const netSalesGross = salesGross - returnsGross
  return netSalesGross !== 0 ? (totalProfit / Math.abs(netSalesGross)) * 100 : null
})()
```

Uses `sales_gross` (до комиссий WB) as denominator.

### D-7: SKU table footer
**File**: `src/components/custom/SkuFinancialsTable.tsx`, line 342

```typescript
const avgMargin = totalRevenue > 0 ? (totalOperatingProfit / totalRevenue) * 100 : 0
// totalRevenue = sum of item.revenue.net (после комиссий WB)
```

Uses `revenue_net` (после комиссий) as denominator.

### D-9: Brand footer
**File**: `src/components/custom/MarginByBrandTable.tsx`, lines 472-480

```typescript
avgMargin: (() => {
  const withMargin = data.filter(item => item.margin_pct !== undefined && item.margin_pct !== null)
  if (withMargin.length === 0) return null
  return (withMargin.reduce((sum, item) => sum + (item.margin_pct || 0), 0) / withMargin.length)
})()
```

Simple arithmetic mean — **mathematically incorrect** for aggregated brand margins.

## Acceptance Criteria

- AC1: Brand footer "Ср. маржа" использует weighted average (взвешенный по revenue)
- AC2: SKU header и footer используют одинаковый знаменатель ИЛИ имеют tooltip с пояснением
- AC3: Category page footer (если аналогичный) также использует weighted average
- AC4: Existing unit тесты обновлены и проходят
- AC5: Нет NaN/Infinity при нулевой выручке (guard)

## Fix

### D-9: Brand footer (Bug fix — mandatory)

```typescript
// MarginByBrandTable.tsx, replace lines 472-480:
avgMargin: (() => {
  const totalRevenue = data.reduce((sum, item) => sum + (item.revenue_net || 0), 0)
  const totalProfit = data.reduce((sum, item) => sum + (item.operating_profit || 0), 0)
  return totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : null
})()
```

### D-7: SKU page (UX improvement)

**Option A** (Recommended): Align header to use `revenue_net` denominator (same as footer):
```typescript
// sku/page.tsx: replace sales_gross with revenue_net
const totalRevenue = withCogs.reduce((sum, item) => sum + item.revenue.net, 0)
return totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : null
```

**Option B**: Add tooltip explaining different denominators.

## Files to Modify

| File | Change |
|------|--------|
| `src/components/custom/MarginByBrandTable.tsx` | Weighted average (D-9) |
| `src/app/(dashboard)/analytics/sku/page.tsx` | Align denominator (D-7) |
| `src/components/custom/MarginByCategoryTable.tsx` | Check same pattern (D-9) |

## Test Plan

- Unit: test weighted average calculation with mock brand data
- Edge case: brand with 0 revenue should not affect weighted average
- Regression: existing Brand/SKU page tests
