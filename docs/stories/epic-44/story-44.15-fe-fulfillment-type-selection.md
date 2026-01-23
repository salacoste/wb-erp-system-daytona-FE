# Story 44.15: FBO/FBS Fulfillment Type Selection

**Epic**: 44 - Price Calculator UI (Frontend)
**Status**: ✅ Complete
**Priority**: P0 - CRITICAL
**Effort**: 2 SP
**Completed**: 2026-01-23
**Depends On**: Story 44.2 (Input Form)
**Requirements Ref**: PRICE-CALCULATOR-REQUIREMENTS.md Section 2, Step 1
**Backend API**: `POST /v1/products/price-calculator` with `delivery_type` parameter

---

## User Story

**As a** Seller,
**I want** to select FBO or FBS fulfillment type in the price calculator,
**So that** the correct commission rates and cost structure are applied for my chosen fulfillment method.

**Non-goals**:
- DBS/EDBS fulfillment types (future scope, per Question #1 in requirements)
- Auto-detection of fulfillment type from existing products
- Fulfillment type comparison side-by-side

---

## Background: FBO vs FBS

| Aspect | FBO (Fulfillment by WB) | FBS (Fulfillment by Seller) |
|--------|-------------------------|----------------------------|
| Описание (RU) | Товар на складе WB | Товар у продавца |
| Storage | Items stored at WB warehouse | Items stored by seller |
| Commission Field | `paidStorageKgvp` (~25%) | `kgvpMarketplace` (~28%) |
| Storage Costs | Applicable | Not applicable (N/A) |
| Acceptance Costs | Applicable | Not applicable (N/A) |
| Turnover Days | Applicable (default: 20) | Not applicable (N/A) |
| API Field | `delivery_type: "fbo"` | `delivery_type: "fbs"` |
| Typical Use | High-volume items | Low-volume or fragile items |

**Business Impact**: FBS commission is typically **3-4% higher** than FBO (96.5% of categories based on analysis of 7,346 WB categories).

---

## Acceptance Criteria

### AC1: Fulfillment Type Selection UI
- [x] Add SegmentedControl / Radio buttons at top of form
- [x] Options: "FBO" and "FBS"
- [x] Default selection: FBO
- [x] Selection persists during form editing
- [x] Clear visual indication of selected option

### AC2: Label and Descriptions
- [x] Label: "Тип исполнения" (Fulfillment Type)
- [x] FBO description: "Товар на складе WB"
- [x] FBS description: "Товар у продавца"
- [x] Tooltip explaining difference between FBO/FBS

### AC3: Commission Rate Impact
- [x] FBO uses `paidStorageKgvp` field from category commissions
- [x] FBS uses `kgvpMarketplace` field from category commissions
- [x] Switching fulfillment type updates commission display immediately
- [x] Show commission % difference indicator (e.g., "FBS +3%")

### AC4: Conditional Field Visibility
- [x] When FBO selected:
  - Show "Хранение" (Storage) input field
  - Show "Тип приёмки" (Acceptance Type) section
  - Show acceptance coefficient field (if paid)
- [x] When FBS selected:
  - Hide "Хранение" field (set to 0)
  - Hide "Тип приёмки" section (set to 0)
  - Hide acceptance coefficient field

### AC5: Form State Integration
- [x] Store `fulfillment_type` in form state as `'FBO' | 'FBS'`
- [x] Reset FBO-only fields to 0 when switching to FBS
- [x] Preserve FBO-only field values when switching back to FBO
- [x] Include `fulfillment_type` in calculation request

### AC6: Accessibility
- [x] Keyboard navigation between FBO/FBS options
- [x] ARIA attributes: `role="radiogroup"`, `aria-checked`
- [x] Screen reader announces selection changes
- [x] Color contrast ≥4.5:1 for selection indicator

---

## Context & References

- **Requirements**: `PRICE-CALCULATOR-REQUIREMENTS.md` Section 2, Step 1
- **Parent Epic**: `docs/epics/epic-44-price-calculator-ui.md`
- **Story 44.2**: Input Form Component (form structure)
- **Story 44.16**: Category Selection (provides commission rates)
- **Backend API**:
  - `GET /v1/tariffs/commissions` - Commission rates per fulfillment type
  - `POST /v1/products/price-calculator` - Accepts `delivery_type: "fbo" | "fbs"`

---

## API Contract

### Backend Integration

**Price Calculator Request** (`POST /v1/products/price-calculator`):
```json
{
  "delivery_type": "fbo",           // "fbo" | "fbs" - affects commission & costs
  "target_margin_pct": 20,
  "cogs_rub": 1500,
  // ... other fields
  "storage_rub": 50,                // FBO only - set to 0 for FBS
  "storage_days": 7                 // FBO only - ignored for FBS
}
```

**Commission Field Mapping** (from `GET /v1/tariffs/commissions`):
```typescript
// API returns commission rates per category
{
  "parentID": 123,
  "parentName": "Одежда",
  "subjectName": "Платья",
  "paidStorageKgvp": 25,    // ← Use for FBO
  "kgvpMarketplace": 28,    // ← Use for FBS (+3% higher)
  "kgvpSupplier": 10,       // DBS (future)
  "kgvpSupplierExpress": 5  // EDBS (future)
}
```

**Commission Difference Analysis** (from backend):
- 96.5% of 7,346 categories: FBS > FBO
- Average difference: +3.38%
- Max difference: up to +10% in some categories

---

## Implementation Notes

### File Structure

```
src/
└── components/
    └── custom/
        └── price-calculator/
            ├── PriceCalculatorForm.tsx           # UPDATE - Add fulfillment type
            └── FulfillmentTypeSelector.tsx       # CREATE - Segmented control
```

### Component Structure

```typescript
// src/components/custom/price-calculator/FulfillmentTypeSelector.tsx

export type FulfillmentType = 'FBO' | 'FBS'

interface FulfillmentTypeSelectorProps {
  value: FulfillmentType
  onChange: (type: FulfillmentType) => void
  disabled?: boolean
  commissionDiff?: number  // Optional: show commission difference
}

export function FulfillmentTypeSelector({
  value,
  onChange,
  disabled,
  commissionDiff,
}: FulfillmentTypeSelectorProps) {
  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        Тип исполнения
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p><strong>FBO</strong> — товар хранится на складе WB. Ниже комиссия, но есть расходы на хранение и приёмку.</p>
            <p className="mt-2"><strong>FBS</strong> — товар у продавца, отгрузка по заказу. Выше комиссия (+3-4%), но нет расходов на хранение.</p>
          </TooltipContent>
        </Tooltip>
      </Label>

      <div className="flex rounded-lg border p-1 bg-muted/50" role="radiogroup">
        <button
          type="button"
          role="radio"
          aria-checked={value === 'FBO'}
          onClick={() => onChange('FBO')}
          disabled={disabled}
          className={cn(
            'flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors',
            value === 'FBO'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <div>FBO</div>
          <div className="text-xs text-muted-foreground">Товар на складе WB</div>
        </button>

        <button
          type="button"
          role="radio"
          aria-checked={value === 'FBS'}
          onClick={() => onChange('FBS')}
          disabled={disabled}
          className={cn(
            'flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors',
            value === 'FBS'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <div className="flex items-center gap-1">
            FBS
            {commissionDiff && commissionDiff > 0 && (
              <Badge variant="outline" className="text-xs">
                +{commissionDiff.toFixed(1)}%
              </Badge>
            )}
          </div>
          <div className="text-xs text-muted-foreground">Товар у продавца</div>
        </button>
      </div>
    </div>
  )
}
```

### Form Data Updates

```typescript
// Update FormData interface in PriceCalculatorForm.tsx
interface FormData {
  fulfillment_type: FulfillmentType  // NEW - 'FBO' | 'FBS'
  // ... existing fields ...
  storage_rub: number               // FBO only
  acceptance_type: 'free' | 'paid'  // FBO only
  acceptance_coefficient: number     // FBO only, if paid
}

// Update defaultValues
const defaultValues: FormData = {
  fulfillment_type: 'FBO',          // Default to FBO
  // ... existing defaults ...
  storage_rub: 0,
  acceptance_type: 'free',
  acceptance_coefficient: 1,
}
```

### Commission Field Mapping

```typescript
// src/lib/price-calculator-utils.ts

export const COMMISSION_FIELD_MAP = {
  FBO: 'paidStorageKgvp',
  FBS: 'kgvpMarketplace',
} as const

/**
 * Get commission percentage based on fulfillment type
 */
export function getCommissionByFulfillmentType(
  category: CategoryCommission,
  fulfillmentType: FulfillmentType
): number {
  return category[COMMISSION_FIELD_MAP[fulfillmentType]]
}

/**
 * Calculate commission difference (FBS - FBO)
 */
export function getCommissionDifference(category: CategoryCommission): number {
  return category.kgvpMarketplace - category.paidStorageKgvp
}
```

### Conditional Field Rendering

```typescript
// In PriceCalculatorForm.tsx
const fulfillmentType = watch('fulfillment_type')

// Effect to reset FBO-only fields when switching to FBS
useEffect(() => {
  if (fulfillmentType === 'FBS') {
    // Reset FBO-only fields
    setValue('storage_rub', 0)
    setValue('storage_days', 0)
    setValue('turnover_days', 0)
    setValue('acceptance_type', 'free')
    setValue('acceptance_coefficient', 1)
  } else {
    // Restore FBO defaults
    setValue('turnover_days', 20)  // Default turnover days
  }
}, [fulfillmentType, setValue])

// Conditional rendering in JSX
{fulfillmentType === 'FBO' && (
  <>
    {/* Storage field */}
    <FormField
      control={control}
      name="storage_rub"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Хранение (за единицу в сутки)</FormLabel>
          <FormControl>
            <Input type="number" min="0" step="0.01" {...field} />
          </FormControl>
          <FormDescription>Стоимость хранения на складе WB</FormDescription>
        </FormItem>
      )}
    />

    {/* Turnover days */}
    <FormField
      control={control}
      name="turnover_days"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Оборачиваемость (дней)</FormLabel>
          <FormControl>
            <Input type="number" min="1" max="365" {...field} />
          </FormControl>
          <FormDescription>Среднее время от поставки до продажи</FormDescription>
        </FormItem>
      )}
    />

    {/* Acceptance type section */}
    <AcceptanceTypeSection control={control} />
  </>
)}
```

### API Request Builder

```typescript
// Build request based on fulfillment type
function buildCalculatorRequest(formData: FormData): PriceCalculatorRequest {
  const request: PriceCalculatorRequest = {
    delivery_type: formData.fulfillment_type.toLowerCase() as 'fbo' | 'fbs',
    cogs_rub: formData.cogs_rub,
    target_margin_pct: formData.target_margin_pct,
    // ... other common fields
  }

  // Add FBO-specific fields
  if (formData.fulfillment_type === 'FBO') {
    request.storage_rub = formData.storage_rub
    request.storage_days = formData.storage_days
    request.turnover_days = formData.turnover_days
  } else {
    // FBS: storage fields are 0
    request.storage_rub = 0
    request.storage_days = 0
  }

  return request
}
```

### UI Layout

```
┌─────────────────────────────────────────────────────────────┐
│ Тип исполнения                                         [?]  │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────┬─────────────────────────────┐   │
│ │         ███ FBO ███     │          FBS    [+3%]       │   │
│ │   Товар на складе WB    │    Товар у продавца        │   │
│ └─────────────────────────┴─────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘

When FBO selected:
┌─────────────────────────────────────────────────────────────┐
│ Хранение (за единицу)                                  [?]  │
│ [       50.00       ] ₽                                     │
├─────────────────────────────────────────────────────────────┤
│ Тип приёмки                                                 │
│ ○ Бесплатная приёмка                                        │
│ ● Платная приёмка  → [Коэффициент: 1.50]                   │
└─────────────────────────────────────────────────────────────┘

When FBS selected:
(Storage and Acceptance sections hidden)
```

### Invariants & Edge Cases

| Scenario | Handling |
|----------|----------|
| Switch FBO → FBS | Reset storage/acceptance/turnover to 0, hide FBO sections |
| Switch FBS → FBO | Restore defaults (turnover=20, storage=0), show FBO sections |
| No category selected | Show placeholder commission % (25% FBO / 28% FBS) |
| Category selected | Calculate actual commission difference from API data |
| Form reset | Fulfillment type resets to FBO (default) |
| Mobile viewport | Full-width buttons, stack vertically if needed |
| API error on commission fetch | Use default commission (25% FBO / 28% FBS), show warning |
| Rapid FBO↔FBS toggle | Debounce state changes (100ms) |

---

## Observability

- **Analytics**: Track FBO vs FBS selection ratio
- **Metrics**: Commission difference awareness (clicks on tooltip)
- **Logs**: Log fulfillment type changes for debugging

---

## Security

- **Input Validation**: Enum validation for fulfillment type ('FBO' | 'FBS')
- **XSS Prevention**: No user-generated HTML in descriptions
- **State Isolation**: Fulfillment type stored in controlled state only

---

## Accessibility (WCAG 2.1 AA)

- [ ] Radio group with `role="radiogroup"`
- [ ] Each option has `role="radio"` and `aria-checked`
- [ ] Keyboard navigation: Tab to group, Arrow keys between options
- [ ] Screen reader announces "FBO selected" or "FBS selected"
- [ ] Color contrast ≥4.5:1 for all text
- [ ] Touch targets ≥44×44px
- [ ] Focus visible indicator on selected option

---

## Testing Requirements

### Unit Tests
- [ ] FulfillmentTypeSelector renders both options
- [ ] Selection changes trigger onChange callback
- [ ] Commission difference badge displays correctly
- [ ] Disabled state prevents interaction

### Integration Tests
- [ ] Switching to FBS hides FBO-only fields
- [ ] Switching to FBO shows FBO-only fields
- [ ] Form values reset correctly on switch
- [ ] Commission rate updates with fulfillment type

### E2E Tests
- [ ] User can select FBO/FBS via click
- [ ] User can navigate with keyboard (Tab, Arrow)
- [ ] Conditional fields show/hide correctly
- [ ] Calculation uses correct commission rate

---

## Dev Agent Record

### File List
| File | Change Type | Lines (Est.) | Description |
|------|-------------|--------------|-------------|
| `src/components/custom/price-calculator/FulfillmentTypeSelector.tsx` | CREATE | ~80 | Segmented control component |
| `src/components/custom/price-calculator/PriceCalculatorForm.tsx` | UPDATE | +40 | Add fulfillment type, conditional fields |
| `src/lib/price-calculator-utils.ts` | UPDATE | +20 | Commission field mapping functions |
| `src/types/price-calculator.ts` | UPDATE | +5 | Add FulfillmentType type |

### Change Log
_(To be filled by Dev Agent during implementation)_

### Implementation Notes
_(To be filled by Dev Agent during implementation)_

### Review Follow-ups
_(To be filled by AI Code Review)_

---

## QA Results

_(To be filled after implementation)_

**Reviewer**:
**Date**:
**Gate Decision**:

### AC Verification
| AC | Requirement | Status | Evidence |
|----|-------------|--------|----------|
| AC1 | Fulfillment Type Selection UI | ⏳ | |
| AC2 | Label and Descriptions | ⏳ | |
| AC3 | Commission Rate Impact | ⏳ | |
| AC4 | Conditional Field Visibility | ⏳ | |
| AC5 | Form State Integration | ⏳ | |
| AC6 | Accessibility | ⏳ | |

### Accessibility Check
| Check | Status | Evidence |
|-------|--------|----------|
| Radio group ARIA | ⏳ | |
| Keyboard navigation | ⏳ | |
| Screen reader | ⏳ | |
| Color contrast | ⏳ | |

---

## Definition of Done

- [ ] All Acceptance Criteria verified (AC1-AC6)
- [ ] Component created with proper TypeScript types
- [ ] Unit tests written and passing
- [ ] Integration tests with form flow
- [ ] No ESLint errors
- [ ] Accessibility audit passed
- [ ] Code review completed
- [ ] Documentation updated
- [ ] QA Gate passed

---

**Created**: 2026-01-20
**Last Updated**: 2026-01-20
