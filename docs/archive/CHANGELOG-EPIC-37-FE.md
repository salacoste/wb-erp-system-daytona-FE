# CHANGELOG - Epic 37: Merged Group Table Display (Склейки)

**Epic Status**: 📋 Ready for Development
**PO Approval**: ✅ 9.2/10 (2025-12-29)
**Stories**: 5 BMad template stories
**Estimated Effort**: 9-14 hours
**Dependencies**: Epic 36 (imtId field) ✅ COMPLETE, Epic 35 (metrics) ✅ COMPLETE

---

## Overview

Epic 37 introduces a **3-tier rowspan table display** for merged product groups (склейки) in advertising analytics. This feature allows users to view and analyze advertising performance for product groups linked by WB's `imtId` field (Epic 36), enabling comprehensive ROAS/ROI analysis at both group and individual product levels.

**Business Value**:

- **100% advertising coverage** - No more "No data" for products with spend=0 but revenue>0
- **Group-level ROAS** - Understand performance of entire product card mergers
- **Visual clarity** - Crown icon (👑) identifies main products receiving ad budget
- **Strategic decisions** - Compare spend distribution across children vs main products

---

## Architecture

### 3-Tier Rowspan Table Structure

```
┌─────────────────────────────────────────────────────────────────────┐
│ Tier 1: ROWSPAN CELL (spans N+1 rows)                              │
│ ├─ Main Product nmId: ter-09 (👑)                                  │
│ ├─ Product Count: 6 товаров                                        │
│ └─ imtId: 328632                                                    │
├─────────────────────────────────────────────────────────────────────┤
│ Tier 2: AGGREGATE ROW (gray background, bold text)                 │
│ ГРУППА #328632 | 35,570₽ | 10,234₽ (29%) | 25,336₽ | 11,337₽ | 0.90│
├─────────────────────────────────────────────────────────────────────┤
│ Tier 3: DETAIL ROWS (white background, hover effect)               │
│ ter-09 👑 | 15,000₽ | 4,000₽ | 11,000₽ | 6,000₽ | 0.67            │
│ ter-10   | 1,489₽  | 400₽    | 1,089₽  | 0₽      | —               │
│ ter-11   | 8,500₽  | 2,300₽  | 6,200₽  | 0₽      | —               │
│ (3 more detail rows...)                                             │
└─────────────────────────────────────────────────────────────────────┘
```

### Column Definitions

| Column           | Description                              | Source                                    |
| ---------------- | ---------------------------------------- | ----------------------------------------- |
| **Склейка**      | Rowspan cell with main product info      | Epic 36: `imtId`, `main_product`          |
| **Артикул**      | Product nmId with crown icon for main    | Epic 35: `nmId`, `isMainProduct`          |
| **Всего продаж** | Total revenue (organic + ad)             | Epic 35: `totalSales`                     |
| **Из рекламы**   | Ad-attributed revenue + percentage       | Epic 35: `revenue`, `organicContribution` |
| **Органика**     | Non-ad revenue                           | Epic 35: `organicSales`                   |
| **Расход**       | Ad spend (only main product has >0)      | Epic 35: `spend`                          |
| **ROAS**         | Revenue / Spend (can be null if spend=0) | Epic 35: `roas`                           |

---

## Stories Breakdown

### Story 37.1: Backend API Validation (1-2h) ✅ READY

**File**: `story-37.1-backend-api-validation.BMAD.md`
**Acceptance Criteria**: 15 (includes 4 PO decisions)
**Tasks**: 6 validation tasks

**Purpose**: Validate backend API structure before component development.

**Key Validations**:

- ✅ API endpoint `/v1/analytics/advertising?group_by=imtId` returns 200
- ✅ Epic 36 `imtId` field present in all products
- ✅ Epic 35 aggregate metrics (totalSales, revenue, organicSales, ROAS) correct
- ✅ Main product identification (`isMainProduct: true`)
- ✅ Edge cases handled (zero spend, negative revenue, single-product groups)

**PO Decisions**:

- Group size: Min 2, Max 50 products (no pagination)
- Sort within group: Main first, children by totalSales DESC
- Standalone products (imtId=null): Include as single rows
- Edge cases: Zero spend "—", negative revenue red, missing "—"

---

### Story 37.2: MergedGroupTable Component (3-4h) ✅ READY

**File**: `story-37.2-merged-group-table-component.BMAD.md`
**Acceptance Criteria**: 20 (includes 4 PO decisions)
**Tasks**: 8 component creation tasks

**Purpose**: Create core React component with 3-tier rowspan architecture.

**Component API**:

```typescript
interface MergedGroupTableProps {
  groups: AdvertisingGroup[];
  sortConfig?: { field: SortField; direction: 'asc' | 'desc' };
  onSort?: (field: SortField) => void;
  onProductClick?: (nmId: string) => void;
}
```

**PO Decisions**:

- Component API: Draft interface approved (see above)
- Single-product groups: NO rowspan cell (renders as standard row)
- Missing main product: Use highest totalSales fallback
- Large groups >20: Show all products, monitor performance

---

### Story 37.3: Aggregate Metrics Display (2-3h) ✅ READY

**File**: `story-37.3-aggregate-metrics-display.BMAD.md`
**Acceptance Criteria**: 21 (includes 3 PO decisions)
**Tasks**: 6 calculation & formatting tasks

**Purpose**: Implement Epic 35 calculation formulas for aggregate metrics.

**Key Formulas**:

```typescript
const totalSales = products.reduce((sum, p) => sum + p.totalSales, 0);
const revenue = products.reduce((sum, p) => sum + p.revenue, 0);
const organicSales = totalSales - revenue;
const organicContribution = (organicSales / totalSales) * 100;
const spend = products.reduce((sum, p) => sum + p.spend, 0);
const roas = spend > 0 ? revenue / spend : null;
```

**PO Decisions**:

- Rounding: Math.round() (banker's rounding), NO abbreviations for large numbers
- Tooltips: Aggregate "Сумма всех товаров", ROAS "Доход с рекламы / Расход"
- Color-coding for ROAS: Deferred to post-MVP (Story 37.6)

---

### Story 37.4: Visual Styling & Hierarchy (2-3h) ✅ READY

**File**: `story-37.4-visual-styling-hierarchy.BMAD.md`
**Acceptance Criteria**: 26 (includes 5 PO decisions)
**Tasks**: 7 styling & responsive design tasks

**Purpose**: Define visual design tokens and responsive behavior.

**Design Tokens (Tailwind CSS)**:

```typescript
const designTokens = {
  rowspan: {
    background: 'bg-gray-50',      // #FAFAFA
    border: 'border-gray-200',     // #E5E7EB
    text: 'text-gray-600',         // #6B7280
  },
  aggregate: {
    background: 'bg-gray-100',     // #F3F4F6
    text: 'text-gray-900',         // #111827
    border: 'border-gray-200',
  },
  detail: {
    background: 'bg-white',
    text: 'text-gray-700',
    hoverBg: 'bg-gray-50',
  },
  crown: {
    color: 'text-yellow-600',      // #CA8A04
  },
};
```

**PO Decisions**:

- Aggregate row hover: NO effect (not clickable in MVP)
- Detail rows: YES hover (bg-gray-50 + cursor-pointer)
- No active/selected state needed for MVP
- No zebra striping (all detail rows white)
- Mobile sticky columns: Склейка + Артикул remain visible on scroll
- Dark mode: NOT supported in MVP (defer to Story 37.6)

---

### Story 37.5: Testing & Documentation (1-2h) ✅ READY

**File**: `story-37.5-testing-documentation.BMAD.md`
**Acceptance Criteria**: 25 (includes 6 PO decisions)
**Tasks**: 8 testing & documentation tasks

**Purpose**: Comprehensive testing strategy and user documentation.

**Test Coverage Requirements**:

- **Unit tests**: ≥90% code coverage
- **E2E tests**: Playwright - all critical user flows
- **Accessibility**: Zero WCAG 2.1 AA violations (axe-core)
- **Performance**: <200ms render for 50 groups (6x CPU throttling)
- **UAT**: 3 internal users, ≥90% satisfaction, <5 interpretation questions

**PO Decisions**:

- User guide: Template approved (What are склейки, How to view, Reading table)
- Performance test: REQUIRED (<200ms for 50 groups)
- UAT: REQUIRED (3 users, ≥90% satisfaction)
- Analytics tracking: REQUIRED (Mixpanel events)
- Storybook: NOT required for MVP
- Visual regression: NOT required (manual QA sufficient)

---

## Technical Specifications

### Framework & Libraries

- **React 18** - Server components by default, client components where needed
- **TypeScript** - Strict mode, no `any` types
- **Tailwind CSS** - Design tokens from Story 37.4
- **Lucide Icons** - Crown icon for main products

### Testing Stack

- **Jest** - Unit tests with React Testing Library
- **Playwright** - E2E tests for user workflows
- **axe-core** - Accessibility testing (WCAG 2.1 AA)
- **Chrome DevTools** - Performance testing with 6x CPU throttling

### Analytics Integration

- **Mixpanel** - Track user interactions:
  - `advertising_group_view` - When user clicks "По склейкам" toggle
  - `advertising_product_clicked` - When user clicks detail row

### Performance Budgets

- **Render Time**: <200ms for 50 groups (6x CPU slowdown)
- **Bundle Size**: Defer to global project limits
- **Memory**: Monitor for large groups (>20 products)

---

## Quality Gates

### Definition of Done (All Stories)

- ✅ All acceptance criteria met
- ✅ Unit tests pass with ≥90% coverage
- ✅ E2E tests pass (all scenarios)
- ✅ Accessibility tests pass (zero violations)
- ✅ Performance test passes (<200ms)
- ✅ Code reviewed and approved
- ✅ User guide documented
- ✅ Analytics events tracking

### UAT Criteria (Story 37.5)

- ✅ 3 internal finance users complete UAT
- ✅ Average satisfaction ≥9/10
- ✅ Total interpretation questions <5
- ✅ All critical user flows successful

---

## Dependencies

### Backend Dependencies (✅ All Complete)

- **Epic 36**: Product Card Linking (imtId field in products table) ✅ COMPLETE
  - Backend production ready (2025-12-28)
  - Daily sync of imtID from WB Content API (06:00 MSK)
  - `groupBy=imtId` parameter implemented
- **Epic 35**: Total Sales & Organic Split (aggregate metrics) ✅ COMPLETE
  - Hybrid query combining weekly + daily data
  - Fields: totalSales, revenue, organicSales, ROAS

### Frontend Prerequisites

- React 18, TypeScript, Tailwind CSS (all present)
- Lucide Icons library (installed)
- Jest + React Testing Library (configured)
- Playwright (configured)
- axe-core (need to install: `npm install -D jest-axe`)
- Mixpanel (need to verify: `npm install mixpanel-browser`)

---

## File Structure (Expected)

```
frontend/src/
├── app/(dashboard)/analytics/advertising/
│   ├── components/
│   │   ├── MergedGroupTable.tsx              # Story 37.2 - Main component
│   │   ├── MergedGroupTable.test.tsx         # Story 37.5 - Unit tests
│   │   ├── MergedGroupRows.tsx               # Story 37.2 - Rowspan logic
│   │   └── ProductRowBadge.tsx               # Story 37.2 - Crown icon
│   ├── utils/
│   │   ├── metrics-calculator.ts             # Story 37.3 - Formulas
│   │   ├── formatters.ts                     # Story 37.3 - Formatting
│   │   └── metrics-calculator.test.ts        # Story 37.5 - Formula tests
│   └── page.tsx                              # Story 37.2 - Integration
├── e2e/
│   └── advertising-analytics-merged-groups.spec.ts  # Story 37.5 - E2E tests
└── docs/
    ├── stories/epic-37/
    │   ├── story-37.1-backend-api-validation.BMAD.md
    │   ├── story-37.2-merged-group-table-component.BMAD.md
    │   ├── story-37.3-aggregate-metrics-display.BMAD.md
    │   ├── story-37.4-visual-styling-hierarchy.BMAD.md
    │   ├── story-37.5-testing-documentation.BMAD.md
    │   ├── PO-VALIDATION-REPORT-EPIC-37.md
    │   ├── CONVERSION-COMPLETE.md
    │   └── archive/                          # Original guide-format stories
    └── epics/
        └── epic-37-merged-group-table-display.md
```

---

## Development Workflow (Recommended)

### Phase 1: API Validation (Story 37.1) - 1-2h

1. Validate backend API endpoint structure
2. Verify Epic 36 imtId field presence
3. Verify Epic 35 aggregate metrics
4. Document any edge cases found
5. Create API response sample JSON

### Phase 2: Component Development (Stories 37.2-37.4) - 7-10h

1. **Story 37.2**: Build MergedGroupTable component (3-4h)
   - Implement 3-tier rowspan logic
   - Create sub-components (MergedGroupRows, ProductRowBadge)
   - Handle single-product groups
2. **Story 37.3**: Add aggregate metrics calculations (2-3h)
   - Implement 6 Epic 35 formulas
   - Create formatting utilities
   - Add tooltips
3. **Story 37.4**: Apply visual styling (2-3h)
   - Implement design tokens
   - Add responsive behavior
   - Sticky columns for mobile/tablet

### Phase 3: Testing & Documentation (Story 37.5) - 1-2h

1. Write unit tests (≥90% coverage)
2. Write E2E tests (Playwright)
3. Run accessibility tests (axe-core)
4. Perform performance testing (Chrome DevTools)
5. Write user guide section in README
6. Capture screenshots for documentation
7. Conduct UAT with 3 internal users

---

## Known Limitations & Future Enhancements (Post-MVP)

### Story 37.6: Post-MVP Enhancements (Backlog)

**8 features deferred to future sprints**:

1. Color-coding for ROAS tiers (green/yellow/red)
2. Expandable/collapsible groups (progressive disclosure)
3. Dark mode support
4. Visual regression testing (Percy/Chromatic)
5. Storybook stories for component library
6. Advanced filtering (by ROAS range, product count)
7. Drill-down into individual product campaigns
8. Export склейки table to Excel/CSV

---

## References

### Documentation

- **Epic Overview**: `docs/epics/epic-37-merged-group-table-display.md`
- **PO Validation Report**: `docs/stories/epic-37/PO-VALIDATION-REPORT-EPIC-37.md`
- **Conversion Notes**: `docs/stories/epic-37/CONVERSION-COMPLETE.md`

### Dependencies

- **Epic 36**: `docs/epics/epic-36-product-card-linking.md`
- **Epic 35**: `docs/stories/epic-35/` (Stories 35.1-35.7)

### Backend API

- Endpoint: `GET /v1/analytics/advertising?group_by=imtId`
- Response format documented in Story 37.1

---

## BMad Framework Compliance

**Template Version**: story-tmpl.yaml v2.0
**Quality Score**: 9.2/10 (after BMad conversion)
**Template Compliance**: 10/10

All 5 stories follow BMad template structure:

- ✅ Status field
- ✅ User story format (As a... I want... so that...)
- ✅ Numbered acceptance criteria with PO decisions
- ✅ Tasks/Subtasks breakdown
- ✅ Dev Notes with Testing subsection
- ✅ Change Log
- ✅ Dev Agent Record placeholder
- ✅ QA Results placeholder

---

## Next Steps

### Immediate (PO Tasks)

1. ✅ **COMPLETE**: Epic validated and converted to BMad format
2. ✅ **COMPLETE**: All 26 PO decisions filled
3. ✅ **COMPLETE**: Stories converted to BMad template
4. 📋 **TODO**: Assign frontend developer to Epic 37
5. 📋 **TODO**: Schedule 30-min kickoff meeting
6. 📋 **TODO**: Share PO validation report with team

### Developer Tasks (Once Assigned)

1. Read Epic 37 main document
2. Read Stories 37.1-37.5 in sequence (.BMAD.md files)
3. Start Story 37.1 (Backend API Validation) - 1-2h
4. Proceed through Stories 37.2-37.5 sequentially
5. Update Dev Agent Record sections as you work
6. Mark todo items in tasks as complete

### QA Tasks (After Each Story)

1. Validate story completion (all ACs passed)
2. Fill QA Results section
3. Update story status: Draft → InProgress → Review → Done

---

**Created**: 2025-12-29
**Last Updated**: 2025-12-29
**Product Owner**: Sarah (BMad PO Agent)
**Status**: ✅ PO Approved - Ready for Development
**Approval Date**: 2025-12-29
**Quality Score**: 9.2/10
