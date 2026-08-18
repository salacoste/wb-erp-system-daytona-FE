/**
 * SKU Table Section + Help Card
 * Extracted from page.tsx for file size compliance.
 */

import { SkuFinancialsTable } from '@/components/custom/SkuFinancialsTable'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { SkuFinancialItem } from '@/types/sku-financials'

interface SkuTableSectionProps {
  skuData: SkuFinancialItem[]
  showHistoricalSpp: boolean
}

export function SkuTableSection({ skuData, showHistoricalSpp }: SkuTableSectionProps) {
  return (
    <>
      {/* SKU Financials Table - Epic 31 */}
      <Card>
        <CardHeader>
          <h2 className="sr-only">Детализация по товарам</h2>
          <CardTitle>Маржинальность по товарам</CardTitle>
          <CardDescription>Сортировка по клику на заголовок столбца.</CardDescription>
        </CardHeader>
        <CardContent>
          {skuData.length > 0 ? (
            <SkuFinancialsTable
              data={skuData}
              showVisibility={true}
              showExpenseBreakdown={true}
              showHistoricalSpp={showHistoricalSpp}
            />
          ) : (
            <div className="rounded-lg border border-border bg-muted/50 p-12 text-center">
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
    // 168.9: help card blue → status-information tints; body text muted for readability.
    <Card className="border-status-information/30 bg-status-information/10">
      <CardHeader>
        <CardTitle className="text-foreground">Как использовать анализ</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-foreground">
        <div>
          <strong>1. Выбор недели</strong>
          <p className="mt-1 text-muted-foreground">
            Используйте селектор недели для просмотра данных за разные периоды. По умолчанию
            показана текущая неделя.
          </p>
        </div>
        <div>
          <strong>2. Сортировка</strong>
          <p className="mt-1 text-muted-foreground">
            Кликните на заголовок столбца для сортировки. Повторный клик меняет порядок сортировки
            (возрастание/убывание). По умолчанию данные отсортированы по марже.
          </p>
        </div>
        <div>
          <strong>3. Цветовая индикация</strong>
          <p className="mt-1 text-muted-foreground">
            Зелёный цвет — прибыльные товары (положительная маржа). Красный цвет — убыточные товары
            (отрицательная маржа). Жёлтый фон — нет данных о себестоимости.
          </p>
        </div>
        <div>
          <strong>4. Назначение себестоимости</strong>
          <p className="mt-1 text-muted-foreground">
            Если у товара нет себестоимости, кликните на строку для перехода к назначению COGS.
            После назначения маржа будет рассчитана автоматически.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
