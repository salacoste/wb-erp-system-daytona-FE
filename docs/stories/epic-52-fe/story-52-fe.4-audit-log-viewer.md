# Story 52-FE.4: Audit Log Viewer

**Epic**: Epic 52-FE - Tariff Settings Admin UI
**Story ID**: 52-FE.4
**Title**: Audit Log Viewer
**Status**: 📋 Ready for Development
**Story Points**: 4
**Priority**: Required

---

## User Story

**As an** Admin,
**I want to** view the audit trail of tariff changes,
**So that** I can track who changed what and when for compliance.

---

## Acceptance Criteria

- [ ] **AC1**: Table displays audit entries from `GET /v1/tariffs/settings/audit`
- [ ] **AC2**: Columns: timestamp, user_email, action, field_name, old_value, new_value, IP address
- [ ] **AC3**: Filter dropdown by field_name (21 options)
- [ ] **AC4**: Pagination (50 items per page, server-side)
- [ ] **AC5**: Values formatted appropriately:
  - Arrays (tiers) → JSON formatted, expandable
  - Numbers → With units (₽, %, дней)
  - Booleans → Да/Нет
- [ ] **AC6**: Empty state when no audit entries: "Журнал изменений пуст"
- [ ] **AC7**: Loading skeleton while data is being fetched
- [ ] **AC8**: Action badges: UPDATE (blue), CREATE (green), DELETE (red)

---

## API Integration

### Endpoint

```http
GET /v1/tariffs/settings/audit?page=1&limit=50&field_name=storageFreeDays
Authorization: Bearer <admin-jwt>
```

### Query Parameters

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `page` | number | No | Page number (default: 1) |
| `limit` | number | No | Items per page (default: 50) |
| `field_name` | string | No | Filter by specific field |

### Response

```json
{
  "data": [
    {
      "id": 123,
      "action": "UPDATE",
      "field_name": "storageFreeDays",
      "old_value": "60",
      "new_value": "45",
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "user_email": "admin@example.com",
      "ip_address": "192.168.1.1",
      "created_at": "2026-01-22T10:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 50,
    "total": 234,
    "total_pages": 5
  }
}
```

---

## Technical Design

### Components

| Component | File | Purpose |
|-----------|------|---------|
| `AuditLogTable` | `AuditLogTable.tsx` | Main audit table |
| `AuditFieldFilter` | `AuditFieldFilter.tsx` | Field name dropdown filter |
| `AuditValueDisplay` | `AuditValueDisplay.tsx` | Format old/new values |
| `AuditActionBadge` | `AuditActionBadge.tsx` | Action type badge |

### Hook

```typescript
// src/hooks/useTariffAuditLog.ts
export function useTariffAuditLog(params: AuditLogParams) {
  return useQuery({
    queryKey: tariffQueryKeys.auditLog(params),
    queryFn: () => getTariffAuditLog(params),
  })
}

interface AuditLogParams {
  page?: number
  limit?: number
  field_name?: string
}
```

### Types

```typescript
export interface TariffAuditEntry {
  id: number
  action: 'UPDATE' | 'CREATE' | 'DELETE'
  field_name: string
  old_value: string | null
  new_value: string | null
  user_id: string
  user_email: string
  ip_address: string
  created_at: string
}

export interface TariffAuditResponse {
  data: TariffAuditEntry[]
  meta: {
    page: number
    limit: number
    total: number
    total_pages: number
  }
}
```

---

## UI/UX Specifications

### Table Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│  📋 Журнал изменений                                                     │
│  ───────────────────────────────────────────────────────────────────────│
│                                                                          │
│  Фильтр по полю: [ Все поля ▼ ]                                         │
│                                                                          │
│  ┌───────────┬─────────────┬────────┬──────────────┬─────────┬─────────┐│
│  │ Дата      │ Пользователь│ Действ.│ Поле         │ Было    │ Стало   ││
│  ├───────────┼─────────────┼────────┼──────────────┼─────────┼─────────┤│
│  │ 22.01.26  │ admin@...   │ UPDATE │ storageFree  │ 60 дней │ 45 дней ││
│  │ 14:30:00  │             │        │ Days         │         │         ││
│  ├───────────┼─────────────┼────────┼──────────────┼─────────┼─────────┤│
│  │ 22.01.26  │ admin@...   │ UPDATE │ logistics    │ [JSON]  │ [JSON]  ││
│  │ 14:30:00  │             │        │ VolumeTiers  │ [👁️ ]   │ [👁️ ]   ││
│  └───────────┴─────────────┴────────┴──────────────┴─────────┴─────────┘│
│                                                                          │
│  Показано 1-50 из 234            [ < ] [ 1 ] [ 2 ] [ 3 ] ... [ > ]      │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Table Columns

| Column | Width | Format |
|--------|-------|--------|
| Дата/время | 100px | `DD.MM.YY HH:mm` |
| Пользователь | 150px | Email (truncated) |
| Действие | 80px | Badge |
| Поле | 150px | Field name (translated) |
| Было | flex | Formatted value |
| Стало | flex | Formatted value |
| IP | 100px | IP address |

### Action Badge Colors

```typescript
const ACTION_CONFIG = {
  UPDATE: { label: 'Изменение', color: 'blue' },
  CREATE: { label: 'Создание', color: 'green' },
  DELETE: { label: 'Удаление', color: 'red' },
}
```

### Field Name Translations

```typescript
const FIELD_LABELS: Record<string, string> = {
  acceptanceBoxRatePerLiter: 'Тариф приёмки (₽/л)',
  acceptancePalletRate: 'Тариф паллеты (₽)',
  logisticsVolumeTiers: 'Тарифные уровни',
  storageFreeDays: 'Бесплатные дни хранения',
  defaultCommissionFboPct: 'Комиссия FBO (%)',
  defaultCommissionFbsPct: 'Комиссия FBS (%)',
  // ... all 21 fields
}
```

### Value Formatting

```typescript
function formatAuditValue(fieldName: string, value: string | null): ReactNode {
  if (value === null) return '—'

  // Arrays (tiers, categories)
  if (fieldName.includes('Tiers') || fieldName === 'clothingCategories') {
    return <JsonExpandable value={value} />
  }

  // Percentages
  if (fieldName.includes('Pct')) {
    return `${value}%`
  }

  // Days
  if (fieldName.includes('Days')) {
    return `${value} дней`
  }

  // Rates (currency)
  if (fieldName.includes('Rate')) {
    return `${value} ₽`
  }

  // Booleans
  if (value === 'true' || value === 'false') {
    return value === 'true' ? 'Да' : 'Нет'
  }

  return value
}
```

### Filter Options (21 fields)

```typescript
const FILTER_OPTIONS = [
  { value: '', label: 'Все поля' },
  { value: 'acceptanceBoxRatePerLiter', label: 'Тариф приёмки (₽/л)' },
  { value: 'acceptancePalletRate', label: 'Тариф паллеты (₽)' },
  { value: 'logisticsVolumeTiers', label: 'Тарифные уровни' },
  // ... all 21 fields
]
```

---

## Testing Requirements

### Unit Tests

- [ ] Table renders with audit data
- [ ] Filter dropdown shows all 21 fields
- [ ] Pagination controls work correctly
- [ ] Values formatted with correct units
- [ ] JSON values expandable
- [ ] Empty state displayed correctly
- [ ] Action badges have correct colors

### Integration Tests

- [ ] Fetches data with correct query params
- [ ] Filter updates query and refetches
- [ ] Pagination updates page param
- [ ] Loading skeleton during fetch

---

## Dependencies

- Story 52-FE.7 (Types & Page Layout)
- Uses `Pagination` component (existing or create)

---

## Files to Create/Modify

### New Files

```
src/components/custom/tariffs-admin/AuditLogTable.tsx
src/components/custom/tariffs-admin/AuditFieldFilter.tsx
src/components/custom/tariffs-admin/AuditValueDisplay.tsx
src/components/custom/tariffs-admin/AuditActionBadge.tsx
src/hooks/useTariffAuditLog.ts
```

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Unit tests written and passing
- [ ] All 21 fields have translations
- [ ] Values display with correct formatting
- [ ] Pagination works with server-side data
- [ ] Code reviewed and approved

---

**Created**: 2026-01-22
**Last Updated**: 2026-01-22
