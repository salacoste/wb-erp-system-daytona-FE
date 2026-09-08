# Epic 37: Merged Group Table Display (Склейки)

**Status**: ✅ **100% COMPLETE** - Production Ready (2025-01-17)
**Priority**: P1 - High Impact Feature ✅ DELIVERED
**Epic Type**: Frontend Enhancement
**Product Owner**: Sarah (BMad PO Agent)
**Quality Score**: 9.2/10 ⭐⭐⭐⭐ (QA Phase 2 Complete)
**Actual Effort**: 14 hours (6 stories including 37.7)
**Completion Date**: 2025-01-17

---

## 📊 Executive Summary

**Business Problem**:
After implementing Epic 36 (Product Card Linking), users can now analyze advertising performance by merged product groups (склейки). However, the current advertising analytics page displays only aggregate-level metrics for each group. Users need to see **both group-level AND individual product-level metrics** in a single table to:

- Identify which products within a group drive organic sales
- Understand spend distribution (main product vs children)
- Make data-driven decisions about budget allocation within groups

**Solution**:
3-tier rowspan table architecture that displays:

- **Tier 1 (Rowspan Cell)**: Group identifier with main product nmId and product count
- **Tier 2 (Aggregate Row)**: Group-level totals (totalSales, revenue, ROAS) - Epic 35 integration
- **Tier 3 (Detail Rows)**: Individual product metrics with crown icon (👑) for main products

**Business Value**:

- **Complete visibility** into merged group performance
- **Strategic insights** - Compare main vs child product contributions
- **Budget optimization** - Identify underperforming main products
- **Data-driven decisions** - Allocate spend based on group-level ROI

---

## 🎯 Goals & Success Metrics

### Primary Goals

1. **Visual Clarity**: Users can distinguish group-level vs product-level metrics at a glance
2. **Complete Data**: Display all Epic 35 metrics (totalSales, revenue, organicSales, ROAS) at both levels
3. **User Experience**: Responsive, accessible, performant table for desktop/tablet/mobile
4. **Quality Assurance**: ≥90% test coverage, WCAG 2.1 AA compliance, <200ms render time

### Success Metrics

- **Adoption**: ≥70% of advertising analytics users toggle to "По склейкам" view weekly
- **User Satisfaction**: UAT score ≥9/10 (3 internal finance users)
- **Performance**: p95 render time <200ms for 50 groups with 6x CPU throttling
- **Quality**: Zero WCAG 2.1 AA violations, ≥90% unit test coverage
- **Interpretation Clarity**: <5 questions asked during UAT sessions

---

## 🏗️ Architecture

### 3-Tier Rowspan Table Structure

```
┌─────────────────┬────────────┬───────────┬────────────┬──────────┬─────────┬────────┐
│ TIER 1:         │ TIER 2 & 3 COLUMNS (Aggregate + Detail Rows)                    │
│ ROWSPAN CELL    ├────────────┼───────────┼────────────┼──────────┼─────────┼────────┤
│                 │ Артикул    │ Всего     │ Из         │ Органика │ Расход  │ ROAS   │
│                 │            │ продаж    │ рекламы    │          │         │        │
├─────────────────┼────────────┼───────────┼────────────┼──────────┼─────────┼────────┤
│ 👑 ter-09       │ TIER 2:    │           │            │          │         │        │
│ 6 товаров       │ ГРУППА     │ 35,570₽   │ 10,234₽    │ 25,336₽  │ 11,337₽ │ 0.90   │
│ imtId: 328632   │ #328632    │           │ (29%)      │          │         │        │
│                 ├────────────┼───────────┼────────────┼──────────┼─────────┼────────┤
│                 │ TIER 3:    │           │            │          │         │        │
│                 │ 👑 ter-09  │ 15,000₽   │ 4,000₽     │ 11,000₽  │ 6,000₽  │ 0.67   │
│                 │ ter-10     │ 1,489₽    │ 400₽       │ 1,089₽   │ 0₽      │ —      │
│                 │ ter-11     │ 8,500₽    │ 2,300₽     │ 6,200₽   │ 0₽      │ —      │
│                 │ ter-12     │ 5,200₽    │ 1,500₽     │ 3,700₽   │ 0₽      │ —      │
│                 │ ter-13     │ 3,100₽    │ 1,034₽     │ 2,066₽   │ 0₽      │ —      │
│                 │ ter-14     │ 2,281₽    │ 1,000₽     │ 1,281₽   │ 0₽      │ —      │
└─────────────────┴────────────┴───────────┴────────────┴──────────┴─────────┴────────┘
```

### Visual Hierarchy

**Tier 1 (Rowspan Cell)**:

- **Background**: `bg-gray-50` (#FAFAFA)
- **Border**: Right border 2px solid gray-200
- **Content**: Main product nmId (👑), product count, imtId
- **Spans**: N+1 rows (1 aggregate + N detail rows)

**Tier 2 (Aggregate Row)**:

- **Background**: `bg-gray-100` (#F3F4F6)
- **Typography**: Font-weight 600 (semibold), size 15.2px, color gray-900
- **Content**: "ГРУППА #imtId" + summed metrics from all products

**Tier 3 (Detail Rows)**:

- **Background**: `bg-white` (hover: `bg-gray-50`)
- **Typography**: Font-weight 400 (normal), size 14px, color gray-700
- **Content**: Individual product metrics with crown icon (👑) for main product

---

## 📋 Stories Breakdown

### Story 37.1: Backend API Validation (1-2h)

**File**: `story-37.1-backend-api-validation.BMAD.md`
**Acceptance Criteria**: 15 (includes 4 PO decisions)
**Tasks**: 6 validation tasks

**Purpose**: Validate backend API structure before component development.

**Key Validations**:

- API endpoint returns 200 with correct structure
- Epic 36 imtId field present
- Epic 35 aggregate metrics correct
- Data integrity (aggregate = SUM(products))
- Edge cases handled (zero spend, negative revenue)

---

### Story 37.2: MergedGroupTable Component (3-4h)

**File**: `story-37.2-merged-group-table-component.BMAD.md`
**Acceptance Criteria**: 20 (includes 4 PO decisions)
**Tasks**: 8 component creation tasks

**Purpose**: Core React component with 3-tier rowspan architecture.

**Component API**:

```typescript
interface MergedGroupTableProps {
  groups: AdvertisingGroup[];
  sortConfig?: { field: SortField; direction: 'asc' | 'desc' };
  onSort?: (field: SortField) => void;
  onProductClick?: (nmId: string) => void;
}
```

**Key Features**:

- Rowspan cell spanning N+1 rows
- Crown icon (👑) for main products
- Clickable detail rows
- Single-product groups handled (no rowspan)

---

### Story 37.3: Aggregate Metrics Display (2-3h)

**File**: `story-37.3-aggregate-metrics-display.BMAD.md`
**Acceptance Criteria**: 21 (includes 3 PO decisions)
**Tasks**: 6 calculation & formatting tasks

**Purpose**: Implement Epic 35 calculation formulas.

**Key Formulas** (Epic 35 Integration):

```typescript
const totalSales = products.reduce((sum, p) => sum + p.totalSales, 0);
const revenue = products.reduce((sum, p) => sum + p.revenue, 0);
const organicSales = totalSales - revenue;
const organicContribution = (organicSales / totalSales) * 100;
const spend = products.reduce((sum, p) => sum + p.spend, 0);
const roas = spend > 0 ? revenue / spend : null;
```

**Formatting**:

- Currency: Russian locale with ₽ symbol (e.g., "35,570₽")
- Percentages: 1 decimal place (e.g., "71.2%")
- ROAS: 2 decimal places (e.g., "0.90"), null displays "—"

---

### Story 37.4: Visual Styling & Hierarchy (2-3h)

**File**: `story-37.4-visual-styling-hierarchy.BMAD.md`
**Acceptance Criteria**: 26 (includes 5 PO decisions)
**Tasks**: 7 styling & responsive design tasks

**Purpose**: Define visual design tokens and responsive behavior.

**Design Tokens**:

```typescript
const rowspan = 'bg-gray-50 border-r-2 border-gray-200 text-gray-600 text-center align-middle';
const aggregate = 'bg-gray-100 font-semibold text-[0.95rem] text-gray-900';
const detail = 'bg-white hover:bg-gray-50 cursor-pointer text-sm text-gray-700';
const crown = 'inline h-4 w-4 text-yellow-600 mr-1';
```

**Responsive Breakpoints**:

- **Desktop (≥1024px)**: Full width, no scroll
- **Tablet (768-1023px)**: Horizontal scroll, sticky Склейка + Артикул columns
- **Mobile (<768px)**: Horizontal scroll, min column width 200px

---

### Story 37.5: Testing & Documentation (1-2h)

**File**: `story-37.5-testing-documentation.BMAD.md`
**Acceptance Criteria**: 25 (includes 6 PO decisions)
**Tasks**: 8 testing & documentation tasks

**Purpose**: Comprehensive testing strategy and user documentation.

**Test Coverage**:

- **Unit tests**: ≥90% coverage (Jest + React Testing Library)
- **E2E tests**: All critical user flows (Playwright)
- **Accessibility**: Zero WCAG 2.1 AA violations (axe-core)
- **Performance**: <200ms render for 50 groups (Chrome DevTools, 6x CPU throttling)
- **UAT**: 3 internal users, ≥90% satisfaction

**Mixpanel Events**:

- `advertising_group_view` - User toggles to "По склейкам" mode
- `advertising_product_clicked` - User clicks detail row

---

## 🔗 Dependencies

### Epic 36: Product Card Linking (imtId) ✅ COMPLETE

**Status**: Backend production ready (2025-12-28)
**Provides**:

- `imtId` field in `products` table
- Daily sync from WB Content API (06:00 MSK)
- `groupBy=imtId` parameter in advertising analytics API
- Main product identification logic

**Documentation**: `docs/epics/epic-36-product-card-linking.md`

### Epic 35: Total Sales & Organic Split ✅ COMPLETE

**Status**: Production ready
**Provides**:

- `totalSales` field (total revenue: organic + advertising)
- `revenue` field (ad-attributed sales)
- `organicSales` field (totalSales - revenue)
- `organicContribution` percentage calculation
- Hybrid query performance (17-37ms p95)

**Documentation**: `docs/stories/epic-35/` (Stories 35.1-35.7)

---

## 📊 PO Decisions Summary (26 Total)

### Story 37.1: Backend API (4 decisions)

1. ✅ Group size: Min 2, Max 50, no pagination
2. ✅ Sort within group: Main first, children by totalSales DESC
3. ✅ Standalone products (imtId=null): Include as single rows
4. ✅ Edge cases: Zero spend "—", negative revenue red, missing "—"

### Story 37.2: Component (4 decisions)

5. ✅ Component API: Draft interface approved
6. ✅ Single-product groups: NO rowspan cell
7. ✅ Missing main product: Use highest totalSales fallback
8. ✅ Large groups >20: Show all, monitor performance

### Story 37.3: Metrics (3 decisions)

9. ✅ Rounding: Math.round(), NO abbreviations
10. ✅ Tooltips: Aggregate "Сумма всех товаров", ROAS "Доход с рекламы / Расход"
11. ✅ Color-coding: Deferred to Story 37.6 (post-MVP)

### Story 37.4: Styling (5 decisions)

12. ✅ Hover: Aggregate NO, Detail YES (bg-gray-50)
13. ✅ States: No active/selected, no zebra striping
14. ✅ Mobile: Horizontal scroll + sticky columns
15. ✅ Dark mode: NOT supported in MVP
16. ✅ Responsive: Sticky Склейка + Артикул on scroll

### Story 37.5: Testing (6 decisions)

17. ✅ User guide: Template approved
18. ✅ Performance test: REQUIRED <200ms for 50 groups
19. ✅ UAT: REQUIRED 3 users, ≥90% satisfaction
20. ✅ Analytics: REQUIRED Mixpanel events
21. ✅ Storybook: NOT required for MVP
22. ✅ Visual regression: NOT required (manual QA sufficient)

### Epic Architecture (2 decisions)

23. ✅ Progressive disclosure: Always expanded (Option A)
24. ✅ Sorting behavior: Sort by aggregate ROAS (Option A)

### Additional (2 decisions)

25. ✅ Template format: BMad story-tmpl.yaml v2.0
26. ✅ Post-MVP enhancements: Story 37.6 created (8 features backlogged)

---

## 🚀 Implementation Roadmap

### Phase 1: API Validation (Story 37.1) - Day 1 Morning (1-2h)

**Deliverable**: Validated API structure, sample response JSON

- Verify backend API endpoint structure
- Test Epic 35 & Epic 36 field integration
- Document edge cases
- Create API response sample

### Phase 2: Component Development (Stories 37.2-37.4) - Day 1-2 (7-10h)

**Deliverable**: Working MergedGroupTable component with styling

**Story 37.2** (3-4h):

- Create MergedGroupTable React component
- Implement 3-tier rowspan logic
- Add crown icon for main products
- Handle single-product groups

**Story 37.3** (2-3h):

- Implement Epic 35 calculation formulas
- Create formatting utilities (currency, percentage, ROAS)
- Add tooltips for aggregate metrics
- Handle edge cases (zero spend, negative revenue)

**Story 37.4** (2-3h):

- Apply Tailwind CSS design tokens
- Implement responsive behavior (desktop/tablet/mobile)
- Add sticky columns for horizontal scroll
- Verify WCAG 2.1 AA contrast ratios

### Phase 3: Testing & Documentation (Story 37.5) - Day 2-3 (1-2h)

**Deliverable**: Comprehensive test suite, user guide, UAT results

- Write unit tests (≥90% coverage)
- Write E2E tests (Playwright)
- Run accessibility tests (axe-core)
- Performance testing (Chrome DevTools)
- Add user guide to README
- Capture screenshots
- Conduct UAT with 3 users
- Implement Mixpanel analytics tracking

---

## 🎨 Visual Design

### Column Definitions

| Column                | Data Source                     | Format                    | Tooltip               |
| --------------------- | ------------------------------- | ------------------------- | --------------------- |
| **Склейка** (Rowspan) | Epic 36: `imtId`, `mainProduct` | "👑 ter-09<br/>6 товаров" | imtId value           |
| **Артикул**           | Epic 36: `nmId`                 | "👑 ter-09" or "ter-10"   | Product name          |
| **Всего продаж**      | Epic 35: `totalSales`           | "35,570₽"                 | Total revenue         |
| **Из рекламы**        | Epic 35: `revenue`, `%`         | "10,234₽ (29%)"           | Ad-attributed revenue |
| **Органика**          | Epic 35: `organicSales`         | "25,336₽"                 | Non-ad revenue        |
| **Расход**            | Epic 35: `spend`                | "11,337₽"                 | Ad spend              |
| **ROAS**              | Epic 35: `roas`                 | "0.90" or "—"             | Revenue / Spend       |

### Color Palette

| Element                  | Color      | Hex Code  | Usage                  |
| ------------------------ | ---------- | --------- | ---------------------- |
| Rowspan Cell Background  | Gray 50    | `#FAFAFA` | Group identifier       |
| Rowspan Cell Border      | Gray 200   | `#E5E7EB` | Visual separation      |
| Rowspan Cell Text        | Gray 600   | `#6B7280` | Muted text             |
| Aggregate Row Background | Gray 100   | `#F3F4F6` | Group totals           |
| Aggregate Row Text       | Gray 900   | `#111827` | Bold text              |
| Detail Row Background    | White      | `#FFFFFF` | Individual products    |
| Detail Row Hover         | Gray 50    | `#F9FAFB` | Hover state            |
| Detail Row Text          | Gray 700   | `#374151` | Standard text          |
| Crown Icon               | Yellow 600 | `#CA8A04` | Main product indicator |

**WCAG 2.1 AA Compliance**: All contrast ratios ≥4.5:1 ✅

---

## 📱 Responsive Design

### Desktop (≥1024px)

- Full table width, all columns visible
- No horizontal scroll
- All hover effects enabled

### Tablet (768-1023px)

- Horizontal scroll enabled
- **Sticky columns**: Склейка (left: 0) + Артикул (left: 150px)
- Sticky columns have `z-10` to appear above scrolling content

### Mobile (<768px)

- Horizontal scroll with `min-width: 200px` per column
- Sticky Склейка + Артикул columns remain visible
- Touch-friendly click targets (44x44px minimum)

---

## ♿ Accessibility Features

### WCAG 2.1 AA Compliance

- ✅ Contrast ratios ≥4.5:1 (all text colors verified)
- ✅ Keyboard navigation (Tab to focus, Enter to activate)
- ✅ Screen reader support (`aria-label` on crown icon)
- ✅ Semantic HTML (`<table>`, `<thead>`, `<tbody>`, `rowspan`)
- ✅ Focus indicators visible

### Screen Reader Announcements

- Rowspan cell: "Group 328632, main product ter-09, 6 products"
- Crown icon: "Главный товар" (aria-label)
- Aggregate row: "Group total, 35,570 rubles, ROAS 0.90"
- Detail row: "Product ter-10, 1,489 rubles, no ad spend"

---

## ⚡ Performance

### Performance Budgets

- **Target**: <200ms render time for 50 groups with 6x CPU throttling
- **Test Conditions**: Chrome DevTools Performance tab, CPU slowdown 6x
- **Measurement**: Component mount → paint complete

### Optimization Strategies (If Needed)

- React.memo for MergedGroupRows component
- Virtualization for groups >50 (defer to post-MVP)
- Bundle size monitoring

---

## 🧪 Testing Strategy

### Unit Tests (Jest + React Testing Library)

**File**: `MergedGroupTable.test.tsx`
**Coverage**: ≥90%

**Test Cases**:

- Rowspan rendering with correct `rowspan` attribute
- Aggregate metric calculations (6 Epic 35 formulas)
- Crown icon display (main vs children)
- Formatting functions (currency, percentage, ROAS)
- Edge cases (zero spend, negative revenue, single-product groups)

### E2E Tests (Playwright)

**File**: `advertising-analytics-merged-groups.spec.ts`

**Test Scenarios**:

- Navigate to analytics page, switch to "По склейкам" mode
- Verify table structure (rowspan cells, aggregate rows, detail rows)
- Click product row, verify interaction
- Sort by ROAS column, verify group order
- Responsive behavior (desktop → tablet → mobile)

### Accessibility Tests (axe-core)

- Zero WCAG 2.1 AA violations
- Screen reader announces rowspan content correctly
- Keyboard navigation works (Tab, Enter)
- Crown icon has `aria-label="Главный товар"`

### Performance Tests (Chrome DevTools)

- Render time <200ms for 50 groups
- CPU throttling: 6x slowdown
- Measure: Component mount → paint complete

### UAT (User Acceptance Testing)

- **Participants**: 3 internal finance users
- **Tasks**: 5 scenarios (switch mode, identify main product, interpret ROAS, etc.)
- **Success Criteria**: ≥90% satisfaction, <5 interpretation questions

---

## 📖 User Guide (Story 37.5)

### What are склейки?

Wildberries groups related products into "склейки" (merged cards) sharing the same `imtId`. Ad spend goes to the **main product** (👑), but sales distribute across **all products** in the group.

### How to view:

1. Navigate to Analytics → Advertising
2. Click "По склейкам" toggle (top right)
3. Table displays 3-tier structure

### Reading the table:

- **Всего продаж**: Total revenue (organic + advertising)
- **Из рекламы**: Ad-attributed revenue (percentage shown)
- **Органика**: Non-ad revenue
- **Расход**: Total ad spend
- **ROAS**: Return on ad spend (revenue / spend)

### Main vs Child products:

- 👑 **Main**: Has ad spend, receives budget
- **Children**: No spend, benefit from main product ads

---

## 🔧 Technical Constraints

### Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### File Size Limits

- All source files MUST be <200 lines (ESLint rule)
- Split large components into sub-components

### TypeScript Requirements

- Strict mode enabled
- No `any` types
- All functions have explicit return types

---

## 🚨 Risks & Mitigations

### Risk 1: Large Groups (>20 products)

**Likelihood**: Medium
**Impact**: High (performance degradation)
**Mitigation**:

- Monitor render time during UAT
- If >200ms, implement React.memo or virtualization
- PO decision: Show all products (no pagination) for MVP

### Risk 2: Epic 35/36 Integration Bugs

**Likelihood**: Low
**Impact**: High (feature blocking)
**Mitigation**:

- Story 37.1 validates API BEFORE component work
- Integration tests verify data integrity
- Fallback: Use Epic 36 aggregate data if Epic 35 fields missing

### Risk 3: Accessibility Compliance

**Likelihood**: Low
**Impact**: Medium (legal/UX issues)
**Mitigation**:

- axe-core automated testing (zero violations required)
- Manual screen reader testing
- Keyboard navigation validation

---

## 📚 References

### Documentation

- **PO Validation Report**: `frontend/docs/stories/epic-37/PO-VALIDATION-REPORT-EPIC-37.md`
- **CHANGELOG**: `frontend/docs/CHANGELOG-EPIC-37-FE.md`
- **Backend Request #88**: `frontend/docs/request-backend/88-epic-37-individual-product-metrics.md`

### Dependencies

- **Epic 36**: `docs/epics/epic-36-product-card-linking.md`
- **Epic 35**: `docs/stories/epic-35/` (Stories 35.1-35.7)

### Design References

- **Tailwind CSS**: https://tailwindcss.com/docs
- **WCAG 2.1**: https://www.w3.org/WAI/WCAG21/quickref/
- **Lucide Icons**: https://lucide.dev/icons/crown

---

## 🎯 Definition of Done

**Epic 37 is complete when**:

- ✅ All 5 stories completed (37.1-37.5)
- ✅ All 107 acceptance criteria met
- ✅ Unit tests pass with ≥90% coverage
- ✅ E2E tests pass (all scenarios)
- ✅ Accessibility tests pass (zero violations)
- ✅ Performance tests pass (<200ms for 50 groups)
- ✅ UAT completed (3 users, ≥90% satisfaction, <5 questions)
- ✅ User guide documented in README
- ✅ Screenshots captured and organized
- ✅ Mixpanel analytics events tracking
- ✅ All Dev Agent Record sections filled
- ✅ All QA Results sections filled
- ✅ Code reviewed and merged to main branch

---

## 📁 File Structure

### Story Files (BMad Template Format)

- **Story 37.1**: `frontend/docs/stories/epic-37/story-37.1-backend-api-validation.BMAD.md`
- **Story 37.2**: `frontend/docs/stories/epic-37/story-37.2-merged-group-table-component.BMAD.md`
- **Story 37.3**: `frontend/docs/stories/epic-37/story-37.3-aggregate-metrics-display.BMAD.md`
- **Story 37.4**: `frontend/docs/stories/epic-37/story-37.4-visual-styling-hierarchy.BMAD.md`
- **Story 37.5**: `frontend/docs/stories/epic-37/story-37.5-testing-documentation.BMAD.md`
- **Story 37.6**: `frontend/docs/stories/epic-37/story-37.6-post-mvp-enhancements.md` (Backlog)

### Reports & Documentation

- **PO Validation**: `frontend/docs/stories/epic-37/PO-VALIDATION-REPORT-EPIC-37.md`
- **Conversion Notes**: `frontend/docs/stories/epic-37/CONVERSION-COMPLETE.md`
- **Changelog**: `frontend/docs/CHANGELOG-EPIC-37-FE.md`

### Archive (Original Guide Format)

- `frontend/docs/stories/epic-37/archive/story-37.1-backend-api-validation.md`
- `frontend/docs/stories/epic-37/archive/story-37.2-merged-group-table-component.md`
- `frontend/docs/stories/epic-37/archive/story-37.3-aggregate-metrics-display.md`
- `frontend/docs/stories/epic-37/archive/story-37.4-visual-styling-hierarchy.md`
- `frontend/docs/stories/epic-37/archive/story-37.5-testing-documentation.md`

---

## 📊 Metrics Summary

| Metric              | Value                   |
| ------------------- | ----------------------- |
| **Total Stories**   | 5 MVP + 1 Backlog       |
| **Total ACs**       | 107 acceptance criteria |
| **Total Tasks**     | 35+ tasks with subtasks |
| **PO Decisions**    | 26 documented           |
| **Effort Estimate** | 9-14 hours              |
| **Quality Score**   | 9.2/10                  |
| **Risk Level**      | 🟢 LOW                  |
| **Confidence**      | HIGH                    |

---

## 🎉 Epic Completion Criteria

**PO Sign-Off**:

- ✅ All validation criteria met
- ✅ Template compliance achieved (10/10)
- ✅ Content quality excellent (9.5/10)
- ✅ Implementation risk low
- ✅ Success metrics defined
- ✅ Dev agent compatible

**Authorization**: Sarah (Product Owner)
**Approval Date**: 2025-12-29
**Valid Until**: 2026-01-31 (stories remain current for 1 month)

---

**Product Owner**: Sarah
**Created**: 2025-12-29
**Last Updated**: 2025-12-29
**Status**: ✅ **APPROVED & READY FOR DEVELOPMENT**
