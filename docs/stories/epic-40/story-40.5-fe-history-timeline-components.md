# Story 40.5-FE: History Timeline Components

## Story Info

- **Epic**: 40-FE - Orders UI & WB Native Status History
- **Sprint**: 2 (Feb 17-28, 2026)
- **Priority**: High
- **Points**: 5
- **Status**: Ready for Dev

## User Story

**As a** seller operations manager,
**I want** to see order status history in timeline visualizations with different views (full, WB-only, local-only),
**So that** I can understand the complete order lifecycle, compare WB native tracking with our local tracking, and identify processing bottlenecks.

## Background

This story creates the timeline visualization components used by the Order Details Modal (Story 40.4-FE). The timelines display chronological status transitions with:

- **Source indicators**: Distinguish between WB native (40+ statuses) and local tracking (6-8 statuses)
- **Duration formatting**: Human-readable time between transitions (minutes, hours, days)
- **Summary statistics**: Total transitions, time spans, status breakdowns
- **Unknown status handling**: Graceful fallback for undocumented WB status codes

Three timeline views are provided:
1. **OrderHistoryTimeline** - Merged view with both sources interleaved
2. **WbHistoryTimeline** - WB native statuses only (40+ codes)
3. **LocalHistoryTimeline** - Local tracking only (supplier_status + wb_status)

---

## Acceptance Criteria

### AC1: OrderHistoryTimeline (Full Merged View)

- [ ] Displays merged entries from both `wb_native` and `local` sources
- [ ] Entries sorted chronologically by timestamp (oldest first)
- [ ] Each entry shows source badge ("WB" or "Локальная")
- [ ] WB entries show translated status label from `wb-status-mapping.ts`
- [ ] Local entries show both `supplierStatus` and `wbStatus` changes
- [ ] Duration displayed between consecutive entries
- [ ] Summary section at top showing total count and source breakdown
- [ ] Empty state: "История статусов пуста"

### AC2: WbHistoryTimeline (WB-Only View)

- [ ] Displays only `wb_native` source entries
- [ ] Uses `WB_STATUS_CONFIG` for status labels, colors, categories
- [ ] Groups entries by category (visually indicated)
- [ ] Shows `wbStatusCode` with translated Russian label
- [ ] Unknown codes fallback: show raw code as label (e.g., "new_unknown_code")
- [ ] Duration between each WB status transition
- [ ] Summary: total transitions, total duration, current status, first/last timestamps
- [ ] Empty state: "WB история ещё не загружена. Синхронизация происходит каждые 15 минут."

### AC3: LocalHistoryTimeline (Local-Only View)

- [ ] Displays only `local` source entries
- [ ] Shows `oldSupplierStatus` -> `newSupplierStatus` transition
- [ ] Shows `oldWbStatus` -> `newWbStatus` transition
- [ ] Both null -> value and value -> value transitions displayed
- [ ] Duration between local status changes
- [ ] Summary: total transitions, created_at, completed_at (if final status reached)
- [ ] Empty state: "Локальная история пуста"

### AC4: HistoryEntryCard Component

- [ ] Renders single timeline entry with consistent styling
- [ ] Timestamp displayed as "DD.MM.YYYY HH:mm" format
- [ ] Status text with appropriate color from config
- [ ] Category icon from `WB_STATUS_CATEGORY_ICONS` (for WB entries)
- [ ] Optional description text (for local entries showing status pair)
- [ ] Hover state with subtle background highlight
- [ ] Compact mode prop for dense display

### AC5: HistorySourceBadge Component

- [ ] Two variants: "WB" (purple) and "Локальная" (blue)
- [ ] Consistent sizing: small badge with icon + text
- [ ] WB badge: purple bg, "WB" text, Truck icon
- [ ] Local badge: blue bg, "Локальная" text, Database icon
- [ ] Accessible: includes `aria-label` describing source

### AC6: DurationDisplay Component

- [ ] Formats duration in Russian with proper pluralization
- [ ] Rules:
  - < 1 minute: "< 1 мин"
  - 1-59 minutes: "{n} мин" (1 мин, 2 мин, 5 мин, 21 мин, etc.)
  - 1-23 hours: "{h} ч {m} мин" (1 ч 30 мин, 2 ч 15 мин)
  - 1-6 days: "{d} д {h} ч" (1 д 2 ч, 3 д 12 ч)
  - 7+ days: "{d} дней" (7 дней, 14 дней)
- [ ] null duration shows "—" (em-dash)
- [ ] Styled as muted text between timeline entries

### AC7: Summary Section

- [ ] Positioned at top of each timeline view
- [ ] Full History Summary:
  - Total entries: "Всего: {n} записей"
  - Source breakdown: "WB: {x} | Локальная: {y}"
  - Time span: "Период: {firstDate} — {lastDate}"
- [ ] WB History Summary:
  - Total transitions: "Переходов: {n}"
  - Total duration: "Общее время: {duration}"
  - Current status: "Текущий статус: {status}"
- [ ] Local History Summary:
  - Total transitions: "Переходов: {n}"
  - Order created: "Создан: {date}"
  - Order completed: "Завершён: {date}" (if final)

### AC8: WB Status Code Handling

- [ ] All 40+ documented codes from `WB_STATUS_CONFIG` render correctly
- [ ] Unknown codes (not in config) show raw code as label
- [ ] Unknown codes use gray color and "other" category styling
- [ ] Category grouping: creation, seller_processing, warehouse, logistics, delivery, cancellation, return, other
- [ ] Final statuses visually distinct (checkmark icon or green highlight)

### AC9: Timeline Visual Design

- [ ] Vertical timeline with connecting line
- [ ] Timeline dots/icons aligned left
- [ ] Entry cards to the right of timeline
- [ ] Duration displayed inline between entries (on connecting line)
- [ ] Responsive: stacks properly on mobile
- [ ] Max height with scroll if >10 entries

### AC10: Accessibility (WCAG 2.1 AA)

- [ ] Timeline is semantic: `<ol>` or `<ul>` with `role="list"`
- [ ] Each entry is `<li>` with proper structure
- [ ] Timestamps have `<time datetime="{ISO}">` elements
- [ ] Duration text readable by screen readers
- [ ] Source badges have descriptive `aria-label`
- [ ] Focus indicators on interactive elements
- [ ] Color contrast meets 4.5:1 ratio

---

## UI Wireframe

### Full Merged Timeline (OrderHistoryTimeline)

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Итого: 8 записей  |  WB: 5  |  Локальная: 3                             │
│ Период: 04.01.2026 10:00 — 05.01.2026 15:30                             │
└─────────────────────────────────────────────────────────────────────────┘

  ●───── 04.01.2026 10:00 ──────────────────────────────────────  [WB]
  │      created → Создан
  │      ─── 5 мин ───
  │
  ●───── 04.01.2026 10:05 ────────────────────────────────  [Локальная]
  │      Статус продавца: — → new
  │      WB статус: — → waiting
  │      ─── 25 мин ───
  │
  ●───── 04.01.2026 10:30 ──────────────────────────────────────  [WB]
  │      assembling → На сборке
  │      ─── 45 мин ───
  │
  ●───── 04.01.2026 11:15 ──────────────────────────────────────  [WB]
  │      assembled → Собран
  │      ─── 2 ч 45 мин ───
  │
  ●───── 04.01.2026 14:00 ──────────────────────────────────────  [WB]
  │      sorted_by_wh → Отсортирован на складе
  │      ─── 19 ч ───
  │
  ●───── 05.01.2026 09:00 ────────────────────────────────  [Локальная]
  │      Статус продавца: new → confirm
  │      ─── 6 ч 30 мин ───
  │
  ●───── 05.01.2026 15:30 ──────────────────────────────────────  [WB]
         received_by_client → Получен клиентом ✓
```

### WB-Only Timeline (WbHistoryTimeline)

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Переходов: 6  |  Общее время: 1 д 5 ч 30 мин                            │
│ Текущий статус: received_by_client (Получен клиентом)                   │
└─────────────────────────────────────────────────────────────────────────┘

  [+] Создание заказа
  ●───── 04.01.2026 10:00
  │      created → Создан
  │      ─── 30 мин ───

  [📦] Обработка продавцом
  ●───── 04.01.2026 10:30
  │      assembling → На сборке
  │      ─── 45 мин ───
  ●───── 04.01.2026 11:15
  │      assembled → Собран
  │      ─── 2 ч 45 мин ───

  [🏭] Склад
  ●───── 04.01.2026 14:00
  │      sorted_by_wh → Отсортирован на складе
  │      ─── 19 ч ───

  [🚚] Логистика
  ●───── 05.01.2026 09:00
  │      on_way_to_client → В пути к клиенту
  │      ─── 6 ч 30 мин ───

  [✓] Доставка
  ●───── 05.01.2026 15:30
         received_by_client → Получен клиентом ✓ (финал)
```

### Local-Only Timeline (LocalHistoryTimeline)

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Переходов: 3  |  Создан: 04.01.2026 10:05  |  Завершён: 05.01.2026 16:00│
└─────────────────────────────────────────────────────────────────────────┘

  ●───── 04.01.2026 10:05
  │      Статус продавца: — → new
  │      WB статус: — → waiting
  │      ─── 22 ч 55 мин ───
  │
  ●───── 05.01.2026 09:00
  │      Статус продавца: new → confirm
  │      WB статус: waiting → sorted
  │      ─── 7 ч ───
  │
  ●───── 05.01.2026 16:00
         Статус продавца: confirm → complete
         WB статус: sorted → sold ✓
```

### Empty State

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│                          📭                                             │
│                                                                         │
│              История статусов пуста                                     │
│                                                                         │
│       Статусы появятся после первой синхронизации                       │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Components to Create

### New Components

| Component | File Path | Lines Est. | Purpose |
|-----------|-----------|------------|---------|
| `OrderHistoryTimeline` | `src/app/(dashboard)/orders/components/OrderHistoryTimeline.tsx` | ~150 | Full merged timeline view |
| `WbHistoryTimeline` | `src/app/(dashboard)/orders/components/WbHistoryTimeline.tsx` | ~140 | WB-only timeline with categories |
| `LocalHistoryTimeline` | `src/app/(dashboard)/orders/components/LocalHistoryTimeline.tsx` | ~120 | Local-only timeline view |
| `HistoryEntryCard` | `src/app/(dashboard)/orders/components/HistoryEntryCard.tsx` | ~100 | Single timeline entry card |
| `HistorySourceBadge` | `src/app/(dashboard)/orders/components/HistorySourceBadge.tsx` | ~40 | WB vs Local source badge |
| `DurationDisplay` | `src/app/(dashboard)/orders/components/DurationDisplay.tsx` | ~60 | Human-readable duration formatting |
| `TimelineSummary` | `src/app/(dashboard)/orders/components/TimelineSummary.tsx` | ~80 | Summary section for any timeline |
| `TimelineEmptyState` | `src/app/(dashboard)/orders/components/TimelineEmptyState.tsx` | ~40 | Empty state component |

### Supporting Utilities

| Utility | File Path | Lines Est. | Purpose |
|---------|-----------|------------|---------|
| `formatDuration` | `src/lib/duration-utils.ts` | ~50 | Duration formatting logic |
| `groupByCategory` | `src/lib/history-utils.ts` | ~30 | Group WB entries by category |

### Reused from Existing

- `wb-status-mapping.ts` - Status code translations and config
- `getWbStatusConfig()`, `getWbStatusLabel()`, `getWbStatusCategory()`
- `WB_STATUS_CATEGORY_LABELS`, `WB_STATUS_CATEGORY_ICONS`

---

## Duration Formatting Specification

### formatDuration(minutes: number | null): string

```typescript
export function formatDuration(minutes: number | null): string {
  if (minutes === null || minutes === undefined) return '—'
  if (minutes < 1) return '< 1 мин'

  const days = Math.floor(minutes / 1440)
  const hours = Math.floor((minutes % 1440) / 60)
  const mins = minutes % 60

  // 7+ days: just show days
  if (days >= 7) {
    return `${days} ${pluralizeDays(days)}`
  }

  // 1-6 days: show days and hours
  if (days >= 1) {
    return hours > 0
      ? `${days} д ${hours} ч`
      : `${days} д`
  }

  // 1-23 hours: show hours and minutes
  if (hours >= 1) {
    return mins > 0
      ? `${hours} ч ${mins} мин`
      : `${hours} ч`
  }

  // < 1 hour: show minutes only
  return `${mins} мин`
}

function pluralizeDays(n: number): string {
  if (n === 1) return 'день'
  if (n >= 2 && n <= 4) return 'дня'
  return 'дней'
}
```

### Examples

| Input (minutes) | Output |
|-----------------|--------|
| `null` | "—" |
| `0` | "< 1 мин" |
| `1` | "1 мин" |
| `30` | "30 мин" |
| `60` | "1 ч" |
| `90` | "1 ч 30 мин" |
| `165` | "2 ч 45 мин" |
| `1440` | "1 д" |
| `1500` | "1 д 1 ч" |
| `2880` | "2 д" |
| `10080` | "7 дней" |
| `20160` | "14 дней" |

---

## WB Status Code Handling

### Known Status Codes (40+)

All codes defined in `src/lib/wb-status-mapping.ts`:

| Category | Codes |
|----------|-------|
| creation | `created` |
| seller_processing | `waiting`, `assembling`, `assembled`, `ready_for_supply` |
| warehouse | `sorted`, `sorted_by_wh`, `accepted_by_wh` |
| logistics | `on_way_to_storage`, `accepted_at_storage`, `sorted_by_wb`, `on_way_to_pvz`, `arrived_at_pvz`, `on_way_to_client` |
| delivery | `received_by_client`, `sold`, `delivering` |
| cancellation | `canceled`, `canceled_by_seller`, `canceled_by_wh`, `canceled_by_client`, `canceled_by_wb`, `cancel` |
| return | `return_requested`, `return_at_pvz`, `return_in_transit`, `return_received`, `refunded` |
| other | `defect`, `lost`, `damaged`, `expired` |

### Unknown Code Handling

```typescript
// In getWbStatusConfig (already implemented in wb-status-mapping.ts)
export function getWbStatusConfig(statusCode: string): WbStatusConfig {
  return (
    WB_STATUS_CONFIG[statusCode] ?? {
      ...UNKNOWN_STATUS_CONFIG,
      label: statusCode, // Show raw code as label
      labelEn: statusCode,
    }
  )
}
```

**UI Behavior for Unknown Codes:**
- Display raw code as label (e.g., "new_wb_status_2026")
- Use gray color scheme (`text-gray-500`, `bg-gray-50`)
- Category: "other" with HelpCircle icon
- Log warning to console in development mode

---

## API Response Types

### Full History Entry (from backend)

```typescript
interface FullHistoryEntry {
  source: 'local' | 'wb_native'
  timestamp: string // ISO 8601

  // For wb_native source
  wbStatusCode?: string

  // For local source
  oldSupplierStatus?: string | null
  newSupplierStatus?: string | null
  oldWbStatus?: string | null
  newWbStatus?: string | null
}
```

### WB History Entry (from backend)

```typescript
interface WbStatusHistoryEntry {
  id: string
  wbStatusCode: string
  wbStatusChangedAt: string // ISO 8601
  durationMinutes: number | null
}
```

### Local History Entry (from backend)

```typescript
interface OrderStatusHistoryEntry {
  id: string
  oldSupplierStatus: string | null
  newSupplierStatus: string | null
  oldWbStatus: string | null
  newWbStatus: string | null
  changedAt: string // ISO 8601
  changedBy: string | null
  durationMinutes: number | null
}
```

---

## Technical Implementation

### Component Structure

```typescript
// OrderHistoryTimeline.tsx
interface OrderHistoryTimelineProps {
  entries: FullHistoryEntry[]
  isLoading?: boolean
}

export function OrderHistoryTimeline({ entries, isLoading }: OrderHistoryTimelineProps) {
  if (isLoading) return <TimelineSkeleton />
  if (entries.length === 0) return <TimelineEmptyState variant="full" />

  const sorted = [...entries].sort((a, b) =>
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  )

  return (
    <div className="space-y-2">
      <FullHistorySummary entries={sorted} />
      <ol className="relative border-l border-gray-200 ml-4">
        {sorted.map((entry, index) => (
          <li key={`${entry.source}-${entry.timestamp}`} className="mb-6 ml-6">
            <HistoryEntryCard
              entry={entry}
              duration={calculateDuration(sorted, index)}
              isLast={index === sorted.length - 1}
            />
          </li>
        ))}
      </ol>
    </div>
  )
}
```

### Duration Calculation

```typescript
function calculateDuration(entries: FullHistoryEntry[], currentIndex: number): number | null {
  if (currentIndex === entries.length - 1) return null

  const current = new Date(entries[currentIndex].timestamp)
  const next = new Date(entries[currentIndex + 1].timestamp)

  return Math.round((next.getTime() - current.getTime()) / 60000)
}
```

---

## Testing

### Framework & Location

- **Framework**: Vitest + React Testing Library
- **Test Location**: `src/app/(dashboard)/orders/components/__tests__/`

### Test Files

| File | Test Cases |
|------|------------|
| `OrderHistoryTimeline.test.tsx` | Merged view rendering, sorting, empty state |
| `WbHistoryTimeline.test.tsx` | WB entries, categories, unknown codes |
| `LocalHistoryTimeline.test.tsx` | Local entries, status transitions |
| `HistoryEntryCard.test.tsx` | Entry card variants, styling |
| `HistorySourceBadge.test.tsx` | Badge variants, accessibility |
| `DurationDisplay.test.tsx` | Duration formatting, edge cases |

### Test Cases

#### Duration Formatting
- [ ] null returns em-dash
- [ ] 0 returns "< 1 мин"
- [ ] Minutes-only formatting (1-59 min)
- [ ] Hours and minutes (1-23 hours)
- [ ] Days and hours (1-6 days)
- [ ] Days-only (7+ days)
- [ ] Russian pluralization (день, дня, дней)

#### Timeline Rendering
- [ ] Entries sorted chronologically
- [ ] Source badges render correctly
- [ ] Duration displayed between entries
- [ ] Last entry has no duration (null)
- [ ] Empty state shown when no entries
- [ ] Loading skeleton shown when isLoading

#### WB Status Codes
- [ ] Known codes show translated labels
- [ ] Unknown codes show raw code
- [ ] Categories grouped correctly
- [ ] Final statuses have checkmark
- [ ] Colors match config

#### Accessibility
- [ ] Timeline is semantic list
- [ ] Timestamps have datetime attribute
- [ ] Badges have aria-label
- [ ] Focus indicators visible

---

## Definition of Done

- [ ] All acceptance criteria (AC1-AC10) implemented
- [ ] Components created:
  - [ ] `OrderHistoryTimeline.tsx` (~150 lines)
  - [ ] `WbHistoryTimeline.tsx` (~140 lines)
  - [ ] `LocalHistoryTimeline.tsx` (~120 lines)
  - [ ] `HistoryEntryCard.tsx` (~100 lines)
  - [ ] `HistorySourceBadge.tsx` (~40 lines)
  - [ ] `DurationDisplay.tsx` (~60 lines)
  - [ ] `TimelineSummary.tsx` (~80 lines)
  - [ ] `TimelineEmptyState.tsx` (~40 lines)
- [ ] Utility functions created:
  - [ ] `formatDuration()` in `src/lib/duration-utils.ts`
  - [ ] `groupByCategory()` in `src/lib/history-utils.ts`
- [ ] Uses `wb-status-mapping.ts` for all WB status translations
- [ ] Unknown WB codes handled gracefully (show raw code)
- [ ] Duration formatting matches specification
- [ ] Summary sections show correct statistics
- [ ] Empty states with appropriate messages
- [ ] All text in Russian
- [ ] Responsive design (mobile stacks correctly)
- [ ] Accessibility requirements met (WCAG 2.1 AA)
- [ ] Unit tests passing (80%+ coverage)
- [ ] No TypeScript errors
- [ ] ESLint passes
- [ ] File size <200 lines per component
- [ ] Code review approved

---

## Dependencies

### Required (Blocking)

| Dependency | Story | Status | Notes |
|------------|-------|--------|-------|
| Types & API Client | 40.1-FE | Required | TypeScript interfaces for history types |
| React Query Hooks | 40.2-FE | Required | `useFullHistory`, `useWbHistory`, `useLocalHistory` |
| WB Status Mapping | Existing | Complete | `src/lib/wb-status-mapping.ts` |

### Consumed By

| Dependency | Story | Notes |
|------------|-------|-------|
| Order Details Modal | 40.4-FE | Uses all three timeline components |

### Backend

| Dependency | Story | Status |
|------------|-------|--------|
| `GET /v1/orders/:orderId/history` | 40.8 | Complete |
| `GET /v1/orders/:orderId/wb-history` | 40.9 | Complete |
| `GET /v1/orders/:orderId/full-history` | 40.9 | Complete |

---

## Dev Notes

### Relevant Source Tree

```
src/
├── app/(dashboard)/orders/
│   └── components/
│       ├── OrderHistoryTimeline.tsx    # NEW: This story
│       ├── WbHistoryTimeline.tsx       # NEW: This story
│       ├── LocalHistoryTimeline.tsx    # NEW: This story
│       ├── HistoryEntryCard.tsx        # NEW: This story
│       ├── HistorySourceBadge.tsx      # NEW: This story
│       ├── DurationDisplay.tsx         # NEW: This story
│       ├── TimelineSummary.tsx         # NEW: This story
│       ├── TimelineEmptyState.tsx      # NEW: This story
│       └── __tests__/
│           ├── OrderHistoryTimeline.test.tsx
│           ├── WbHistoryTimeline.test.tsx
│           ├── LocalHistoryTimeline.test.tsx
│           ├── HistoryEntryCard.test.tsx
│           ├── HistorySourceBadge.test.tsx
│           └── DurationDisplay.test.tsx
├── lib/
│   ├── wb-status-mapping.ts            # EXISTING: Use as-is
│   ├── duration-utils.ts               # NEW: This story
│   └── history-utils.ts                # NEW: This story
└── types/
    └── orders-history.ts               # From Story 40.1-FE
```

### Design System Adherence

Per Design Kit and CLAUDE.md:
- **Icons**: Lucide icons only (Truck, Database, Package, CheckCircle, HelpCircle, etc.)
- **Colors**: Use Tailwind classes from `wb-status-mapping.ts` config
- **Typography**: 14px body text, 12px timestamps
- **Spacing**: Consistent vertical rhythm with `space-y-*`
- **Primary Red**: #E53935 for interactive elements

### Important Patterns

1. **Immutable sorting**: Always `[...entries].sort()` to avoid mutation
2. **Duration calculation**: Backend provides `durationMinutes`, but calculate if not provided
3. **Status fallback**: Always use `getWbStatusConfig()` which handles unknowns
4. **Category icons**: Dynamic import from Lucide using `WB_STATUS_CATEGORY_ICONS`

---

## Related

- **Parent Epic**: [Epic 40-FE: Orders UI & WB Native Status History](../../epics/epic-40-fe-orders-wb-history.md)
- **Backend Story**: [Story 40.9: WB Native Status History](../../../../docs/stories/epic-40/story-40.9-wb-native-status-history.md)
- **Consumer**: [Story 40.4-FE: Order Details Modal](./story-40.4-fe-order-details-modal.md)
- **Status Mapping**: `src/lib/wb-status-mapping.ts`

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-01-29 | 1.0 | Initial story creation | Claude Code (PM Agent) |

---

## Dev Agent Record

_Section for Dev Agent to track implementation progress and decisions_

```
Status: Ready for Dev
Agent:
Started:
Completed:
Notes:
```

---

## QA Results

_Section for QA to document review results_

```
Gate Decision:
Reviewer:
Date:
Quality Score: /100
```
