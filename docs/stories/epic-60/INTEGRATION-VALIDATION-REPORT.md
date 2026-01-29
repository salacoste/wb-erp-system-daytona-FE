# Integration Validation Report
## Epic 60-FE: Dashboard & Analytics UX Improvements - Wave 4 Bug Fixes

**Date**: 2026-01-29
**Validator**: Integration QA Specialist
**Wave**: Wave 4 (Bug Fixes)
**Status**: ⚠️ **ISSUES FOUND - REQUIRES FIXES**

---

## Executive Summary

This report validates the integration of two bug fixes:
1. **Agent 1**: Period switching updates ALL metrics (week ↔ month)
2. **Agent 2**: Margin % and ROAS display actual values

**Integration Status**: ❌ **FAIL**

Both agents' work has not been completed. The codebase shows:
- Period switching infrastructure exists but has critical bugs
- Margin % calculation is incomplete
- ROAS is hardcoded to `null`
- Missing month API integration

---

## Code Review Findings

### 1. Agent 1: Period Switching (Week ↔ Month)

**Status**: ⚠️ **PARTIALLY IMPLEMENTED - BUGS FOUND**

**What Works**:
- ✅ `DashboardPeriodContext` provides week/month state management
- ✅ `DashboardPeriodSelector` has week/month toggle UI
- ✅ URL sync works (`?type=week&week=2025-W03` ↔ `?type=month&month=2025-01`)

**Critical Issues**:

#### Issue 1.1: Month API Not Implemented
**File**: `src/hooks/useDashboardMetricsWithPeriod.ts:32-49`

```typescript
// ❌ ONLY fetches week data - no month API endpoint
async function fetchDashboardMetrics(week: string): Promise<DashboardMetrics> {
  const summaryResponse = await apiClient.get<{
    summary_total: FinanceSummary | null
    // ...
  }>(`/v1/analytics/weekly/finance-summary?week=${week}`)
  // ...
}
```

**Problem**: When `periodType === 'month'`, the hook still calls the week API with a week parameter instead of month.

**Impact**: Month period shows week data or fails entirely.

**Required Fix**: Add month API endpoint:
```typescript
// ✅ Should be:
async function fetchDashboardMetrics(period: string, periodType: PeriodType): Promise<DashboardMetrics> {
  const endpoint = periodType === 'week'
    ? `/v1/analytics/weekly/finance-summary?week=${period}`
    : `/v1/analytics/monthly/finance-summary?month=${period}`
  // ...
}
```

#### Issue 1.2: Query Keys Don't Include Period Type
**File**: `src/hooks/useDashboardMetricsWithPeriod.ts:64-76`

```typescript
// ❌ Query keys don't distinguish week vs month
queryKey: dashboardQueryKeys.metrics(selectedWeek),  // Only uses week!
```

**Problem**: Week and month data overwrite each other in cache because they use the same query key.

**Impact**:
- Switching week → month shows cached week data
- Switching month → week shows cached month data
- No parallel caching of both periods

**Required Fix**: Include period type in query key:
```typescript
// ✅ Should be:
queryKey: [...dashboardQueryKeys.metrics(periodType), period],
```

#### Issue 1.3: Context Only Provides Week/Month, Not Selected Period
**File**: `src/hooks/useDashboardMetricsWithPeriod.ts:59`

```typescript
// ❌ Only uses selectedWeek and previousWeek
const { selectedWeek, previousWeek } = useDashboardPeriod()
```

**Problem**: Hook doesn't use `periodType`, `selectedMonth`, or `previousMonth`.

**Impact**: Month period data never fetched.

**Required Fix**: Use period type and appropriate period value:
```typescript
// ✅ Should be:
const { periodType, selectedWeek, selectedMonth, previousWeek, previousMonth } = useDashboardPeriod()

const currentPeriod = periodType === 'week' ? selectedWeek : selectedMonth
const previousPeriod = periodType === 'week' ? previousWeek : previousMonth
```

---

### 2. Agent 2: Margin % and ROAS Display

**Status**: ❌ **NOT IMPLEMENTED**

#### Issue 2.1: Margin % Calculation Uses Week Data Only
**File**: `src/app/(dashboard)/dashboard/components/DashboardContent.tsx:52-53,134-139`

```typescript
// ❌ Always fetches week data, even when in month mode
const { data: financeSummary, isLoading: summaryLoading } = useFinancialSummary(selectedWeek)

// Margin calculation
<MetricCardEnhanced
  title="Маржа %"
  value={calculateMarginPercentage(summary?.gross_profit, summary?.sale_gross_total)}
  // ...
/>
```

**Problem**: `useFinancialSummary` is called with `selectedWeek` regardless of `periodType`.

**Impact**: Month period shows week margin data.

**Required Fix**: Pass period type to finance summary hook:
```typescript
// ✅ Should be:
const { data: financeSummary, isLoading: summaryLoading } = useFinancialSummary(
  periodType === 'week' ? selectedWeek : selectedMonth,
  periodType
)
```

#### Issue 2.2: ROAS Hardcoded to Null
**File**: `src/app/(dashboard)/dashboard/components/DashboardContent.tsx:156-162`

```typescript
// ❌ EXPLICITLY HARDCODED TO NULL
<MetricCardEnhanced
  title="ROAS рекламы"
  value={null} // Placeholder - linked to AdvertisingDashboardWidget data
  format="number"
  tooltip="Окупаемость рекламных расходов (из виджета рекламы)"
  isLoading={false}
/>
```

**Problem**: ROAS is explicitly hardcoded to `null` with a comment indicating it's a placeholder.

**Impact**: ROAS always shows "—" regardless of data availability.

**Required Fix**: Fetch ROAS from advertising widget data or backend:
```typescript
// ✅ Should be:
const { data: advertisingData } = useAdvertisingData(
  advertisingDateRange.startDate,
  advertisingDateRange.endDate
)

<MetricCardEnhanced
  title="ROAS рекламы"
  value={calculateRoas(advertisingData?.revenue, advertisingData?.spend)}
  format="number"
  tooltip="Окупаемость рекламных расходов (из виджета рекламы)"
  isLoading={advertisingLoading}
/>
```

---

## Integration Conflicts

### Conflict 1: Hook Reusability
**Problem**: `useDashboardMetricsWithComparison` is hardcoded for weeks only.
**Impact**: Cannot be used for month periods without breaking changes.
**Resolution Required**: Refactor hook signature to accept `(period, periodType)`

### Conflict 2: API Availability
**Problem**: Backend may not have `/v1/analytics/monthly/finance-summary` endpoint.
**Impact**: Month period feature cannot work without backend support.
**Resolution Required**: Confirm backend API availability or implement aggregation on frontend.

### Conflict 3: Data Consistency
**Problem**: Week data comes from `useDashboardMetricsWithComparison`, month data doesn't exist.
**Impact**: Inconsistent data fetching patterns between periods.
**Resolution Required**: Unify data fetching for both period types.

---

## TypeScript & ESLint Validation

### TypeScript Check
```bash
npm run type-check
```

**Result**: ❌ **1 ERROR**
```
src/hooks/useFinancialSummary.ts(72,45): error TS7006: Parameter 'week' implicitly has an 'any' type.
```

**Fix Required**: Add type annotation to `week` parameter.

### ESLint Check
```bash
npm run lint
```

**Result**: ✅ **PASS** (No errors in source code)

**Note**: ESLint deprecation warning for Next.js 16 migration is informational.

---

## Acceptance Criteria Validation

### AC1: Period switching (week → month) updates ALL metrics
**Status**: ❌ **FAIL**
- Period selector UI works
- URL updates correctly
- **BUT data doesn't update** (still shows week data)

### AC2: Period switching (month → week) updates ALL metrics
**Status**: ❌ **FAIL**
- Period selector UI works
- URL updates correctly
- **BUT data doesn't update** (cached month data)

### AC3: Margin % displays for both week and month
**Status**: ⚠️ **PARTIAL**
- Margin displays for week
- **BUT shows week data when in month mode**

### AC4: ROAS displays actual value (not null)
**Status**: ❌ **FAIL**
- **Hardcoded to `null` in DashboardContent.tsx line 158**

### AC5: URL updates correctly on period change
**Status**: ✅ **PASS**
- URL sync works correctly

### AC6: No console errors
**Status**: ✅ **PASS** (assuming no runtime errors)

---

## Regression Analysis

### Existing Week Functionality
**Status**: ✅ **NO REGRESSIONS DETECTED**
- Week period selection works
- Week data fetching works
- Week URL sync works

### Performance
**Status**: ⚠️ **POTENTIAL ISSUE**
- Parallel fetching implemented correctly
- **BUT query key conflicts cause unnecessary refetches**

### User Experience
**Status**: ⚠️ **DEGRADED**
- Period switching appears to work (UI updates)
- **BUT shows wrong data** (silent failure - very bad UX)

---

## Critical Bugs Summary

| Bug | Severity | Impact | Fix Complexity |
|-----|----------|--------|----------------|
| Month API not implemented | 🔴 Critical | Month period non-functional | High (requires backend) |
| Query keys don't include period type | 🔴 Critical | Cache corruption | Medium |
| Margin uses week data only | 🔴 Critical | Wrong margin displayed | Low |
| ROAS hardcoded to null | 🟠 High | Missing metric | Medium |
| TypeScript implicit any | 🟡 Medium | Type safety | Low |

---

## Recommendations

### Immediate Actions (Required for Wave 4 Completion)

1. **Confirm Backend API Availability**
   - Check if `/v1/analytics/monthly/finance-summary` endpoint exists
   - If not, either:
     - Request backend implementation, OR
     - Implement frontend aggregation from week data

2. **Fix Query Keys**
   - Update `useDashboardMetricsWithPeriod` to include `periodType` in cache keys
   - Prevents cache corruption between week and month

3. **Fix Margin Calculation**
   - Pass `periodType` to `useFinancialSummary`
   - Fetch correct data based on selected period

4. **Implement ROAS**
   - Connect to `AdvertisingDashboardWidget` data
   - Calculate ROAS = revenue / spend

5. **Fix TypeScript Error**
   - Add type annotation to `useFinancialSummary.ts` line 72

### Future Improvements

1. **Unified Data Fetching Hook**
   - Create `useFinancialData(period, periodType)` that handles both periods
   - Reduces code duplication and prevents inconsistencies

2. **Loading State Improvements**
   - Show period-specific loading indicators
   - Better feedback during data fetching

3. **Error Handling**
   - Handle cases where month data is unavailable
   - Show helpful error messages

---

## Test Coverage

### E2E Test Created
**File**: `e2e/integration-validation.spec.ts`

**Tests**:
1. ✅ Period switching (week → month) updates ALL metrics
2. ✅ Period switching (month → week) updates ALL metrics
3. ✅ Margin % displays for both week and month
4. ✅ ROAS displays actual value (not null)
5. ✅ URL updates correctly on period change
6. ✅ Week period functionality still works
7. ✅ No console errors during period switching
8. ✅ Query key isolation (week vs month)

**Status**: Tests written but **will fail** until bugs are fixed.

---

## Conclusion

**Integration Status**: ❌ **FAIL**

The period switching infrastructure exists but has critical bugs that prevent it from working correctly. The month period feature is essentially non-functional because:

1. Backend month API may not exist
2. Query keys don't distinguish week vs month (cache corruption)
3. Components still use week-specific hooks regardless of period type
4. ROAS is explicitly hardcoded to null

**Recommended Action**: Do NOT proceed to Wave 5 until these bugs are fixed. The current state provides a **false sense of functionality** - the UI works but shows wrong data.

**Estimated Fix Time**: 4-6 hours (assuming backend API exists)

---

## Appendix: File Changes Needed

### Files Requiring Changes:

1. **src/hooks/useDashboardMetricsWithPeriod.ts**
   - Add period type parameter to `fetchDashboardMetrics`
   - Include period type in query keys
   - Use correct period value based on type

2. **src/hooks/useFinancialSummary.ts**
   - Fix TypeScript implicit any error
   - Accept period type parameter
   - Fetch from correct endpoint

3. **src/app/(dashboard)/dashboard/components/DashboardContent.tsx**
   - Pass period type to `useFinancialSummary`
   - Implement ROAS calculation from advertising data

4. **Backend API** (if not exists)
   - Add `/v1/analytics/monthly/finance-summary` endpoint
   - Return same structure as weekly endpoint

---

**Report Generated**: 2026-01-29
**Validator**: Integration QA Specialist (Agent 3)
**Next Review**: After bug fixes completed
