'use client'

import { Droplets, FileQuestion } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

/**
 * Empty state when no liquidity data is available
 * Story 7.2: Liquidity Page Structure
 */
export function LiquidityEmpty() {
  return (
    <Card className="border-dashed">
      <CardContent className="py-16">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="relative mb-4">
            <Droplets className="h-16 w-16 text-muted-foreground/30" />
            <FileQuestion className="absolute -bottom-1 -right-1 h-8 w-8 text-muted-foreground/50" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Нет данных о ликвидности</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            Для анализа ликвидности необходимы данные о продажах и остатках товаров.
            Убедитесь, что данные загружены и обработаны.
          </p>
          <div className="mt-6 space-y-2 text-sm text-muted-foreground">
            <p>Возможные причины:</p>
            <ul className="list-disc list-inside text-left">
              <li>Нет данных о продажах за последние 30 дней</li>
              <li>Нет данных об остатках на складах</li>
              <li>Не назначена себестоимость (COGS) товаров</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
