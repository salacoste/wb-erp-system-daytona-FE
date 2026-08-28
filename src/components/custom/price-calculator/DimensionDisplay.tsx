'use client'

/**
 * Dimension display sub-components
 * Extracted from DimensionInputSection.tsx for file size compliance
 */

import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getCargoTypeConfig, formatVolume, type CargoType } from '@/lib/dimension-utils'

export function CargoTypeBadge({ cargoType }: { cargoType: CargoType }) {
  const config = getCargoTypeConfig(cargoType)
  return (
    <Badge variant="outline" className={cn('font-mono text-xs', config.bgColor, config.textColor)}>
      {config.label}
    </Badge>
  )
}

export function DimensionSummary({
  cargoType,
  volumeLiters,
  maxDimension,
  volumeTier,
  isKgt,
}: {
  cargoType: CargoType | null
  volumeLiters: number
  maxDimension: number
  volumeTier: { tier: string; label: string; color: string }
  isKgt: boolean
}) {
  const cargoConfig = cargoType ? getCargoTypeConfig(cargoType) : null
  const hasDimensions = volumeLiters > 0

  return (
    <div className="space-y-2" aria-live="polite">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          {cargoType && <CargoTypeBadge cargoType={cargoType} />}
          <span className="text-foreground">Объём: {formatVolume(volumeLiters)}</span>
          {hasDimensions && volumeTier.tier !== 'standard' && (
            <Badge
              variant="outline"
              className={cn(
                'text-xs',
                volumeTier.color === 'green' && 'bg-status-success/10 text-status-success',
                volumeTier.color === 'orange' && 'bg-status-warning/10 text-status-warning'
              )}
            >
              {volumeTier.label}
            </Badge>
          )}
        </div>
      </div>

      {hasDimensions && cargoConfig && (
        <p className="text-xs text-muted-foreground">
          Макс. габарит: {maxDimension} см {!isKgt && `(≤ ${cargoConfig.maxDimension} см)`}
        </p>
      )}

      {isKgt && (
        <Alert variant="destructive" className="mt-3">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <p className="font-medium">Крупногабаритный груз (КГТ) требует ручного ввода тарифов</p>
            <p className="text-xs mt-1">
              Макс. габарит: {maxDimension} см (превышает лимит 120 см)
            </p>
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
