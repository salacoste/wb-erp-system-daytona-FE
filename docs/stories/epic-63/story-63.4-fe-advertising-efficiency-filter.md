# Story 63.4-FE: Advertising Efficiency Filter UI

## Story Info

- **Epic**: 63-FE - Dashboard Business Logic (Frontend)
- **Priority**: Medium
- **Points**: 3
- **Status**: ✅ Complete
- **Sprint**: 14
- **Completion Date**: 2026-01-31

## User Story

**As a** seller analyzing advertising performance,
**I want** to filter campaigns and SKUs by efficiency status,
**So that** I can quickly focus on underperforming or high-performing items.

## Description (RU)

**Фильтр эффективности рекламы в UI**

Реализация фильтрации рекламных данных по категориям эффективности. Бэкенд поддерживает параметр `efficiency_filter` со значениями:
- `excellent` - Отличная эффективность (ROAS > 5, ROI > 100%)
- `good` - Хорошая эффективность (ROAS 3-5, ROI 50-100%)
- `moderate` - Умеренная эффективность (ROAS 2-3, ROI 20-50%)
- `poor` - Слабая эффективность (ROAS 1-2, ROI 0-20%)
- `loss` - Убыточная реклама (ROAS < 1, ROI < 0%)

UI включает:
- Чипы/фильтры с количеством элементов в каждой категории
- Применение фильтра к таблице кампаний/SKU
- Цветовая индикация категорий

## Acceptance Criteria

### AC1: Efficiency Filter Chips
- [ ] Display 5 filter chips: excellent, good, moderate, poor, loss
- [ ] Each chip shows count of items in that category
- [ ] Chips are color-coded per efficiency status
- [ ] Active filter chip is visually highlighted
- [ ] "Все" (All) option clears filter

### AC2: Filter Chip Colors
- [ ] `excellent` - Green (#22C55E)
- [ ] `good` - Light Green (#84CC16)
- [ ] `moderate` - Yellow (#EAB308)
- [ ] `poor` - Orange (#F97316)
- [ ] `loss` - Red (#EF4444)

### AC3: Filter Application
- [ ] Clicking chip applies `efficiency_filter` param to API request
- [ ] Table data updates to show only matching items
- [ ] URL updates with filter query param (`?efficiency=loss`)
- [ ] Filter persists on page refresh

### AC4: Count Display
- [ ] Counts fetched from summary endpoint or calculated from data
- [ ] Loading skeleton shown while fetching counts
- [ ] Zero-count chips remain visible but muted
- [ ] Total count shown next to "Все" chip

### AC5: Multi-Select Support (Optional)
- [ ] Allow selecting multiple efficiency categories (ctrl/cmd+click)
- [ ] OR: Single-select with toggle behavior (click again to deselect)
- [ ] Clear all filters button when filter active

### AC6: Integration Points
- [ ] Filter works in advertising table (campaign view)
- [ ] Filter works in SKU advertising view
- [ ] Filter syncs with URL search params
- [ ] Filter resets when switching view_by mode

### AC7: Accessibility
- [ ] Filter group has `role="group"` with aria-label
- [ ] Individual chips are keyboard navigable
- [ ] Active state announced to screen readers
- [ ] Focus visible on all interactive elements

## Technical Implementation

### API Query Parameter

```http
GET /v1/analytics/advertising?from=2026-01-24&to=2026-01-31&efficiency_filter=loss
```

Backend supports: `efficiency_filter` = `excellent` | `good` | `moderate` | `poor` | `loss` | `all` (default)

### API Response with Efficiency Classification

```typescript
// Each item in response.items contains:
{
  key: "sku:147205694",
  // ... other fields
  efficiency: {
    status: "good",           // EfficiencyStatus
    recommendation: null      // or string with action
  }
}
```

### Type Definitions

```typescript
// src/types/advertising-analytics.ts - Already exists
export type EfficiencyStatus =
  | 'excellent'
  | 'good'
  | 'moderate'
  | 'poor'
  | 'loss'
  | 'unknown';

// New: Efficiency counts for filter chips
export interface EfficiencyCountsSummary {
  excellent: number;
  good: number;
  moderate: number;
  poor: number;
  loss: number;
  total: number;
}
```

### Efficiency Filter Configuration

```typescript
// src/lib/efficiency-filter-utils.ts

export const efficiencyFilterConfig: Record<EfficiencyStatus, {
  label: string;
  color: string;
  bgColor: string;
  bgColorActive: string;
  borderColor: string;
  description: string;
  roasRange: string;
}> = {
  excellent: {
    label: 'Отлично',
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    bgColorActive: 'bg-green-100',
    borderColor: 'border-green-500',
    description: 'ROAS > 5, ROI > 100%',
    roasRange: 'ROAS > 5.0',
  },
  good: {
    label: 'Хорошо',
    color: 'text-lime-700',
    bgColor: 'bg-lime-50',
    bgColorActive: 'bg-lime-100',
    borderColor: 'border-lime-500',
    description: 'ROAS 3-5, ROI 50-100%',
    roasRange: 'ROAS 3.0-5.0',
  },
  moderate: {
    label: 'Умеренно',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-50',
    bgColorActive: 'bg-yellow-100',
    borderColor: 'border-yellow-500',
    description: 'ROAS 2-3, ROI 20-50%',
    roasRange: 'ROAS 2.0-3.0',
  },
  poor: {
    label: 'Слабо',
    color: 'text-orange-700',
    bgColor: 'bg-orange-50',
    bgColorActive: 'bg-orange-100',
    borderColor: 'border-orange-500',
    description: 'ROAS 1-2, ROI 0-20%',
    roasRange: 'ROAS 1.0-2.0',
  },
  loss: {
    label: 'Убыток',
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    bgColorActive: 'bg-red-100',
    borderColor: 'border-red-500',
    description: 'ROAS < 1, ROI < 0%',
    roasRange: 'ROAS < 1.0',
  },
  unknown: {
    label: 'Нет данных',
    color: 'text-gray-500',
    bgColor: 'bg-gray-50',
    bgColorActive: 'bg-gray-100',
    borderColor: 'border-gray-300',
    description: 'Нет данных о прибыли',
    roasRange: '—',
  },
};

// Calculate efficiency counts from data
export function calculateEfficiencyCounts(
  items: Array<{ efficiency_status: EfficiencyStatus }>
): EfficiencyCountsSummary {
  const counts = {
    excellent: 0,
    good: 0,
    moderate: 0,
    poor: 0,
    loss: 0,
    total: items.length,
  };

  items.forEach((item) => {
    if (item.efficiency_status in counts) {
      counts[item.efficiency_status]++;
    }
  });

  return counts;
}
```

### Filter Chips Component

```typescript
// src/components/custom/advertising/EfficiencyFilterChips.tsx
'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { efficiencyFilterConfig, type EfficiencyCountsSummary } from '@/lib/efficiency-filter-utils';
import type { EfficiencyStatus } from '@/types/advertising-analytics';

interface EfficiencyFilterChipsProps {
  counts: EfficiencyCountsSummary;
  isLoading?: boolean;
}

const FILTER_ORDER: EfficiencyStatus[] = ['excellent', 'good', 'moderate', 'poor', 'loss'];

export function EfficiencyFilterChips({ counts, isLoading }: EfficiencyFilterChipsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeFilter = searchParams.get('efficiency') as EfficiencyStatus | null;

  const handleFilterClick = (status: EfficiencyStatus | null) => {
    const params = new URLSearchParams(searchParams.toString());

    if (status === null || status === activeFilter) {
      // Clear filter or toggle off
      params.delete('efficiency');
    } else {
      params.set('efficiency', status);
    }

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  if (isLoading) {
    return (
      <div className="flex gap-2 overflow-x-auto pb-2">
        {FILTER_ORDER.map((status) => (
          <Skeleton key={status} className="h-7 w-20 rounded-full" />
        ))}
      </div>
    );
  }

  return (
    <div
      className="flex gap-2 overflow-x-auto pb-2"
      role="group"
      aria-label="Фильтр по эффективности рекламы"
    >
      {/* All items chip */}
      <FilterChip
        label="Все"
        count={counts.total}
        isActive={activeFilter === null}
        onClick={() => handleFilterClick(null)}
        variant="neutral"
      />

      {/* Efficiency status chips */}
      {FILTER_ORDER.map((status) => {
        const config = efficiencyFilterConfig[status];
        const count = counts[status];

        return (
          <FilterChip
            key={status}
            label={config.label}
            count={count}
            isActive={activeFilter === status}
            onClick={() => handleFilterClick(status)}
            config={config}
            description={config.description}
            disabled={count === 0}
          />
        );
      })}
    </div>
  );
}

interface FilterChipProps {
  label: string;
  count: number;
  isActive: boolean;
  onClick: () => void;
  config?: typeof efficiencyFilterConfig[EfficiencyStatus];
  variant?: 'neutral';
  description?: string;
  disabled?: boolean;
}

function FilterChip({
  label,
  count,
  isActive,
  onClick,
  config,
  variant,
  description,
  disabled,
}: FilterChipProps) {
  const isNeutral = variant === 'neutral';

  const chipClasses = cn(
    'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium',
    'cursor-pointer transition-all duration-150',
    'focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary',
    'border-2',
    {
      // Neutral variant (All)
      'bg-gray-100 text-gray-700 border-gray-300': isNeutral && !isActive,
      'bg-gray-200 text-gray-900 border-gray-500': isNeutral && isActive,
      // Colored variants
      [config?.bgColor ?? '']: !isNeutral && !isActive,
      [config?.bgColorActive ?? '']: !isNeutral && isActive,
      [config?.color ?? '']: !isNeutral,
      'border-transparent': !isActive,
      [config?.borderColor ?? '']: !isNeutral && isActive,
      // Disabled state
      'opacity-50 cursor-not-allowed': disabled,
    }
  );

  const chip = (
    <button
      className={chipClasses}
      onClick={onClick}
      disabled={disabled}
      aria-pressed={isActive}
      aria-label={`${label}: ${count} элементов${isActive ? ', выбрано' : ''}`}
    >
      <span>{label}</span>
      <Badge
        variant="secondary"
        className={cn(
          'ml-1 px-1.5 py-0 text-xs font-normal',
          isActive ? 'bg-white/50' : 'bg-black/5'
        )}
      >
        {count}
      </Badge>
    </button>
  );

  if (description) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{chip}</TooltipTrigger>
        <TooltipContent side="bottom" className="text-sm">
          {description}
        </TooltipContent>
      </Tooltip>
    );
  }

  return chip;
}
```

### Hook with Filter Support

```typescript
// src/hooks/use-advertising-analytics.ts - Update existing hook

export interface UseAdvertisingAnalyticsOptions {
  from: string;
  to: string;
  viewBy?: ViewByMode;
  efficiencyFilter?: EfficiencyStatus | 'all';  // NEW
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export function useAdvertisingAnalytics(options: UseAdvertisingAnalyticsOptions) {
  const { efficiencyFilter, ...rest } = options;

  return useQuery({
    queryKey: advertisingQueryKeys.analytics({
      ...rest,
      efficiency_filter: efficiencyFilter === 'all' ? undefined : efficiencyFilter,
    }),
    queryFn: () => getAdvertisingAnalytics({
      ...rest,
      efficiency_filter: efficiencyFilter === 'all' ? undefined : efficiencyFilter,
    }),
    enabled: !!options.from && !!options.to,
    staleTime: 60 * 1000,
  });
}
```

## Design Specifications

### Filter Chip Colors

| Status | Background | Active BG | Text Color | Hex |
|--------|------------|-----------|------------|-----|
| `excellent` | `bg-green-50` | `bg-green-100` | `text-green-700` | #22C55E |
| `good` | `bg-lime-50` | `bg-lime-100` | `text-lime-700` | #84CC16 |
| `moderate` | `bg-yellow-50` | `bg-yellow-100` | `text-yellow-700` | #EAB308 |
| `poor` | `bg-orange-50` | `bg-orange-100` | `text-orange-700` | #F97316 |
| `loss` | `bg-red-50` | `bg-red-100` | `text-red-700` | #EF4444 |

### Chip Dimensions
- Height: 28px (py-1)
- Padding: 12px horizontal (px-3)
- Border radius: full (rounded-full)
- Font size: 14px (text-sm)
- Gap between chips: 8px (gap-2)
- Border: 2px solid (active state)

### Count Badge
- Inside chip, right side
- Semi-transparent background
- Small text (text-xs)
- Rounded pill shape

### Layout
- Horizontal scroll on mobile if chips overflow
- Sticky position when scrolling table (optional)
- Responsive: Full width on mobile, inline on desktop

## Files to Create

```
src/
├── lib/
│   └── efficiency-filter-utils.ts              # NEW: Filter config & utilities
├── components/custom/advertising/
│   └── EfficiencyFilterChips.tsx               # NEW: Filter chips component
└── types/
    └── advertising-analytics.ts                # UPDATE: Add EfficiencyCountsSummary
```

## Files to Modify

| File | Changes |
|------|---------|
| `src/types/advertising-analytics.ts` | Add `EfficiencyCountsSummary` interface |
| `src/hooks/use-advertising-analytics.ts` | Add `efficiencyFilter` option support |
| `src/lib/api/advertising.ts` | Ensure `efficiency_filter` param passed to API |
| Advertising table page | Integrate filter chips component |

## Dependencies

- **Story 33.4-FE**: Existing efficiency status indicators and utilities
- **Story 63.1**: Dashboard main page API integration
- **Epic 33-FE**: Advertising analytics types and API

## Testing Requirements

### Unit Tests
- [ ] Filter chips render with correct counts
- [ ] Click handler updates URL params correctly
- [ ] Active filter visually highlighted
- [ ] Zero-count chips are disabled
- [ ] Toggle behavior works (click active to deselect)

### Integration Tests
- [ ] Filter param passed to API request
- [ ] Table data updates when filter applied
- [ ] URL persists filter on refresh
- [ ] Filter resets when changing view_by

### E2E Tests
- [ ] User can filter by efficiency status
- [ ] Counts update dynamically
- [ ] Navigation preserves filter state

### Accessibility Tests
- [ ] Chips keyboard navigable
- [ ] Screen reader announces active state
- [ ] Focus indicators visible
- [ ] Color not sole indicator (has label)

## Definition of Done

- [ ] Filter chips component created with all 5 statuses
- [ ] Color scheme matches design specification
- [ ] Counts calculated and displayed correctly
- [ ] Filter applies to API requests
- [ ] URL synchronization works
- [ ] All unit tests pass (>=80% coverage)
- [ ] TypeScript strict mode passes
- [ ] ESLint passes with no warnings
- [ ] All files <200 lines
- [ ] Accessibility audit passes
- [ ] WCAG AA color contrast verified

---

## Change Log

| Date | Author | Change |
|------|--------|--------|
| 2026-01-31 | PM Agent | Initial draft based on backend docs 123 |

---

## Notes

### Backend API Reference
- Endpoint: `GET /v1/analytics/advertising`
- Parameter: `efficiency_filter` = `excellent` | `good` | `moderate` | `poor` | `loss` | `all`
- Documentation: `docs/request-backend/123-DASHBOARD-MAIN-PAGE-EXPENSES-API.md`

### Efficiency Classification Rules
From backend documentation:

| Status | ROAS Condition | ROI Condition | Recommendation |
|--------|----------------|---------------|----------------|
| `excellent` | ROAS > 5 | ROI > 1 | Scale budget |
| `good` | ROAS 3-5 | ROI 0.5-1 | Maintain strategy |
| `moderate` | ROAS 2-3 | ROI 0.2-0.5 | Optimize targeting |
| `poor` | ROAS 1-2 | ROI 0-0.2 | Review bids |
| `loss` | ROAS < 1 | ROI < 0 | Stop/restructure |

### Relation to Story 33.4-FE
This story builds upon Story 33.4-FE (Efficiency Status Indicators) by:
- Adding filterable chips (not just display badges)
- Showing counts per category
- URL-based filter persistence
- Integration with API query params

### Alternative: Dropdown Filter
If horizontal space is limited, consider dropdown menu:
```tsx
<Select value={filter} onValueChange={setFilter}>
  <SelectTrigger className="w-[180px]">
    <SelectValue placeholder="Эффективность" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="all">Все ({counts.total})</SelectItem>
    <SelectItem value="excellent">Отлично ({counts.excellent})</SelectItem>
    ...
  </SelectContent>
</Select>
```

---

## Implementation

**Component**: `src/components/custom/dashboard/EfficiencyFilterChips.tsx`
**Config**: `src/lib/efficiency-filter-config.ts`
**Hook**: `src/hooks/useEfficiencyFilter.ts`
**Lines**: 157
**Key Features**:
- 5 color-coded filter chips (excellent, good, moderate, poor, loss)
- Count badge showing items per category
- URL param sync for shareable filtered views
- Toggle behavior (click active to deselect)
- Horizontal scroll on mobile
- Accessibility: role="group", aria-pressed, keyboard navigable

---

## Dev Agent Record

```
Status: Complete
Agent: Claude Code
Started: 2026-01-31
Completed: 2026-01-31
Notes: Implemented with all acceptance criteria met. Filter syncs with useSearchParams for URL persistence.
```
