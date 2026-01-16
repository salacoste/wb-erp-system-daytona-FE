# Epic 37: Frontend Implementation Plan

**Date**: 2025-12-29
**Status**: 📋 **READY FOR DEVELOPMENT** - Backend API in progress (Story 37.0)
**Target Completion**: 2026-01-06 (1 week)
**Total Effort**: 8-12 hours frontend development
**Assignee**: [TO BE ASSIGNED - Frontend Dev]

---

## 🎯 Executive Summary

Epic 37 реализует **3-tier rowspan table** для отображения склеек товаров в advertising analytics. План учитывает, что backend API (Story 37.0) находится в разработке, поэтому мы начинаем с **mock данных** и переключаемся на реальный API после готовности.

**Ключевые решения**:
- ✅ Начинаем разработку с mock данных (параллельно с backend)
- ✅ Используем feature flag для переключения mock ↔ API
- ✅ Валидация API через Story 37.1 ПОСЛЕ готовности backend
- ✅ Интеграция по фазам (5 Stories: 37.1-37.5)

---

## 📋 Development Strategy

### Phase 0: Preparation (IMMEDIATE - Day 0)

**Goal**: Подготовить mock данные и инфраструктуру для разработки

**Tasks**:
1. **Create Mock Data Structure** (30 min)
   - File: `frontend/src/mocks/data/epic-37-merged-groups.ts`
   - Data: 3 test groups matching Request #88 structure
   - Coverage: normal group (6 products), small group (2 products), standalone (imtId=null)

2. **Add Feature Flag** (15 min)
   - File: `frontend/src/config/features.ts`
   - Flag: `EPIC_37_MERGED_GROUPS_ENABLED`
   - Flag: `EPIC_37_USE_REAL_API` (default: false)

3. **Update TypeScript Types** (30 min)
   - File: `frontend/src/types/advertising-analytics.ts`
   - Add: `AggregateMetrics`, `MergedGroupProduct`, `AdvertisingGroup` interfaces
   - Match: Request #88 expected structure

**Deliverables**:
- ✅ Mock data file with 3 test groups
- ✅ Feature flags configured
- ✅ TypeScript types updated

**Duration**: 1.5 hours

---

### Phase 1: Foundation (Stories 37.1-37.2 - Days 1-2)

#### Story 37.1: Backend API Validation ⏳ BLOCKED

**Status**: ⚠️ **BLOCKED by Story 37.0** (Backend API Enhancement)

**When to Start**: AFTER backend completes Request #88 (estimated: 2026-01-02)

**Effort**: 1-2 hours

**Tasks**:
1. **Execute API Request** (20 min)
   - Open DevTools Network tab
   - Test endpoint: `GET /v1/analytics/advertising?group_by=imtId&from=2025-12-01&to=2025-12-21`
   - Capture response to `docs/stories/epic-37/api-response-sample-PRODUCTION.json`

2. **Validate Response Structure** (30 min)
   - Check all 15 acceptance criteria
   - Verify `mainProduct`, `productCount`, `aggregateMetrics`, `products[]` fields
   - Confirm Epic 35 fields present at both levels

3. **Data Integrity Checks** (20 min)
   - Test: `aggregateMetrics.totalSales` = SUM(products[].totalSales)
   - Test: `aggregateMetrics.revenue` = SUM(products[].revenue)
   - Test: Main product identification (spend > 0)
   - Test: Sort order (main first, then by totalSales DESC)

4. **Document Findings** (10 min)
   - Update Story 37.1 status (PASS/FAIL)
   - Report discrepancies to backend team if any
   - Notify PO of completion

**Acceptance Criteria**: All 15 ACs pass ✅

**Deliverables**:
- ✅ Production API response sample
- ✅ Validation report (PASS/FAIL)
- ✅ Story 37.1 marked COMPLETE

**Duration**: 1-2 hours

**⚠️ CRITICAL**: This story CANNOT start until Story 37.0 (backend) is complete!

---

#### Story 37.2: MergedGroupTable Component (Days 1-2)

**Status**: ✅ **CAN START IMMEDIATELY** (using mock data)

**Effort**: 3-4 hours

**Tasks**:

**Task 1: Create Component Structure** (1 hour)
```typescript
// File: frontend/src/components/advertising/MergedGroupTable.tsx

interface MergedGroupTableProps {
  groups: AdvertisingGroup[];
  onSort?: (field: SortField) => void;
  onProductClick?: (nmId: number) => void;
}

export function MergedGroupTable({ groups, onSort, onProductClick }: MergedGroupTableProps) {
  return (
    <table className="min-w-full divide-y divide-gray-200">
      <thead>
        {/* Column headers */}
      </thead>
      <tbody>
        {groups.map(group => (
          <MergedGroupRows key={group.imtId || `standalone-${group.products[0].nmId}`} group={group} />
        ))}
      </tbody>
    </table>
  );
}
```

**Task 2: Implement Rowspan Logic** (1 hour)
```typescript
// File: frontend/src/components/advertising/MergedGroupRows.tsx

function MergedGroupRows({ group }: { group: AdvertisingGroup }) {
  const rowCount = group.productCount + 1; // +1 for aggregate row

  return (
    <>
      {/* First row: Rowspan cell + Aggregate metrics */}
      <tr className="border-b border-gray-200">
        <td rowSpan={rowCount} className="merged-group-indicator">
          {group.mainProduct.vendorCode} + {group.productCount - 1} товаров
        </td>
        <td className="aggregate-row" colSpan={8}>
          ГРУППА #{group.imtId}
        </td>
        <td className="aggregate-row">{formatCurrency(group.aggregateMetrics.totalSales)}</td>
        {/* ... other aggregate columns */}
      </tr>

      {/* Detail rows: Individual products */}
      {group.products.map((product, idx) => (
        <tr key={product.nmId} className="detail-row">
          <td>
            {product.isMainProduct && <span className="crown-icon">👑</span>}
            {product.vendorCode}
          </td>
          <td>{formatCurrency(product.totalSales)}</td>
          {/* ... other product columns */}
        </tr>
      ))}
    </>
  );
}
```

**Task 3: Handle Standalone Products** (30 min)
```typescript
// Special case: imtId=null (no group)
if (group.imtId === null) {
  return (
    <tr className="detail-row">
      {/* NO rowspan cell */}
      <td>{group.products[0].vendorCode}</td>
      <td>{formatCurrency(group.products[0].totalSales)}</td>
      {/* ... other columns */}
    </tr>
  );
}
```

**Task 4: Unit Tests** (30 min)
```typescript
// File: frontend/src/components/advertising/__tests__/MergedGroupTable.test.tsx

describe('MergedGroupTable', () => {
  it('renders rowspan cell with correct row count', () => {
    const group = mockGroups[0]; // 6 products
    render(<MergedGroupTable groups={[group]} />);
    const rowspanCell = screen.getByText(/ter-09 \+ 5 товаров/);
    expect(rowspanCell).toHaveAttribute('rowSpan', '7'); // 1 aggregate + 6 products
  });

  it('displays crown icon for main product', () => {
    const group = mockGroups[0];
    render(<MergedGroupTable groups={[group]} />);
    const crownIcons = screen.getAllByText('👑');
    expect(crownIcons).toHaveLength(1); // Only main product
  });

  it('handles standalone products without rowspan', () => {
    const standaloneGroup = mockGroups[2]; // imtId=null
    render(<MergedGroupTable groups={[standaloneGroup]} />);
    const rowspanCells = screen.queryAllByRole('cell', { name: /\+ \d+ товаров/ });
    expect(rowspanCells).toHaveLength(0); // No rowspan for standalone
  });
});
```

**Acceptance Criteria**:
- ✅ Rowspan cell spans correct number of rows (productCount + 1)
- ✅ Aggregate row displays ГРУППА #imtId
- ✅ Individual products rendered below aggregate
- ✅ Crown icon (👑) only on main product
- ✅ Standalone products (imtId=null) have NO rowspan cell
- ✅ Unit tests pass

**Deliverables**:
- ✅ `MergedGroupTable.tsx` component
- ✅ `MergedGroupRows.tsx` helper component
- ✅ Unit tests with ≥90% coverage

**Duration**: 3-4 hours

**Mock Data Source**: `frontend/src/mocks/data/epic-37-merged-groups.ts`

---

### Phase 2: Metrics & Styling (Stories 37.3-37.4 - Days 2-3)

#### Story 37.3: Aggregate Metrics Display (Day 2)

**Effort**: 2-3 hours

**Tasks**:

**Task 1: Implement Calculation Functions** (1 hour)
```typescript
// File: frontend/src/utils/advertising-calculations.ts

export function calculateAggregateMetrics(products: MergedGroupProduct[]): AggregateMetrics {
  const totalSales = sum(products.map(p => p.totalSales));
  const revenue = sum(products.map(p => p.revenue));
  const organicSales = totalSales - revenue;
  const organicContribution = totalSales > 0 ? (organicSales / totalSales) * 100 : 0;
  const spend = sum(products.map(p => p.spend));
  const roas = spend > 0 ? revenue / spend : null;

  return {
    totalSales,
    revenue,
    organicSales,
    organicContribution,
    spend,
    roas,
    // ... other fields
  };
}
```

**Task 2: Format Percentage Displays** (30 min)
```typescript
// File: frontend/src/components/advertising/MetricsCell.tsx

interface MetricsCellProps {
  value: number;
  percentage?: number;
  format: 'currency' | 'number' | 'percent';
}

export function MetricsCell({ value, percentage, format }: MetricsCellProps) {
  const formattedValue = format === 'currency' ? formatCurrency(value) : formatNumber(value);

  return (
    <div className="flex flex-col">
      <span className="font-medium">{formattedValue}</span>
      {percentage !== undefined && (
        <span className="text-xs text-gray-500">({percentage.toFixed(1)}%)</span>
      )}
    </div>
  );
}
```

**Task 3: Handle Edge Cases** (30 min)
```typescript
// Edge case 1: spend = 0 → ROAS = null → display "—"
const roasDisplay = roas !== null ? roas.toFixed(2) : '—';

// Edge case 2: negative revenue → display in red
const revenueClass = revenue < 0 ? 'text-red-600' : '';

// Edge case 3: missing fields → display "—"
const safeValue = value ?? '—';
```

**Task 4: Add Tooltips** (30 min)
```typescript
// Aggregate row tooltip
<Tooltip content="Сумма всех товаров в склейке">
  <td className="aggregate-row">{formatCurrency(aggregateMetrics.totalSales)}</td>
</Tooltip>

// ROAS tooltip
<Tooltip content="Доход с рекламы / Расход. Показывает возврат на вложенный рубль.">
  <td className="aggregate-row">{roasDisplay}</td>
</Tooltip>
```

**Task 5: Unit Tests** (30 min)
```typescript
describe('calculateAggregateMetrics', () => {
  it('sums totalSales correctly', () => {
    const products = [
      { totalSales: 15000, revenue: 4000, spend: 6000 },
      { totalSales: 8500, revenue: 2300, spend: 0 },
    ];
    const aggregate = calculateAggregateMetrics(products);
    expect(aggregate.totalSales).toBe(23500);
  });

  it('handles spend=0 case with null ROAS', () => {
    const products = [{ totalSales: 1000, revenue: 0, spend: 0 }];
    const aggregate = calculateAggregateMetrics(products);
    expect(aggregate.roas).toBeNull();
  });
});
```

**Acceptance Criteria**:
- ✅ Aggregate metrics calculated correctly (totalSales, revenue, organicSales)
- ✅ Percentage displays work (e.g., "10,234₽ (29%)")
- ✅ ROAS calculation handles spend=0 → null
- ✅ Edge cases handled (zero spend → "—", negative revenue → red)
- ✅ Tooltips present on aggregate row
- ✅ Unit tests pass

**Deliverables**:
- ✅ `advertising-calculations.ts` utility
- ✅ `MetricsCell.tsx` component
- ✅ Unit tests with ≥90% coverage

**Duration**: 2-3 hours

---

#### Story 37.4: Visual Styling & Hierarchy (Day 3)

**Effort**: 2-3 hours

**Tasks**:

**Task 1: Implement CSS Design Tokens** (1 hour)
```css
/* File: frontend/src/components/advertising/MergedGroupTable.module.css */

.merged-group-indicator {
  background: #FAFAFA;
  border-right: 2px solid #E5E7EB;
  text-align: center;
  vertical-align: middle;
  font-size: 0.875rem;
  color: #6B7280;
  padding: 1rem 0.5rem;
}

.aggregate-row {
  background: #F3F4F6;
  font-weight: 600;
  font-size: 0.95rem;
  padding: 0.75rem 1rem;
}

.detail-row {
  background: white;
  font-weight: 400;
  font-size: 0.875rem;
  padding: 0.75rem 1rem;
}

.detail-row:hover {
  background: #F9FAFB;
  cursor: pointer;
}

.crown-icon {
  display: inline-block;
  margin-right: 0.25rem;
  font-size: 1rem;
}
```

**Task 2: Implement Responsive Design** (1 hour)
```css
/* Mobile: Horizontal scroll with sticky columns */
@media (max-width: 768px) {
  .merged-group-table-wrapper {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .merged-group-table {
    min-width: 1200px; /* Force horizontal scroll */
  }

  /* Sticky left columns */
  .merged-group-indicator,
  .product-name-column {
    position: sticky;
    left: 0;
    z-index: 1;
    background: white;
  }

  /* Min column widths */
  th, td {
    min-width: 200px;
  }
}
```

**Task 3: Accessibility Improvements** (30 min)
```typescript
// Add ARIA labels for screen readers
<td rowSpan={rowCount}
    className="merged-group-indicator"
    aria-label={`Merged group ${group.mainProduct.vendorCode} with ${group.productCount} products`}>
  {group.mainProduct.vendorCode} + {group.productCount - 1} товаров
</td>

// Add keyboard navigation
<tr
  className="detail-row"
  tabIndex={0}
  onKeyPress={(e) => e.key === 'Enter' && onProductClick?.(product.nmId)}
  onClick={() => onProductClick?.(product.nmId)}>
  {/* ... row content */}
</tr>
```

**Task 4: Visual Testing** (30 min)
- Test in Chrome, Firefox, Safari
- Test responsive breakpoints (320px, 768px, 1024px, 1920px)
- Test dark mode (defer to Story 37.6 post-MVP)
- Screenshot documentation

**Acceptance Criteria**:
- ✅ Rowspan cell styling matches design (background, border, centering)
- ✅ Aggregate row styling matches design (bold, gray background, 0.95rem)
- ✅ Detail row styling matches design (normal, white, 0.875rem, hover effect)
- ✅ Crown icon properly aligned with product name
- ✅ Responsive design works on mobile (<768px) with horizontal scroll
- ✅ Sticky columns work on mobile (Склейка + Артикул)
- ✅ WCAG 2.1 AA compliant (contrast ratios, keyboard navigation)

**Deliverables**:
- ✅ `MergedGroupTable.module.css` styles
- ✅ Responsive CSS for mobile
- ✅ ARIA labels for accessibility
- ✅ Visual testing screenshots

**Duration**: 2-3 hours

---

### Phase 3: Quality Assurance (Story 37.5 - Day 4)

#### Story 37.5: Testing & Documentation (Day 4)

**Effort**: 1-2 hours

**Tasks**:

**Task 1: Unit Tests** (30 min)
```typescript
// Already done in Stories 37.2-37.3
// Verify coverage ≥90%
npm run test:coverage -- --testPathPattern=MergedGroup
```

**Task 2: Integration Tests** (30 min)
```typescript
// File: frontend/src/app/(dashboard)/analytics/advertising/__tests__/page.integration.test.tsx

describe('Advertising Analytics - Epic 37 Integration', () => {
  it('switches to merged group view when group_by=imtId', async () => {
    render(<AdvertisingAnalyticsPage />);

    // Click "Группировка" button → select "По склейкам"
    const groupByButton = screen.getByRole('button', { name: /Группировка/ });
    fireEvent.click(groupByButton);
    const imtIdOption = screen.getByText('По склейкам');
    fireEvent.click(imtIdOption);

    // Verify merged group table rendered
    await waitFor(() => {
      expect(screen.getByText(/ГРУППА #328632/)).toBeInTheDocument();
      expect(screen.getByText(/👑 ter-09/)).toBeInTheDocument();
    });
  });

  it('displays aggregate metrics correctly', async () => {
    render(<AdvertisingAnalyticsPage />);
    // ... switch to group_by=imtId

    const aggregateRow = screen.getByText(/ГРУППА #328632/).closest('tr');
    expect(within(aggregateRow).getByText('35,570₽')).toBeInTheDocument(); // totalSales
    expect(within(aggregateRow).getByText('0.90')).toBeInTheDocument(); // ROAS
  });
});
```

**Task 3: Performance Testing** (30 min)
```typescript
// Test render performance with 50 groups
const largeDataset = generateMockGroups(50); // 50 groups × 5 products = 250 rows

const startTime = performance.now();
render(<MergedGroupTable groups={largeDataset} />);
const endTime = performance.now();

expect(endTime - startTime).toBeLessThan(200); // <200ms target
```

**Task 4: User Guide** (30 min)
```markdown
<!-- File: docs/user-guides/advertising-merged-groups.md -->

# Advertising Analytics: Склейки (Merged Groups)

## Что такое склейки?

Склейки — это группы товаров Wildberries с одинаковым `imtId` (ID карточки).
Wildberries объединяет несколько артикулов в одну карточку товара для покупателей.

**Пример**: Футболка разных размеров (S, M, L, XL) = 4 артикула, 1 склейка

## Как переключиться на режим склеек?

1. Откройте страницу "Advertising Analytics"
2. Нажмите кнопку "Группировка"
3. Выберите "По склейкам" (вместо "По артикулам")

## Как читать таблицу?

### 3-уровневая структура:

**Уровень 1: Индикатор склейки** (левая колонка с rowspan)
- Отображает: "главный_артикул + N товаров"
- Пример: "ter-09 + 5 товаров" (6 товаров в группе)

**Уровень 2: Агрегированная строка** (ГРУППА #imtId)
- Серый фон, жирный шрифт
- Показывает **суммы по всей склейке**
- Включает: Всего продаж, Из рекламы, Органика, Расход, ROAS

**Уровень 3: Детальные строки** (каждый товар)
- Белый фон, обычный шрифт
- Главный товар помечен 👑 (получает рекламный бюджет)
- Дочерние товары (без рекламы, spend=0)

## Главный vs Дочерний товар

**👑 Главный товар**:
- Получает рекламный бюджет (spend > 0)
- Обычно первый артикул в склейке
- Его реклама приводит к продажам всех товаров в группе

**Дочерние товары**:
- Не получают рекламный бюджет (spend = 0)
- Продаются за счёт рекламы главного товара
- ROAS/ROI показывает "—" (н/д)
```

**Acceptance Criteria**:
- ✅ Unit test coverage ≥90%
- ✅ Integration tests pass
- ✅ Performance test passes (<200ms for 50 groups)
- ✅ User guide created and reviewed
- ✅ Mixpanel events tracked (`advertising_group_view`, `advertising_product_clicked`)
- ✅ UAT with 3 internal users (≥90% satisfaction, <5 questions)

**Deliverables**:
- ✅ Test coverage report
- ✅ Performance benchmark results
- ✅ User guide documentation
- ✅ UAT feedback summary

**Duration**: 1-2 hours

---

## 🔄 Integration with Backend API

### Transition Plan: Mock → Production API

**Current State** (Development Phase):
```typescript
// frontend/src/app/(dashboard)/analytics/advertising/page.tsx

const USE_REAL_API = process.env.NEXT_PUBLIC_EPIC_37_USE_REAL_API === 'true';

async function fetchAdvertisingData(groupBy: GroupByMode) {
  if (!USE_REAL_API) {
    // Use mock data during development
    return groupBy === 'imtId'
      ? mockMergedGroups
      : mockSkuData;
  }

  // Production API call
  const response = await fetch(`/api/v1/analytics/advertising?group_by=${groupBy}`);
  return response.json();
}
```

**After Story 37.0 Complete** (Backend Ready):
1. Backend team notifies frontend: "Story 37.0 COMPLETE"
2. Frontend executes **Story 37.1** (API Validation)
3. If validation PASS:
   - Set `NEXT_PUBLIC_EPIC_37_USE_REAL_API=true` in `.env.local`
   - Test integration with real API
   - Remove mock data after successful testing
4. If validation FAIL:
   - Report issues to backend team
   - Stay on mock data until fixes deployed

---

## 📅 Timeline & Dependencies

### Critical Path

```
Day 0 (Today - 2025-12-29):
├── Phase 0: Preparation (1.5h)
│   ├── Create mock data structure ✅
│   ├── Add feature flags ✅
│   └── Update TypeScript types ✅

Day 1 (2025-12-30):
├── Story 37.2: MergedGroupTable Component (3-4h) 🚀 START IMMEDIATELY
│   ├── Component structure ✅
│   ├── Rowspan logic ✅
│   ├── Standalone products ✅
│   └── Unit tests ✅

Day 2 (2025-12-31):
├── Story 37.3: Aggregate Metrics (2-3h)
│   ├── Calculation functions ✅
│   ├── Percentage displays ✅
│   ├── Edge cases ✅
│   └── Unit tests ✅

Day 3 (2026-01-02):
├── Story 37.4: Visual Styling (2-3h)
│   ├── CSS design tokens ✅
│   ├── Responsive design ✅
│   ├── Accessibility ✅
│   └── Visual testing ✅
├── 🔔 Backend Story 37.0 COMPLETE (expected)
└── Story 37.1: API Validation (1-2h) ⏳ UNBLOCKED
    ├── Execute API requests ✅
    ├── Validate structure ✅
    ├── Data integrity checks ✅
    └── Document findings ✅

Day 4 (2026-01-03):
├── Story 37.5: Testing & Docs (1-2h)
│   ├── Unit tests review ✅
│   ├── Integration tests ✅
│   ├── Performance testing ✅
│   ├── User guide ✅
│   └── UAT preparation ✅
└── 🔀 Switch to Production API
    ├── Set EPIC_37_USE_REAL_API=true
    ├── Test integration
    └── Remove mock data

Day 5-6 (2026-01-04 to 2026-01-05):
└── UAT & Bug Fixes
    ├── 3 internal users testing
    ├── Collect feedback
    ├── Fix critical bugs
    └── Performance optimization

Day 7 (2026-01-06):
└── 🎉 Epic 37 COMPLETE
    ├── All stories marked DONE
    ├── Production deployment
    └── PO sign-off
```

### Dependency Matrix

| Story | Blocked By | Can Start | Uses Mock Data |
|-------|-----------|-----------|----------------|
| **37.1** | Story 37.0 (Backend) | After 2026-01-02 | ❌ No (real API) |
| **37.2** | None | ✅ Immediately | ✅ Yes |
| **37.3** | Story 37.2 | Day 2 | ✅ Yes |
| **37.4** | Story 37.3 | Day 3 | ✅ Yes |
| **37.5** | Stories 37.2-37.4 | Day 4 | ⚠️ Both (mock + real) |

---

## 🎯 Success Criteria

### Technical Success
- ✅ All 5 stories pass Definition of Done
- ✅ Unit test coverage ≥90%
- ✅ Integration tests pass
- ✅ Performance <200ms render for 50 groups
- ✅ WCAG 2.1 AA compliance (zero violations)
- ✅ Zero TypeScript errors
- ✅ Zero ESLint warnings

### User Success
- ✅ 3 internal users complete UAT
- ✅ ≥90% satisfaction score
- ✅ <5 interpretation questions during UAT
- ✅ Zero critical bugs in first week production

### Business Success
- ✅ Feature flag enabled in production
- ✅ Mixpanel events tracking operational
- ✅ PO sign-off received
- ✅ User guide published

---

## 🚨 Risk Mitigation

### Risk 1: Backend API Delay
**Probability**: Medium
**Impact**: High (blocks Story 37.1)
**Mitigation**:
- ✅ Use mock data for Stories 37.2-37.5 (no blocker)
- ✅ Feature flag allows parallel development
- ✅ Daily sync with backend team on Story 37.0 progress

### Risk 2: API Structure Mismatch
**Probability**: Low (already validated in Request #88)
**Impact**: High (requires rework)
**Mitigation**:
- ✅ TypeScript types match Request #88 exactly
- ✅ Story 37.1 validation BEFORE integration
- ✅ Mock data matches expected structure

### Risk 3: Performance Issues
**Probability**: Low
**Impact**: Medium
**Mitigation**:
- ✅ Performance testing in Story 37.5
- ✅ Lazy loading for large groups (post-MVP)
- ✅ Virtual scrolling if needed (Story 37.6)

### Risk 4: UX Confusion
**Probability**: Medium
**Impact**: Medium
**Mitigation**:
- ✅ User guide in Story 37.5
- ✅ Tooltips on aggregate row
- ✅ UAT with 3 internal users
- ✅ Clear visual hierarchy

---

## 📊 Progress Tracking

### Story Completion Checklist

- [ ] **Phase 0: Preparation** (1.5h)
  - [ ] Mock data created
  - [ ] Feature flags configured
  - [ ] TypeScript types updated

- [ ] **Story 37.2: MergedGroupTable** (3-4h)
  - [ ] Component structure complete
  - [ ] Rowspan logic implemented
  - [ ] Standalone products handled
  - [ ] Unit tests pass

- [ ] **Story 37.3: Aggregate Metrics** (2-3h)
  - [ ] Calculations implemented
  - [ ] Percentage displays work
  - [ ] Edge cases handled
  - [ ] Unit tests pass

- [ ] **Story 37.4: Visual Styling** (2-3h)
  - [ ] CSS design tokens applied
  - [ ] Responsive design works
  - [ ] Accessibility compliant
  - [ ] Visual testing complete

- [ ] **Story 37.1: API Validation** (1-2h) ⏳ BLOCKED
  - [ ] Backend Story 37.0 complete
  - [ ] API tested
  - [ ] Structure validated
  - [ ] Integration successful

- [ ] **Story 37.5: Testing & Docs** (1-2h)
  - [ ] Unit tests ≥90% coverage
  - [ ] Integration tests pass
  - [ ] Performance tests pass
  - [ ] User guide published
  - [ ] UAT complete

---

## 📚 References

### Epic Documentation
- **Epic 37 Main**: `docs/epics/epic-37-merged-group-table-display.md`
- **Request #88**: `frontend/docs/request-backend/88-epic-37-individual-product-metrics.md`

### Story Files
- **Story 37.1**: `docs/stories/epic-37/story-37.1-backend-api-validation.BMAD.md`
- **Story 37.2**: `docs/stories/epic-37/story-37.2-merged-group-table-component.BMAD.md`
- **Story 37.3**: `docs/stories/epic-37/story-37.3-aggregate-metrics-display.BMAD.md`
- **Story 37.4**: `docs/stories/epic-37/story-37.4-visual-styling-hierarchy.BMAD.md`
- **Story 37.5**: `docs/stories/epic-37/story-37.5-testing-documentation.BMAD.md`

### Implementation Context
- **Integration Point**: `frontend/src/app/(dashboard)/analytics/advertising/page.tsx`
- **Mock Data**: `frontend/src/mocks/data/epic-37-merged-groups.ts`
- **Types**: `frontend/src/types/advertising-analytics.ts`

---

**Plan Created**: 2025-12-29
**Plan Owner**: Frontend Dev Team
**Next Review**: Daily standup (track Story 37.0 backend progress)
