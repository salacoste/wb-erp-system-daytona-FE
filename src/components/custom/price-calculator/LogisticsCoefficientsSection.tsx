'use client'

import { useState, useMemo } from 'react'
import { ChevronDown, Info, ExternalLink, TrendingUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { CoefficientCalendar } from './CoefficientCalendar'
import { cn } from '@/lib/utils'
import {
  getCoefficientStatusConfig,
  formatCoefficient,
  formatCoefficientDate,
  calculateCoefficientImpact,
  normalizeCoefficients,
  type NormalizedCoefficient,
  type RawCoefficient,
} from '@/lib/coefficient-utils'

/**
 * Auto-fill badge indicator
 */
function AutoFillBadge({ source }: { source: 'auto' | 'manual' }) {
  return (
    <Badge variant="outline" className={cn('text-xs',
      source === 'auto' ? 'bg-green-50 text-green-700 border-green-300' : 'bg-gray-50 text-gray-600'
    )}>
      {source === 'auto' ? 'Автозаполнено' : 'Вручную'}
    </Badge>
  )
}

interface LogisticsCoefficientsSectionProps {
  /** Selected warehouse ID */
  warehouseId: number | null
  /** Current coefficient value (normalized: 1.0, 1.25, etc.) */
  coefficient: number
  /** Coefficient source */
  source: 'auto' | 'manual'
  /** Base logistics cost before coefficient */
  baseLogisticsCost: number
  /** Raw coefficients from API (optional) */
  rawCoefficients?: RawCoefficient[]
  /** Effective date of current coefficient */
  effectiveDate?: string
  /** Is loading coefficients */
  isLoading?: boolean
  /** Disabled state */
  disabled?: boolean
}

/**
 * Logistics coefficients collapsible section
 * Story 44.9-FE: Logistics Coefficients UI
 *
 * Displays current coefficient with status badge, cost impact,
 * and optional 14-day calendar view.
 */
export function LogisticsCoefficientsSection({
  warehouseId,
  coefficient,
  source,
  baseLogisticsCost,
  rawCoefficients,
  effectiveDate,
  isLoading,
  disabled,
}: LogisticsCoefficientsSectionProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Normalize coefficients for calendar
  const normalizedCoefficients = useMemo<NormalizedCoefficient[]>(() => {
    if (!rawCoefficients || rawCoefficients.length === 0) return []
    return normalizeCoefficients(rawCoefficients)
  }, [rawCoefficients])

  // Calculate impact
  const impact = useMemo(
    () => calculateCoefficientImpact(baseLogisticsCost, coefficient),
    [baseLogisticsCost, coefficient]
  )

  // Get status config
  const statusConfig = getCoefficientStatusConfig(coefficient)

  // Summary text for collapsed state
  const summaryText = coefficient > 1.0
    ? `Коэффициент: ${formatCoefficient(coefficient)} (${impact.percentDisplay})`
    : `Коэффициент: ${formatCoefficient(coefficient)} (базовый)`

  // No warehouse selected state
  if (!warehouseId) {
    return (
      <Alert className="bg-blue-50 border-blue-200">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800 text-sm">
          Выберите склад для отображения коэффициента
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <TooltipProvider>
      <div className="bg-amber-50 rounded-lg p-3 border-l-4 border-l-amber-400">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="flex w-full justify-between p-0 h-auto hover:bg-transparent"
              disabled={isLoading || disabled}
            >
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-amber-600" />
                <span className="text-sm text-amber-900">{summaryText}</span>
              </div>
              <ChevronDown className={cn('h-4 w-4 text-amber-600 transition-transform', isOpen && 'rotate-180')} />
            </Button>
          </CollapsibleTrigger>

          <CollapsibleContent className="space-y-3 pt-3">
            {/* Coefficient display */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-lg">{formatCoefficient(coefficient)}</span>
                  <Badge
                    variant="outline"
                    className={cn('text-xs', statusConfig.bgColor, statusConfig.textColor, statusConfig.borderColor)}
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
                      Коэффициент логистики зависит от загруженности склада.
                      Более высокий коэффициент означает повышенную стоимость
                      доставки в периоды пиковой нагрузки.
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
            {normalizedCoefficients.length > 0 && (
              <div className="pt-2 border-t border-amber-200">
                <CoefficientCalendar coefficients={normalizedCoefficients} />
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
          </CollapsibleContent>
        </Collapsible>
      </div>
    </TooltipProvider>
  )
}
