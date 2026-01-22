# Story 44.9: Logistics Coefficients UI

**Epic**: 44 - Price Calculator UI (Frontend)
**Status**: 📋 Ready for Dev
**Priority**: P1 - IMPORTANT
**Effort**: 2 SP
**Depends On**: Story 44.8 (Logistics Tariff), Story 44.12 (Warehouse Selection)

---

## User Story

**As a** Seller,
**I want** to view and apply logistics coefficients from WB warehouse data in the price calculator,
**So that** I can accurately calculate final logistics costs accounting for warehouse-specific coefficient variations.

**Non-goals**:
- Automatic coefficient history/presets (future enhancement)
- Manual coefficient entry without warehouse selection (Story 44.13 handles auto-fill)
- Backend API changes (use existing coefficients API from Request #98)

---

## Background: WB Logistics Coefficients (from Backend Response #98)

### Acceptance Coefficients Structure

WB provides acceptance coefficients per warehouse for a 14-day rolling window:

```json
{
  "warehouseId": 507,
  "warehouseName": "Коледино",
  "coefficients": [
    { "date": "2026-01-20", "coefficient": 100 },
    { "date": "2026-01-21", "coefficient": 125 },
    { "date": "2026-01-22", "coefficient": 150 },
    ...
  ]
}
```

**Key points:**
- Coefficients are integers (100 = 1.0, 125 = 1.25, 150 = 1.5)
- Frontend must normalize: `displayCoefficient = coefficient / 100`
- Coefficients change daily based on warehouse capacity
- Higher coefficient = higher cost (warehouse busy/peak period)

### Final Logistics Formula

```
logistics_cost = (baseLiterRub + (volume - 1) × additionalLiterRub) × coefficient
```

**Example**:
- Base logistics: 58 RUB (for 3L volume)
- Coefficient: 1.25 (warehouse "busy")
- **Final**: 58 × 1.25 = **72.50 RUB**

---

## Acceptance Criteria

### AC1: Coefficient Display in Collapsible Section
- [ ] Create collapsible section "Коэффициенты логистики"
- [ ] Collapsed by default (coefficients are auto-filled from warehouse)
- [ ] Section header shows current coefficient: "Коэффициент: 1.25"
- [ ] Chevron icon indicates expand/collapse state
- [ ] Show coefficient date: "Действует с: 20.01.2026"

### AC2: Coefficient Value Display
- [ ] Display current coefficient value with 2 decimal places (e.g., "1.25")
- [ ] Show coefficient status badge:
  - `1.00` = "Базовый" (green)
  - `1.01-1.50` = "Повышенный" (yellow)
  - `> 1.50` = "Высокий" (red)
- [ ] Tooltip explaining coefficient impact on logistics cost

### AC3: 14-Day Coefficient Calendar (Optional Enhancement)
- [ ] Show mini-calendar with coefficients for next 14 days
- [ ] Color-coded by coefficient level (green/yellow/red)
- [ ] Click on date to see that day's coefficient
- [ ] Current date highlighted
- [ ] Collapsed by default (expand on user request)

### AC4: Cost Impact Calculation
- [ ] Apply coefficient to `logistics_forward_rub` before API call
- [ ] Formula: `adjusted_logistics = base_logistics × coefficient`
- [ ] Show cost impact: "Увеличение: +X ₽ (+Y%)"
- [ ] Update in real-time as coefficient changes

### AC5: Coefficient Auto-fill Integration (with Story 44.13)
- [ ] When warehouse selected, auto-fill coefficient from API
- [ ] Show "Автозаполнено" badge when coefficient from API
- [ ] Show "Вручную" badge when user overrides (if allowed)
- [ ] Track original vs current coefficient value

### AC6: Tooltips and Help
- [ ] Tooltip for coefficient explaining warehouse-specific variation
- [ ] Help link: "Где найти коэффициенты?" → WB documentation
- [ ] URL: `https://seller.wildberries.ru/supplies-management/all-supplies`
- [ ] Link styled as small text link below the coefficient display

### AC7: No Warehouse Selected State
- [ ] If no warehouse selected, show info notice
- [ ] Text: "Выберите склад для отображения коэффициента"
- [ ] Coefficient field hidden or disabled until warehouse selected

---

## API Contract (Backend Request #98)

### Get Acceptance Coefficients

**Endpoint**: `GET /v1/tariffs/acceptance/coefficients?warehouseId={id}`

**Request**:
```http
GET /v1/tariffs/acceptance/coefficients?warehouseId=507
Authorization: Bearer {token}
X-Cabinet-Id: {cabinet_id}
```

**Response**:
```json
{
  "data": {
    "warehouseId": 507,
    "warehouseName": "Коледино",
    "coefficients": [
      {
        "date": "2026-01-20",
        "coefficient": 100
      },
      {
        "date": "2026-01-21",
        "coefficient": 125
      },
      {
        "date": "2026-01-22",
        "coefficient": 150
      }
    ],
    "effectiveFrom": "2026-01-20T00:00:00Z",
    "effectiveUntil": "2026-02-03T00:00:00Z"
  }
}
```

### Coefficient Normalization

The Backend returns integer coefficients. Frontend must normalize:

```typescript
// Backend: 125 → Frontend: 1.25
function normalizeCoefficient(rawCoefficient: number): number {
  return rawCoefficient / 100
}

// Frontend: 1.25 → Backend: 125 (if needed for API calls)
function denormalizeCoefficient(coefficient: number): number {
  return Math.round(coefficient * 100)
}
```

---

## Context & References

- **Parent Epic**: `docs/epics/epic-44-price-calculator-ui.md`
- **Backend Request #98**: `docs/request-backend/98-warehouses-tariffs-BACKEND-RESPONSE.md`
- **SDK Reference**: `docs/stories/epic-44/SDK-WAREHOUSES-TARIFFS-REFERENCE.md`
- **Story 44.8**: Logistics Tariff Calculation (uses coefficient)
- **Story 44.12**: Warehouse Selection (coefficient source)
- **Story 44.13**: Auto-fill Coefficients (integration)
- **WB Docs**: https://seller.wildberries.ru/supplies-management/all-supplies

---

## Implementation Notes

### File Structure

```
src/
├── components/
│   └── custom/
│       └── price-calculator/
│           ├── PriceCalculatorForm.tsx           # UPDATE - Add coefficients section
│           ├── LogisticsCoefficientsSection.tsx  # CREATE - Collapsible section
│           ├── CoefficientDisplay.tsx            # CREATE - Coefficient value display
│           └── CoefficientCalendar.tsx           # CREATE - 14-day mini calendar
├── lib/
│   └── coefficient-utils.ts                      # CREATE - Normalization helpers
├── hooks/
│   └── useAcceptanceCoefficients.ts              # CREATE - API hook
└── types/
    └── coefficients.ts                           # CREATE - Type definitions
```

### TypeScript Interfaces

```typescript
// src/types/coefficients.ts

/**
 * Raw coefficient from WB API (integer: 100 = 1.0)
 */
export interface RawCoefficient {
  date: string  // "2026-01-20"
  coefficient: number  // 100, 125, 150...
}

/**
 * Normalized coefficient for frontend (decimal: 1.0, 1.25)
 */
export interface NormalizedCoefficient {
  date: string
  coefficient: number  // 1.0, 1.25, 1.5...
  status: CoefficientStatus
}

/**
 * Coefficient status based on value
 */
export type CoefficientStatus = 'base' | 'elevated' | 'high'

/**
 * Coefficient status configuration
 */
export interface CoefficientStatusConfig {
  status: CoefficientStatus
  label: string
  color: 'green' | 'yellow' | 'red'
  minValue: number
  maxValue: number
}

/**
 * Acceptance coefficients response
 */
export interface AcceptanceCoefficientsResponse {
  warehouseId: number
  warehouseName: string
  coefficients: RawCoefficient[]
  effectiveFrom: string
  effectiveUntil: string
}
```

### Coefficient Utility Functions

```typescript
// src/lib/coefficient-utils.ts

import type {
  RawCoefficient,
  NormalizedCoefficient,
  CoefficientStatus,
  CoefficientStatusConfig,
} from '@/types/coefficients'

/**
 * Normalize coefficient from API (integer → decimal)
 * 100 → 1.0, 125 → 1.25, 150 → 1.5
 */
export function normalizeCoefficient(raw: number): number {
  return raw / 100
}

/**
 * Denormalize coefficient for API (decimal → integer)
 * 1.0 → 100, 1.25 → 125, 1.5 → 150
 */
export function denormalizeCoefficient(normalized: number): number {
  return Math.round(normalized * 100)
}

/**
 * Get coefficient status based on normalized value
 */
export function getCoefficientStatus(coefficient: number): CoefficientStatus {
  if (coefficient <= 1.0) return 'base'
  if (coefficient <= 1.5) return 'elevated'
  return 'high'
}

/**
 * Coefficient status configuration
 */
export const COEFFICIENT_STATUS_CONFIG: Record<CoefficientStatus, CoefficientStatusConfig> = {
  base: {
    status: 'base',
    label: 'Базовый',
    color: 'green',
    minValue: 0,
    maxValue: 1.0,
  },
  elevated: {
    status: 'elevated',
    label: 'Повышенный',
    color: 'yellow',
    minValue: 1.01,
    maxValue: 1.5,
  },
  high: {
    status: 'high',
    label: 'Высокий',
    color: 'red',
    minValue: 1.51,
    maxValue: Infinity,
  },
}

/**
 * Get coefficient status config
 */
export function getCoefficientStatusConfig(
  coefficient: number
): CoefficientStatusConfig {
  const status = getCoefficientStatus(coefficient)
  return COEFFICIENT_STATUS_CONFIG[status]
}

/**
 * Normalize array of coefficients from API response
 */
export function normalizeCoefficients(
  raw: RawCoefficient[]
): NormalizedCoefficient[] {
  return raw.map((item) => ({
    date: item.date,
    coefficient: normalizeCoefficient(item.coefficient),
    status: getCoefficientStatus(normalizeCoefficient(item.coefficient)),
  }))
}

/**
 * Get today's coefficient from array
 */
export function getTodayCoefficient(
  coefficients: NormalizedCoefficient[]
): NormalizedCoefficient | null {
  const today = new Date().toISOString().split('T')[0]
  return coefficients.find((c) => c.date === today) ?? coefficients[0] ?? null
}

/**
 * Calculate cost increase from coefficient
 */
export function calculateCoefficientImpact(
  baseCost: number,
  coefficient: number
): { increase: number; percentIncrease: number } {
  const adjustedCost = baseCost * coefficient
  const increase = adjustedCost - baseCost
  const percentIncrease = coefficient > 1 ? (coefficient - 1) * 100 : 0

  return {
    increase: Math.round(increase * 100) / 100,
    percentIncrease: Math.round(percentIncrease * 10) / 10,
  }
}
```

### Component Structure

```typescript
// src/components/custom/price-calculator/LogisticsCoefficientsSection.tsx

interface LogisticsCoefficientsSectionProps {
  /** Selected warehouse ID */
  warehouseId: number | null
  /** Current coefficient value */
  coefficient: number
  /** Coefficient source */
  source: 'auto' | 'manual'
  /** Base logistics cost before coefficient */
  baseLogisticsCost: number
  /** Is loading coefficients */
  isLoading?: boolean
  /** Disabled state */
  disabled?: boolean
}

export function LogisticsCoefficientsSection({
  warehouseId,
  coefficient,
  source,
  baseLogisticsCost,
  isLoading,
  disabled,
}: LogisticsCoefficientsSectionProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Fetch coefficients for calendar
  const { data: coefficientsData } = useAcceptanceCoefficients(warehouseId)

  // Calculate impact
  const impact = useMemo(
    () => calculateCoefficientImpact(baseLogisticsCost, coefficient),
    [baseLogisticsCost, coefficient]
  )

  // Summary text for collapsed state
  const summaryText = coefficient !== 1.0
    ? `Коэффициент: ${coefficient.toFixed(2)} (+${impact.percentIncrease}%)`
    : 'Коэффициент: 1.00 (базовый)'

  if (!warehouseId) {
    return (
      <Alert variant="info">
        <Info className="h-4 w-4" />
        <AlertDescription>
          Выберите склад для отображения коэффициента
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="flex w-full justify-between p-2"
          disabled={isLoading}
        >
          <span className="text-sm text-muted-foreground">{summaryText}</span>
          <ChevronDown className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')} />
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent className="space-y-4 pt-2">
        {/* Coefficient display */}
        <CoefficientDisplay
          coefficient={coefficient}
          source={source}
          effectiveDate={coefficientsData?.coefficients?.[0]?.date}
        />

        {/* Cost impact */}
        {impact.increase > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Увеличение стоимости:</span>
            <span className="text-destructive">
              +{formatCurrency(impact.increase)} (+{impact.percentIncrease}%)
            </span>
          </div>
        )}

        {/* 14-day calendar */}
        {coefficientsData?.coefficients && (
          <CoefficientCalendar
            coefficients={normalizeCoefficients(coefficientsData.coefficients)}
          />
        )}

        {/* Help link */}
        <div className="text-xs text-muted-foreground">
          <a
            href="https://seller.wildberries.ru/supplies-management/all-supplies"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 hover:underline"
          >
            <ExternalLink className="h-3 w-3" />
            Где найти коэффициенты?
          </a>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
```

### Coefficient Display Component

```typescript
// src/components/custom/price-calculator/CoefficientDisplay.tsx

interface CoefficientDisplayProps {
  coefficient: number
  source: 'auto' | 'manual'
  effectiveDate?: string
}

export function CoefficientDisplay({
  coefficient,
  source,
  effectiveDate,
}: CoefficientDisplayProps) {
  const config = getCoefficientStatusConfig(coefficient)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-medium">{coefficient.toFixed(2)}</span>
          <Badge
            variant="outline"
            className={cn(
              config.color === 'green' && 'border-green-500 text-green-700',
              config.color === 'yellow' && 'border-yellow-500 text-yellow-700',
              config.color === 'red' && 'border-red-500 text-red-700'
            )}
          >
            {config.label}
          </Badge>
          <AutoFillBadge source={source} />
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
          </TooltipTrigger>
          <TooltipContent side="left" className="max-w-xs">
            <p>
              Коэффициент логистики зависит от загруженности склада.
              Более высокий коэффициент означает повышенную стоимость
              доставки в периоды пиковой нагрузки.
            </p>
          </TooltipContent>
        </Tooltip>
      </div>

      {effectiveDate && (
        <div className="text-xs text-muted-foreground">
          Действует с: {formatDate(effectiveDate)}
        </div>
      )}
    </div>
  )
}
```

### 14-Day Coefficient Calendar

```typescript
// src/components/custom/price-calculator/CoefficientCalendar.tsx

interface CoefficientCalendarProps {
  coefficients: NormalizedCoefficient[]
}

export function CoefficientCalendar({ coefficients }: CoefficientCalendarProps) {
  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="space-y-2">
      <div className="text-xs font-medium text-muted-foreground">
        Коэффициенты на 14 дней:
      </div>
      <div className="grid grid-cols-7 gap-1">
        {coefficients.slice(0, 14).map((item) => {
          const config = getCoefficientStatusConfig(item.coefficient)
          const isToday = item.date === today

          return (
            <Tooltip key={item.date}>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    'p-1 text-center text-xs rounded cursor-help',
                    config.color === 'green' && 'bg-green-100 text-green-700',
                    config.color === 'yellow' && 'bg-yellow-100 text-yellow-700',
                    config.color === 'red' && 'bg-red-100 text-red-700',
                    isToday && 'ring-2 ring-primary'
                  )}
                >
                  <div className="font-medium">{new Date(item.date).getDate()}</div>
                  <div className="text-[10px]">{item.coefficient.toFixed(2)}</div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{formatDate(item.date)}</p>
                <p>Коэффициент: {item.coefficient.toFixed(2)} ({config.label})</p>
              </TooltipContent>
            </Tooltip>
          )
        })}
      </div>
    </div>
  )
}
```

### UI Layout

```
┌─────────────────────────────────────────────────────────────┐
│ ▸ Коэффициент: 1.25 (+25%)                            [▼]   │
├─────────────────────────────────────────────────────────────┤
│ ┌───────────────────────────────────────────────────────┐   │
│ │ 1.25  [Повышенный]  [Автозаполнено]             [?]   │   │
│ │ Действует с: 20.01.2026                               │   │
│ └───────────────────────────────────────────────────────┘   │
│                                                             │
│ Увеличение стоимости:                  +14,50 ₽ (+25%)      │
│                                                             │
│ Коэффициенты на 14 дней:                                    │
│ ┌────┬────┬────┬────┬────┬────┬────┐                       │
│ │ 20 │ 21 │ 22 │ 23 │ 24 │ 25 │ 26 │                       │
│ │1.25│1.25│1.50│1.50│1.25│1.00│1.00│                       │
│ └────┴────┴────┴────┴────┴────┴────┘                       │
│ ┌────┬────┬────┬────┬────┬────┬────┐                       │
│ │ 27 │ 28 │ 29 │ 30 │ 31 │  1 │  2 │                       │
│ │1.00│1.25│1.25│1.50│1.50│1.25│1.00│                       │
│ └────┴────┴────┴────┴────┴────┴────┘                       │
│                                                             │
│ 📎 Где найти коэффициенты? (ссылка на WB)                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Invariants & Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| Coefficient = 100 (API) | Display as 1.00 (normalized) |
| Coefficient = 125 (API) | Display as 1.25 (normalized) |
| Coefficient > 200 (API) | Allow but show "Высокий" (red) status |
| No warehouse selected | Show info notice, hide coefficient section |
| API returns empty coefficients | Use default 1.0, show warning |
| API error | Show error message, allow fallback |
| Form reset | Coefficients reset when warehouse cleared |
| Date outside 14-day window | Extrapolate or show last known value |

---

## Observability

- **Analytics**: Track coefficient usage (how often non-1.0 coefficients)
- **Metrics**: Average coefficient values by warehouse
- **Logs**: Log coefficient normalization for debugging

---

## Security

- **Input Sanitization**: Coefficients validated as positive numbers
- **XSS**: No user-generated HTML in tooltips or calendar
- **External Link**: Use `rel="noopener noreferrer"` for WB link

---

## Accessibility (WCAG 2.1 AA)

- [ ] Collapsible section keyboard accessible (Enter/Space to toggle)
- [ ] Color contrast ≥ 4.5:1 for coefficient status badges
- [ ] Calendar items have tooltips accessible via keyboard
- [ ] Status communicated via text, not just color
- [ ] External link has visible indicator and `aria-label`
- [ ] aria-expanded attribute on collapsible trigger

---

## Testing Requirements

### Unit Tests
- [ ] normalizeCoefficient: 100 → 1.0, 125 → 1.25
- [ ] getCoefficientStatus: base/elevated/high
- [ ] calculateCoefficientImpact: increase calculation

### Component Tests
- [ ] CoefficientDisplay renders correctly
- [ ] Calendar shows correct 14 days
- [ ] Collapsed state shows summary
- [ ] No warehouse shows info notice

### E2E Tests
- [ ] User can expand coefficients section
- [ ] Calendar dates are clickable
- [ ] Help link opens in new tab

---

## Dev Agent Record

### File List
| File | Change Type | Lines (Est.) | Description |
|------|-------------|--------------|-------------|
| `src/types/coefficients.ts` | CREATE | ~40 | Type definitions |
| `src/lib/coefficient-utils.ts` | CREATE | ~80 | Normalization and status helpers |
| `src/hooks/useAcceptanceCoefficients.ts` | CREATE | ~30 | TanStack Query hook |
| `src/components/custom/price-calculator/LogisticsCoefficientsSection.tsx` | CREATE | ~100 | Main collapsible section |
| `src/components/custom/price-calculator/CoefficientDisplay.tsx` | CREATE | ~60 | Coefficient value display |
| `src/components/custom/price-calculator/CoefficientCalendar.tsx` | CREATE | ~70 | 14-day mini calendar |
| `src/components/custom/price-calculator/PriceCalculatorForm.tsx` | UPDATE | +20 | Integrate coefficients section |

### Change Log
_To be filled during implementation_

### Review Follow-ups
_To be filled after code review_

---

## Definition of Done

- [ ] All Acceptance Criteria verified (AC1-AC7)
- [ ] Components created with proper TypeScript types
- [ ] Coefficient normalization works correctly
- [ ] 14-day calendar displays accurately
- [ ] Cost impact calculation is correct
- [ ] Unit tests written and passing
- [ ] No ESLint errors
- [ ] Accessibility audit passed
- [ ] Code review completed
- [ ] Documentation updated
- [ ] QA Gate passed

---

## QA Checklist

### Functional Verification
| Test Case | Expected Result | Status |
|-----------|-----------------|--------|
| Coefficient = 1.00 | "Базовый" badge (green) | [ ] |
| Coefficient = 1.25 | "Повышенный" badge (yellow) | [ ] |
| Coefficient = 1.75 | "Высокий" badge (red) | [ ] |
| No warehouse | Info notice displayed | [ ] |
| Expand section | Shows calendar and help link | [ ] |
| Click help link | Opens WB docs in new tab | [ ] |

### Accessibility Verification
| Check | Status |
|-------|--------|
| Keyboard navigation | [ ] |
| Color contrast | [ ] |
| Focus visible | [ ] |
| Screen reader compatible | [ ] |

---

**Created**: 2026-01-19
**Last Updated**: 2026-01-20
