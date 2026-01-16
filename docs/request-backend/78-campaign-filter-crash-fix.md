# Request #78: Campaign Filter Crash Fix + Multi-Select UX

**Date**: 2025-12-26
**Type**: Bug Fix + UX Enhancement
**Priority**: Critical
**Status**: ✅ Fixed

---

## Problem 1: Campaign Filter Crash

При выборе кампании в фильтре страница рекламной аналитики падала с ошибкой:

```
Error: Validation failed
Details: campaign_ids must be an array
```

**Screenshot**: Интерфейс падает при клике на кампанию в Campaign Selector dropdown.

## Problem 2: Dropdown Auto-Closes on Selection

После исправления проблемы с backend, dropdown закрывался сразу при клике на кампанию, что мешало выбору нескольких кампаний.

**UX Requirements**:
- Dropdown должен оставаться открытым при выборе/отмене выбора кампаний
- Dropdown должен закрываться только по кнопке "Готово", при клике вне dropdown или при нажатии Escape

## Problem 3: Filters Hidden in Empty State

При отсутствии данных фильтры не отображались, и пользователь не мог снять активные фильтры.

---

## Root Cause Analysis

### 1. Backend Validation (NestJS DTO)

Backend ожидает `campaign_ids` как **массив чисел** (источник: `src/analytics/dto/query/advertising-query.dto.ts:73-82`):

```typescript
@IsArray()
@Type(() => Number)
@IsInt({ each: true })
campaign_ids?: number[];
```

### 2. Frontend Type Mismatch

**До исправления** (`src/types/advertising-analytics.ts:332`):
```typescript
campaign_ids?: string; // ❌ Comma-separated string
```

**Frontend отправлял**:
```
campaign_ids=12345,67890  // ❌ String (not array!)
```

### 3. NestJS Query Param Quirk

**NestJS parses query params**:
- `campaign_ids=123` → **string** (не массив!) ❌
- `campaign_ids=123&campaign_ids=456` → **array** ✅

Когда параметр передаётся **один раз**, NestJS парсит его как строку, а `@IsArray()` validator fails.

---

## Solution

### Change 1: Fix Frontend Type Definition

**File**: `src/types/advertising-analytics.ts:332`

```typescript
// BEFORE
campaign_ids?: string; // Comma-separated

// AFTER
campaign_ids?: number[]; // Array of numbers
```

### Change 2: Update Page Component

**File**: `src/app/(dashboard)/analytics/advertising/page.tsx:114`

```typescript
// BEFORE
campaign_ids: selectedCampaigns.length > 0
  ? selectedCampaigns.join(',')  // ❌ "12345,67890"
  : undefined

// AFTER
campaign_ids: selectedCampaigns.length > 0
  ? selectedCampaigns  // ✅ [12345, 67890]
  : undefined
```

### Change 3: Fix buildQueryString (NestJS Quirk Workaround)

**File**: `src/lib/api/advertising-analytics.ts:57-82`

```typescript
function buildQueryString(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue

    if (Array.isArray(value)) {
      if (value.length === 0) continue

      // NestJS quirk: single param = string, repeated param = array
      // For arrays with 1 element, send parameter twice to force array parsing
      if (value.length === 1) {
        searchParams.append(key, String(value[0]))
        searchParams.append(key, String(value[0]))  // ✅ Workaround
      } else {
        value.forEach((item) => {
          searchParams.append(key, String(item))
        })
      }
    } else {
      searchParams.append(key, String(value))
    }
  }

  return searchParams.toString()
}
```

**Generated URLs**:
- 1 campaign: `campaign_ids=12345&campaign_ids=12345` ✅ (sent twice)
- 2+ campaigns: `campaign_ids=12345&campaign_ids=67890` ✅

### Change 4: UX Enhancements - Multi-Select Mode

**File**: `src/app/(dashboard)/analytics/advertising/components/CampaignSelector.tsx`

#### A. Quick Clear Button (lines 149-162)

Added "X" button next to Campaign Selector for quick filter clearing:

```typescript
{/* Quick Clear Button - visible when filter is active */}
{selectedIds.length > 0 && (
  <Button
    variant="outline"
    size="icon"
    onClick={clearAll}
    disabled={disabled || isLoading}
    aria-label="Очистить фильтр"
    title="Очистить фильтр"
    className="shrink-0"
  >
    <X className="h-4 w-4" />
  </Button>
)}
```

#### B. Manual Close Control (lines 126-131)

Updated popover state management to prevent auto-closing on item clicks:

```typescript
// Handle popover open state changes
const handleOpenChange = useCallback((newOpen: boolean) => {
  // Always allow opening
  // Only allow closing via Done button or clicking outside (not via item clicks)
  setOpen(newOpen)
}, [])
```

#### C. Event Bubbling Prevention (lines 164-179)

Wrapped PopoverContent in event-blocking div to prevent clicks from closing dropdown:

```typescript
<PopoverContent
  className="w-[450px] p-0"
  align="start"
  onKeyDown={handleKeyDown}
  onPointerDownOutside={() => setOpen(false)}
  onEscapeKeyDown={() => setOpen(false)}
  onInteractOutside={(e) => {
    // Prevent default behavior - we handle closing manually
    e.preventDefault()
  }}
>
  {/* Wrapper to prevent event bubbling that closes the popover */}
  <div
    onPointerDown={(e) => e.stopPropagation()}
    onClick={(e) => e.stopPropagation()}
  >
    {/* All dropdown content here */}
  </div>
</PopoverContent>
```

#### D. Done Button (lines 254-267)

Added visible "Готово" button in footer with blue variant for better visibility:

```typescript
{/* Footer: Selection Summary + Close Button */}
<div className="border-t px-3 py-2 flex items-center justify-between">
  <div className="text-xs text-muted-foreground">
    {selectedIds.length > 0 ? `Выбрано: ${selectedIds.length}` : 'Не выбрано'}
  </div>
  <Button
    size="sm"
    variant="default"  // Blue button for visibility
    onClick={() => setOpen(false)}
    className="h-7 text-xs"
  >
    Готово
  </Button>
</div>
```

#### E. Campaign Item Event Handling (lines 283-295)

Enhanced CampaignItem to prevent all event bubbling:

```typescript
function CampaignItem({ campaign, isSelected, onToggle }: CampaignItemProps) {
  // Prevent ALL event bubbling to keep dropdown open
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onToggle()
  }

  // Prevent checkbox events from bubbling
  const handleCheckboxInteraction = (e: React.MouseEvent | React.PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  return (
    <div onClick={handleClick} onPointerDown={handleCheckboxInteraction}>
      <Checkbox
        checked={isSelected}
        onPointerDown={handleCheckboxInteraction}
        onClick={handleCheckboxInteraction}
        className="pointer-events-none"
      />
      {/* ... */}
    </div>
  )
}
```

### Change 5: Empty State Filter Visibility

**File**: `src/app/(dashboard)/analytics/advertising/page.tsx:222-267`

Added Campaign Selector and Efficiency Filter to empty state:

```typescript
// Empty state (only show when not loading and no data at all)
if (!hasData && !isLoading && page === 1 && efficiencyFilter === 'all') {
  return (
    <div className="space-y-6">
      <AdvertisingPageHeader />

      {/* Still show filters for changing period */}
      <AdvertisingFilters
        dateRange={dateRange}
        onDateRangeChange={handleDateRangeChange}
        viewBy={viewBy}
        onViewByChange={handleViewByChange}
      />

      <Card>
        {/* Show Campaign + Efficiency filters even in empty state */}
        <CardHeader className="flex flex-row items-end justify-between space-y-0 pb-4">
          <div className="flex items-end gap-3">
            <CampaignSelector
              selectedIds={selectedCampaigns}
              onSelectionChange={handleCampaignFilterChange}
              disabled={isLoading}
            />
            <EfficiencyFilterDropdown
              value={efficiencyFilter}
              onChange={handleEfficiencyFilterChange}
              disabled={isLoading}
            />
          </div>
        </CardHeader>
        {/* ... empty state message ... */}
      </Card>
    </div>
  )
}
```

---

## Testing

### Test Cases

**Test 1: Empty Array**
```
Input:  { campaign_ids: [] }
Output: ""
Result: ✅ Pass
```

**Test 2: Single Campaign**
```
Input:  { campaign_ids: [12345] }
Output: "campaign_ids=12345&campaign_ids=12345"
Result: ✅ Pass (param sent twice - NestJS workaround)
```

**Test 3: Multiple Campaigns**
```
Input:  { campaign_ids: [12345, 67890] }
Output: "campaign_ids=12345&campaign_ids=67890"
Result: ✅ Pass
```

**Test 4: Full Request**
```
Input:  {
  from: '2025-12-01',
  to: '2025-12-21',
  view_by: 'sku',
  campaign_ids: [15981328]
}
Output: "from=2025-12-01&to=2025-12-21&view_by=sku&campaign_ids=15981328&campaign_ids=15981328"
Result: ✅ Pass
```

### Backend Validation Test

```bash
# Before fix (❌ Failed)
curl ".../advertising?campaign_ids=12345"
→ Error: "campaign_ids must be an array"

# After fix (✅ Pass)
curl ".../advertising?campaign_ids=12345&campaign_ids=12345"
→ Success: 200 OK
```

### UX Test Cases

**Test 5: Multi-Select Mode**
```
Action: Click multiple campaigns in dropdown
Expected: Dropdown stays open, all selections visible
Result: ✅ Pass
```

**Test 6: Done Button**
```
Action: Click "Готово" button
Expected: Dropdown closes, filters applied
Result: ✅ Pass
```

**Test 7: Click Outside**
```
Action: Click anywhere outside dropdown
Expected: Dropdown closes
Result: ✅ Pass
```

**Test 8: Escape Key**
```
Action: Press Escape while dropdown is open
Expected: Dropdown closes
Result: ✅ Pass
```

**Test 9: Quick Clear Button**
```
Action: Click "X" button next to Campaign Selector
Expected: All selections cleared, filters reset
Result: ✅ Pass
```

**Test 10: Empty State Filters**
```
Action: No data available, filters active
Expected: Campaign Selector visible, can clear filter
Result: ✅ Pass
```

---

## Files Modified

1. `src/types/advertising-analytics.ts` - Type definition (string → number[])
2. `src/lib/api/advertising-analytics.ts` - Add NestJS array parsing workaround
3. `src/app/(dashboard)/analytics/advertising/page.tsx` - Pass array, add empty state filters
4. `src/app/(dashboard)/analytics/advertising/components/CampaignSelector.tsx` - Multi-select mode, event handling
5. `docs/request-backend/78-campaign-filter-crash-fix.md` - This document

---

## Related Documentation

- **Backend DTO**: `/src/analytics/dto/query/advertising-query.dto.ts:73-82`
- **Epic 33**: `docs/request-backend/71-advertising-analytics-epic-33.md`
- **Request #76**: `docs/request-backend/76-efficiency-filter-not-implemented.md`
- **Request #77**: `docs/request-backend/77-roi-calculation-validation.md`

---

## Impact

### Bug Fixes
- ✅ **Fixed**: Campaign filter now works without crashing
- ✅ **Fixed**: Single campaign selection works (NestJS quirk handled)
- ✅ **Fixed**: Multiple campaign selection works
- ⚠️ **Note**: Parameter sent twice for single-element arrays (NestJS limitation)

### UX Improvements
- ✅ **Enhanced**: Multi-select mode - dropdown stays open during selection
- ✅ **Enhanced**: Quick clear button for one-click filter reset
- ✅ **Enhanced**: Visible "Готово" button (blue variant) clearly indicates how to close dropdown
- ✅ **Enhanced**: Filters remain accessible in empty state for easier filter management
- ✅ **Enhanced**: Proper event handling prevents accidental dropdown closing

### Technical Improvements
- ✅ **Improved**: Type safety (TypeScript enforces number[] array type)
- ✅ **Improved**: URL parameter handling (arrays as repeated parameters)
- ✅ **Improved**: Event bubbling control for better UX

---

## Next Steps

- [x] Fix type definition
- [x] Fix page component
- [x] Fix buildQueryString
- [x] Test single campaign
- [x] Test multiple campaigns
- [x] Add multi-select mode
- [x] Add quick clear button
- [x] Add Done button
- [x] Add event handling to prevent auto-close
- [x] Add filters to empty state
- [x] User manual testing (verify UI doesn't crash)
- [ ] Backend team to review (optional: support single param without duplication)
