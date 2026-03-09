'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

/**
 * Help section for Category margin analysis page.
 * Explains aggregation, drill-down, COGS coverage, color indicators, and strategic planning.
 */
export function CategoryHelpSection() {
  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="text-blue-900">Как использовать анализ</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-blue-900">
        <div>
          <strong>1. Агрегация данных</strong>
          <p className="mt-1 text-blue-800">
            Все показатели суммируются по товарам каждой категории. Средняя маржа рассчитывается как
            средневзвешенное значение.
          </p>
        </div>
        <div>
          <strong>2. Детализация</strong>
          <p className="mt-1 text-blue-800">
            Кликните на категорию для просмотра детализации по товарам (SKU). Это позволяет выявить
            наиболее и наименее прибыльные товары внутри категории.
          </p>
        </div>
        <div>
          <strong>3. Столбец "Без COGS"</strong>
          <p className="mt-1 text-blue-800">
            Показывает количество товаров категории без назначенной себестоимости. Эти товары не
            учитываются при расчёте маржи.
          </p>
        </div>
        <div>
          <strong>4. Цветовая индикация</strong>
          <p className="mt-1 text-blue-800">
            Зелёный — прибыльные категории. Красный — убыточные категории. Жёлтый фон — есть товары
            без себестоимости.
          </p>
        </div>
        <div>
          <strong>5. Стратегическое планирование</strong>
          <p className="mt-1 text-blue-800">
            Используйте этот анализ для принятия стратегических решений: фокус на прибыльных
            категориях, оптимизация ассортимента, корректировка ценообразования.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
