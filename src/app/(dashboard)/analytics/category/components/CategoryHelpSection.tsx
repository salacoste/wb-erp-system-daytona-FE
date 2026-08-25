'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

/**
 * Help section for Category margin analysis page.
 * Explains aggregation, drill-down, COGS coverage, color indicators, and strategic planning.
 */
export function CategoryHelpSection() {
  return (
    /* Story 170.5: info-panel tokens (169.10) — status-information tint pair +
       foreground text; heading strength via font, not a darker blue shade. */
    <Card className="border-status-information/30 bg-status-information/15">
      <CardHeader>
        <CardTitle>Как использовать анализ</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-foreground">
        <div>
          <strong>1. Агрегация данных</strong>
          <p className="mt-1">
            Все показатели суммируются по товарам каждой категории. Средняя маржа рассчитывается как
            средневзвешенное значение.
          </p>
        </div>
        <div>
          <strong>2. Детализация</strong>
          <p className="mt-1">
            Кликните на категорию для просмотра детализации по товарам (SKU). Это позволяет выявить
            наиболее и наименее прибыльные товары внутри категории.
          </p>
        </div>
        <div>
          <strong>3. Столбец "Без COGS"</strong>
          <p className="mt-1">
            Показывает количество товаров категории без назначенной себестоимости. Эти товары не
            учитываются при расчёте маржи.
          </p>
        </div>
        <div>
          <strong>4. Цветовая индикация</strong>
          <p className="mt-1">
            Зелёный — прибыльные категории. Красный — убыточные категории. Жёлтый фон — есть товары
            без себестоимости.
          </p>
        </div>
        <div>
          <strong>5. Стратегическое планирование</strong>
          <p className="mt-1">
            Используйте этот анализ для принятия стратегических решений: фокус на прибыльных
            категориях, оптимизация ассортимента, корректировка ценообразования.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
