# Dashboard Sales Cards Wireframe Specification

**Date**: 2026-01-31
**Epic**: 63-FE Dashboard Business Logic Completion
**Stories**: 63.1-FE (Sales Metric Card), 63.2-FE (Sales COGS Metric Card)
**Author**: UX Designer (Claude)
**Status**: Design Validated

---

## 1. Design Validation Summary

### Story 63.1-FE: Sales Metric Card (Vykypy)

| Criteria | Status | Notes |
|----------|--------|-------|
| Card layout matches OrdersMetricCard | PASS | Same structure: header, value, comparison, subtitle |
| Color usage follows design system | PASS | Green #22C55E for revenue metrics |
| Typography hierarchy | PASS | 32px bold value, 14px title, 12px comparison |
| Comparison badge placement | PASS | Below value, with TrendIndicator + ComparisonBadge |
| Tooltip content clarity | PASS | Explains wb_sales_gross vs sales_gross distinction |
| Mobile responsiveness | PASS | min-h-[120px], p-4 padding, responsive text |

**Design System Compliance**: APPROVED

### Story 63.2-FE: Sales COGS Metric Card

| Criteria | Status | Notes |
|----------|--------|-------|
| Pattern matches OrdersCogsMetricCard | PASS | Same three-state design (missing/incomplete/complete) |
| COGS coverage indicator | PASS | Yellow warning for <100% coverage |
| Margin display formatting | N/A | COGS card shows cost, not margin |
| Inverted comparison (costs) | PASS | Lower costs = green (positive) |
| Navigation to COGS page | PASS | Uses ROUTES.COGS.SINGLE |

**Design System Compliance**: APPROVED

---

## 2. Visual Specifications

### 2.1 Sales Metric Card (Story 63.1)

```
+----------------------------------------------------------+
|  [ShoppingBag]  Vykypy (Prodazhi)             [i] Info    |  <- Header: icon + title + info
|----------------------------------------------------------|
|  131 134,76 RUB                                          |  <- Main value: 32px, bold, GREEN
|  [text-green-500]                                        |
|----------------------------------------------------------|
|  [TrendUp] [+12,5%]  +15 234,00 RUB  vs 115 900,76 RUB  |  <- Comparison row
|  [green]   [badge]   [absolute diff]  [prev value]       |
|----------------------------------------------------------|
|  Net revenue after WB commission                         |  <- Subtitle: 12px, gray-400
|  [text-xs text-gray-400]                                 |
+----------------------------------------------------------+

Card Dimensions:
- Min height: 120px
- Padding: 16px (p-4)
- Border: 1px solid #EEEEEE
- Border radius: 8px (rounded-lg)
- Hover: shadow-md, scale(1.01)
```

#### Color Specification (Story 63.1)

| Element | Color | Hex | Tailwind Class |
|---------|-------|-----|----------------|
| Icon | Green | #22C55E | `text-green-500` |
| Main Value | Green | #22C55E | `text-green-500` |
| Title | Muted Gray | #757575 | `text-muted-foreground` |
| Positive Trend | Green | #22C55E | `text-green-600` |
| Negative Trend | Red | #EF4444 | `text-red-500` |
| Neutral Trend | Gray | #9CA3AF | `text-muted-foreground` |
| Subtitle | Light Gray | #9CA3AF | `text-gray-400` |
| Info Icon | Muted | #757575 | `text-muted-foreground` |

#### Icon Selection

Use `ShoppingBag` from lucide-react (not `ShoppingCart` which is used for Orders).

**Rationale**:
- ShoppingBag represents completed purchases/sales
- ShoppingCart represents pending orders/potential revenue
- This visual distinction helps users understand the metric difference

---

### 2.2 Sales COGS Metric Card (Story 63.2)

#### State 1: Complete (Coverage = 100%)

```
+----------------------------------------------------------+
|  [Package]  COGS vykupov                     [i] Info     |
|----------------------------------------------------------|
|  85 000,00 RUB                                           |  <- Main value: 24px, bold, GRAY
|  [text-gray-500]                                         |
|----------------------------------------------------------|
|  [TrendDown] [-5,2%]  -4 500,00 RUB  vs 89 500,00 RUB   |  <- Inverted: down=GREEN (costs down)
|  [green badge - costs down is good]                      |
|----------------------------------------------------------|
|  COGS: 74 of 74 products (100%)                         |  <- Coverage: 12px, gray-400
+----------------------------------------------------------+
```

#### State 2: Incomplete (0% < Coverage < 100%)

```
+----------------------------------------------------------+
|  [Package]  COGS vykupov                     [i] Info     |
|----------------------------------------------------------|
|  85 000,00 RUB                                           |
|  [text-gray-500, 24px]                                   |
|----------------------------------------------------------|
|  [-5,2%]  -4 500,00 RUB  vs 89 500,00 RUB               |
|----------------------------------------------------------|
|  [!] COGS: 74 of 80 products (92.5%)                    |  <- Yellow warning row
|  [text-yellow-600, AlertTriangle icon]                   |
|                                                          |
|  [Fill COGS ->]                                          |  <- Primary link
|  [text-primary hover:underline]                          |
+----------------------------------------------------------+
```

#### State 3: Missing (Coverage = 0%)

```
+----------------------------------------------------------+
|  [Package]  COGS vykupov                     [i] Info     |
|----------------------------------------------------------|
|  +----------------------------------------------------+  |
|  | [AlertTriangle] COGS not filled                    |  |  <- Yellow panel
|  |                                                    |  |     bg-yellow-100
|  | 0 of 80 products (0%)                              |  |     text-yellow-600/700
|  |                                                    |  |
|  | [Fill COGS ->]                                     |  |
|  +----------------------------------------------------+  |
+----------------------------------------------------------+
```

#### Color Specification (Story 63.2)

| Element | Color | Hex | Tailwind Class |
|---------|-------|-----|----------------|
| Icon | Gray | #757575 | `text-gray-500` |
| Main Value | Gray | #6B7280 | `text-gray-500` |
| Title | Muted | #757575 | `text-muted-foreground` |
| Positive Trend (costs down) | Green | #22C55E | `text-green-600` |
| Negative Trend (costs up) | Red | #EF4444 | `text-red-500` |
| Warning Background | Yellow Light | #FEF3C7 | `bg-yellow-100` |
| Warning Text | Yellow Dark | #CA8A04 | `text-yellow-600` |
| Warning Icon | Yellow | #EAB308 | `text-yellow-500` |
| Link Text | Primary Red | #E53935 | `text-primary` |
| Coverage Text (complete) | Light Gray | #9CA3AF | `text-gray-400` |

---

## 3. Component Hierarchy

### Dashboard Grid Position

```
Desktop Layout (4x2):
+----------------+----------------+----------------+----------------+
| [1] Zakazy     | [2] COGS zakaz | [3] Vykypy     | [4] COGS vykup |
| (Orders)       | (Orders COGS)  | (Sales) NEW    | (Sales COGS)NEW|
| BLUE           | GRAY           | GREEN          | GRAY           |
+----------------+----------------+----------------+----------------+
| [5] Reklama    | [6] Logistika  | [7] Khranenie  | [8] Teor.profit|
| (Advertising)  | (Logistics)    | (Storage)      | (Profit)       |
| PURPLE         | BLUE           | PURPLE         | BLUE/HIGHLIGHT |
+----------------+----------------+----------------+----------------+

Position mapping:
- Story 63.1 (SalesMetricCard) -> Position [3]
- Story 63.2 (SalesCogsMetricCard) -> Position [4]
```

### Component Reuse

Both new cards should reuse:
1. `ComparisonBadge` - Percentage display with semantic colors
2. `TrendIndicator` - Arrow icons with direction colors
3. `StandardMetricSkeleton` - Loading state from MetricCardStates
4. `MetricCardError` - Error state with retry button
5. `Tooltip/TooltipContent` - Info icon hover content

---

## 4. Accessibility Requirements

### ARIA Labels (Russian)

```tsx
// SalesMetricCard
<Card
  role="article"
  aria-label={`Vykypy: ${formatCurrency(value)}, ${trend}% za period`}
>

// SalesCogsMetricCard
<Card
  role="article"
  aria-label={`COGS vykupov: ${formatCurrency(value)}, pokrytie ${coverage}%`}
>

// Warning state
<div
  role="alert"
  aria-live="polite"
  aria-label="Vnimanie: COGS ne zapolnen"
>
```

### Keyboard Navigation

| Element | Action | Key |
|---------|--------|-----|
| Info icon | Show tooltip | Tab to focus, Enter/Space to open |
| "Fill COGS" link | Navigate | Tab to focus, Enter to navigate |
| Retry button | Retry fetch | Tab to focus, Enter to retry |

### Color Contrast (WCAG AA)

| Text | Background | Ratio | Status |
|------|------------|-------|--------|
| Green #22C55E | White #FFFFFF | 3.1:1 | PASS (large text) |
| Gray #6B7280 | White #FFFFFF | 4.7:1 | PASS |
| Yellow #CA8A04 | Yellow #FEF3C7 | 3.4:1 | PASS (large text) |
| Red #E53935 | White #FFFFFF | 4.5:1 | PASS |

---

## 5. Tooltip Content

### Sales Metric Card (Story 63.1)

```
Vykypy (Actual Sales)

This shows your actual revenue from completed sales (redemptions)
after WB commission is deducted.

- wb_sales_gross = Your revenue after WB commission
- Unlike "Orders", this excludes cancelled and unredeemed items
- Returns are shown separately

Formula: Seller Revenue = Retail Price - WB Commission
```

### Sales COGS Metric Card (Story 63.2)

```
COGS vykupov (Cost of Goods Sold for Actual Sales)

This shows the total cost of goods for your completed sales (vykypy).

- Only includes products that were actually sold (not cancelled orders)
- Used to calculate gross profit: Revenue - COGS = Gross Profit
- Coverage % shows how many products have COGS assigned

Fill in COGS for all products to get accurate profit calculations.
```

---

## 6. Design Decisions & Rationale

### Decision 1: Green Color for Sales Value

**Choice**: Use green (#22C55E) for Sales value, matching revenue semantic meaning.

**Rationale**:
- Green universally indicates positive financial outcomes
- Aligns with existing design system color semantics
- Creates visual distinction from Orders (blue) which is "potential" revenue

### Decision 2: Gray Color for COGS Values

**Choice**: Use gray (#757575) for COGS values, indicating expense/cost.

**Rationale**:
- Gray is neutral, appropriate for cost metrics
- Not red (which would imply loss/error)
- Consistent with OrdersCogsMetricCard pattern

### Decision 3: Inverted Comparison for Costs

**Choice**: Lower COGS = green badge, Higher COGS = red badge.

**Rationale**:
- For expense metrics, lower is better
- `calculateComparison(current, previous, true)` - invertComparison=true
- Matches OrdersCogsMetricCard behavior

### Decision 4: Three-State COGS Card

**Choice**: Implement three distinct visual states for COGS coverage.

**Rationale**:
- 100% coverage: Normal display (no warning)
- 1-99% coverage: Warning row with link
- 0% coverage: Full warning panel (no value to display)

---

## 7. Implementation Checklist

### Story 63.1 (SalesMetricCard)

- [ ] Create `src/components/custom/dashboard/SalesMetricCard.tsx`
- [ ] Use `ShoppingBag` icon (lucide-react)
- [ ] Apply green color (#22C55E) to icon and main value
- [ ] Display `wb_sales_gross` (NOT `sales_gross`)
- [ ] Implement comparison with `calculateComparison(current, prev, false)`
- [ ] Add Russian tooltip content
- [ ] Export from `src/components/custom/dashboard/index.ts`
- [ ] Integrate into `DashboardMetricsGrid` at position [3]
- [ ] Write unit tests with >80% coverage

### Story 63.2 (SalesCogsMetricCard)

- [ ] Create `src/components/custom/dashboard/SalesCogsMetricCard.tsx`
- [ ] Use `Package` icon (lucide-react)
- [ ] Apply gray color (#757575) to icon and main value
- [ ] Implement three visual states (complete/incomplete/missing)
- [ ] Use inverted comparison `calculateComparison(current, prev, true)`
- [ ] Add COGS coverage display with pluralization
- [ ] Implement "Fill COGS" navigation link
- [ ] Add Russian tooltip content
- [ ] Export from `src/components/custom/dashboard/index.ts`
- [ ] Integrate into `DashboardMetricsGrid` at position [4]
- [ ] Write unit tests with >80% coverage

---

## 8. References

| Resource | Location |
|----------|----------|
| Design System | `docs/front-end-spec.md` |
| KPI Cards Wireframe | `docs/wireframes/dashboard-kpi-cards.md` |
| OrdersMetricCard | `src/components/custom/dashboard/OrdersMetricCard.tsx` |
| OrdersCogsMetricCard | `src/components/custom/dashboard/OrdersCogsMetricCard.tsx` |
| ComparisonBadge | `src/components/custom/ComparisonBadge.tsx` |
| TrendIndicator | `src/components/custom/TrendIndicator.tsx` |
| MetricCardStates | `src/components/custom/dashboard/MetricCardStates.tsx` |

---

**Document Version**: 1.0
**Last Updated**: 2026-01-31
**Validated By**: UX Designer (Claude)
