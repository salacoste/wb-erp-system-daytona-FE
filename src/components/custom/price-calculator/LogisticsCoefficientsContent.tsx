'use client'

/**
 * Logistics Coefficients Content — Collapsible inner content
 * Extracted from LogisticsCoefficientsSection for max-lines compliance
 */

import { Info, ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { CoefficientCalendar } from './CoefficientCalendar'
import { cn } from '@/lib/utils'
import {
  getCoefficientStatusConfig,
  formatCoefficient,
  formatCoefficientDate,
} from '@/lib/coefficient-utils'
import type { NormalizedCoefficient } from '@/lib/coefficient-utils'

/** Auto-fill badge indicator */
function AutoFillBadge({ source }: { source: 'auto' | 'manual' }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'text-xs',
        source === 'auto'
          ? 'bg-green-50 text-green-700 border-green-300'
          : 'bg-muted/50 text-muted-foreground'
      )}
    >
      {source === 'auto' ? 'Автозаполнено' : 'Вручную'}
    </Badge>
  )
}

interface CoefficientsContentProps {
  coefficient: number
  source: 'auto' | 'manual'
  baseLogisticsCost: number
  rawCoefficients?: NormalizedCoefficient[]
  effectiveDate?: string
  impact: { increase: number; increaseDisplay: string; percentDisplay: string }
}

export function LogisticsCoefficientsContent({
  coefficient,
  source,
  rawCoefficients,
  effectiveDate,
  impact,
}: CoefficientsContentProps) {
  const statusConfig = getCoefficientStatusConfig(coefficient)

  return (
    <>
      {/* Coefficient display */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-medium text-lg">{formatCoefficient(coefficient)}</span>
            <Badge
              variant="outline"
              className={cn(
                'text-xs',
                statusConfig.bgColor,
                statusConfig.textColor,
                statusConfig.borderColor
              )}
            >
              {statusConfig.label}
            </Badge>
            <AutoFillBadge source={source} />
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent side="left" size="md">
              <p>
                Коэффициент логистики зависит от загруженности склада. Более высокий коэффициент
                означает повышенную стоимость доставки в периоды пиковой нагрузки.
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
        {effectiveDate && (
          <div className="text-xs text-muted-foreground">
            Действует с: {formatCoefficientDate(effectiveDate)}
          </div>
        )}
      </div>

      {/* Cost impact */}
      {impact.increase > 0 && (
        <div className="flex justify-between text-sm py-2 border-t border-amber-200">
          <span className="text-muted-foreground">Увеличение стоимости:</span>
          <span className="text-destructive font-medium">
            {impact.increaseDisplay} ({impact.percentDisplay})
          </span>
        </div>
      )}

      {/* 14-day calendar */}
      {rawCoefficients && rawCoefficients.length > 0 && (
        <div className="pt-2 border-t border-amber-200">
          <CoefficientCalendar coefficients={rawCoefficients} />
        </div>
      )}

      {/* Help link */}
      <div className="text-xs text-muted-foreground pt-2 border-t border-amber-200">
        <a
          href="https://seller.wildberries.ru/supplies-management/all-supplies"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 hover:underline text-amber-700"
        >
          <ExternalLink className="h-3 w-3" />
          Где найти коэффициенты?
        </a>
      </div>
    </>
  )
}
