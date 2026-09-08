# Story 24.8-FE: High Storage Ratio Alert

## Story Info

- **Epic**: 24 - Paid Storage Analytics (Frontend)
- **Priority**: Low
- **Points**: 2
- **Status**: ✅ Done (QA PASS 92/100)
- **PO Decision**: 2025-11-29 - Notify when storage/revenue ratio > 20%

## User Story

**As a** seller,
**I want** to be alerted when products have high storage-to-revenue ratio,
**So that** I can take action to optimize inventory.

## Acceptance Criteria

### AC1: Alert Display

- [ ] Show alert badge/banner for products with ratio > 20%
- [ ] Red indicator for critical ratio
- [ ] Tooltip explaining the metric

### AC2: Alert Locations

- [ ] Top Consumers widget (highlight row)
- [ ] Storage by SKU table (badge in row)
- [ ] Product card storage info (warning icon)

### AC3: Summary Alert

- [ ] Show count of high-ratio products in page header
- [ ] Example: "⚠️ 5 товаров с высокими расходами на хранение"

## Design

### In Top Consumers Table

```
┌─────┬────────────────┬──────────┬─────────┬─────────────────┐
│ #   │ Товар          │ Хранение │ % общих │ Хран/Выручка %  │
├─────┼────────────────┼──────────┼─────────┼─────────────────┤
│ 1   │ Пальто XL      │ 3,500 ₽  │ 12.5%   │ 23.3% ⚠️ 🔴     │
│ 2   │ Диван          │ 2,800 ₽  │ 10.0%   │ 6.2%  🟢        │
└─────┴────────────────┴──────────┴─────────┴─────────────────┘
```

### Page Header Alert

```
┌─────────────────────────────────────────────────────────────┐
│ 📦 Аналитика расходов на хранение                           │
│ ⚠️ 5 товаров с соотношением хранение/выручка > 20%          │
└─────────────────────────────────────────────────────────────┘
```

### In Product Card

```
│ 📦 Хранение: 160 ₽/день (~4,800 ₽/мес) ⚠️                  │
│    Высокое соотношение к выручке: 23.3%                     │
```

## Technical Details

### Threshold Configuration

```typescript
const STORAGE_RATIO_THRESHOLDS = {
  warning: 10,   // Yellow
  critical: 20,  // Red - triggers alert
};

function getRatioStatus(ratio: number | null): 'ok' | 'warning' | 'critical' {
  if (ratio === null) return 'ok';
  if (ratio >= STORAGE_RATIO_THRESHOLDS.critical) return 'critical';
  if (ratio >= STORAGE_RATIO_THRESHOLDS.warning) return 'warning';
  return 'ok';
}
```

### Alert Banner Component

```typescript
interface StorageAlertBannerProps {
  highRatioCount: number;
  threshold: number;
}

function StorageAlertBanner({ highRatioCount, threshold }: StorageAlertBannerProps) {
  if (highRatioCount === 0) return null;

  return (
    <Alert variant="warning" className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        {highRatioCount} {pluralize(highRatioCount, 'товар', 'товара', 'товаров')} с
        соотношением хранение/выручка &gt; {threshold}%
      </AlertDescription>
    </Alert>
  );
}
```

### Calculate High Ratio Count

```typescript
// From top consumers response
const { data } = useStorageTopConsumers(weekStart, weekEnd, {
  limit: 100,  // Get more to count alerts
  include_revenue: true,
});

const highRatioCount = data?.top_consumers.filter(
  (item) => (item.storage_to_revenue_ratio ?? 0) > 20
).length ?? 0;
```

### Tooltip Content

```
Соотношение хранение/выручка показывает какую долю
от выручки занимают расходы на хранение товара.

• < 10% — отлично 🟢
• 10-20% — обратите внимание 🟡
• > 20% — требует оптимизации 🔴

Рекомендации при высоком показателе:
• Уменьшить запасы на складе
• Повысить оборачиваемость
• Рассмотреть вывод товара из ассортимента
```

## Dependencies

- Story 24.4-FE: Top Consumers Widget
- Story 24.7-FE: Product Card Storage Info
- Alert component (shadcn/ui)

## Test Cases

- [ ] Alert shows when count > 0
- [ ] Alert hidden when count = 0
- [ ] Row highlights with correct color
- [ ] Tooltip displays on hover
- [ ] Count calculated correctly

## Definition of Done

- [ ] High ratio products highlighted in tables
- [ ] Alert banner shows in page header
- [ ] Threshold is 20% as per PO decision
- [ ] Warning icon in product card
- [ ] Helpful tooltip explaining the metric

## Related

- Story 24.4-FE: Top Consumers Widget
- PO Decision: Threshold = 20%

---

## QA Results

### Review Date: 2025-11-29

### Reviewed By: Quinn (Test Architect)

**Gate: PASS** | **Score: 92/100** → `docs/qa/gates/24.8-fe-high-ratio-alert.yml`

**Strengths:**

- Clean alert component (96 lines)
- Russian pluralization helper (товар/товара/товаров)
- Color-coded threshold tooltip with recommendations
- Alert only renders when highRatioCount > 0
- Reuses TopConsumers data for count calculation

**Issues:** None

**Files:** StorageAlertBanner.tsx (96 lines)

**Recommended Status:** [✓ Ready for Done]

---

## Dev Agent Record

```
Status: Completed
Agent: Claude Code (Opus 4.5)
Started: 2025-11-29
Completed: 2025-11-29
Notes:
- Created StorageAlertBanner.tsx (96 lines) with warning banner
- Shows count of products with ratio > 20%
- Russian pluralization for "товар/товара/товаров"
- Comprehensive tooltip explaining thresholds and recommendations
- Color-coded severity indicators in tooltip (green/yellow/red)
- Integrated into page.tsx after summary cards
- Alert only shows when highRatioCount > 0
- NOTE: TopConsumersWidget already has CostSeverityDot from Story 24.4-fe
- All files pass ESLint and TypeScript type-check
```
