/**
 * PnLSectionHeader Component
 *
 * Section header with title, description, and formula tooltip.
 * Extracted from PnLWaterfall.tsx — pure structural refactor.
 */

'use client'

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Calculator } from 'lucide-react'

interface SectionHeaderProps {
  title: string
  description?: string
  formula?: string
}

export const SectionHeader = ({ title, description, formula }: SectionHeaderProps) => (
  <div className="border-b-2 border-border pb-2 mb-3">
    <div className="flex items-center gap-2">
      <h4 className="font-bold text-foreground text-base">{title}</h4>
      {formula && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button type="button" className="inline-flex">
              <Calculator className="h-4 w-4 text-primary hover:text-primary/80" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-md">
            <p className="font-medium mb-1">Формула расчёта</p>
            <p className="font-mono text-xs bg-muted px-2 py-1 rounded whitespace-pre-wrap">
              {formula}
            </p>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
    {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
  </div>
)
