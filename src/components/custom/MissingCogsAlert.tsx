'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, X, ArrowRight } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { ROUTES } from '@/lib/routes'

interface MissingCogsAlertProps {
  /** Total number of products without COGS */
  missingCount: number
  /** First 100 nm_ids without COGS (optional, for tooltip preview) */
  missingProducts?: string[]
  /** Callback when alert is dismissed (optional) */
  onDismiss?: () => void
  /** Additional CSS classes */
  className?: string
}

/**
 * Russian pluralization for "товар" (product)
 * Rules: 1 -> товар, 2-4 -> товара, 5-20 -> товаров, 21 -> товар, etc.
 */
export function pluralizeProduct(count: number): string {
  const abs = Math.abs(count) % 100
  const lastDigit = abs % 10

  // Special case: 11-14 always use "товаров"
  if (abs >= 11 && abs <= 14) return 'товаров'
  // Last digit 1: "товар"
  if (lastDigit === 1) return 'товар'
  // Last digits 2-4: "товара"
  if (lastDigit >= 2 && lastDigit <= 4) return 'товара'
  // Everything else: "товаров"
  return 'товаров'
}

/**
 * Alert banner displayed when products are missing COGS assignment.
 * Shows count badge with tooltip preview, and actionable link to COGS page.
 *
 * Story 42.3-FE: Missing COGS Alert Component
 * Epic 42-FE: Task Handlers Adaptation
 *
 * @see docs/stories/epic-42/story-42.3-fe-missing-cogs-alert.md
 */
export function MissingCogsAlert({
  missingCount,
  missingProducts = [],
  onDismiss,
  className,
}: MissingCogsAlertProps) {
  const [isDismissed, setIsDismissed] = useState(false)

  // Don't render if dismissed or no missing products
  if (isDismissed || !missingCount || missingCount <= 0) {
    return null
  }

  const handleDismiss = () => {
    setIsDismissed(true)
    onDismiss?.()
  }

  // Show first 5 products in tooltip, with "and X more" for the rest
  const displayProducts = missingProducts.slice(0, 5)
  const remainingInList = missingProducts.length - 5
  const showTotalNote = missingCount > missingProducts.length

  return (
    <Alert variant="warning" className={cn('relative', className)} role="alert">
      <AlertTriangle className="h-4 w-4" data-testid="alert-triangle-icon" />
      <AlertTitle className="flex items-center gap-2">
        Товары без себестоимости
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant="outline"
                className="cursor-help border-yellow-500 text-yellow-700 bg-yellow-100"
                tabIndex={0}
              >
                {missingCount} {pluralizeProduct(missingCount)}
              </Badge>
            </TooltipTrigger>
            <TooltipContent side="bottom" size="md">
              <p className="font-medium mb-1">Артикулы без себестоимости:</p>
              {displayProducts.length > 0 ? (
                <ul className="text-xs space-y-0.5">
                  {displayProducts.map(id => (
                    <li key={id}>• {id}</li>
                  ))}
                  {remainingInList > 0 && (
                    <li className="text-gray-400">и ещё {remainingInList}...</li>
                  )}
                </ul>
              ) : (
                <p className="text-xs text-gray-400">Список недоступен</p>
              )}
              {showTotalNote && (
                <p className="text-xs text-gray-400 mt-1 pt-1 border-t border-gray-600">
                  Всего: {missingCount} / показаны первые {missingProducts.length}
                </p>
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </AlertTitle>
      <AlertDescription className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <span>без назначенной себестоимости. Маржа не рассчитывается.</span>
        <Button
          asChild
          variant="outline"
          size="sm"
          className="whitespace-nowrap border-yellow-400 text-yellow-800 hover:bg-yellow-100"
        >
          <Link href={`${ROUTES.COGS.ROOT}?has_cogs=false`}>
            Назначить COGS
            <ArrowRight className="ml-1 h-3 w-3" />
          </Link>
        </Button>
      </AlertDescription>

      {/* Dismiss button - only show if onDismiss provided or always allow dismiss */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-8 w-8 min-h-[44px] min-w-[44px] text-yellow-700 hover:text-yellow-900 hover:bg-yellow-200"
        onClick={handleDismiss}
        aria-label="Закрыть уведомление"
      >
        <X className="h-4 w-4" />
      </Button>
    </Alert>
  )
}
