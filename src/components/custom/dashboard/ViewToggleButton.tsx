/**
 * ViewToggleButton — extracted from OrdersStatusBreakdown.tsx for file-size compliance.
 */

'use client'

import { cn } from '@/lib/utils'

interface ViewToggleButtonProps {
  active: boolean
  onClick: () => void
  label: string
  icon: React.ReactNode
  isLast?: boolean
}

export function ViewToggleButton({ active, onClick, label, icon, isLast }: ViewToggleButtonProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1 px-2 py-1 text-xs font-medium transition-colors',
        isLast ? 'rounded-r-md' : 'rounded-l-md',
        !isLast && '-mr-px',
        active ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:bg-muted'
      )}
    >
      {icon}
      <span className="sr-only md:not-sr-only">{label}</span>
    </button>
  )
}
