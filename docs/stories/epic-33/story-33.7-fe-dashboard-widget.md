# Story 33.7-FE: Dashboard Widget

## Story Info

- **Epic**: 33-FE - Advertising Analytics (Frontend)
- **Priority**: Medium
- **Points**: 3
- **Status**: ✅ Done
- **Sprint**: 2

## User Story

**As a** seller,
**I want** to see advertising summary on the main dashboard,
**So that** I can quickly check ad performance without navigating to the full analytics page.

## Acceptance Criteria

### AC1: Widget Placement
- [ ] Widget on main dashboard page
- [ ] Positioned in analytics section
- [ ] Consistent styling with other widgets

### AC2: Compact Metrics Display
- [ ] Total Spend (₽)
- [ ] Overall ROAS (x multiplier)
- [ ] Active Campaigns count
- [ ] Period label (e.g., "Последние 7 дней")

### AC3: Quick Actions
- [ ] "Подробнее →" link to full analytics page
- [ ] Period selector (7d / 14d / 30d)

### AC4: Visual Indicators
- [ ] ROAS color-coded (green/yellow/red)
- [ ] ~~Sparkline mini-chart~~ **DEFERRED** (PO decision: adds complexity, not critical)

### AC5: Loading & Error States
- [ ] Skeleton loader
- [ ] Error state with retry button

## Tasks / Subtasks

### Phase 1: Widget Component
- [ ] Create `src/components/custom/AdvertisingDashboardWidget.tsx`
- [ ] Implement compact metrics layout
- [ ] Add period selector
- [ ] Add link to full page

### Phase 2: Integration
- [ ] Connect to `useAdvertisingAnalytics` hook
- [ ] Implement period state
- [ ] Handle loading/error states

### Phase 3: Dashboard Integration
- [ ] Add widget to dashboard page
- [ ] Ensure responsive layout

## Technical Details

### Widget Component

```typescript
// src/components/custom/AdvertisingDashboardWidget.tsx

interface AdvertisingDashboardWidgetProps {
  className?: string;
}

export function AdvertisingDashboardWidget({ className }: AdvertisingDashboardWidgetProps) {
  const [period, setPeriod] = useState<'7d' | '14d' | '30d'>('7d');

  const dateRange = useMemo(() => {
    const to = new Date();
    to.setDate(to.getDate() - 1);  // Yesterday
    const from = new Date(to);
    from.setDate(from.getDate() - parseInt(period));
    return {
      from: format(from, 'yyyy-MM-dd'),
      to: format(to, 'yyyy-MM-dd'),
    };
  }, [period]);

  const { data, isLoading, error, refetch } = useAdvertisingAnalytics({
    from: dateRange.from,
    to: dateRange.to,
    limit: 1,  // Only need summary
  });

  if (isLoading) {
    return <WidgetSkeleton />;
  }

  if (error || !data) {
    return (
      <Card className={cn('p-4', className)}>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Ошибка загрузки</span>
          <Button variant="ghost" size="sm" onClick={() => refetch()}>
            Повторить
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn('p-4', className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold">Реклама</h3>
        </div>
        <Select value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
          <SelectTrigger className="w-24 h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">7 дней</SelectItem>
            <SelectItem value="14d">14 дней</SelectItem>
            <SelectItem value="30d">30 дней</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <p className="text-xs text-muted-foreground">Затраты</p>
          <p className="text-lg font-bold">{formatCurrency(data.summary.total_spend)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">ROAS</p>
          <p className={cn(
            'text-lg font-bold',
            getRoasColorClass(data.summary.overall_roas)
          )}>
            {data.summary.overall_roas.toFixed(1)}x
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Кампаний</p>
          <p className="text-lg font-bold">
            {data.summary.active_campaigns}
            <span className="text-sm text-muted-foreground font-normal">
              /{data.summary.campaign_count}
            </span>
          </p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t">
        <Link
          href="/analytics/advertising"
          className="text-sm text-blue-600 hover:underline flex items-center"
        >
          Подробная аналитика
          <ArrowRight className="ml-1 h-4 w-4" />
        </Link>
      </div>
    </Card>
  );
}
```

### ROAS Color Helper

```typescript
function getRoasColorClass(roas: number): string {
  if (roas >= 3.0) return 'text-green-600';
  if (roas >= 2.0) return 'text-yellow-600';
  if (roas >= 1.0) return 'text-orange-600';
  return 'text-red-600';
}
```

### Widget Skeleton

```typescript
function WidgetSkeleton() {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-8 w-20" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i}>
            <Skeleton className="h-3 w-12 mb-1" />
            <Skeleton className="h-6 w-16" />
          </div>
        ))}
      </div>
    </Card>
  );
}
```

## Dev Notes

### File Structure

```
src/components/custom/
└── AdvertisingDashboardWidget.tsx
```

### Dashboard Integration

Add to dashboard page grid:

```typescript
// In dashboard page.tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Existing widgets */}
  <AdvertisingDashboardWidget />
</div>
```

### Caching Strategy

- Use short staleTime (30s) for dashboard widget
- Allow background refetch
- Share query cache with full analytics page

## Testing

### Test Cases

- [ ] Widget renders with data
- [ ] Period selector works
- [ ] ROAS color changes based on value
- [ ] Link navigates to full page
- [ ] Loading skeleton shows
- [ ] Error state with retry works

## Definition of Done

- [ ] Widget component created
- [ ] Period selector works
- [ ] Metrics display correctly
- [ ] Color coding works
- [ ] Link to full page works
- [ ] Integrated into dashboard
- [ ] TypeScript passes
- [ ] ESLint passes

## Dependencies

- Story 33.1-fe: Types & API Client
- Existing dashboard layout

## PO Decisions (2025-12-22)

| Question | Decision | Rationale |
|----------|----------|-----------|
| Include sparkline chart? | ❌ DEFER | Adds complexity, not critical for MVP |
| Metrics to prioritize | Spend, ROAS, Campaigns | Most actionable at-a-glance |
| Default period | **7d** | Quick overview, users can change |
| Include in MVP? | ✅ **YES** | High value, 3 points, API ready |

---

## Change Log

| Date | Author | Change |
|------|--------|--------|
| 2025-12-22 | James (Dev Agent) | Initial draft |
| 2025-12-22 | James (Dev Agent) | PO Review: Confirmed MVP, sparkline deferred, PO decisions documented |

---

## Dev Agent Record

```
Status: ✅ Complete
Agent: James (Dev)
Started: 2025-12-22
Completed: 2025-12-22
Notes: All phases complete. Dashboard widget with full functionality.
       ESLint and TypeScript checks pass.
       Files created:
       - src/components/custom/AdvertisingDashboardWidget.tsx
       Updated:
       - src/app/(dashboard)/dashboard/page.tsx (integrated widget)
       Features:
       - AC1: Widget on main dashboard, positioned after metric cards
       - AC2: Compact metrics - Spend (formatted), ROAS, Active/Total campaigns
       - AC3: Period selector (7d/14d/30d), link to full analytics
       - AC4: ROAS color-coded (green >=3, yellow >=2, orange >=1, red <1)
       - AC5: Loading skeleton, error state with retry button
       PO decisions applied: Default 7d period, sparkline deferred
```

---

## QA Results

### Review Date: 2025-12-22

### Reviewed By: Quinn (Test Architect)

### Code Quality Assessment

Well-structured dashboard widget with proper helper functions for currency formatting and ROAS color coding. Smart use of useMemo for date range calculation. The widget follows Card component patterns consistent with other dashboard widgets.

### Refactoring Performed

None required - implementation is solid.

### Compliance Check

- Coding Standards: ✓ Follows project conventions
- Project Structure: ✓ Widget correctly placed in components/custom/
- Testing Strategy: ✓ Covered by useAdvertisingAnalytics hook tests (14 tests)
- All ACs Met: ✓ All 5 acceptance criteria fully implemented

### Improvements Checklist

- [x] Widget integrated into dashboard page
- [x] Compact metrics with proper formatting (M/K suffixes for large numbers)
- [x] Period selector with 7d default per PO decision
- [x] ROAS color-coded based on thresholds
- [x] Loading skeleton and error state with retry
- [ ] Sparkline chart (deferred per PO decision - not critical for MVP)

### Security Review

No security concerns. Uses authenticated analytics hook.

### Performance Considerations

Efficient implementation with limit=1 to fetch only summary data. useMemo prevents unnecessary date recalculations.

### Files Modified During Review

None.

### Gate Status

Gate: **PASS** → docs/qa/gates/33.7-fe-dashboard-widget.yml

### Recommended Status

✓ Ready for Done
