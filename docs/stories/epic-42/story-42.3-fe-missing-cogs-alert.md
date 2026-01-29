# Story 42.3-FE: Missing COGS Alert Component

**Epic**: [42-FE Task Handlers Adaptation](../../epics/epic-42-fe-task-handlers-adaptation.md)
**Status**: ✅ Complete
**Completed**: 2026-01-29
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
 * Pattern reference: StorageAlertBanner.tsx (Epic 24.8), WbTokenBanner.tsx
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
import Link from 'next/link'

import { cn } from '@/lib/utils'
import { ROUTES } from '@/lib/routes'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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

/**
 * Russian pluralization helper for "товар"
 * Pattern from StorageAlertBanner.tsx
 */
function pluralizeProduct(count: number): string {
  const mod10 = count % 10
  const mod100 = count % 100

  if (mod100 >= 11 && mod100 <= 19) return 'товаров'
  if (mod10 === 1) return 'товар'
  if (mod10 >= 2 && mod10 <= 4) return 'товара'
  return 'товаров'
}

export function MissingCogsAlert({
  missingCount,
  missingProducts = [],
  onDismiss,
  className,
}: MissingCogsAlertProps) {
  const [isDismissed, setIsDismissed] = useState(false)

  // Don't render if dismissed or no missing COGS
  if (isDismissed || missingCount === 0) {
    return null
  }

  const handleDismiss = () => {
    setIsDismissed(true)
    onDismiss?.()
  }

  const previewProducts = missingProducts.slice(0, 5)
  const hasMore = missingProducts.length > 5

  return (
    <Alert
      variant="warning"
      className={cn(
        'border-amber-300 bg-amber-50',
        className
      )}
    >
      <AlertTriangle className="h-4 w-4 text-amber-600" />
      <AlertTitle className="flex items-center justify-between text-amber-800">
        <span>Товары без себестоимости</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-amber-600 hover:text-amber-800 hover:bg-amber-100"
          onClick={handleDismiss}
          aria-label="Закрыть уведомление"
        >
          <X className="h-4 w-4" />
        </Button>
      </AlertTitle>
      <AlertDescription className="mt-2 text-amber-700">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge
                    variant="outline"
                    className="border-amber-500 text-amber-700 bg-amber-100 cursor-help"
                  >
                    {missingCount} {pluralizeProduct(missingCount)}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="font-medium mb-1">Артикулы без себестоимости:</p>
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
            className="border-amber-500 text-amber-700 hover:bg-amber-100 whitespace-nowrap"
            asChild
          >
            <Link href={`${ROUTES.COGS.ROOT}?has_cogs=false`}>
              Назначить COGS
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  )
}
```

---

## Expected Data from Story 42.2-FE

The `useSanityCheck` hook returns `SanityCheckResult` with these relevant fields:

```typescript
interface SanityCheckResult {
  // ... other validation fields ...

  /** Total count of products without COGS in cabinet */
  missing_cogs_total: number

  /** First 100 nm_ids without COGS (for preview) */
  missing_cogs_products: string[]
}
```

---

## Display Locations

### Primary: Dashboard Page (`/dashboard`)
- Position: Top of content area, below header
- Trigger: After sanity check completes (manual or automatic)
- Behavior: Dismissible for current session

### Secondary: COGS Management Page (`/cogs`)
- Position: Above product list
- Trigger: When `missingCount > 0` from ProductList API response
- Alternative: Can use ProductList `has_cogs=false` count instead of sanity check

### Optional: Analytics Pages
- Show banner on pages where margin accuracy matters
- e.g., `/analytics/sku`, `/analytics/dashboard`

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

### Visual Design
- **Color**: Amber (warning variant) - actionable, not critical
- **Icon**: `AlertTriangle` (lucide-react) - consistent with similar alerts
- **Position**: Top of page content, below header
- **Animation**: Subtle fade-in, no bounce
- **Dismiss**: Session only, not persistent (no localStorage)

### Pattern References
- **`StorageAlertBanner.tsx`** (Epic 24.8) - Similar tooltip pattern, Russian pluralization
- **`WbTokenBanner.tsx`** - Same amber color scheme, action button pattern
- **`alert.tsx` variant="warning"** - Uses yellow-300/yellow-50/yellow-800 base

### Accessibility (WCAG 2.1 AA)
- Color contrast: Amber text on light background meets 4.5:1 ratio
- Dismiss button has `aria-label="Закрыть уведомление"`
- Alert has `role="alert"` (from base component)
- Tooltip content accessible via keyboard

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

- [Story 42.2-FE](./story-42.2-fe-sanity-check-hook.md) - `useSanityCheck` hook that provides data
- [Story 4.1-FE](../epic-4/story-4.1-fe-single-product-cogs-assignment.md) - COGS assignment flow
- **StorageAlertBanner.tsx** - `src/app/(dashboard)/analytics/storage/components/StorageAlertBanner.tsx` - Similar pattern
- **WbTokenBanner.tsx** - `src/components/custom/WbTokenBanner.tsx` - Amber action banner pattern
- **Routes** - `src/lib/routes.ts` - Use `ROUTES.COGS.ROOT` for navigation

---

*Created: 2026-01-06*
*Updated: 2026-01-29 - PM validation: Added pattern references, display locations, fixed code sample*
