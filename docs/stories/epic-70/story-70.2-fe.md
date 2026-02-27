# Story 70.2-FE: Clarify Profit Definitions and Tooltips

| Field | Value |
|-------|-------|
| Epic | 70-FE Validation Fixes |
| Priority | P1 |
| SP | 3 |
| Status | 📋 Ready for Dev |
| Group | B (D-5, D-16) |

## Description

Как владелец бизнеса, я хочу понимать что означает каждый показатель прибыли,
чтобы не путаться когда Dashboard и Analytics показывают разные числа.

## Problem

На одном экране (Cabinet Summary / Dashboard) используются ДВА разных определения "прибыли",
но пользователь об этом не информирован. Tooltip'ы ROI/PPU ссылаются на "Валовую прибыль",
но используют другую формулу.

### D-5: Dashboard "Чистая прибыль" vs Analytics "Опер. прибыль"

| Page | Metric | Value (W08) | Formula | API Field |
|------|--------|-------------|---------|-----------|
| Dashboard | Чистая прибыль | 7,749₽ | payout_total (после удержаний WB) | `payout_total` |
| Analytics/SKU | Опер. прибыль | 17,476₽ | revenue_net - cogs - expenses | `operating_profit_analytical` |

**Причина**: Разные метрики с разным бизнес-смыслом, но обе называются "прибыль".

### D-16: ROI/PPU vs "Валовая прибыль" на Cabinet Summary

| Metric | Displayed | Formula Used | Expected from displayed "Валовая прибыль" |
|--------|-----------|--------------|------------------------------------------|
| Валовая прибыль | 54,091₽ | payout - cogs | — |
| ROI | 130% | (revenue_net - cogs) / cogs | Would be 26% if from 54,091₽ |
| Прибыль/ед. | 374₽ | (revenue_net - cogs) / qty | Would be 75₽ if from 54,091₽ |

**Причина**: ROI tooltip: "ROI = (Валовая прибыль ÷ COGS) × 100%" — но `profit` в формуле
= `revenue_net - cogs` (269K₽), а не displayed "Валовая прибыль" (54K₽).

## Root Cause

### NetProfitCard
**File**: `src/components/custom/dashboard/NetProfitCard.tsx`
- Shows `payout_total` as "Чистая прибыль" — should be "К перечислению (после удержаний WB)"
- Uses `getNetProfit()` from `tax-display-helpers.ts` with cascading priority

### PnLWaterfall ROI/PPU
**File**: `src/components/custom/PnLWaterfall.tsx`
- Lines 748-749: ROI uses `data.roi` from API (= `(revenue_net - cogs) / cogs × 100`)
- Lines 762-764: Tooltip says "ROI = (Валовая прибыль ÷ COGS)" — **incorrect reference**
- Lines 774, 788: PPU uses `data.profit_per_unit` from API, tooltip similarly misleading
- Line 268: grossProfit = `payout - cogs` — this is Section 4 "Валовая прибыль"

## Acceptance Criteria

- AC1: Dashboard "Чистая прибыль" card tooltip поясняет что это payout после удержаний WB
- AC2: PnLWaterfall ROI tooltip корректно описывает формулу: "(Выручка нетто − COGS) ÷ COGS"
- AC3: PnLWaterfall PPU tooltip корректно описывает формулу: "(Выручка нетто − COGS) ÷ Кол-во"
- AC4: Section 4 "Валовая прибыль" tooltip поясняет: "К перечислению − Себестоимость"
- AC5: Section 5 ROI/PPU имеют визуальную индикацию что используют другой profit base
- AC6: Никаких breaking changes — значения остаются прежними, меняются только labels/tooltips

## Files to Modify

| File | Change |
|------|--------|
| `src/components/custom/PnLWaterfall.tsx` | Fix tooltip text lines ~762-764, ~788 |
| `src/components/custom/dashboard/NetProfitCard.tsx` | Clarify label/tooltip |
| `src/lib/tax-display-helpers.ts` | Update label strings if needed |

## Approach

### PnLWaterfall Tooltip Fixes

```typescript
// Line ~763: Current (incorrect)
"ROI = (Валовая прибыль ÷ COGS) × 100%"

// Fixed:
"ROI = (Чистая выручка − COGS) ÷ COGS × 100%"
// Or: "ROI рассчитан от прибыли до удержаний WB"

// Line ~788: Current (incorrect)
"Прибыль/ед = Валовая прибыль ÷ Кол-во проданных"

// Fixed:
"Прибыль/ед = (Чистая выручка − COGS) ÷ Кол-во проданных"
```

### NetProfitCard Label

```typescript
// Current: "Чистая прибыль"
// Fixed: "К перечислению" (when no tax configured)
// Or: "Чистая прибыль (после удержаний WB)"
```

## Test Plan

- Visual: verify tooltip text on Cabinet Summary page
- Unit: snapshot tests for tooltip content if existing
- No calculation changes — labels/tooltips only
