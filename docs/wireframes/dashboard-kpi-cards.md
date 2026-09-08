# Dashboard KPI Cards Wireframe Specification

**Date**: 2025-01-31
**Epic**: Dashboard Main Page
**Page**: Dashboard
**Author**: UX Designer

---

## 1. Overview

This document specifies the layout and design for 8 KPI metric cards on the main Dashboard page. These cards provide at-a-glance financial insights for Wildberries sellers.

### Business Context

**Target Audience**: Business owners managing 50-5000 SKUs with 500K-50M RUB monthly revenue who need quick profit insight without manual spreadsheets.

**Primary Goal**: Display critical financial metrics with period comparison in under 2 seconds.

---

## 2. KPI Metrics Definition

| #   | Metric (RU)           | Description                       | API Field            | Type     | Priority     |
| --- | --------------------- | --------------------------------- | -------------------- | -------- | ------------ |
| 1   | **Заказы**            | Potential revenue from all orders | `orders_value`       | Currency | High         |
| 2   | **COGS по заказам**   | Cost of goods for orders          | `orders_cogs`        | Currency | High         |
| 3   | **Выкупы**            | Actual sales (redeemed orders)    | `sales_value`        | Currency | High         |
| 4   | **COGS по выкупам**   | Cost of goods sold                | `sales_cogs`         | Currency | High         |
| 5   | **Рекламные затраты** | Advertising expenses              | `advert_spend`       | Currency | Medium       |
| 6   | **Логистика**         | Delivery expenses                 | `logistics_cost`     | Currency | Medium       |
| 7   | **Хранение**          | Storage warehouse expenses        | `storage_cost`       | Currency | Medium       |
| 8   | **Теор. прибыль**     | Theoretical profit (calculated)   | `theoretical_profit` | Currency | **Critical** |

### Profit Formula

```
Теор. прибыль = Заказы - COGS_по_заказам - Рекламные_затраты - Логистика - Хранение
```

---

## 3. Grid Layout

### 3.1 Desktop Layout (>=1280px) - 4x2 Grid

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              Dashboard KPI Cards                                     │
├──────────────────────┬──────────────────────┬──────────────────────┬────────────────┤
│                      │                      │                      │                │
│     [1] Заказы       │ [2] COGS по заказам  │    [3] Выкупы        │[4]COGS выкупы  │
│     1 234 567 ₽      │     234 567 ₽        │     987 654 ₽        │    123 456 ₽   │
│     ↑ +12,5%         │     ↑ +8,2%          │     ↑ +15,3%         │    ↑ +5,7%     │
│                      │                      │                      │                │
├──────────────────────┼──────────────────────┼──────────────────────┼────────────────┤
│                      │                      │                      │ ╔════════════╗ │
│ [5] Рекламные затр.  │   [6] Логистика      │   [7] Хранение       │ ║[8] Теор.   ║ │
│     45 678 ₽         │     67 890 ₽         │     12 345 ₽         │ ║  прибыль   ║ │
│     ↓ -3,1%          │     ↑ +2,4%          │     ↑ +18,9%         │ ║  876 421 ₽ ║ │
│                      │                      │                      │ ║  ↑ +23,4%  ║ │
│                      │                      │                      │ ╚════════════╝ │
└──────────────────────┴──────────────────────┴──────────────────────┴────────────────┘

Legend:
╔═══╗ - Highlighted card (Theoretical Profit - итоговая метрика)
```

### 3.2 Tablet Layout (768px - 1279px) - 2x4 Grid

```
┌──────────────────────────────────────────────────────────────┐
│                    Dashboard KPI Cards                        │
├────────────────────────────┬─────────────────────────────────┤
│      [1] Заказы            │    [2] COGS по заказам          │
│      1 234 567 ₽           │        234 567 ₽                │
│      ↑ +12,5%              │        ↑ +8,2%                  │
├────────────────────────────┼─────────────────────────────────┤
│      [3] Выкупы            │    [4] COGS по выкупам          │
│      987 654 ₽             │        123 456 ₽                │
│      ↑ +15,3%              │        ↑ +5,7%                  │
├────────────────────────────┼─────────────────────────────────┤
│  [5] Рекламные затраты     │    [6] Логистика                │
│      45 678 ₽              │        67 890 ₽                 │
│      ↓ -3,1%               │        ↑ +2,4%                  │
├────────────────────────────┼─────────────────────────────────┤
│      [7] Хранение          │ ╔═══[8] Теор. прибыль═══════╗  │
│      12 345 ₽              │ ║      876 421 ₽            ║  │
│      ↑ +18,9%              │ ║      ↑ +23,4%             ║  │
│                            │ ╚════════════════════════════╝  │
└────────────────────────────┴─────────────────────────────────┘
```

### 3.3 Mobile Layout (<768px) - 1x8 Stack

```
┌────────────────────────────────────────┐
│         Dashboard KPI Cards            │
├────────────────────────────────────────┤
│ [1] Заказы                             │
│ 1 234 567 ₽                  ↑ +12,5%  │
├────────────────────────────────────────┤
│ [2] COGS по заказам                    │
│ 234 567 ₽                     ↑ +8,2%  │
├────────────────────────────────────────┤
│ [3] Выкупы                             │
│ 987 654 ₽                    ↑ +15,3%  │
├────────────────────────────────────────┤
│ [4] COGS по выкупам                    │
│ 123 456 ₽                     ↑ +5,7%  │
├────────────────────────────────────────┤
│ [5] Рекламные затраты                  │
│ 45 678 ₽                      ↓ -3,1%  │
├────────────────────────────────────────┤
│ [6] Логистика                          │
│ 67 890 ₽                      ↑ +2,4%  │
├────────────────────────────────────────┤
│ [7] Хранение                           │
│ 12 345 ₽                     ↑ +18,9%  │
├────────────────────────────────────────┤
│ ╔══════════════════════════════════╗   │
│ ║ [8] Теор. прибыль                ║   │
│ ║ 876 421 ₽              ↑ +23,4%  ║   │
│ ╚══════════════════════════════════╝   │
└────────────────────────────────────────┘
```

---

## 4. Individual Card Wireframe

### 4.1 Card Structure (Default State)

```
┌──────────────────────────────────────────────────────────────┐
│                                                          [i] │  ← Info icon (tooltip trigger)
│  [Icon]  Заказы                                              │  ← Title row
│                                                              │
│  1 234 567,89 ₽                                              │  ← Main value (32-48px)
│                                                              │
│  ↑ +12,5%   (+123 456,00 ₽)  vs 1 111 111,89 ₽              │  ← Comparison row
│  [badge]    [tooltip hint]    [previous value]               │
└──────────────────────────────────────────────────────────────┘

Dimensions:
- Min width: 200px
- Max width: 320px (desktop), 100% (mobile)
- Min height: 120px
- Padding: 16px (p-4)
- Gap between elements: 8px
```

### 4.2 Card Anatomy

```
┌────────────────────────────────────────────────┐
│ ┌──────────────────────────────────────────┐16px
│ │  [📊]  Title              [ⓘ]           │   │
│ │   ↑      ↑                  ↑            │   │
│ │  Icon  14px,gray      Info tooltip      │8px│
│ └──────────────────────────────────────────┘   │
│ ┌──────────────────────────────────────────┐8px│
│ │      1 234 567,89 ₽                      │   │
│ │            ↑                              │   │
│ │    32-48px, bold, black                  │   │
│ └──────────────────────────────────────────┘   │
│ ┌──────────────────────────────────────────┐8px│
│ │  [↑+12,5%]  vs 1 111 111 ₽              │   │
│ │     ↑              ↑                     │   │
│ │  Badge 12px   Prev value 12px,gray      │   │
│ └──────────────────────────────────────────┘   │
│                                            │16px
└────────────────────────────────────────────────┘
```

---

## 5. Card States

### 5.1 Default State

```
┌────────────────────────────────────┐
│   📦  Заказы                   [i] │
│                                    │
│   1 234 567,89 ₽                   │
│                                    │
│   ↑ +12,5%  vs 1 111 111 ₽        │
└────────────────────────────────────┘

Styles:
- Background: #FFFFFF (white)
- Border: 1px solid #EEEEEE
- Border-radius: 8px (rounded-lg)
- Shadow: sm (subtle)
```

### 5.2 Loading State (Skeleton)

```
┌────────────────────────────────────┐
│   ░░░░░  ░░░░░░░░░░░░░░░░░░░  ░░ │  ← Animated pulse
│                                    │
│   ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │  ← Width: 60%
│                                    │
│   ░░░░░░░░░░  ░░░░░░░░░░░░░░░░░░ │  ← Width: 40%
└────────────────────────────────────┘

Styles:
- Skeleton color: #F5F5F5 (bg-gray-100)
- Animation: pulse (animate-pulse)
- aria-busy="true"
```

### 5.3 Error State

```
┌────────────────────────────────────┐
│   📦  Заказы                   [i] │
│                                    │
│   ⚠️ Ошибка загрузки               │  ← Red text (#EF4444)
│                                    │
│   [Повторить]                      │  ← Retry button (optional)
└────────────────────────────────────┘

Styles:
- Error text: #EF4444 (text-destructive)
- Error icon: warning triangle
```

### 5.4 Missing COGS Data State

```
┌────────────────────────────────────┐
│   📊  Теор. прибыль            [i] │
│                                    │
│   ⚠️ COGS не заполнен              │  ← Yellow warning
│                                    │
│   12 из 45 товаров (27%)          │  ← Coverage info
│   [Заполнить COGS →]               │  ← Action link
└────────────────────────────────────┘

Styles:
- Warning text: #F59E0B (yellow)
- Background: #FEF3C7 (yellow-100)
- Action link: #E53935 (primary)
```

### 5.5 Hover State

```
┌────────────────────────────────────┐
│   📦  Заказы                   [i] │   ← Tooltip on [i] hover
│                                    │
│   1 234 567,89 ₽                   │
│                                    │   ← Shadow: md (elevated)
│   ↑ +12,5%  vs 1 111 111 ₽        │   ← Cursor: pointer (if clickable)
└────────────────────────────────────┘

Styles:
- Shadow: shadow-md (transition)
- Transform: scale(1.01) - subtle lift
- Transition: 200ms ease
```

---

## 6. Highlighted Card: Theoretical Profit

The "Теор. прибыль" card is the **итоговая метрика** (summary metric) and requires visual emphasis.

### 6.1 Visual Differentiation

```
╔════════════════════════════════════╗
║   💰  Теор. прибыль            [i] ║
║                                    ║
║   876 421,00 ₽                     ║  ← Larger value (48px vs 32px)
║                                    ║
║   ↑ +23,4%  vs 709 562 ₽          ║
╚════════════════════════════════════╝

Highlight Styles:
- Border: 2px solid #3B82F6 (blue)
- Background: linear-gradient(135deg, #EFF6FF, #FFFFFF)
- Shadow: ring-2 ring-blue-200
- Icon: 💰 or custom profit icon
```

### 6.2 Negative Profit Display

```
╔════════════════════════════════════╗
║   💰  Теор. прибыль            [i] ║
║                                    ║
║   -123 456,00 ₽                    ║  ← RED text (#EF4444)
║                                    ║
║   ↓ -15,7%  vs -103 976 ₽         ║  ← Red badge
╚════════════════════════════════════╝

Negative Profit Styles:
- Value text: #EF4444 (red-500)
- Border: 2px solid #EF4444 (red)
- Background: linear-gradient(135deg, #FEF2F2, #FFFFFF)
```

---

## 7. Color Specification

### 7.1 Value Colors

| Condition      | Color | Hex     | Tailwind                |
| -------------- | ----- | ------- | ----------------------- |
| Positive value | Green | #22C55E | `text-green-500`        |
| Negative value | Red   | #EF4444 | `text-red-500`          |
| Zero/Neutral   | Gray  | #757575 | `text-gray-500`         |
| Title          | Muted | #757575 | `text-muted-foreground` |
| Main value     | Black | #1F2937 | `text-gray-900`         |

### 7.2 Comparison Badge Colors

| Direction    | Background | Text    | Tailwind                      |
| ------------ | ---------- | ------- | ----------------------------- |
| Positive (↑) | #DCFCE7    | #166534 | `bg-green-100 text-green-700` |
| Negative (↓) | #FEE2E2    | #991B1B | `bg-red-100 text-red-700`     |
| Neutral (—)  | #F3F4F6    | #4B5563 | `bg-gray-100 text-gray-600`   |

### 7.3 Card Colors

| Element                | Color      | Hex     | Tailwind               |
| ---------------------- | ---------- | ------- | ---------------------- |
| Background             | White      | #FFFFFF | `bg-white`             |
| Border                 | Light gray | #EEEEEE | `border-gray-200`      |
| Hover border           | Primary    | #E53935 | `hover:border-primary` |
| Shadow                 | —          | —       | `shadow-sm`            |
| Profit card border     | Blue       | #3B82F6 | `border-blue-500`      |
| Profit card (negative) | Red        | #EF4444 | `border-red-500`       |

---

## 8. Typography Specification

| Element              | Size | Weight        | Line Height | Font  |
| -------------------- | ---- | ------------- | ----------- | ----- |
| Card title           | 14px | 500 (medium)  | 1.5         | Inter |
| Main value (default) | 32px | 700 (bold)    | 1.2         | Inter |
| Main value (profit)  | 48px | 700 (bold)    | 1.1         | Inter |
| Comparison badge     | 12px | 500 (medium)  | 1.5         | Inter |
| Previous value       | 12px | 400 (regular) | 1.5         | Inter |
| Tooltip content      | 14px | 400 (regular) | 1.5         | Inter |

### Currency Formatting (Russian Locale)

```typescript
// Example output: "1 234 567,89 ₽"
formatCurrency(1234567.89)

// Format rules:
// - Thousands separator: space ( )
// - Decimal separator: comma (,)
// - Currency symbol: ₽ (after value)
// - Decimal places: 2 (for currency)
```

---

## 9. Responsive Breakpoints

| Breakpoint        | Layout    | Card Width | Grid     |
| ----------------- | --------- | ---------- | -------- |
| < 640px (sm)      | Stack     | 100%       | 1 column |
| 640-767px (sm-md) | Stack     | 100%       | 1 column |
| 768-1023px (md)   | 2 columns | 50% - gap  | 2x4      |
| 1024-1279px (lg)  | 2 columns | 50% - gap  | 2x4      |
| >= 1280px (xl)    | 4 columns | 25% - gap  | 4x2      |

### Grid Configuration

```css
/* Tailwind classes */
.kpi-grid {
  @apply grid gap-4;
  @apply grid-cols-1;                    /* Mobile */
  @apply md:grid-cols-2;                 /* Tablet */
  @apply xl:grid-cols-4;                 /* Desktop */
}
```

---

## 10. Accessibility (WCAG 2.1 AA)

### 10.1 Requirements Checklist

| Requirement    | Implementation                         |
| -------------- | -------------------------------------- |
| Color contrast | >=4.5:1 for text, >=3:1 for large text |
| Focus visible  | 2px ring with `ring-primary` on focus  |
| Screen reader  | ARIA labels in Russian                 |
| Keyboard nav   | Tab order, Enter/Space for actions     |
| Reduced motion | Respect `prefers-reduced-motion`       |

### 10.2 ARIA Attributes

```html
<!-- Card container -->
<article
  role="article"
  aria-label="Заказы: 1 234 567 рублей, рост 12,5 процентов"
>

<!-- Loading state -->
<div aria-busy="true" aria-label="Загрузка данных...">

<!-- Trend indicator -->
<span aria-label="Рост">↑</span>
<span aria-label="Снижение">↓</span>
<span aria-label="Без изменений">—</span>

<!-- Tooltip trigger -->
<button
  aria-describedby="tooltip-1"
  aria-label="Подробнее о метрике Заказы"
>
```

### 10.3 Tooltip Content (Russian)

| Metric            | Tooltip Text                                                                                                                                   |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Заказы            | Сумма всех заказов за выбранный период. Включает отменённые и невыкупленные заказы.                                                            |
| COGS по заказам   | Себестоимость товаров для всех заказов, рассчитанная по COGS на момент заказа.                                                                 |
| Выкупы            | Сумма фактических продаж (выкупленные заказы) за выбранный период.                                                                             |
| COGS по выкупам   | Себестоимость проданных товаров. Рассчитывается по COGS, действовавшему в момент продажи.                                                      |
| Рекламные затраты | Общие расходы на рекламу в Wildberries за выбранный период.                                                                                    |
| Логистика         | Расходы на доставку товаров покупателям и возвраты.                                                                                            |
| Хранение          | Расходы на хранение товаров на складах Wildberries.                                                                                            |
| Теор. прибыль     | Теоретическая прибыль = Заказы - COGS - Реклама - Логистика - Хранение. Показывает потенциальную прибыль до вычета комиссий и других расходов. |

---

## 11. Component Props Interface

```typescript
interface KpiCardProps {
  // Content
  title: string;
  value: number | null;
  previousValue?: number | null;
  format?: 'currency' | 'percentage' | 'number';
  icon?: React.ComponentType<{ className?: string }>;
  tooltip?: string;

  // States
  isLoading?: boolean;
  error?: string | null;

  // COGS Warning
  showCogsWarning?: boolean;
  productsWithCogs?: number;
  totalProducts?: number;
  cogsCoverage?: number;
  onAssignCogs?: () => void;

  // Comparison
  invertComparison?: boolean; // For expense metrics

  // Visual
  variant?: 'default' | 'highlighted' | 'profit';
  className?: string;

  // Interaction
  onClick?: () => void;
}
```

---

## 12. Example Data Scenarios

### 12.1 Positive Growth

```json
{
  "title": "Заказы",
  "value": 1234567.89,
  "previousValue": 1098765.43,
  "comparison": {
    "direction": "positive",
    "percentageChange": 12.35,
    "absoluteDifference": 135802.46
  }
}
```

### 12.2 Negative Growth (Expenses)

```json
{
  "title": "Рекламные затраты",
  "value": 45678.00,
  "previousValue": 47123.50,
  "invertComparison": true,
  "comparison": {
    "direction": "positive",  // Lower expenses = positive
    "percentageChange": -3.07,
    "absoluteDifference": -1445.50
  }
}
```

### 12.3 Missing COGS

```json
{
  "title": "COGS по заказам",
  "value": null,
  "showCogsWarning": true,
  "productsWithCogs": 12,
  "totalProducts": 45,
  "cogsCoverage": 26.67
}
```

### 12.4 Negative Profit

```json
{
  "title": "Теор. прибыль",
  "value": -123456.00,
  "previousValue": -103976.00,
  "variant": "profit",
  "comparison": {
    "direction": "negative",
    "percentageChange": -18.74,
    "absoluteDifference": -19480.00
  }
}
```

---

## 13. Implementation Notes

### 13.1 Reuse Existing Components

- Base on `MetricCardEnhanced` from `src/components/custom/MetricCardEnhanced.tsx`
- Use `TrendIndicator` from `src/components/custom/TrendIndicator.tsx`
- Use `ComparisonBadge` from `src/components/custom/ComparisonBadge.tsx`
- Use `CogsMissingState` for COGS warning display

### 13.2 API Integration

```typescript
// Expected API endpoint
GET /v1/dashboard/summary?period=2025-W04&compare_period=2025-W03

// Response structure
{
  "data": {
    "orders_value": 1234567.89,
    "orders_cogs": 234567.00,
    "sales_value": 987654.00,
    "sales_cogs": 123456.00,
    "advert_spend": 45678.00,
    "logistics_cost": 67890.00,
    "storage_cost": 12345.00,
    "theoretical_profit": 876421.00
  },
  "comparison": {
    "orders_value": { "previous": 1098765.43, "change_pct": 12.35 },
    // ... other metrics
  }
}
```

### 13.3 File Structure

```
src/components/custom/
├── dashboard/
│   ├── KpiCardsGrid.tsx       # Grid container
│   ├── KpiCard.tsx            # Individual card (extends MetricCardEnhanced)
│   └── KpiCardSkeleton.tsx    # Loading state
```

---

## 14. References

- [front-end-spec.md](../front-end-spec.md) - Design System
- [MetricCardEnhanced.tsx](../../src/components/custom/MetricCardEnhanced.tsx) - Base component
- [comparison-helpers.ts](../../src/lib/comparison-helpers.ts) - Comparison logic
- [margin-helpers.ts](../../src/lib/margin-helpers.ts) - Week/COGS logic

---

**Document Version**: 1.0
**Last Updated**: 2025-01-31
