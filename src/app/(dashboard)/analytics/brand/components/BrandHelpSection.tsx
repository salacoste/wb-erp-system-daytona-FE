'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

/**
 * Help section for Brand margin analysis page.
 * Explains aggregation, drill-down, COGS coverage, and color indicators.
 */
export function BrandHelpSection() {
  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="text-blue-900">Как использовать анализ</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-blue-900">
        <div>
          <strong>1. Агрегация данных</strong>
          <p className="mt-1 text-blue-800">
            Все показатели суммируются по товарам каждого бренда. Средняя маржа рассчитывается как
            средневзвешенное значение.
          </p>
        </div>
        <div>
          <strong>2. Детализация</strong>
          <p className="mt-1 text-blue-800">
            Кликните на бренд для просмотра детализации по товарам (SKU). Это позволяет выявить
            наиболее и наименее прибыльные товары внутри бренда.
          </p>
        </div>
        <div>
          <strong>3. Столбец "Без COGS"</strong>
          <p className="mt-1 text-blue-800">
            Показывает количество товаров бренда без назначенной себестоимости. Эти товары не
            учитываются при расчёте маржи.
          </p>
        </div>
        <div>
          <strong>4. Цветовая индикация</strong>
          <p className="mt-1 text-blue-800">
            Зелёный — прибыльные бренды. Красный — убыточные бренды. Жёлтый фон — есть товары без
            себестоимости.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
