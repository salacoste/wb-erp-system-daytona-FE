/**
 * ProductTabPlaceholder — "coming soon" UX for the Unified Product Analytics
 * shell (Story 120.5-FE). Each tab renders this until Stories 120.6/120.7 wire
 * the real data.
 *
 * Backend-pending UX pattern (Story 112.3-FE): communicate "coming soon, not
 * broken" with a neutral construction-state card — NOT a "no data" empty state
 * (which would imply a working-but-empty fetch).
 *
 * Note: the backend IS available — Request #177 is RESOLVED (2026-06-02; routes
 * /v1/analytics/product/:nmId/{unified,organic-share,incremental-roas} live). The
 * pending state is FE-side only (data wiring is Stories 120.6/120.7, which
 * verify-first against the live /unified response). User-facing copy therefore
 * does NOT blame the backend or leak the internal ticket number.
 */

import { Card, CardContent } from '@/components/ui/card'
import { Construction } from 'lucide-react'

interface ProductTabPlaceholderProps {
  /** Russian label of the tab whose data is pending. */
  label: string
}

export function ProductTabPlaceholder({ label }: ProductTabPlaceholderProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
        <Construction className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
        <div className="space-y-1">
          <p className="text-sm font-medium">Раздел «{label}» в разработке</p>
          <p className="text-xs text-muted-foreground">Скоро здесь появятся данные по товару</p>
        </div>
      </CardContent>
    </Card>
  )
}
