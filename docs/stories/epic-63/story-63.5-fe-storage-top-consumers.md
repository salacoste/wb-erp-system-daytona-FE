# Story 63.5-FE: Storage Top Consumers Widget (Dashboard)

## Story Info

- **Epic**: 63 - Dashboard Main Page (Frontend)
- **Priority**: Medium
- **Points**: 3
- **Status**: ✅ Complete
- **Sprint**: 14
- **Completion Date**: 2026-01-31

## User Story

**As a** seller viewing my dashboard,
**I want** to see which products consume the most storage costs,
**So that** I can quickly identify storage optimization opportunities without navigating away from the main dashboard.

## Acceptance Criteria

### AC1: Widget Display

- [ ] Show top 5-10 products by storage cost in a compact card widget
- [ ] Display rank number (1-10) with Lucide icons for top 3 (Trophy/Medal)
- [ ] Show product name (truncated if needed)
- [ ] Show storage cost in rubles (formatted: 3,500 ₽)
- [ ] Show percent of total storage cost

### AC2: Storage-to-Revenue Ratio

- [ ] Display storage-to-revenue ratio percentage when `include_revenue=true`
- [ ] Color coding thresholds:
  - **>20%** = Red (high risk, optimization needed)
  - **10-20%** = Yellow (medium, monitor)
  - **<10%** = Green (healthy)
- [ ] Tooltip explaining the metric and threshold meanings
- [ ] Warning badge for items with ratio >20%

### AC3: Period Context

- [ ] Widget respects dashboard's selected period (weekStart/weekEnd)
- [ ] Title includes period indicator if not current week
- [ ] Adapts to period context provider

### AC4: Interactions

- [ ] Click row → navigate to full Storage Analytics page (`/analytics/storage`)
- [ ] "Смотреть все" link → navigate to full Storage Analytics page
- [ ] Hover state on rows for interactivity feedback

### AC5: Loading & Empty States

- [ ] Loading skeleton matching widget layout
- [ ] Empty state: "Нет данных по хранению за выбранный период"
- [ ] Error state with retry button

## Tasks / Subtasks

### Phase 1: Component Setup

- [ ] Create `src/components/custom/dashboard/StorageTopConsumersWidget.tsx`
- [ ] Define component props interface
- [ ] Set up data fetching with `useStorageTopConsumers` hook

### Phase 2: Widget Structure

- [ ] Implement Card container with header (icon + title)
- [ ] Implement compact table/list layout
- [ ] Add rank column with Lucide icons (Trophy, Medal)
- [ ] Add "Смотреть все" link in header

### Phase 3: Visual Elements

- [ ] Implement RankIndicator component (reuse or create)
- [ ] Implement StorageRatioIndicator with color-coded dots
- [ ] Implement warning badge for high ratio items
- [ ] Apply purple color scheme for storage (#7C4DFF)

### Phase 4: Interactions

- [ ] Implement row click handler with navigation
- [ ] Implement "Смотреть все" navigation
- [ ] Add hover state styling

### Phase 5: Loading & Error States

- [ ] Implement loading skeleton
- [ ] Implement error state with retry
- [ ] Implement empty state

### Phase 6: Integration

- [ ] Integrate with dashboard period context
- [ ] Add to dashboard expenses section layout
- [ ] Test responsiveness

### Phase 7: Testing

- [ ] Test component renders with mock data
- [ ] Test color coding thresholds
- [ ] Test navigation interactions
- [ ] Test loading/error/empty states

## Design

```
┌──────────────────────────────────────────────────────────────┐
│ <Package/> Топ по расходам на хранение        [Смотреть все →]
├──────────────────────────────────────────────────────────────┤
│ #   │ Товар               │ Хранение  │ % общих │ Хран/Выр  │
├─────┼─────────────────────┼───────────┼─────────┼───────────┤
│ 🏆1 │ Пальто зимнее XL    │ 3,500 ₽   │ 12.5%   │ 23.3% ⚠●  │
│ 🥈2 │ Диван угловой       │ 2,800 ₽   │ 10.0%   │ 6.2%  ●   │
│ 🥉3 │ Шкаф-купе           │ 2,200 ₽   │ 7.9%    │ 8.1%  ●   │
│  4  │ Кресло офисное      │ 1,800 ₽   │ 6.4%    │ 15.2% ●   │
│  5  │ Стол обеденный      │ 1,500 ₽   │ 5.4%    │ 4.3%  ●   │
└─────┴─────────────────────┴───────────┴─────────┴───────────┘
  ● green (<10%)  ● yellow (10-20%)  ● red (>20%) ⚠ warning
```

## Technical Details

### API Endpoint

```http
GET /v1/analytics/storage/top-consumers
```

**Request Parameters:**

| Parameter         | Required | Default | Description                           |
| ----------------- | -------- | ------- | ------------------------------------- |
| `weekStart`       | Yes      | -       | Start period (YYYY-Www)               |
| `weekEnd`         | Yes      | -       | End period (YYYY-Www)                 |
| `limit`           | No       | 10      | Number of records (max 100)           |
| `include_revenue` | No       | false   | Include revenue for ratio calculation |

**Example Request:**

```http
GET /v1/analytics/storage/top-consumers?weekStart=2026-W01&weekEnd=2026-W05&limit=5&include_revenue=true
Authorization: Bearer <token>
X-Cabinet-Id: <cabinet_uuid>
```

### API Response Structure

```json
{
  "period": { "from": "2026-W01", "to": "2026-W05" },
  "top_consumers": [
    {
      "rank": 1,
      "nm_id": "87654321",
      "vendor_code": "COAT-XL-001",
      "product_name": "Пальто зимнее XL",
      "storage_cost": 3500.00,
      "percent_of_total": 12.5,
      "volume": 2.5,
      "revenue_net": 15000.00,
      "storage_to_revenue_ratio": 23.3
    }
  ]
}
```

### TypeScript Types

```typescript
// src/types/storage.ts (extend existing)

interface StorageTopConsumer {
  rank: number;
  nm_id: string;
  vendor_code: string;
  product_name: string;
  storage_cost: number;
  percent_of_total: number;
  volume: number;
  revenue_net?: number;
  storage_to_revenue_ratio?: number;
}

interface StorageTopConsumersResponse {
  period: {
    from: string;
    to: string;
  };
  top_consumers: StorageTopConsumer[];
}
```

### Component Props Interface

```typescript
interface StorageTopConsumersWidgetProps {
  weekStart: string;
  weekEnd: string;
  limit?: number;          // default: 5
  includeRevenue?: boolean; // default: true
  onViewAll?: () => void;
  onProductClick?: (nmId: string) => void;
  className?: string;
}
```

### Hook Usage

```typescript
// src/hooks/useStorageAnalytics.ts (extend existing)

export function useStorageTopConsumers(
  weekStart: string,
  weekEnd: string,
  options?: { limit?: number; include_revenue?: boolean }
) {
  return useQuery({
    queryKey: storageQueryKeys.topConsumers(weekStart, weekEnd, options),
    queryFn: () => getStorageTopConsumers(weekStart, weekEnd, options),
    enabled: !!weekStart && !!weekEnd,
    staleTime: 5 * 60 * 1000, // 5 min
  });
}
```

### Color Scheme (Storage = Purple)

```typescript
const STORAGE_COLORS = {
  primary: '#7C4DFF',        // Purple - main storage color
  ratioHigh: '#EF4444',      // Red - ratio >20%
  ratioMedium: '#F59E0B',    // Yellow - ratio 10-20%
  ratioLow: '#22C55E',       // Green - ratio <10%
  background: 'rgba(124, 77, 255, 0.1)',
};
```

### Storage Ratio Indicator Component

```typescript
type RatioSeverity = 'high' | 'medium' | 'low' | 'unknown';

interface StorageRatioIndicatorProps {
  ratio: number | null;
  showWarning?: boolean;
}

function getStorageRatioSeverity(ratio: number | null): RatioSeverity {
  if (ratio === null || ratio === undefined) return 'unknown';
  if (ratio > 20) return 'high';
  if (ratio > 10) return 'medium';
  return 'low';
}

function StorageRatioIndicator({ ratio, showWarning = true }: StorageRatioIndicatorProps) {
  const severity = getStorageRatioSeverity(ratio);

  const colors: Record<RatioSeverity, string> = {
    high: 'bg-red-500',
    medium: 'bg-yellow-500',
    low: 'bg-green-500',
    unknown: 'bg-gray-300',
  };

  const labels: Record<RatioSeverity, string> = {
    high: 'Высокие затраты на хранение (>20%)',
    medium: 'Умеренные затраты (10-20%)',
    low: 'Низкие затраты (<10%)',
    unknown: 'Нет данных о выручке',
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1">
            {ratio !== null && (
              <span className={severity === 'high' ? 'text-red-600 font-medium' : ''}>
                {ratio.toFixed(1)}%
              </span>
            )}
            {showWarning && severity === 'high' && (
              <AlertTriangle className="h-3 w-3 text-red-500" />
            )}
            <span
              className={cn('w-2 h-2 rounded-full', colors[severity])}
              aria-label={labels[severity]}
            />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-medium">{labels[severity]}</p>
          <p className="text-xs text-muted-foreground">
            Отношение затрат на хранение к выручке.
            {severity === 'high' && ' Рекомендуется оптимизация запасов.'}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
```

## Dev Notes

### Relevant Source Tree

```
src/
├── components/
│   └── custom/
│       └── dashboard/
│           └── StorageTopConsumersWidget.tsx  # NEW: Story 63.5-fe
├── hooks/
│   └── useStorageAnalytics.ts                 # EXTEND: add useStorageTopConsumers
├── lib/
│   └── api/
│       └── storage.ts                         # EXTEND: add getStorageTopConsumers
├── types/
│   └── storage.ts                             # EXTEND: add StorageTopConsumer types
└── app/(dashboard)/
    └── page.tsx                               # MODIFY: add widget to dashboard
```

### Reusable Components

- Can reuse `RankIndicator` from Epic 24 if exported
- Can reuse `CostSeverityDot` pattern for ratio indicator
- Use existing `formatCurrency`, `formatPercentage` from `@/lib/formatters`

### Color Thresholds

| Ratio  | Severity | Color              | Action                           |
| ------ | -------- | ------------------ | -------------------------------- |
| >20%   | High     | Red (`#EF4444`)    | Optimize inventory, reduce stock |
| 10-20% | Medium   | Yellow (`#F59E0B`) | Monitor, consider adjustments    |
| <10%   | Low      | Green (`#22C55E`)  | Healthy ratio                    |
| null   | Unknown  | Gray (`#9CA3AF`)   | No revenue data available        |

### Accessibility

- Rank icons have `aria-label` attributes
- Color indicators have tooltip explanations
- Warning icons have descriptive labels
- Keyboard navigation for row click
- Color is not the only indicator (text + icon + dot)

## Testing

### Framework & Location

- **Framework**: Vitest + React Testing Library
- **Test Location**: `src/components/custom/dashboard/__tests__/StorageTopConsumersWidget.test.tsx`

### Test Cases

- [ ] Widget renders with 5 items
- [ ] Rank 1 shows Trophy icon (gold)
- [ ] Rank 2 shows Medal icon (silver)
- [ ] Rank 3 shows Medal icon (bronze)
- [ ] Ranks 4-5 show numbers only
- [ ] Storage-to-revenue ratio >20% shows red dot + warning icon
- [ ] Storage-to-revenue ratio 10-20% shows yellow dot
- [ ] Storage-to-revenue ratio <10% shows green dot
- [ ] Storage-to-revenue ratio null shows gray dot (no warning)
- [ ] Click row calls navigation to storage analytics
- [ ] "Смотреть все" button navigates to storage page
- [ ] Loading state shows skeleton
- [ ] Empty state displays correctly
- [ ] Error state shows retry button
- [ ] Tooltip appears on hover over ratio
- [ ] Product name truncates when too long

### Coverage Target

- Component: >80%
- Helper components: >90%

## Definition of Done

- [ ] Widget displays top 5 products by storage cost
- [ ] Rank indicators with Lucide icons for top 3
- [ ] Storage-to-revenue ratio with color coding
- [ ] Warning badge for high ratio (>20%) items
- [ ] Tooltip explains ratio metric and thresholds
- [ ] Row click navigates to storage analytics page
- [ ] "Смотреть все" link works
- [ ] Loading skeleton
- [ ] Error state with retry
- [ ] Empty state
- [ ] Responsive design
- [ ] Purple color scheme for storage metrics
- [ ] No TypeScript errors
- [ ] ESLint passes
- [ ] File size <200 lines (split components if needed)
- [ ] Unit tests pass with >80% coverage

## Dependencies

- Story 63.1-FE: Types & API Client foundation
- shadcn/ui Card, Tooltip components
- Lucide icons (Trophy, Medal, Package, AlertTriangle, ArrowRight)
- `useStorageTopConsumers` hook (new or extended)
- Dashboard period context

## Related

- **API**: `GET /v1/analytics/storage/top-consumers`
- **Reference**: Story 24.4-FE (similar Top Consumers pattern in Storage Analytics page)
- **Backend Doc**: `docs/request-backend/123-DASHBOARD-MAIN-PAGE-EXPENSES-API.md`

---

## Change Log

| Date       | Author      | Change                                 |
| ---------- | ----------- | -------------------------------------- |
| 2026-01-31 | PM (Claude) | Initial draft based on backend API doc |

---

## Implementation

**Component**: `src/components/custom/dashboard/StorageTopConsumersWidget.tsx`
**Lines**: 194
**Key Features**:

- Top 5-10 products by storage cost in compact card widget
- Rank indicators with Lucide Trophy/Medal icons for top 3
- Storage-to-revenue ratio with color-coded dots (green <10%, yellow 10-20%, red >20%)
- Warning badge for high ratio items
- Row click navigation to Storage Analytics page
- "Смотреть все" link
- Loading skeleton, empty state, error state

---

## Dev Agent Record

_Section for Dev Agent to track implementation progress and decisions_

```
Status: Complete
Agent: Claude Code
Started: 2026-01-31
Completed: 2026-01-31
Notes: Implemented with all acceptance criteria met. Uses useStorageTopConsumers hook for data fetching.
```
