'use client'

import type { AriaRole, CSSProperties, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface ResponsiveChartFrameProps {
  children: ReactNode
  className?: string
  /** Accessible label for informational charts. If omitted, no image role is applied. */
  label?: string
  /** ID of the exact semantic data alternative describing the chart. */
  descriptionId?: string
  /** Override when a chart should use different semantics than the default informational image. */
  role?: AriaRole
  /** Override the default positive minimum height without coupling callers to wrapper internals. */
  minHeightClassName?: string
  style?: CSSProperties
}

/**
 * Positive-size frame for Recharts ResponsiveContainer.
 * Prevents width/height=-1 warnings when charts mount during responsive layout.
 * Sizing remains separate from chart semantics: callers may override role/min-height.
 */
export function ResponsiveChartFrame({
  children,
  className,
  label,
  descriptionId,
  role,
  minHeightClassName = 'min-h-[240px]',
  style,
}: ResponsiveChartFrameProps) {
  const resolvedRole = role ?? (label ? 'img' : undefined)

  return (
    <div
      role={resolvedRole}
      aria-label={label}
      aria-describedby={descriptionId}
      style={style}
      className={cn(
        'relative w-full [&_.recharts-responsive-container]:min-h-[inherit]',
        minHeightClassName,
        className
      )}
    >
      {children}
    </div>
  )
}
