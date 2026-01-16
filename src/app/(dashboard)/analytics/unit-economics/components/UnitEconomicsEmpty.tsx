'use client'

import { Package, Calendar } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

/**
 * Unit Economics Empty State
 * Story 5.2: Unit Economics Page Structure
 *
 * Displayed when no data is available for the selected week.
 * Provides guidance on data availability and week selection.
 */

interface UnitEconomicsEmptyProps {
  onSelectWeek?: () => void
}

export function UnitEconomicsEmpty({ onSelectWeek }: UnitEconomicsEmptyProps) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12">
        <div className="rounded-full bg-gray-100 p-4 mb-4">
          <Package className="h-8 w-8 text-gray-400" />
        </div>

        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Нет данных за выбранный период
        </h3>

        <p className="text-sm text-gray-500 text-center max-w-md mb-6">
          Данные юнит-экономики формируются на основе недельных отчётов WB.
          Выберите другую неделю или убедитесь, что отчёт за эту неделю загружен.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          {onSelectWeek && (
            <Button variant="outline" onClick={onSelectWeek}>
              <Calendar className="h-4 w-4 mr-2" />
              Выбрать неделю
            </Button>
          )}
        </div>

        {/* Additional hints */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg max-w-md">
          <h4 className="text-sm font-medium text-blue-900 mb-2">
            Как получить данные юнит-экономики?
          </h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>1. Загрузите недельный отчёт WB</li>
            <li>2. Укажите себестоимость (COGS) для товаров</li>
            <li>3. Данные будут доступны после обработки</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
