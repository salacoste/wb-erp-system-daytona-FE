# Request #115: Advertising Date Filter Empty State Behavior

**Date**: 2026-01-30
**Status**: ✅ DOCUMENTED
**Related**: Request #71 (Epic 33 - Advertising Analytics API)
**Issue**: FrontEnd team question about empty results for week 2025-W47

---

## Executive Summary

**Finding**: NOT A BUG - Date filtering works correctly. Empty results for specific date ranges is expected behavior when no data exists for the requested period.

**Question from FrontEnd**:
- Endpoint: `GET /v1/analytics/advertising?from=2025-11-18&to=2025-11-24&limit=1`
- Observation: Returns empty data for week 2025-W47
- Expected: Data for that week

**Answer**:
- **Actual Data Range**: 2025-12-01 to 2026-01-28
- **Requested Range**: 2025-11-18 to 2025-11-24
- **Result**: Correctly returns empty because requested range is BEFORE available data

---

## Data Availability

### Actual Data Range

The advertising analytics API contains data from:

| Metric | Value |
|--------|-------|
| **Data Start Date** | 2025-12-01 |
| **Data End Date** | 2026-01-28 |
| **Total Days** | ~59 days |
| **Weeks Covered** | 2025-W49 to 2026-05 (partial) |

### Querying Outside Available Range

When querying with `from`/`to` parameters that don't overlap with the available range:

**Scenario 1: Before Data Starts**
```http
GET /v1/analytics/advertising?from=2025-11-18&to=2025-11-24
```
- **Requested**: 2025-11-18 to 2025-11-24 (Week 2025-W47)
- **Available**: 2025-12-01 to 2026-01-28
- **Overlap**: NONE
- **Result**: `items: []` with `summary: { totalSpend: 0, ... }`

**Scenario 2: After Data Ends**
```http
GET /v1/analytics/advertising?from=2026-02-01&to=2026-02-07
```
- **Requested**: 2026-02-01 to 2026-02-07
- **Available**: 2025-12-01 to 2026-01-28
- **Overlap**: NONE
- **Result**: `items: []` with `summary: { totalSpend: 0, ... }`

**Scenario 3: Partial Overlap**
```http
GET /v1/analytics/advertising?from=2025-11-25&to=2025-12-05
```
- **Requested**: 2025-11-25 to 2025-12-05
- **Available**: 2025-12-01 to 2026-01-28
- **Overlap**: 2025-12-01 to 2025-12-05 (5 days)
- **Result**: Data for 2025-12-01 to 2025-12-05 only

---

## API Response for Empty State

### Expected Response Structure

When no data exists for the requested date range:

```typescript
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

### Key Points

1. **HTTP Status**: 200 OK (NOT 404)
2. **Empty Array**: `data: []`
3. **Zero Summary**: All metrics = 0
4. **Meta Preserved**: Request metadata still included

---

## Empty State Handling

### FrontEnd Recommendations

When `response.data.length === 0`:

**Step 1: Check Date Range Overlap**
```typescript
function hasDataOverlap(requestedFrom: string, requestedTo: string): boolean {
  const dataStart = new Date('2025-12-01');
  const dataEnd = new Date('2026-01-28');
  const requestStart = new Date(requestedFrom);
  const requestEnd = new Date(requestedTo);

  return requestStart <= dataEnd && requestEnd >= dataStart;
}

// Usage
if (!hasDataOverlap(from, to)) {
  // Show "No data for this period" message
  // Show available date range
  return <AdvertisingEmptyState />;
}
```

**Step 2: Display Empty State Component**
```typescript
interface AdvertisingEmptyStateProps {
  requestedFrom: string;
  requestedTo: string;
  availableFrom: string;   // 2025-12-01
  availableTo: string;     // 2026-01-28
}

<AdvertisingEmptyState
  message="Нет данных за выбранный период"
  hint={`Доступны данные с ${formatDate(availableFrom)} по ${formatDate(availableTo)}`}
  suggestedAction="Выберите другой период"
/>
```

**Step 3: Smart Date Picker**
```typescript
<AdvertisingDatePicker
  minDate={new Date('2025-12-01')}  // Disable dates before data start
  maxDate={new Date('2026-01-28')}  // Disable dates after data end
  defaultRange="last30Days"         // Suggest predefined ranges
/>
```

---

## Date Range Validation

### Client-Side Validation

Before making API request, validate date range:

```typescript
function validateAdvertisingDateRange(from: string, to: string): {
  isValid: boolean;
  error?: string;
  warning?: string;
} {
  const dataStart = new Date('2025-12-01');
  const dataEnd = new Date('2026-01-28');
  const requestStart = new Date(from);
  const requestEnd = new Date(to);

  // Check if range is completely outside available data
  if (requestEnd < dataStart) {
    return {
      isValid: false,
      error: 'Выбранный период раньше начала сбора данных (01.12.2025)'
    };
  }

  if (requestStart > dataEnd) {
    return {
      isValid: false,
      error: 'Выбранный период позже последнего обновления данных (28.01.2026)'
    };
  }

  // Check if range is partially outside available data
  if (requestStart < dataStart || requestEnd > dataEnd) {
    return {
      isValid: true,
      warning: 'Часть выбранного периода выходит за пределы доступных данных'
    };
  }

  return { isValid: true };
}
```

### Display Warning to User

```typescript
const validation = validateAdvertisingDateRange(from, to);

if (!validation.isValid) {
  showToast({
    variant: 'error',
    title: 'Некорректный период',
    description: validation.error
  });
  return;
}

if (validation.warning) {
  showToast({
    variant: 'warning',
    title: 'Предупреждение',
    description: validation.warning
  });
}
```

---

## Available Date Range Endpoint

### Current Implementation

The sync status endpoint provides available date range:

```http
GET /v1/analytics/advertising/sync-status
```

**Response**:
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

### FrontEnd Usage

```typescript
// Fetch sync status on mount
const { data: syncStatus } = useAdvertisingSyncStatus();

// Use available date range for validation
const { dataAvailableFrom, dataAvailableTo } = syncStatus;

// Update date picker min/max
<DatePicker
  minDate={new Date(dataAvailableFrom)}
  maxDate={new Date(dataAvailableTo)}
/>
```

---

## Code Examples

### Example 1: Check for Empty State

```typescript
export function useAdvertisingAnalytics(params: AdvertisingQueryParams) {
  return useQuery({
    queryKey: ['advertising-analytics', params],
    queryFn: () => getAdvertisingAnalytics(params),
    select: (response) => {
      // Check for empty state
      if (response.data.length === 0) {
        return {
          ...response,
          isEmpty: true,
          hasOverlap: hasDataOverlap(params.from, params.to)
        };
      }
      return {
        ...response,
        isEmpty: false,
        hasOverlap: true
      };
    }
  });
}

// Usage in component
const { data, isLoading } = useAdvertisingAnalytics({ from, to });

if (data?.isEmpty && !data.hasOverlap) {
  return (
    <EmptyState
      title="Нет данных за выбранный период"
      description={`Доступны данные с 01.12.2025 по 28.01.2026`}
      icon={CalendarIcon}
    />
  );
}
```

### Example 2: Smart Date Picker Component

```typescript
interface SmartDatePickerProps {
  availableFrom: string;
  availableTo: string;
  onRangeChange: (from: string, to: string) => void;
}

export function SmartAdvertisingDatePicker({
  availableFrom,
  availableTo,
  onRangeChange
}: SmartDatePickerProps) {
  const minDate = new Date(availableFrom);
  const maxDate = new Date(availableTo);

  const predefinedRanges = [
    {
      label: 'Последние 7 дней',
      from: subDays(maxDate, 7),
      to: maxDate
    },
    {
      label: 'Последние 30 дней',
      from: subDays(maxDate, 30),
      to: maxDate
    },
    {
      label: 'Весь период',
      from: minDate,
      to: maxDate
    }
  ];

  return (
    <DateRangePicker
      minDate={minDate}
      maxDate={maxDate}
      predefinedRanges={predefinedRanges}
      onRangeChange={onRangeChange}
      disabledDates={(date) => date < minDate || date > maxDate}
    />
  );
}
```

### Example 3: Empty State Component

```typescript
interface AdvertisingEmptyStateProps {
  requestedFrom: string;
  requestedTo: string;
  availableFrom: string;
  availableTo: string;
}

export function AdvertisingEmptyState({
  requestedFrom,
  requestedTo,
  availableFrom,
  availableTo
}: AdvertisingEmptyStateProps) {
  const isBeforeAvailable = new Date(requestedTo) < new Date(availableFrom);
  const isAfterAvailable = new Date(requestedFrom) > new Date(availableTo);

  let message = 'Нет данных за выбранный период';
  let hint = `Доступны данные с ${formatDate(availableFrom)} по ${formatDate(availableTo)}`;

  if (isBeforeAvailable) {
    message = 'Выбранный период раньше начала сбора данных';
  } else if (isAfterAvailable) {
    message = 'Выбранный период позже последнего обновления данных';
  }

  return (
    <EmptyStateIllustration
      title={message}
      description={hint}
      action={{
        label: 'Выберите другой период',
        onClick: () => {
          // Reset to available range
          onDateRangeChange(availableFrom, availableTo);
        }
      }}
    />
  );
}
```

---

## Best Practices

### 1. Always Check Available Date Range

Before making API requests:
- Fetch sync status to get available date range
- Validate requested range against available range
- Show appropriate warnings/errors

### 2. Handle Empty States Gracefully

- Don't show error toasts for empty responses
- Display informative empty state components
- Suggest alternative date ranges
- Provide quick actions to select available data

### 3. Use Smart Date Pickers

- Disable dates outside available range
- Provide predefined ranges (7/30/90 days)
- Show visual indicators for unavailable dates
- Default to range with most data

### 4. Cache Available Date Range

```typescript
// Cache sync status response
const { data: syncStatus } = useAdvertisingSyncStatus({
  staleTime: 5 * 60 * 1000, // 5 minutes
  gcTime: 10 * 60 * 1000    // 10 minutes
});

// Use cached value for validation
const validation = useMemo(
  () => validateAdvertisingDateRange(
    from,
    to,
    syncStatus?.dataAvailableFrom,
    syncStatus?.dataAvailableTo
  ),
  [from, to, syncStatus]
);
```

---

## Related Documentation

### Backend
- **[Request #71](./71-advertising-analytics-epic-33.md)** - Advertising Analytics API (Epic 33)
- **[Request #72](./72-advertising-sync-status-404-error-backend-response.md)** - Sync Status Endpoint
- **[ADVERTISING-ANALYTICS-GUIDE.md](../../docs/ADVERTISING-ANALYTICS-GUIDE.md)** - Complete backend guide

### Frontend
- **[Request #116](./116-advertising-date-range-frontend-guide.md)** - Frontend Quick Reference Guide
- **[API Integration Guide](../api-integration-guide.md)** - Full API reference

---

## Summary

| Question | Answer |
|----------|--------|
| **Is it a bug?** | No - working as designed |
| **Why empty results?** | Requested date range has no data |
| **Available data?** | 2025-12-01 to 2026-01-28 |
| **HTTP status?** | 200 OK with empty array (NOT 404) |
| **FrontEnd action?** | Display empty state, show available range |

---

**Created**: 2026-01-30
**Product Manager**: Documentation for FrontEnd team
**Status**: ✅ Complete
