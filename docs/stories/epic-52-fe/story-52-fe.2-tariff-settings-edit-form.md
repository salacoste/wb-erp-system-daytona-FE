# Story 52-FE.2: Tariff Settings Edit Form

**Epic**: Epic 52-FE - Tariff Settings Admin UI
**Story ID**: 52-FE.2
**Title**: Tariff Settings Edit Form
**Status**: 📋 Ready for Development
**Story Points**: 8
**Priority**: Required

---

## User Story

**As an** Admin,
**I want to** edit current tariff settings through a form,
**So that** I can update rates without database access.

---

## Acceptance Criteria

- [ ] **AC1**: Form displays all 21 editable fields grouped by category
- [ ] **AC2**: Categories organized in collapsible sections:
  - Приёмка (Acceptance) - 2 fields
  - Логистика (Logistics) - 3 fields + volume tiers
  - Возвраты (Returns) - 2 fields
  - Комиссии (Commission) - 2 fields
  - Хранение (Storage) - 3 fields
  - FBS настройки (FBS) - 4+ fields
- [ ] **AC3**: Validation rules match backend:
  - Positive numbers for rates
  - 0-100 for percentages
  - Non-negative integers for days
- [ ] **AC4**: `logisticsVolumeTiers` editor with add/remove/edit functionality
- [ ] **AC5**: Save button behavior:
  - Full changes → PUT request
  - Partial changes → PATCH request (optimization)
- [ ] **AC6**: Success toast after save: "Тарифы успешно обновлены"
- [ ] **AC7**: Error handling:
  - 400 → Show validation errors inline
  - 429 → Show rate limit message
  - 403 → Redirect to dashboard
- [ ] **AC8**: Confirm dialog before save: "Сохранить изменения тарифов?"

---

## API Integration

### Load Current Settings

```http
GET /v1/tariffs/settings
Authorization: Bearer <jwt-token>
```

### Full Replace (PUT)

```http
PUT /v1/tariffs/settings
Authorization: Bearer <admin-jwt>
Content-Type: application/json

{
  "acceptanceBoxRatePerLiter": 1.80,
  "acceptancePalletRate": 520.00,
  "logisticsLargeFirstLiterRate": 48.00,
  ...all 21 fields
}
```

### Partial Update (PATCH)

```http
PATCH /v1/tariffs/settings
Authorization: Bearer <admin-jwt>
Content-Type: application/json

{
  "storageFreeDays": 45,
  "notes": "Holiday promotion"
}
```

### Response

```json
{
  "data": { ...settings },
  "meta": {
    "updated_at": "2026-01-22T10:00:00.000Z",
    "updated_by": "admin@example.com",
    "fields_updated": ["storage_free_days", "notes"]
  }
}
```

---

## Technical Design

### Components (8 total, each < 200 lines)

| Component | File | Purpose |
|-----------|------|---------|
| `TariffSettingsForm` | `TariffSettingsForm.tsx` | Main form container |
| `AcceptanceRatesSection` | `AcceptanceRatesSection.tsx` | Acceptance fields |
| `LogisticsRatesSection` | `LogisticsRatesSection.tsx` | Logistics fields |
| `CommissionRatesSection` | `CommissionRatesSection.tsx` | Commission fields |
| `StorageSettingsSection` | `StorageSettingsSection.tsx` | Storage fields |
| `FbsSettingsSection` | `FbsSettingsSection.tsx` | FBS-specific fields |
| `LogisticsTiersEditor` | `LogisticsTiersEditor.tsx` | Volume tiers array |
| `TariffFieldInput` | `TariffFieldInput.tsx` | Reusable field input |

### Hook

```typescript
// src/hooks/useUpdateTariffSettings.ts
export function useUpdateTariffSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ data, method }: { data: UpdateTariffSettingsDto; method: 'PUT' | 'PATCH' }) =>
      method === 'PUT'
        ? putTariffSettings(data)
        : patchTariffSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tariffQueryKeys.settings() })
      queryClient.invalidateQueries({ queryKey: tariffQueryKeys.versionHistory() })
      toast.success('Тарифы успешно обновлены')
    },
  })
}
```

### Zod Schema

```typescript
const tariffSettingsSchema = z.object({
  // Acceptance
  acceptanceBoxRatePerLiter: z.number().positive('Должно быть больше 0'),
  acceptancePalletRate: z.number().positive('Должно быть больше 0'),

  // Logistics
  logisticsVolumeTiers: z.array(z.object({
    fromLiters: z.number().positive(),
    toLiters: z.number().positive(),
    rateRub: z.number().positive(),
  })).min(1, 'Минимум 1 тарифный уровень'),
  logisticsLargeFirstLiterRate: z.number().positive(),
  logisticsLargeAdditionalLiterRate: z.number().positive(),

  // Returns
  returnLogisticsFboRate: z.number().positive(),
  returnLogisticsFbsRate: z.number().positive(),

  // Commission (percentages)
  defaultCommissionFboPct: z.number().min(0).max(100, 'Максимум 100%'),
  defaultCommissionFbsPct: z.number().min(0).max(100, 'Максимум 100%'),

  // Storage (integers)
  storageFreeDays: z.number().int().min(0, 'Минимум 0'),
  fixationClothingDays: z.number().int().min(0),
  fixationOtherDays: z.number().int().min(0),

  // FBS
  fbsUsesFboLogisticsRates: z.boolean(),
  logisticsFbsVolumeTiers: z.array(z.object({
    fromLiters: z.number().positive(),
    toLiters: z.number().positive(),
    rateRub: z.number().positive(),
  })).optional(),

  // Meta
  source: z.enum(['manual', 'api']).default('manual'),
  notes: z.string().max(500).optional(),
})
```

---

## UI/UX Specifications

### Form Layout

```
┌─────────────────────────────────────────────────────────┐
│  📝 Редактирование тарифов                              │
│  ───────────────────────────────────────────────────────│
│                                                          │
│  ▼ Приёмка (Acceptance)                                 │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Тариф приёмки (₽/литр)    [ 1.80     ]           │ │
│  │  Тариф паллеты (₽)         [ 520.00   ]           │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ▼ Логистика (Logistics)                                │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Крупногабарит 1-й литр (₽) [ 48.00   ]           │ │
│  │  Крупногабарит доп. (₽/л)   [ 15.00   ]           │ │
│  │                                                    │ │
│  │  Тарифные уровни по объёму:                       │ │
│  │  ┌──────────┬──────────┬──────────┬─────────┐    │ │
│  │  │ От (л)   │ До (л)   │ Тариф (₽)│ Действие│    │ │
│  │  ├──────────┼──────────┼──────────┼─────────┤    │ │
│  │  │ 0.001    │ 0.200    │ 24.00    │ [🗑️]    │    │ │
│  │  │ 0.201    │ 0.400    │ 27.00    │ [🗑️]    │    │ │
│  │  │ ...      │ ...      │ ...      │ ...     │    │ │
│  │  └──────────┴──────────┴──────────┴─────────┘    │ │
│  │  [+ Добавить уровень]                             │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ▶ Возвраты (Returns)          [collapsed]              │
│  ▶ Комиссии (Commission)       [collapsed]              │
│  ▶ Хранение (Storage)          [collapsed]              │
│  ▶ FBS настройки               [collapsed]              │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Заметки                                          │ │
│  │  [                                              ] │ │
│  │  [                                              ] │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  [Отмена]                              [💾 Сохранить]   │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Field Groups

| Section | Fields | Labels (RU) |
|---------|--------|-------------|
| **Приёмка** | `acceptanceBoxRatePerLiter`, `acceptancePalletRate` | Тариф приёмки (₽/литр), Тариф паллеты (₽) |
| **Логистика** | `logisticsLargeFirstLiterRate`, `logisticsLargeAdditionalLiterRate`, `logisticsVolumeTiers` | Крупногабарит 1-й литр, Крупногабарит доп., Тарифные уровни |
| **Возвраты** | `returnLogisticsFboRate`, `returnLogisticsFbsRate` | Возврат FBO (₽), Возврат FBS (₽) |
| **Комиссии** | `defaultCommissionFboPct`, `defaultCommissionFbsPct` | Комиссия FBO (%), Комиссия FBS (%) |
| **Хранение** | `storageFreeDays`, `fixationClothingDays`, `fixationOtherDays` | Бесплатные дни, Фиксация одежда (дней), Фиксация прочее (дней) |
| **FBS** | `fbsUsesFboLogisticsRates`, `logisticsFbsVolumeTiers`, etc. | Использовать тарифы FBO, Тарифы FBS |

---

## Testing Requirements

### Unit Tests

- [ ] Form renders with all sections
- [ ] Each section expands/collapses correctly
- [ ] Validation errors display inline
- [ ] Volume tiers can be added/edited/removed
- [ ] Save button is disabled when form is invalid
- [ ] Confirmation dialog appears before save

### Integration Tests

- [ ] Form loads current settings on mount
- [ ] PUT request sent when all fields changed
- [ ] PATCH request sent when partial fields changed
- [ ] Error handling for 400/403/429 responses
- [ ] Success toast appears after save

---

## Dependencies

- Story 52-FE.7 (Types & Page Layout)
- Story 52-FE.1 (Version History - for cache invalidation)

---

## Files to Create/Modify

### New Files

```
src/components/custom/tariffs-admin/TariffSettingsForm.tsx
src/components/custom/tariffs-admin/AcceptanceRatesSection.tsx
src/components/custom/tariffs-admin/LogisticsRatesSection.tsx
src/components/custom/tariffs-admin/CommissionRatesSection.tsx
src/components/custom/tariffs-admin/StorageSettingsSection.tsx
src/components/custom/tariffs-admin/FbsSettingsSection.tsx
src/components/custom/tariffs-admin/LogisticsTiersEditor.tsx
src/components/custom/tariffs-admin/TariffFieldInput.tsx
src/hooks/useUpdateTariffSettings.ts
```

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Unit tests written and passing (>80% coverage)
- [ ] All components < 200 lines
- [ ] TypeScript strict mode compliant
- [ ] Form accessible (labels, ARIA)
- [ ] Responsive design
- [ ] Code reviewed and approved

---

**Created**: 2026-01-22
**Last Updated**: 2026-01-22
