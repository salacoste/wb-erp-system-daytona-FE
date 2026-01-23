# Story 52-FE.3: Schedule Future Version

**Epic**: Epic 52-FE - Tariff Settings Admin UI
**Story ID**: 52-FE.3
**Title**: Schedule Future Version
**Status**: ✅ Complete
**Story Points**: 5
**Priority**: Required

---

## User Story

**As an** Admin,
**I want to** schedule a future tariff version,
**So that** I can plan rate changes in advance.

---

## Acceptance Criteria

- [x] **AC1**: "Запланировать версию" button opens modal
- [x] **AC2**: Modal includes:
  - Date picker for `effective_from` (required)
  - All tariff fields (pre-filled from current settings)
  - Notes field (optional)
- [x] **AC3**: Date validation: must be future date (tomorrow or later)
- [x] **AC4**: Submit calls `POST /v1/tariffs/settings/schedule`
- [x] **AC5**: Error handling:
  - 409 Conflict → "Версия на эту дату уже существует"
  - 429 Rate limit → Show countdown
- [x] **AC6**: Success toast: "Версия запланирована на {date}"
- [x] **AC7**: Info badge shows: "Максимум 10 запланированных версий"
- [x] **AC8**: After success, refresh version history table
- [x] **AC9**: Modal closes after successful submission

---

## API Integration

### Endpoint

```http
POST /v1/tariffs/settings/schedule
Authorization: Bearer <admin-jwt>
Content-Type: application/json

{
  "effective_from": "2026-02-01",
  "storageFreeDays": 45,
  "acceptanceBoxRatePerLiter": 2.00,
  "notes": "February promotion"
}
```

### Success Response (201 Created)

```json
{
  "data": {
    "storage_free_days": 45,
    "effective_from": "2026-02-01T00:00:00.000Z",
    ...
  },
  "meta": {
    "version_id": 3,
    "effective_from": "2026-02-01",
    "status": "scheduled"
  }
}
```

### Error Responses

```json
// 409 Conflict - Duplicate date
{
  "message": "A version already exists for 2026-02-01",
  "error": "Conflict"
}

// 400 Bad Request - Past date
{
  "message": ["effective_from must be a future date"],
  "error": "Bad Request"
}
```

---

## Technical Design

### Components

| Component | File | Purpose |
|-----------|------|---------|
| `ScheduleVersionModal` | `ScheduleVersionModal.tsx` | Modal container |
| `ScheduleVersionForm` | `ScheduleVersionForm.tsx` | Form with date picker + tariff fields |

### Hook

```typescript
// src/hooks/useScheduleTariffVersion.ts
export function useScheduleTariffVersion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ScheduleTariffVersionDto) =>
      scheduleTariffVersion(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: tariffQueryKeys.versionHistory() })
      toast.success(`Версия запланирована на ${formatDate(response.meta.effective_from)}`)
    },
    onError: (error: ApiError) => {
      if (error.status === 409) {
        toast.error('Версия на эту дату уже существует')
      } else if (error.status === 429) {
        toast.error('Превышен лимит запросов. Подождите минуту.')
      }
    },
  })
}
```

### Types

```typescript
export interface ScheduleTariffVersionDto extends Partial<TariffSettingsDto> {
  effective_from: string // YYYY-MM-DD, must be future
}
```

### Validation

```typescript
const scheduleVersionSchema = tariffSettingsSchema.extend({
  effective_from: z.string()
    .refine((date) => new Date(date) > new Date(), {
      message: 'Дата должна быть в будущем'
    }),
})
```

---

## UI/UX Specifications

### Modal Layout

```
┌─────────────────────────────────────────────────────────┐
│  📅 Запланировать новую версию тарифов            [✕]  │
│  ───────────────────────────────────────────────────────│
│                                                          │
│  ℹ️ Максимум 10 запланированных версий                   │
│                                                          │
│  Дата начала действия *                                  │
│  ┌────────────────────────────────────────────────────┐ │
│  │  📅 [ Выберите дату ]                              │ │
│  └────────────────────────────────────────────────────┘ │
│  Минимум: завтра                                         │
│                                                          │
│  ─────────────────────────────────────────────────────── │
│                                                          │
│  ▼ Приёмка                                              │
│  [Same fields as TariffSettingsForm, pre-filled]        │
│                                                          │
│  ▼ Логистика                                            │
│  ...                                                     │
│                                                          │
│  Заметки                                                 │
│  [ February promotion                               ]    │
│                                                          │
│  ─────────────────────────────────────────────────────── │
│                                                          │
│  [Отмена]                         [📅 Запланировать]    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Date Picker Rules

- Minimum date: Tomorrow
- Format display: DD.MM.YYYY (Russian locale)
- Format submit: YYYY-MM-DD (ISO)
- Disabled dates: Dates with existing scheduled versions

### Button States

| State | Button Text | Enabled |
|-------|-------------|---------|
| Initial | Запланировать | No (date required) |
| Date selected | Запланировать | Yes |
| Submitting | Сохранение... | No (loading) |
| Success | - | Modal closes |

---

## Testing Requirements

### Unit Tests

- [x] Modal opens when button clicked
- [x] Date picker enforces future dates
- [x] Form pre-fills with current settings
- [x] Submit button disabled without date
- [x] Loading state during submission
- [x] Modal closes on success

### Integration Tests

- [x] POST request sent with correct payload
- [x] 409 error shows duplicate message
- [x] Version history refreshes after success
- [x] Rate limit handling (429)

---

## Dependencies

- Story 52-FE.7 (Types & Page Layout)
- Story 52-FE.2 (Reuses form sections)
- shadcn/ui `DatePicker` component

---

## Files to Create/Modify

### New Files

```
src/components/custom/tariffs-admin/ScheduleVersionModal.tsx
src/components/custom/tariffs-admin/ScheduleVersionForm.tsx
src/hooks/useScheduleTariffVersion.ts
```

### Add DatePicker (if not exists)

```bash
npx shadcn@latest add calendar popover
```

---

## Definition of Done

- [x] All acceptance criteria met
- [x] Unit tests written and passing
- [x] Modal accessible (focus trap, ESC to close)
- [x] Date picker works with Russian locale
- [x] Error states handled gracefully
- [ ] Code reviewed and approved

---

**Created**: 2026-01-22
**Last Updated**: 2026-01-22
