# Front-End Specification: Epic 24 - Paid Storage Analytics

**Version**: 1.0
**Date**: 2025-11-29
**Author**: Sally (UX Expert)
**Status**: Approved

---

## 1. Overview

### 1.1 Purpose
This specification defines the UI/UX requirements for the Paid Storage Analytics feature, enabling sellers to analyze storage costs by SKU, identify expensive products, and optimize warehouse strategy.

### 1.2 Scope
- New analytics page: `/analytics/storage`
- 6 main components (Stories 24.1-fe to 24.6-fe)
- Integration with existing design system

### 1.3 Business Goals
1. **Cost Visibility**: Show per-product storage costs
2. **Trend Analysis**: Visualize cost changes over time
3. **Optimization**: Identify products with high storage-to-revenue ratio
4. **Manual Control**: Allow on-demand data import

---

## 2. Design System Integration

### 2.1 Icons (Lucide React)

All icons must use Lucide React for consistency with the existing design system.

| Context | Icon | Size | Color |
|---------|------|------|-------|
| Page header | `Warehouse` | 24px | `text-muted-foreground` |
| Trends section | `TrendingUp` / `TrendingDown` | 20px | Contextual (red/green) |
| Top consumers | `Trophy`, `Medal` | 16px | Gold/Silver/Bronze |
| Table section | `List` | 20px | `text-muted-foreground` |
| Import | `Upload` | 16px | Primary |
| Search | `Search` | 16px | `text-muted-foreground` |
| Scheduler | `Clock` | 16px | `text-muted-foreground` |

### 2.2 Color Palette

#### Primary Colors (from Design Kit)
```css
--primary: #E53935;        /* Primary Red */
--primary-dark: #D32F2F;   /* Hover states */
--primary-light: #FFCDD2;  /* Light backgrounds */
```

#### Storage Analytics Colors (New)
```css
--storage-purple: #7C4DFF;      /* Storage metrics, charts */
--storage-purple-light: rgba(124, 77, 255, 0.1);  /* Backgrounds */

/* Cost Severity */
--cost-high: #EF4444;           /* Red - >20% ratio */
--cost-medium: #F59E0B;         /* Yellow - 10-20% ratio */
--cost-low: #22C55E;            /* Green - <10% ratio */
--cost-unknown: #9CA3AF;        /* Gray - no data */

/* Trend Indicators */
--trend-up-bad: #DC2626;        /* Red - costs increasing */
--trend-down-good: #16A34A;     /* Green - costs decreasing */
```

### 2.3 Typography

| Element | Size | Weight | Line Height |
|---------|------|--------|-------------|
| Page title | 24px | 600 (semibold) | 32px |
| Section header | 18px | 600 (semibold) | 24px |
| Card metric value | 32px | 700 (bold) | 40px |
| Card metric label | 14px | 400 (regular) | 20px |
| Table header | 14px | 500 (medium) | 20px |
| Table cell | 14px | 400 (regular) | 20px |
| Badge text | 12px | 500 (medium) | 16px |

### 2.4 Spacing

```css
/* Page layout */
--page-padding: 24px;
--section-gap: 24px;

/* Cards */
--card-padding: 16px;
--card-gap: 16px;

/* Table */
--table-cell-padding: 12px 16px;
--table-row-gap: 0;

/* Filters */
--filter-gap: 12px;
```

---

## 3. Page Layout

### 3.1 Overall Structure

```
┌─────────────────────────────────────────────────────────────────┐
│ BREADCRUMBS                                                     │
├─────────────────────────────────────────────────────────────────┤
│ PAGE HEADER                                  [Import Button]    │
├─────────────────────────────────────────────────────────────────┤
│ FILTERS ROW                                                     │
├─────────────────────────────────────────────────────────────────┤
│ SUMMARY CARDS (4 cards in row)                                  │
├─────────────────────────────────────────────────────────────────┤
│ TRENDS CHART                                                    │
├─────────────────────────────────────────────────────────────────┤
│ TOP CONSUMERS WIDGET                                            │
├─────────────────────────────────────────────────────────────────┤
│ STORAGE BY SKU TABLE                                            │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Responsive Breakpoints

| Breakpoint | Width | Layout Changes |
|------------|-------|----------------|
| Desktop | ≥1280px | Full layout, 4 cards in row |
| Tablet | 768-1279px | 2 cards per row, full-width sections |
| Mobile | <768px | 1 card per row, horizontal scroll for table |

### 3.3 Grid System

```css
/* Summary cards grid */
.summary-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--card-gap);
}

@media (max-width: 1279px) {
  .summary-cards {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 767px) {
  .summary-cards {
    grid-template-columns: 1fr;
  }
}
```

---

## 4. Component Specifications

### 4.1 Breadcrumbs

**Component**: `Breadcrumb` (shadcn/ui)

```
Главная / Аналитика / Хранение
```

**States**:
- Links: `text-muted-foreground`, hover: `text-foreground`
- Current page: `text-foreground`, no link

### 4.2 Page Header

**Layout**:
```
┌─────────────────────────────────────────────────────────────────┐
│ <Warehouse/> Аналитика расходов на хранение    [Импорт данных]  │
└─────────────────────────────────────────────────────────────────┘
```

**Specifications**:
- Icon: `Warehouse` (24px, `text-muted-foreground`)
- Title: 24px semibold
- Import button: Primary variant, visible only for Manager/Owner roles

### 4.3 Filters Row

**Layout**:
```
┌─────────────────────────────────────────────────────────────────┐
│ Период: [W44 ▼] - [W47 ▼]   Бренды: [Все ▼]   Склады: [Все ▼]  │
└─────────────────────────────────────────────────────────────────┘
```

**Week Range Picker**:
- Two dropdowns: Start week, End week
- Format: `Wxx` (e.g., W44)
- Default: Last 4 weeks to last completed week
- Validation: Start ≤ End

**Brand Multi-Select**:
- Default: "Все бренды" (all selected)
- Chip display for selected items
- Clear all button
- Search within dropdown

**Warehouse Multi-Select**:
- Same pattern as Brand filter
- Default: "Все склады"

### 4.4 Summary Cards

**Card Grid (4 cards)**:

| Card | Metric | Format | Icon |
|------|--------|--------|------|
| Total | `total_storage_cost` | `125,000 ₽` | None |
| Products | `products_count` | `150` | None |
| Average | `avg_cost_per_product` | `833 ₽` | None |
| Period | `period.days_count` | `28 дней` | None |

**Card Design**:
```
┌─────────────────┐
│   125,000 ₽     │  ← 32px bold, text-foreground
│   Всего         │  ← 14px regular, text-muted-foreground
└─────────────────┘
```

**States**:
- Loading: Skeleton animation
- Error: "-" with tooltip
- Zero: "0 ₽" (not dash)

### 4.5 Trends Chart

**Component**: `AreaChart` (Recharts)

**Specifications**:
- Height: 300px
- X-axis: Week labels (W44, W45, etc.)
- Y-axis: Currency values (abbreviated: 28k, 30k)
- Line color: `#7C4DFF` (Storage Purple)
- Fill: Gradient from 30% to 0% opacity
- Dots: 8px circles, white stroke

**Header**:
```
<TrendingUp/> Динамика расходов на хранение     Тренд: +5.2%
```

**Summary Stats Bar**:
```
Мин: 28,000 ₽  |  Макс: 32,000 ₽  |  Среднее: 30,250 ₽
```

**Trend Badge Colors**:
- Increasing (bad): Red background, TrendingUp icon
- Decreasing (good): Green background, TrendingDown icon
- Neutral (0%): Gray background, no icon

**Null Data Handling**:
- Show gaps in line (don't interpolate)
- Dashed circle marker for null points
- Tooltip: "Нет данных за эту неделю"

### 4.6 Top Consumers Widget

**Table (5 rows)**:

| # | Товар | Хранение | % общих | Хран/Выр % |
|---|-------|----------|---------|------------|
| 🏆 1 | Пальто зимнее XL | 3,500 ₽ | 12.5% | 23.3% ● |

**Rank Indicators**:
- Rank 1: `Trophy` icon (gold/yellow-500)
- Rank 2: `Medal` icon (silver/gray-400)
- Rank 3: `Medal` icon (bronze/amber-600)
- Ranks 4-5: Number only (gray text)

**Storage-to-Revenue Ratio Colors**:
- >20%: Red dot + bold red text
- 10-20%: Yellow dot
- <10%: Green dot
- null: Gray dot

**Tooltip for Ratio**:
```
Отношение расходов на хранение к выручке.
Высокое значение (>20%) означает, что товар
дорого хранить относительно его продаж.
Рекомендуется: <10%
```

**Footer**:
```
[Показать все →]
```
- Links to/scrolls to full table section

### 4.7 Storage by SKU Table

**Columns**:

| Column | Width | Sortable | Format |
|--------|-------|----------|--------|
| Артикул | 100px | No | Link |
| Название | 250px | No | Truncate 45 chars + tooltip |
| Бренд | 120px | No | Text |
| Хранение | 100px | Yes ↓ | Currency |
| ₽/день | 80px | Yes | Currency |
| Объём | 70px | Yes | Number + "л" |
| Склады | 150px | No | Badges |
| Дней | 60px | Yes | Number |

**Warehouse Badges**:
```
[Коледино] [Подольск] [+3]
                       ↑ Tooltip with full list
```
- Max 2 visible badges
- Overflow: "+N" secondary badge with tooltip

**Product Name Truncation**:
```
Футболка хлопок мужская с принтом...
                                 ↑ Tooltip with full name
```
- Max 45 characters
- Ellipsis + tooltip for longer names

**Search**:
- Debounced input (500ms)
- Searches: nm_id, vendor_code
- Placeholder: "Поиск по артикулу"

**Pagination**:
- Cursor-based
- 20 items per page
- Controls: [← Пред] [1] [2] [3] [След →]
- Counter: "Показано 1-20 из 150"

**Row Hover**:
- Background: `bg-muted/50`
- Cursor: pointer
- Click: Navigate to `/analytics/sku?nm_id={nm_id}`

**Empty State**:
```
┌─────────────────────────────────────────┐
│         📦                               │
│  Нет товаров с данными о хранении       │
│  за выбранный период                    │
└─────────────────────────────────────────┘
```

### 4.8 Import Dialog

**Dialog Size**: 480px width

**States**:

#### Initial State
```
┌─────────────────────────────────────────────────────────────┐
│ <Upload/> Импорт данных о хранении                    [X]   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Период для импорта:                                        │
│                                                             │
│  С: [📅 2025-11-18]        По: [📅 2025-11-24]              │
│                                                             │
│  ⚠️ Максимальный период: 8 дней (ограничение WB API)        │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ ℹ️ Автоматический импорт: вторник, 08:00 МСК         │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                              [Отмена]  [Начать импорт]      │
└─────────────────────────────────────────────────────────────┘
```

#### Processing State
```
┌─────────────────────────────────────────────────────────────┐
│ <Upload/> Импорт данных о хранении                    [X]   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                  ⏳ Импорт выполняется...                    │
│                                                             │
│       [████████████████████████████] (indeterminate)        │
│                                                             │
│       Обработка данных...                                   │
│       Ожидаемое время: ~60 секунд                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Close Confirmation (AlertDialog)
```
┌─────────────────────────────────────────────────────────────┐
│  Прервать импорт?                                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Импорт продолжится в фоновом режиме.                       │
│  Вы можете проверить статус позже.                          │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                               [Остаться]  [Закрыть]         │
└─────────────────────────────────────────────────────────────┘
```

#### Success State
```
┌─────────────────────────────────────────────────────────────┐
│ <Upload/> Импорт данных о хранении                    [X]   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                  ✅ Импорт завершён!                         │
│                                                             │
│       Импортировано строк: 3,500                            │
│       Период: 18.11.2025 - 24.11.2025                       │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                           [Закрыть]         │
└─────────────────────────────────────────────────────────────┘
```

#### Error State
```
┌─────────────────────────────────────────────────────────────┐
│ <Upload/> Импорт данных о хранении                    [X]   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                  ❌ Ошибка импорта                           │
│                                                             │
│       Превышен лимит запросов WB API.                       │
│       Попробуйте позже.                                     │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                      [Отмена]  [Повторить]                  │
└─────────────────────────────────────────────────────────────┘
```

**Date Validation**:
- Max range: 8 days
- No future dates
- From ≤ To
- Error shown inline below date pickers

---

## 5. Loading & Error States

### 5.1 Loading Skeletons

**Summary Cards**:
```
┌─────────────────┐
│ ████████████    │  ← Skeleton pulse animation
│ ████████        │
└─────────────────┘
```

**Table**:
- Header: Static
- Rows: 5 skeleton rows with pulsing cells

**Chart**:
- Full-height skeleton with pulse

### 5.2 Error States

**Page-Level Error**:
```
┌─────────────────────────────────────────────────────────────┐
│                          ⚠️                                  │
│              Не удалось загрузить данные                    │
│                                                             │
│         [Попробовать снова]                                 │
└─────────────────────────────────────────────────────────────┘
```

**Section-Level Error**:
- Show error message in place of content
- Retry button
- Other sections continue to work

### 5.3 Empty States

**No Data for Period**:
```
┌─────────────────────────────────────────────────────────────┐
│                          📦                                  │
│              Нет данных за выбранный период                 │
│                                                             │
│     Попробуйте выбрать другой период или запустите импорт   │
│                                                             │
│                   [Импорт данных]                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Accessibility

### 6.1 Keyboard Navigation

| Component | Keys | Action |
|-----------|------|--------|
| Filters | Tab | Move between filters |
| Table | Tab, Arrow keys | Navigate rows |
| Table row | Enter, Space | Select/activate row |
| Dialog | Escape | Close dialog |
| Dialog | Tab | Move between elements |

### 6.2 Screen Reader Support

- All icons have `aria-label` attributes
- Tables use proper `th` and `scope` attributes
- Charts have `aria-label` with summary
- Loading states announced via `aria-live="polite"`
- Error states announced via `aria-live="assertive"`

### 6.3 Color Contrast

All text meets WCAG AA standards:
- Normal text: 4.5:1 minimum
- Large text: 3:1 minimum
- Interactive elements: 3:1 minimum

### 6.4 Focus Indicators

- Visible focus ring on all interactive elements
- Focus ring color: Primary Red (#E53935)
- Focus ring width: 2px

---

## 7. Performance Requirements

### 7.1 Load Times

| Metric | Target | Measurement |
|--------|--------|-------------|
| First Contentful Paint | <1s | Lighthouse |
| Time to Interactive | <2s | Lighthouse |
| API Response (p95) | <500ms | Backend |
| Chart Render | <200ms | Performance API |

### 7.2 Bundle Size

- Page chunk: <100KB gzipped
- Recharts (lazy loaded): <50KB gzipped
- Total: <150KB for initial load

### 7.3 Caching Strategy

- API responses: React Query cache (5 minutes stale time)
- Static assets: 1 year cache
- Page transitions: Prefetch on hover

---

## 8. Testing Requirements

### 8.1 Unit Tests

| Component | Coverage Target |
|-----------|-----------------|
| Hooks | >80% |
| Helper functions | >90% |
| Components | >70% |

### 8.2 Integration Tests

- Filter interactions update data
- Pagination works correctly
- Import flow completes
- Error boundaries catch errors

### 8.3 Visual Regression

- Screenshot tests for all states
- Responsive breakpoint screenshots
- Dark mode (if applicable)

### 8.4 Accessibility Tests

- axe-core automated testing
- Keyboard navigation manual testing
- Screen reader manual testing

---

## 9. Implementation Notes

### 9.1 File Structure

```
src/app/(dashboard)/analytics/storage/
├── page.tsx                      # Main page
├── loading.tsx                   # Skeleton loader
├── error.tsx                     # Error boundary
└── components/
    ├── StoragePageHeader.tsx
    ├── StorageFilters.tsx
    ├── StorageSummaryCards.tsx
    ├── StorageTrendsChart.tsx
    ├── TopConsumersWidget.tsx
    ├── StorageBySkuTable.tsx
    ├── PaidStorageImportDialog.tsx
    └── helpers/
        ├── RankIndicator.tsx
        ├── CostSeverityDot.tsx
        ├── WarehouseBadges.tsx
        ├── ProductNameCell.tsx
        └── TrendBadge.tsx
```

### 9.2 Reusable Components

The following components should be extracted for reuse:

1. **WeekRangePicker** - Already exists or create in `/components/custom/`
2. **MultiSelect** - May need to create if not exists
3. **TrendBadge** - Useful for other analytics pages
4. **CostSeverityDot** - Useful for ratio indicators

### 9.3 State Management

- **Server State**: React Query (TanStack Query v5)
- **Filter State**: URL search params + `useState`
- **Dialog State**: Local `useState`

### 9.4 API Integration

See Story 24.1-fe for complete API client specification.

---

## 10. Deferred Features (Post-MVP)

The following features are explicitly out of scope for MVP:

1. **Export CSV** - Can be added as Story 24.9-fe
2. **Chart Click Interaction** - Filter tables by clicking week
3. **Full Scheduler Info** - Show next_run_at from API
4. **Real Progress Bar** - Backend percentage tracking
5. **Volume Chart** - Second metric in trends

---

## Appendix A: Design Kit Reference

- **Buttons**: `ui/311956d0-3832-426e-9b24-08b674222efc.png`
- **Sidebar**: `ui/f30321c9-3363-44e4-b0a7-1f856d9248bd.png`

## Appendix B: Related Documentation

- Backend API: `docs/request-backend/36-epic-24-paid-storage-analytics-api.md`
- Epic README: `docs/stories/epic-24/README.md`
- Stories: `docs/stories/epic-24/story-24.*.md`

---

**Document Control**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-29 | Sally (UX Expert) | Initial specification |
