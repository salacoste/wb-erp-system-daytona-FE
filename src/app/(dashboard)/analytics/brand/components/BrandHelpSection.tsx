'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

/**
 * Help section for Brand margin analysis page.
 * Explains aggregation, drill-down, COGS coverage, and color indicators.
 */
export function BrandHelpSection() {
  return (
    /* Story 170.3: info-panel tokens (169.10) — status-information tint pair +
       foreground text; heading strength via font, not a darker blue shade. */
    <Card className="border-status-information/30 bg-status-information/15">
      <CardHeader>
        <CardTitle>Как использовать анализ</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-foreground">
        <div>
          <strong>1. Агрегация данных</strong>
          <p className="mt-1">
            Все показатели суммируются по товарам каждого бренда. Средняя маржа рассчитывается как
            средневзвешенное значение.
          </p>
        </div>
        <div>
          <strong>2. Детализация</strong>
          <p className="mt-1">
            Кликните на бренд для просмотра детализации по товарам (SKU). Это позволяет выявить
            наиболее и наименее прибыльные товары внутри бренда.
          </p>
        </div>
        <div>
          <strong>3. Столбец "Без COGS"</strong>
          <p className="mt-1">
            Показывает количество товаров бренда без назначенной себестоимости. Эти товары не
            учитываются при расчёте маржи.
          </p>
        </div>
        <div>
          <strong>4. Цветовая индикация</strong>
          <p className="mt-1">
            Зелёный — прибыльные бренды. Красный — убыточные бренды. Жёлтый фон — есть товары без
            себестоимости.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
