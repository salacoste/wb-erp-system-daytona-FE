# Period Selection Bug Fix

**Date**: 2026-01-30
**Epic**: Epic 60 - Dashboard UX Improvements
**Story**: 60.1-FE - Period State Management
**Severity**: Critical (404 errors preventing access to monthly analytics)

---

## Problem Description

When users clicked the "Month" button on the dashboard to switch from weekly to monthly view, the application would return a 404 error because no data existed for the selected period.

### Root Cause

The code was using the **currently selected week** (which could be the incomplete current week) to derive the month, instead of using the **last completed week**.

**Scenario:**
- Current date: 2026-01-30 (Friday)
- Current week: 2026-W05 (incomplete, no data yet)
- Last completed week: 2026-W04 (has data)
- Backend data available: Weeks 2025-W47 through 2026-W04

**User flow:**
1. User navigates to dashboard
2. Current week (2026-W05) is selected by default
3. User clicks "Month" button to switch to monthly view
4. Code derives month from 2026-W05 → 2026-02
5. Backend has no data for 2026-02 → 404 error

**Expected behavior:**
1. User navigates to dashboard
2. Current week (2026-W05) is selected by default
3. User clicks "Month" button
4. Code derives month from last completed week (2026-W04) → 2026-01
5. Backend has data for 2026-01 → success

---

## Solution

Modified the `setPeriodType` callback in `dashboard-period-context.tsx` to derive the month from the **last completed week** instead of the currently selected week.

### Code Changes

**File**: `src/contexts/dashboard-period-context.tsx`

#### Change 1: Fix setPeriodType callback

**Before:**
```typescript
const setPeriodType = useCallback(
  (type: PeriodType) => {
    setPeriodTypeState(type)
    setStoredPeriodType(type)
    if (type === 'month') {
      const derivedMonth = getMonthFromWeek(selectedWeek) // ❌ Uses selected week
      setSelectedMonthState(derivedMonth)
      syncToUrl(selectedWeek, derivedMonth, type)
    } else {
      syncToUrl(selectedWeek, selectedMonth, type)
    }
  },
  [selectedWeek, selectedMonth, syncToUrl]
)
```

**After:**
```typescript
const setPeriodType = useCallback(
  (type: PeriodType) => {
    setPeriodTypeState(type)
    setStoredPeriodType(type)
    if (type === 'month') {
      // ✅ Use last completed week instead of selected week
      const lastCompletedWeek = getLastCompletedWeek()
      const derivedMonth = getMonthFromWeek(lastCompletedWeek)
      setSelectedMonthState(derivedMonth)
      syncToUrl(selectedWeek, derivedMonth, type)
    } else {
      syncToUrl(selectedWeek, selectedMonth, type)
    }
  },
  [selectedWeek, selectedMonth, syncToUrl]
)
```

#### Change 2: Fix initial month initialization

**Before:**
```typescript
// Initialize selected month: URL > derived from week
const [selectedMonth, setSelectedMonthState] = useState<string>(() => {
  if (urlMonth && isValidMonthFormat(urlMonth)) return urlMonth
  return getMonthFromWeek(selectedWeek) // ❌ Uses selectedWeek from URL
})
```

**After:**
```typescript
// Initialize selected month: URL > derived from last completed week
const [selectedMonth, setSelectedMonthState] = useState<string>(() => {
  if (urlMonth && isValidMonthFormat(urlMonth)) return urlMonth
  // ✅ Use defaultWeek (last completed week) to derive initial month
  return getMonthFromWeek(defaultWeek)
})
```

---

## Implementation Details

### Key Functions

**`getLastCompletedWeek()`** (from `src/lib/margin-helpers.ts`)
- Calculates the last completed week based on day of week and time
- **Monday**: W-2 (2 weeks ago, data not ready)
- **Tuesday before 12:00**: W-2 (conservative, data may not be ready)
- **Tuesday after 12:00**: W-1 (past week, data should be ready)
- **Wednesday-Sunday**: W-1 (past week, data should be ready)

**`getMonthFromWeek()`** (from `src/lib/period-helpers.ts`)
- Derives the month containing a week based on the **Thursday/midpoint rule**
- ISO weeks belong to the month where Thursday falls
- Example: 2026-W04 (Jan 19-25) has Thursday on Jan 23 → month is 2026-01

### Week Completeness Logic

The backend and frontend both follow the same logic for determining week completeness:

| Day of Week | Time | Last Completed Week | Example (2026-01-30) |
|-------------|------|---------------------|---------------------|
| Monday | Any | W-2 | 2026-W03 |
| Tuesday | Before 12:00 | W-2 | 2026-W03 |
| Tuesday | After 12:00 | W-1 | 2026-W04 |
| Wednesday - Sunday | Any | W-1 | 2026-W04 |

**Current date: 2026-01-30 (Friday)**
- Current week: 2026-W05 (Jan 26 - Feb 1)
- Last completed week: **2026-W04** (Jan 19 - Jan 25)
- Month derived from 2026-W04: **2026-01**

---

## Testing

### Test File

**Location**: `src/contexts/__tests__/dashboard-period-context.bug-fix.test.tsx`

### Test Coverage

1. **Basic bug fix**: Verifies month is derived from last completed week when switching to month period
2. **Incomplete week handling**: Ensures incomplete current week is not used
3. **URL parameter handling**: Tests that URL week (even if incomplete) doesn't affect initial month
4. **Multiple week scenarios**: Tests various week-to-month mappings
5. **Period switching**: Verifies toggling between week and month works correctly
6. **Edge cases**: Handles weeks at month/year boundaries

### Running Tests

```bash
npm test -- dashboard-period-context.bug-fix.test.tsx
```

---

## Verification Steps

To verify the fix works correctly:

1. **Navigate to dashboard**
   - Should see current week selected (2026-W05)
   - Week data should load successfully

2. **Click "Month" button**
   - Period should switch to month view
   - Month should be 2026-01 (derived from 2026-W04, not 2026-W05)
   - Data should load successfully without 404 error

3. **Verify comparison period**
   - Previous month should be 2025-12
   - Month-over-month comparison should work correctly

4. **Test week navigation**
   - Select different weeks from dropdown
   - Each week selection should update the month accordingly
   - Only weeks with data should be selectable

---

## Related Files

### Modified Files
- `src/contexts/dashboard-period-context.tsx` - Period state management context
- `src/contexts/__tests__/dashboard-period-context.bug-fix.test.tsx` - Bug fix tests

### Related Files (not modified)
- `src/hooks/useDashboardPeriod.ts` - Consumer hook (re-exports from context)
- `src/lib/margin-helpers.ts` - `getLastCompletedWeek()` function
- `src/lib/period-helpers.ts` - `getMonthFromWeek()` function
- `src/components/custom/DashboardPeriodSelector.tsx` - UI component

---

## Impact Assessment

### User Impact
- **Before**: Users clicking "Month" button would encounter 404 errors
- **After**: Users can successfully switch to monthly view using last completed week's month

### Performance Impact
- **Negligible**: Only adds one function call (`getLastCompletedWeek()`) when switching to month view
- No additional API calls or data fetching

### Breaking Changes
- **None**: The fix is backward compatible
- Only affects the derived month when switching to month period type
- Does not affect week period type or manual month selection

---

## Future Considerations

### Potential Enhancements
1. **Warning indicator**: Show warning when current incomplete week is selected
2. **Auto-refresh**: Automatically refresh when week completes
3. **Data availability indicator**: Visual cue showing which periods have data

### Related Work
- Epic 60, Story 60.3-FE: Period Comparison Visualization
- Epic 60, Story 60.4-FE: Period Persistence and URL Sync

---

## References

- **Product Requirements**: `docs/prd.md`
- **Business Logic**: `docs/BUSINESS-LOGIC-REFERENCE.md`
- **Week Definition**: `CLAUDE.md` - "Week Definition" section
- **Epic 60 Documentation**: `docs/epics/epic-60-fe-dashboard-ux-improvements.md`

---

## Changelog

### 2026-01-30
- **Fixed**: Critical bug causing 404 errors when switching to month period
- **Added**: Comprehensive test coverage for the bug fix
- **Documented**: Root cause analysis and solution

---

**Author**: Claude Code (SuperClaude)
**Reviewed**: Pending
**Status**: Ready for Testing
