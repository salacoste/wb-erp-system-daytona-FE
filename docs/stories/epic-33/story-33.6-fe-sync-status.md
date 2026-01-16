# Story 33.6-FE: Sync Status Display

## Story Info

- **Epic**: 33-FE - Advertising Analytics (Frontend)
- **Priority**: Low
- **Points**: 2
- **Status**: ✅ Done

## User Story

**As a** seller,
**I want** to see the sync status of advertising data,
**So that** I know if my data is up-to-date.

## Acceptance Criteria

### AC1: Health Status Indicator
- [ ] Show colored dot for health_status
- [ ] Healthy: Green dot
- [ ] Degraded: Yellow dot
- [ ] Unhealthy: Red dot
- [ ] Stale: Orange dot

### AC2: Status Information
- [ ] Last sync timestamp (relative time)
- [ ] Next scheduled sync time
- [ ] Error count in last 24h

### AC3: Tooltip Details
- [ ] Campaigns synced count
- [ ] Stats records synced count
- [ ] Cost records synced count
- [ ] Sync duration

### AC4: Auto-Refresh
- [ ] Poll sync status every 60 seconds
- [ ] Update indicator without page refresh

### AC5: Accessibility
- [ ] Status indicator has aria-label
- [ ] Tooltip accessible via keyboard focus
- [ ] Color is supplemented with text label

### Note: 26-hour Stale Threshold
Backend marks sync as "stale" after 26 hours (not 24h).
**Rationale**: 24h daily sync schedule + 2h buffer for network delays and retry attempts.

## Tasks / Subtasks

### Phase 1: Indicator Component
- [ ] Create `components/SyncStatusIndicator.tsx`
- [ ] Implement health status dot
- [ ] Add relative time display
- [ ] Add tooltip with details

### Phase 2: Integration
- [ ] Connect to `useAdvertisingSyncStatus` hook
- [ ] Set up 60s polling interval
- [ ] Handle loading/error states

## Technical Details

### Health Status Colors

```typescript
export const healthStatusConfig: Record<HealthStatus, {
  label: string;
  dotColor: string;
  description: string;
}> = {
  healthy: {
    label: 'Синхронизировано',
    dotColor: 'bg-green-500',
    description: 'Данные актуальны',
  },
  degraded: {
    label: 'Частичная синхронизация',
    dotColor: 'bg-yellow-500',
    description: 'Есть ошибки, но синхронизация работает',
  },
  unhealthy: {
    label: 'Ошибка синхронизации',
    dotColor: 'bg-red-500',
    description: 'Синхронизация не работает',
  },
  stale: {
    label: 'Данные устарели',
    dotColor: 'bg-orange-500',
    // 26h = 24h daily sync + 2h buffer for delays
    description: 'Нет синхронизации более 26 часов',
  },
};
```

### Indicator Component

```typescript
// src/app/(dashboard)/analytics/advertising/components/SyncStatusIndicator.tsx

export function SyncStatusIndicator() {
  const { data, isLoading, error } = useAdvertisingSyncStatus({
    refetchInterval: 60000,  // 1 minute
    refetchIntervalInBackground: false,
  });

  if (isLoading) {
    return <Skeleton className="w-24 h-6" />;
  }

  if (error || !data) {
    return (
      <span className="text-sm text-muted-foreground">
        Статус недоступен
      </span>
    );
  }

  const config = healthStatusConfig[data.health_status];
  const lastSync = data.last_sync_at
    ? formatDistanceToNow(new Date(data.last_sync_at), { addSuffix: true, locale: ru })
    : 'никогда';

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-2 text-sm">
          <span className={cn('w-2 h-2 rounded-full', config.dotColor)} />
          <span className="text-muted-foreground">
            Обновлено {lastSync}
          </span>
        </div>
      </TooltipTrigger>
      <TooltipContent className="w-64">
        <div className="space-y-2">
          <div className="flex items-center gap-2 font-medium">
            <span className={cn('w-2 h-2 rounded-full', config.dotColor)} />
            {config.label}
          </div>
          <p className="text-sm text-muted-foreground">{config.description}</p>

          <div className="border-t pt-2 space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Кампаний:</span>
              <span>{data.campaigns_synced}</span>
            </div>
            <div className="flex justify-between">
              <span>Записей статистики:</span>
              <span>{data.stats_records_synced}</span>
            </div>
            <div className="flex justify-between">
              <span>Записей затрат:</span>
              <span>{data.cost_records_synced}</span>
            </div>
            <div className="flex justify-between">
              <span>Время синхр.:</span>
              <span>{data.sync_duration_seconds}с</span>
            </div>
          </div>

          {data.error_count_last_24h > 0 && (
            <div className="border-t pt-2 text-sm text-red-600">
              Ошибок за 24ч: {data.error_count_last_24h}
            </div>
          )}

          <div className="border-t pt-2 text-sm text-muted-foreground">
            След. синхр.: {format(new Date(data.next_scheduled_sync), 'HH:mm')}
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
```

### Integration in Header

```typescript
// In AdvertisingPageHeader.tsx
<div className="flex items-center justify-between">
  <div className="flex items-center gap-2">
    <Megaphone className="h-6 w-6" />
    <h1 className="text-2xl font-bold">Рекламная аналитика</h1>
  </div>
  <SyncStatusIndicator />
</div>
```

## Dev Notes

### File Structure

```
src/app/(dashboard)/analytics/advertising/components/
└── SyncStatusIndicator.tsx    # Status indicator with tooltip
```

### Polling Behavior

- Poll every 60 seconds when page is active
- Stop polling when tab is in background
- Resume polling when tab becomes active

### Error Handling

- If sync status API fails, show "Статус недоступен"
- Don't block page load if status is unavailable

## Testing

### Test Cases

- [ ] Indicator shows correct color for each health status
- [ ] Relative time is formatted correctly
- [ ] Tooltip shows all sync details
- [ ] Auto-refresh works (mock timer)
- [ ] Error state shows gracefully

## Definition of Done

- [ ] SyncStatusIndicator component created
- [ ] All 4 health statuses styled
- [ ] Tooltip shows sync details
- [ ] 60s polling works
- [ ] TypeScript passes
- [ ] ESLint passes

## Dependencies

- Story 33.1-fe: Types & API Client
- Story 33.2-fe: Page Layout (header)

---

## Change Log

| Date | Author | Change |
|------|--------|--------|
| 2025-12-22 | James (Dev Agent) | Initial draft |
| 2025-12-22 | James (Dev Agent) | PO Review: Added 26h rationale documentation, AC5 (accessibility) |

---

## Dev Agent Record

```
Status: ✅ Complete
Agent: James (Dev)
Started: 2025-12-22
Completed: 2025-12-22
Notes: All phases complete. Sync status indicator with full functionality.
       ESLint and TypeScript checks pass.
       Files created:
       - components/SyncStatusIndicator.tsx (health dot, relative time, tooltip)
       Updated:
       - components/AdvertisingPageHeader.tsx (integrated indicator)
       Features:
       - AC1: Health status colored dots (green/yellow/red/orange)
       - AC2: Last sync relative time, next sync time, error count
       - AC3: Tooltip with campaigns/stats/costs synced, duration
       - AC4: Auto-refresh every 60s (stops when tab hidden)
       - AC5: Accessible (aria-label, keyboard focus, text labels)
       Note: 26h stale threshold documented per PO decision
```

---

## QA Results

### Review Date: 2025-12-22

### Reviewed By: Quinn (Test Architect)

### Code Quality Assessment

Self-contained, well-documented component with clear health status configuration. Proper use of date-fns for relative time formatting with Russian locale. The 60s polling with refetchIntervalInBackground=false is a smart optimization that prevents unnecessary requests when tab is hidden.

### Refactoring Performed

None required - implementation is clean.

### Compliance Check

- Coding Standards: ✓ Follows project conventions
- Project Structure: ✓ Component correctly placed in advertising components
- Testing Strategy: ✓ 8 component tests covering health statuses and accessibility
- All ACs Met: ✓ All 5 acceptance criteria fully implemented

### Improvements Checklist

- [x] Health status colored dots for all 4 states
- [x] Relative time display using date-fns
- [x] Comprehensive tooltip with sync statistics
- [x] Auto-refresh with background tab optimization
- [x] Accessible button with descriptive aria-label

### Security Review

No security concerns. Read-only sync status display.

### Performance Considerations

Efficient polling implementation. refetchIntervalInBackground: false prevents polling when tab is hidden, conserving resources.

### Files Modified During Review

None.

### Gate Status

Gate: **PASS** → docs/qa/gates/33.6-fe-sync-status.yml

### Recommended Status

✓ Ready for Done
