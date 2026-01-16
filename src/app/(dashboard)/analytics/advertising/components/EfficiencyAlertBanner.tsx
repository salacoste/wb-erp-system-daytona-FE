'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { XCircle, X } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  getAlertDismissState,
  setAlertDismissState,
  shouldShowLossAlert,
} from '@/lib/efficiency-utils'

interface EfficiencyAlertBannerProps {
  /** Number of items with "loss" efficiency status */
  lossCount: number
  /** Current filter parameters to preserve when navigating */
  currentParams?: {
    from?: string
    to?: string
    view?: string
    sort?: string
    order?: string
  }
}

/**
 * Russian pluralization helper for товар/товара/товаров
 */
function pluralize(count: number, one: string, few: string, many: string): string {
  const absCount = Math.abs(count)
  const lastTwo = absCount % 100
  const lastOne = absCount % 10

  if (lastTwo >= 11 && lastTwo <= 19) {
    return many
  }
  if (lastOne === 1) {
    return one
  }
  if (lastOne >= 2 && lastOne <= 4) {
    return few
  }
  return many
}

/**
 * Efficiency Alert Banner Component
 * Story 33.4-FE: Efficiency Status Indicators (AC4)
 * Epic 33: Advertising Analytics (Frontend)
 *
 * Features:
 * - Shows alert when there are items with "loss" status
 * - Dismissible with sessionStorage persistence
 * - Reappears if loss count increases after dismissal
 * - Links to filtered view with status=loss
 * - Accessible with role="alert" and proper ARIA labels (AC5)
 */
export function EfficiencyAlertBanner({
  lossCount,
  currentParams,
}: EfficiencyAlertBannerProps) {
  // Track if component is mounted (for SSR safety)
  const [isMounted, setIsMounted] = useState(false)
  // Track dismissed state locally to trigger re-renders
  const [isDismissed, setIsDismissed] = useState(false)

  // Initialize mount state
  useEffect(() => {
    setIsMounted(true)
    // Check initial dismiss state on mount
    const { dismissed, lossCount: storedCount } = getAlertDismissState()
    if (dismissed && storedCount !== null && lossCount <= storedCount) {
      setIsDismissed(true)
    }
  }, [lossCount])

  // Handle dismiss action
  const handleDismiss = () => {
    setAlertDismissState(lossCount)
    setIsDismissed(true)
  }

  // Build URL for filtered view preserving current params
  const buildFilterUrl = () => {
    const params = new URLSearchParams()
    if (currentParams?.from) params.set('from', currentParams.from)
    if (currentParams?.to) params.set('to', currentParams.to)
    if (currentParams?.view) params.set('view', currentParams.view)
    if (currentParams?.sort) params.set('sort', currentParams.sort)
    if (currentParams?.order) params.set('order', currentParams.order)
    params.set('status', 'loss')
    return `?${params.toString()}`
  }

  // Don't render during SSR or if no loss items
  if (!isMounted || lossCount === 0) {
    return null
  }

  // Check if should show based on dismiss state and loss count
  if (isDismissed && !shouldShowLossAlert(lossCount)) {
    return null
  }

  return (
    <Alert
      variant="destructive"
      role="alert"
      className="relative pr-12"
    >
      <XCircle className="h-4 w-4" aria-hidden="true" />
      <AlertTitle>Убыточные кампании</AlertTitle>
      <AlertDescription className="mt-1">
        <span>
          {lossCount} {pluralize(lossCount, 'товар', 'товара', 'товаров')} с отрицательной
          эффективностью рекламы (ROAS &lt; 1.0).
        </span>
        <Link
          href={buildFilterUrl()}
          className="ml-2 underline hover:no-underline font-medium"
        >
          Показать
        </Link>
      </AlertDescription>
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-6 w-6 hover:bg-red-200"
        onClick={handleDismiss}
        aria-label="Скрыть предупреждение"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </Button>
    </Alert>
  )
}
