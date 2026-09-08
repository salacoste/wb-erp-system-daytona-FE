# Story 44.43-FE: Acceptance Coefficient Status Badge

**Epic**: 44 - Price Calculator UI (Frontend)
**Status**: 📋 Ready for Dev
**Priority**: P2 - MEDIUM (UX enhancement)
**Effort**: 2 SP
**Created**: 2026-01-26
**Depends On**:

- Story 44.12 ✅ (Warehouse Selection)
- Story 44.26a 📋 (Delivery Date Selection)
- Story 44.40 📋 (Two Tariff Systems Integration)

---

## Problem Statement

The SUPPLY API returns an **acceptance coefficient** that indicates delivery availability and pricing status, but the current UI does not display this information clearly to users.

### Coefficient Values & Meanings

| Value             | Meaning               | UI Recommendation                                      |
| ----------------- | --------------------- | ------------------------------------------------------ |
| `-1`              | Приёмка недоступна    | Show "Недоступно" destructive badge, block calculation |
| `0`               | Приёмка бесплатная    | Show "Бесплатно" success badge                         |
| `1`               | Стандартная стоимость | Show "Стандартно" default badge                        |
| `>1` (e.g., 1.65) | Повышенная стоимость  | Show "×1.65" warning badge                             |

### Current Gap

Users cannot see:

- Whether a delivery date is available
- If acceptance is free (coefficient = 0)
- How much the acceptance cost is elevated (coefficient > 1)

---

## User Story

**As a** Seller planning delivery,
**I want** to see a clear visual indicator of the acceptance coefficient status,
**So that** I can quickly understand delivery availability and cost implications.

**Non-goals**:

- Acceptance cost calculation (handled separately)
- Historical coefficient trends
- Coefficient prediction

---

## Acceptance Criteria

### AC1: Badge Component

- [ ] Create reusable `AcceptanceStatusBadge` component
- [ ] Badge variants based on coefficient value:

| Coefficient | Badge        | Color             | Icon |
| ----------- | ------------ | ----------------- | ---- |
| `-1`        | "Недоступно" | Red (destructive) | ⛔   |
| `0`         | "Бесплатно"  | Green (success)   | ✅   |
| `1`         | "Стандартно" | Gray (default)    | -    |
| `1.01-1.50` | "×{value}"   | Yellow (warning)  | ⚠️   |
| `>1.50`     | "×{value}"   | Orange (high)     | 🔴   |

- [ ] Format coefficient as "×1.65" (not "165%")

### AC2: Badge Placement

- [ ] Show badge next to delivery date picker:
  ```
  Дата сдачи: [27.01.2026 ▼]  [×1.65 ⚠️]
  ```
- [ ] Also show in coefficient calendar hover tooltip
- [ ] Show in tariff summary section

### AC3: Unavailable State Handling

- [ ] When coefficient = -1:
  - Show "Недоступно" badge in red
  - Disable calculate button
  - Show info message: "Поставка на выбранную дату невозможна. Выберите другую дату."
  - Calendar should show this date in gray

### AC4: Free Acceptance Highlighting

- [ ] When coefficient = 0:
  - Show "Бесплатно" badge in green
  - Highlight as good choice in calendar (green dot)
  - Show info tip: "Бесплатная приёмка! Рекомендуемая дата."

### AC5: Elevated Cost Warning

- [ ] When coefficient > 1:
  - Show multiplier badge "×1.65"
  - Color based on severity:
    - 1.01-1.25: Yellow (mild increase)
    - 1.26-1.50: Orange (moderate increase)
    - > 1.50: Red (high increase)
  - Tooltip: "Повышенная стоимость приёмки (+{pct}%)"
  - Calculate percentage: `(coefficient - 1) * 100`

### AC6: Tooltip Information

- [ ] Badge tooltip shows detailed information:
  ```
  Коэффициент приёмки: ×1.65
  Стоимость увеличена на 65%

  Причина: высокий спрос на склад
  Рекомендация: выберите дату с меньшим коэффициентом
  ```

### AC7: Calendar Integration

- [ ] Update CoefficientCalendar to show acceptance status:
  - Green border: coefficient = 0 (free)
  - Default border: coefficient = 1
  - Yellow border: coefficient 1.01-1.50
  - Orange border: coefficient > 1.50
  - Gray/disabled: coefficient = -1 (unavailable)
- [ ] Hover shows: "Коэф. ×{value} - {status}"

---

## API Contract Reference

### SUPPLY Coefficient Response

```json
{
  "warehouseId": 130744,
  "warehouseName": "Краснодар (Тихорецкая)",
  "date": "2026-01-27",
  "coefficient": 1.65,      // <- This is the acceptance coefficient
  "isAvailable": true,
  "allowUnload": true
}
```

**Business Logic**:

- `coefficient >= 0 && allowUnload = true` → Available
- `coefficient = -1 || allowUnload = false` → Unavailable
- `coefficient = 0` → Free acceptance

---

## Implementation Notes

### File Structure

```
src/
├── components/custom/price-calculator/
│   ├── AcceptanceStatusBadge.tsx           # CREATE - Badge component
│   ├── DeliveryDatePicker.tsx              # UPDATE - Add badge
│   └── CoefficientCalendar.tsx             # UPDATE - Status colors
├── lib/
│   └── acceptance-status-utils.ts          # CREATE - Status helpers
└── types/
    └── acceptance.ts                       # UPDATE - Status types
```

### Type Definitions

```typescript
// src/types/acceptance.ts

export type AcceptanceStatus =
  | 'unavailable'   // coefficient = -1
  | 'free'          // coefficient = 0
  | 'standard'      // coefficient = 1
  | 'elevated'      // coefficient 1.01-1.50
  | 'high'          // coefficient > 1.50

export interface AcceptanceStatusInfo {
  status: AcceptanceStatus
  coefficient: number
  label: string
  description: string
  color: 'destructive' | 'success' | 'default' | 'warning' | 'high'
  icon: string
  percentageIncrease: number | null
}
```

### Status Utility Functions

```typescript
// src/lib/acceptance-status-utils.ts

import type { AcceptanceStatus, AcceptanceStatusInfo } from '@/types/acceptance'

/**
 * Determine acceptance status from coefficient
 */
export function getAcceptanceStatus(coefficient: number): AcceptanceStatus {
  if (coefficient === -1) return 'unavailable'
  if (coefficient === 0) return 'free'
  if (coefficient === 1) return 'standard'
  if (coefficient <= 1.5) return 'elevated'
  return 'high'
}

/**
 * Get full status info for display
 */
export function getAcceptanceStatusInfo(coefficient: number): AcceptanceStatusInfo {
  const status = getAcceptanceStatus(coefficient)
  const percentageIncrease = coefficient > 1
    ? Math.round((coefficient - 1) * 100)
    : null

  const statusConfig: Record<AcceptanceStatus, Omit<AcceptanceStatusInfo, 'coefficient' | 'percentageIncrease'>> = {
    unavailable: {
      status: 'unavailable',
      label: 'Недоступно',
      description: 'Поставка на данную дату невозможна',
      color: 'destructive',
      icon: '⛔',
    },
    free: {
      status: 'free',
      label: 'Бесплатно',
      description: 'Бесплатная приёмка! Рекомендуемая дата.',
      color: 'success',
      icon: '✅',
    },
    standard: {
      status: 'standard',
      label: 'Стандартно',
      description: 'Стандартная стоимость приёмки',
      color: 'default',
      icon: '',
    },
    elevated: {
      status: 'elevated',
      label: `×${coefficient.toFixed(2)}`,
      description: `Стоимость приёмки увеличена на ${percentageIncrease}%`,
      color: 'warning',
      icon: '⚠️',
    },
    high: {
      status: 'high',
      label: `×${coefficient.toFixed(2)}`,
      description: `Высокая стоимость приёмки (+${percentageIncrease}%)`,
      color: 'high',
      icon: '🔴',
    },
  }

  return {
    ...statusConfig[status],
    coefficient,
    percentageIncrease,
  }
}

/**
 * Format coefficient for display
 */
export function formatCoefficient(coefficient: number): string {
  if (coefficient === -1) return 'Н/Д'
  if (coefficient === 0) return 'Бесплатно'
  if (coefficient === 1) return '×1.00'
  return `×${coefficient.toFixed(2)}`
}
```

### Badge Component

```typescript
// src/components/custom/price-calculator/AcceptanceStatusBadge.tsx

import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { getAcceptanceStatusInfo } from '@/lib/acceptance-status-utils'
import { cn } from '@/lib/utils'

interface AcceptanceStatusBadgeProps {
  coefficient: number
  showTooltip?: boolean
  size?: 'sm' | 'default' | 'lg'
  className?: string
}

const colorClasses: Record<string, string> = {
  destructive: 'bg-red-100 text-red-700 border-red-200',
  success: 'bg-green-100 text-green-700 border-green-200',
  default: 'bg-gray-100 text-gray-700 border-gray-200',
  warning: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
}

export function AcceptanceStatusBadge({
  coefficient,
  showTooltip = true,
  size = 'default',
  className,
}: AcceptanceStatusBadgeProps) {
  const info = getAcceptanceStatusInfo(coefficient)

  const badge = (
    <Badge
      variant="outline"
      className={cn(
        colorClasses[info.color],
        size === 'sm' && 'text-xs px-1.5 py-0',
        size === 'lg' && 'text-base px-3 py-1',
        className
      )}
    >
      {info.icon && <span className="mr-1">{info.icon}</span>}
      {info.label}
    </Badge>
  )

  if (!showTooltip) return badge

  return (
    <Tooltip>
      <TooltipTrigger asChild>{badge}</TooltipTrigger>
      <TooltipContent className="max-w-xs">
        <div className="space-y-1">
          <p className="font-medium">
            Коэффициент приёмки: {formatCoefficient(coefficient)}
          </p>
          <p className="text-sm text-muted-foreground">
            {info.description}
          </p>
          {info.percentageIncrease && info.percentageIncrease > 25 && (
            <p className="text-sm text-amber-600">
              Рекомендуем выбрать дату с меньшим коэффициентом
            </p>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  )
}
```

### UI Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Дата сдачи товара                                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [27.01.2026 ▼]  [×1.65 ⚠️]                                │
│                    ↑                                        │
│                    AcceptanceStatusBadge                    │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Календарь коэффициентов:                              │  │
│  │                                                        │  │
│  │   Пн  Вт  Ср  Чт  Пт  Сб  Вс                          │  │
│  │   27  [28] 29  30  31  1   2                          │  │
│  │   ×1.65⚠️ ×0✅  ×1  ×1  ×1.2  --  --                  │  │
│  │                                                        │  │
│  │   Legend:                                              │  │
│  │   ✅ Бесплатно  ⚠️ Повышен  🔴 Высокий  ⛔ Недоступно   │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘

─── Example: Free Acceptance ───

│  [28.01.2026 ▼]  [✅ Бесплатно]                            │
│                                                             │
│  ℹ️ Бесплатная приёмка! Рекомендуемая дата.                 │

─── Example: Unavailable ───

│  [27.01.2026 ▼]  [⛔ Недоступно]                           │
│                                                             │
│  ⚠️ Поставка на выбранную дату невозможна.                  │
│     Выберите другую дату.                                   │
│                                                             │
│  [Рассчитать] ← DISABLED                                    │
```

---

## Invariants & Edge Cases

| Scenario              | Expected Behavior                              |
| --------------------- | ---------------------------------------------- |
| coefficient = -1      | Show "Недоступно", disable calculation         |
| coefficient = 0       | Show "Бесплатно" with green highlight          |
| coefficient = 1       | Show "Стандартно" (neutral)                    |
| coefficient = 1.25    | Show "×1.25" warning badge                     |
| coefficient = 1.65    | Show "×1.65" high badge                        |
| coefficient = 2.5     | Show "×2.50" high badge (extreme)              |
| coefficient undefined | Treat as unavailable (-1)                      |
| allowUnload = false   | Treat as unavailable regardless of coefficient |

---

## Test Scenarios

### Unit Tests

| Test                  | Input            | Expected              |
| --------------------- | ---------------- | --------------------- |
| Status - unavailable  | coefficient=-1   | status='unavailable'  |
| Status - free         | coefficient=0    | status='free'         |
| Status - standard     | coefficient=1    | status='standard'     |
| Status - elevated     | coefficient=1.25 | status='elevated'     |
| Status - high         | coefficient=1.65 | status='high'         |
| Percentage - elevated | coefficient=1.25 | percentageIncrease=25 |
| Percentage - high     | coefficient=1.65 | percentageIncrease=65 |
| Format - free         | coefficient=0    | "Бесплатно"           |
| Format - standard     | coefficient=1    | "×1.00"               |
| Format - elevated     | coefficient=1.65 | "×1.65"               |

### Component Tests

| Test                       | Scenario         | Expected                     |
| -------------------------- | ---------------- | ---------------------------- |
| Badge render - unavailable | coefficient=-1   | Red badge "Недоступно"       |
| Badge render - free        | coefficient=0    | Green badge "Бесплатно"      |
| Badge render - elevated    | coefficient=1.65 | Yellow badge "×1.65"         |
| Tooltip content            | Hover on badge   | Shows description            |
| Calendar integration       | Render calendar  | Shows status colors per date |

### E2E Tests

| Test               | Flow                            | Verification                  |
| ------------------ | ------------------------------- | ----------------------------- |
| Select free date   | Pick date with coefficient=0    | Green badge, info message     |
| Select unavailable | Pick gray date                  | Red badge, calculate disabled |
| Select elevated    | Pick date with coefficient=1.65 | Warning badge, tooltip        |

---

## Observability

- **Analytics**: Track coefficient distribution across selected dates
- **Metrics**: Free acceptance selection rate (hopefully high!)
- **Logs**: Log unavailable date selection attempts

---

## Security

- No additional security concerns
- Coefficient validation handled by existing stories

---

## Accessibility (WCAG 2.1 AA)

- [ ] Badge has aria-label with full status description
- [ ] Color is not sole indicator (icon + text)
- [ ] Tooltip accessible via keyboard focus
- [ ] Screen reader announces status changes
- [ ] Color contrast >= 4.5:1 for all badge variants

---

## Definition of Done

- [ ] AcceptanceStatusBadge component created
- [ ] Status utility functions implemented
- [ ] Badge integrated with DeliveryDatePicker
- [ ] Calendar shows status colors
- [ ] Unavailable state disables calculation
- [ ] Free state shows recommendation
- [ ] Unit tests written (>90% coverage)
- [ ] Component tests for all variants
- [ ] E2E test for status display
- [ ] No ESLint errors
- [ ] Accessibility audit passed
- [ ] Code review completed

---

## Related Documentation

- **Analysis**: `docs/stories/epic-44/ANALYSIS-PRICE-CALCULATOR-SYNC-2026-01-26.md`
- **Backend API**: `docs/request-backend/98-warehouses-tariffs-BACKEND-RESPONSE.md` - Coefficient Interpretation section
- **Story 44.26a**: Delivery Date Selection
- **Story 44.40**: Two Tariff Systems Integration

---

**Created**: 2026-01-26
**Author**: PM (Acceptance Coefficient Badge)
**Backend Reference**: Request #98 - Coefficient Interpretation table
