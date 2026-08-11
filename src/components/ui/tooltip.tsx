'use client'

import * as React from 'react'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'

import { cn } from '@/lib/utils'

const TooltipProvider = TooltipPrimitive.Provider

const Tooltip = TooltipPrimitive.Root

const TooltipTrigger = TooltipPrimitive.Trigger

interface TooltipContentProps extends React.ComponentPropsWithoutRef<
  typeof TooltipPrimitive.Content
> {
  /**
   * Size variant for tooltip width
   * - 'sm': 180px (default, compact tooltips)
   * - 'md': 280px (medium descriptions)
   * - 'lg': 350px (detailed explanations)
   */
  size?: 'sm' | 'md' | 'lg'
}

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  TooltipContentProps
>(({ className, sideOffset = 4, size = 'sm', children, ...props }, ref) => {
  const maxWidthMap = {
    sm: '180px',
    md: '280px',
    lg: '350px',
  }

  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        style={{
          maxWidth: maxWidthMap[size],
        }}
        className={cn(
          'z-[9999] animate-in rounded-md bg-popover px-3 py-2 text-xs leading-[1.4] text-popover-foreground shadow-md fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 motion-reduce:animate-none',
          className
        )}
        {...props}
      >
        {children}
        <TooltipPrimitive.Arrow className="fill-popover" />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  )
})
TooltipContent.displayName = TooltipPrimitive.Content.displayName

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
