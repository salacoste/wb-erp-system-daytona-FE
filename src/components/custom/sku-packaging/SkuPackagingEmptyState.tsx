'use client'

/** Empty state for SKU Packaging page — Epic 75-FE, Story 75.3 (AC: #1, #2) */

import { Package, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { ROUTES } from '@/lib/routes'

interface SkuPackagingEmptyStateProps {
  hasBoxTypes: boolean
  onCreateClick: (trigger: HTMLButtonElement) => void
}

export function SkuPackagingEmptyState({
  hasBoxTypes,
  onCreateClick,
}: SkuPackagingEmptyStateProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Package className="h-8 w-8 text-muted-foreground" />
        </div>

        <h3 className="text-lg font-semibold mb-2">Нет привязок упаковки</h3>

        <p className="text-sm text-muted-foreground mb-4 max-w-md">
          Привяжите товары к типам коробок для расчёта стоимости доставки
        </p>

        {!hasBoxTypes && (
          <p className="text-sm text-muted-foreground mb-4">
            <Link href={ROUTES.SHIPMENTS.BOX_TYPES} className="text-primary underline">
              Сначала добавьте типы коробок
            </Link>
          </p>
        )}

        <Button onClick={event => onCreateClick(event.currentTarget)} disabled={!hasBoxTypes}>
          <Plus className="h-4 w-4 mr-2" />
          Добавить упаковку
        </Button>
      </CardContent>
    </Card>
  )
}
