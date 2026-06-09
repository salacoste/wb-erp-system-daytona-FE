/**
 * SKU Table Section + Help Card
 * Extracted from page.tsx for file size compliance.
 */

import { SkuFinancialsTable } from '@/components/custom/SkuFinancialsTable'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { SkuFinancialItem } from '@/types/sku-financials'

interface SkuTableSectionProps {
  skuData: SkuFinancialItem[]
}

export function SkuTableSection({ skuData }: SkuTableSectionProps) {
  return (
    <>
      {/* SKU Financials Table - Epic 31 */}
      <Card>
        <CardHeader>
          <CardTitle>Маржинальность по товарам</CardTitle>
          <CardDescription>Сортировка по клику на заголовок столбца.</CardDescription>
        </CardHeader>
        <CardContent>
          {skuData.length > 0 ? (
            <SkuFinancialsTable data={skuData} showVisibility={true} showExpenseBreakdown={true} />
          ) : (
            <div className="rounded-lg border border-border bg-muted p-12 text-center">
              <p className="text-muted-foreground">Нет данных за выбранную неделю</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Help Section */}
      <HelpCard />
    </>
  )
}

/** Usage help card */
function HelpCard() {
  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="text-blue-900">Как использовать анализ</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-blue-900">
        <div>
          <strong>1. Выбор недели</strong>
          <p className="mt-1 text-blue-800">
            Используйте селектор недели для просмотра данных за разные периоды. По умолчанию
            показана текущая неделя.
          </p>
        </div>
        <div>
          <strong>2. Сортировка</strong>
          <p className="mt-1 text-blue-800">
            Кликните на заголовок столбца для сортировки. Повторный клик меняет порядок сортировки
            (возрастание/убывание). По умолчанию данные отсортированы по марже.
          </p>
        </div>
        <div>
          <strong>3. Цветовая индикация</strong>
          <p className="mt-1 text-blue-800">
            Зелёный цвет — прибыльные товары (положительная маржа). Красный цвет — убыточные товары
            (отрицательная маржа). Жёлтый фон — нет данных о себестоимости.
          </p>
        </div>
        <div>
          <strong>4. Назначение себестоимости</strong>
          <p className="mt-1 text-blue-800">
            Если у товара нет себестоимости, кликните на строку для перехода к назначению COGS.
            После назначения маржа будет рассчитана автоматически.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
