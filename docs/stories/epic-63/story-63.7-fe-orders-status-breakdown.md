# Story 63.7-FE: Orders Status Breakdown Chart

## Story Info

- **Epic**: 63 - Dashboard Enhancements (Orders Analytics)
- **Sprint**: 14
- **Priority**: P2 (Enhancement)
- **Points**: 3 SP
- **Status**: ✅ Complete
- **Completion Date**: 2026-01-31
- **Backend Dependency**: `/v1/analytics/orders/volume` API (Complete)

---

## User Story

**As a** FBS seller,
**I want** to see the distribution of my orders by status (complete, confirm, new, cancel),
**So that** I can quickly understand my order pipeline health and identify potential issues.

**Non-goals**:
- Historical status comparison (future epic)
- Drill-down to individual orders by status (covered in Orders page)
- Status change notifications (separate feature)

---

## Acceptance Criteria

### AC1: Status Breakdown Visualization

- [ ] Display order status distribution from `statusBreakdown[]` array
- [ ] Support two visualization modes: Stacked Bar Chart and Pie Chart (toggle)
- [ ] Show count and percentage for each status
- [ ] Color-coded by status type (consistent with project design system)

### AC2: Status Color Scheme

- [ ] `complete` (Выполнено): `#22C55E` (Green)
- [ ] `confirm` (Подтверждено): `#3B82F6` (Blue)
- [ ] `new` (Новый): `#F59E0B` (Yellow/Amber)
- [ ] `cancel` (Отменено): `#EF4444` (Red)
- [ ] Colors must meet WCAG 2.1 AA contrast requirements

### AC3: Data Display

- [ ] Show total orders count in header
- [ ] Display each status with:
  - Status label in Russian
  - Count (absolute number)
  - Percentage (1 decimal place)
- [ ] Sort statuses by count (descending) or fixed order (complete, confirm, new, cancel)

### AC4: Tooltip Interactions

- [ ] Hover on bar/slice shows detailed tooltip
- [ ] Tooltip content: Status name, count, percentage
- [ ] Smooth hover transitions

### AC5: Empty & Loading States

- [ ] Loading skeleton while fetching data
- [ ] Empty state when no orders in period: "Нет заказов за выбранный период"
- [ ] Error state with retry button

### AC6: Responsive Design

- [ ] Desktop: Full chart with legend
- [ ] Tablet: Compact chart with legend below
- [ ] Mobile: Simplified view or pie chart only

### AC7: Accessibility

- [ ] ARIA labels for interactive elements
- [ ] Color + pattern/icon for colorblind accessibility
- [ ] Keyboard navigation support
- [ ] Screen reader compatible data table alternative

---

## API Integration

### Endpoint

```http
GET /v1/analytics/orders/volume
Authorization: Bearer {token}
X-Cabinet-Id: {cabinetId}
Query:
  - from: string (YYYY-MM-DD, required)
  - to: string (YYYY-MM-DD, required)
```

### Response Field Mapping

```typescript
interface VolumeResponse {
  totalOrders: number;
  statusBreakdown: StatusBreakdownItem[];
  // ... other fields
}

interface StatusBreakdownItem {
  status: 'complete' | 'confirm' | 'new' | 'cancel';
  count: number;
  percentage: number;  // 0-100, e.g., 80.0
}
```

### Example Response

```json
{
  "totalOrders": 500,
  "statusBreakdown": [
    { "status": "complete", "count": 400, "percentage": 80.0 },
    { "status": "cancel", "count": 18, "percentage": 3.6 },
    { "status": "confirm", "count": 50, "percentage": 10.0 },
    { "status": "new", "count": 32, "percentage": 6.4 }
  ],
  "period": {
    "from": "2026-01-24",
    "to": "2026-01-31"
  }
}
```

### Caching

- TTL: 5 minutes (backend caching)
- Frontend staleTime: 60 seconds
- refetchInterval: 300000 (5 minutes)

---

## UI Wireframe

### Stacked Bar Chart View

```
+--------------------------------------------------------------------+
|  Распределение заказов по статусам              Всего: 500 заказов |
|  [Bar Chart] [Pie Chart]                                           |
+--------------------------------------------------------------------+
|                                                                    |
|  +============================================================+   |
|  |████████████████████████████████░░░░░░░░░░▓▓▓▓▓▓▓▒▒▒▒        |   |
|  +============================================================+   |
|   80%                              10%    6.4%  3.6%               |
|                                                                    |
|  ● Выполнено: 400 (80.0%)     ● Подтверждено: 50 (10.0%)         |
|  ● Новый: 32 (6.4%)           ● Отменено: 18 (3.6%)              |
|                                                                    |
+--------------------------------------------------------------------+
```

### Pie Chart View

```
+--------------------------------------------------------------------+
|  Распределение заказов по статусам              Всего: 500 заказов |
|  [Bar Chart] [Pie Chart]                                           |
+--------------------------------------------------------------------+
|                                                                    |
|            ╭──────────╮                                            |
|         ╭──┤ 80.0%    │──╮          ● Выполнено: 400 (80.0%)      |
|        │   ╰──────────╯   │         ● Подтверждено: 50 (10.0%)    |
|        │ 10% ╱    ╲ 6.4%  │         ● Новый: 32 (6.4%)            |
|         ╰────── 3.6% ─────╯         ● Отменено: 18 (3.6%)         |
|                                                                    |
+--------------------------------------------------------------------+
```

### Mobile View

```
+---------------------------+
| Статусы заказов    [500]  |
+---------------------------+
|      ╭──────────╮         |
|   ╭──┤  80%     │──╮      |
|  │   ╰──────────╯   │     |
|   ╰─────────────────╯     |
+---------------------------+
| ● Выполнено     400 80.0% |
| ● Подтверждено   50 10.0% |
| ● Новый          32  6.4% |
| ● Отменено       18  3.6% |
+---------------------------+
```

---

## Components to Create

### Main Component

| Component | Location | Lines | Description |
|-----------|----------|-------|-------------|
| `OrdersStatusBreakdown.tsx` | `src/app/(dashboard)/components/` | ~150 | Main container with view toggle |

### Chart Components

| Component | Location | Lines | Description |
|-----------|----------|-------|-------------|
| `StatusStackedBar.tsx` | `src/app/(dashboard)/components/` | ~100 | Horizontal stacked bar chart |
| `StatusPieChart.tsx` | `src/app/(dashboard)/components/` | ~100 | Pie/donut chart variant |
| `StatusLegend.tsx` | `src/app/(dashboard)/components/` | ~50 | Reusable legend component |

### Supporting Components

| Component | Location | Lines | Description |
|-----------|----------|-------|-------------|
| `StatusTooltip.tsx` | `src/app/(dashboard)/components/` | ~40 | Custom tooltip for charts |

---

## Technical Implementation

### Status Configuration

```typescript
// src/lib/orders-status-config.ts

export const ORDER_STATUS_CONFIG = {
  complete: {
    label: 'Выполнено',
    color: '#22C55E',
    bgColor: 'bg-green-500',
    textColor: 'text-green-600',
  },
  confirm: {
    label: 'Подтверждено',
    color: '#3B82F6',
    bgColor: 'bg-blue-500',
    textColor: 'text-blue-600',
  },
  new: {
    label: 'Новый',
    color: '#F59E0B',
    bgColor: 'bg-yellow-500',
    textColor: 'text-yellow-600',
  },
  cancel: {
    label: 'Отменено',
    color: '#EF4444',
    bgColor: 'bg-red-500',
    textColor: 'text-red-600',
  },
} as const;

export type OrderStatus = keyof typeof ORDER_STATUS_CONFIG;

export function getStatusLabel(status: OrderStatus): string {
  return ORDER_STATUS_CONFIG[status].label;
}

export function getStatusColor(status: OrderStatus): string {
  return ORDER_STATUS_CONFIG[status].color;
}
```

### Chart Implementation (Recharts)

```typescript
// src/app/(dashboard)/components/StatusPieChart.tsx

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { ORDER_STATUS_CONFIG, OrderStatus } from '@/lib/orders-status-config';

interface StatusPieChartProps {
  data: StatusBreakdownItem[];
  height?: number;
}

export function StatusPieChart({ data, height = 200 }: StatusPieChartProps) {
  const chartData = data.map((item) => ({
    ...item,
    name: ORDER_STATUS_CONFIG[item.status as OrderStatus].label,
    fill: ORDER_STATUS_CONFIG[item.status as OrderStatus].color,
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={chartData}
          dataKey="count"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={40}
          outerRadius={80}
          paddingAngle={2}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
        </Pie>
        <Tooltip content={<StatusTooltip />} />
      </PieChart>
    </ResponsiveContainer>
  );
}
```

### Stacked Bar Implementation

```typescript
// src/app/(dashboard)/components/StatusStackedBar.tsx

import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { ORDER_STATUS_CONFIG, OrderStatus } from '@/lib/orders-status-config';

interface StatusStackedBarProps {
  data: StatusBreakdownItem[];
  height?: number;
}

export function StatusStackedBar({ data, height = 60 }: StatusStackedBarProps) {
  // Transform data for stacked bar
  const transformedData = [
    data.reduce(
      (acc, item) => ({
        ...acc,
        [item.status]: item.percentage,
      }),
      { name: 'status' }
    ),
  ];

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={transformedData} layout="vertical">
        <XAxis type="number" domain={[0, 100]} hide />
        {['complete', 'confirm', 'new', 'cancel'].map((status) => (
          <Bar
            key={status}
            dataKey={status}
            stackId="a"
            fill={ORDER_STATUS_CONFIG[status as OrderStatus].color}
          />
        ))}
        <Tooltip content={<StatusTooltip />} />
      </BarChart>
    </ResponsiveContainer>
  );
}
```

### Hook Usage

```typescript
// src/hooks/useOrdersVolumeAnalytics.ts

export function useOrdersVolumeAnalytics(from: string, to: string) {
  return useQuery({
    queryKey: ordersAnalyticsQueryKeys.volume(from, to),
    queryFn: () => getOrdersVolume(from, to),
    staleTime: 60_000,
    gcTime: 300_000,
    refetchInterval: 300_000,
    enabled: !!from && !!to,
  });
}
```

---

## Test Scenarios

### Unit Tests

| Test | File | Description |
|------|------|-------------|
| Status colors | `StatusStackedBar.test.tsx` | Verify correct colors for each status |
| Percentage calculation | `OrdersStatusBreakdown.test.tsx` | Verify percentages sum to 100% |
| Empty state | `OrdersStatusBreakdown.test.tsx` | Show message when no data |
| View toggle | `OrdersStatusBreakdown.test.tsx` | Switch between bar and pie |
| Tooltip content | `StatusTooltip.test.tsx` | Show status, count, percentage |

### Integration Tests

| Scenario | Description |
|----------|-------------|
| Data fetch | Load status breakdown from API |
| Chart render | Both bar and pie charts render correctly |
| Responsive layout | Verify mobile/tablet/desktop views |

---

## Dependencies

### Required

- Story 63.x-FE: Types & API Client (orders analytics types)
- Recharts library (already in project)
- `useOrdersVolumeAnalytics` hook

### Creates

- `ORDER_STATUS_CONFIG` - Reusable status configuration
- `StatusPieChart` - Reusable pie chart component
- `StatusStackedBar` - Reusable stacked bar component

---

## Definition of Done

- [ ] All acceptance criteria verified
- [ ] Status breakdown chart displays with correct colors
- [ ] Toggle between stacked bar and pie chart works
- [ ] Tooltip shows status, count, percentage on hover
- [ ] Legend displays all statuses with correct colors
- [ ] Loading skeleton during data fetch
- [ ] Empty state when no orders
- [ ] Error state with retry button
- [ ] Mobile responsive layout
- [ ] Accessibility: ARIA labels, keyboard nav
- [ ] Unit tests pass (>80% coverage)
- [ ] TypeScript strict mode, no `any` types
- [ ] Code review approved
- [ ] File size <200 lines per component

---

## Open Questions

1. **Default view**: Should default be bar or pie chart?
2. **Animation**: Enable chart animations on load/update?
3. **Period comparison**: Show previous period comparison inline?

---

## References

- Backend API: `docs/request-backend/121-DASHBOARD-MAIN-PAGE-ORDERS-API.md`
- Test API: `test-api/14-orders.http` (orders volume endpoint)
- Design system: `docs/front-end-spec.md` (color scheme)
- Similar components: `ExpenseChart.tsx`, `StorageTrendsChart.tsx`

---

**Created**: 2026-01-31
**Author**: Product Manager
**Last Updated**: 2026-01-31

---

## Implementation

**Component**: `src/components/custom/dashboard/OrdersStatusBreakdown.tsx`
**Config**: `src/lib/orders-status-config.ts`
**Lines**: 200
**Key Features**:
- Stacked bar chart and pie chart views with toggle
- Status color coding (complete=green, confirm=blue, new=yellow, cancel=red)
- Total orders count in header
- Interactive legend with status counts
- Custom tooltip showing status, count, percentage
- Responsive design (mobile: simplified pie, desktop: full chart with legend)
- Loading skeleton, empty state, error state

---

## Dev Agent Record

```
Status: Complete
Agent: Claude Code
Started: 2026-01-31
Completed: 2026-01-31
Notes: Implemented with Recharts. Uses useOrdersVolumeAnalytics hook. Supports both bar and pie chart visualization.
```
