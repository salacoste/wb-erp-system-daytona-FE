'use client'

import { HelpCircle } from 'lucide-react'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { cn, formatPercentageInt } from '@/lib/utils'
import {
  formatCurrency,
  getRoasColorClass,
  getOrganicContributionColorClass,
} from './advertising-widget-helpers'

// ============================================================================
// Types
// ============================================================================

interface AdvertisingSummary {
  total_sales?: number | null
  avg_organic_contribution?: number | null
  overall_roas?: number | null
}

interface AdvertisingMetricsGridProps {
  summary: AdvertisingSummary
}

// ============================================================================
// Metrics Grid Component
// ============================================================================

/**
 * Compact metrics grid: Total Sales, Organic %, ROAS
 * Extracted from AdvertisingDashboardWidget for file size compliance.
 */
export function AdvertisingMetricsGrid({ summary }: AdvertisingMetricsGridProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {/* Total Sales (organic + advertising) */}
      <div>
        <p className="text-xs text-muted-foreground flex items-center gap-0.5">
          Продажи
          <Tooltip>
            <TooltipTrigger asChild>
              <button type="button" className="inline-flex" aria-label="О продажах">
                <HelpCircle className="h-3 w-3 text-muted-foreground hover:text-foreground transition-colors" />
              </button>
            </TooltipTrigger>
            <TooltipContent size="md">
              <p>Общие продажи: органические + от рекламы. Из рекламного API.</p>
            </TooltipContent>
          </Tooltip>
        </p>
        <p className="text-lg font-bold">{formatCurrency(summary.total_sales)}</p>
      </div>

      {/* Organic Contribution % */}
      <div>
        <p className="text-xs text-muted-foreground flex items-center gap-0.5">
          Органика
          <Tooltip>
            <TooltipTrigger asChild>
              <button type="button" className="inline-flex" aria-label="Об органике">
                <HelpCircle className="h-3 w-3 text-muted-foreground hover:text-foreground transition-colors" />
              </button>
            </TooltipTrigger>
            <TooltipContent size="md">
              <p>Доля продаж без рекламы. Рассчитывается WB.</p>
            </TooltipContent>
          </Tooltip>
        </p>
        <p
          className={cn(
            'text-lg font-bold',
            getOrganicContributionColorClass(summary.avg_organic_contribution)
          )}
        >
          {summary.avg_organic_contribution != null
            ? formatPercentageInt(summary.avg_organic_contribution)
            : '—'}
        </p>
      </div>

      {/* Overall ROAS with color coding */}
      <div>
        <p className="text-xs text-muted-foreground flex items-center gap-0.5">
          ROAS
          <Tooltip>
            <TooltipTrigger asChild>
              <button type="button" className="inline-flex" aria-label="О ROAS">
                <HelpCircle className="h-3 w-3 text-muted-foreground hover:text-foreground transition-colors" />
              </button>
            </TooltipTrigger>
            <TooltipContent size="lg">
              <p>
                Рентабельность рекламы: выручка от рекламных кампаний &divide; расход. Данные из
                рекламного кабинета WB.
              </p>
            </TooltipContent>
          </Tooltip>
        </p>
        <p className={cn('text-lg font-bold', getRoasColorClass(summary.overall_roas))}>
          {summary.overall_roas != null ? `${summary.overall_roas.toFixed(1)}x` : '—'}
        </p>
      </div>
    </div>
  )
}
