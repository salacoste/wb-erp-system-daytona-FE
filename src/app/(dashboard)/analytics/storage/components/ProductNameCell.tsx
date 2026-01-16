'use client'

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

/**
 * Product Name Cell with truncation and tooltip
 * Story 24.3-FE: Storage by SKU Table
 * UX Decision Q8: 45-50 chars truncation with tooltip (WB product names are long)
 */
interface ProductNameCellProps {
  name: string | null
  maxLength?: number
}

export function ProductNameCell({ name, maxLength = 45 }: ProductNameCellProps) {
  if (!name) {
    return <span className="text-muted-foreground">—</span>
  }

  const needsTruncation = name.length > maxLength
  const displayName = needsTruncation ? `${name.slice(0, maxLength)}...` : name

  if (!needsTruncation) {
    return <span className="text-sm">{displayName}</span>
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="text-sm cursor-help">{displayName}</span>
        </TooltipTrigger>
        <TooltipContent className="max-w-[400px]">
          <p>{name}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
