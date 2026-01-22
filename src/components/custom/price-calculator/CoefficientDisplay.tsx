'use client'

/**
 * CoefficientDisplay Component
 * Story 44.9-FE: Logistics Coefficients UI
 * Epic 44: Price Calculator UI (Frontend)
 *
 * Displays coefficient value with status badge and auto-fill indicator
 * Supports effective date display and tooltip explanation
 */

import { Info } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import {
  getCoefficientStatusConfig,
  formatCoefficient,
  formatCoefficientDate,
} from '@/lib/coefficient-utils'

export interface CoefficientDisplayProps {
  /** Normalized coefficient value (1.0, 1.25, etc.) */
  coefficient: number
  /** Source of the coefficient value */
  source: 'auto' | 'manual'
  /** Effective date in ISO format (YYYY-MM-DD) */
  effectiveDate?: string
  /** Additional CSS classes */
  className?: string
}

/**
 * Displays coefficient value with status badge and context information
 *
 * Status levels:
 * - base (≤1.00): "Базовый" (green)
 * - elevated (1.01-1.50): "Повышенный" (yellow)
 * - high (1.51-2.00): "Высокий" (orange)
 * - peak (>2.00): "Пиковый" (red)
 * - unavailable (≤0): "Недоступно" (gray)
 */
export function CoefficientDisplay({
  coefficient,
  source,
  effectiveDate,
  className,
}: CoefficientDisplayProps) {
  const statusConfig = getCoefficientStatusConfig(coefficient)
  const formattedCoefficient = formatCoefficient(coefficient)

  return (
    <TooltipProvider>
      <div className={cn('flex flex-col gap-1', className)}>
        {/* Main row: value, status badge, auto-fill badge, info icon */}
        <div className="flex items-center gap-2">
          {/* Coefficient value */}
          <span className="font-medium text-foreground">{formattedCoefficient}</span>

          {/* Status badge */}
          <Badge
            variant="outline"
            className={cn(statusConfig.bgColor, statusConfig.textColor, 'border-0')}
          >
            {statusConfig.label}
          </Badge>

          {/* Auto-fill badge */}
          <AutoFillSourceBadge source={source} />

          {/* Info tooltip */}
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-help inline-flex items-center">
                <Info className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              </span>
            </TooltipTrigger>
            <TooltipContent size="md">
              <p>
                Коэффициент логистики зависит от загруженности склада. Повышенный
                коэффициент увеличивает стоимость доставки.
              </p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Effective date row */}
        {effectiveDate && effectiveDate.length > 0 && (
          <span className="text-sm text-muted-foreground">
            Действует с: {formatCoefficientDate(effectiveDate)}
          </span>
        )}
      </div>
    </TooltipProvider>
  )
}

/**
 * Auto-fill source badge for coefficient fields
 * Shows "Автозаполнено" (auto) or "Вручную" (manual)
 */
function AutoFillSourceBadge({ source }: { source: 'auto' | 'manual' }) {
  const isAuto = source === 'auto'

  return (
    <Badge
      variant="outline"
      className={cn(
        'text-xs font-normal border-0',
        isAuto && 'bg-green-50 text-green-700',
        !isAuto && 'bg-yellow-50 text-yellow-700'
      )}
    >
      {isAuto ? 'Автозаполнено' : 'Вручную'}
    </Badge>
  )
}
