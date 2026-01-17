# Story 42.3-FE: Missing COGS Alert Component

**Epic**: [42-FE Task Handlers Adaptation](../../epics/epic-42-fe-task-handlers-adaptation.md)
**Status**: 📋 Backlog (Optional)
**Priority**: Optional
**Points**: 2
**Estimated Time**: 2-3 hours
**Depends On**: [Story 42.2-FE](./story-42.2-fe-sanity-check-hook.md)

---

## User Story

**As a** seller using WB Repricer
**I want** to see an alert when products are missing COGS
**So that** I can assign cost prices and see accurate margin data

---

## Background

Sanity check returns `missing_cogs_products` (first 100 nm_ids) and `missing_cogs_total` count. This component displays actionable alert to users.

---

## Acceptance Criteria

### AC1: Alert Displays When Missing COGS
```gherkin
Given sanity check completed
When missing_cogs_total > 0
Then alert banner should display
And show count of products without COGS
And provide link to COGS management page
```

### AC2: Alert Hidden When All COGS Assigned
```gherkin
Given sanity check completed
When missing_cogs_total = 0
Then no alert should display
```

### AC3: Actionable Links
```gherkin
Given alert is displayed
When user clicks "Назначить COGS"
Then navigate to /cogs page with filter has_cogs=false
```

### AC4: Dismissible
```gherkin
Given alert is displayed
When user clicks dismiss
Then alert hides for current session
And can be re-shown via manual check
```

---

## Technical Implementation

### New File: `src/components/custom/MissingCogsAlert.tsx`

```typescript
/**
 * Alert component for products without COGS assignment
 * Story 42.3-FE: Missing COGS Alert Component
 *
 * Usage:
 * <MissingCogsAlert
 *   missingCount={45}
 *   missingProducts={['123', '456']}  // first 100
 *   onDismiss={() => setDismissed(true)}
 * />
 */

'use client'

import { useState } from 'react'
import { AlertTriangle, X, ArrowRight } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface MissingCogsAlertProps {
  /** Total count of products without COGS */
  missingCount: number
  /** First 100 nm_ids without COGS (for tooltip preview) */
  missingProducts?: string[]
  /** Callback when alert dismissed */
  onDismiss?: () => void
  /** Custom className */
  className?: string
}

export function MissingCogsAlert({
  missingCount,
  missingProducts = [],
  onDismiss,
  className,
}: MissingCogsAlertProps) {
  const [isDismissed, setIsDismissed] = useState(false)

  if (isDismissed || missingCount === 0) {
    return null
  }

  const handleDismiss = () => {
    setIsDismissed(true)
    onDismiss?.()
  }

  // Russian pluralization for "товар"
  const getProductWord = (count: number): string => {
    const lastTwo = count % 100
    const lastOne = count % 10

    if (lastTwo >= 11 && lastTwo <= 19) return 'товаров'
    if (lastOne === 1) return 'товар'
    if (lastOne >= 2 && lastOne <= 4) return 'товара'
    return 'товаров'
  }

  const previewProducts = missingProducts.slice(0, 5)
  const hasMore = missingProducts.length > 5

  return (
    <Alert
      variant="destructive"
      className={cn(
        'border-amber-500 bg-amber-50 text-amber-900',
        'dark:border-amber-600 dark:bg-amber-950 dark:text-amber-100',
        className
      )}
    >
      <AlertTriangle className="h-4 w-4 text-amber-600" />
      <AlertTitle className="flex items-center justify-between">
        <span>Товары без себестоимости</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-amber-600 hover:text-amber-800"
          onClick={handleDismiss}
          aria-label="Закрыть"
        >
          <X className="h-4 w-4" />
        </Button>
      </AlertTitle>
      <AlertDescription className="mt-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge
                    variant="outline"
                    className="border-amber-600 text-amber-700 cursor-help"
                  >
                    {missingCount} {getProductWord(missingCount)}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="font-medium mb-1">Артикулы без COGS:</p>
                  <ul className="text-xs space-y-0.5">
                    {previewProducts.map((nmId) => (
                      <li key={nmId}>• {nmId}</li>
                    ))}
                    {hasMore && (
                      <li className="text-muted-foreground">
                        ... и ещё {missingProducts.length - 5}
                      </li>
                    )}
                    {missingCount > missingProducts.length && (
                      <li className="text-muted-foreground italic">
                        Всего: {missingCount} (показаны первые 100)
                      </li>
                    )}
                  </ul>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <span className="text-sm">
              без назначенной себестоимости. Маржа не рассчитывается.
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="border-amber-600 text-amber-700 hover:bg-amber-100"
            asChild
          >
            <Link href="/cogs?has_cogs=false">
              Назначить COGS
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  )
}

// Utility for cn (if not already imported)
import { cn } from '@/lib/utils'
```

---

## Usage Examples

### Dashboard Integration
```typescript
// src/app/(dashboard)/page.tsx
import { MissingCogsAlert } from '@/components/custom/MissingCogsAlert'
import { useSanityCheck } from '@/hooks/useSanityCheck'

export default function Dashboard() {
  const { result } = useSanityCheck()

  return (
    <div>
      {result && (
        <MissingCogsAlert
          missingCount={result.missing_cogs_total}
          missingProducts={result.missing_cogs_products}
        />
      )}
      {/* rest of dashboard */}
    </div>
  )
}
```

### COGS Page Integration
```typescript
// src/app/(dashboard)/cogs/page.tsx
<MissingCogsAlert
  missingCount={missingCogsCount}
  className="mb-4"
/>
```

---

## Definition of Done

- [ ] `MissingCogsAlert` component implemented
- [ ] Russian pluralization correct
- [ ] Tooltip shows preview of missing products
- [ ] Link navigates to COGS page with filter
- [ ] Dismissible for current session
- [ ] Responsive design (mobile/desktop)
- [ ] WCAG 2.1 AA accessible
- [ ] Unit tests written
- [ ] Storybook story (optional)

---

## Testing

### Unit Tests: `src/components/custom/__tests__/MissingCogsAlert.test.tsx`

```typescript
describe('MissingCogsAlert', () => {
  it('should render when missingCount > 0')
  it('should not render when missingCount = 0')
  it('should not render after dismiss')
  it('should show correct Russian pluralization')
  it('should navigate to COGS page on button click')
  it('should show tooltip with product preview')
})
```

### Visual Regression
- Screenshot test for alert styling
- Mobile/desktop responsive check

---

## Design Notes

- **Color**: Amber (warning, not error) - actionable, not critical
- **Position**: Top of page content, below header
- **Animation**: Subtle fade-in, no bounce
- **Dismiss**: Session only, not persistent

---

## Non-goals

- Backend sanity check API (Story 42.2-FE provides hook)
- Persistent dismissal (localStorage) - session only required
- Automatic sanity check triggering - manual trigger only
- Multiple alert instances - single shared component
- Real-time count updates - requires manual refresh

---

## Notes

- Depends on Story 42.2-FE (useSanityCheck hook)
- Consider caching sanity check result (stale time 5 min)
- Could integrate with existing "Products without COGS" filter

---

## Related

- [Story 42.2-FE](./story-42.2-fe-sanity-check-hook.md) - Hook that provides data
- [Story 4.1](../4.1.single-product-cogs-assignment.md) - COGS assignment flow
- [Epic 24 High Ratio Alert](../epic-24/story-24.8-fe-high-ratio-alert.md) - Similar pattern

---

*Created: 2026-01-06*
