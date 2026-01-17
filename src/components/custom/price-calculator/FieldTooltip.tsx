'use client'

import { useState } from 'react'
import { HelpCircle } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'

/**
 * Props for FieldTooltip component
 */
export interface FieldTooltipProps {
  /** Tooltip content to display */
  content: string
  /** Optional custom icon component */
  icon?: React.ReactNode
}

/**
 * Helper tooltip component for form fields
 * Provides contextual help information for input fields
 *
 * @example
 * <FieldTooltip content="Cost of goods sold - what you paid to acquire the item" />
 */
export function FieldTooltip({ content, icon }: FieldTooltipProps) {
  const [open, setOpen] = useState(false)

  return (
    <TooltipProvider>
      <Tooltip open={open} onOpenChange={setOpen}>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground"
            onClick={() => setOpen(!open)}
          >
            {icon || <HelpCircle className="h-4 w-4" />}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-xs">
          <p>{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
