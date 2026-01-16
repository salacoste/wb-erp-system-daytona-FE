"use client"

import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"

import { cn } from "@/lib/utils"

const TooltipProvider = TooltipPrimitive.Provider

const Tooltip = TooltipPrimitive.Root

const TooltipTrigger = TooltipPrimitive.Trigger

interface TooltipContentProps extends React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content> {
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
          zIndex: 9999,
          backgroundColor: '#1e293b',
          color: '#f1f5f9',
          fontSize: '12px',
          lineHeight: 1.4,
          padding: '8px 12px',
          borderRadius: '6px',
          maxWidth: maxWidthMap[size],
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        }}
        className={cn(
          "animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
          className
        )}
        {...props}
      >
        {children}
        <TooltipPrimitive.Arrow style={{ fill: '#1e293b' }} />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  )
})
TooltipContent.displayName = TooltipPrimitive.Content.displayName

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
