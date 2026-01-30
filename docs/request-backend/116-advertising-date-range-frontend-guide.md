# Request #116: Advertising Date Range Frontend Guide

**Date**: 2026-01-30
**Status**: ✅ DOCUMENTED
**Related**: Request #115 (Advertising Date Filter Empty State Behavior)
**Audience**: Frontend Developers

---

## Quick Reference

### Available Data Range

| Metric | Value |
|--------|-------|
| **Data Start** | 2025-12-01 |
| **Data End** | 2026-01-28 |
| **Weeks** | 2025-W49 to 2026-05 |

### Key Endpoints

| Endpoint | Purpose |
|----------|---------|
| `GET /v1/analytics/advertising/sync-status` | Get available date range |
| `GET /v1/analytics/advertising?from=DATE&to=DATE` | Query advertising data |

---

## Date Range Validation

### 1. Fetch Available Date Range

```typescript
// Hook to get available data range
export function useAdvertisingSyncStatus() {
  return useQuery({
    queryKey: ['advertising-sync-status'],
    queryFn: () => apiClient.get('/v1/analytics/advertising/sync-status'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Usage
const { data: syncStatus } = useAdvertisingSyncStatus();
const { dataAvailableFrom, dataAvailableTo } = syncStatus || {};
```

### 2. Validate Date Range

```typescript
import { isBefore, isAfter, isWithinInterval } from 'date-fns';

export function validateAdvertisingDateRange(
  from: string,
  to: string,
  availableFrom: string,
  availableTo: string
): {
  isValid: boolean;
  hasOverlap: boolean;
  error?: string;
  warning?: string;
} {
  const requestStart = new Date(from);
  const requestEnd = new Date(to);
  const dataStart = new Date(availableFrom);
  const dataEnd = new Date(availableTo);

  // Check for complete overlap
  if (isBefore(requestEnd, dataStart) || isAfter(requestStart, dataEnd)) {
    return {
      isValid: false,
      hasOverlap: false,
      error: isBefore(requestEnd, dataStart)
        ? 'Выбранный период раньше начала сбора данных'
        : 'Выбранный период позже последнего обновления данных',
    };
  }

  // Check for partial overlap
  if (isBefore(requestStart, dataStart) || isAfter(requestEnd, dataEnd)) {
    return {
      isValid: true,
      hasOverlap: true,
      warning: 'Часть выбранного периода выходит за пределы доступных данных',
    };
  }

  return { isValid: true, hasOverlap: true };
}
```

### 3. Show Available Data Range

```typescript
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

export function formatDateRange(from: string, to: string): string {
  return `с ${format(new Date(from), 'dd.MM.yyyy', { locale: ru })} по ${format(
    new Date(to),
    'dd.MM.yyyy',
    { locale: ru }
  )}`;
}

// Usage
<p className="text-sm text-gray-500">
  Доступны данные {formatDateRange(dataAvailableFrom, dataAvailableTo)}
</p>
```

---

## Smart Date Picker Implementation

### Component with Disabled Dates

```typescript
import { addDays, subDays } from 'date-fns';
import { DateRangePicker } from '@/components/ui/date-range-picker';

interface SmartDatePickerProps {
  availableFrom: string;
  availableTo: string;
  onRangeChange: (from: string, to: string) => void;
}

export function SmartAdvertisingDatePicker({
  availableFrom,
  availableTo,
  onRangeChange,
}: SmartDatePickerProps) {
  const minDate = new Date(availableFrom);
  const maxDate = new Date(availableTo);

  const predefinedRanges = [
    {
      label: 'Последние 7 дней',
      from: subDays(maxDate, 7),
      to: maxDate,
    },
    {
      label: 'Последние 30 дней',
      from: subDays(maxDate, 30),
      to: maxDate,
    },
    {
      label: 'Последние 90 дней',
      from: subDays(maxDate, 90),
      to: maxDate,
    },
    {
      label: 'Весь период',
      from: minDate,
      to: maxDate,
    },
  ];

  return (
    <DateRangePicker
      minDate={minDate}
      maxDate={maxDate}
      predefinedRanges={predefinedRanges}
      onRangeChange={(range) => {
        onRangeChange(
          range.from.toISOString().split('T')[0],
          range.to.toISOString().split('T')[0]
        );
      }}
      disabledDates={(date) => date < minDate || date > maxDate}
    />
  );
}
```

### Usage in Page Component

```typescript
export function AdvertisingAnalyticsPage() {
  const { data: syncStatus } = useAdvertisingSyncStatus();
  const [dateRange, setDateRange] = useState({ from: '', to: '' });

  useEffect(() => {
    // Set default range to last 30 days
    if (syncStatus?.dataAvailableTo) {
      const to = new Date(syncStatus.dataAvailableTo);
      const from = subDays(to, 30);
      setDateRange({
        from: from.toISOString().split('T')[0],
        to: to.toISOString().split('T')[0],
      });
    }
  }, [syncStatus]);

  return (
    <div>
      <SmartAdvertisingDatePicker
        availableFrom={syncStatus?.dataAvailableFrom}
        availableTo={syncStatus?.dataAvailableTo}
        onRangeChange={setDateRange}
      />
      {/* Rest of the page */}
    </div>
  );
}
```

---

## Empty State Handling

### Empty State Component

```typescript
import { AlertCircle, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDateRange } from '@/lib/date-utils';

interface AdvertisingEmptyStateProps {
  requestedFrom: string;
  requestedTo: string;
  availableFrom: string;
  availableTo: string;
  onDateRangeChange: (from: string, to: string) => void;
}

export function AdvertisingEmptyState({
  requestedFrom,
  requestedTo,
  availableFrom,
  availableTo,
  onDateRangeChange,
}: AdvertisingEmptyStateProps) {
  const requestStart = new Date(requestedFrom);
  const requestEnd = new Date(requestedTo);
  const dataStart = new Date(availableFrom);
  const dataEnd = new Date(availableTo);

  const isBeforeAvailable = requestEnd < dataStart;
  const isAfterAvailable = requestStart > dataEnd;

  const getMessage = () => {
    if (isBeforeAvailable) {
      return 'Выбранный период раньше начала сбора данных';
    }
    if (isAfterAvailable) {
      return 'Выбранный период позже последнего обновления данных';
    }
    return 'Нет данных за выбранный период';
  };

  const getHint = () => {
    return `Доступны данные ${formatDateRange(availableFrom, availableTo)}`;
  };

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="rounded-full bg-gray-100 p-6 mb-4">
        <Calendar className="h-12 w-12 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{getMessage()}</h3>
      <p className="text-sm text-gray-500 mb-6">{getHint()}</p>
      <Button
        onClick={() => onDateRangeChange(availableFrom, availableTo)}
        variant="outline"
      >
        Выбрать доступный период
      </Button>
    </div>
  );
}
```

### Integration with Data Hook

```typescript
export function useAdvertisingAnalytics(params: AdvertisingQueryParams) {
  return useQuery({
    queryKey: ['advertising-analytics', params],
    queryFn: () => apiClient.get('/v1/analytics/advertising', { params }),
    select: (response) => {
      const isEmpty = response.data.length === 0;
      return {
        ...response,
        isEmpty,
        isEmptyState: isEmpty,
      };
    },
  });
}

// Usage in component
const { data, isLoading, error } = useAdvertisingAnalytics({
  from: dateRange.from,
  to: dateRange.to,
});

if (data?.isEmptyState && syncStatus) {
  return (
    <AdvertisingEmptyState
      requestedFrom={dateRange.from}
      requestedTo={dateRange.to}
      availableFrom={syncStatus.dataAvailableFrom}
      availableTo={syncStatus.dataAvailableTo}
      onDateRangeChange={(from, to) => setDateRange({ from, to })}
    />
  );
}
```

---

## Example API Responses

### Empty Response (No Data for Range)

```json
{
  "meta": {
    "cabinet_id": "uuid-here",
    "date_range": {
      "from": "2025-11-18",
      "to": "2025-11-24"
    },
    "view_by": "sku",
    "last_sync": "2026-01-30T06:00:00.000Z"
  },
  "summary": {
    "total_spend": 0,
    "total_revenue": 0,
    "total_profit": 0,
    "overall_roas": 0,
    "overall_roi": 0,
    "avg_ctr": 0,
    "avg_conversion_rate": 0,
    "campaign_count": 0,
    "active_campaigns": 0
  },
  "data": []
}
```

### Sync Status Response

```json
{
  "cabinet_id": "uuid",
  "lastSyncAt": "2026-01-30T06:00:00.000Z",
  "nextScheduledSync": "2026-01-31T06:00:00.000Z",
  "status": "completed",
  "campaignsSynced": 15,
  "dataAvailableFrom": "2025-12-01",
  "dataAvailableTo": "2026-01-28"
}
```

### Data Response (With Data)

```json
{
  "meta": {
    "cabinet_id": "uuid-here",
    "date_range": {
      "from": "2025-12-01",
      "to": "2025-12-07"
    },
    "view_by": "sku",
    "last_sync": "2026-01-30T06:00:00.000Z"
  },
  "summary": {
    "total_spend": 15420.50,
    "total_revenue": 48750.00,
    "total_profit": 12345.00,
    "overall_roas": 3.16,
    "overall_roi": 0.46,
    "avg_ctr": 2.8,
    "avg_conversion_rate": 4.2,
    "campaign_count": 5,
    "active_campaigns": 3
  },
  "data": [
    {
      "sku_id": "123456",
      "product_name": "Product Name",
      "views": 15234,
      "clicks": 427,
      "orders": 18,
      "spend": 2450.50,
      "revenue": 7650.00,
      "profit": 2345.00,
      "roas": 3.12,
      "roi": 0.44,
      "ctr": 2.8,
      "cpc": 5.74,
      "conversion_rate": 4.22,
      "profit_after_ads": -105.50,
      "efficiency_status": "good"
    }
  ]
}
```

---

## Best Practices

### 1. Always Check Available Range

```typescript
// Bad: Don't make requests without validation
const { data } = useAdvertisingAnalytics({ from, to });

// Good: Validate first
const { data: syncStatus } = useAdvertisingSyncStatus();
const validation = validateAdvertisingDateRange(
  from,
  to,
  syncStatus?.dataAvailableFrom,
  syncStatus?.dataAvailableTo
);

if (!validation.isValid) {
  showToast({ variant: 'error', description: validation.error });
  return;
}

const { data } = useAdvertisingAnalytics({ from, to });
```

### 2. Cache Sync Status Response

```typescript
const { data: syncStatus } = useAdvertisingSyncStatus({
  staleTime: 5 * 60 * 1000, // 5 minutes
  gcTime: 10 * 60 * 1000, // 10 minutes
});
```

### 3. Show Clear Messages

```typescript
// Bad: Generic error message
toast.error('Нет данных');

// Good: Specific message with context
toast.error(
  `Нет данных за период ${formatDateRange(from, to)}. ` +
  `Доступны данные ${formatDateRange(availableFrom, availableTo)}`
);
```

### 4. Provide Quick Actions

```typescript
// Empty state component should provide action
<Button onClick={() => setDateRange({ from: availableFrom, to: availableTo })}>
  Выбрать доступный период
</Button>
```

---

## Common Patterns

### Pattern 1: Page-Level Component

```typescript
export function AdvertisingAnalyticsPage() {
  const { data: syncStatus } = useAdvertisingSyncStatus();
  const [dateRange, setDateRange] = useState({ from: '', to: '' });

  // Set default range on mount
  useEffect(() => {
    if (syncStatus?.dataAvailableTo) {
      const to = new Date(syncStatus.dataAvailableTo);
      const from = subDays(to, 30);
      setDateRange({
        from: from.toISOString().split('T')[0],
        to: to.toISOString().split('T')[0],
      });
    }
  }, [syncStatus]);

  // Validate before query
  const validation = useMemo(
    () =>
      syncStatus
        ? validateAdvertisingDateRange(
            dateRange.from,
            dateRange.to,
            syncStatus.dataAvailableFrom,
            syncStatus.dataAvailableTo
          )
        : null,
    [dateRange, syncStatus]
  );

  const { data, isLoading } = useAdvertisingAnalytics(
    dateRange,
    validation?.isValid ?? false
  );

  if (!syncStatus || !validation) return <Skeleton />;

  if (data?.isEmptyState) {
    return (
      <AdvertisingEmptyState
        requestedFrom={dateRange.from}
        requestedTo={dateRange.to}
        availableFrom={syncStatus.dataAvailableFrom}
        availableTo={syncStatus.dataAvailableTo}
        onDateRangeChange={setDateRange}
      />
    );
  }

  return (
    <div>
      <SmartAdvertisingDatePicker
        availableFrom={syncStatus.dataAvailableFrom}
        availableTo={syncStatus.dataAvailableTo}
        onRangeChange={setDateRange}
      />
      {/* Data visualization */}
    </div>
  );
}
```

### Pattern 2: Reusable Hook

```typescript
export function useAdvertisingDateRange() {
  const { data: syncStatus } = useAdvertisingSyncStatus();
  const [dateRange, setDateRange] = useState({ from: '', to: '' });

  // Initialize with default range
  useEffect(() => {
    if (syncStatus?.dataAvailableTo && !dateRange.from) {
      const to = new Date(syncStatus.dataAvailableTo);
      const from = subDays(to, 30);
      setDateRange({
        from: from.toISOString().split('T')[0],
        to: to.toISOString().split('T')[0],
      });
    }
  }, [syncStatus, dateRange.from]);

  // Validate
  const validation = useMemo(
    () =>
      syncStatus && dateRange.from && dateRange.to
        ? validateAdvertisingDateRange(
            dateRange.from,
            dateRange.to,
            syncStatus.dataAvailableFrom,
            syncStatus.dataAvailableTo
          )
        : null,
    [dateRange, syncStatus]
  );

  return {
    dateRange,
    setDateRange,
    validation,
    availableRange: syncStatus
      ? {
          from: syncStatus.dataAvailableFrom,
          to: syncStatus.dataAvailableTo,
        }
      : null,
    isReady: !!syncStatus,
  };
}
```

---

## Related Documentation

- **[Request #115](./115-advertising-date-filter-empty-state-behavior.md)** - Complete empty state behavior guide
- **[Request #71](./71-advertising-analytics-epic-33.md)** - Advertising Analytics API documentation
- **[API Integration Guide](../api-integration-guide.md)** - Full API reference

---

**Created**: 2026-01-30
**Product Manager**: Frontend quick reference guide
**Status**: ✅ Complete
