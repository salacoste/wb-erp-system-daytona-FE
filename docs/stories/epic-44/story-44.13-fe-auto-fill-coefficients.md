# Story 44.13: Auto-fill Coefficients from Warehouse

**Epic**: 44 - Price Calculator UI (Frontend)
**Status**: 🔒 Blocked (Backend)
**Priority**: P1 - IMPORTANT
**Effort**: 3 SP
**Depends On**: Story 44.12 (Warehouse Dropdown), Request #98 (Backend API)

---

## Blocking Information

> **Запрос #98 отправлен команде backend, ожидаем уточнения по ряду вопросов.**

### Pending Backend Questions (Request #98)

1. **Кэширование:** Какой TTL для тарифов? (Предложение: 1 час)
2. **Cargo Type Filtering:** Фильтровать склады по типу груза?
3. **FBS vs FBO:** Какие тарифы по умолчанию?
4. **Coefficient Format:** Нормализация `"125"` → `1.25`?
5. **Return Logistics:** Отдельный endpoint для возвратов?

**Backend API Status:** Not implemented
**Expected Endpoint:** `GET /v1/tariffs/box/{warehouse_name}`

---

## User Story

**As a** Seller,
**I want** coefficients to auto-fill when I select a warehouse in the price calculator,
**So that** I can quickly get accurate logistics and storage costs without manually looking up WB tariffs.

**Non-goals**:
- Real-time coefficient updates during form filling (future enhancement)
- Historical coefficient tracking (out of scope)
- Manual coefficient entry validation against WB data (allow override)
- Warehouse search/autocomplete (covered in Story 44.12)

---

## Acceptance Criteria

### AC1: Fetch Tariffs on Warehouse Selection
- [ ] When warehouse selected (from Story 44.12 dropdown), call API
- [ ] API: `GET /v1/tariffs/box/{warehouse_name}`
- [ ] Handle loading state (show skeleton/spinner on coefficient fields)
- [ ] Handle error state (show error message, allow manual entry)
- [ ] Cache successful responses for session duration

### AC2: Auto-fill Logistics Coefficient
- [ ] Auto-populate "Коэффициент логистики" field from `response.logistics.coefficient`
- [ ] Display "Автозаполнено" badge next to field
- [ ] Badge uses muted styling (gray background, small text)
- [ ] Value formatted to 2 decimal places (e.g., `1.50`)
- [ ] Field remains editable for manual override

### AC3: Auto-fill Storage Coefficient
- [ ] Auto-populate storage coefficient from `response.storage.coefficient`
- [ ] Display "Автозаполнено" badge when auto-filled
- [ ] Value formatted to 2 decimal places
- [ ] Field remains editable for manual override

### AC4: Auto-fill КТР (if applicable)
- [ ] If API returns КТР data, auto-populate КТР field
- [ ] Display "Автозаполнено" badge
- [ ] If API does not return КТР, leave field unchanged
- [ ] Show tooltip: "КТР не определён для склада {warehouse_name}"

### AC5: Recalculate Logistics Forward
- [ ] When coefficients auto-filled, recalculate `logistics_forward_rub`
- [ ] Formula: `logistics_forward = (base + (volume - 1) * per_liter) * coefficient`
- [ ] Use volume from Story 44.7 dimension inputs
- [ ] Use base tariffs from API response:
  - `base_rub` = `response.logistics.base_rub` (first liter)
  - `per_liter_rub` = `response.logistics.per_liter_rub` (additional liters)
- [ ] Update field in real-time
- [ ] Show calculation breakdown in tooltip

### AC6: Badge State Management
- [ ] "Автозаполнено" badge shown when value from API
- [ ] "Вручную" badge shown after manual edit
- [ ] Badge style: `Автозаполнено` = green/success, `Вручную` = yellow/warning
- [ ] Badge reverts to "Автозаполнено" if user selects different warehouse
- [ ] Track auto-fill vs manual state per field independently

### AC7: Manual Override Behavior
- [ ] Allow user to edit any auto-filled field
- [ ] On edit, change badge from "Автозаполнено" to "Вручную"
- [ ] Show info tooltip: "Значение отличается от тарифов склада"
- [ ] Manual value persists until new warehouse selected
- [ ] Provide "Восстановить" (Restore) button to revert to API value

---

## Context & References

- **Parent Epic**: `docs/epics/epic-44-price-calculator-ui.md`
- **Story 44.7**: Dimension-Based Volume Calculation (volume input)
- **Story 44.9**: Logistics Coefficients UI (coefficient fields)
- **Story 44.12**: Warehouse Dropdown (warehouse selection - dependency)
- **Request #98**: `docs/request-backend/98-warehouses-tariffs-coefficients-api.md`
- **Backend Response Draft**: `docs/request-backend/98-warehouses-tariffs-BACKEND-RESPONSE-DRAFT.md`
- **SDK Reference**: [`SDK-WAREHOUSES-TARIFFS-REFERENCE.md`](./SDK-WAREHOUSES-TARIFFS-REFERENCE.md) — Full SDK types, transformations, formulas
- **Implementation Roadmap**: [`PHASE-3-IMPLEMENTATION-ROADMAP.md`](./PHASE-3-IMPLEMENTATION-ROADMAP.md)
- **Backend API Reference**: `GET /v1/tariffs/warehouses-with-tariffs` (aggregated endpoint)

---

## API Contract (Pending)

### Request
```http
GET /v1/tariffs/box/{warehouse_name}
Authorization: Bearer {token}
X-Cabinet-Id: {cabinet_id}
```

### Response (Expected)
```json
{
  "data": {
    "warehouse_name": "Коледино",
    "geo_name": "Центральный ФО",
    "effective_from": "2026-01-20",

    "logistics": {
      "coefficient": 1.0,
      "base_rub": 46.0,
      "per_liter_rub": 14.0
    },

    "storage": {
      "coefficient": 1.0,
      "base_per_day_rub": 0.07,
      "per_liter_per_day_rub": 0.05
    },

    "fbs": {
      "coefficient": 1.2,
      "base_rub": 50.0,
      "per_liter_rub": 16.0
    }
  }
}
```

---

## Implementation Notes

### File Structure

```
src/
├── components/
│   └── custom/
│       └── price-calculator/
│           ├── AutoFillBadge.tsx              # CREATE - Badge component
│           ├── CoefficientField.tsx           # CREATE - Field with badge
│           ├── LogisticsCoefficientsSection.tsx  # UPDATE - Add auto-fill
│           └── PriceCalculatorForm.tsx        # UPDATE - Integrate auto-fill
├── hooks/
│   └── useWarehouseTariffs.ts                 # CREATE - API hook
├── lib/
│   └── api/
│       └── tariffs.ts                         # CREATE - API client
└── types/
    └── tariffs.ts                             # CREATE - Type definitions
```

### Type Definitions

```typescript
// src/types/tariffs.ts

export interface WarehouseTariffs {
  warehouse_name: string
  geo_name: string
  effective_from: string

  logistics: LogisticsTariff
  storage: StorageTariff
  fbs?: FbsTariff
}

export interface LogisticsTariff {
  coefficient: number
  base_rub: number
  per_liter_rub: number
}

export interface StorageTariff {
  coefficient: number
  base_per_day_rub: number
  per_liter_per_day_rub: number
}

export interface FbsTariff {
  coefficient: number
  base_rub: number
  per_liter_rub: number
}

export type FieldSource = 'auto' | 'manual'

export interface CoefficientFieldState {
  value: number
  source: FieldSource
  originalValue?: number // For restore functionality
}
```

### API Client

```typescript
// src/lib/api/tariffs.ts
import { apiClient } from '@/lib/api-client'
import type { WarehouseTariffs } from '@/types/tariffs'

/**
 * Fetch box tariffs for a specific warehouse
 * @param warehouseName - URL-encoded warehouse name
 */
export async function getWarehouseTariffs(
  warehouseName: string
): Promise<WarehouseTariffs> {
  const encodedName = encodeURIComponent(warehouseName)
  return apiClient.get<WarehouseTariffs>(`/v1/tariffs/box/${encodedName}`)
}
```

### React Query Hook

```typescript
// src/hooks/useWarehouseTariffs.ts
import { useQuery } from '@tanstack/react-query'
import { getWarehouseTariffs } from '@/lib/api/tariffs'

export const tariffsQueryKeys = {
  all: ['tariffs'] as const,
  box: (warehouseName: string) =>
    [...tariffsQueryKeys.all, 'box', warehouseName] as const,
}

export function useWarehouseTariffs(warehouseName: string | null) {
  return useQuery({
    queryKey: tariffsQueryKeys.box(warehouseName ?? ''),
    queryFn: () => getWarehouseTariffs(warehouseName!),
    enabled: !!warehouseName,
    staleTime: 60 * 60 * 1000, // 1 hour cache
    gcTime: 2 * 60 * 60 * 1000, // 2 hours
  })
}
```

### Logistics Calculation Function

```typescript
// src/lib/logistics-calculation-utils.ts

/**
 * Calculate logistics forward cost based on WB tariffs
 *
 * Formula: (base + (volume - 1) * per_liter) * coefficient
 *
 * @param volumeLiters - Product volume in liters (from Story 44.7)
 * @param baseTariff - Base tariff for first liter (₽)
 * @param perLiterTariff - Additional cost per liter (₽)
 * @param coefficient - Logistics coefficient (default: 1.0)
 * @returns Calculated logistics cost in RUB
 */
export function calculateLogisticsForward(
  volumeLiters: number,
  baseTariff: number,
  perLiterTariff: number,
  coefficient: number = 1.0
): number {
  if (volumeLiters <= 0) return 0

  // First liter is base tariff, additional liters charged per_liter
  const additionalLiters = Math.max(0, volumeLiters - 1)
  const baseCost = baseTariff + additionalLiters * perLiterTariff

  return baseCost * coefficient
}

/**
 * Generate calculation breakdown for tooltip
 */
export function getLogisticsBreakdown(
  volumeLiters: number,
  baseTariff: number,
  perLiterTariff: number,
  coefficient: number
): string {
  const additionalLiters = Math.max(0, volumeLiters - 1)
  const baseCost = baseTariff + additionalLiters * perLiterTariff
  const finalCost = baseCost * coefficient

  return [
    `Объём: ${volumeLiters.toFixed(2)} л`,
    `Базовый тариф: ${baseTariff} ₽ (первый литр)`,
    additionalLiters > 0
      ? `Доп. литры: ${additionalLiters.toFixed(2)} × ${perLiterTariff} ₽ = ${(additionalLiters * perLiterTariff).toFixed(2)} ₽`
      : null,
    `Сумма до коэфф.: ${baseCost.toFixed(2)} ₽`,
    `Коэффициент: ×${coefficient.toFixed(2)}`,
    `Итого: ${finalCost.toFixed(2)} ₽`,
  ]
    .filter(Boolean)
    .join('\n')
}
```

### AutoFillBadge Component

```typescript
// src/components/custom/price-calculator/AutoFillBadge.tsx
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { FieldSource } from '@/types/tariffs'

interface AutoFillBadgeProps {
  source: FieldSource
  className?: string
}

export function AutoFillBadge({ source, className }: AutoFillBadgeProps) {
  const isAuto = source === 'auto'

  return (
    <Badge
      variant={isAuto ? 'secondary' : 'outline'}
      className={cn(
        'text-xs font-normal',
        isAuto && 'bg-green-100 text-green-700 border-green-200',
        !isAuto && 'bg-yellow-100 text-yellow-700 border-yellow-200',
        className
      )}
    >
      {isAuto ? 'Автозаполнено' : 'Вручную'}
    </Badge>
  )
}
```

### CoefficientField Component

```typescript
// src/components/custom/price-calculator/CoefficientField.tsx
interface CoefficientFieldProps {
  label: string
  value: number
  source: FieldSource
  originalValue?: number
  onChange: (value: number) => void
  onSourceChange: (source: FieldSource) => void
  onRestore?: () => void
  disabled?: boolean
  tooltip?: string
}

export function CoefficientField({
  label,
  value,
  source,
  originalValue,
  onChange,
  onSourceChange,
  onRestore,
  disabled,
  tooltip,
}: CoefficientFieldProps) {
  const handleChange = (newValue: number) => {
    onChange(newValue)
    if (source === 'auto') {
      onSourceChange('manual')
    }
  }

  const canRestore = source === 'manual' && originalValue !== undefined

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2">
          {label}
          {tooltip && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs whitespace-pre-wrap">{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </Label>
        <AutoFillBadge source={source} />
      </div>

      <div className="flex gap-2">
        <Input
          type="number"
          value={value}
          onChange={(e) => handleChange(parseFloat(e.target.value) || 0)}
          step={0.01}
          min={0}
          disabled={disabled}
          className="flex-1"
        />
        {canRestore && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRestore}
            title="Восстановить значение из тарифов"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        )}
      </div>

      {source === 'manual' && originalValue !== undefined && (
        <p className="text-xs text-muted-foreground">
          Тарифное значение: {originalValue.toFixed(2)}
        </p>
      )}
    </div>
  )
}
```

### Form Integration Pattern

```typescript
// In PriceCalculatorForm.tsx - coefficient state management
const [coefficientStates, setCoefficientStates] = useState<{
  logistics: CoefficientFieldState
  storage: CoefficientFieldState
  ktr: CoefficientFieldState
}>({
  logistics: { value: 1.0, source: 'manual' },
  storage: { value: 1.0, source: 'manual' },
  ktr: { value: 1.0, source: 'manual' },
})

// Watch warehouse selection (from Story 44.12)
const selectedWarehouse = watch('warehouse_name')

// Fetch tariffs when warehouse changes
const {
  data: tariffs,
  isLoading: tariffsLoading,
  error: tariffsError,
} = useWarehouseTariffs(selectedWarehouse)

// Auto-fill coefficients when tariffs load
useEffect(() => {
  if (tariffs) {
    setCoefficientStates({
      logistics: {
        value: tariffs.logistics.coefficient,
        source: 'auto',
        originalValue: tariffs.logistics.coefficient,
      },
      storage: {
        value: tariffs.storage.coefficient,
        source: 'auto',
        originalValue: tariffs.storage.coefficient,
      },
      ktr: {
        value: 1.0, // КТР may not be in response
        source: 'manual',
      },
    })

    // Recalculate logistics forward
    const volume = watch('volume_liters') || 0
    const logisticsCost = calculateLogisticsForward(
      volume,
      tariffs.logistics.base_rub,
      tariffs.logistics.per_liter_rub,
      tariffs.logistics.coefficient
    )
    setValue('logistics_forward_rub', logisticsCost)
  }
}, [tariffs, setValue, watch])
```

### UI Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ Склад: [Коледино ▼]                         ✅ Загружено        │
├─────────────────────────────────────────────────────────────────┤
│ Коэффициенты логистики                                    [▼]   │
│                                                                 │
│ ┌───────────────────────────────────────────────────────────┐   │
│ │ Коэффициент логистики [?]           [Автозаполнено]       │   │
│ │ [    1.50    ]                                   [↺]      │   │
│ │ Тарифное значение: 1.50                                   │   │
│ └───────────────────────────────────────────────────────────┘   │
│                                                                 │
│ ┌───────────────────────────────────────────────────────────┐   │
│ │ Коэффициент хранения [?]            [Автозаполнено]       │   │
│ │ [    1.00    ]                                   [↺]      │   │
│ └───────────────────────────────────────────────────────────┘   │
│                                                                 │
│ ┌───────────────────────────────────────────────────────────┐   │
│ │ КТР [?]                              [Вручную]            │   │
│ │ [    1.00    ]                                            │   │
│ │ ⚠️ КТР не определён для склада Коледино                   │   │
│ └───────────────────────────────────────────────────────────┘   │
│                                                                 │
│ Логистика прямая: 74,00 ₽  [Автозаполнено] [?]                 │
│ (46₽ + 28₽ × 1.50 = 74₽)                                       │
└─────────────────────────────────────────────────────────────────┘
```

### Invariants & Edge Cases

| Case | Handling |
|------|----------|
| Warehouse not selected | Coefficients default to 1.0, source = 'manual' |
| API returns error | Show error message, allow manual entry |
| API returns null/undefined coefficient | Use default 1.0, source = 'manual' |
| Volume = 0 | Logistics forward = 0, formula not applied |
| User edits auto-filled value | Change badge to 'Вручную', track original |
| User selects new warehouse | Reset all to auto-fill from new tariffs |
| Network timeout | Show retry button, preserve last values |
| Very large coefficient (>5.0) | Allow but show warning tooltip |

---

## Observability

- **Analytics**: Track auto-fill vs manual entry ratio per field
- **Metrics**: API call success/failure rate for tariffs endpoint
- **Logs**: Log warehouse selection and coefficient auto-fill events
- **Errors**: Track API failures with warehouse name for debugging

---

## Security

- **Input Sanitization**: All coefficient inputs validated as positive numbers
- **URL Encoding**: Warehouse name properly encoded in API path
- **XSS Prevention**: No user-generated HTML in tooltips or badges
- **Rate Limiting**: Client-side debounce on warehouse selection (500ms)

---

## Accessibility (WCAG 2.1 AA)

- [ ] All coefficient fields have associated labels
- [ ] Badge announces state change to screen readers (`aria-live="polite"`)
- [ ] Restore button has accessible label (`aria-label`)
- [ ] Loading state announced ("Загрузка тарифов...")
- [ ] Error state has `role="alert"`
- [ ] Tooltip content accessible via keyboard
- [ ] Color contrast ≥4.5:1 for badges (green/yellow on white)
- [ ] Focus visible on all interactive elements

---

## Test Scenarios

### Unit Tests (useWarehouseTariffs.ts)

| Test | Scenario | Expected |
|------|----------|----------|
| Fetch success | Valid warehouse | Returns tariff data |
| Fetch error | Network error | Returns error state |
| Disabled | No warehouse selected | Query not executed |
| Cache | Same warehouse twice | Returns cached data |

### Unit Tests (logistics-calculation-utils.ts)

| Test | Input | Expected Output |
|------|-------|-----------------|
| Volume 1L | base=46, per=14, coef=1.0 | 46 |
| Volume 3L | base=46, per=14, coef=1.0 | 74 (46 + 28) |
| Volume 3L + coef | base=46, per=14, coef=1.5 | 111 (74 × 1.5) |
| Volume 0 | any | 0 |
| Volume 0.5L | base=46, per=14, coef=1.0 | 46 (no additional) |

### Component Tests (CoefficientField)

| Test | Scenario | Expected |
|------|----------|----------|
| Auto badge | source='auto' | Shows "Автозаполнено" |
| Manual badge | source='manual' | Shows "Вручную" |
| Edit auto | User edits auto value | Badge changes to manual |
| Restore | Click restore button | Value reverts, badge → auto |
| Disabled | disabled=true | Input not editable |

### Integration Tests

| Test | Scenario | Expected |
|------|----------|----------|
| Warehouse select | Select "Коледино" | Coefficients auto-fill |
| Change warehouse | Select different warehouse | All coefficients refresh |
| Manual then warehouse | Edit then select new | Manual values overwritten |
| Error recovery | API fails then retry | Shows error, allows manual |

### E2E Tests

| Test | Scenario | Expected |
|------|----------|----------|
| Happy path | Select warehouse, verify auto-fill | All coefficients populated |
| Override flow | Auto-fill, edit, verify badge | Badge shows "Вручную" |
| Restore flow | Override, restore, verify | Badge shows "Автозаполнено" |
| Calculation | Auto-fill, check logistics | Correct calculation displayed |

---

## Dev Agent Record

### File List
| File | Change Type | Lines (est) | Description |
|------|-------------|-------------|-------------|
| `src/types/tariffs.ts` | CREATE | ~40 | Type definitions |
| `src/lib/api/tariffs.ts` | CREATE | ~20 | API client |
| `src/hooks/useWarehouseTariffs.ts` | CREATE | ~30 | Query hook |
| `src/lib/logistics-calculation-utils.ts` | CREATE | ~60 | Calculation functions |
| `src/components/custom/price-calculator/AutoFillBadge.tsx` | CREATE | ~30 | Badge component |
| `src/components/custom/price-calculator/CoefficientField.tsx` | CREATE | ~80 | Field with badge |
| `src/components/custom/price-calculator/LogisticsCoefficientsSection.tsx` | UPDATE | +50 | Integrate auto-fill |
| `src/components/custom/price-calculator/PriceCalculatorForm.tsx` | UPDATE | +40 | Warehouse + state |
| `src/lib/__tests__/logistics-calculation-utils.test.ts` | CREATE | ~60 | Unit tests |
| `src/hooks/__tests__/useWarehouseTariffs.test.ts` | CREATE | ~40 | Hook tests |

### Change Log
(To be filled during implementation)

### Review Follow-ups
(To be filled after code review)

---

## QA Results

**Reviewer**: (To be filled)
**Date**: (To be filled)
**Gate Decision**: (To be filled)

### AC Verification
| AC | Requirement | Status | Evidence |
|----|-------------|--------|----------|
| AC1 | Fetch tariffs on warehouse selection | ⏳ | |
| AC2 | Auto-fill logistics coefficient | ⏳ | |
| AC3 | Auto-fill storage coefficient | ⏳ | |
| AC4 | Auto-fill КТР (if applicable) | ⏳ | |
| AC5 | Recalculate logistics forward | ⏳ | |
| AC6 | Badge state management | ⏳ | |
| AC7 | Manual override behavior | ⏳ | |

### Accessibility Check
| Check | Status | Evidence |
|-------|--------|----------|
| Labels for all fields | ⏳ | |
| Badge aria-live | ⏳ | |
| Restore button label | ⏳ | |
| Loading announcement | ⏳ | |
| Error role=alert | ⏳ | |
| Color contrast | ⏳ | |
| Focus management | ⏳ | |

---

## Definition of Done

- [ ] Backend API available (Request #98 resolved)
- [ ] All Acceptance Criteria verified (AC1-AC7)
- [ ] Components created with proper TypeScript types
- [ ] Unit tests written and passing
- [ ] Integration tests with form flow
- [ ] E2E tests for auto-fill workflow
- [ ] No ESLint errors
- [ ] Accessibility audit passed (WCAG 2.1 AA)
- [ ] Code review completed
- [ ] Documentation updated
- [ ] QA Gate passed

---

**Created**: 2026-01-19
**Last Updated**: 2026-01-19
**Blocked Since**: 2026-01-19 (Awaiting Backend Response)
