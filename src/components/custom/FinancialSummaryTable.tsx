/**
 * Financial Summary Table Component
 * Story 3.5: Financial Summary View
 *
 * Displays complete financial metrics organized by category:
 * - Revenue metrics
 * - Expense breakdown
 * - Payout summary
 * - Adjustments and compensations
 *
 * Supports comparison mode (two columns)
 */

import { FinanceSummary } from '@/hooks/useDashboard'
import { calculateChange } from '@/hooks/useFinancialSummary'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Package,
  AlertTriangle,
  Gem,
  ArrowDown,
  HelpCircle,
} from 'lucide-react'

/**
 * Словарь пояснений для каждого показателя
 * Используется в тултипах при наведении на иконку ?
 */
const METRIC_EXPLANATIONS: Record<string, string> = {
  // Доходы
  'Продажи (gross)':
    'Сумма, которую оплатили покупатели за товары. Это цена товара со скидкой WB (retail_price_with_discount). Включает продажи по основному отчёту и по выкупам (ЕАЭС).',
  'Возвраты (gross)':
    'Сумма возвращённых товаров по той же цене, что и при продаже. Уменьшает итоговую выручку.',
  'Продажи (розница)':
    'Выручка минус возвраты. Розничная стоимость проданных товаров, база для расчёта % расходов.',
  'К перечислению за товар':
    'Сумма к перечислению за товары ДО вычета операционных расходов (логистика, хранение и т.д.). Уже за вычетом комиссии WB.',
  'Выручка доставки продавца (DBS)':
    'Доход от платной доставки DBS/EDBS, когда покупатель оплачивает доставку отдельно. Входит в payout_total.',

  // Расходы WB
  'Комиссия WB (из оборота)':
    'Торговая комиссия Wildberries = разница между ценой покупателя и суммой продавцу. Формула: retail_price_with_discount − gross. Включает КВВ (комиссию по ставке), эквайринг и прочие удержания.',

  // Commission breakdown subcategories
  'Эквайринг (из комиссии)':
    'Комиссия за обработку платежей (банковские карты, SBP, QR-коды). Взимается с каждой транзакции, обычно 1-2% от суммы платежа. Это часть общей комиссии WB.',
  'Прочие комиссии (КВВ + SPP)':
    'Остаток комиссии после эквайринга. Включает: КВВ (комиссия по ставке категории, обычно 15-25%), компенсацию SPP-скидок (когда WB субсидирует скидку покупателю), участие в промо-акциях.',
  'Удержания WB (из к перечислению)':
    'Сумма всех операционных расходов, которые WB удерживает из "К перечислению за товар": логистика + хранение + приёмка + штрафы + сервисы + корректировки.',
  Логистика:
    'Стоимость доставки товаров покупателям и возврата на склад. Складывается из logistics_delivery + logistics_return.',
  Хранение: 'Плата за хранение товаров на складах WB. Начисляется ежедневно по тарифам склада.',
  'Платная приёмка': 'Плата за приёмку товаров на склад WB. Зависит от способа поставки и объёма.',
  Штрафы: 'Штрафы за нарушения: некорректная маркировка, брак, нарушение условий договора.',
  'Прочие удержания (WB сервисы)':
    'Удержания за сервисы WB: WB.Продвижение (реклама), Джем (подписка), утилизация и другие.',
  'WB.Продвижение':
    'Расходы на рекламу через сервис WB.Продвижение. Оплата за показы и клики в карточках товаров.',
  'Подписка Джем': 'Ежемесячная подписка на сервис Джем для получения приоритетов в продвижении.',
  'Прочие сервисы WB': 'Другие удержания: утилизация, фото-услуги, консультации и прочее.',
  'Корректировка ВВ':
    'Дополнительные корректировки комиссии WB с reason="Удержание". Например, корректировки по акциям или ошибкам.',
  'Комиссия лояльности': 'Комиссия за участие товаров в программе лояльности WB.',
  'Удержание баллов': 'Сумма, удержанная за начисленные покупателям баллы лояльности.',

  // Компенсации
  'Компенсация лояльности':
    'Компенсация от WB за скидки по программе лояльности. Это ДОХОД, увеличивает payout.',

  // Итого
  'Итого к оплате':
    'Финальная сумма к перечислению продавцу. Формула: К_перечислению_за_товар − Логистика − Хранение − Приёмка − Штрафы − Прочие_удержания − Корр.ВВ.',

  // COGS
  'Себестоимость (COGS)':
    'Cost of Goods Sold — закупочная стоимость проданных товаров. Вносится вручную для каждого артикула.',
  'Покрытие COGS':
    'Процент товаров, для которых указана себестоимость. При 100% можно рассчитать чистую прибыль.',
  'Товаров с COGS':
    'Количество артикулов с указанной себестоимостью / общее количество артикулов за период.',
  'Чистая прибыль':
    'Реальный заработок: Итого_к_оплате − Себестоимость. Показывается только при 100% покрытии COGS.',
}

/**
 * Компонент метки с тултипом
 * Отображает текст и маленькую иконку ? с пояснением
 */
function LabelWithTooltip({
  label,
  tooltip,
  className = '',
}: {
  label: string
  tooltip?: string
  className?: string
}) {
  const explanation = tooltip || METRIC_EXPLANATIONS[label]

  if (!explanation) {
    return <span className={className}>{label}</span>
  }

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      {label}
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <HelpCircle className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600 cursor-help flex-shrink-0" />
          </TooltipTrigger>
          <TooltipContent size="lg" side="top">
            {explanation}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </span>
  )
}

interface FinancialSummaryTableProps {
  /**
   * Primary week summary data
   */
  summary: FinanceSummary

  /**
   * Comparison week summary data (optional)
   */
  comparisonSummary?: FinanceSummary

  /**
   * Custom class name
   */
  className?: string
}

/**
 * Format currency value
 */
function formatCurrency(value: number | undefined | null): string {
  if (value === undefined || value === null) return '—'

  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

/**
 * Format change value with trend indicator
 * Request #41: Added isNegativeMetric prop - for returns, decrease is good (green)
 */
function ChangeIndicator({
  current,
  previous,
  isNegativeMetric = false,
}: {
  current?: number | null
  previous?: number | null
  isNegativeMetric?: boolean
}) {
  if (current === undefined || current === null || previous === undefined || previous === null) {
    return <span className="text-gray-400">—</span>
  }

  const change = calculateChange(current, previous)

  if (change.value === null || change.percentage === null) {
    return <span className="text-gray-400">—</span>
  }

  const Icon = change.trend === 'up' ? TrendingUp : change.trend === 'down' ? TrendingDown : Minus

  // For negative metrics (like returns), inverted colors: up=red, down=green
  const color = isNegativeMetric
    ? change.trend === 'up'
      ? 'text-red-600'
      : change.trend === 'down'
        ? 'text-green-600'
        : 'text-gray-500'
    : change.trend === 'up'
      ? 'text-green-600'
      : change.trend === 'down'
        ? 'text-red-600'
        : 'text-gray-500'

  return (
    <div className={`flex items-center gap-1 ${color} text-sm`}>
      <Icon className="h-4 w-4" />
      <span>
        {change.percentage > 0 ? '+' : ''}
        {change.percentage.toFixed(1)}%
      </span>
    </div>
  )
}

export function FinancialSummaryTable({
  summary,
  comparisonSummary,
  className,
}: FinancialSummaryTableProps) {
  const isComparison = !!comparisonSummary

  /**
   * Metric row with optional comparison
   * Request #41: Added isNegative prop for returns display
   * Updated: Added tooltip support via LabelWithTooltip
   */
  const MetricRow = ({
    label,
    value,
    comparisonValue,
    highlight = false,
    isNegative = false,
  }: {
    label: string
    value?: number | null
    comparisonValue?: number | null
    highlight?: boolean
    isNegative?: boolean
  }) => (
    <TableRow className={highlight ? 'bg-blue-50 font-semibold' : ''}>
      <TableCell className="font-medium">
        <LabelWithTooltip label={label} />
      </TableCell>
      <TableCell className={`text-right ${isNegative ? 'text-red-600' : ''}`}>
        {isNegative && value ? `−${formatCurrency(value).replace('−', '')}` : formatCurrency(value)}
      </TableCell>
      {isComparison && (
        <>
          <TableCell className={`text-right ${isNegative ? 'text-red-600' : ''}`}>
            {isNegative && comparisonValue
              ? `−${formatCurrency(comparisonValue).replace('−', '')}`
              : formatCurrency(comparisonValue)}
          </TableCell>
          <TableCell className="text-right">
            <ChangeIndicator
              current={value}
              previous={comparisonValue}
              isNegativeMetric={isNegative}
            />
          </TableCell>
        </>
      )}
    </TableRow>
  )

  return (
    <div className={`space-y-6 ${className || ''}`}>
      {/* Revenue Section */}
      <Card>
        <CardHeader>
          <CardTitle>Доходы</CardTitle>
          <CardDescription>Выручка и начисления от Wildberries</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">Показатель</TableHead>
                <TableHead className="text-right">Значение</TableHead>
                {isComparison && (
                  <>
                    <TableHead className="text-right">Сравнение</TableHead>
                    <TableHead className="text-right">Изменение</TableHead>
                  </>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Request #41: Separate sales and returns tracking */}
              <MetricRow
                label="Продажи (gross)"
                value={summary.sales_gross_total ?? summary.sales_gross}
                comparisonValue={
                  comparisonSummary?.sales_gross_total ?? comparisonSummary?.sales_gross
                }
              />
              <MetricRow
                label="Возвраты (gross)"
                value={summary.returns_gross_total ?? summary.returns_gross}
                comparisonValue={
                  comparisonSummary?.returns_gross_total ?? comparisonSummary?.returns_gross
                }
                isNegative
              />
              <MetricRow
                label="Продажи (розница)"
                value={summary.sale_gross_total ?? summary.sale_gross}
                comparisonValue={
                  comparisonSummary?.sale_gross_total ?? comparisonSummary?.sale_gross
                }
                highlight
              />
              <MetricRow
                label="К перечислению за товар"
                value={summary.to_pay_goods_total ?? summary.to_pay_goods}
                comparisonValue={
                  comparisonSummary?.to_pay_goods_total ?? comparisonSummary?.to_pay_goods
                }
                highlight
              />
              <MetricRow
                label="Выручка доставки продавца (DBS)"
                value={summary.seller_delivery_revenue_total ?? summary.seller_delivery_revenue}
                comparisonValue={
                  comparisonSummary?.seller_delivery_revenue_total ??
                  comparisonSummary?.seller_delivery_revenue
                }
              />
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Sales Funnel Section - Request #02: Money flow visualization */}
      {/* Only show when retail_price_total is available (Request #58) */}
      {(summary.retail_price_total_total || summary.retail_price_total) && (
        <Card className="border-2 border-indigo-300">
          <CardHeader className="bg-indigo-50">
            <CardTitle className="text-indigo-900">💰 Воронка продаж</CardTitle>
            <CardDescription className="text-indigo-700">
              Путь денег от вашей цены до прибыли
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {/* Level 1: Your Price */}
              {(() => {
                const retailPrice =
                  summary.retail_price_total_total ?? summary.retail_price_total ?? 0
                const salesGross = summary.sales_gross_total ?? summary.sales_gross ?? 0
                const saleGross = summary.sale_gross_total ?? summary.sale_gross ?? 0
                const payoutTotal = summary.payout_total ?? 0
                const grossProfit = summary.gross_profit ?? null

                // Calculate WB discount
                const wbDiscount = retailPrice - salesGross
                const wbDiscountPct = retailPrice > 0 ? (wbDiscount / retailPrice) * 100 : 0

                // Calculate returns
                const returnsGross = summary.returns_gross_total ?? summary.returns_gross ?? 0
                const returnsPct = salesGross > 0 ? (returnsGross / salesGross) * 100 : 0

                // Calculate WB deductions (delta between turnover and payout)
                const wbDeductions = saleGross - payoutTotal
                const wbDeductionsPct = saleGross > 0 ? (wbDeductions / saleGross) * 100 : 0

                // Comparison values
                const compRetailPrice =
                  comparisonSummary?.retail_price_total_total ??
                  comparisonSummary?.retail_price_total ??
                  0
                const compSalesGross =
                  comparisonSummary?.sales_gross_total ?? comparisonSummary?.sales_gross ?? 0
                const compSaleGross =
                  comparisonSummary?.sale_gross_total ?? comparisonSummary?.sale_gross ?? 0

                return (
                  <>
                    {/* Your Price */}
                    <div className="p-4 bg-indigo-100 rounded-lg">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-semibold text-indigo-900">ВАША ЦЕНА</div>
                          <div className="text-sm text-indigo-600">Цена до скидок WB</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-indigo-900">
                            {formatCurrency(retailPrice)}
                          </div>
                          <div className="text-sm text-indigo-600">100%</div>
                        </div>
                      </div>
                      {isComparison && compRetailPrice > 0 && (
                        <div className="mt-2 text-sm text-indigo-600">
                          Сравнение: {formatCurrency(compRetailPrice)}
                        </div>
                      )}
                    </div>

                    {/* WB Discount Arrow */}
                    <div className="flex items-center justify-center gap-2 text-orange-600">
                      <ArrowDown className="h-5 w-5" />
                      <span className="text-sm">
                        Скидка WB (СПП, акции): −{formatCurrency(wbDiscount)} (
                        {wbDiscountPct.toFixed(1)}%)
                      </span>
                    </div>

                    {/* Customer Paid */}
                    <div className="p-4 bg-blue-100 rounded-lg">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-semibold text-blue-900">Оплатили покупатели</div>
                          <div className="text-sm text-blue-600">После скидок WB</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-blue-900">
                            {formatCurrency(salesGross)}
                          </div>
                          <div className="text-sm text-blue-600">
                            {retailPrice > 0 ? ((salesGross / retailPrice) * 100).toFixed(0) : 0}%
                            от вашей цены
                          </div>
                        </div>
                      </div>
                      {isComparison && compSalesGross > 0 && (
                        <div className="mt-2 text-sm text-blue-600">
                          Сравнение: {formatCurrency(compSalesGross)}
                        </div>
                      )}
                    </div>

                    {/* Returns Arrow */}
                    {returnsGross > 0 && (
                      <div className="flex items-center justify-center gap-2 text-red-600">
                        <ArrowDown className="h-5 w-5" />
                        <span className="text-sm">
                          Возвраты: −{formatCurrency(returnsGross)} ({returnsPct.toFixed(1)}%)
                        </span>
                      </div>
                    )}

                    {/* Net Turnover */}
                    <div className="p-4 bg-cyan-100 rounded-lg">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-semibold text-cyan-900">Оборот (нетто)</div>
                          <div className="text-sm text-cyan-600">После возвратов</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-cyan-900">
                            {formatCurrency(saleGross)}
                          </div>
                          <div className="text-sm text-cyan-600">
                            {retailPrice > 0 ? ((saleGross / retailPrice) * 100).toFixed(0) : 0}% от
                            вашей цены
                          </div>
                        </div>
                      </div>
                      {isComparison && compSaleGross > 0 && (
                        <div className="mt-2 text-sm text-cyan-600">
                          Сравнение: {formatCurrency(compSaleGross)}
                        </div>
                      )}
                    </div>

                    {/* WB Deductions Arrow */}
                    <div className="flex items-center justify-center gap-2 text-gray-600">
                      <ArrowDown className="h-5 w-5" />
                      <span className="text-sm">
                        Удержания WB: −{formatCurrency(wbDeductions)} ({wbDeductionsPct.toFixed(1)}%
                        от оборота)
                      </span>
                    </div>

                    {/* Payout */}
                    <div className="p-4 bg-green-100 rounded-lg">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-semibold text-green-900">На счёт</div>
                          <div className="text-sm text-green-600">К перечислению от WB</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-green-900">
                            {formatCurrency(payoutTotal)}
                          </div>
                          <div className="text-sm text-green-600">
                            {retailPrice > 0 ? ((payoutTotal / retailPrice) * 100).toFixed(0) : 0}%
                            от вашей цены
                          </div>
                        </div>
                      </div>
                      {isComparison && comparisonSummary?.payout_total && (
                        <div className="mt-2 text-sm text-green-600">
                          Сравнение: {formatCurrency(comparisonSummary.payout_total)}
                        </div>
                      )}
                    </div>

                    {/* Profit (only if COGS available) */}
                    {grossProfit !== null && (
                      <>
                        <div className="flex items-center justify-center gap-2 text-amber-600">
                          <ArrowDown className="h-5 w-5" />
                          <span className="text-sm">
                            Себестоимость (COGS): −{formatCurrency(summary.cogs_total ?? 0)}
                          </span>
                        </div>

                        <div className="p-4 bg-emerald-100 rounded-lg border-2 border-emerald-400">
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="font-semibold text-emerald-900">✅ Прибыль</div>
                              <div className="text-sm text-emerald-600">Ваш реальный заработок</div>
                            </div>
                            <div className="text-right">
                              <div className="text-xl font-bold text-emerald-900">
                                {formatCurrency(grossProfit)}
                              </div>
                              <div className="text-sm text-emerald-600">
                                Маржа:{' '}
                                {payoutTotal > 0
                                  ? ((grossProfit / payoutTotal) * 100).toFixed(1)
                                  : 0}
                                %
                              </div>
                            </div>
                          </div>
                          {isComparison &&
                            comparisonSummary?.gross_profit !== null &&
                            comparisonSummary?.gross_profit !== undefined && (
                              <div className="mt-2 text-sm text-emerald-600">
                                Сравнение: {formatCurrency(comparisonSummary.gross_profit)}
                              </div>
                            )}
                        </div>
                      </>
                    )}
                  </>
                )
              })()}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expenses Section - Redesigned per Request #02 / WB Financial Structure */}
      {/* Reference: docs/request-product-manager/02-financial-data-presentation-concept.md */}
      <Card>
        <CardHeader>
          <CardTitle>💸 Расходы WB</CardTitle>
          <CardDescription>
            Все удержания Wildberries (комиссии + операционные расходы)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {(() => {
            // Calculate values for expense breakdown
            const saleGross = summary.sale_gross_total ?? summary.sale_gross ?? 0
            const compSaleGross =
              comparisonSummary?.sale_gross_total ?? comparisonSummary?.sale_gross ?? 0

            // WB Commission (implicit: retail_price_with_discount - gross)
            const commission =
              summary.total_commission_rub_total ?? summary.total_commission_rub ?? 0
            const compCommission =
              comparisonSummary?.total_commission_rub_total ??
              comparisonSummary?.total_commission_rub ??
              0

            // Operational deductions
            const logistics = summary.logistics_cost_total ?? summary.logistics_cost ?? 0
            const compLogistics =
              comparisonSummary?.logistics_cost_total ?? comparisonSummary?.logistics_cost ?? 0

            const storage = summary.storage_cost_total ?? summary.storage_cost ?? 0
            const compStorage =
              comparisonSummary?.storage_cost_total ?? comparisonSummary?.storage_cost ?? 0

            const paidAcceptance =
              summary.paid_acceptance_cost_total ?? summary.paid_acceptance_cost ?? 0
            const compPaidAcceptance =
              comparisonSummary?.paid_acceptance_cost_total ??
              comparisonSummary?.paid_acceptance_cost ??
              0

            const penalties = summary.penalties_total ?? 0
            const compPenalties = comparisonSummary?.penalties_total ?? 0

            // WB Services breakdown (inside other_adjustments_net)
            const otherAdjustments =
              summary.other_adjustments_net_total ?? summary.other_adjustments_net ?? 0
            const compOtherAdjustments =
              comparisonSummary?.other_adjustments_net_total ??
              comparisonSummary?.other_adjustments_net ??
              0

            // WB Services sub-items (Request #56)
            const wbPromotion = summary.wb_promotion_cost_total ?? summary.wb_promotion_cost ?? 0
            const compWbPromotion =
              comparisonSummary?.wb_promotion_cost_total ??
              comparisonSummary?.wb_promotion_cost ??
              0

            const wbJam = summary.wb_jam_cost_total ?? summary.wb_jam_cost ?? 0
            const compWbJam =
              comparisonSummary?.wb_jam_cost_total ?? comparisonSummary?.wb_jam_cost ?? 0

            const wbOtherServices =
              summary.wb_other_services_cost_total ?? summary.wb_other_services_cost ?? 0
            const compWbOtherServices =
              comparisonSummary?.wb_other_services_cost_total ??
              comparisonSummary?.wb_other_services_cost ??
              0

            // Корректировка ВВ (Request #51)
            const wbCommissionAdj =
              summary.wb_commission_adj_total ?? summary.wb_commission_adj ?? 0
            const compWbCommissionAdj =
              comparisonSummary?.wb_commission_adj_total ??
              comparisonSummary?.wb_commission_adj ??
              0

            // Loyalty fees (separate from commission)
            const loyaltyFee = summary.loyalty_fee_total ?? summary.loyalty_fee ?? 0
            const compLoyaltyFee =
              comparisonSummary?.loyalty_fee_total ?? comparisonSummary?.loyalty_fee ?? 0

            const loyaltyPointsWithheld =
              summary.loyalty_points_withheld_total ?? summary.loyalty_points_withheld ?? 0
            const compLoyaltyPointsWithheld =
              comparisonSummary?.loyalty_points_withheld_total ??
              comparisonSummary?.loyalty_points_withheld ??
              0

            // Total operational deductions (without commission - shown separately)
            // Note: Commission is deducted from GROSS to get to_pay_goods
            // Operational deductions are deducted from to_pay_goods to get payout
            // These are different "levels" of the funnel - cannot be summed!
            const totalDeductions =
              logistics +
              storage +
              paidAcceptance +
              penalties +
              otherAdjustments +
              wbCommissionAdj +
              loyaltyFee +
              loyaltyPointsWithheld
            const compTotalDeductions =
              compLogistics +
              compStorage +
              compPaidAcceptance +
              compPenalties +
              compOtherAdjustments +
              compWbCommissionAdj +
              compLoyaltyFee +
              compLoyaltyPointsWithheld

            // Helper to calculate % of turnover
            const pctOfTurnover = (value: number, base: number) =>
              base > 0 ? ((value / base) * 100).toFixed(1) + '%' : '—'

            // Custom row with percentage and tooltip support
            const ExpenseRow = ({
              label,
              value,
              compValue,
              base,
              compBase,
              indent = 0,
              bold = false,
              highlight = false,
            }: {
              label: string
              value: number
              compValue: number
              base: number
              compBase: number
              indent?: number
              bold?: boolean
              highlight?: boolean
            }) => (
              <TableRow
                className={highlight ? 'bg-amber-50 font-semibold' : bold ? 'font-semibold' : ''}
              >
                <TableCell className="font-medium" style={{ paddingLeft: `${16 + indent * 16}px` }}>
                  <LabelWithTooltip label={label} />
                </TableCell>
                <TableCell className="text-right">{formatCurrency(value)}</TableCell>
                <TableCell className="text-right text-gray-500">
                  {pctOfTurnover(value, base)}
                </TableCell>
                {isComparison && (
                  <>
                    <TableCell className="text-right">{formatCurrency(compValue)}</TableCell>
                    <TableCell className="text-right text-gray-500">
                      {pctOfTurnover(compValue, compBase)}
                    </TableCell>
                    <TableCell className="text-right">
                      <ChangeIndicator current={value} previous={compValue} isNegativeMetric />
                    </TableCell>
                  </>
                )}
              </TableRow>
            )

            return (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[280px]">Статья расходов</TableHead>
                    <TableHead className="text-right">Сумма</TableHead>
                    <TableHead className="text-right">% оборота</TableHead>
                    {isComparison && (
                      <>
                        <TableHead className="text-right">Сравнение</TableHead>
                        <TableHead className="text-right">% оборота</TableHead>
                        <TableHead className="text-right">Изменение</TableHead>
                      </>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Комиссия WB - deducted from GROSS to get to_pay_goods */}
                  <ExpenseRow
                    label="Комиссия WB (из оборота)"
                    value={commission}
                    compValue={compCommission}
                    base={saleGross}
                    compBase={compSaleGross}
                    highlight
                  />

                  {/* Commission breakdown: Эквайринг + Прочие (КВВ + SPP) */}
                  {(() => {
                    const acquiring = summary.acquiring_fee_total ?? summary.acquiring_fee ?? 0
                    const compAcquiring =
                      comparisonSummary?.acquiring_fee_total ??
                      comparisonSummary?.acquiring_fee ??
                      0
                    // Прочие = Total Commission - Acquiring (includes КВВ, SPP subsidies, promo)
                    const otherCommission = commission - acquiring
                    const compOtherCommission = compCommission - compAcquiring

                    return (
                      <>
                        <ExpenseRow
                          label="Эквайринг (из комиссии)"
                          value={acquiring}
                          compValue={compAcquiring}
                          base={saleGross}
                          compBase={compSaleGross}
                          indent={1}
                        />
                        <ExpenseRow
                          label="Прочие комиссии (КВВ + SPP)"
                          value={otherCommission}
                          compValue={compOtherCommission}
                          base={saleGross}
                          compBase={compSaleGross}
                          indent={1}
                        />
                      </>
                    )
                  })()}

                  {/* Divider before operational deductions */}
                  <TableRow>
                    <TableCell colSpan={isComparison ? 6 : 3} className="py-1">
                      <hr className="border-gray-200" />
                    </TableCell>
                  </TableRow>

                  {/* Удержания WB - deducted from to_pay_goods to get payout */}
                  <ExpenseRow
                    label="Удержания WB (из к перечислению)"
                    value={totalDeductions}
                    compValue={compTotalDeductions}
                    base={saleGross}
                    compBase={compSaleGross}
                    bold
                  />

                  {/* Logistics */}
                  <ExpenseRow
                    label="Логистика"
                    value={logistics}
                    compValue={compLogistics}
                    base={saleGross}
                    compBase={compSaleGross}
                    indent={1}
                  />

                  {/* Storage */}
                  <ExpenseRow
                    label="Хранение"
                    value={storage}
                    compValue={compStorage}
                    base={saleGross}
                    compBase={compSaleGross}
                    indent={1}
                  />

                  {/* Paid Acceptance */}
                  <ExpenseRow
                    label="Платная приёмка"
                    value={paidAcceptance}
                    compValue={compPaidAcceptance}
                    base={saleGross}
                    compBase={compSaleGross}
                    indent={1}
                  />

                  {/* Penalties */}
                  <ExpenseRow
                    label="Штрафы"
                    value={penalties}
                    compValue={compPenalties}
                    base={saleGross}
                    compBase={compSaleGross}
                    indent={1}
                  />

                  {/* Other adjustments (WB Services) */}
                  <ExpenseRow
                    label="Прочие удержания (WB сервисы)"
                    value={otherAdjustments}
                    compValue={compOtherAdjustments}
                    base={saleGross}
                    compBase={compSaleGross}
                    indent={1}
                  />

                  {/* WB Services breakdown - only show if there are values */}
                  {(wbPromotion > 0 || wbJam > 0 || wbOtherServices > 0) && (
                    <>
                      {wbPromotion > 0 && (
                        <ExpenseRow
                          label="WB.Продвижение"
                          value={wbPromotion}
                          compValue={compWbPromotion}
                          base={saleGross}
                          compBase={compSaleGross}
                          indent={2}
                        />
                      )}
                      {wbJam > 0 && (
                        <ExpenseRow
                          label="Подписка Джем"
                          value={wbJam}
                          compValue={compWbJam}
                          base={saleGross}
                          compBase={compSaleGross}
                          indent={2}
                        />
                      )}
                      {wbOtherServices > 0 && (
                        <ExpenseRow
                          label="Прочие сервисы WB"
                          value={wbOtherServices}
                          compValue={compWbOtherServices}
                          base={saleGross}
                          compBase={compSaleGross}
                          indent={2}
                        />
                      )}
                    </>
                  )}

                  {/* Корректировка ВВ (Request #51) */}
                  <ExpenseRow
                    label="Корректировка ВВ"
                    value={wbCommissionAdj}
                    compValue={compWbCommissionAdj}
                    base={saleGross}
                    compBase={compSaleGross}
                    indent={1}
                  />

                  {/* Loyalty fees - only show if there are values */}
                  {(loyaltyFee > 0 || loyaltyPointsWithheld > 0) && (
                    <>
                      {loyaltyFee > 0 && (
                        <ExpenseRow
                          label="Комиссия лояльности"
                          value={loyaltyFee}
                          compValue={compLoyaltyFee}
                          base={saleGross}
                          compBase={compSaleGross}
                          indent={1}
                        />
                      )}
                      {loyaltyPointsWithheld > 0 && (
                        <ExpenseRow
                          label="Удержание баллов"
                          value={loyaltyPointsWithheld}
                          compValue={compLoyaltyPointsWithheld}
                          base={saleGross}
                          compBase={compSaleGross}
                          indent={1}
                        />
                      )}
                    </>
                  )}
                </TableBody>
              </Table>
            )
          })()}
        </CardContent>
      </Card>

      {/* Compensations Section - only positive adjustments (income side) */}
      {/* Note: wb_commission_adj and other_adjustments_net moved to Expenses section above */}
      {(summary.loyalty_compensation_total ?? summary.loyalty_compensation ?? 0) > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Компенсации</CardTitle>
            <CardDescription>Компенсации от Wildberries (входят в доход)</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Показатель</TableHead>
                  <TableHead className="text-right">Значение</TableHead>
                  {isComparison && (
                    <>
                      <TableHead className="text-right">Сравнение</TableHead>
                      <TableHead className="text-right">Изменение</TableHead>
                    </>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                <MetricRow
                  label="Компенсация лояльности"
                  value={summary.loyalty_compensation_total ?? summary.loyalty_compensation}
                  comparisonValue={
                    comparisonSummary?.loyalty_compensation_total ??
                    comparisonSummary?.loyalty_compensation
                  }
                />
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Payout Summary */}
      <Card className="border-2 border-blue-500">
        <CardHeader className="bg-blue-50">
          <CardTitle className="text-blue-900">Итого к оплате</CardTitle>
          <CardDescription className="text-blue-700">
            Общая сумма к перечислению продавцу за период
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">Показатель</TableHead>
                <TableHead className="text-right">Значение</TableHead>
                {isComparison && (
                  <>
                    <TableHead className="text-right">Сравнение</TableHead>
                    <TableHead className="text-right">Изменение</TableHead>
                  </>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              <MetricRow
                label="Итого к оплате"
                value={summary.payout_total}
                comparisonValue={comparisonSummary?.payout_total}
                highlight
              />
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Story 25.2: COGS Section - Себестоимость */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-amber-600" />
            Себестоимость (COGS)
          </CardTitle>
          <CardDescription>Себестоимость товаров и расчёт чистой прибыли</CardDescription>
        </CardHeader>
        <CardContent>
          {summary.cogs_total === null || summary.cogs_total === undefined ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Нет данных о себестоимости за этот период. Назначьте себестоимости товарам для
                расчёта маржи.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[300px]">Показатель</TableHead>
                    <TableHead className="text-right">Значение</TableHead>
                    {isComparison && (
                      <>
                        <TableHead className="text-right">Сравнение</TableHead>
                        <TableHead className="text-right">Изменение</TableHead>
                      </>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <MetricRow
                    label="Себестоимость (COGS)"
                    value={summary.cogs_total}
                    comparisonValue={comparisonSummary?.cogs_total}
                  />
                  <TableRow>
                    <TableCell className="font-medium">Покрытие COGS</TableCell>
                    <TableCell className="text-right">
                      {summary.cogs_coverage_pct !== null && summary.cogs_coverage_pct !== undefined
                        ? `${summary.cogs_coverage_pct.toFixed(1)}%`
                        : '—'}
                    </TableCell>
                    {isComparison && (
                      <>
                        <TableCell className="text-right">
                          {comparisonSummary?.cogs_coverage_pct !== null &&
                          comparisonSummary?.cogs_coverage_pct !== undefined
                            ? `${comparisonSummary.cogs_coverage_pct.toFixed(1)}%`
                            : '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          {summary.cogs_coverage_pct !== null &&
                          comparisonSummary?.cogs_coverage_pct !== null &&
                          summary.cogs_coverage_pct !== undefined &&
                          comparisonSummary?.cogs_coverage_pct !== undefined ? (
                            <span
                              className={
                                summary.cogs_coverage_pct > comparisonSummary.cogs_coverage_pct
                                  ? 'text-green-600'
                                  : summary.cogs_coverage_pct < comparisonSummary.cogs_coverage_pct
                                    ? 'text-red-600'
                                    : 'text-gray-500'
                              }
                            >
                              {summary.cogs_coverage_pct > comparisonSummary.cogs_coverage_pct
                                ? '+'
                                : ''}
                              {(
                                summary.cogs_coverage_pct - comparisonSummary.cogs_coverage_pct
                              ).toFixed(1)}
                              pp
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Товаров с COGS</TableCell>
                    <TableCell className="text-right">
                      {summary.products_with_cogs !== null &&
                      summary.products_with_cogs !== undefined &&
                      summary.products_total !== null &&
                      summary.products_total !== undefined
                        ? `${summary.products_with_cogs} / ${summary.products_total}`
                        : '—'}
                    </TableCell>
                    {isComparison && (
                      <>
                        <TableCell className="text-right">
                          {comparisonSummary?.products_with_cogs !== null &&
                          comparisonSummary?.products_with_cogs !== undefined &&
                          comparisonSummary?.products_total !== null &&
                          comparisonSummary?.products_total !== undefined
                            ? `${comparisonSummary.products_with_cogs} / ${comparisonSummary.products_total}`
                            : '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-gray-400">—</span>
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                </TableBody>
              </Table>

              {/* Warning when COGS coverage < 100% */}
              {summary.cogs_coverage_pct !== null &&
                summary.cogs_coverage_pct !== undefined &&
                summary.cogs_coverage_pct < 100 && (
                  <Alert className="mt-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Внесите себестоимости для{' '}
                      {(summary.products_total ?? 0) - (summary.products_with_cogs ?? 0)} товаров
                      для расчёта чистой прибыли.
                    </AlertDescription>
                  </Alert>
                )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Story 25.2: Profit Section - only when COGS coverage = 100% */}
      {summary.cogs_coverage_pct === 100 && summary.gross_profit !== null && (
        <Card className="border-2 border-emerald-500">
          <CardHeader className="bg-emerald-50">
            <CardTitle className="flex items-center gap-2 text-emerald-900">
              <Gem className="h-5 w-5" />
              Чистая прибыль
            </CardTitle>
            <CardDescription className="text-emerald-700">
              Прибыль после вычета себестоимости товаров
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Показатель</TableHead>
                  <TableHead className="text-right">Значение</TableHead>
                  {isComparison && (
                    <>
                      <TableHead className="text-right">Сравнение</TableHead>
                      <TableHead className="text-right">Изменение</TableHead>
                    </>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                <MetricRow
                  label="Чистая прибыль"
                  value={summary.gross_profit}
                  comparisonValue={comparisonSummary?.gross_profit}
                  highlight
                />
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
