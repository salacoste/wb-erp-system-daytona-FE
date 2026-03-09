'use client'

/**
 * Компонент метки с тултипом
 * Отображает текст и маленькую иконку ? с пояснением
 */

import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'
import { HelpCircle } from 'lucide-react'
import { METRIC_EXPLANATIONS } from './metric-explanations'

export function LabelWithTooltip({
  label,
  tooltip,
  className = '',
}: {
  label: string
  tooltip?: string
  className?: string
}) {
  const explanation = tooltip || METRIC_EXPLANATIONS[label]

  if (!explanation) {
    return <span className={className}>{label}</span>
  }

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      {label}
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <HelpCircle className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600 cursor-help flex-shrink-0" />
          </TooltipTrigger>
          <TooltipContent size="lg" side="top">
            {explanation}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </span>
  )
}
