# Story 44.27-FE: Logistics Field Naming Fix

**Epic**: 44 - Price Calculator UI (Frontend)
**Status**: Ready for Dev
**Priority**: P1 - IMPORTANT (User Feedback)
**Effort**: 1 SP
**Depends On**: None (cosmetic fix)

---

## User Story

**As a** Seller,
**I want** logistics fields to have correct names that match WB terminology,
**So that** I understand what each cost represents without confusion.

---

## Background: User Feedback

### User Report
> "В поле логистика, где можно ввести цифры, неправильно названо поле. У нас есть логистика, доставка к клиенту, а также возврат от клиента, потому что это две разные цены."

### Current State (INCORRECT)

| Field | Current Label | Current Tooltip |
|-------|---------------|-----------------|
| `logistics_forward_rub` | "Логистика до склада" | Стоимость доставки до склада WB |
| `logistics_reverse_rub` | "Логистика возврата" | Стоимость обратной логистики при возврате |

**Problem**: "Логистика до склада" suggests delivery FROM seller TO WB warehouse, which is incorrect.

### Required State (CORRECT)

| Field | New Label | New Tooltip |
|-------|-----------|-------------|
| `logistics_forward_rub` | "Логистика к клиенту" | Стоимость доставки товара от склада WB до покупателя. Зависит от объема товара и коэффициента склада. |
| `logistics_reverse_rub` | "Логистика возврата" | Стоимость возврата товара от покупателя на склад WB. Обычно равна логистике к клиенту. |

### WB Business Context

In Wildberries terminology:
- **Forward logistics** (`boxDeliveryBase/boxDeliveryLiter`) - delivery **to customer** (from WB warehouse to buyer)
- **Reverse logistics** - return **from customer** (from buyer back to WB warehouse)

This is NOT delivery "to WB warehouse" from seller - that's a different concept (FBO acceptance).

---

## Acceptance Criteria

### AC1: Update Forward Logistics Label
- [ ] Change label from "Логистика до склада" to "Логистика к клиенту"
- [ ] Update tooltip to explain WB → customer delivery
- [ ] Tooltip should mention: volume dependency, warehouse coefficient

### AC2: Update Reverse Logistics Label (Minor Clarification)
- [ ] Keep label "Логистика возврата" (already correct)
- [ ] Enhance tooltip to clarify: customer → WB direction
- [ ] Tooltip should mention: same rate as forward logistics

### AC3: Update All Related Components
- [ ] `FixedCostsSection.tsx` - main input fields
- [ ] `LogisticsSection.tsx` - if exists separately
- [ ] `CostBreakdownChart.tsx` - chart labels if any
- [ ] `PriceCalculatorResults.tsx` - results display if shows logistics breakdown

### AC4: Consistency Check
- [ ] Verify all references to "логистика до склада" are updated
- [ ] Verify tooltips are informative and consistent
- [ ] No changes to API field names (keep `logistics_forward_rub`, `logistics_reverse_rub`)

---

## Technical Requirements

### Files to Update (grep results)

| File | Line | Current Text | Action |
|------|------|--------------|--------|
| `FixedCostsSection.tsx` | 83-84 | Label + Tooltip | UPDATE |
| `CostBreakdownTable.tsx` | 52 | "Логистика до склада" | UPDATE |
| `LogisticsTariffDisplay.tsx` | 104 | Tooltip "до склада WB" | UPDATE |
| `LogisticsTariffCalculator.tsx` | 111 | Tooltip "до склада WB" | UPDATE |
| `__tests__/FixedCostsSection.test.tsx` | 77, 128, 149 | Test assertions | UPDATE |

### Component Files Structure

```
src/components/custom/price-calculator/
├── FixedCostsSection.tsx           # UPDATE - Main form labels (line 83-84)
├── CostBreakdownTable.tsx          # UPDATE - Table row label (line 52)
├── LogisticsTariffDisplay.tsx      # UPDATE - Tooltip (line 104)
├── LogisticsTariffCalculator.tsx   # UPDATE - Tooltip (line 111)
└── __tests__/
    └── FixedCostsSection.test.tsx  # UPDATE - Test assertions (lines 77, 128, 149)
```

### Label Changes

```typescript
// BEFORE (FixedCostsSection.tsx line ~83)
<Label htmlFor="logistics_forward_rub">Логистика до склада</Label>
<FieldTooltip content="Стоимость доставки одной единицы товара до склада Wildberries (FBO). Узнать можно в личном кабинете WB в разделе «Логистика»." />

// AFTER
<Label htmlFor="logistics_forward_rub">Логистика к клиенту</Label>
<FieldTooltip content="Стоимость доставки товара от склада WB до покупателя. Зависит от объема товара и коэффициента выбранного склада." />

// BEFORE (FixedCostsSection.tsx line ~109)
<Label htmlFor="logistics_reverse_rub">Логистика возврата</Label>
<FieldTooltip content="Стоимость обратной логистики при возврате товара покупателем. Обычно равна или выше стоимости прямой логистики." />

// AFTER
<Label htmlFor="logistics_reverse_rub">Логистика возврата</Label>
<FieldTooltip content="Стоимость возврата товара от покупателя на склад WB. Обычно равна стоимости логистики к клиенту. Применяется с учетом процента выкупа (buyback)." />
```

### Exact Changes Required

#### 1. FixedCostsSection.tsx (lines 83-84)
```typescript
// BEFORE
<Label htmlFor="logistics_forward_rub">Логистика до склада</Label>
<FieldTooltip content="Стоимость доставки одной единицы товара до склада Wildberries (FBO). Узнать можно в личном кабинете WB в разделе «Логистика»." />

// AFTER
<Label htmlFor="logistics_forward_rub">Логистика к клиенту</Label>
<FieldTooltip content="Стоимость доставки товара от склада WB до покупателя. Зависит от объема товара и коэффициента выбранного склада." />
```

#### 2. CostBreakdownTable.tsx (line 52)
```typescript
// BEFORE
<TableCell>Логистика до склада</TableCell>

// AFTER
<TableCell>Логистика к клиенту</TableCell>
```

#### 3. LogisticsTariffDisplay.tsx (line 104)
```typescript
// BEFORE
<FieldTooltip content="Стоимость доставки товара до склада WB. Рассчитывается автоматически..." />

// AFTER
<FieldTooltip content="Стоимость доставки товара от склада WB до покупателя. Рассчитывается автоматически..." />
```

#### 4. LogisticsTariffCalculator.tsx (line 111)
```typescript
// BEFORE
<FieldTooltip content="Стоимость доставки товара до склада WB. Рассчитывается по формуле..." />

// AFTER
<FieldTooltip content="Стоимость доставки товара от склада WB до покупателя. Рассчитывается по формуле..." />
```

#### 5. Test File Updates (__tests__/FixedCostsSection.test.tsx)
```typescript
// Lines 77, 128, 149 - Update test assertions
// BEFORE
expect(screen.getByText('Логистика до склада')).toBeInTheDocument()
screen.getByLabelText('Логистика до склада')

// AFTER
expect(screen.getByText('Логистика к клиенту')).toBeInTheDocument()
screen.getByLabelText('Логистика к клиенту')
```

---

## Scope

### In Scope
- UI label text changes
- Tooltip content updates
- Consistency across all Price Calculator components

### Out of Scope
- API field names (remain `logistics_forward_rub`, `logistics_reverse_rub`)
- TypeScript type definitions
- Backend changes
- Calculation logic

---

## Invariants

| Scenario | Expected Behavior |
|----------|-------------------|
| API requests | Field names unchanged (`logistics_forward_rub`) |
| Form validation | No changes to validation rules |
| Calculations | No changes to formulas |
| Existing user data | No migration needed |

---

## Implementation Notes

### Search Pattern for Updates

```bash
# Find all occurrences of the old label
grep -r "до склада" src/components/custom/price-calculator/
grep -r "Логистика до" src/components/custom/price-calculator/
```

### Testing Approach

1. Visual verification of all label changes
2. Tooltip content review
3. No regression in form functionality
4. Accessibility check (screen reader announces new labels)

---

## Definition of Done

- [ ] All "Логистика до склада" labels changed to "Логистика к клиенту"
- [ ] All tooltips updated with correct context
- [ ] Consistency verified across all Price Calculator components
- [ ] No changes to API field names
- [ ] Visual verification completed
- [ ] No ESLint errors
- [ ] Code review completed

---

## QA Checklist

| Check | Status |
|-------|--------|
| Forward logistics label updated | [ ] |
| Forward logistics tooltip updated | [ ] |
| Reverse logistics tooltip enhanced | [ ] |
| CostBreakdownChart labels checked | [ ] |
| Results display labels checked | [ ] |
| No API changes | [ ] |
| Screen reader announces correct labels | [ ] |

---

**Created**: 2026-01-21
**Author**: Claude Opus 4.5 (PM Validation)
**User Request**: Field naming feedback from product owner
