'use client'

/**
 * Logistics coefficients collapsible section
 * Story 44.9-FE: Logistics Coefficients UI
 */

import { useState, useMemo } from 'react'
import { Info, ChevronDown, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { TooltipProvider } from '@/components/ui/tooltip'
import {
  formatCoefficient,
  calculateCoefficientImpact,
  normalizeCoefficients,
  type RawCoefficient,
} from '@/lib/coefficient-utils'
import { LogisticsCoefficientsContent } from './LogisticsCoefficientsContent'
import { cn } from '@/lib/utils'

interface LogisticsCoefficientsSectionProps {
  warehouseId: number | null
  coefficient: number
  source: 'auto' | 'manual'
  baseLogisticsCost: number
  rawCoefficients?: RawCoefficient[]
  effectiveDate?: string
  isLoading?: boolean
  disabled?: boolean
}

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

  const normalizedCoefficients = useMemo(() => {
    if (!rawCoefficients || rawCoefficients.length === 0) return undefined
    return normalizeCoefficients(rawCoefficients)
  }, [rawCoefficients])

  const impact = useMemo(
    () => calculateCoefficientImpact(baseLogisticsCost, coefficient),
    [baseLogisticsCost, coefficient]
  )

  const summaryText =
    coefficient > 1.0
      ? `Коэффициент: ${formatCoefficient(coefficient)} (${impact.percentDisplay})`
      : `Коэффициент: ${formatCoefficient(coefficient)} (базовый)`

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
              <ChevronDown
                className={cn(
                  'h-4 w-4 text-amber-600 transition-transform',
                  isOpen && 'rotate-180'
                )}
              />
            </Button>
          </CollapsibleTrigger>

          <CollapsibleContent className="space-y-3 pt-3">
            <LogisticsCoefficientsContent
              coefficient={coefficient}
              source={source}
              baseLogisticsCost={baseLogisticsCost}
              rawCoefficients={normalizedCoefficients}
              effectiveDate={effectiveDate}
              impact={impact}
            />
          </CollapsibleContent>
        </Collapsible>
      </div>
    </TooltipProvider>
  )
}
