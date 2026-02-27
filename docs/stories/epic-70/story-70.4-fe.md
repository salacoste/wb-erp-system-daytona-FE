# Story 70.4-FE: Fix NaN Guard in Supply Planning Formatter

| Field | Value |
|-------|-------|
| Epic | 70-FE Validation Fixes |
| Priority | P2 |
| SP | 1 |
| Status | 📋 Ready for Dev |
| Group | D (D-13) |

## Description

Как пользователь, я не хочу видеть "не число ₽" в таблице планирования поставок,
потому что это техническая ошибка, не информативная для бизнеса.

## Problem

На странице `/analytics/supply-planning` в колонке "СУММА" отображается **"не число ₽"**
(русская локализация NaN) для товара TER-13 с нулевой скоростью продаж.

### Цепочка NaN

```
avg_daily_sales = 0
→ days_until_stockout = stock / 0 = Infinity
→ reorder_quantity = ... (может быть NaN при Infinity в расчёте)
→ reorder_value = reorder_quantity × cogs_per_unit = NaN
→ Intl.NumberFormat('ru-RU', {currency}).format(NaN) = "не число ₽"
```

## Root Cause

**File**: `src/lib/supply-planning-utils.ts`, lines 265-272

```typescript
export function formatReorderValue(value: number): string {
  if (value === 0) return '—'
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(value)
}
```

**Missing**: No guard for `NaN` or `Infinity`. The check `value === 0` doesn't catch NaN
(because `NaN === 0` is `false`).

## Acceptance Criteria

- AC1: `formatReorderValue(NaN)` returns "—"
- AC2: `formatReorderValue(Infinity)` returns "—"
- AC3: `formatReorderValue(-Infinity)` returns "—"
- AC4: `formatReorderValue(0)` returns "—" (existing behavior preserved)
- AC5: `formatReorderValue(70000)` returns "70 000 ₽" (existing behavior preserved)
- AC6: Unit test added covering NaN/Infinity edge cases

## Fix

```typescript
export function formatReorderValue(value: number): string {
  if (!Number.isFinite(value) || value === 0) return '—'
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(value)
}
```

One-line change: `if (value === 0)` → `if (!Number.isFinite(value) || value === 0)`.

## Files to Modify

| File | Change | Lines |
|------|--------|-------|
| `src/lib/supply-planning-utils.ts` | Add `Number.isFinite` guard | 266 |

## Test Plan

```typescript
describe('formatReorderValue', () => {
  it('returns dash for NaN', () => {
    expect(formatReorderValue(NaN)).toBe('—')
  })
  it('returns dash for Infinity', () => {
    expect(formatReorderValue(Infinity)).toBe('—')
  })
  it('returns dash for zero', () => {
    expect(formatReorderValue(0)).toBe('—')
  })
  it('formats positive value with currency', () => {
    expect(formatReorderValue(70000)).toMatch(/70\s?000/)
  })
})
```
