'use client'

import { Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { ROUTES } from '@/lib/routes'

/**
 * Empty State for Supply Planning Page
 * Story 6.2: Page Structure & Risk Dashboard
 * UX Specs by Sally (2025-12-12)
 *
 * Shown when there's no stock data available.
 */

export function SupplyPlanningEmpty() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        {/* Icon */}
        <div className="mb-6 rounded-full bg-gray-100 p-4">
          <Package className="h-16 w-16 text-gray-400" />
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Нет данных об остатках
        </h3>

        {/* Message */}
        <p className="text-sm text-muted-foreground mb-6 max-w-md">
          Подключите импорт остатков из Wildberries для анализа рисков стокаута
          и получения рекомендаций по заказам.
        </p>

        {/* CTA */}
        <Button asChild>
          <Link href={ROUTES.SETTINGS.ROOT}>
            Настроить импорт
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
