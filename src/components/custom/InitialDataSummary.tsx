/**
 * Initial Data Summary Component - REFACTORED
 * Story 60.5-FE: Remove Data Duplication
 * Epic 60-FE: Dashboard & Analytics UX Improvements
 *
 * SIMPLIFIED: Only shows conditional CTA card for COGS assignment.
 * - NO financial metrics (moved to main dashboard grid)
 * - NO product count (moved to main dashboard grid)
 * - Success toast handled via useDataImportNotification hook
 *
 * @see docs/stories/epic-60/story-60.5-fe-remove-data-duplication.md
 */

'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/lib/routes'
import { ArrowRight } from 'lucide-react'

export interface InitialDataSummaryProps {
  /** COGS coverage percentage (0-100) */
  cogsCoverage?: number
  /** Total products in cabinet */
  totalProducts?: number
  /** Products with COGS assigned */
  productsWithCogs?: number
}

/**
 * Simplified InitialDataSummary - CTA card only
 * Returns null when COGS coverage = 100% or no products
 */
export function InitialDataSummary({
  cogsCoverage = 0,
  totalProducts = 0,
  productsWithCogs = 0,
}: InitialDataSummaryProps): React.ReactElement | null {
  const router = useRouter()

  // Don't show CTA if no products or full COGS coverage
  const showCta = totalProducts > 0 && cogsCoverage < 100

  if (!showCta) {
    return null
  }

  const productsWithoutCogs = totalProducts - productsWithCogs
  const formattedCount = new Intl.NumberFormat('ru-RU').format(productsWithoutCogs)

  return (
    <Card data-testid="initial-data-summary-cta">
      <CardHeader>
        <CardTitle>Следующий шаг</CardTitle>
        <CardDescription>
          Назначьте себестоимость для {formattedCount} товаров для анализа маржинальности
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={() => router.push(ROUTES.COGS.ROOT)} className="flex items-center gap-2">
          Назначить COGS
          <ArrowRight className="h-4 w-4" />
        </Button>
        <p className="text-sm text-muted-foreground mt-4">
          После назначения COGS вы сможете видеть анализ маржинальности по товарам, брендам и
          категориям.
        </p>
      </CardContent>
    </Card>
  )
}
