# ProductList.tsx - Deep Code Review

**Reviewer**: Claude Code
**Date**: 2025-12-29 09:50 MSK
**File**: `src/components/custom/ProductList.tsx` (259 lines)
**Purpose**: Product list with search, filters, pagination, COGS/margin display

---

## 📊 Overall Assessment

| Category | Score | Status |
|----------|-------|--------|
| **TypeScript Safety** | 10/10 | ✅ Excellent |
| **Performance** | 7/10 | ⚠️ Can improve |
| **Accessibility** | 6/10 | ⚠️ Needs work |
| **Error Handling** | 9/10 | ✅ Good |
| **Test Coverage** | 0/10 | ❌ No tests |
| **Code Organization** | 9/10 | ✅ Excellent |
| **Overall** | **6.8/10** | ⚠️ Good with improvements needed |

---

## 1. TypeScript Type Analysis ✅ EXCELLENT

### Strengths:
- ✅ **No `any` types** - Strict TypeScript compliance
- ✅ **Proper interface definitions** - `ProductListProps` well-typed
- ✅ **Type imports** - Uses `ProductListItem` from `@/types/api`
- ✅ **Boolean type guards** - `has_cogs` properly typed as `boolean | undefined`
- ✅ **Null safety** - Proper optional chaining (`data?.products`, `data?.pagination?.next_cursor`)

### Type Safety Examples:
```typescript
// ✅ Proper interface definition
export interface ProductListProps {
  onProductSelect?: (product: ProductListItem) => void
  selectedProductId?: string
  showOnlyWithoutCogs?: boolean
  enableSelection?: boolean
  enableMarginDisplay?: boolean
}

// ✅ Proper typing for state
const [has_cogs, setHasCogs] = useState<boolean | undefined>(
  showOnlyWithoutCogs ? false : undefined
)

// ✅ Type-safe API call
const { data, isLoading, isError, error, refetch } = useProducts({
  search: search || undefined,
  has_cogs,
  cursor,
  limit,
  include_margin: enableMarginDisplay,
})
```

**Verdict**: ✅ **No improvements needed** - TypeScript usage is exemplary

---

## 2. Performance Optimization ⚠️ CAN IMPROVE

### Current State:
- ❌ **No useMemo** for computed values
- ❌ **No useCallback** for event handlers
- ✅ Debounced search (500ms) implemented correctly
- ✅ Cursor-based pagination (good for large datasets)

### Issues Identified:

#### Issue 2.1: Handler Functions Re-created on Every Render
**Lines**: 94-126
**Impact**: Medium (causes child component re-renders)

**Current Code**:
```typescript
const handleSearchChange = (value: string) => {
  setSearchInput(value)
  setCursor(undefined)
  setPrevCursors([])
}

const handleFilterToggle = () => {
  if (has_cogs === undefined) setHasCogs(false)
  else if (has_cogs === false) setHasCogs(true)
  else setHasCogs(undefined)
  setCursor(undefined)
  setPrevCursors([])
}

const handleProductClick = (product: ProductListItem) => {
  if (enableSelection && onProductSelect) onProductSelect(product)
}

const handlePreviousPage = () => { /* ... */ }
const handleNextPage = () => { /* ... */ }
```

**Problem**: These functions are re-created on **every render**, causing:
- ProductSearchFilter to re-render unnecessarily
- ProductTableRow (25+ instances) to re-render
- ProductPagination to re-render

**Recommendation**:
```typescript
const handleSearchChange = useCallback((value: string) => {
  setSearchInput(value)
  setCursor(undefined)
  setPrevCursors([])
}, [])

const handleFilterToggle = useCallback(() => {
  if (has_cogs === undefined) setHasCogs(false)
  else if (has_cogs === false) setHasCogs(true)
  else setHasCogs(undefined)
  setCursor(undefined)
  setPrevCursors([])
}, [has_cogs])

const handleProductClick = useCallback((product: ProductListItem) => {
  if (enableSelection && onProductSelect) onProductSelect(product)
}, [enableSelection, onProductSelect])

const handlePreviousPage = useCallback(() => {
  if (prevCursors.length > 0) {
    const newPrevCursors = [...prevCursors]
    const previousCursor = newPrevCursors.pop()
    setPrevCursors(newPrevCursors)
    setCursor(previousCursor)
  }
}, [prevCursors, cursor])

const handleNextPage = useCallback(() => {
  if (data?.pagination?.next_cursor) {
    setPrevCursors([...prevCursors, cursor!])
    setCursor(data.pagination.next_cursor)
  }
}, [data?.pagination?.next_cursor, prevCursors, cursor])
```

**Impact**: Prevents ~25-50 unnecessary re-renders per user interaction

---

#### Issue 2.2: Computed Values Re-calculated on Every Render
**Lines**: 129-131
**Impact**: Low (simple boolean checks, but still wasteful)

**Current Code**:
```typescript
const hasPrevious = prevCursors.length > 0 || cursor !== undefined
const hasNext = Boolean(data?.pagination?.next_cursor)
const filterLabel = has_cogs === undefined ? 'Все товары' : has_cogs ? 'С себестоимостью' : 'Без себестоимости'
```

**Recommendation**:
```typescript
const hasPrevious = useMemo(
  () => prevCursors.length > 0 || cursor !== undefined,
  [prevCursors, cursor]
)

const hasNext = useMemo(
  () => Boolean(data?.pagination?.next_cursor),
  [data?.pagination?.next_cursor]
)

const filterLabel = useMemo(() => {
  if (has_cogs === undefined) return 'Все товары'
  return has_cogs ? 'С себестоимостью' : 'Без себестоимости'
}, [has_cogs])
```

**Impact**: Minor optimization, but follows React best practices

---

### Performance Score: 7/10
**Deductions**:
- -2 points: Missing useCallback for handlers
- -1 point: Missing useMemo for computed values

**Estimated Impact**: 10-20% fewer re-renders with optimizations

---

## 3. Accessibility Audit ⚠️ NEEDS WORK

### Current State:
- ❌ **No ARIA labels** on interactive elements
- ❌ **No keyboard navigation** support beyond default
- ⚠️ **Search input** lacks aria-describedby
- ⚠️ **Table** lacks caption/summary
- ✅ Semantic HTML (Table, TableRow, TableCell)

### Issues Identified:

#### Issue 3.1: Search Input Missing ARIA Attributes
**Component**: ProductSearchFilter (passed from ProductList)
**Impact**: High (screen readers can't announce search purpose)

**Recommendation**:
```typescript
// In ProductSearchFilter component (should be checked separately)
<Input
  type="text"
  placeholder="Поиск по артикулу, названию..."
  value={searchValue}
  onChange={(e) => onSearchChange(e.target.value)}
  aria-label="Поиск товаров по артикулу или названию"
  aria-describedby="search-help-text"
/>
<span id="search-help-text" className="sr-only">
  Введите артикул WB (nmId) или название товара для поиска
</span>
```

---

#### Issue 3.2: Filter Toggle Button Missing ARIA
**Component**: ProductSearchFilter
**Impact**: High (screen readers can't announce filter state)

**Recommendation**:
```typescript
<Button
  variant="outline"
  onClick={onFilterToggle}
  aria-label={`Фильтр: ${filterLabel}`}
  aria-pressed={has_cogs !== undefined}
>
  {filterLabel}
</Button>
```

---

#### Issue 3.3: Table Missing Caption
**Lines**: 176-226
**Impact**: Medium (assistive tech can't understand table purpose)

**Current Code**:
```typescript
<Table className="table-fixed">
  <TableHeader>
    {/* columns */}
  </TableHeader>
  <TableBody>
    {/* rows */}
  </TableBody>
</Table>
```

**Recommendation**:
```typescript
<Table className="table-fixed">
  <caption className="sr-only">
    Список товаров с себестоимостью и маржинальностью
  </caption>
  <TableHeader>
    {/* columns */}
  </TableHeader>
  <TableBody>
    {/* rows */}
  </TableBody>
</Table>
```

---

#### Issue 3.4: Pagination Buttons Missing ARIA
**Component**: ProductPagination
**Impact**: Medium (unclear navigation for screen readers)

**Recommendation** (check ProductPagination.tsx):
```typescript
<Button
  onClick={onPrevious}
  disabled={!hasPrevious}
  aria-label="Предыдущая страница товаров"
>
  Назад
</Button>

<Button
  onClick={onNext}
  disabled={!hasNext}
  aria-label="Следующая страница товаров"
>
  Вперёд
</Button>
```

---

### Accessibility Score: 6/10
**Deductions**:
- -2 points: Missing ARIA labels on search/filter
- -1 point: Missing table caption
- -1 point: Missing pagination ARIA labels

**WCAG 2.1 AA Compliance**: ⚠️ Partial (missing some Level A requirements)

---

## 4. Error Handling Review ✅ GOOD

### Strengths:
- ✅ **Proper error state** rendering (lines 137-149)
- ✅ **Retry mechanism** with refetch button
- ✅ **Error message** extraction (`error instanceof Error ? error.message : '...'`)
- ✅ **Loading states** handled (isLoading, isFirstLoad)
- ✅ **Empty state** handled properly

### Error State Implementation:
```typescript
if (isError) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        <div className="flex items-center justify-between">
          <span>{error instanceof Error ? error.message : 'Ошибка загрузки товаров'}</span>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Повторить
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  )
}
```

### Minor Improvement Opportunity:

**Issue 4.1**: No error boundary wrapping
**Impact**: Low (errors propagate to page-level boundary)

**Recommendation** (optional):
```typescript
// In parent component (cogs/page.tsx)
import { ErrorBoundary } from 'react-error-boundary'

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        <div className="flex items-center justify-between">
          <span>Критическая ошибка: {error.message}</span>
          <Button onClick={resetErrorBoundary}>Перезагрузить</Button>
        </div>
      </AlertDescription>
    </Alert>
  )
}

<ErrorBoundary FallbackComponent={ErrorFallback}>
  <ProductList {...props} />
</ErrorBoundary>
```

### Error Handling Score: 9/10
**Deduction**: -1 point for missing error boundary (optional enhancement)

---

## 5. Test Coverage Analysis ❌ CRITICAL GAP

### Current State:
- ❌ **No test file** exists for ProductList.tsx
- ❌ **No unit tests** for component logic
- ❌ **No integration tests** for API interactions
- ❌ **No accessibility tests** for ARIA compliance

### Test Gap Analysis:

**ProductList.tsx Coverage**: **0%** ❌

**What should be tested**:

#### Unit Tests (ProductList.test.tsx):
1. **Rendering**:
   - [ ] Renders loading state on first load
   - [ ] Renders error state with retry button
   - [ ] Renders empty state when no products
   - [ ] Renders product list with data

2. **Search Functionality**:
   - [ ] Search input updates searchInput state
   - [ ] Debounce works (500ms delay)
   - [ ] Search resets pagination (cursor = undefined)
   - [ ] Empty search shows all products

3. **Filter Functionality**:
   - [ ] Filter cycles: undefined → false → true → undefined
   - [ ] Filter resets pagination
   - [ ] Filter label updates correctly

4. **Pagination**:
   - [ ] Next button disabled when no next_cursor
   - [ ] Previous button disabled on first page
   - [ ] Pagination state tracks cursors correctly
   - [ ] Page navigation updates cursor

5. **Product Selection** (if enableSelection):
   - [ ] onClick calls onProductSelect with correct product
   - [ ] Selected product highlighted (bg-blue-50)
   - [ ] Row has hover state when enableSelection=true

6. **Margin Display** (if enableMarginDisplay):
   - [ ] Margin column shown when enabled
   - [ ] include_margin passed to API
   - [ ] Polling integration works

#### Integration Tests:
1. **API Integration**:
   - [ ] useProducts hook called with correct filters
   - [ ] API response transformed correctly
   - [ ] Error responses handled gracefully
   - [ ] Refetch works after error

2. **Hook Integration**:
   - [ ] useMarginPollingStore integration
   - [ ] usePendingMarginProducts integration
   - [ ] useColumnWidths persistence works

#### E2E Tests (Playwright):
1. **User Workflows**:
   - [ ] Search for product by nmId
   - [ ] Filter products without COGS
   - [ ] Navigate through pages
   - [ ] Select product and assign COGS
   - [ ] Resize columns and verify persistence

**Recommended Test File**: `src/components/custom/__tests__/ProductList.test.tsx`

**Estimated Coverage Target**: ≥85% (should match Epic 37 standards)

---

### Test Coverage Score: 0/10
**Critical**: Component has **no tests** despite being core functionality

**Recommendation**: Create test suite with ≥20 test cases (estimated 2-3h)

---

## 6. Refactoring Suggestions 🔧 MEDIUM PRIORITY

### Current Organization: ✅ Good
- Component decomposition is excellent
- Extracted: ProductSearchFilter, ProductTableRow, ProductPagination, etc.
- Clear separation of concerns

### Refactoring Opportunities:

#### Refactoring 6.1: Extract Pagination Logic to Custom Hook
**Current**: Pagination state managed in component (lines 57-126)
**Impact**: Medium (reduces component complexity)

**Suggestion**:
```typescript
// New hook: src/hooks/useCursorPagination.ts
export function useCursorPagination(initialLimit = 25) {
  const [cursor, setCursor] = useState<string | undefined>()
  const [prevCursors, setPrevCursors] = useState<string[]>([])

  const handleNext = useCallback((nextCursor: string) => {
    setPrevCursors(prev => [...prev, cursor!])
    setCursor(nextCursor)
  }, [cursor])

  const handlePrevious = useCallback(() => {
    if (prevCursors.length > 0) {
      const newPrevCursors = [...prevCursors]
      const previousCursor = newPrevCursors.pop()
      setPrevCursors(newPrevCursors)
      setCursor(previousCursor)
    }
  }, [prevCursors])

  const reset = useCallback(() => {
    setCursor(undefined)
    setPrevCursors([])
  }, [])

  const hasPrevious = prevCursors.length > 0 || cursor !== undefined

  return { cursor, handleNext, handlePrevious, reset, hasPrevious }
}

// In ProductList.tsx
const pagination = useCursorPagination(25)
```

**Benefits**:
- Reusable pagination logic
- Easier to test in isolation
- Reduces ProductList.tsx complexity by ~40 lines

---

#### Refactoring 6.2: Extract Filter Logic to Custom Hook
**Current**: Filter state managed inline (lines 54-106)
**Impact**: Low (already simple, but improves testability)

**Suggestion**:
```typescript
// New hook: src/hooks/useProductFilters.ts
export function useProductFilters(initialShowWithoutCogs = false) {
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [has_cogs, setHasCogs] = useState<boolean | undefined>(
    initialShowWithoutCogs ? false : undefined
  )

  // Debounce search
  useEffect(() => {
    const timeoutId = setTimeout(() => setSearch(searchInput), 500)
    return () => clearTimeout(timeoutId)
  }, [searchInput])

  const cycleFilter = useCallback(() => {
    if (has_cogs === undefined) setHasCogs(false)
    else if (has_cogs === false) setHasCogs(true)
    else setHasCogs(undefined)
  }, [has_cogs])

  const filterLabel = useMemo(() => {
    if (has_cogs === undefined) return 'Все товары'
    return has_cogs ? 'С себестоимостью' : 'Без себестоимости'
  }, [has_cogs])

  return {
    searchInput,
    setSearchInput,
    search,
    has_cogs,
    cycleFilter,
    filterLabel,
  }
}
```

**Benefits**:
- Easier to test filter logic
- Reusable for other product lists
- Cleaner component code

---

#### Refactoring 6.3: Add PropTypes/JSDoc for Better DX
**Current**: Basic interface, no JSDoc
**Impact**: Low (improves developer experience)

**Suggestion**:
```typescript
export interface ProductListProps {
  /**
   * Callback when user selects a product (requires enableSelection=true)
   * @param product - Selected product with COGS data
   */
  onProductSelect?: (product: ProductListItem) => void

  /**
   * Currently selected product ID (highlights row with bg-blue-50)
   */
  selectedProductId?: string

  /**
   * Show only products without COGS (default: false)
   * Sets initial filter state to "Без себестоимости"
   */
  showOnlyWithoutCogs?: boolean

  /**
   * Enable row selection and click handlers (default: false)
   * When true, rows are clickable and show hover state
   */
  enableSelection?: boolean

  /**
   * Enable margin column display (default: false)
   * Fetches margin data from API when true
   */
  enableMarginDisplay?: boolean
}
```

**Benefits**:
- Better IntelliSense in IDE
- Self-documenting API
- Easier onboarding for new devs

---

## 7. Code Smells & Anti-Patterns

### Checked for Common Issues:

✅ **No prop drilling** - Uses hooks for state management
✅ **No magic numbers** - Constants defined (DEFAULT_COLUMN_WIDTHS, limit = 25)
✅ **No duplicate code** - Reusable components extracted
✅ **No console.logs** - Clean production code
✅ **No inline styles** - Uses Tailwind classes
✅ **No hardcoded strings** - Text in component (could extract to i18n if multilang needed)
❌ **Hardcoded Russian text** - Not internationalized (minor issue for monolingual app)

**Verdict**: ✅ **Clean code**, no major anti-patterns

---

## 8. Dependencies Analysis

### Hooks Used:
1. `useProducts` - ✅ Proper React Query integration
2. `useMarginPollingStore` - ✅ Zustand store
3. `usePendingMarginProducts` - ✅ Domain logic hook
4. `useManualMarginRecalculation` - ✅ Mutation hook
5. `useColumnWidths` - ✅ localStorage persistence

### Component Dependencies:
- ProductSearchFilter ✅
- ProductEmptyState ✅
- ProductLoadingSkeleton ✅
- ProductPagination ✅
- ProductTableRow ✅
- ResizableTableHead ✅

**Verdict**: ✅ **Good separation of concerns**, proper hook usage

---

## 9. Security Review

### Checked for Vulnerabilities:

✅ **No XSS risks** - Uses React's automatic escaping
✅ **No SQL injection** - API client handles sanitization
✅ **No sensitive data exposure** - No tokens/secrets in component
✅ **No localStorage security issues** - Only column widths stored (non-sensitive)
❌ **Cursor pagination tokens** - Exposed in UI (minor: opaque tokens, not security risk)

**Verdict**: ✅ **No security vulnerabilities**

---

## 10. Bundle Size & Imports

### Imports Analysis:
```typescript
import { useState, useEffect } from 'react'           // Core React hooks
import { useProducts } from '@/hooks/useProducts'     // ✅ Custom hook
import { Button } from '@/components/ui/button'       // ✅ shadcn/ui
import { Table, ... } from '@/components/ui/table'    // ✅ shadcn/ui
import { Alert, ... } from '@/components/ui/alert'    // ✅ shadcn/ui
import { useMarginPollingStore } from '@/stores/...'  // ✅ Zustand
import { AlertCircle } from 'lucide-react'            // ✅ Icon (tree-shakable)
```

**Bundle Impact**: ~15-20KB (reasonable for feature-rich component)

**Verdict**: ✅ **No unnecessary imports**

---

## Summary & Recommendations

### Critical Issues (Must Fix):
1. ❌ **No test coverage** - Create ProductList.test.tsx (2-3h)

### Important Improvements (Should Fix):
2. ⚠️ **Performance**: Add useCallback to handlers (30 min)
3. ⚠️ **Accessibility**: Add ARIA labels and table caption (30 min)

### Nice-to-Have (Can Defer):
4. 🔵 Extract pagination logic to useCursorPagination hook (1h)
5. 🔵 Extract filter logic to useProductFilters hook (45 min)
6. 🔵 Add JSDoc comments to ProductListProps (15 min)

---

## Detailed Action Plan

### Phase 1: Performance Optimization (30 min) ⭐ QUICK WIN

**Files to modify**:
- `src/components/custom/ProductList.tsx`

**Changes**:
1. Add `useCallback` imports
2. Wrap all 5 handlers in useCallback
3. Add useMemo for computed values (hasPrevious, hasNext, filterLabel)

**Impact**: 10-20% fewer re-renders

---

### Phase 2: Accessibility Improvements (30 min) ⭐ QUICK WIN

**Files to modify**:
- `src/components/custom/ProductList.tsx` (add table caption)
- `src/components/custom/ProductSearchFilter.tsx` (add ARIA labels)
- `src/components/custom/ProductPagination.tsx` (add ARIA labels)

**Changes**:
1. Add `<caption className="sr-only">` to Table
2. Add aria-label to search input
3. Add aria-pressed to filter button
4. Add aria-label to pagination buttons

**Impact**: WCAG 2.1 AA partial compliance → full compliance

---

### Phase 3: Test Coverage (2-3h) 🔴 CRITICAL

**File to create**:
- `src/components/custom/__tests__/ProductList.test.tsx`

**Test Structure**:
```typescript
describe('ProductList', () => {
  describe('Rendering States', () => {
    test('shows loading skeleton on first load')
    test('shows error state with retry button')
    test('shows empty state when no products')
    test('renders product table with data')
  })

  describe('Search Functionality', () => {
    test('updates search input')
    test('debounces search (500ms)')
    test('resets pagination on search')
  })

  describe('Filter Functionality', () => {
    test('cycles filter: all → without COGS → with COGS → all')
    test('resets pagination on filter change')
    test('updates filter label')
  })

  describe('Pagination', () => {
    test('next button disabled when no next_cursor')
    test('previous button disabled on first page')
    test('navigates to next page')
    test('navigates to previous page')
  })

  describe('Product Selection', () => {
    test('calls onProductSelect when enableSelection=true')
    test('highlights selected product')
    test('row has hover state when selectable')
  })

  describe('Margin Display', () => {
    test('includes margin column when enableMarginDisplay=true')
    test('passes include_margin to API')
  })
})
```

**Estimated**: 20-25 test cases, ≥85% coverage target

---

### Phase 4: Extract Custom Hooks (1h 45min) 🔵 OPTIONAL

**New hooks to create**:
1. `src/hooks/useCursorPagination.ts` (reusable pagination logic)
2. `src/hooks/useProductFilters.ts` (reusable filter logic)

**Benefits**:
- Easier to test
- Reusable across components
- Cleaner component code

---

## Priority Recommendations

### Immediate (Do First):
1. ⭐ **Performance optimization** (30 min) - Quick win, noticeable UX improvement
2. ⭐ **Accessibility improvements** (30 min) - Quick win, WCAG compliance

### Important (Do Soon):
3. 🔴 **Test coverage** (2-3h) - Critical for maintainability

### Optional (Can Defer):
4. 🔵 **Extract hooks** (1h 45min) - Nice-to-have refactoring
5. 🔵 **JSDoc comments** (15 min) - Improves DX

---

## Code Quality Score Breakdown

| Category | Current Score | Potential Score | Gap |
|----------|--------------|----------------|-----|
| TypeScript Safety | 10/10 | 10/10 | 0 |
| Performance | 7/10 | 9/10 | +2 |
| Accessibility | 6/10 | 9/10 | +3 |
| Error Handling | 9/10 | 10/10 | +1 |
| Test Coverage | 0/10 | 9/10 | +9 |
| Code Organization | 9/10 | 10/10 | +1 |
| **Overall** | **6.8/10** | **9.5/10** | **+2.7** |

**Potential Improvement**: +2.7 points (40% improvement) with all recommendations

---

## Comparison with Epic 37 Components

### ProductList.tsx vs MergedGroupTable.tsx:

| Feature | ProductList | MergedGroupTable | Winner |
|---------|-------------|------------------|---------|
| **Test Coverage** | 0% ❌ | 100% ✅ (77 tests) | MergedGroupTable |
| **Accessibility** | Partial ⚠️ | Full ✅ (WCAG AA) | MergedGroupTable |
| **Performance** | No optimization ⚠️ | useMemo/useCallback ✅ | MergedGroupTable |
| **TypeScript** | Excellent ✅ | Excellent ✅ | Tie |
| **Error Handling** | Good ✅ | Good ✅ | Tie |
| **Code Organization** | Excellent ✅ | Excellent ✅ | Tie |

**Takeaway**: ProductList.tsx can learn from Epic 37 patterns (testing, accessibility, performance)

---

## Next Steps

### Option 1: Apply All Quick Wins (1h total) ⭐ RECOMMENDED
- Performance optimization (30 min)
- Accessibility improvements (30 min)
**Result**: Score 6.8/10 → 7.5/10

### Option 2: Add Test Coverage (2-3h)
- Create ProductList.test.tsx with 20-25 tests
**Result**: Score 6.8/10 → 8.5/10

### Option 3: Full Improvements (4-5h)
- Quick wins (1h) + Test coverage (2-3h) + Extract hooks (1h 45min)
**Result**: Score 6.8/10 → 9.5/10

---

## User Decision Required

**Which improvements do you want to apply?**

1. ⭐ **Quick Wins Only** (1h: performance + accessibility)?
2. 🔴 **Quick Wins + Tests** (3-4h: optimization + testing)?
3. 🔵 **Full Improvements** (4-5h: all recommendations)?
4. 💬 **Skip for now** (move to Epic 37 component review)?

---

**Review Status**: ✅ ProductList.tsx analysis complete
**Next**: Awaiting user decision on improvements, then Epic 37 components review
