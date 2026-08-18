'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

/** "How to read the chart" help card for margin trend analysis */
export function ChartHelpCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Как читать график</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <div>
          <p className="font-semibold text-foreground mb-1">Ось X (горизонтальная):</p>
          <p>Недели в формате ISO (например, W47 = 47-я неделя года)</p>
        </div>
        <div>
          <p className="font-semibold text-foreground mb-1">Ось Y (вертикальная):</p>
          <p>
            Процент маржи. Формула:{' '}
            <code className="bg-muted px-1 rounded">((Выручка - COGS) / Выручка) × 100%</code>
          </p>
        </div>
        <div>
          <p className="font-semibold text-foreground mb-1">Цветовые обозначения:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>
              <span className="text-financial-positive font-semibold">Зелёные точки</span> —
              положительная маржа (прибыль)
            </li>
            <li>
              <span className="text-financial-negative font-semibold">Красные точки</span> —
              отрицательная маржа (убыток)
            </li>
            <li>
              <span className="text-muted-foreground font-semibold">Серые точки</span> — нулевая
              маржа (безубыточность)
            </li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-foreground mb-1">Интерактивность:</p>
          <p>
            Наведите курсор на точку графика, чтобы увидеть подробные метрики: маржа, выручка,
            прибыль, количество проданных единиц.
          </p>
        </div>
        <div>
          <p className="font-semibold text-foreground mb-1">Статистика:</p>
          <p>
            Под графиком отображается сводная информация: количество недель, средняя маржа,
            максимальная и минимальная маржа за период.
          </p>
        </div>
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground">
            <strong>Примечание:</strong> Для расчёта маржи необходимы данные о себестоимости (COGS).
            Недели без COGS данных будут отмечены предупреждением в подсказке.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
