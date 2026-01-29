# Story 51.11-FE: Backfill Admin Page

## Story Info

- **Epic**: 51-FE - FBS Historical Analytics UI (365 Days)
- **Sprint**: 6
- **Priority**: P1 (Admin Feature)
- **Points**: 5 SP
- **Status**: Ready for Dev
- **Dependencies**: Story 51.10 (Backfill Types & Hooks)

---

## User Story

**As a** cabinet owner managing historical data,
**I want** an admin page to control data backfill operations,
**So that** I can populate historical FBS orders data for analytics.

---

## Background

The backend supports backfilling historical FBS orders data from Wildberries API. This story implements the admin UI for:
- Viewing backfill status for all cabinets
- Starting new backfill operations
- Pausing/resuming running backfills
- Monitoring progress in real-time

**Route**: `/settings/backfill`
**Access**: Owner role only (403 for other roles)

---

## Acceptance Criteria

### AC1: Page Structure

- [ ] Page title: "Загрузка исторических данных"
- [ ] Subtitle explaining the feature purpose
- [ ] Cabinet list with backfill status for each
- [ ] Loading skeleton on initial load
- [ ] Empty state if no cabinets

### AC2: Cabinet Status Cards

- [ ] Card for each cabinet showing:
  - Cabinet name
  - Current backfill status with color indicator
  - Data availability range (oldest to newest date)
  - Progress bar (when in progress)
  - Last error message (if failed)
  - Action buttons based on state

### AC3: Start Backfill Flow

- [ ] "Начать загрузку" button for idle/completed/failed cabinets
- [ ] Clicking opens date range selection dialog
- [ ] Default range: full available period
- [ ] Optional custom date range selection
- [ ] Confirm button starts backfill
- [ ] Success toast: "Загрузка данных запущена"

### AC4: Pause/Resume Controls

- [ ] "Приостановить" button for in_progress cabinets
- [ ] "Продолжить" button for paused cabinets
- [ ] Confirmation dialog before pause
- [ ] Actions show loading state during request
- [ ] Toast notifications on success/failure

### AC5: Progress Display

- [ ] Progress bar with percentage
- [ ] Text: "X / Y дней загружено"
- [ ] Current date being processed
- [ ] Estimated time remaining
- [ ] Auto-refresh every 5 seconds when active

### AC6: Status Indicators

- [ ] Color-coded status badges:
  - Gray: "Ожидает" (idle)
  - Yellow: "В очереди" (pending)
  - Blue: "Выполняется" (in_progress)
  - Green: "Завершено" (completed)
  - Red: "Ошибка" (failed)
  - Orange: "Приостановлено" (paused)

### AC7: Error Handling

- [ ] Display last error message for failed backfills
- [ ] Retry button for failed backfills
- [ ] Network error handling with retry option
- [ ] 403 error redirects to dashboard

### AC8: Access Control

- [ ] Page only accessible to Owner role
- [ ] Non-owners see 403 error or redirect
- [ ] Role check in middleware or page component

### AC9: Responsive Design

- [ ] Cards stack vertically on mobile
- [ ] Action buttons adapt to screen size
- [ ] Progress bar visible on all screen sizes

---

## Technical Details

### Files to Create

```
src/app/(dashboard)/settings/backfill/page.tsx      # Main page
src/components/custom/backfill/BackfillStatusCard.tsx
src/components/custom/backfill/StartBackfillDialog.tsx
src/components/custom/backfill/BackfillProgressBar.tsx
src/components/custom/backfill/BackfillActions.tsx
```

### Page Component Structure

```typescript
// src/app/(dashboard)/settings/backfill/page.tsx

export default function BackfillAdminPage() {
  const { data: statusList, isLoading, error } = useBackfillStatus({
    polling: true,
    pollingInterval: 5000,
  })

  // Check for any active backfills to enable/disable polling
  const hasActiveBackfill = statusList?.some(isBackfillActive) ?? false

  if (isLoading) return <BackfillPageSkeleton />
  if (error) return <BackfillPageError error={error} />

  return (
    <div className="container py-6 space-y-6">
      <BackfillPageHeader />
      <BackfillStatusList statuses={statusList} />
    </div>
  )
}
```

### Status Card Component

```typescript
// src/components/custom/backfill/BackfillStatusCard.tsx

interface BackfillStatusCardProps {
  status: BackfillCabinetStatus
  onStart: () => void
  onPause: () => void
  onResume: () => void
}

export function BackfillStatusCard({
  status,
  onStart,
  onPause,
  onResume,
}: BackfillStatusCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{status.cabinet_name}</CardTitle>
          <BackfillStatusBadge status={status.status} />
        </div>
      </CardHeader>
      <CardContent>
        <DataAvailabilityInfo
          oldest={status.oldest_available_date}
          newest={status.newest_available_date}
        />
        {status.progress && (
          <BackfillProgressBar progress={status.progress} />
        )}
        {status.last_error && (
          <Alert variant="destructive">
            <AlertDescription>{status.last_error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter>
        <BackfillActions
          status={status.status}
          onStart={onStart}
          onPause={onPause}
          onResume={onResume}
        />
      </CardFooter>
    </Card>
  )
}
```

### Start Dialog Component

```typescript
// src/components/custom/backfill/StartBackfillDialog.tsx

interface StartBackfillDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cabinetId: string
  cabinetName: string
  availableRange: { from: string; to: string }
  onConfirm: (request: StartBackfillRequest) => void
  isLoading: boolean
}

export function StartBackfillDialog({
  open,
  onOpenChange,
  cabinetId,
  cabinetName,
  availableRange,
  onConfirm,
  isLoading,
}: StartBackfillDialogProps) {
  const [useCustomRange, setUseCustomRange] = useState(false)
  const [dateRange, setDateRange] = useState(availableRange)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Загрузка данных: {cabinetName}</DialogTitle>
          <DialogDescription>
            Выберите период для загрузки исторических данных заказов FBS.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={useCustomRange}
              onCheckedChange={setUseCustomRange}
            />
            <Label>Указать свой период</Label>
          </div>

          {useCustomRange && (
            <DateRangeSelector
              value={dateRange}
              onChange={setDateRange}
              min={availableRange.from}
              max={availableRange.to}
            />
          )}

          <EstimatedDurationInfo range={dateRange} />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button
            onClick={() => onConfirm({
              cabinet_id: cabinetId,
              from_date: useCustomRange ? dateRange.from : undefined,
              to_date: useCustomRange ? dateRange.to : undefined,
            })}
            disabled={isLoading}
          >
            {isLoading ? 'Запуск...' : 'Начать загрузку'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

### Progress Bar Component

```typescript
// src/components/custom/backfill/BackfillProgressBar.tsx

interface BackfillProgressBarProps {
  progress: BackfillProgress
}

export function BackfillProgressBar({ progress }: BackfillProgressBarProps) {
  const {
    completed_days,
    total_days,
    percentage,
    current_date,
    estimated_remaining_seconds,
  } = progress

  return (
    <div className="space-y-2">
      <Progress value={percentage} className="h-2" />
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>{formatBackfillProgress(progress)}</span>
        <span>Осталось: {formatEstimatedTime(estimated_remaining_seconds)}</span>
      </div>
      {current_date && (
        <p className="text-xs text-muted-foreground">
          Обрабатывается: {formatDate(current_date)}
        </p>
      )}
    </div>
  )
}
```

### Route Protection

```typescript
// Option 1: In page component
export default function BackfillAdminPage() {
  const { user } = useAuth()

  if (user?.role !== 'owner') {
    redirect('/dashboard')
    // Or: return <AccessDenied />
  }

  // ... rest of component
}

// Option 2: Route config (if supported)
// src/lib/routes.ts
export const ROUTES = {
  SETTINGS: {
    BACKFILL: '/settings/backfill', // Owner only
  },
}
```

---

## UI/UX Specifications

### Page Layout

```
+----------------------------------------------------------+
|  Загрузка исторических данных                             |
|  Загрузите данные заказов FBS за прошлые периоды          |
|  для полноценной аналитики.                               |
+----------------------------------------------------------+
|                                                          |
|  +----------------------------------------------------+  |
|  |  Кабинет: ООО "Компания"        [Выполняется]      |  |
|  |                                                    |  |
|  |  Доступный период: 01.01.2024 - 29.01.2025        |  |
|  |                                                    |  |
|  |  [=============================     ] 75%          |  |
|  |  274 / 365 дней загружено     Осталось: ~30 мин   |  |
|  |  Обрабатывается: 15.10.2024                       |  |
|  |                                                    |  |
|  |                              [Приостановить]       |  |
|  +----------------------------------------------------+  |
|                                                          |
|  +----------------------------------------------------+  |
|  |  Кабинет: ИП Иванов             [Ожидает]         |  |
|  |                                                    |  |
|  |  Доступный период: 15.03.2024 - 29.01.2025        |  |
|  |                                                    |  |
|  |                              [Начать загрузку]     |  |
|  +----------------------------------------------------+  |
|                                                          |
+----------------------------------------------------------+
```

### Status Badge Colors

| Status | Background | Text | Border |
|--------|------------|------|--------|
| idle | `bg-gray-100` | `text-gray-700` | `border-gray-200` |
| pending | `bg-yellow-100` | `text-yellow-700` | `border-yellow-200` |
| in_progress | `bg-blue-100` | `text-blue-700` | `border-blue-200` |
| completed | `bg-green-100` | `text-green-700` | `border-green-200` |
| failed | `bg-red-100` | `text-red-700` | `border-red-200` |
| paused | `bg-orange-100` | `text-orange-700` | `border-orange-200` |

---

## Testing Requirements

### Unit Tests

- [ ] Page renders cabinet list
- [ ] Status cards display correct information
- [ ] Action buttons enabled/disabled correctly
- [ ] Progress bar updates with progress data
- [ ] Start dialog validates date range

### Integration Tests

- [ ] Start backfill flow works end-to-end
- [ ] Pause/resume flow works
- [ ] Polling updates status in real-time
- [ ] Role protection works (403 for non-owners)

### Manual Testing

- [ ] Navigate to /settings/backfill as owner
- [ ] Verify all cabinet statuses displayed
- [ ] Start backfill and observe progress
- [ ] Pause and resume backfill
- [ ] Verify non-owner access denied

---

## Definition of Done

- [ ] Page accessible at /settings/backfill
- [ ] All status cards render correctly
- [ ] Start/pause/resume actions work
- [ ] Progress polling updates UI
- [ ] Role-based access control implemented
- [ ] Responsive design verified
- [ ] Code reviewed and approved
- [ ] No TypeScript errors
- [ ] Tests passing

---

## Related Stories

- Story 51.10: Backfill Types & Hooks (dependency)
- Story 51.12: E2E Tests (includes backfill tests)

---

## Notes

- This is an admin-only feature - ensure proper access control
- Backfill can take significant time (hours for full year)
- Consider adding email notification when backfill completes
- Progress polling should be conservative to avoid excessive API calls
