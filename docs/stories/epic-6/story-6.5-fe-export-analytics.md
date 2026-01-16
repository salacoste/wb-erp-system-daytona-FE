# Story 6.5-FE: Export Analytics UI

## Story Info

- **Epic**: 6 - Advanced Analytics (Frontend)
- **Priority**: Medium
- **Points**: 5
- **Status**: ✅ Done
- **Completed**: 2025-12-05
- **Backend Dependency**: Story 6.5 (Complete) - `POST /v1/exports/analytics` endpoint

## User Story

**As a** seller who needs to analyze data externally,
**I want** to export analytics data to CSV or Excel format,
**So that** I can perform custom analysis, create reports, or share with stakeholders.

## Acceptance Criteria

### AC1: Export Button
- [x] Add "Экспорт" button to analytics pages (SKU, Brand, Category)
- [x] Button opens export dialog
- [x] Disabled during active export

### AC2: Export Dialog
- [x] Select export type: По товарам, По брендам, По категориям, Сводка
- [x] Select date range (uses DateRangePicker from 6.1-fe)
- [x] Select format: CSV or Excel (.xlsx)
- [x] Checkbox: Include COGS data
- [x] Optional filters: Brand, Category

### AC3: Export Processing
- [x] Show progress indicator after submit
- [x] Poll export status every 2 seconds
- [x] Status display: "В очереди", "Обработка", "Готово", "Ошибка"
- [x] Show estimated time if available

### AC4: Download
- [x] Auto-download when export completes
- [x] Show download button if auto-download blocked
- [x] Display file size and row count
- [x] Link expires warning (48 hours)

### AC5: Error Handling
- [x] Display error message if export fails
- [x] Retry button on failure
- [x] Timeout handling (max 2 minutes)

## Technical Details

### Export Hook

```typescript
// src/hooks/useExportAnalytics.ts
interface ExportRequest {
  type: 'by-sku' | 'by-brand' | 'by-category' | 'cabinet-summary'
  weekStart?: string
  weekEnd?: string
  week?: string
  format: 'csv' | 'xlsx'
  includeCogs?: boolean
  filters?: {
    brand?: string
    category?: string
  }
}

interface ExportStatus {
  export_id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  download_url?: string
  file_size_bytes?: number
  rows_count?: number
  expires_at?: string
  error_message?: string
  estimated_time_sec?: number
}

export function useExportAnalytics() {
  const [exportId, setExportId] = useState<string | null>(null)

  const createExport = useMutation({
    mutationFn: async (request: ExportRequest) => {
      const response = await apiClient.post<{ export_id: string; estimated_time_sec: number }>(
        '/v1/exports/analytics',
        request
      )
      setExportId(response.export_id)
      return response
    },
  })

  const { data: status } = useQuery({
    queryKey: ['exports', exportId],
    queryFn: () => apiClient.get<ExportStatus>(`/v1/exports/${exportId}`),
    enabled: !!exportId,
    refetchInterval: (data) =>
      data?.status === 'pending' || data?.status === 'processing' ? 2000 : false,
  })

  return {
    createExport: createExport.mutate,
    isCreating: createExport.isPending,
    status,
    reset: () => setExportId(null),
  }
}
```

### Export Dialog Component

```tsx
// src/components/custom/ExportDialog.tsx
interface ExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultType?: ExportRequest['type']
  defaultWeekStart?: string
  defaultWeekEnd?: string
}

function ExportDialog({ open, onOpenChange, defaultType, defaultWeekStart, defaultWeekEnd }: ExportDialogProps) {
  const [type, setType] = useState(defaultType ?? 'by-sku')
  const [weekStart, setWeekStart] = useState(defaultWeekStart ?? getLastCompletedWeek())
  const [weekEnd, setWeekEnd] = useState(defaultWeekEnd ?? getLastCompletedWeek())
  const [format, setFormat] = useState<'csv' | 'xlsx'>('xlsx')
  const [includeCogs, setIncludeCogs] = useState(true)

  const { createExport, isCreating, status, reset } = useExportAnalytics()

  const handleExport = () => {
    createExport({ type, weekStart, weekEnd, format, includeCogs })
  }

  // Auto-download when completed
  useEffect(() => {
    if (status?.status === 'completed' && status.download_url) {
      window.open(status.download_url, '_blank')
    }
  }, [status])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Экспорт аналитики</DialogTitle>
        </DialogHeader>

        {!status ? (
          // Configuration form
          <div className="space-y-4">
            <div>
              <Label>Тип данных</Label>
              <Select value={type} onValueChange={setType}>
                <SelectItem value="by-sku">По товарам (SKU)</SelectItem>
                <SelectItem value="by-brand">По брендам</SelectItem>
                <SelectItem value="by-category">По категориям</SelectItem>
                <SelectItem value="cabinet-summary">Сводка по кабинету</SelectItem>
              </Select>
            </div>

            <div>
              <Label>Период</Label>
              <DateRangePicker
                weekStart={weekStart}
                weekEnd={weekEnd}
                onRangeChange={(start, end) => {
                  setWeekStart(start)
                  setWeekEnd(end)
                }}
              />
            </div>

            <div>
              <Label>Формат</Label>
              <RadioGroup value={format} onValueChange={setFormat}>
                <RadioGroupItem value="csv">CSV</RadioGroupItem>
                <RadioGroupItem value="xlsx">Excel (.xlsx)</RadioGroupItem>
              </RadioGroup>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox checked={includeCogs} onCheckedChange={setIncludeCogs} />
              <Label>Включить данные COGS</Label>
            </div>
          </div>
        ) : (
          // Status display
          <ExportStatusDisplay status={status} onRetry={reset} />
        )}

        <DialogFooter>
          {!status && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Отмена</Button>
              <Button onClick={handleExport} disabled={isCreating}>
                {isCreating ? 'Создание...' : 'Экспортировать'}
              </Button>
            </>
          )}
          {status?.status === 'completed' && (
            <Button onClick={() => onOpenChange(false)}>Закрыть</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

### Status Display Component

```tsx
// src/components/custom/ExportStatusDisplay.tsx
function ExportStatusDisplay({ status, onRetry }: { status: ExportStatus; onRetry: () => void }) {
  const statusLabels = {
    pending: 'В очереди...',
    processing: 'Обработка...',
    completed: 'Готово!',
    failed: 'Ошибка',
  }

  return (
    <div className="space-y-4 py-4">
      <div className="flex items-center gap-3">
        {status.status === 'pending' || status.status === 'processing' ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : status.status === 'completed' ? (
          <CheckCircle className="h-5 w-5 text-green-600" />
        ) : (
          <XCircle className="h-5 w-5 text-red-600" />
        )}
        <span className="font-medium">{statusLabels[status.status]}</span>
      </div>

      {status.status === 'completed' && (
        <div className="text-sm text-muted-foreground space-y-1">
          <p>Файл: {formatBytes(status.file_size_bytes)} • {status.rows_count} строк</p>
          <p>Ссылка действительна до: {formatDate(status.expires_at)}</p>
          <Button variant="outline" size="sm" asChild>
            <a href={status.download_url} download>Скачать</a>
          </Button>
        </div>
      )}

      {status.status === 'failed' && (
        <div className="space-y-2">
          <p className="text-sm text-red-600">{status.error_message}</p>
          <Button variant="outline" size="sm" onClick={onRetry}>Повторить</Button>
        </div>
      )}
    </div>
  )
}
```

## Dependencies

- Story 6.1-fe: DateRangePicker component
- Backend Story 6.5: Export Analytics (complete)
- Existing: Dialog, Button, Select components

---

## Tasks / Subtasks

### Task 1: Create useExportAnalytics Hook (AC3, AC4, AC5)
- [x] 1.1 Create `src/hooks/useExportAnalytics.ts`
- [x] 1.2 Implement `createExport` mutation (POST /v1/exports/analytics)
- [x] 1.3 Implement status polling with useQuery (GET /v1/exports/:id)
- [x] 1.4 Set polling interval: 2 seconds when pending/processing
- [x] 1.5 Stop polling when completed/failed
- [x] 1.6 Add timeout handling (max 2 minutes)
- [x] 1.7 Add `reset` function to clear state
- [x] 1.8 Export hook and types

### Task 2: Create ExportStatusDisplay Component (AC3, AC4, AC5)
- [x] 2.1 Create `src/components/custom/ExportStatusDisplay.tsx`
- [x] 2.2 Show spinner for pending/processing states
- [x] 2.3 Show checkmark for completed state
- [x] 2.4 Show X icon for failed state
- [x] 2.5 Display file size and row count on completion
- [x] 2.6 Display expiration warning (48 hours)
- [x] 2.7 Add download button/link
- [x] 2.8 Add retry button on failure

### Task 3: Create ExportDialog Component (AC1, AC2)
- [x] 3.1 Create `src/components/custom/ExportDialog.tsx`
- [x] 3.2 Add export type selector (by-sku, by-brand, by-category, cabinet-summary)
- [x] 3.3 Integrate DateRangePicker from 6.1-fe
- [x] 3.4 Add format radio buttons (CSV / Excel)
- [x] 3.5 Add "Include COGS data" checkbox
- [x] 3.6 Add optional brand/category filters
- [x] 3.7 Wire up useExportAnalytics hook
- [x] 3.8 Show ExportStatusDisplay when export in progress

### Task 4: Add Export Button to SKU Analytics Page (AC1)
- [x] 4.1 Add "Экспорт" button to page header
- [x] 4.2 Add ExportDialog with defaultType="by-sku"
- [x] 4.3 Pass current weekStart/weekEnd as defaults
- [x] 4.4 Disable button during active export

### Task 5: Add Export Button to Brand Analytics Page (AC1)
- [x] 5.1 Add "Экспорт" button to page header
- [x] 5.2 Add ExportDialog with defaultType="by-brand"
- [x] 5.3 Pass current week range as defaults

### Task 6: Add Export Button to Category Analytics Page (AC1)
- [x] 6.1 Add "Экспорт" button to page header
- [x] 6.2 Add ExportDialog with defaultType="by-category"
- [x] 6.3 Pass current week range as defaults

### Task 7: Implement Auto-Download (AC4)
- [x] 7.1 Add useEffect to trigger download when completed
- [x] 7.2 Use `window.open(download_url, '_blank')` for download
- [x] 7.3 Show manual download button if popup blocked
- [x] 7.4 Display success message after download

### Task 8: Add Response Types (AC1-AC5)
- [x] 8.1 Add `ExportRequest` interface to types
- [x] 8.2 Add `ExportStatus` interface to types
- [x] 8.3 Add status enum: pending, processing, completed, failed

### Task 9: Testing (All ACs)
- [x] 9.1 Unit tests for useExportAnalytics hook
- [x] 9.2 Unit tests for ExportDialog component
- [x] 9.3 Unit tests for ExportStatusDisplay component
- [x] 9.4 Test polling behavior with mock timers
- [x] 9.5 Test timeout handling
- [x] 9.6 Test error state and retry

---

## Dev Notes

### Source Tree (Relevant Files)

```
src/
├── app/(dashboard)/analytics/
│   ├── sku/page.tsx           # UPDATE: Add Export button
│   ├── brand/page.tsx         # UPDATE: Add Export button
│   └── category/page.tsx      # UPDATE: Add Export button
├── components/custom/
│   ├── ExportDialog.tsx       # NEW: Export configuration dialog
│   ├── ExportStatusDisplay.tsx # NEW: Export progress/status display
│   └── DateRangePicker.tsx    # EXISTING: From 6.1-fe
├── hooks/
│   └── useExportAnalytics.ts  # NEW: Export mutation + status polling
└── types/
    └── analytics.ts           # UPDATE: Add export types
```

### Export Status State Machine

```
┌─────────┐   POST   ┌──────────┐   polling   ┌────────────┐
│  idle   │ ──────▶ │  pending │ ─────────▶ │ processing │
└─────────┘         └──────────┘             └────────────┘
                                                   │
                    ┌──────────┐                   │
                    │  failed  │ ◀─────────────────┤
                    └──────────┘                   │
                         │                         ▼
                         │              ┌───────────────┐
                    [retry]             │  completed    │
                         │              └───────────────┘
                         ▼                     │
                    ┌─────────┐           [download]
                    │  idle   │                │
                    └─────────┘                ▼
                                          [close dialog]
```

### Timeout Handling

- Max polling time: 2 minutes (60 polls × 2 seconds)
- On timeout: Show error "Экспорт занял слишком много времени"
- Offer retry button

### Pages Getting Export Button

| Page | Default Type | Notes |
|------|--------------|-------|
| `/analytics/sku` | `by-sku` | Product-level export |
| `/analytics/brand` | `by-brand` | Brand-level export |
| `/analytics/category` | `by-category` | Category-level export |

### Testing Standards

- **Unit Tests Location**: `src/hooks/__tests__/useExportAnalytics.test.ts`
- **Component Tests**: `src/components/custom/__tests__/ExportDialog.test.tsx`
- **Framework**: Vitest + React Testing Library
- **Timer Mocking**: Use `vi.useFakeTimers()` for polling tests

---

## Test Cases

- [x] Export button visible on analytics pages
- [x] Dialog opens with correct defaults
- [x] Type selector works
- [x] Date range picker works
- [x] Format radio buttons work
- [x] Export request sent correctly
- [x] Status polling works
- [x] Auto-download on completion
- [x] Error display and retry
- [x] Loading states shown

## Definition of Done

- [x] Export button added to analytics pages
- [x] ExportDialog component created
- [x] useExportAnalytics hook implemented
- [x] Status polling and auto-download work
- [x] Error handling implemented
- [x] Unit tests pass

## Related

- Backend Story 6.5: Export Analytics
- Story 6.1-fe: Date Range Support (DateRangePicker)
- Design: See Epic README for wireframe

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2025-11-29 | 1.0 | Initial draft | Claude (Opus 4.5) |
| 2025-11-29 | 1.1 | Added Tasks/Subtasks (9 tasks), Dev Notes with Source Tree, Export state machine, Timeout handling, Change Log | Sarah (PO Agent) |
| 2025-12-05 | 1.2 | Story completed: All ACs implemented. Created useExportAnalytics hook, ExportDialog and ExportStatusDisplay components. Added Export button to SKU, Brand, and Category pages. Types added to analytics.ts. | Claude (Opus 4.5) |
