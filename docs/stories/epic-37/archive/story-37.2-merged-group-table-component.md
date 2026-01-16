# Story 37.2: MergedGroupTable Component

**Epic**: Epic 37 - Merged Group Table Display (Склейки)
**Status**: 📋 Draft - Awaiting PO Validation
**Effort**: 3-4 hours
**Priority**: High (Requires Story 37.1 completion)
**Assignee**: [TO BE ASSIGNED - Frontend Dev]

---

## 🎯 User Story

**As a** user viewing advertising analytics in "По склейкам" mode
**I want** to see a hierarchical table with grouped products and their metrics
**So that** I can understand how ad spend on main products drives revenue across linked product cards

---

## 📋 Acceptance Criteria

### Component Structure
- [ ] Create `<MergedGroupTable>` component in `frontend/src/app/(dashboard)/analytics/advertising/components/`
- [ ] Implement rowspan for склейка indicator column
- [ ] Render 3-tier structure: Tier 1 (rowspan), Tier 2 (aggregate), Tier 3 (details)
- [ ] Support sorting by aggregate metrics (from props)
- [ ] Responsive: horizontal scroll on mobile, full view on desktop

### Tier 1: Склейка Indicator (Rowspan Cell)
- [ ] Cell spans all rows in group (header + detail rows)
- [ ] Displays: `"${mainProduct.nmId} + ${productCount} товаров"`
- [ ] Example: "ter-09 + 5 товаров" for 6-product group
- [ ] Vertically centered text
- [ ] Subtle background color (#FAFAFA)
- [ ] Right border (2px solid #E5E7EB)

### Tier 2: Aggregate Row (Header)
- [ ] First row displays "ГРУППА #imtId" in "Артикул" column
- [ ] Shows aggregate metrics: totalSales, revenue, organicSales, spend, ROAS
- [ ] Bold text (font-weight: 600)
- [ ] Colored background (#F3F4F6)
- [ ] Font size: 0.95rem

### Tier 3: Detail Rows (Individual Products)
- [ ] One row per product in group
- [ ] Main product marked with 👑 crown icon before nmId
- [ ] Child products: no special icon
- [ ] Normal text (font-weight: 400)
- [ ] White background
- [ ] Font size: 0.875rem

### [PO TO FILL] Edge Cases
- [ ] [PO TO SPECIFY] Single-product groups: Show rowspan cell or skip?
- [ ] [PO TO SPECIFY] Group with >10 products: Collapse by default?
- [ ] [PO TO SPECIFY] Missing main product: How to identify group?
- [ ] [PO TO SPECIFY] Empty metrics (spend=0, revenue=0): Display "—" or "0₽"?

---

## 🎨 Component API (Draft)

### Props Interface
```typescript
interface MergedGroupTableProps {
  /** Array of merged groups with aggregate + individual metrics */
  groups: AdvertisingGroup[];

  /** Current sort field and direction */
  sortConfig?: {
    field: SortField;
    direction: 'asc' | 'desc';
  };

  /** Callback when user clicks column header to sort */
  onSort?: (field: SortField) => void;

  /** Callback when user clicks on a product row */
  onProductClick?: (nmId: string) => void;

  /** [PO TO FILL] Loading state? */
  isLoading?: boolean;

  /** [PO TO FILL] Empty state message? */
  emptyMessage?: string;
}

interface AdvertisingGroup {
  imtId: number;
  mainProduct: {
    nmId: string;
    name: string;
  };
  productCount: number;
  aggregateMetrics: AggregateMetrics;
  products: ProductMetrics[];
}

interface AggregateMetrics {
  totalSales: number;      // Epic 35 field
  revenue: number;          // Epic 35 field
  organicSales: number;     // Epic 35 field
  organicContribution: number; // Percentage
  spend: number;
  roas: number | null;      // null if spend = 0
}

interface ProductMetrics {
  nmId: string;
  imtId: number;
  isMainProduct: boolean;
  totalSales: number;
  revenue: number;
  organicSales: number;
  organicContribution: number;
  spend: number;
  roas: number | null;
}

type SortField =
  | 'totalSales'
  | 'revenue'
  | 'organicSales'
  | 'spend'
  | 'roas';
```

---

## 🔧 Implementation Guide

### Component Structure
```typescript
// File: frontend/src/app/(dashboard)/analytics/advertising/components/MergedGroupTable.tsx

import { Crown } from 'lucide-react';

export function MergedGroupTable({
  groups,
  sortConfig,
  onSort,
  onProductClick
}: MergedGroupTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse">
        <thead>
          <TableHeader sortConfig={sortConfig} onSort={onSort} />
        </thead>
        <tbody>
          {groups.map((group) => (
            <MergedGroupRows
              key={group.imtId}
              group={group}
              onProductClick={onProductClick}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MergedGroupRows({ group, onProductClick }: {
  group: AdvertisingGroup;
  onProductClick?: (nmId: string) => void
}) {
  const totalRows = group.products.length + 1; // +1 for aggregate row

  return (
    <>
      {/* Aggregate Row (Header) */}
      <tr className="aggregate-row bg-gray-100">
        {/* Tier 1: Rowspan Cell - spans all rows in group */}
        <td
          rowSpan={totalRows}
          className="merged-group-indicator px-4 py-2 text-center align-middle bg-gray-50 border-r-2 border-gray-200"
        >
          <div className="text-sm text-gray-600 font-medium">
            {group.mainProduct.nmId}
            <br />
            <span className="text-xs text-gray-500">
              + {group.productCount - 1} товаров
            </span>
          </div>
        </td>

        {/* Tier 2: Aggregate Metrics */}
        <td className="px-4 py-2 font-semibold text-[0.95rem]">
          ГРУППА #{group.imtId}
        </td>
        <td className="px-4 py-2 font-semibold text-[0.95rem] text-right">
          {formatCurrency(group.aggregateMetrics.totalSales)}
        </td>
        <td className="px-4 py-2 font-semibold text-[0.95rem] text-right">
          {formatCurrency(group.aggregateMetrics.revenue)}
          <span className="text-xs text-gray-600 ml-1">
            ({group.aggregateMetrics.organicContribution.toFixed(1)}%)
          </span>
        </td>
        {/* ... more aggregate columns */}
      </tr>

      {/* Detail Rows (Individual Products) */}
      {group.products.map((product) => (
        <tr
          key={product.nmId}
          className="detail-row hover:bg-gray-50 cursor-pointer"
          onClick={() => onProductClick?.(product.nmId)}
        >
          {/* Tier 3: Product Metrics */}
          <td className="px-4 py-2 text-sm">
            {product.isMainProduct && (
              <Crown className="inline h-4 w-4 text-yellow-600 mr-1" />
            )}
            {product.nmId}
          </td>
          <td className="px-4 py-2 text-sm text-right">
            {formatCurrency(product.totalSales)}
          </td>
          <td className="px-4 py-2 text-sm text-right">
            {formatCurrency(product.revenue)}
            <span className="text-xs text-gray-600 ml-1">
              ({product.organicContribution.toFixed(1)}%)
            </span>
          </td>
          {/* ... more product columns */}
        </tr>
      ))}
    </>
  );
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}
```

### Styling (Tailwind CSS)
```typescript
// Rowspan Cell
const rowspanCellClasses = [
  'px-4 py-2',
  'text-center align-middle',
  'bg-gray-50',
  'border-r-2 border-gray-200',
  'text-sm text-gray-600 font-medium'
].join(' ');

// Aggregate Row
const aggregateRowClasses = [
  'bg-gray-100',
  'font-semibold text-[0.95rem]'
].join(' ');

// Detail Row
const detailRowClasses = [
  'hover:bg-gray-50',
  'cursor-pointer',
  'text-sm'
].join(' ');
```

---

## 🧪 Test Scenarios

### Test 1: Rowspan Rendering
**Given**: Group with 6 products (1 main + 5 children)
**When**: Component renders
**Then**:
- [ ] Rowspan cell spans 7 rows (1 aggregate + 6 details)
- [ ] Cell displays "ter-09" and "+ 5 товаров"
- [ ] Cell vertically centered

### Test 2: Crown Icon Display
**Given**: Group with 1 main product (spend > 0) and 5 children (spend = 0)
**When**: Detail rows render
**Then**:
- [ ] Main product row shows 👑 crown icon
- [ ] 5 child product rows have no crown icon
- [ ] Crown icon positioned before nmId text

### Test 3: Aggregate Row Styling
**Given**: Any group
**When**: Aggregate row renders
**Then**:
- [ ] Background color is #F3F4F6 (gray-100)
- [ ] Text is bold (font-weight: 600)
- [ ] Font size is 0.95rem
- [ ] Displays "ГРУППА #imtId" in Артикул column

### Test 4: Sorting Interaction
**Given**: User clicks "Всего продаж" column header
**When**: `onSort` callback fires
**Then**:
- [ ] Callback receives `field: 'totalSales'`
- [ ] Groups re-render in sorted order
- [ ] Sort direction indicator updates

### [PO TO FILL] Test 5: Progressive Disclosure
**Given**: [PO TO SPECIFY] Group with >N products
**When**: Component renders
**Then**:
- [ ] [PO TO SPECIFY] Detail rows collapsed by default?
- [ ] [PO TO SPECIFY] "Show more" button displays?
- [ ] [PO TO SPECIFY] Aggregate row always visible?

---

## 📊 Accessibility Requirements

- [ ] Table has semantic HTML (`<table>`, `<thead>`, `<tbody>`, `<tr>`, `<td>`)
- [ ] Rowspan cell uses `rowspan` attribute (screen reader compatible)
- [ ] Column headers have `scope="col"` attribute
- [ ] Crown icon has `aria-label="Главный товар"` or text alternative
- [ ] Sortable columns indicate sort state with `aria-sort` attribute
- [ ] Keyboard navigation: Tab to focus rows, Enter to click
- [ ] [PO TO FILL] WCAG 2.1 AA color contrast verified?

---

## 🐛 Edge Cases

### Edge Case 1: Single-Product Group
**Scenario**: Group with only 1 product (main product, no children)
**Current Behavior**: Rowspan cell spans 2 rows (aggregate + 1 detail)
**PO Decision**: [PO TO FILL]
- Should single-product groups use rowspan, or display differently?
- Should "Склейка" label be hidden for single products?

### Edge Case 2: Missing Main Product
**Scenario**: All products in group have `spend = 0` (no main product)
**Current Behavior**: Crown icon not displayed on any row
**PO Decision**: [PO TO FILL]
- How to identify "main" product without spend signal?
- Use alphabetically first nmId? Or flag as anomaly?

### Edge Case 3: Very Large Group (>20 products)
**Scenario**: Group with 25 products
**Current Behavior**: Rowspan cell spans 26 rows (aggregate + 25 details)
**PO Decision**: [PO TO FILL]
- Collapse by default with "Show all" button?
- Paginate within group?
- Warn user about large group size?

---

## ✅ Definition of Done

- [ ] Component created in `frontend/src/app/(dashboard)/analytics/advertising/components/MergedGroupTable.tsx`
- [ ] Props interface matches API structure from Story 37.1
- [ ] Rowspan rendering works for all group sizes (1-20+ products)
- [ ] Crown icon displays correctly for main products
- [ ] Aggregate row styling matches mockup (bold, gray background, 0.95rem)
- [ ] Detail row styling matches mockup (normal, white background, 0.875rem)
- [ ] Sorting callback integration functional
- [ ] All test scenarios pass (Tests 1-4 minimum)
- [ ] Accessibility requirements met (semantic HTML, ARIA labels)
- [ ] Component integrated into `page.tsx` (replaces existing PerformanceMetricsTable when `group_by=imtId`)
- [ ] Manual testing in browser confirms visual hierarchy
- [ ] PO review and approval of rendered component

---

## 📎 References

- **Epic 37 Main**: `docs/epics/epic-37-merged-group-table-display.md` - Visual mockup
- **Story 37.1**: `docs/stories/epic-37/story-37.1-backend-api-validation.md` - API structure
- **Current Page**: `frontend/src/app/(dashboard)/analytics/advertising/page.tsx` - Integration point
- **Existing Badge**: `frontend/src/app/(dashboard)/analytics/advertising/components/ProductRowBadge.tsx` - Reference for crown icon pattern

---

## 🎯 Next Steps

1. **Frontend dev**: Implement `MergedGroupTable.tsx` component
2. **Visual QA**: Compare rendered output to mockup in Epic 37
3. **Integrate**: Replace conditional rendering in `page.tsx` to use new component when `group_by=imtId`
4. **Test**: Execute all test scenarios, fix edge cases
5. **PO review**: Demo component functionality, get approval
6. **Story 37.3**: Continue to aggregate metrics calculations

---

**Story Owner**: [TO BE ASSIGNED]
**Created**: 2025-12-29
**Last Updated**: 2025-12-29
