'use client'

// ============================================================================
// Tariff Section Wrapper Component
// Epic 52-FE: Story 52-FE.2 - Tariff Settings Edit Form
// Collapsible section wrapper for tariff form sections
// ============================================================================

import { ChevronDown, ChevronRight, type LucideIcon } from 'lucide-react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'

interface TariffSectionWrapperProps {
  /** Section title (Russian) */
  title: string
  /** Optional icon component */
  icon?: LucideIcon
  /** Whether section is expanded */
  isOpen?: boolean
  /** Callback when toggle is clicked */
  onToggle?: () => void
  /** Child content */
  children: React.ReactNode
  /** Additional className */
  className?: string
}

/**
 * Collapsible section wrapper for tariff form sections
 *
 * Features:
 * - Chevron indicator for expand/collapse state
 * - Optional icon before title
 * - Smooth collapse animation
 * - Accessible keyboard navigation
 *
 * @example
 * ```tsx
 * <TariffSectionWrapper
 *   title="Приёмка"
 *   icon={Package}
 *   isOpen={openSections.acceptance}
 *   onToggle={() => toggleSection('acceptance')}
 * >
 *   <TariffFieldInput ... />
 * </TariffSectionWrapper>
 * ```
 */
export function TariffSectionWrapper({
  title,
  icon: Icon,
  isOpen = true,
  onToggle,
  children,
  className,
}: TariffSectionWrapperProps) {
  return (
    <Collapsible
      open={isOpen}
      onOpenChange={onToggle}
      className={cn('border rounded-lg', className)}
    >
      <CollapsibleTrigger className="flex w-full items-center justify-between p-4 hover:bg-muted/50 transition-colors rounded-t-lg">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
          <span className="font-medium">{title}</span>
        </div>
        {isOpen ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
      </CollapsibleTrigger>

      <CollapsibleContent className="px-4 pb-4 data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
        <div className="pt-2">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  )
}
