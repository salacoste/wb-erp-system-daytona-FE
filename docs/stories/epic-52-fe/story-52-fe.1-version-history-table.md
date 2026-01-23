# Story 52-FE.1: Version History Table

**Epic**: Epic 52-FE - Tariff Settings Admin UI
**Story ID**: 52-FE.1
**Title**: Version History Table
**Status**: ✅ Complete
**Story Points**: 3
**Priority**: Required
**Completed**: 2026-01-23

---

## User Story

**As an** Admin,
**I want to** view all tariff versions with their status,
**So that** I can understand the history and plan future changes.

---

## Acceptance Criteria

- [x] **AC1**: Table displays all versions from `GET /v1/tariffs/settings/history`
- [x] **AC2**: Each row shows: effective_from, effective_until, status badge, source, notes, created_at, updated_by
- [x] **AC3**: Status badges with correct colors:
  - `scheduled` → Blue badge
  - `active` → Green badge
  - `expired` → Gray badge
- [x] **AC4**: "Delete" button visible only for `scheduled` versions
- [x] **AC5**: Pagination support when >20 versions exist
- [x] **AC6**: Empty state when no history available
- [x] **AC7**: Loading skeleton while data is being fetched

---

## API Integration

### Endpoint

```http
GET /v1/tariffs/settings/history
Authorization: Bearer <admin-jwt>
```

### Response Example

```json
{
  "data": [
    {
      "id": 3,
      "effective_from": "2026-02-01",
      "effective_until": null,
      "status": "scheduled",
      "source": "manual",
      "notes": "February promotion",
      "created_at": "2026-01-22T10:00:00.000Z",
      "updated_by": "admin@example.com"
    },
    {
      "id": 2,
      "effective_from": "2026-01-15",
      "effective_until": "2026-01-31",
      "status": "active",
      "source": "manual",
      "notes": "January 2026 update",
      "created_at": "2026-01-10T09:00:00.000Z",
      "updated_by": "admin@example.com"
    }
  ]
}
```

---

## Technical Design

### Components

| Component | File | Purpose |
|-----------|------|---------|
| `VersionHistoryTable` | `VersionHistoryTable.tsx` | Main table component |
| `VersionStatusBadge` | `VersionStatusBadge.tsx` | Status indicator badge |

### Hook

```typescript
// src/hooks/useTariffVersionHistory.ts
export function useTariffVersionHistory() {
  return useQuery({
    queryKey: tariffQueryKeys.versionHistory(),
    queryFn: () => getTariffVersionHistory(),
  })
}
```

### Types

```typescript
export interface TariffVersion {
  id: number
  effective_from: string
  effective_until: string | null
  status: 'scheduled' | 'active' | 'expired'
  source: 'manual' | 'api'
  notes?: string
  created_at: string
  updated_by: string
}
```

---

## UI/UX Specifications

### Table Columns

| Column | Width | Format |
|--------|-------|--------|
| Дата начала | 120px | `DD.MM.YYYY` |
| Дата окончания | 120px | `DD.MM.YYYY` or "—" |
| Статус | 100px | Badge |
| Источник | 80px | "manual" / "API" |
| Заметки | flex | Text (truncated) |
| Создано | 150px | `DD.MM.YYYY HH:mm` |
| Автор | 150px | Email |
| Действия | 80px | Delete button |

### Status Badge Colors

```typescript
const STATUS_CONFIG = {
  scheduled: { label: 'Запланировано', color: 'blue', bgColor: 'bg-blue-100' },
  active: { label: 'Активно', color: 'green', bgColor: 'bg-green-100' },
  expired: { label: 'Истекло', color: 'gray', bgColor: 'bg-gray-100' },
}
```

### Empty State

```
📋 История версий пуста
Создайте первую версию тарифов или запланируйте изменения.
```

---

## Testing Requirements

### Unit Tests

- [x] Renders table with version data
- [x] Displays correct status badges for each status
- [x] Shows delete button only for scheduled versions
- [x] Handles empty state correctly
- [x] Displays loading skeleton while fetching

### Integration Tests

- [x] Fetches data from API on mount
- [x] Pagination works correctly
- [x] Delete button triggers confirmation dialog

---

## Dependencies

- Story 52-FE.7 (Types & Page Layout) must be completed first
- Uses `TariffVersion` type from `src/types/tariffs-admin.ts`

---

## Files to Create/Modify

### New Files

```
src/components/custom/tariffs-admin/VersionHistoryTable.tsx
src/components/custom/tariffs-admin/VersionStatusBadge.tsx
src/hooks/useTariffVersionHistory.ts
```

### Modified Files

- None (page.tsx created in Story 52-FE.7)

---

## Definition of Done

- [x] All acceptance criteria met
- [x] Unit tests written and passing
- [x] Component follows project conventions (< 200 lines)
- [x] TypeScript strict mode compliant
- [x] Responsive design (desktop-first)
- [x] Loading and error states handled
- [x] Code reviewed and approved

---

## Implementation Status

**Status:** ✅ Complete

### Implemented Components
- `VersionHistoryTable.tsx` (197 lines) - Main table component with loading/empty/error states
- `VersionStatusBadge.tsx` - Status indicator badge with color coding
- `__tests__/VersionHistoryTable.test.tsx` - Comprehensive test coverage

### Notes
Component integrates with DeleteVersionDialog for scheduled version deletion. Uses useTariffVersionHistory hook for data fetching with React Query.

---

**Created**: 2026-01-22
**Last Updated**: 2026-01-23
