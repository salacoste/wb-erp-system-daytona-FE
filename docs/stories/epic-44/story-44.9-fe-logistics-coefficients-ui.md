# Story 44.9: Logistics Coefficients UI

**Epic**: 44 - Price Calculator UI (Frontend)
**Status**: Ready for Dev
**Priority**: P1 - IMPORTANT
**Effort**: 2 SP
**Depends On**: Story 44.8

---

## User Story

**As a** Seller,
**I want** to apply logistics coefficients to the base logistics costs in the price calculator,
**So that** I can accurately calculate the final price accounting for warehouse-specific and territorial distribution factors.

**Non-goals**:
- Automatic fetching of coefficients from WB API (future enhancement)
- Coefficient history/presets (future enhancement)
- Backend API changes (coefficients applied client-side to base logistics)

---

## Background: WB Logistics Coefficients

Wildberries applies two coefficients that affect the final logistics cost:

### 1. Logistics Coefficient (Коэффициент логистики)
- **Formula**: Base Logistics Cost x Coefficient
- **Range**: Typically 1.0 to 3.0+ (varies by warehouse and date)
- **Frequency**: Changes frequently, different for each warehouse
- **Default**: 1.0 (no adjustment)
- **Source**: WB Personal Account > Logistics > Tariffs

### 2. KTR (Коэффициент территориального распределения)
- **Full name**: Territorial Distribution Coefficient
- **Formula**: Applied on top of logistics coefficient
- **Range**: Typically 1.0 to 1.5+
- **Purpose**: Adjusts for regional distribution costs
- **Default**: 1.0 (no adjustment)
- **Source**: WB Personal Account > Logistics > KTR

### Final Formula
```
Final Logistics Cost = Base Cost x Logistics Coefficient x KTR
```

**Example**:
- Base logistics: 100 RUB
- Logistics coefficient: 1.5
- KTR: 1.2
- **Final**: 100 x 1.5 x 1.2 = **180 RUB**

---

## Acceptance Criteria

### AC1: Logistics Coefficient Input Field
- [ ] Add numeric input field "Коэффициент логистики" (logistics coefficient)
- [ ] Default value: 1.0
- [ ] Minimum value: 1.0 (validation error if < 1.0)
- [ ] Step: 0.01 for precision
- [ ] Placeholder: "1.00"
- [ ] Applied to both forward and reverse logistics costs

### AC2: KTR Input Field
- [ ] Add numeric input field "КТР" (territorial distribution coefficient)
- [ ] Default value: 1.0
- [ ] Minimum value: 1.0 (validation error if < 1.0)
- [ ] Step: 0.01 for precision
- [ ] Placeholder: "1.00"
- [ ] Applied to both forward and reverse logistics costs

### AC3: Collapsible Section
- [ ] Create collapsible section "Коэффициенты логистики"
- [ ] Collapsed by default (coefficients are optional)
- [ ] Section header shows current coefficient values when collapsed (e.g., "1.5 x 1.2")
- [ ] Chevron icon indicates expand/collapse state

### AC4: Cost Application
- [ ] Apply coefficients to `logistics_forward_rub` before API call
- [ ] Apply coefficients to `logistics_reverse_rub` before API call
- [ ] Formula: `adjusted_cost = base_cost * logistics_coefficient * ktr`
- [ ] Show adjusted values in calculation summary (if visible)
- [ ] Original base values remain in input fields (coefficients applied separately)

### AC5: Tooltips
- [ ] Tooltip for logistics coefficient explaining warehouse-specific variation
- [ ] Tooltip for KTR explaining territorial distribution adjustment
- [ ] Both tooltips include guidance on where to find current values in WB

### AC6: External Documentation Link
- [ ] Add help link "Где найти коэффициенты?" (Where to find coefficients?)
- [ ] Link opens WB documentation about logistics tariffs in new tab
- [ ] URL: `https://seller.wildberries.ru/help/logistics/tariffs` (or similar)
- [ ] Link styled as small text link below the coefficient inputs

### AC7: Validation & Error Handling
- [ ] Show error if coefficient < 1.0 ("Коэффициент должен быть >= 1.0")
- [ ] Allow empty field (defaults to 1.0 if empty)
- [ ] Validate on blur and on form submit
- [ ] Visual error state (red border) for invalid values

---

## Context & References

- **Parent Epic**: `docs/epics/epic-44-price-calculator-ui.md`
- **Story 44.2**: `docs/stories/epic-44/story-44.2-fe-input-form-component.md` (form patterns)
- **Story 44.8**: Dependencies for form structure updates
- **WB Docs**: https://seller.wildberries.ru/help/logistics/tariffs
- **Current Form**: `src/components/custom/price-calculator/PriceCalculatorForm.tsx`

---

## Implementation Notes

### File Structure

```
src/
├── components/
│   └── custom/
│       └── price-calculator/
│           ├── PriceCalculatorForm.tsx           # UPDATE - Add coefficients section
│           └── LogisticsCoefficientsSection.tsx  # CREATE - New collapsible section
├── types/
│   └── price-calculator.ts                       # UPDATE - Add coefficient types (if needed)
```

### Component Structure

```typescript
// src/components/custom/price-calculator/LogisticsCoefficientsSection.tsx
interface LogisticsCoefficientsProps {
  logisticsCoefficient: number
  ktr: number
  onLogisticsCoefficientChange: (value: number) => void
  onKtrChange: (value: number) => void
  disabled?: boolean
  errors?: {
    logisticsCoefficient?: string
    ktr?: string
  }
}

export function LogisticsCoefficientsSection({
  logisticsCoefficient,
  ktr,
  onLogisticsCoefficientChange,
  onKtrChange,
  disabled,
  errors
}: LogisticsCoefficientsProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Display summary when collapsed
  const summaryText = logisticsCoefficient !== 1 || ktr !== 1
    ? `${logisticsCoefficient.toFixed(2)} × ${ktr.toFixed(2)}`
    : 'По умолчанию (1.0)'

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      {/* ... */}
    </Collapsible>
  )
}
```

### Form Data Updates

```typescript
// Add to FormData interface in PriceCalculatorForm.tsx
interface FormData {
  // ... existing fields
  logistics_coefficient: number  // Default: 1.0
  ktr: number                    // Default: 1.0
}

// Update defaultValues
const defaultValues: FormData = {
  // ... existing defaults
  logistics_coefficient: 1.0,
  ktr: 1.0,
}
```

### Cost Application Logic

```typescript
// In performCalculation function
const adjustedLogisticsForward =
  data.logistics_forward_rub * data.logistics_coefficient * data.ktr
const adjustedLogisticsReverse =
  data.logistics_reverse_rub * data.logistics_coefficient * data.ktr

const request: PriceCalculatorRequest = {
  // ... other fields
  logistics_forward_rub: adjustedLogisticsForward,
  logistics_reverse_rub: adjustedLogisticsReverse,
  // ... rest of fields
}
```

### Validation Rules

```typescript
const validation = {
  logistics_coefficient: {
    min: 1.0,
    required: false,
    default: 1.0,
    message: 'Коэффициент должен быть >= 1.0'
  },
  ktr: {
    min: 1.0,
    required: false,
    default: 1.0,
    message: 'КТР должен быть >= 1.0'
  },
}
```

### Tooltip Content

| Field | Tooltip Text (Russian) |
|-------|------------------------|
| Коэффициент логистики | Множитель стоимости логистики, зависящий от склада и даты отгрузки. Меняется часто — проверяйте актуальное значение в ЛК WB перед расчётом. Обычно от 1.0 до 3.0. |
| КТР | Коэффициент территориального распределения. Учитывает региональные особенности логистики. Обычно от 1.0 до 1.5. Найти можно в разделе «Логистика» ЛК WB. |

### UI Layout

```
┌─────────────────────────────────────────────────────────────┐
│ Коэффициенты логистики                           [▼]        │
│ (1.50 × 1.20)                                               │
├─────────────────────────────────────────────────────────────┤
│ ┌──────────────────────────┐ ┌──────────────────────────┐   │
│ │ Коэффициент логистики [?]│ │ КТР                   [?]│   │
│ │ [    1.50              ] │ │ [    1.20              ] │   │
│ └──────────────────────────┘ └──────────────────────────┘   │
│                                                             │
│ 📎 Где найти коэффициенты? (ссылка на WB)                   │
└─────────────────────────────────────────────────────────────┘
```

### Invariants & Edge Cases

- **Invariant**: Coefficients must be >= 1.0 (WB never reduces logistics cost via coefficients)
- **Edge case**: Empty field → treat as 1.0 (no adjustment)
- **Edge case**: User enters 0 → show validation error
- **Edge case**: Very high coefficient (>5.0) → allow but could add warning
- **Edge case**: Form reset → coefficients reset to 1.0

---

## Observability

- **Analytics**: Track coefficient usage (how often non-default values used)
- **Metrics**: Average coefficient values entered by users
- **Logs**: Log adjusted logistics values for debugging

---

## Security

- **Input Sanitization**: Parse coefficient inputs as float, validate range
- **XSS**: No user-generated HTML in tooltips or links
- **External Link**: Use `rel="noopener noreferrer"` for WB documentation link

---

## Accessibility (WCAG 2.1 AA)

- [ ] All inputs have associated labels
- [ ] Error messages announced to screen readers (`role="alert"`)
- [ ] Collapsible section keyboard accessible (Enter/Space to toggle)
- [ ] Color contrast >= 4.5:1 for all text
- [ ] Touch targets >= 44x44px
- [ ] External link has visible indicator and `aria-label` with destination

---

## Testing Requirements

### Unit Tests
- [ ] LogisticsCoefficientsSection renders correctly
- [ ] Coefficient validation (min 1.0)
- [ ] Empty field defaults to 1.0
- [ ] Coefficient multiplication applied correctly

### Integration Tests
- [ ] Coefficient changes trigger form validation
- [ ] Adjusted logistics values sent to API
- [ ] Reset clears coefficients to 1.0

### E2E Tests
- [ ] User can expand coefficients section
- [ ] User can enter custom coefficients
- [ ] Calculation reflects adjusted logistics costs

---

## Dev Agent Record

### File List
| File | Change Type | Lines (Est.) | Description |
|------|-------------|--------------|-------------|
| `src/components/custom/price-calculator/LogisticsCoefficientsSection.tsx` | CREATE | ~100 | Collapsible coefficients section |
| `src/components/custom/price-calculator/PriceCalculatorForm.tsx` | UPDATE | +30 | Add coefficients to form |
| `src/types/price-calculator.ts` | UPDATE | +5 | Add coefficient fields (optional) |

### Change Log
_To be filled during implementation_

### Review Follow-ups
_To be filled after code review_

---

## QA Checklist

### Functional Verification
| Test Case | Expected Result | Status |
|-----------|-----------------|--------|
| Enter coefficient = 1.5, KTR = 1.0 | Logistics cost x 1.5 | [ ] |
| Enter coefficient = 1.0, KTR = 1.2 | Logistics cost x 1.2 | [ ] |
| Enter coefficient = 1.5, KTR = 1.2 | Logistics cost x 1.8 | [ ] |
| Enter coefficient = 0.5 | Validation error | [ ] |
| Leave fields empty | Default to 1.0 each | [ ] |
| Reset form | Coefficients reset to 1.0 | [ ] |
| Click help link | Opens WB docs in new tab | [ ] |

### Accessibility Verification
| Check | Status |
|-------|--------|
| Keyboard navigation | [ ] |
| Screen reader announces errors | [ ] |
| Color contrast | [ ] |
| Focus visible | [ ] |

---

## Definition of Done

- [ ] All Acceptance Criteria verified (AC1-AC7)
- [ ] Component created with proper TypeScript types
- [ ] Unit tests written and passing
- [ ] Integration tests with form flow
- [ ] No ESLint errors
- [ ] Accessibility audit passed
- [ ] Code review completed
- [ ] Documentation updated
- [ ] QA Gate passed

---

**Created**: 2026-01-19
**Last Updated**: 2026-01-19
