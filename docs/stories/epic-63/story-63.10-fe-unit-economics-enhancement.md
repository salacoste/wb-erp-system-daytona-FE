# Story 63.10-FE: Unit Economics Table Enhancement

## Story Info

- **Epic**: 63-FE - Dashboard Main Page Enhancement
- **Priority**: **High**
- **Points**: 3
- **Status**: ✅ Complete
- **Sprint**: 14
- **Completion Date**: 2026-01-31

## User Story

**As a** business owner,
**I want** an enhanced unit economics table with profitability status indicators and filtering,
**So that** I can quickly identify which products need attention and prioritize optimization efforts.

## Acceptance Criteria

### AC1: Profitability Status Column
- [ ] New column shows profitability status badge
- [ ] Badge uses color-coded indicator with icon
- [ ] Status derived from `net_margin_pct` field
- [ ] "Unknown" status for products without COGS

### AC2: Status Color Palette
- [ ] **Excellent** (>25%): Green `#22C55E` - "Отлично"
- [ ] **Good** (15-25%): Lime `#84CC16` - "Хорошо"
- [ ] **Warning** (5-15%): Yellow `#EAB308` - "Внимание"
- [ ] **Critical** (0-5%): Orange `#F97316` - "Критично"
- [ ] **Loss** (<0%): Red `#EF4444` - "Убыток"
- [ ] **Unknown** (no COGS): Gray `#9CA3AF` - "Нет данных"

### AC3: Filter by Profitability Status
- [ ] Dropdown filter with all status options
- [ ] Multi-select capability (filter by multiple statuses)
- [ ] "All" option to clear filter
- [ ] Filter persists during session
- [ ] URL params updated for shareable filtered views

### AC4: Sortable Columns
- [ ] All numeric columns sortable (click header)
- [ ] Sort indicator shows direction (asc/desc arrow)
- [ ] Default sort: revenue descending
- [ ] Sortable columns: Revenue, COGS%, Margin%, Net Profit

### AC5: Status Summary Banner
- [ ] Shows count by profitability status
- [ ] Clickable status counts to filter table
- [ ] Highlights products needing attention (loss/critical)
- [ ] Updates when filters applied

### AC6: Accessibility (WCAG 2.1 AA)
- [ ] Status badges have accessible labels (not color-only)
- [ ] Table headers have `scope="col"`
- [ ] Sort buttons have aria-labels
- [ ] Filter dropdown is keyboard navigable
- [ ] Screen reader announces sort state changes

## Tasks / Subtasks

### Phase 1: Profitability Status Badge
- [ ] Create `ProfitabilityBadge.tsx` component
- [ ] Implement status derivation logic
- [ ] Add tooltip with threshold explanation
- [ ] Handle "unknown" state for missing COGS

### Phase 2: Table Enhancement
- [ ] Add profitability status column to table
- [ ] Implement sortable column headers
- [ ] Add sort state management
- [ ] Update API query params for server-side sort

### Phase 3: Filter Implementation
- [ ] Create multi-select status filter dropdown
- [ ] Implement client-side filtering
- [ ] Sync filter state with URL params
- [ ] Add "clear filters" action

### Phase 4: Summary Banner
- [ ] Create `UnitEconomicsSummaryBanner.tsx`
- [ ] Calculate status counts from data
- [ ] Make counts clickable for quick filtering
- [ ] Style with appropriate colors

## Technical Details

### API Endpoint

```http
GET /v1/analytics/unit-economics?week=2026-W05&view_by=sku&sort_by=revenue&sort_order=desc&limit=100
Authorization: Bearer <JWT_TOKEN>
X-Cabinet-Id: <CABINET_UUID>
```

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `week` | string | required | ISO week (YYYY-Www) |
| `view_by` | enum | `sku` | `sku`, `brand`, `category`, `total` |
| `sort_by` | enum | `revenue` | `revenue`, `net_margin_pct`, `cogs_pct`, `total_costs_pct` |
| `sort_order` | enum | `desc` | `asc`, `desc` |
| `limit` | number | 100 | Max results (1-500) |

### Response Item Structure

```typescript
interface UnitEconomicsItem {
  sku_id: string;
  product_name: string;
  category?: string;
  brand?: string;
  revenue: number;
  units_sold?: number;
  costs_pct: CostsPct;
  costs_rub: CostsRub;
  total_costs_pct: number;
  net_margin_pct: number;
  net_profit: number;
  profitability_status: ProfitabilityStatus;
  has_cogs: boolean;
}
```

### Profitability Badge Component

```typescript
// src/components/custom/analytics/ProfitabilityBadge.tsx
'use client';

import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  XCircle,
  CheckCircle,
  HelpCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type ProfitabilityStatus =
  | 'excellent'
  | 'good'
  | 'warning'
  | 'critical'
  | 'loss'
  | 'unknown';

const STATUS_CONFIG: Record<ProfitabilityStatus, {
  label: string;
  color: string;
  bgColor: string;
  textColor: string;
  icon: React.ElementType;
  threshold: string;
  recommendation: string;
}> = {
  excellent: {
    label: 'Отлично',
    color: '#22C55E',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
    icon: TrendingUp,
    threshold: 'Маржа > 25%',
    recommendation: 'Поддерживайте текущую стратегию',
  },
  good: {
    label: 'Хорошо',
    color: '#84CC16',
    bgColor: 'bg-lime-100',
    textColor: 'text-lime-800',
    icon: CheckCircle,
    threshold: 'Маржа 15-25%',
    recommendation: 'Стабильная прибыльность',
  },
  warning: {
    label: 'Внимание',
    color: '#EAB308',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-800',
    icon: AlertTriangle,
    threshold: 'Маржа 5-15%',
    recommendation: 'Рассмотрите оптимизацию затрат',
  },
  critical: {
    label: 'Критично',
    color: '#F97316',
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-800',
    icon: TrendingDown,
    threshold: 'Маржа 0-5%',
    recommendation: 'Срочно пересмотрите ценообразование',
  },
  loss: {
    label: 'Убыток',
    color: '#EF4444',
    bgColor: 'bg-red-100',
    textColor: 'text-red-800',
    icon: XCircle,
    threshold: 'Маржа < 0%',
    recommendation: 'Остановите продажи или измените стратегию',
  },
  unknown: {
    label: 'Нет данных',
    color: '#9CA3AF',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-600',
    icon: HelpCircle,
    threshold: 'COGS не назначен',
    recommendation: 'Добавьте себестоимость для расчёта маржи',
  },
};

interface ProfitabilityBadgeProps {
  status: ProfitabilityStatus;
  showTooltip?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export function ProfitabilityBadge({
  status,
  showTooltip = true,
  size = 'sm',
  className,
}: ProfitabilityBadgeProps) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  const badge = (
    <Badge
      variant="secondary"
      className={cn(
        'inline-flex items-center gap-1',
        config.bgColor,
        config.textColor,
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm',
        className
      )}
    >
      <Icon className={size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} aria-hidden="true" />
      {config.label}
    </Badge>
  );

  if (!showTooltip) return badge;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{badge}</TooltipTrigger>
      <TooltipContent className="max-w-xs">
        <div className="space-y-1">
          <p className="font-medium">{config.label}</p>
          <p className="text-sm text-muted-foreground">{config.threshold}</p>
          <p className="text-sm">{config.recommendation}</p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

export function getProfitabilityStatus(
  marginPct: number | null | undefined,
  hasCogs: boolean
): ProfitabilityStatus {
  if (!hasCogs || marginPct === null || marginPct === undefined) {
    return 'unknown';
  }
  if (marginPct >= 25) return 'excellent';
  if (marginPct >= 15) return 'good';
  if (marginPct >= 5) return 'warning';
  if (marginPct >= 0) return 'critical';
  return 'loss';
}

export { STATUS_CONFIG };
```

### Status Filter Component

```typescript
// src/components/custom/analytics/ProfitabilityFilter.tsx
'use client';

import { useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Filter, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ProfitabilityStatus, STATUS_CONFIG } from './ProfitabilityBadge';

const ALL_STATUSES: ProfitabilityStatus[] = [
  'excellent',
  'good',
  'warning',
  'critical',
  'loss',
  'unknown',
];

interface ProfitabilityFilterProps {
  selectedStatuses: ProfitabilityStatus[];
  onFilterChange: (statuses: ProfitabilityStatus[]) => void;
}

export function ProfitabilityFilter({
  selectedStatuses,
  onFilterChange,
}: ProfitabilityFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const toggleStatus = useCallback(
    (status: ProfitabilityStatus) => {
      const newStatuses = selectedStatuses.includes(status)
        ? selectedStatuses.filter((s) => s !== status)
        : [...selectedStatuses, status];

      onFilterChange(newStatuses);

      // Update URL params
      const params = new URLSearchParams(searchParams.toString());
      if (newStatuses.length === 0 || newStatuses.length === ALL_STATUSES.length) {
        params.delete('status');
      } else {
        params.set('status', newStatuses.join(','));
      }
      router.push(`?${params.toString()}`, { scroll: false });
    },
    [selectedStatuses, onFilterChange, router, searchParams]
  );

  const clearFilter = useCallback(() => {
    onFilterChange([]);
    const params = new URLSearchParams(searchParams.toString());
    params.delete('status');
    router.push(`?${params.toString()}`, { scroll: false });
  }, [onFilterChange, router, searchParams]);

  const hasFilter = selectedStatuses.length > 0 && selectedStatuses.length < ALL_STATUSES.length;

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" />
            Статус
            {hasFilter && (
              <Badge variant="secondary" className="ml-1 px-1.5">
                {selectedStatuses.length}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>Фильтр по статусу</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {ALL_STATUSES.map((status) => {
            const config = STATUS_CONFIG[status];
            return (
              <DropdownMenuCheckboxItem
                key={status}
                checked={selectedStatuses.includes(status)}
                onCheckedChange={() => toggleStatus(status)}
              >
                <span
                  className="mr-2 h-2 w-2 rounded-full"
                  style={{ backgroundColor: config.color }}
                  aria-hidden="true"
                />
                {config.label}
              </DropdownMenuCheckboxItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      {hasFilter && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilter}
          className="gap-1 text-muted-foreground"
          aria-label="Сбросить фильтр"
        >
          <X className="h-3 w-3" />
          Сбросить
        </Button>
      )}
    </div>
  );
}
```

### Summary Banner Component

```typescript
// src/components/custom/analytics/UnitEconomicsSummaryBanner.tsx
'use client';

import { Card, CardContent } from '@/components/ui/card';
import { ProfitabilityStatus, STATUS_CONFIG } from './ProfitabilityBadge';
import { cn } from '@/lib/utils';

interface StatusCount {
  status: ProfitabilityStatus;
  count: number;
}

interface UnitEconomicsSummaryBannerProps {
  statusCounts: StatusCount[];
  onStatusClick: (status: ProfitabilityStatus) => void;
  className?: string;
}

export function UnitEconomicsSummaryBanner({
  statusCounts,
  onStatusClick,
  className,
}: UnitEconomicsSummaryBannerProps) {
  const total = statusCounts.reduce((sum, item) => sum + item.count, 0);
  const needsAttention = statusCounts
    .filter((item) => item.status === 'loss' || item.status === 'critical')
    .reduce((sum, item) => sum + item.count, 0);

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Всего: <span className="font-medium text-foreground">{total}</span> товаров
          </div>

          <div className="h-4 w-px bg-border" />

          <div className="flex flex-wrap gap-3">
            {statusCounts
              .filter((item) => item.count > 0)
              .map(({ status, count }) => {
                const config = STATUS_CONFIG[status];
                return (
                  <button
                    key={status}
                    onClick={() => onStatusClick(status)}
                    className={cn(
                      'flex items-center gap-1.5 px-2 py-1 rounded-md text-sm',
                      'hover:bg-accent transition-colors',
                      'focus:outline-none focus:ring-2 focus:ring-ring'
                    )}
                    aria-label={`Показать ${count} товаров со статусом ${config.label}`}
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: config.color }}
                      aria-hidden="true"
                    />
                    <span className="text-muted-foreground">{config.label}:</span>
                    <span className="font-medium">{count}</span>
                  </button>
                );
              })}
          </div>

          {needsAttention > 0 && (
            <>
              <div className="h-4 w-px bg-border" />
              <div className="text-sm">
                <span className="text-red-600 font-medium">
                  {needsAttention} товаров требуют внимания
                </span>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

### Enhanced Table Component

```typescript
// src/app/(dashboard)/analytics/unit-economics/components/UnitEconomicsTable.tsx
// Add sortable columns and profitability status

import { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { ProfitabilityBadge, getProfitabilityStatus } from './ProfitabilityBadge';
import { formatCurrency, formatPercentage } from '@/lib/utils';
import { UnitEconomicsItem } from '@/types/unit-economics';

type SortField = 'revenue' | 'net_margin_pct' | 'cogs_pct' | 'total_costs_pct' | 'net_profit';
type SortOrder = 'asc' | 'desc';

interface UnitEconomicsTableProps {
  data: UnitEconomicsItem[];
  onSort: (field: SortField, order: SortOrder) => void;
  currentSort: { field: SortField; order: SortOrder };
}

export function UnitEconomicsTable({ data, onSort, currentSort }: UnitEconomicsTableProps) {
  const sortColumn = (field: SortField) => {
    const newOrder =
      currentSort.field === field && currentSort.order === 'desc' ? 'asc' : 'desc';
    onSort(field, newOrder);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (currentSort.field !== field) {
      return <ArrowUpDown className="h-4 w-4 ml-1" />;
    }
    return currentSort.order === 'desc' ? (
      <ArrowDown className="h-4 w-4 ml-1" />
    ) : (
      <ArrowUp className="h-4 w-4 ml-1" />
    );
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead scope="col">Товар</TableHead>
          <TableHead scope="col" className="text-center">
            Статус
          </TableHead>
          <TableHead
            scope="col"
            className="text-right cursor-pointer hover:bg-accent"
            onClick={() => sortColumn('revenue')}
          >
            <div className="flex items-center justify-end">
              Выручка
              <SortIcon field="revenue" />
            </div>
          </TableHead>
          <TableHead
            scope="col"
            className="text-right cursor-pointer hover:bg-accent"
            onClick={() => sortColumn('cogs_pct')}
          >
            <div className="flex items-center justify-end">
              COGS %
              <SortIcon field="cogs_pct" />
            </div>
          </TableHead>
          <TableHead
            scope="col"
            className="text-right cursor-pointer hover:bg-accent"
            onClick={() => sortColumn('net_margin_pct')}
          >
            <div className="flex items-center justify-end">
              Маржа %
              <SortIcon field="net_margin_pct" />
            </div>
          </TableHead>
          <TableHead
            scope="col"
            className="text-right cursor-pointer hover:bg-accent"
            onClick={() => sortColumn('net_profit')}
          >
            <div className="flex items-center justify-end">
              Прибыль
              <SortIcon field="net_profit" />
            </div>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((item) => {
          const status = getProfitabilityStatus(item.net_margin_pct, item.has_cogs);
          return (
            <TableRow key={item.sku_id}>
              <TableCell>
                <div>
                  <p className="font-medium">{item.product_name}</p>
                  <p className="text-sm text-muted-foreground">SKU: {item.sku_id}</p>
                </div>
              </TableCell>
              <TableCell className="text-center">
                <ProfitabilityBadge status={status} />
              </TableCell>
              <TableCell className="text-right font-medium">
                {formatCurrency(item.revenue)}
              </TableCell>
              <TableCell className="text-right">
                {item.has_cogs ? formatPercentage(item.costs_pct.cogs) : '—'}
              </TableCell>
              <TableCell className="text-right">
                {item.has_cogs ? formatPercentage(item.net_margin_pct) : '—'}
              </TableCell>
              <TableCell className="text-right font-medium">
                {item.has_cogs ? formatCurrency(item.net_profit) : '—'}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
```

## Dev Notes

### File Structure

```
src/
├── components/custom/analytics/
│   ├── ProfitabilityBadge.tsx            # Status badge with tooltip
│   ├── ProfitabilityFilter.tsx           # Multi-select filter dropdown
│   └── UnitEconomicsSummaryBanner.tsx    # Status counts summary
└── app/(dashboard)/analytics/unit-economics/
    └── components/
        └── UnitEconomicsTable.tsx         # Enhanced table (modify existing)
```

### URL Parameter Format

```
/analytics/unit-economics?week=2026-W05&status=loss,critical&sort=net_margin_pct&order=asc
```

### Color Accessibility

All status colors meet WCAG AA contrast:
- Green text on green-100: 4.6:1
- Red text on red-100: 5.2:1
- Icons supplement color (never color-only)

## Testing

### Test Cases

- [ ] Profitability badge renders correctly for each status
- [ ] Badge tooltip shows threshold and recommendation
- [ ] Filter dropdown shows all status options
- [ ] Multi-select filtering works correctly
- [ ] Filter state persists in URL params
- [ ] Clear filter resets all selections
- [ ] Table sorts by clicked column header
- [ ] Sort direction toggles correctly
- [ ] Summary banner shows correct counts
- [ ] Clicking count filters to that status
- [ ] Unknown status shown for products without COGS
- [ ] Keyboard navigation works for all controls

### Unit Tests

```typescript
// src/components/custom/analytics/__tests__/ProfitabilityBadge.test.tsx
describe('ProfitabilityBadge', () => {
  it('renders correct badge for each status', () => {});
  it('shows tooltip with threshold info', () => {});
  it('getProfitabilityStatus returns correct status for margin values', () => {});
  it('returns unknown when hasCogs is false', () => {});
});

// src/components/custom/analytics/__tests__/ProfitabilityFilter.test.tsx
describe('ProfitabilityFilter', () => {
  it('renders filter dropdown with all statuses', () => {});
  it('toggles status selection on click', () => {});
  it('updates URL params when filter changes', () => {});
  it('clears filter removes all selections', () => {});
});
```

## Definition of Done

- [ ] ProfitabilityBadge component created
- [ ] All 6 status types styled correctly
- [ ] Tooltips work on hover
- [ ] Filter dropdown works with multi-select
- [ ] URL params sync with filter state
- [ ] Table columns are sortable
- [ ] Summary banner displays status counts
- [ ] TypeScript passes
- [ ] ESLint passes
- [ ] <200 lines per file
- [ ] Unit tests passing

## Dependencies

- Story 63.8-fe: Period Context (for week selection)
- Existing types: `src/types/unit-economics.ts`
- Existing utils: `src/lib/unit-economics-utils.ts`

---

## Change Log

| Date | Author | Change |
|------|--------|--------|
| 2026-01-31 | PM | Initial draft |

---

## Related Documentation

- [Backend API Guide](../../../docs/request-backend/123-DASHBOARD-MAIN-PAGE-EXPENSES-API.md)
- [Unit Economics Types](../../../src/types/unit-economics.ts)
- [Unit Economics Utils](../../../src/lib/unit-economics-utils.ts)
- [Existing Efficiency Indicators](../epic-33/story-33.4-fe-efficiency-indicators.md)

---

## Implementation

**Components**:
- `src/components/custom/dashboard/UnitEconomicsTable.tsx` - Enhanced table
- `src/components/custom/analytics/ProfitabilityBadge.tsx` - Status badge
- `src/components/custom/analytics/ProfitabilityFilter.tsx` - Multi-select filter
- `src/components/custom/analytics/UnitEconomicsSummaryBanner.tsx` - Status counts

**Key Features**:
- Profitability status column with 6 statuses (excellent, good, warning, critical, loss, unknown)
- Color-coded badges with icons and tooltips
- Multi-select filter dropdown with URL param sync
- Sortable columns (revenue, COGS%, margin%, profit)
- Summary banner with clickable status counts
- "Needs attention" highlight for loss/critical items
- Full accessibility (scope, aria-labels, keyboard nav)

---

## Dev Agent Record

```
Status: Complete
Agent: Claude Code
Started: 2026-01-31
Completed: 2026-01-31
Notes: Implemented with all acceptance criteria met. Filter state persists in URL for shareable views.
```
