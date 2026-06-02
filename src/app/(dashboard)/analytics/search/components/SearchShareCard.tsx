'use client'

/**
 * SearchShareCard — the "Доля поисковых заказов" summary card.
 * Story 111.8-FE: extracted from SearchOrdersOverview so it can express a
 * deduplicated-primary + raw-multi-attribution-subtext layout that the generic
 * cards.map loop can't (and to keep SearchOrdersOverview under the 200-line cap).
 *
 * Two modes (Boundary Normalizer + Defensive Frontend — preserve BOTH values):
 *  - dedup available (searchOrderShareDeduplicated != null): PRIMARY = the sane
 *    ≤100% deduplicated share with NO Info indicator; the raw >100% multi-attributed
 *    value is preserved BELOW as muted subtext + the existing Info tooltip.
 *  - dedup null (older backend): CURRENT behavior — PRIMARY = raw searchOrderShare
 *    + the inflated Info indicator when searchOrderShareInflated.
 */

import { Card, CardContent } from '@/components/ui/card'
import { Percent, Info } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { SearchOrdersSummary } from '@/types/search-analytics'

interface SearchShareCardProps {
  summary: SearchOrdersSummary
  formatPercent: (n: number | undefined | null) => string
  inflatedMessage: string
}

function InflatedInfo({ message }: { message: string }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex cursor-help text-muted-foreground" aria-label={message}>
            <Info className="h-4 w-4" />
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">{message}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export function SearchShareCard({ summary, formatPercent, inflatedMessage }: SearchShareCardProps) {
  const dedup = summary.searchOrderShareDeduplicated
  const hasDedup = dedup != null

  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-4">
        <div className="text-orange-600" aria-hidden="true">
          <Percent className="h-8 w-8" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Доля поисковых заказов</p>
          {hasDedup ? (
            <>
              {/* Sane ≤100% deduplicated figure. Defensive guard: the flag is normally
                  false (dedup is contractually ≤100%), but if the backend ever flags the
                  dedup share itself as inflated, show the same Info indicator — never a
                  >100% primary with no affordance. */}
              <p className="flex items-center gap-1.5 text-2xl font-bold">
                {formatPercent(dedup)}
                {summary.searchOrderShareDeduplicatedInflated === true && (
                  <InflatedInfo message={inflatedMessage} />
                )}
              </p>
              {/* Defensive Frontend: preserve + explain the raw >100% multi-attributed value. */}
              <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                С мультиатрибуцией: {formatPercent(summary.searchOrderShare)}
                {summary.searchOrderShare != null && <InflatedInfo message={inflatedMessage} />}
              </p>
            </>
          ) : (
            <p className="flex items-center gap-1.5 text-2xl font-bold">
              {formatPercent(summary.searchOrderShare)}
              {/* F-6: only when the flag is set AND a real >100% value is shown
                  (never a warning next to '—'). Info affordance — expected, not error. */}
              {summary.searchOrderShareInflated === true && summary.searchOrderShare != null && (
                <InflatedInfo message={inflatedMessage} />
              )}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
