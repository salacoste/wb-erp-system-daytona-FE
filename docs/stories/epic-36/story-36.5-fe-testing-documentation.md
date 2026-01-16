# Story 36.5-FE: Testing & Documentation

## Story Info

- **Epic**: 36-FE - Product Card Linking (Frontend)
- **Priority**: Medium
- **Points**: 3
- **Status**: ✅ APPROVED (Ready for Development)

## User Story

**As a** QA engineer and future developer,
**I want** comprehensive tests and documentation for Epic 36 frontend integration,
**So that** I can verify the feature works correctly and understand how to use/maintain it.

## Background

Epic 36 adds new functionality to the advertising analytics page. This story ensures:
- **Quality**: E2E tests verify full user workflow
- **Regression**: Integration tests ensure Epic 33 still works
- **Maintainability**: Documentation helps future developers
- **Monitoring**: Usage metrics track feature adoption

**Dependencies**: Stories 36.1, 36.2, 36.3, 36.4 complete.

## Acceptance Criteria

### AC1: E2E Tests (Playwright)
- [ ] Create `e2e/advertising-analytics-epic-36.spec.ts`
- [ ] Test: Toggle switches between modes
- [ ] Test: Merged groups display with badges
- [ ] Test: Tooltip shows on hover
- [ ] Test: ROAS/ROI calculated correctly
- [ ] Test: Epic 33 regression (filters, sorting still work)

### AC2: Integration Tests
- [ ] Test: API client sends `group_by` parameter
- [ ] Test: Response with merged groups parsed correctly
- [ ] Test: Response with individuals parsed correctly
- [ ] Test: Mixed response (both types) handled correctly
- [ ] Test: Error handling works

### AC3: Component Unit Tests
- [ ] MergedProductBadge: 100% coverage
- [ ] GroupByToggle: 100% coverage
- [ ] Edge cases tested

### AC4: Documentation
- [ ] Update `frontend/README.md` with Epic 36 section
- [ ] Add usage examples
- [ ] Add screenshots (optional)
- [ ] Update CHANGELOG.md

### AC5: Frontend Metrics (Optional)
- [ ] Track `group_by` mode usage (analytics event)
- [ ] Track merged group badge clicks
- [ ] Track tooltip open rate

## Tasks / Subtasks

### Phase 1: E2E Tests (90 min)
- [ ] Create `frontend/e2e/advertising-analytics-epic-36.spec.ts`
- [ ] Setup: Navigate to `/analytics/advertising`
- [ ] Test 1: Toggle between modes
- [ ] Test 2: Merged groups display
- [ ] Test 3: Tooltip interaction
- [ ] Test 4: ROAS validation for merged groups
- [ ] Test 5: Epic 33 regression suite

### Phase 2: Integration Tests (60 min)
- [ ] Create `src/lib/api/__tests__/advertising-analytics-epic-36.test.ts`
- [ ] Mock backend responses (merged groups, individuals, mixed)
- [ ] Test API parameter handling
- [ ] Test response mapping
- [ ] Test error scenarios

### Phase 3: Component Unit Tests (40 min)
- [ ] Complete MergedProductBadge tests (Story 36.3)
- [ ] Create GroupByToggle tests
- [ ] Test all props and edge cases
- [ ] Verify 100% coverage

### Phase 4: Documentation (60 min)
- [ ] Add Epic 36 section to `frontend/README.md`
- [ ] Document toggle usage
- [ ] Document merged groups concept
- [ ] Update CHANGELOG.md
- [ ] Add troubleshooting tips

### Phase 5: Metrics (Optional, 30 min)
- [ ] Add analytics tracking for toggle clicks
- [ ] Add analytics for badge interactions
- [ ] Add dashboard for Epic 36 usage

## Technical Details

### E2E Test Suite

**File**: `frontend/e2e/advertising-analytics-epic-36.spec.ts` (NEW)

```typescript
import { test, expect } from '@playwright/test'

test.describe('Epic 36: Product Card Linking', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to advertising analytics
    await page.goto('/login')
    await page.fill('input[name="email"]', 'test@test.com')
    await page.fill('input[name="password"]', 'Russia23!')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')
    await page.goto('/analytics/advertising')
  })

  test('should toggle between SKU and imtId grouping modes', async ({ page }) => {
    // Default: По артикулам selected
    await expect(
      page.getByRole('button', { name: 'По артикулам' })
    ).toHaveAttribute('aria-pressed', 'true')

    // Click "По склейкам"
    await page.getByRole('button', { name: 'По склейкам' }).click()

    // Verify active state changed
    await expect(
      page.getByRole('button', { name: 'По склейкам' })
    ).toHaveAttribute('aria-pressed', 'true')

    // Verify URL updated
    await expect(page).toHaveURL(/group_by=imtId/)

    // Verify merged groups displayed (if any exist)
    const mergedBadge = page.locator('text=/Склейка/')
    if (await mergedBadge.count() > 0) {
      await expect(mergedBadge.first()).toBeVisible()
    }
  })

  test('should show merged product tooltip on hover', async ({ page }) => {
    // Switch to merged groups view
    await page.getByRole('button', { name: 'По склейкам' }).click()

    // Wait for data to load
    await page.waitForSelector('table tbody tr', { timeout: 5000 })

    // Find first merged badge
    const badge = page.locator('text=/Склейка/').first()

    if (await badge.count() > 0) {
      // Hover over badge
      await badge.hover()

      // Verify tooltip content
      await expect(page.getByText(/Объединённая карточка #/)).toBeVisible()
      await expect(page.getByText(/Товары в группе:/)).toBeVisible()
    }
  })

  test('should display correct ROAS for merged groups', async ({ page }) => {
    // Switch to merged groups
    await page.getByRole('button', { name: 'По склейкам' }).click()

    // Wait for table
    await page.waitForSelector('table tbody tr')

    // Find first merged group row (if exists)
    const mergedRow = page.locator('tr:has-text("Группа #")').first()

    if (await mergedRow.count() > 0) {
      // ROAS column (adjust index based on actual table structure)
      const roasCell = mergedRow.locator('td').nth(4)

      // Verify ROAS is a number (not "—" or "N/A")
      const roasText = await roasCell.textContent()
      expect(roasText).toMatch(/^\d+\.\d+x?$/)
    }
  })

  test('should preserve Epic 33 functionality', async ({ page }) => {
    // Test Epic 33 features still work

    // 1. Date range picker
    await page.click('input[placeholder*="от"]')
    await page.click('text=15') // Pick a date
    await expect(page).toHaveURL(/from=2025-\d{2}-15/)

    // 2. View by mode
    await page.click('button:has-text("Campaign")')
    await expect(page).toHaveURL(/view=campaign/)

    // 3. Efficiency filter
    await page.click('button:has-text("Эффективность")')
    await page.click('text=Отличная')
    await expect(page).toHaveURL(/status=excellent/)

    // 4. Sorting
    const spendHeader = page.locator('th:has-text("Затраты")')
    await spendHeader.click()
    // Table should re-render with different sort order

    // All Epic 33 tests pass → no regressions
  })

  test('should handle URL state correctly', async ({ page }) => {
    // Direct navigation with group_by param
    await page.goto('/analytics/advertising?group_by=imtId&from=2025-12-01&to=2025-12-21')

    // Verify correct mode selected
    await expect(
      page.getByRole('button', { name: 'По склейкам' })
    ).toHaveAttribute('aria-pressed', 'true')

    // Refresh page
    await page.reload()

    // State persisted
    await expect(
      page.getByRole('button', { name: 'По склейкам' })
    ).toHaveAttribute('aria-pressed', 'true')
  })
})
```

### Integration Tests

**File**: `src/lib/api/__tests__/advertising-analytics-epic-36.test.ts` (NEW)

```typescript
import { describe, it, expect, vi } from 'vitest'
import { getAdvertisingAnalytics } from '../advertising-analytics'

describe('getAdvertisingAnalytics - Epic 36', () => {
  it('sends group_by parameter when provided', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch')

    await getAdvertisingAnalytics({
      from: '2025-12-01',
      to: '2025-12-21',
      group_by: 'imtId',
    })

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('group_by=imtId'),
      expect.any(Object)
    )
  })

  it('maps merged group response correctly', async () => {
    const mockResponse = {
      items: [{
        key: 'imtId:328632',
        type: 'merged_group',
        imtId: 328632,
        mergedProducts: [
          { nmId: 173588306, vendorCode: 'ter-09' },
          { nmId: 173589306, vendorCode: 'ter-10' },
        ],
        spend: 11337,
        revenue: 34058,
      }],
      summary: {},
      query: {},
    }

    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as any)

    const result = await getAdvertisingAnalytics({
      from: '2025-12-01',
      to: '2025-12-21',
      group_by: 'imtId',
    })

    expect(result.data[0].type).toBe('merged_group')
    expect(result.data[0].imtId).toBe(328632)
    expect(result.data[0].mergedProducts).toHaveLength(2)
  })
})
```

### Documentation Updates

**File**: `frontend/README.md`

**Section to Add** (after Epic 24 section, line ~1680):

```markdown
---

## 🔗 Product Card Linking (Epic 36) - 2025-12-28

### Overview

**Группировка по склейкам** - новая функция для рекламной аналитики, позволяющая группировать товары по объединённым карточкам Wildberries (imtId).

**Business Value**: Правильный расчёт ROAS/ROI для товаров, которые WB объединяет в одну рекламную карточку. Решает проблему "spend=0 но revenue>0".

### Features

- ✅ Toggle between individual SKUs and merged groups
- ✅ Visual badge showing merged group size
- ✅ Tooltip with list of all products in group
- ✅ Aggregated metrics (spend, revenue, ROAS, ROI)
- ✅ Backward compatible with Epic 33

### Quick Start

**Page**: `/analytics/advertising`

**Toggle Modes**:
1. **По артикулам** (default) - Individual product metrics (Epic 33 behavior)
2. **По склейкам** - Merged group metrics (Epic 36 new feature)

**Example**:
```
Before (По артикулам):
- ter-09: spend=0₽, revenue=1,105₽ → ROAS=null ❌

After (По склейкам):
- Группа #328632 🔗 Склейка (3)
  - Products: ter-09, ter-10, ter-13-1
  - Total spend: 11,337₽
  - Total revenue: 34,058₽
  - ROAS: 3.0x ✅
```

### Technical Implementation

**API Parameter**: `GET /v1/analytics/advertising?group_by=imtId`

**TypeScript Types**:
```typescript
interface AdvertisingItem {
  type?: 'merged_group' | 'individual'
  imtId?: number | null
  mergedProducts?: MergedProduct[]
  // ... existing fields
}
```

**Components**:
- `GroupByToggle.tsx` - Toggle UI component
- `MergedProductBadge.tsx` - Badge with tooltip

**Hooks**:
- `useAdvertisingMergedGroups()` - Convenience hook for merged groups

### Files Modified

**Types**:
1. `src/types/advertising-analytics.ts` - Added GroupByMode, MergedProduct

**API Client**:
2. `src/lib/api/advertising-analytics.ts` - Added group_by parameter support

**Hooks**:
3. `src/hooks/useAdvertisingAnalytics.ts` - Added useAdvertisingMergedGroups

**Components**:
4. `src/app/(dashboard)/analytics/advertising/page.tsx` - Added toggle state and UI
5. `src/components/analytics/MergedProductBadge.tsx` - NEW
6. `src/components/analytics/GroupByToggle.tsx` - NEW
7. `src/app/(dashboard)/analytics/advertising/components/PerformanceMetricsTable.tsx` - Updated rendering

### Documentation

**Backend**:
- API Contract: `docs/request-backend/83-epic-36-api-contract.md`
- Implementation Plan: `docs/implementation-plans/epic-36-frontend-integration.md`
- UI Mockup: `docs/wireframes/epic-36-ui-mockup.md`

**Frontend**:
- Epic Overview: `docs/stories/epic-36/README.md`
- Stories: `docs/stories/epic-36/story-36.{1-5}-fe-*.md`

---

## Usage

See: `frontend/README.md` - Epic 36 section for full usage guide
```

**File**: `frontend/CHANGELOG.md`

```markdown
## [Unreleased]

### Added
- **Epic 36**: Product Card Linking (склейки) support in advertising analytics
  - Toggle between individual SKUs and merged product groups
  - MergedProductBadge component with tooltip showing all products
  - Correct ROAS/ROI calculations for merged cards
  - GroupByToggle component for mode switching
  - Full backward compatibility with Epic 33
```

## Testing Checklist

### Unit Tests (Coverage: 100%)
- [ ] MergedProductBadge.test.tsx (5 tests)
- [ ] GroupByToggle.test.tsx (4 tests)
- [ ] All tests pass
- [ ] Coverage report shows 100%

### Integration Tests (6 scenarios)
- [ ] API client sends group_by parameter
- [ ] Response mapping includes Epic 36 fields
- [ ] Hook useAdvertisingMergedGroups works
- [ ] Error handling works
- [ ] Backward compatibility maintained
- [ ] URL state management works

### E2E Tests (5 scenarios)
- [ ] Toggle switches modes
- [ ] Merged groups render
- [ ] Tooltips show on hover
- [ ] ROAS/ROI correct
- [ ] Epic 33 regression passed

### Manual Testing Checklist
- [ ] Open `/analytics/advertising`
- [ ] Default mode: "По артикулам" selected ✅
- [ ] Click "По склейкам" → table updates ✅
- [ ] Merged groups show badge with count ✅
- [ ] Hover badge → tooltip appears with product list ✅
- [ ] Individual products show no badge ✅
- [ ] All metrics display correctly ✅
- [ ] Epic 33 features work: filters, sorting, date range ✅
- [ ] Mobile responsive (test on phone) ✅
- [ ] No console errors ✅

### Regression Testing (Epic 33)
- [ ] Date range picker works
- [ ] View by mode (SKU/Campaign/Brand/Category) works
- [ ] Efficiency filter works
- [ ] Campaign filter works
- [ ] Sorting works (all columns)
- [ ] Pagination works
- [ ] Summary cards correct
- [ ] Sync status indicator works
- [ ] Dashboard widget works

## Technical Details

### Test Files to Create

1. **`frontend/e2e/advertising-analytics-epic-36.spec.ts`** (NEW)
2. **`src/lib/api/__tests__/advertising-analytics-epic-36.test.ts`** (NEW)
3. **`src/components/analytics/GroupByToggle.test.tsx`** (NEW)
4. **`src/components/analytics/MergedProductBadge.test.tsx`** (created in Story 36.3)

### Documentation Files to Update

1. **`frontend/README.md`** - Add Epic 36 section
2. **`frontend/CHANGELOG.md`** - Add Epic 36 entry
3. **`docs/stories/epic-36/README.md`** - Update status to COMPLETE

### Test Coverage Requirements

**Target Coverage**:
- Unit tests: 100% (all new components)
- Integration tests: 90% (API client changes)
- E2E tests: Critical user paths (5 scenarios)

**Total Test Count**: ~20 tests
- Unit: 9 tests (MergedProductBadge: 5, GroupByToggle: 4)
- Integration: 6 tests
- E2E: 5 tests

### Performance Benchmarks

**Acceptance Criteria**:
- Page load time (group_by=imtId): < 500ms
- Toggle switch time: < 100ms (React state update)
- Tooltip open time: < 50ms
- No memory leaks (5+ mode switches)

### Frontend Metrics (Optional)

**Events to Track**:
```typescript
// Toggle click
analytics.track('epic36_toggle_clicked', {
  mode: 'imtId' | 'sku',
  timestamp: Date.now(),
})

// Badge interaction
analytics.track('epic36_badge_hovered', {
  imtId: number,
  productCount: number,
})

// Feature adoption
analytics.track('epic36_merged_view_used', {
  sessionId: string,
  duration: number, // Time spent in merged view
})
```

## Testing Checklist

### Automated Tests
```bash
# Run all tests
npm test

# Run Epic 36 specific tests
npm test -- --testPathPattern="epic-36"

# Run E2E tests
npm run test:e2e -- advertising-analytics-epic-36

# Generate coverage report
npm run test:coverage
```

### Manual Testing

**Scenario 1: Toggle Between Modes**
1. Open `/analytics/advertising`
2. Default: "По артикулам" selected ✅
3. Click "По склейкам" ✅
4. Table updates to show merged groups ✅
5. Click "По артикулам" ✅
6. Table updates to show individual SKUs ✅

**Scenario 2: Merged Group Display**
1. Toggle to "По склейкам"
2. Verify merged groups show "Группа #XXX" text ✅
3. Verify badge displays "🔗 Склейка (N)" ✅
4. Verify individual products show no badge ✅

**Scenario 3: Tooltip Interaction**
1. Hover over merged badge
2. Tooltip appears with:
   - Header: "Объединённая карточка #XXX" ✅
   - Product list: vendorCode + nmId ✅
   - Explanation text ✅

**Scenario 4: ROAS Validation**
1. Toggle to "По склейкам"
2. Find merged group (e.g., Группа #328632)
3. Verify ROAS is numeric (not "—") ✅
4. Calculate manually: revenue / spend ≈ displayed ROAS ✅

**Scenario 5: Epic 33 Regression**
1. Test all Epic 33 features (see checklist above)
2. All features work identically ✅
3. No visual changes to Epic 33 UI ✅

## Dependencies

- **Prerequisites**: Stories 36.1, 36.2, 36.3, 36.4 complete
- **Testing Tools**: Playwright, Vitest, @testing-library/react
- **Backend**: Epic 36 API running at `localhost:3000`

## Definition of Done

- [ ] All E2E tests created and passing
- [ ] All integration tests created and passing
- [ ] All unit tests passing with 100% coverage
- [ ] Manual testing checklist complete
- [ ] Epic 33 regression tests pass
- [ ] `frontend/README.md` updated
- [ ] `CHANGELOG.md` updated
- [ ] Performance benchmarks met
- [ ] No console errors or warnings
- [ ] Code review approved
- [ ] PO acceptance sign-off
- [ ] Story marked DONE

## Notes for PO Review

### Questions for PO

**Q1: Test Coverage Target**
Should we aim for:
- **Option A**: 100% coverage (all files)
- **Option B**: 90% coverage (critical paths only)
- **Option C**: 80% coverage (unit + E2E)

**Recommendation**: Option B (90%) - balance between quality and velocity

**PO DECISION**: ✅ **APPROVED - Option B (90% coverage, critical paths)** | Date: 2025-12-28 | PO: Sarah

**Q2: E2E Test Scope**
Should E2E tests include:
- **Option A**: 5 critical scenarios (proposed above)
- **Option B**: 5 scenarios + full Epic 33 regression (15+ scenarios)
- **Option C**: Only 3 happy path scenarios

**Recommendation**: Option A - covers Epic 36 + basic regression

**PO DECISION**: ✅ **APPROVED - Option A (5 critical scenarios)** | Date: 2025-12-28 | PO: Sarah

**Q3: Documentation Depth**
Documentation should include:
- **Option A**: Usage guide only (lightweight)
- **Option B**: Usage + screenshots + troubleshooting (comprehensive)
- **Option C**: Usage + video tutorial (extensive)

**Recommendation**: Option B - comprehensive written docs, no video

**PO DECISION**: ✅ **APPROVED - Option B (Usage + screenshots + troubleshooting)** | Date: 2025-12-28 | PO: Sarah

**Q4: Frontend Metrics**
Should we track Epic 36 usage?
- **Option A**: Yes - track toggle clicks and feature adoption
- **Option B**: No - keep it simple
- **Option C**: Later - defer to post-MVP

**Recommendation**: Option C - focus on feature delivery, add metrics later

**PO DECISION**: ✅ **APPROVED - Option C (Defer to post-MVP)** | Date: 2025-12-28 | PO: Sarah

### Estimated Time

**Total**: 280 minutes (4.7 hours)
- Phase 1: 90 min (E2E tests)
- Phase 2: 60 min (integration tests)
- Phase 3: 40 min (unit tests)
- Phase 4: 60 min (documentation)
- Phase 5: 30 min (metrics, optional)

### Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Test flakiness | Medium | Low | Use proper waitFor, stable selectors |
| Epic 33 regression | Low | High | Full regression suite in E2E |
| Documentation outdated | Low | Low | Include screenshots with timestamps |

---

**Document Version**: 1.1
**Created**: 2025-12-28
**Status**: ✅ **APPROVED - Ready for Development**
**PO Approval**: Sarah | 2025-12-28 22:45 MSK
**Dependencies**: Stories 36.1, 36.2, 36.3, 36.4
**Next Action**: QA begins implementation after Stories 36.1-36.4 complete
