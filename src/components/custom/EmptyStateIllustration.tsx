/**
 * EmptyStateIllustration Component for Story 60.8-FE
 * Epic 60-FE: Dashboard & Analytics UX Improvements
 *
 * Reusable empty state component with icon, message, and secondary text.
 * @see docs/stories/epic-60/story-60.8-fe-improve-loading-states.md
 */

'use client'

import { FileQuestion, TrendingUp, BarChart3, LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export type EmptyStateType = 'trends' | 'expenses' | 'general'

export interface EmptyStateIllustrationProps {
  type?: EmptyStateType
  message?: string
  secondaryMessage?: string
  className?: string
  icon?: LucideIcon
}

const DEFAULT_CONFIG: Record<
  EmptyStateType,
  { icon: LucideIcon; message: string; secondary: string }
> = {
  trends: {
    icon: TrendingUp,
    message: 'Нет данных за этот период',
    secondary: 'Данные о трендах появятся после загрузки отчетов за несколько недель',
  },
  expenses: {
    icon: BarChart3,
    message: 'Нет данных за этот период',
    secondary: 'Данные о расходах появятся после загрузки финансовых отчетов',
  },
  general: {
    icon: FileQuestion,
    message: 'Нет данных за этот период',
    secondary: 'Выберите другой период или дождитесь обновления данных',
  },
}

export function EmptyStateIllustration({
  type = 'general',
  message,
  secondaryMessage,
  className,
  icon: CustomIcon,
}: EmptyStateIllustrationProps): React.ReactElement {
  const config = DEFAULT_CONFIG[type]
  const Icon = CustomIcon || config.icon
  const displayMessage = message || config.message
  const displaySecondary = secondaryMessage || config.secondary

  return (
    <div className={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
      {/* Icon with subtle background */}
      <div className="mb-4 rounded-full bg-muted/50 p-4">
        <Icon className="h-12 w-12 text-muted-foreground/30" aria-hidden="true" />
      </div>

      {/* Primary message */}
      <h3 className="text-lg font-medium text-foreground mb-2">{displayMessage}</h3>

      {/* Secondary message */}
      <p className="text-sm text-muted-foreground max-w-xs">{displaySecondary}</p>
    </div>
  )
}
