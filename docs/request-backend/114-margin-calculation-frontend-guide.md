# Request #114: Margin % Calculation - FrontEnd Quick Reference Guide

**Date**: 2026-01-30
**Purpose**: Quick troubleshooting guide for margin calculation issues
**Audience**: FrontEnd Developers
**Related**: Request #113 (Complete Documentation)

---

## Quick Troubleshooting

### Symptom: Margin Fields Return Null

**API Response**:
```json
{
  "sale_gross_total": 305778.32,
  "cogs_total": null,
  "gross_profit": null,
  "margin_pct": null
}
```

**Diagnosis**: `weekly_margin_fact` table is empty (not a bug)

**Solution**: Display empty state component with call-to-action

---

## API Response Examples

### Scenario 1: No Margin Data Available

**Response**:
```json
{
  "week": "2026-W04",
  "sale_gross_total": 305778.32,
  "cogs_total": null,
  "gross_profit": null,
  "margin_pct": null,
  "cogs_coverage_pct": 0
}
```

**FrontEnd Action**:
```tsx
{data.cogs_total === null && (
  <CogsMissingState
    coveragePercentage={0}
    onAssignCogs={() => router.push('/products')}
  />
)}
```

---

### Scenario 2: Margin Data Available

**Response**:
```json
{
  "week": "2026-W04",
  "sale_gross_total": 305778.32,
  "cogs_total": 53626.0,
  "gross_profit": 102038.76,
  "margin_pct": 33.4,
  "cogs_coverage_pct": 100
}
```

**FrontEnd Action**:
```tsx
{data.cogs_total !== null && (
  <>
    <MetricCard label="Себестоимость" value={formatCurrency(data.cogs_total)} />
    <MetricCard label="Валовая прибыль" value={formatCurrency(data.gross_profit)} />
    <MetricCard label="Маржинальность" value={formatPercentage(data.margin_pct)} />
  </>
)}
```

---

### Scenario 3: Partial COGS Coverage

**Response**:
```json
{
  "week": "2026-W04",
  "sale_gross_total": 305778.32,
  "cogs_total": 26813.0,
  "gross_profit": 51019.38,
  "margin_pct": 16.7,
  "cogs_coverage_pct": 50
}
```

**FrontEnd Action**:
```tsx
<div className="space-y-4">
  <WarningBadge>
    Покрытие COGS: {data.cogs_coverage_pct}%. Назначьте себестоимость всем товарам.
  </WarningBadge>

  <MetricCard label="Себестоимость" value={formatCurrency(data.cogs_total)} />
  <MetricCard label="Валовая прибыль" value={formatCurrency(data.gross_profit)} />
  <MetricCard label="Маржинальность" value={formatPercentage(data.margin_pct)} />
</div>
```

---

## Empty State Handling

### Component Reference

**Existing Components**:
- `MissingCogsAlert` - Displays warning with CTA
- `CogsMissingState` - Full empty state component
- `MetricCardEnhanced` - Metric card with empty state support

**File Locations**:
- `frontend/src/components/custom/MissingCogsAlert.tsx`
- `frontend/src/components/custom/CogsMissingState.tsx`
- `frontend/src/components/custom/MetricCardEnhanced.tsx`

---

### Implementation Pattern

```tsx
// hooks/useFinanceSummaryMargin.ts
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export function useFinanceSummaryMargin({ week }: { week: string }) {
  return useQuery({
    queryKey: ['finance-summary', 'margin', week],
    queryFn: async () => {
      const response = await apiClient.get(
        `/v1/analytics/weekly/finance-summary`,
        { params: { week } }
      );
      return response.data;
    },
    select: (data) => ({
      ...data,
      hasMarginData: data.cogs_total !== null && data.gross_profit !== null,
      coveragePercentage: data.cogs_coverage_pct ?? 0,
    }),
  });
}
```

```tsx
// components/FinanceSummaryMargin.tsx
export function FinanceSummaryMargin({ week }: { week: string }) {
  const { data, isLoading, error } = useFinanceSummaryMargin({ week });

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorDisplay error={error} />;

  if (!data.hasMarginData) {
    return (
      <CogsMissingState
        coveragePercentage={data.coveragePercentage}
        onAssignCogs={() => router.push('/products')}
      />
    );
  }

  return (
    <div className="grid grid-cols-3 gap-4">
      <MetricCard
        label="Выручка"
        value={formatCurrency(data.sale_gross_total)}
      />
      <MetricCard
        label="Себестоимость"
        value={formatCurrency(data.cogs_total!)}
      />
      <MetricCard
        label="Валовая прибыль"
        value={formatCurrency(data.gross_profit!)}
      />
    </div>
  );
}
```

---

## Common Scenarios

### Scenario 1: New Cabinet (No COGS Assigned)

**Symptoms**:
- All margin fields return `null`
- `cogs_coverage_pct: 0`

**User Action Required**:
1. Navigate to Products page
2. Assign COGS to products
3. Margin calculation will run automatically

**FrontEnd Display**:
```tsx
<EmptyState
  icon="📦"
  title="Нет данных о себестоимости"
  description="Назначьте себестоимость товарам для расчёта маржи"
  action={{
    label: "Назначить себестоимость",
    onClick: () => router.push('/products')
  }}
/>
```

---

### Scenario 2: Partial COGS Coverage

**Symptoms**:
- Some margin fields have values
- `cogs_coverage_pct: 50` (or other percentage < 100)

**User Action Required**:
1. Assign COGS to remaining products
2. Margin will automatically recalculate

**FrontEnd Display**:
```tsx
<WarningBanner>
  <Text>
    Покрытие COGS: <strong>{coveragePercentage}%</strong>.
    Назначьте себестоимость всем товарам для точного расчёта маржи.
  </Text>
  <Button onClick={() => router.push('/products')}>
    Назначить COGS
  </Button>
</WarningBanner>
```

---

### Scenario 3: Margin Calculation in Progress

**Symptoms**:
- COGS recently assigned
- Margin fields still show `null`

**Background Process**:
- Margin calculation is running in background queue
- Takes 5-30 seconds depending on data volume

**FrontEnd Action**:
- Poll `GET /v1/products/:nmId/margin-status` endpoint
- Display progress indicator
- Refresh data when status is `completed`

**Implementation**:
```tsx
// After COGS assignment
const { data: status } = useMarginStatus(nmId);

useEffect(() => {
  if (status?.status === 'completed') {
    // Refresh product data
    queryClient.invalidateQueries(['finance-summary']);
  }
}, [status?.status]);
```

---

## Testing Scenarios

### Test Case 1: Empty State Display

```
Given: API returns { cogs_total: null, gross_profit: null }
When: User views finance summary
Then: Display CogsMissingState component
And: Show warning about missing COGS
And: Provide CTA to assign COGS
```

**Test Code**:
```tsx
test('displays empty state when margin data is null', () => {
  const mockData = {
    sale_gross_total: 305778.32,
    cogs_total: null,
    gross_profit: null,
    margin_pct: null,
  };

  render(<FinanceSummaryMargin week="2026-W04" />, {
    providers: {
      queryClient: createTestQueryClient({
        data: mockData,
      }),
    },
  });

  expect(screen.getByText(/недостаточно данных/i)).toBeInTheDocument();
  expect(screen.getByText(/назначить себестоимость/i)).toBeInTheDocument();
});
```

---

### Test Case 2: Margin Data Display

```
Given: API returns { cogs_total: 53626.0, gross_profit: 102038.76 }
When: User views finance summary
Then: Display margin metrics with values
And: Calculate margin_pct correctly
```

**Test Code**:
```tsx
test('displays margin data when available', () => {
  const mockData = {
    sale_gross_total: 305778.32,
    cogs_total: 53626.0,
    gross_profit: 102038.76,
    margin_pct: 33.4,
  };

  render(<FinanceSummaryMargin week="2026-W04" />, {
    providers: {
      queryClient: createTestQueryClient({
        data: mockData,
      }),
    },
  });

  expect(screen.getByText(/53 626,00 ₽/)).toBeInTheDocument();
  expect(screen.getByText(/102 038,76 ₽/)).toBeInTheDocument();
  expect(screen.getByText(/33,4 %/)).toBeInTheDocument();
});
```

---

### Test Case 3: Partial Coverage Warning

```
Given: API returns { cogs_coverage_pct: 50 }
When: User views finance summary
Then: Display warning about partial coverage
And: Show percentage
And: Provide CTA to assign remaining COGS
```

**Test Code**:
```tsx
test('displays partial coverage warning', () => {
  const mockData = {
    sale_gross_total: 305778.32,
    cogs_total: 26813.0,
    gross_profit: 51019.38,
    margin_pct: 16.7,
    cogs_coverage_pct: 50,
  };

  render(<FinanceSummaryMargin week="2026-W04" />, {
    providers: {
      queryClient: createTestQueryClient({
        data: mockData,
      }),
    },
  });

  expect(screen.getByText(/покрытие cogs: 50%/i)).toBeInTheDocument();
  expect(screen.getByText(/назначьте себестоимость/i)).toBeInTheDocument();
});
```

---

## Quick Reference Card

### Null Value Handling

| Field | When Null | FrontEnd Action |
|-------|-----------|-----------------|
| `cogs_total` | No COGS data | Display empty state |
| `gross_profit` | No margin calculation | Display empty state |
| `margin_pct` | Cannot calculate | Display empty state |
| `cogs_coverage_pct` | No products with COGS | Show 0% coverage |

### Coverage Percentage Thresholds

| Coverage | Display | Action |
|----------|---------|--------|
| 0% | Empty state | Assign COGS to all products |
| 1-99% | Warning banner | Assign COGS to remaining products |
| 100% | Full metrics | No action needed |

### Status Checking

**Endpoint**: `GET /v1/products/:nmId/margin-status`

**Status Values**:
- `pending` - Task queued, show "Расчёт маржи..."
- `in_progress` - Task processing, show progress
- `completed` - Calculation finished, refresh data
- `failed` - Calculation failed, show error
- `not_found` - No task, no margin data

---

## Related Documentation

- **Request #113**: `frontend/docs/request-backend/113-margin-calculation-empty-state-behavior.md`
- **Request #21**: `frontend/docs/request-backend/21-margin-calculation-status-endpoint-backend.md`
- **Request #24**: `frontend/docs/request-backend/24-margin-cogs-integration-guide.md`
- **Epic 56**: `docs/epics/epic-56-historical-inventory-import.md`
- **FrontEnd Spec**: `frontend/docs/front-end-spec.md`

---

## Component Props Reference

### CogsMissingState

```tsx
interface CogsMissingStateProps {
  coveragePercentage: number;
  onAssignCogs: () => void;
  week?: string;
}
```

**Usage**:
```tsx
<CogsMissingState
  coveragePercentage={data.cogs_coverage_pct ?? 0}
  onAssignCogs={() => router.push('/products')}
  week="2026-W04"
/>
```

---

### MissingCogsAlert

```tsx
interface MissingCogsAlertProps {
  coveragePercentage: number;
  onDismiss?: () => void;
  onAssignCogs: () => void;
}
```

**Usage**:
```tsx
<MissingCogsAlert
  coveragePercentage={data.cogs_coverage_pct ?? 0}
  onAssignCogs={() => router.push('/products')}
  onDismiss={() => setShowAlert(false)}
/>
```

---

### MetricCardEnhanced

```tsx
interface MetricCardEnhancedProps {
  label: string;
  value: string | number | null;
  empty?: boolean;
  trend?: number;
  format?: 'currency' | 'percentage' | 'number';
}
```

**Usage**:
```tsx
<MetricCardEnhanced
  label="Себестоимость"
  value={data.cogs_total}
  empty={data.cogs_total === null}
  format="currency"
/>
```

---

## FAQ

### Q: Why do margin fields return null?

**A**: The `weekly_margin_fact` table is empty because the data aggregation pipeline hasn't been implemented yet. This is expected behavior, not a bug.

### Q: What should I display when margins are null?

**A**: Display an empty state component (e.g., `CogsMissingState`) with a call-to-action to assign COGS.

### Q: How do I check if margin calculation is in progress?

**A**: Use the `GET /v1/products/:nmId/margin-status` endpoint to check task status.

### Q: When will the aggregation pipeline be implemented?

**A**: This requires a new Epic. See Request #113 for the complete roadmap.

---

**Last Updated**: 2026-01-30
**Maintained By**: FrontEnd Team
**Related Request**: #113 (Complete Documentation)
