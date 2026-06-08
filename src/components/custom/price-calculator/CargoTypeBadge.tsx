'use client'

/**
 * CargoTypeBadge — displays MGT/SGT/KGT badge
 * Extracted from DimensionInputSection.tsx for file size compliance
 */

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { getCargoTypeConfig } from '@/lib/dimension-utils'
import type { CargoType } from '@/lib/dimension-types'

export function CargoTypeBadge({ cargoType }: { cargoType: CargoType }) {
  const config = getCargoTypeConfig(cargoType)
  return (
    <Badge variant="outline" className={cn('font-mono text-xs', config.bgColor, config.textColor)}>
      {config.label}
    </Badge>
  )
}
