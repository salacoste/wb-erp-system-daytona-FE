# CogsMissingState Component - Usage Examples

## Overview

The `CogsMissingState` component displays COGS (Cost of Goods Sold) assignment state when margin calculations are unavailable due to incomplete coverage. It provides contextual messaging and actionable guidance based on coverage percentage.

## Import

```typescript
import { CogsMissingState } from '@/components/custom/CogsMissingState'
```

## Basic Usage

### Critical State (0% Coverage)

```tsx
<CogsMissingState
  productsWithCogs={0}
  totalProducts={100}
  coverage={0}
  onAssignCogs={() => router.push('/cogs')}
/>
```

**Display**: Red critical badge with "Назначьте себестоимость товарам для расчета маржи"

### Warning State (1-49% Coverage)

```tsx
<CogsMissingState
  productsWithCogs={25}
  totalProducts={100}
  coverage={25}
  onAssignCogs={() => router.push('/cogs')}
/>
```

**Display**: Orange warning badge with "Назначьте COGS для точного расчета маржи"

### Info State (50-99% Coverage)

```tsx
<CogsMissingState
  productsWithCogs={75}
  totalProducts={100}
  coverage={75}
  onAssignCogs={() => router.push('/cogs')}
/>
```

**Display**: Yellow info badge with "Назначьте COGS оставшимся товарам" and "Дособрать товары" button

### Complete Coverage (100% - Hidden)

```tsx
<CogsMissingState
  productsWithCogs={100}
  totalProducts={100}
  coverage={100}
/>
```

**Display**: Component returns `null` (not rendered)

## Props

| Prop               | Type            | Default     | Description                                                                                  |
| ------------------ | --------------- | ----------- | -------------------------------------------------------------------------------------------- |
| `productsWithCogs` | `number`        | `0`         | Number of products with COGS assigned                                                        |
| `totalProducts`    | `totalProducts` | `0`         | Total number of products                                                                     |
| `coverage`         | `number`        | `0`         | Coverage percentage (0-100). If not provided, calculated from productsWithCogs/totalProducts |
| `isLoading`        | `boolean`       | `false`     | Show loading skeleton                                                                        |
| `onAssignCogs`     | `() => void`    | `undefined` | Callback when action button clicked                                                          |
| `className`        | `string`        | `undefined` | Additional CSS classes                                                                       |

## Integration with MetricCardEnhanced

```tsx
import { MetricCardEnhanced } from '@/components/custom/MetricCardEnhanced'
import { CogsMissingState } from '@/components/custom/CogsMissingState'

function MarginDisplay({ margin, cogsCoverage }: { margin: number | null; cogsCoverage: number }) {
  if (margin === null && cogsCoverage < 100) {
    return <CogsMissingState coverage={cogsCoverage} onAssignCogs={() => router.push('/cogs')} />
  }

  return (
    <MetricCardEnhanced
      title="Валовая прибыль"
      value={margin}
      format="currency"
    />
  )
}
```

## Coverage Levels

| Coverage | Badge       | Message                | Action           |
| -------- | ----------- | ---------------------- | ---------------- |
| 0%       | 🔴 Critical | "Недостаточно данных"  | Назначить COGS   |
| 1-49%    | 🟠 Warning  | "Требуется действие"   | Назначить COGS   |
| 50-99%   | 🟡 Info     | "Почти готово"         | Дособрать товары |
| 100%     | ✅ Hidden   | Component not rendered | —                |

## Tooltip Content

The component includes an info icon with tooltip explaining margin calculation:

```
Маржа = (Выручка − COGS) / Вырутка

Назначьте себестоимость товарам, чтобы видеть:
• Валовую прибыль по каждому товару
• Маржинальность по брендам и категориям
• Рентабельность вашего бизнеса
```

## Accessibility

- **Role**: `alert` for screen reader announcements
- **ARIA Live**: `polite` for non-intrusive updates
- **Keyboard**: Full keyboard navigation support
- **Color Contrast**: WCAG 2.1 AA compliant (red/orange/yellow on white)
- **Touch Targets**: Minimum 44x44px for interactive elements

## Styling

The component uses:

- `Card` from shadcn/ui with dashed border
- `Badge` for status indicator
- `AlertTriangle` icon from lucide-react
- Primary red (#E53935) for critical state
- Semantic colors for warning/info states

## Testing

All 54 unit tests pass:

```bash
npm test -- CogsMissingState.test.tsx
```

Test coverage includes:

- Rendering & visibility
- Coverage levels (critical, warning, info, complete)
- Action button interactions
- Tooltip behavior
- Accessibility (WCAG 2.1 AA)
- Edge cases and error handling
- Loading states
- Design system compliance
