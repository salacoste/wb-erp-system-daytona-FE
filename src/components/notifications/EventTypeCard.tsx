// ============================================================================
// Event Type Card Component
// Epic 34-FE: Story 34.3-FE - Notification Preferences Panel
// ============================================================================

import { cn } from '@/lib/utils'
import { Switch } from '@/components/ui/switch'
import { useId } from 'react'
import type { MouseEvent } from 'react'

const INTERACTIVE_SELECTOR =
  'a[href], button, input, select, textarea, label, [role="button"], [role="switch"], [contenteditable="true"]'

/**
 * Props for EventTypeCard component
 * Story 34.3-FE: AC1 - Event Type Cards with Q6 Border Highlight
 */
interface EventTypeCardProps {
  title: string
  description: string
  enabled: boolean
  onToggle: () => void
  children?: React.ReactNode // For conditional time picker (daily digest)
}

/**
 * EventTypeCard - Reusable card for each notification event type
 *
 * Features:
 * - 2px Telegram Blue border when enabled, 1px Gray 300 when disabled (Q6)
 * - Checkmark/checkbox icons for enabled/disabled states
 * - Description text always visible with 2-line truncation (Q7)
 * - Click anywhere on card to toggle
 * - shadcn/ui Switch component
 *
 * @example
 * ```tsx
 * <EventTypeCard
 *   title="Задача выполнена успешно"
 *   description="Уведомления при завершении импорта, синхронизации, расчёта маржи"
 *   enabled={true}
 *   onToggle={() => toggleEventType('task_completed')}
 * />
 * ```
 */
export function EventTypeCard({
  title,
  description,
  enabled,
  onToggle,
  children,
}: EventTypeCardProps) {
  const titleId = useId()
  const descriptionId = useId()

  const handleCardClick = (event: MouseEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest(INTERACTIVE_SELECTOR)) return
    onToggle()
  }

  return (
    <div
      onClick={handleCardClick}
      className={cn(
        'relative cursor-pointer rounded-lg p-5 transition-all',
        'hover:shadow-md',
        enabled ? 'border-2 border-telegram bg-card shadow-sm' : 'border border-border bg-card'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Icon + Title + Description */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {/* AC1: Checkmark (enabled) / Empty checkbox (disabled) icons */}
            <span className="text-xl" aria-hidden="true">
              {enabled ? '☑️' : '☐'}
            </span>
            <h4 id={titleId} className="text-base font-medium text-foreground">
              {title}
            </h4>
          </div>

          {/* AC2: Description text always visible with 2-line truncation (Q7) */}
          <p id={descriptionId} className="line-clamp-2 text-sm text-muted-foreground">
            {description}
          </p>
        </div>

        {/* AC1: Toggle Switch (shadcn/ui) */}
        <Switch
          checked={enabled}
          onCheckedChange={onToggle}
          onClick={e => e.stopPropagation()} // Prevent double-toggle
          className={cn(
            'data-[state=checked]:bg-telegram',
            'data-[state=unchecked]:bg-muted-foreground/40'
          )}
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
        />
      </div>

      {/* AC4: Conditional Content (e.g., time picker for daily digest) */}
      {children}
    </div>
  )
}
