# Story 37.3: Aggregate Metrics Display

**Epic**: Epic 37 - Merged Group Table Display (Склейки)
**Status**: 📋 Draft - Awaiting PO Validation
**Effort**: 2-3 hours
**Priority**: High (Requires Story 37.2 completion)
**Assignee**: [TO BE ASSIGNED - Frontend Dev]

---

## 🎯 User Story

**As a** user viewing склейка analytics
**I want** to see aggregate metrics (totalSales, revenue, organicSales, ROAS) for each merged group
**So that** I can evaluate the overall performance of linked product cards and make strategic budget decisions

---

## 📋 Acceptance Criteria

### Epic 35 Field Integration
- [ ] Aggregate row displays `totalSales` (Epic 35 field) as "Всего продаж"
- [ ] Aggregate row displays `revenue` (Epic 35 field) as "Из рекламы"
- [ ] Aggregate row displays `organicSales` (Epic 35 field) as "Органика"
- [ ] Aggregate row displays `organicContribution` as percentage (e.g., "71%")
- [ ] Aggregate row displays `spend` as "Расход"
- [ ] Aggregate row displays `roas` as "ROAS" (revenue / spend)

### Calculation Logic
- [ ] Group `totalSales` = SUM(products[].totalSales)
- [ ] Group `revenue` = SUM(products[].revenue)
- [ ] Group `organicSales` = totalSales - revenue (or SUM if pre-calculated)
- [ ] Group `organicContribution` = (organicSales / totalSales) × 100
- [ ] Group `spend` = SUM(products[].spend)
- [ ] Group `roas` = revenue / spend (handle spend=0 case)

### Formatting Rules
- [ ] Currency: Russian locale with ₽ symbol (e.g., "35,570₽")
- [ ] Percentages: 1 decimal place (e.g., "71.2%") displayed inline after revenue
- [ ] ROAS: 2 decimal places (e.g., "0.90")
- [ ] Zero values: Display "0₽" or "—" per [PO TO FILL] decision
- [ ] Null values (spend=0): ROAS shows "N/A" or "—"

### Visual Layout
- [ ] Aggregate row has bold text (font-weight: 600)
- [ ] "ГРУППА #imtId" displayed in Артикул column
- [ ] Percentage displayed inline: "10,234₽ (29%)" for revenue column
- [ ] All numeric columns right-aligned
- [ ] [PO TO FILL] Tooltip on hover showing calculation formula?

### [PO TO FILL] Additional Requirements
- [ ] [PO TO SPECIFY] Rounding strategy (round, floor, ceil)?
- [ ] [PO TO SPECIFY] Large numbers formatting (e.g., "1.2M₽" for millions)?
- [ ] [PO TO SPECIFY] Color-coding for positive/negative metrics?
- [ ] [PO TO SPECIFY] Click interaction on aggregate row (expand/collapse)?

---

## 🧮 Calculation Formulas (Epic 35 Integration)

### Formula 1: Total Sales (Всего продаж)
```typescript
const totalSales = products.reduce((sum, product) => sum + product.totalSales, 0);
```
**Meaning**: Complete revenue from all sources (organic + advertising)
**Example**: ter-09 (15,000₽) + ter-10 (1,489₽) + ... + ter-14 (2,105₽) = 35,570₽

### Formula 2: Ad Revenue (Из рекламы)
```typescript
const revenue = products.reduce((sum, product) => sum + product.revenue, 0);
```
**Meaning**: Revenue attributed to advertising campaigns only
**Example**: ter-09 (4,000₽) + ter-10 (400₽) + ... + ter-14 (800₽) = 10,234₽

### Formula 3: Organic Sales (Органика)
```typescript
const organicSales = totalSales - revenue;
// OR if pre-calculated by backend:
const organicSales = products.reduce((sum, product) => sum + product.organicSales, 0);
```
**Meaning**: Revenue from non-ad sources (direct search, recommendations, etc.)
**Example**: 35,570₽ - 10,234₽ = 25,336₽

### Formula 4: Organic Contribution (% Органики)
```typescript
const organicContribution = (organicSales / totalSales) * 100;
```
**Meaning**: Percentage of total sales from organic sources
**Example**: (25,336₽ / 35,570₽) × 100 = 71.2%

### Formula 5: Total Spend (Расход)
```typescript
const spend = products.reduce((sum, product) => sum + product.spend, 0);
```
**Meaning**: Total advertising budget spent for this group
**Example**: ter-09 (6,000₽) + 0₽ + ... + 0₽ = 11,337₽ (only main product has spend)

### Formula 6: ROAS (Return on Ad Spend)
```typescript
const roas = spend > 0 ? revenue / spend : null;
```
**Meaning**: Revenue generated per 1₽ of ad spend
**Example**: 10,234₽ / 11,337₽ = 0.90 (90 копеек revenue per 1₽ spent)
**Edge Case**: If spend = 0, return `null` (display as "N/A")

---

## 🎨 Formatting Implementation

### Currency Formatting
```typescript
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

// Usage:
formatCurrency(35570); // → "35 570 ₽"
formatCurrency(1489.67); // → "1 490 ₽" (rounded)
```

### Percentage Formatting
```typescript
function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

// Usage:
formatPercentage(71.234, 1); // → "71.2%"
formatPercentage(29.0, 1); // → "29.0%"
```

### Inline Percentage Display
```typescript
function formatRevenueWithPercent(revenue: number, percentage: number): string {
  return `${formatCurrency(revenue)} (${formatPercentage(percentage)})`;
}

// Usage:
formatRevenueWithPercent(10234, 29.0); // → "10 234 ₽ (29.0%)"
```

### ROAS Formatting
```typescript
function formatROAS(roas: number | null): string {
  if (roas === null || roas === undefined) {
    return '—'; // or 'N/A' per PO decision
  }
  return roas.toFixed(2);
}

// Usage:
formatROAS(0.90); // → "0.90"
formatROAS(null); // → "—"
```

---

## 🧪 Test Scenarios

### Test 1: Normal Group Calculation
**Given**: Group #328632 with 6 products
```typescript
const products = [
  { totalSales: 15000, revenue: 4000, organicSales: 11000, spend: 6000 },
  { totalSales: 1489, revenue: 400, organicSales: 1089, spend: 0 },
  { totalSales: 8500, revenue: 2300, organicSales: 6200, spend: 0 },
  { totalSales: 5234, revenue: 1500, organicSales: 3734, spend: 0 },
  { totalSales: 3242, revenue: 1234, organicSales: 2008, spend: 0 },
  { totalSales: 2105, revenue: 800, organicSales: 1305, spend: 0 },
];
```

**Expected Aggregates**:
- [ ] totalSales: 35,570₽
- [ ] revenue: 10,234₽
- [ ] organicSales: 25,336₽
- [ ] organicContribution: 71.2%
- [ ] spend: 6,000₽ (only main product)
- [ ] roas: 1.71 (10,234 / 6,000)

### Test 2: Zero Spend Edge Case
**Given**: Group where all products have `spend = 0`
**Expected**:
- [ ] spend: 0₽
- [ ] roas: "N/A" or "—" (not division by zero)
- [ ] Other metrics calculate normally

### Test 3: Negative Revenue (Returns)
**Given**: Group with high return rate, `revenue < 0`
**Expected**:
- [ ] [PO TO FILL] Display negative as "-5,000₽" or flag with color?
- [ ] organicSales calculation still correct (totalSales - negative revenue)
- [ ] ROAS: negative value or "N/A"?

### Test 4: Large Numbers
**Given**: Group with `totalSales > 1,000,000₽`
**Expected**:
- [ ] [PO TO FILL] Display as "1,234,567₽" or "1.2M₽"?
- [ ] Formatting consistent across all groups
- [ ] No overflow in table cells

---

## 📊 Visual Examples

### Example 1: High Organic Contribution
```
Aggregate Row:
┌────────────┬──────────┬───────────┬──────────┬─────────┬────────┐
│ ГРУППА     │ 35,570₽  │ 10,234₽   │ 25,336₽  │ 11,337₽ │ 0.90   │
│ #328632    │          │ (29%)     │ (71%)    │         │        │
└────────────┴──────────┴───────────┴──────────┴─────────┴────────┘
```

### Example 2: Low Organic Contribution
```
Aggregate Row:
┌────────────┬──────────┬───────────┬──────────┬─────────┬────────┐
│ ГРУППА     │ 50,000₽  │ 45,000₽   │ 5,000₽   │ 20,000₽ │ 2.25   │
│ #123456    │          │ (90%)     │ (10%)    │         │        │
└────────────┴──────────┴───────────┴──────────┴─────────┴────────┘
```

### Example 3: Zero Spend (No Ads)
```
Aggregate Row:
┌────────────┬──────────┬───────────┬──────────┬─────────┬────────┐
│ ГРУППА     │ 12,000₽  │ 0₽        │ 12,000₽  │ 0₽      │ N/A    │
│ #789012    │          │ (0%)      │ (100%)   │         │        │
└────────────┴──────────┴───────────┴──────────┴─────────┴────────┘
```

---

## 🐛 Edge Cases

### Edge Case 1: Division by Zero
**Scenario**: totalSales = 0 (group with all returns, no sales)
**Calculation**: organicContribution = (0 / 0) × 100 = NaN
**PO Decision**: [PO TO FILL]
- Display as "—" or "0%"?
- Hide aggregate row entirely?

### Edge Case 2: Rounding Discrepancies
**Scenario**: Individual products rounded, aggregate summed from rounded values
**Example**:
- Product A: 1,234.56₽ → 1,235₽
- Product B: 5,678.91₽ → 5,679₽
- Sum of rounded: 6,914₽
- Rounded sum: 6,913₽ (1₽ difference)

**PO Decision**: [PO TO FILL]
- Sum rounded values, or round the sum?
- Acceptable discrepancy threshold?

### Edge Case 3: Very Small ROAS (<0.01)
**Scenario**: revenue = 50₽, spend = 10,000₽, roas = 0.005
**Display**: "0.01" (rounded to 2 decimals) or "0.00"?
**PO Decision**: [PO TO FILL]
- Show more decimals for small values?
- Flag as "<<0.01" or scientific notation?

---

## ✅ Definition of Done

- [ ] All 6 formulas implemented and tested (totalSales, revenue, organicSales, organicContribution, spend, roas)
- [ ] Formatting functions created (currency, percentage, ROAS)
- [ ] Epic 35 fields correctly integrated in aggregate row
- [ ] All test scenarios pass (Tests 1-4 minimum)
- [ ] Edge cases handled per PO decisions
- [ ] Manual verification: Aggregate row calculations match Excel validation
- [ ] Code review: Logic clarity, performance, maintainability
- [ ] Integration: Aggregate metrics displayed in MergedGroupTable component (Story 37.2)
- [ ] PO approval of metric accuracy and formatting

---

## 📎 References

- **Epic 35 Main**: `docs/epics/epic-35-total-sales-organic-split.md` - Field definitions
- **Epic 35 API**: `frontend/docs/request-backend/77-total-sales-organic-ad-split.md` - Response structure
- **Story 37.2**: `docs/stories/epic-37/story-37.2-merged-group-table-component.md` - Component integration point
- **WB Dashboard Metrics**: `docs/WB-DASHBOARD-METRICS.md` - Source of truth for calculation formulas

---

## 🎯 Next Steps

1. **Frontend dev**: Implement calculation functions in separate utility file (e.g., `metrics-calculator.ts`)
2. **Unit tests**: Test each formula with known inputs/outputs
3. **Integration**: Pass calculated aggregates to MergedGroupTable component
4. **Visual QA**: Compare aggregate row to mockup in Epic 37
5. **PO review**: Validate calculations against Excel source data
6. **Story 37.4**: Continue to visual styling & hierarchy

---

**Story Owner**: [TO BE ASSIGNED]
**Created**: 2025-12-29
**Last Updated**: 2025-12-29
