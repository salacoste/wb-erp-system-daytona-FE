# Story 44.16: Category Selection with Search

**Epic**: 44 - Price Calculator UI (Frontend)
**Status**: 📋 Ready for Dev
**Priority**: P0 - CRITICAL
**Effort**: 3 SP
**Depends On**: Story 44.1 (Types & API Client), Story 44.15 (Fulfillment Type)
**Requirements Ref**: PRICE-CALCULATOR-REQUIREMENTS.md Section 2, Step 2

---

## User Story

**As a** Seller,
**I want** to search and select a product category from WB's category list,
**So that** the correct commission rate is automatically applied to my price calculation.

**Non-goals**:
- Auto-detect category from existing products (Phase 2, per Question #3)
- Category favorites/recent selection
- Category tree navigation (flat searchable list only)
- Category image/icon display

---

## Background: WB Category Commissions

Wildberries has **7,346 product categories** with different commission rates.

### Category Structure
```json
{
  "parentID": 123,           // Use this as category_id
  "parentName": "Одежда",    // Parent category name
  "subjectName": "Платья",   // Sub-category name
  "paidStorageKgvp": 25,     // FBO commission %
  "kgvpMarketplace": 28      // FBS commission %
}
```

### Commission Variation
- FBO rates: 5-25% (varies by category)
- FBS rates: typically +3-4% higher than FBO
- Display format: "Одежда → Платья (25%)"

---

## Acceptance Criteria

### AC1: Category Combobox Component
- [ ] Create searchable combobox for category selection
- [ ] Display "parentName → subjectName" format in dropdown
- [ ] Display commission % preview for each option
- [ ] Placeholder: "Поиск категории..." (Search category)
- [ ] Support up to 7,346 categories efficiently

### AC2: Search/Filter Functionality
- [ ] Search by parent category name (partial match)
- [ ] Search by sub-category name (partial match)
- [ ] Case-insensitive search (Russian locale)
- [ ] Debounce search input (300ms)
- [ ] Highlight matching text in results
- [ ] Show max 50 results initially, load more on scroll

### AC3: Commission Preview
- [ ] Show FBO commission % when FBO selected (Story 44.15)
- [ ] Show FBS commission % when FBS selected
- [ ] Format: "25%" in badge next to category name
- [ ] Color-code high commission (>25%): yellow warning

### AC4: Selected State Display
- [ ] Show selected category in trigger button
- [ ] Format: "Одежда → Платья"
- [ ] Show commission % badge next to selection
- [ ] "×" button to clear selection

### AC5: Data Loading & Caching
- [ ] Fetch categories on page load (parallel with other data)
- [ ] Cache for 24 hours (per requirements)
- [ ] Show loading skeleton while fetching
- [ ] Handle API error with retry button
- [ ] ~50KB response, target <2s load time

### AC6: Form State Integration
- [ ] Store `category_id` (parentID) in form state
- [ ] Store category name for display
- [ ] On selection, auto-fill commission % field
- [ ] Clear selection on form reset
- [ ] Required field validation (cannot calculate without)

---

## Context & References

- **Requirements**: `PRICE-CALCULATOR-REQUIREMENTS.md` Section 2, Step 2
- **Parent Epic**: `docs/epics/epic-44-price-calculator-ui.md`
- **Story 44.15**: Fulfillment Type Selection (determines which commission field)
- **Backend API**: `GET /v1/tariffs/commissions` (7,346 categories)
- **Rate Limit**: 10 req/min (tariffs scope)

### API Response Structure

```json
{
  "data": {
    "commissions": [
      {
        "parentID": 123,
        "parentName": "Одежда",
        "subjectID": 456,
        "subjectName": "Платья",
        "paidStorageKgvp": 25,
        "kgvpMarketplace": 28,
        "kgvpSupplier": 10,
        "kgvpSupplierExpress": 5
      }
    ],
    "meta": {
      "total": 7346,
      "cached": true,
      "cache_ttl_seconds": 86400,
      "fetched_at": "2026-01-19T12:00:00Z"
    }
  }
}
```

---

## Implementation Notes

### File Structure

```
src/
├── components/
│   └── custom/
│       └── price-calculator/
│           ├── PriceCalculatorForm.tsx           # UPDATE - Add category selector
│           └── CategorySelector.tsx              # CREATE - Combobox component
├── lib/
│   └── api/
│       └── tariffs.ts                            # CREATE/UPDATE - API client
├── hooks/
│   └── useCommissions.ts                         # CREATE - TanStack Query hook
└── types/
    └── tariffs.ts                                # CREATE/UPDATE - Type definitions
```

### Type Definitions

```typescript
// src/types/tariffs.ts

export interface CategoryCommission {
  parentID: number
  parentName: string
  subjectID: number
  subjectName: string
  paidStorageKgvp: number      // FBO commission %
  kgvpMarketplace: number      // FBS commission %
  kgvpSupplier: number         // DBS (future)
  kgvpSupplierExpress: number  // EDBS (future)
}

export interface CommissionsResponse {
  commissions: CategoryCommission[]
  meta: {
    total: number
    cached: boolean
    cache_ttl_seconds: number
    fetched_at: string
  }
}
```

### Component Structure

```typescript
// src/components/custom/price-calculator/CategorySelector.tsx
'use client'

import { useState, useMemo } from 'react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, ChevronsUpDown, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCommissions } from '@/hooks/useCommissions'
import type { CategoryCommission, FulfillmentType } from '@/types/tariffs'

interface CategorySelectorProps {
  value: number | null                    // Selected category_id (parentID)
  onChange: (category: CategoryCommission | null) => void
  fulfillmentType: FulfillmentType
  disabled?: boolean
  error?: string
}

const MAX_VISIBLE_RESULTS = 50

export function CategorySelector({
  value,
  onChange,
  fulfillmentType,
  disabled,
  error,
}: CategorySelectorProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const { data: commissionsData, isLoading, error: apiError } = useCommissions()
  const categories = commissionsData?.commissions ?? []

  // Find selected category
  const selectedCategory = useMemo(() => {
    if (!value) return null
    return categories.find(c => c.parentID === value) ?? null
  }, [value, categories])

  // Filter and limit categories
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) {
      return categories.slice(0, MAX_VISIBLE_RESULTS)
    }

    const query = searchQuery.toLowerCase()
    return categories
      .filter(c =>
        c.parentName.toLowerCase().includes(query) ||
        c.subjectName.toLowerCase().includes(query)
      )
      .slice(0, MAX_VISIBLE_RESULTS)
  }, [categories, searchQuery])

  // Get commission % for display
  const getCommissionPct = (category: CategoryCommission) => {
    return fulfillmentType === 'FBO'
      ? category.paidStorageKgvp
      : category.kgvpMarketplace
  }

  if (isLoading) {
    return (
      <Button variant="outline" disabled className="w-full justify-start">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Загрузка категорий...
      </Button>
    )
  }

  if (apiError) {
    return (
      <div className="text-sm text-destructive">
        Ошибка загрузки категорий.
        <Button variant="link" className="h-auto p-0 ml-1">
          Повторить
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label="Выбрать категорию"
            disabled={disabled}
            className={cn(
              'w-full justify-between',
              error && 'border-destructive'
            )}
          >
            {selectedCategory ? (
              <span className="flex items-center gap-2 truncate">
                <span className="truncate">
                  {selectedCategory.parentName} → {selectedCategory.subjectName}
                </span>
                <Badge variant="secondary" className="ml-auto shrink-0">
                  {getCommissionPct(selectedCategory)}%
                </Badge>
              </span>
            ) : (
              <span className="text-muted-foreground">
                Выберите категорию...
              </span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-[400px] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Поиск категории..."
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList>
              <CommandEmpty>
                Категории не найдены
              </CommandEmpty>
              <CommandGroup>
                {filteredCategories.map((category) => {
                  const commissionPct = getCommissionPct(category)
                  const isHighCommission = commissionPct > 25

                  return (
                    <CommandItem
                      key={`${category.parentID}-${category.subjectID}`}
                      value={`${category.parentName} ${category.subjectName}`}
                      onSelect={() => {
                        onChange(category)
                        setOpen(false)
                      }}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          value === category.parentID ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      <span className="flex-1 truncate">
                        {category.parentName} → {category.subjectName}
                      </span>
                      <Badge
                        variant={isHighCommission ? 'destructive' : 'secondary'}
                        className="ml-2"
                      >
                        {commissionPct}%
                      </Badge>
                    </CommandItem>
                  )
                })}
              </CommandGroup>

              {filteredCategories.length === MAX_VISIBLE_RESULTS && (
                <div className="px-2 py-1.5 text-xs text-muted-foreground text-center">
                  Показаны первые {MAX_VISIBLE_RESULTS} результатов. Уточните поиск.
                </div>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Clear button when selected */}
      {selectedCategory && !disabled && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onChange(null)}
          className="h-6 px-2 text-xs text-muted-foreground"
        >
          <X className="h-3 w-3 mr-1" />
          Очистить выбор
        </Button>
      )}

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  )
}
```

### API Client

```typescript
// src/lib/api/tariffs.ts
import { apiClient } from '@/lib/api-client'
import type { CommissionsResponse } from '@/types/tariffs'

/**
 * Fetch all category commissions (7346 categories)
 * Cached for 24 hours
 */
export async function getCommissions(): Promise<CommissionsResponse> {
  console.info('[Tariffs] Fetching category commissions')
  const response = await apiClient.get<CommissionsResponse>('/v1/tariffs/commissions')
  console.info('[Tariffs] Loaded', response.meta.total, 'categories')
  return response
}
```

### React Query Hook

```typescript
// src/hooks/useCommissions.ts
import { useQuery } from '@tanstack/react-query'
import { getCommissions } from '@/lib/api/tariffs'

export const tariffsQueryKeys = {
  all: ['tariffs'] as const,
  commissions: () => [...tariffsQueryKeys.all, 'commissions'] as const,
}

export function useCommissions() {
  return useQuery({
    queryKey: tariffsQueryKeys.commissions(),
    queryFn: getCommissions,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    gcTime: 24 * 60 * 60 * 1000,    // 24 hours
    refetchOnWindowFocus: false,    // Don't refetch on focus (large dataset)
  })
}
```

### Form Data Updates

```typescript
// Update FormData interface in PriceCalculatorForm.tsx
interface FormData {
  category_id: number | null           // NEW - parentID from category
  category_name: string | null         // NEW - for display
  commission_pct: number               // Auto-filled from category
  // ... existing fields ...
}

// Update defaultValues
const defaultValues: FormData = {
  category_id: null,
  category_name: null,
  commission_pct: 25,  // Default FBO commission
  // ... existing defaults ...
}
```

### Form Integration

```typescript
// In PriceCalculatorForm.tsx

const fulfillmentType = watch('fulfillment_type')

// Handle category selection
const handleCategoryChange = (category: CategoryCommission | null) => {
  if (category) {
    setValue('category_id', category.parentID)
    setValue('category_name', `${category.parentName} → ${category.subjectName}`)

    // Auto-fill commission based on fulfillment type
    const commission = fulfillmentType === 'FBO'
      ? category.paidStorageKgvp
      : category.kgvpMarketplace
    setValue('commission_pct', commission)
  } else {
    setValue('category_id', null)
    setValue('category_name', null)
  }
}

// Update commission when fulfillment type changes
useEffect(() => {
  const categoryId = watch('category_id')
  if (categoryId && commissionsData) {
    const category = commissionsData.commissions.find(c => c.parentID === categoryId)
    if (category) {
      const commission = fulfillmentType === 'FBO'
        ? category.paidStorageKgvp
        : category.kgvpMarketplace
      setValue('commission_pct', commission)
    }
  }
}, [fulfillmentType, commissionsData])
```

### UI Layout

```
┌─────────────────────────────────────────────────────────────┐
│ Категория товара                                       [?]  │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Одежда → Платья                              [25%] [▼] │ │
│ └─────────────────────────────────────────────────────────┘ │
│ [× Очистить выбор]                                          │
└─────────────────────────────────────────────────────────────┘

Dropdown open:
┌─────────────────────────────────────────────────────────────┐
│ 🔍 Поиск категории...                                       │
├─────────────────────────────────────────────────────────────┤
│   ✓ Одежда → Платья                                  [25%] │
│     Одежда → Юбки                                    [25%] │
│     Одежда → Брюки                                   [25%] │
│     Электроника → Смартфоны                          [15%] │
│     Красота → Косметика                              [20%] │
│     ...                                                     │
├─────────────────────────────────────────────────────────────┤
│ Показаны первые 50 результатов. Уточните поиск.             │
└─────────────────────────────────────────────────────────────┘
```

### Invariants & Edge Cases

| Scenario | Handling |
|----------|----------|
| 7346 categories | Virtualized list, max 50 visible, search filters |
| No search results | Show "Категории не найдены" |
| API loading | Show loading skeleton button |
| API error | Show error message with retry button |
| Category selected, then fulfillment type changed | Update commission % automatically |
| Form reset | Clear category selection |
| Mobile viewport | Full-width dropdown, sheet-style on small screens |
| Duplicate parentID | Use `${parentID}-${subjectID}` as unique key |

---

## Observability

- **Analytics**: Track category search queries
- **Metrics**: Most selected categories, search-to-selection ratio
- **Logs**: Log API errors and slow queries (>2s)
- **Performance**: Monitor category list load time

---

## Security

- **Input Sanitization**: Sanitize search query before filtering
- **XSS Prevention**: No user-generated HTML in category names
- **API**: Categories endpoint requires authentication
- **Rate Limiting**: Client-side caching to avoid excessive API calls

---

## Accessibility (WCAG 2.1 AA)

- [ ] Combobox has `role="combobox"` and `aria-expanded`
- [ ] Options have `role="option"` and `aria-selected`
- [ ] Keyboard navigation: Tab, Enter, Escape, Arrow keys
- [ ] Screen reader announces selected category
- [ ] Color contrast ≥4.5:1 for all text
- [ ] Touch targets ≥44×44px
- [ ] Loading state announced to screen readers
- [ ] Error state has `role="alert"`

---

## Testing Requirements

### Unit Tests
- [ ] CategorySelector renders with loading state
- [ ] CategorySelector renders with categories
- [ ] Search filters categories correctly
- [ ] Selection triggers onChange callback
- [ ] Commission % displays based on fulfillment type

### Integration Tests
- [ ] Category selection updates form state
- [ ] Fulfillment type change updates commission
- [ ] Form reset clears category selection
- [ ] Error state shows retry button

### E2E Tests
- [ ] User can open category dropdown
- [ ] User can search for category by name
- [ ] User can select category from list
- [ ] Selected category displays in trigger
- [ ] Commission % updates on selection

---

## Dev Agent Record

### File List
| File | Change Type | Lines (Est.) | Description |
|------|-------------|--------------|-------------|
| `src/types/tariffs.ts` | CREATE | ~30 | Category commission types |
| `src/lib/api/tariffs.ts` | CREATE | ~20 | API client for commissions |
| `src/hooks/useCommissions.ts` | CREATE | ~20 | TanStack Query hook |
| `src/components/custom/price-calculator/CategorySelector.tsx` | CREATE | ~150 | Combobox component |
| `src/components/custom/price-calculator/PriceCalculatorForm.tsx` | UPDATE | +30 | Add category selector |

### Change Log
_(To be filled by Dev Agent during implementation)_

### Implementation Notes
_(To be filled by Dev Agent during implementation)_

### Review Follow-ups
_(To be filled by AI Code Review)_

---

## QA Results

_(To be filled after implementation)_

**Reviewer**:
**Date**:
**Gate Decision**:

### AC Verification
| AC | Requirement | Status | Evidence |
|----|-------------|--------|----------|
| AC1 | Category Combobox Component | ⏳ | |
| AC2 | Search/Filter Functionality | ⏳ | |
| AC3 | Commission Preview | ⏳ | |
| AC4 | Selected State Display | ⏳ | |
| AC5 | Data Loading & Caching | ⏳ | |
| AC6 | Form State Integration | ⏳ | |

### Performance Check
| Metric | Target | Status |
|--------|--------|--------|
| Category load time | <2s | ⏳ |
| Search filter time | <100ms | ⏳ |
| Selection update | <50ms | ⏳ |

---

## Definition of Done

- [ ] All Acceptance Criteria verified (AC1-AC6)
- [ ] Component created with proper TypeScript types
- [ ] Unit tests written and passing
- [ ] Integration tests with form flow
- [ ] Performance validated (<2s load, <100ms search)
- [ ] No ESLint errors
- [ ] Accessibility audit passed
- [ ] Code review completed
- [ ] Documentation updated
- [ ] QA Gate passed

---

**Created**: 2026-01-20
**Last Updated**: 2026-01-20
