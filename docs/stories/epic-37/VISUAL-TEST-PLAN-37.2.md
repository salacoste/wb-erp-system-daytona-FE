# Visual Testing Plan - Story 37.2

**Component**: MergedGroupTable
**Server**: http://localhost:3100 (PM2: wb-repricer-frontend-dev)
**Test Date**: 2025-12-29
**Tester**: [TO BE ASSIGNED]

---

## 🎯 Pre-Test Checklist

- [x] PM2 frontend dev server running on port 3100
- [x] Mock data available (`src/mocks/data/epic-37-merged-groups.ts`)
- [x] Feature flag enabled (`epic37MergedGroups.enabled = true`)
- [x] Feature flag using mock data (`epic37MergedGroups.useRealApi = false`)
- [x] Component file created (`components/MergedGroupTable.tsx`)
- [x] Page integration complete (`page.tsx`)

---

## 📋 Test Scenarios

### Scenario 1: Navigate to Advertising Analytics Page

**Steps**:
1. Open browser: http://localhost:3100
2. Navigate to **Аналитика** → **Реклама** (left sidebar)
3. URL should be: `/analytics/advertising`

**Expected**:
- ✅ Page loads without errors
- ✅ Default view: "По товарам" (SKU mode, groupBy='sku')
- ✅ Standard PerformanceMetricsTable visible

**Status**: [ ] PASS / [ ] FAIL

---

### Scenario 2: Switch to Merged Groups View

**Steps**:
1. Locate **"Группировка"** label (above table)
2. Find GroupByToggle component (right side)
3. Click toggle to switch to **"По склейкам"**

**Expected**:
- ✅ Toggle switches from "По товарам" to "По склейкам"
- ✅ Table re-renders to MergedGroupTable component
- ✅ 3 groups visible:
  - Group 1: ter-09 + 5 товаров (6 products)
  - Group 2: ter-14 + 1 товар (2 products)
  - Group 3: Standalone product (no rowspan)

**Status**: [ ] PASS / [ ] FAIL

---

### Scenario 3: Verify Tier 1 - Rowspan Cell

**Test Group**: mockMergedGroup1 (ter-09 + 5 товаров)

**Checks**:
- [ ] Rowspan cell spans 7 rows total (1 aggregate + 6 products)
- [ ] Vertical alignment: centered
- [ ] Background: light gray (#FAFAFA / bg-gray-50)
- [ ] Right border: 2px solid gray
- [ ] Content line 1: "ter-09" (vendor code, medium weight)
- [ ] Content line 2: "+ 5 товаров" (small, gray text)

**Screenshot**: [ATTACH SCREENSHOT]

**Status**: [ ] PASS / [ ] FAIL

---

### Scenario 4: Verify Tier 2 - Aggregate Row

**Test Group**: mockMergedGroup1 (ГРУППА #328632)

**Checks**:
- [ ] First column: "ГРУППА #328632" (bold text)
- [ ] Background: medium gray (#F3F4F6 / bg-gray-100)
- [ ] Font weight: 600 (semibold)
- [ ] Font size: 0.95rem
- [ ] Metrics displayed:
  - [ ] Всего продаж: 35 570 ₽
  - [ ] Из рекламы: 10 234 ₽ (71.2%)
  - [ ] Органика: 25 336 ₽
  - [ ] Расход: 11 337 ₽
  - [ ] ROAS: 0.90

**Screenshot**: [ATTACH SCREENSHOT]

**Status**: [ ] PASS / [ ] FAIL

---

### Scenario 5: Verify Tier 3 - Detail Rows

**Test Group**: mockMergedGroup1 (6 products)

**Product 1 (Main - ter-09)**:
- [ ] Crown icon (👑) visible before vendor code
- [ ] Crown color: yellow-600 (#CA8A04)
- [ ] Crown size: h-4 w-4
- [ ] Vendor code: "ter-09"
- [ ] Metrics: totalSales 20 000 ₽, spend 11 337 ₽, ROAS 1.76

**Product 2 (Child - ter-09-1)**:
- [ ] NO crown icon
- [ ] Vendor code: "ter-09-1"
- [ ] Metrics: totalSales 8 500 ₽, spend 0 ₽, ROAS —

**All Detail Rows**:
- [ ] Font weight: 400 (normal)
- [ ] Font size: 0.875rem (text-sm)
- [ ] Background: white
- [ ] Hover effect: background changes to gray-50 (#F9FAFB)
- [ ] Cursor: pointer on hover

**Screenshot**: [ATTACH SCREENSHOT]

**Status**: [ ] PASS / [ ] FAIL

---

### Scenario 6: Single-Product Group (Edge Case)

**Test Group**: mockMergedGroup2 (ter-14 + 1 товар)

**Checks**:
- [ ] NO rowspan cell (column completely skipped)
- [ ] Table starts directly with "ГРУППА #456789"
- [ ] Only 2 rows total (1 aggregate + 1 product)
- [ ] Product row: ter-14 with crown icon

**Screenshot**: [ATTACH SCREENSHOT]

**Status**: [ ] PASS / [ ] FAIL

---

### Scenario 7: Standalone Product (imtId=null)

**Test Group**: mockStandaloneProduct

**Checks**:
- [ ] NO rowspan cell
- [ ] Displays as single row (no aggregate)
- [ ] Vendor code visible
- [ ] All metrics populated

**Note**: Implementation details depend on Story 37.3 (standalone handling)

**Status**: [ ] PASS / [ ] FAIL

---

### Scenario 8: Epic 35 Integration

**Test**: Verify organic sales display

**Checks**:
- [ ] "Из рекламы" column shows: `10 234 ₽ (71.2%)`
- [ ] Percentage = organicContribution from aggregateMetrics
- [ ] "Органика" column shows: `25 336 ₽`
- [ ] Formula validation: totalSales - revenue = organicSales
  - Example: 35 570 - 10 234 = 25 336 ✓

**Status**: [ ] PASS / [ ] FAIL

---

### Scenario 9: Sorting Functionality

**Test**: Click column headers to sort

**Steps**:
1. Click "Всего продаж" header
2. Verify sort indicator appears (↑ or ↓)
3. Click again to toggle direction
4. Try other columns (Расход, ROAS)

**Expected**:
- ✅ Sort indicator toggles between ↑ (asc) and ↓ (desc)
- ✅ Console log shows sort callback fired
- ✅ onSort prop receives correct field name

**Note**: Actual data sorting happens in parent page component

**Status**: [ ] PASS / [ ] FAIL

---

### Scenario 10: Click Handler

**Test**: Click on detail row (individual product)

**Steps**:
1. Click on any detail row (child product)
2. Open browser console (F12)
3. Check for console log

**Expected**:
- ✅ Console log: `[Epic 37] Product clicked: <nmId>`
- ✅ Cursor changes to pointer on hover
- ✅ No errors in console

**Status**: [ ] PASS / [ ] FAIL

---

### Scenario 11: Responsive Design

**Test**: Mobile/tablet/desktop views

**Viewports to Test**:
- [ ] Mobile (400px): Horizontal scroll active
- [ ] Tablet (800px): Horizontal scroll active
- [ ] Desktop (1400px): Full table visible, no scroll

**Checks**:
- [ ] Table maintains structure at all sizes
- [ ] Rowspan cells span correctly on mobile
- [ ] Scroll works smoothly
- [ ] No layout breaks or text overflow

**Screenshots**:
- [ ] Mobile view
- [ ] Tablet view
- [ ] Desktop view

**Status**: [ ] PASS / [ ] FAIL

---

## 🐛 Bug Tracking

### Known Issues

**Issue 1**: [TO BE FILLED DURING TESTING]
- **Description**:
- **Severity**: P0 / P1 / P2 / P3
- **Steps to reproduce**:
- **Expected**:
- **Actual**:
- **Fix required**: Yes / No

---

## ✅ Test Completion Criteria

- [ ] All 11 scenarios executed
- [ ] All scenarios PASS (or issues documented)
- [ ] Screenshots captured for visual reference
- [ ] Console shows no errors or warnings
- [ ] Performance acceptable (<200ms render)
- [ ] Responsive design validated (3 viewports)

---

## 📊 Test Results Summary

**Total Scenarios**: 11
**Passed**: [ ] / 11
**Failed**: [ ] / 11
**Blocked**: [ ] / 11

**Overall Status**: [ ] PASS / [ ] FAIL / [ ] CONDITIONAL

**Tester Signature**: ___________________
**Date Tested**: ___________________

---

## 🚀 Sign-Off

**Developer**: ✅ Claude Sonnet 4.5 (2025-12-29)
**QA**: [ ] Pending visual testing
**PO**: [ ] Pending after QA approval

---

**Next Action**: Execute visual testing, document results, proceed to Story 37.3
