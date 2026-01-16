# Bug Fix: Search Input Disappearing on Each Keystroke

**Date**: 2025-11-23
**Issue**: Product search input field disappeared and reappeared after each keystroke, preventing users from typing full queries
**Root Cause**: Component showed full-page skeleton loading state on every API call, hiding the search input
**Status**: ✅ **FIXED**

---

## Problem Description

User reported that when typing in the product search field "Поиск по артикулу или названию...", the entire component (including the input field) disappeared after each keystroke and reappeared after the API response. This made it impossible for users to type full search queries - only one character at a time.

**User Experience Before Fix**:
1. User types "3" → Component disappears → Loads → Shows results for "3"
2. User types "2" → Component disappears again → Loads → Shows results for "32"
3. User types "1" → Component disappears again → Loads → Shows results for "321"

**Problem**: User cannot type continuously because focus is lost on every keystroke.

---

## Root Cause Analysis

**Two Issues Combined**:

### Issue 1: No Debounce on Search Input
Every keystroke triggered an immediate API call:
```typescript
const { data, isLoading } = useProducts({
  search: search || undefined, // ❌ Immediate API call on every keystroke
  has_cogs,
  cursor,
  limit,
})
```

### Issue 2: Full-Page Skeleton on Every Loading State
When `isLoading` was true (even during search), the entire component was replaced with skeleton:
```typescript
if (isLoading) { // ❌ Shows skeleton on EVERY API call
  return <Skeleton /> // Hides search input completely
}
```

**Result**: Every keystroke → API call → `isLoading=true` → Component replaced with skeleton → Input field disappears → Focus lost

---

## The Fix

**Modified File**: `frontend/src/components/custom/ProductList.tsx`

### Fix 1: Add Debounce to Search Input

**Two-State Pattern**:
```typescript
// State 1: Immediate user input (shows in input field, no API delay)
const [searchInput, setSearchInput] = useState('')

// State 2: Debounced search value (sent to API after 500ms delay)
const [search, setSearch] = useState('')

// Debounce effect: wait 500ms after user stops typing
useEffect(() => {
  const timeoutId = setTimeout(() => {
    setSearch(searchInput) // Update API search after delay
  }, 500) // 500ms debounce delay

  return () => clearTimeout(timeoutId) // Cleanup timeout
}, [searchInput])
```

**How It Works**:
1. User types "3" → `searchInput` updates immediately (input shows "3")
2. Timer starts (500ms)
3. User types "2" → `searchInput` updates to "32", timer resets
4. User types "1" → `searchInput` updates to "321", timer resets
5. User stops typing → After 500ms, `search` updates to "321" → API call fires

**Benefits**:
- Input field is **always visible** and responsive
- API calls reduced by **~90%** (only after user stops typing)
- Better user experience and lower server load

### Fix 2: Show Skeleton Only on First Load

**Track First Load**:
```typescript
// Track if this is the first load vs subsequent searches
const [isFirstLoad, setIsFirstLoad] = useState(true)

useEffect(() => {
  if (data) {
    setIsFirstLoad(false) // After first successful load, never show skeleton again
  }
}, [data])
```

**Conditional Skeleton Display**:
```typescript
// BEFORE: Show skeleton on EVERY loading state
if (isLoading) { // ❌ Hides input on every search
  return <Skeleton />
}

// AFTER: Show skeleton ONLY on first load
if (isLoading && isFirstLoad) { // ✅ Only hide input on initial page load
  return <Skeleton />
}
```

**How It Works**:
- **First page load**: `isLoading=true` + `isFirstLoad=true` → Show skeleton (good UX)
- **Subsequent searches**: `isLoading=true` + `isFirstLoad=false` → Keep showing previous results with input field visible
- **Data updates**: API response arrives → Table updates with new data → Input field never lost focus

### Fix 3: Use Correct State in Input Field

**Input Field Binding**:
```typescript
<Input
  type="text"
  placeholder="Поиск по артикулу или названию..."
  value={searchInput} // ✅ Show immediate user input (not debounced value)
  onChange={(e) => handleSearchChange(e.target.value)}
  className="pl-10"
/>
```

**Handler Update**:
```typescript
const handleSearchChange = (value: string) => {
  setSearchInput(value) // ✅ Update immediate input (not debounced)
  setCursor(undefined) // Reset to first page on search
  setPrevCursors([]) // Clear cursor history
}
```

---

## Technical Details

### Debounce Pattern

**Classic Debounce Implementation**:
```typescript
useEffect(() => {
  // Set timer to update debounced value after delay
  const timeoutId = setTimeout(() => {
    setSearch(searchInput)
  }, 500)

  // Cleanup: cancel previous timer if input changes before delay completes
  return () => clearTimeout(timeoutId)
}, [searchInput]) // Re-run effect every time immediate input changes
```

**Why 500ms?**
- **Too short (100-200ms)**: Still many API calls, feels laggy
- **500ms**: Good balance - feels responsive but reduces API calls by 90%+
- **Too long (1000ms+)**: Feels unresponsive, users think it's broken

### Loading State Management

**Before Fix**:
```
User types → isLoading=true → Component REPLACED with skeleton → Focus lost
```

**After Fix**:
```
User types → searchInput updates → Input visible
  ↓ (500ms delay)
API call → isLoading=true → Previous data STILL VISIBLE → Input keeps focus
  ↓
API response → New data renders → Input keeps focus
```

---

## Testing Verification

**Before Fix**:
```
1. Type "3" → Input disappears → Loads → Shows results
2. Type "2" → Input disappears again → Loads → Shows results
3. Type "1" → Input disappears again → Loads → Shows results
Result: User frustration, cannot type continuously
```

**After Fix**:
```
1. Type "321" continuously → Input visible throughout → No API calls yet
2. Wait 500ms → API call fires ONCE → Results update → Input stays visible
Result: Smooth typing experience, single API call, focus never lost
```

### API Call Reduction

**Typing "Куртка Nike" (12 characters)**:
- **Before**: 12 API calls (one per keystroke)
- **After**: 1 API call (after user stops typing)
- **Savings**: 91.7% reduction in API calls

---

## Related Files

**Frontend**:
- `frontend/src/components/custom/ProductList.tsx` - Fixed component
  - Lines 46-47: Two-state pattern (`searchInput` + `search`)
  - Lines 55-63: Debounce effect
  - Lines 74-79: First load tracking
  - Lines 143-159: Conditional skeleton rendering
  - Lines 227, 191: Input field using `searchInput` state

---

## Best Practices Applied

### 1. Debounce User Input
✅ **Always debounce search inputs** to prevent API spam
✅ Use 500ms delay as standard (adjust based on UX testing)
✅ Keep immediate state for input field responsiveness

### 2. Preserve UI Elements During Loading
✅ Don't replace entire component with skeleton during data refresh
✅ Show previous data while loading new data (optimistic UI)
✅ Only show skeleton on first load when no data exists

### 3. Two-State Pattern for Search
✅ `inputValue` - Immediate user input (no delay, shows in input field)
✅ `debouncedValue` - Delayed value for API calls (reduces requests)
✅ Keep input field bound to immediate state for responsiveness

### 4. Focus Management
✅ Never remove input fields from DOM during loading
✅ Keep focus on active elements during async operations
✅ Use loading indicators (spinners) instead of replacing UI

---

## Code Pattern for Reuse

**Generic Debounce Hook** (for future components):
```typescript
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => clearTimeout(timeoutId)
  }, [value, delay])

  return debouncedValue
}

// Usage:
const [searchInput, setSearchInput] = useState('')
const debouncedSearch = useDebounce(searchInput, 500)

const { data } = useProducts({ search: debouncedSearch })
```

---

## Performance Impact

**Metrics Before Fix**:
- API calls per search query: 12+ (one per character)
- User complaints: Input unusable, focus lost
- Server load: High (many redundant requests)

**Metrics After Fix**:
- API calls per search query: 1 (after debounce)
- User experience: Smooth, continuous typing
- Server load: 90%+ reduction in search API calls

---

## Lessons Learned

1. **Always debounce search inputs** - Users type faster than API responds
2. **Don't replace UI during refresh** - Keep previous data visible
3. **Separate immediate and debounced state** - Best of both worlds
4. **Test focus management** - Ensure inputs don't lose focus during async ops
5. **Optimize for perceived performance** - Immediate UI updates + background loading

---

## Prevention for Future

**UI Component Checklist**:
- [ ] Does component hide input fields during loading?
- [ ] Are search inputs debounced (500ms standard)?
- [ ] Does loading state preserve existing UI elements?
- [ ] Is focus maintained during async operations?
- [ ] Are API calls minimized through debouncing/throttling?

**Code Review Questions**:
- "What happens to the input field when `isLoading` is true?"
- "How many API calls happen when user types a 10-character search?"
- "Does the user lose focus during async operations?"

---

## Status

✅ **FIXED** - Search input now allows continuous typing
✅ **OPTIMIZED** - 90%+ reduction in API calls
✅ **TESTED** - Smooth user experience verified
📝 **DOCUMENTED** - Pattern available for reuse in other components
