'use client'

/** Empty state for Shipments list page — Epic 76-FE, Story 76.1 (AC: #1) */

import { Truck, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { ROUTES } from '@/lib/routes'

interface ShipmentsEmptyStateProps {
  hasSkuPackaging: boolean
  onCreateClick: () => void
  canCreate?: boolean
}

export function ShipmentsEmptyState({
  hasSkuPackaging,
  onCreateClick,
  canCreate = true,
}: ShipmentsEmptyStateProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Truck className="h-8 w-8 text-muted-foreground" />
        </div>

        <h3 className="text-lg font-semibold mb-2">Нет отправок</h3>

        <p className="text-sm text-muted-foreground mb-4 max-w-md">
          Создайте первую отправку для расчёта стоимости доставки
        </p>

        {!hasSkuPackaging && (
          <p className="text-sm text-muted-foreground mb-4">
            <Link href={ROUTES.SHIPMENTS.SKU_PACKAGING} className="text-primary underline">
              Сначала настройте упаковку товаров
            </Link>
          </p>
        )}

        {canCreate && (
          <Button onClick={onCreateClick} disabled={!hasSkuPackaging}>
            <Plus className="h-4 w-4 mr-2" />
            Создать отправку
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
