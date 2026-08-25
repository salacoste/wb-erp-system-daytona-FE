'use client'

import React from 'react'
import { AlertTriangle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { formatCurrency } from '../utils/formatters'

/**
 * Render organic sales value with over-attribution warning if negative
 * Story 73.6: Negative organicSales over-attribution warning
 *
 * Extracted from MergedGroupRows.tsx for file size compliance.
 */
export function renderOrganicValue(value: number): React.ReactNode {
  if (value >= 0) return formatCurrency(value)
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center gap-1 cursor-help">
            <AlertTriangle className="h-3.5 w-3.5 text-status-warning" />
            <Badge variant="outline" className="text-[0.7rem] border-status-warning/50 text-status-warning">
              Переатрибуция
            </Badge>
          </span>
        </TooltipTrigger>
        <TooltipContent side="left" className="text-xs">
          Рекламная выручка превышает общие продажи ({formatCurrency(value)})
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
