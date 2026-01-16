/**
 * PnLWaterfall Component
 *
 * Comprehensive P&L (Profit & Loss) waterfall for CFO dashboard.
 * Shows complete financial picture with clear formulas and explanations.
 *
 * STRUCTURE (WB Dashboard aligned):
 * 1. Выручка: Продажи (GMV) - Возвраты = Чистые продажи (100%)
 * 2. Удержания WB: Комиссия + Логистика + Хранение + Штрафы + Эквайринг + Лояльность - Компенсации
 * 3. К перечислению: Чистые продажи - Удержания WB
 * 4. Валовая прибыль: К перечислению - COGS (только при 100% покрытии)
 * 5. Ключевые метрики: ROI, Прибыль/ед, Продано единиц
 *
 * FORMULA (matches WB Dashboard):
 * payout_total = to_pay_goods - logistics - storage - acceptance - penalties - other_adjustments
 *
 * @see docs/WB-DASHBOARD-METRICS.md
 * @see frontend/docs/request-backend/43-wb-dashboard-data-discrepancy.md
 */

'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { HelpCircle, TrendingUp, TrendingDown, AlertTriangle, Info, Calculator } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CabinetSummaryTotals, CabinetProductStats } from '@/types/analytics'

interface PnLWaterfallProps {
  data: CabinetSummaryTotals
  products: CabinetProductStats
  className?: string
}

// Format currency with Russian locale
const formatCurrency = (value: number | null | undefined, showSign = false): string => {
  if (value === null || value === undefined) return '—'
  const formatted = new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(Math.abs(value))

  if (showSign && value !== 0) {
    return value < 0 ? `−${formatted}` : `+${formatted}`
  }
  return value < 0 ? `−${formatted}` : formatted
}

// Format percentage
const formatPercent = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '—'
  return `${value.toFixed(1)}%`
}

// P&L Row component with enhanced styling
interface PnLRowProps {
  label: string
  value: number | null | undefined
  formula?: string           // Short formula explanation
  isSubtotal?: boolean
  isTotal?: boolean
  isNegative?: boolean
  isPositive?: boolean       // For compensations (green, adds to payout)
  indent?: number
  tooltip?: string
  percentOfRevenue?: number | null
  highlight?: 'positive' | 'negative' | 'warning' | 'neutral'
  showZero?: boolean         // Show row even if value is 0
}

const PnLRow = ({
  label,
  value,
  formula,
  isSubtotal = false,
  isTotal = false,
  isNegative = false,
  isPositive = false,
  indent = 0,
  tooltip,
  percentOfRevenue,
  highlight,
  showZero = true
}: PnLRowProps) => {
  // Hide row if value is 0 or null and showZero is false
  if (!showZero && (value === null || value === undefined || value === 0)) {
    return null
  }

  const displayValue = isNegative && value ? -Math.abs(value) : value

  const rowClasses = cn(
    'flex items-center justify-between py-2.5 px-3 rounded-md transition-colors',
    isTotal && 'bg-slate-100 font-bold text-lg border-2 border-slate-300',
    isSubtotal && 'bg-slate-50 font-semibold border-t border-slate-200',
    highlight === 'positive' && 'bg-green-50',
    highlight === 'negative' && 'bg-red-50',
    highlight === 'warning' && 'bg-amber-50',
  )

  const valueClasses = cn(
    'font-mono tabular-nums text-base',
    isNegative && 'text-red-600',
    isPositive && 'text-green-600',
    highlight === 'positive' && 'text-green-700 font-bold',
    highlight === 'negative' && 'text-red-700 font-bold',
  )

  return (
    <div className={rowClasses} style={{ paddingLeft: `${12 + indent * 20}px` }}>
      <div className="flex items-center gap-2 flex-1">
        <span className={cn(
          isTotal && 'text-slate-900',
          isSubtotal && 'text-slate-700',
          indent > 0 && !isSubtotal && !isTotal && 'text-slate-600'
        )}>
          {label}
        </span>
        {tooltip && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button type="button" className="inline-flex">
                <HelpCircle className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground transition-colors" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-sm">
              <p className="text-sm font-medium mb-1">{label}</p>
              <p className="text-xs text-muted-foreground">{tooltip}</p>
              {formula && (
                <p className="text-xs mt-2 font-mono bg-slate-100 px-2 py-1 rounded">
                  {formula}
                </p>
              )}
            </TooltipContent>
          </Tooltip>
        )}
      </div>
      <div className="flex items-center gap-2">
        {/* Always reserve space for percentage column to ensure vertical alignment */}
        <span className={cn(
          'text-xs w-14 text-right font-mono tabular-nums',
          percentOfRevenue !== null && percentOfRevenue !== undefined
            ? (isPositive ? 'text-green-600' : 'text-muted-foreground')
            : 'invisible'
        )}>
          {percentOfRevenue !== null && percentOfRevenue !== undefined
            ? (isPositive ? `−${Math.abs(percentOfRevenue).toFixed(1)}%` : formatPercent(percentOfRevenue))
            : '\u00A0'}
        </span>
        <span className={cn('min-w-[130px] text-right', valueClasses)}>
          {isPositive && value && value > 0 ? '+' : ''}
          {formatCurrency(displayValue, isNegative)}
        </span>
      </div>
    </div>
  )
}

// Section header with better styling
const SectionHeader = ({
  title,
  description,
  formula
}: {
  title: string
  description?: string
  formula?: string
}) => (
  <div className="border-b-2 border-slate-300 pb-2 mb-3">
    <div className="flex items-center gap-2">
      <h4 className="font-bold text-slate-800 text-base">{title}</h4>
      {formula && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button type="button" className="inline-flex">
              <Calculator className="h-4 w-4 text-blue-500 hover:text-blue-700" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-md">
            <p className="font-medium mb-1">Формула расчёта</p>
            <p className="font-mono text-xs bg-slate-100 px-2 py-1 rounded whitespace-pre-wrap">
              {formula}
            </p>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
    {description && (
      <p className="text-xs text-muted-foreground mt-1">{description}</p>
    )}
  </div>
)

export function PnLWaterfall({ data, products, className }: PnLWaterfallProps) {
  // Require 100% COGS coverage to show gross profit
  const hasCogs = products.coverage_pct >= 100

  // Calculate percentages of Net Sales (revenue base = 100%)
  const revenueBase = data.sale_gross || 1

  // Commission percentage
  const commissionPct = data.total_commission_rub
    ? (data.total_commission_rub / revenueBase) * 100
    : null

  // Logistics percentage
  const logisticsPct = data.logistics_cost
    ? (data.logistics_cost / revenueBase) * 100
    : null

  // Storage percentage
  const storagePct = data.storage_cost
    ? (data.storage_cost / revenueBase) * 100
    : null

  // Paid acceptance percentage
  const acceptancePct = data.paid_acceptance_cost
    ? (data.paid_acceptance_cost / revenueBase) * 100
    : null

  // Penalties percentage
  const penaltiesPct = data.penalties
    ? (data.penalties / revenueBase) * 100
    : null

  // Acquiring fee percentage
  const acquiringPct = data.acquiring_fee
    ? (data.acquiring_fee / revenueBase) * 100
    : null

  // Loyalty fee percentage
  const loyaltyFeePct = data.loyalty_fee
    ? (data.loyalty_fee / revenueBase) * 100
    : null

  // Loyalty compensation percentage (positive = reduces deductions)
  const loyaltyCompensationPct = data.loyalty_compensation
    ? (data.loyalty_compensation / revenueBase) * 100
    : null

  // Other adjustments percentage
  const otherAdjustmentsPct = data.other_adjustments
    ? (data.other_adjustments / revenueBase) * 100
    : null

  // NOTE: commission field from margin_fact is NOT used in P&L display
  // because commission_sales portion duplicates total_commission_rub.
  // See comment in Section 2 for details.

  // Seller payout from backend (WB Dashboard formula)
  // Backend formula: payout = toPayGoods - logistics - storage - penalties - other_adjustments
  // Where toPayGoods = SUM(net_for_pay), NOT (sale_gross - commission)
  const sellerPayout = data.payout_total || 0

  // Total WB deductions = sale_gross - payout_total
  // This is the ACTUAL amount WB retained (all fees combined)
  // Calculating this way guarantees: deductions% + payout% = 100%
  const totalWBDeductions = revenueBase - sellerPayout

  // Note: Individual deduction components (commission, logistics, storage, etc.) are displayed
  // separately in the breakdown. They may not sum exactly to totalWBDeductions due to backend
  // formula differences (toPayGoods ≠ sale_gross - commission). See payout-total.formula.ts.

  // Percentage calculations (relative to Net Sales = 100%)
  const totalDeductionsPct = revenueBase > 0
    ? (totalWBDeductions / revenueBase) * 100
    : null

  const payoutPct = revenueBase > 0
    ? (sellerPayout / revenueBase) * 100
    : null

  // COGS percentage of revenue
  const cogsPct = data.cogs_total
    ? (data.cogs_total / revenueBase) * 100
    : null

  // Gross Profit = Payout - COGS (only when COGS coverage = 100%)
  const grossProfit = hasCogs
    ? sellerPayout - (data.cogs_total || 0)
    : null

  const grossMarginPct = grossProfit !== null && sellerPayout
    ? (grossProfit / sellerPayout) * 100
    : null

  // Profit margin relative to Net Sales (for comparison)
  const profitToRevenuePct = grossProfit !== null && revenueBase
    ? (grossProfit / revenueBase) * 100
    : null

  return (
    <TooltipProvider>
      <Card className={cn('', className)}>
        <CardHeader className="pb-4">
          <CardTitle className="text-xl flex items-center gap-2">
            Отчёт о прибылях и убытках (P&L)
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" className="inline-flex">
                  <HelpCircle className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-md">
                <p className="font-bold mb-2">Как читать этот отчёт</p>
                <div className="text-xs space-y-2">
                  <p>
                    <strong>Водопадная структура:</strong> каждый блок показывает, куда уходят деньги
                    от продаж покупателям до вашей чистой прибыли.
                  </p>
                  <p>
                    <strong>Процент справа:</strong> доля от чистых продаж (Net Sales = 100%).
                    Помогает быстро оценить структуру затрат.
                  </p>
                  <p>
                    <strong>Формулы:</strong> нажмите на иконку калькулятора для просмотра
                    формулы расчёта каждого блока.
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          </CardTitle>
          <CardDescription>
            Полная финансовая картина за выбранный период. Все суммы соответствуют данным WB Dashboard.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-8">
          {/* ══════════════════════════════════════════════════════════════════
              SECTION 1: ВЫРУЧКА (Revenue)
              Formula: Продажи (GMV) - Возвраты = Чистые продажи
              ══════════════════════════════════════════════════════════════════ */}
          <div>
            <SectionHeader
              title="1. Выручка"
              description="Сколько заплатили покупатели за ваши товары"
              formula="Чистые продажи = GMV − Возвраты"
            />
            <div className="space-y-1">
              <PnLRow
                label="Продажи (GMV)"
                value={data.sales_gross}
                tooltip="Общая сумма, которую заплатили покупатели за товары.
                        Это цена товара с учётом всех скидок WB (СПП, акции).
                        Источник: поле retail_price_with_discount для продаж."
                formula="SUM(retail_price_with_discount) WHERE doc_type='sale'"
              />
              <PnLRow
                label="Возвраты"
                value={data.returns_gross}
                isNegative
                indent={1}
                tooltip="Сумма возвращённых покупателями товаров.
                        Это НЕ расход, а уменьшение выручки — товар вернулся к вам.
                        Отображается красным, т.к. уменьшает ваш доход."
                formula="SUM(retail_price_with_discount) WHERE doc_type='return'"
              />
              <PnLRow
                label="Чистые продажи (Net Sales)"
                value={data.sale_gross}
                isSubtotal
                tooltip="Итоговая выручка после возвратов.
                        В личном кабинете WB это называется просто «Продажи».
                        Это база (100%) для расчёта всех комиссий и удержаний."
                formula="Net Sales = GMV − Возвраты"
                percentOfRevenue={100}
              />
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════════
              SECTION 2: УДЕРЖАНИЯ WILDBERRIES
              All fees and deductions WB takes from seller
              ══════════════════════════════════════════════════════════════════ */}
          <div>
            <SectionHeader
              title="2. Удержания Wildberries"
              description="Все платежи в адрес маркетплейса (вычитаются из вашей выручки)"
              formula="Итого удержаний = Комиссия + Логистика + Хранение + Приёмка + Штрафы + Эквайринг + Лояльность − Компенсации"
            />
            <div className="space-y-1">
              {/* Main commission */}
              <PnLRow
                label="Комиссия WB"
                value={data.total_commission_rub}
                isNegative
                indent={1}
                tooltip="Основная комиссия маркетплейса — разница между ценой для покупателя
                        и суммой, которую WB начисляет продавцу.
                        Зависит от категории товара (5-25%) и участия в акциях WB."
                formula="Комиссия = Цена покупателя − Gross (начислено продавцу)"
                percentOfRevenue={commissionPct}
              />

              {/* Logistics */}
              <PnLRow
                label="Логистика"
                value={data.logistics_cost}
                isNegative
                indent={1}
                tooltip="Стоимость доставки покупателям (~70% суммы) и возврата
                        непроданных товаров на склад (~30%).
                        Норма: 8-15% от продаж. Выше 15% — повод оптимизировать."
                formula="Логистика = Доставка + Возврат на склад"
                percentOfRevenue={logisticsPct}
              />

              {/* Storage */}
              <PnLRow
                label="Хранение"
                value={data.storage_cost}
                isNegative
                indent={1}
                tooltip="Плата за хранение товаров на складах WB.
                        Зависит от объёма товара и срока хранения.
                        Норма: 1-3% от продаж. Выше 5% — избыточные остатки!"
                formula="Хранение = Тариф × Объём × Дни"
                percentOfRevenue={storagePct}
              />

              {/* Paid acceptance - only if > 0 */}
              <PnLRow
                label="Платная приёмка"
                value={data.paid_acceptance_cost}
                isNegative
                indent={1}
                showZero={false}
                tooltip="Плата за приёмку товаров при поставке на склады WB.
                        Взимается при превышении лимитов бесплатной приёмки."
                formula="Приёмка = Кол-во единиц × Тариф"
                percentOfRevenue={acceptancePct}
              />

              {/* Penalties - only if > 0, highlighted red */}
              {(data.penalties ?? 0) > 0 && (
                <PnLRow
                  label="Штрафы"
                  value={data.penalties}
                  isNegative
                  indent={1}
                  highlight="negative"
                  tooltip="Штрафы за нарушения: брак, пересорт, просрочка маркировки.
                          ВАЖНО: этот показатель должен быть равен 0!
                          Любые штрафы — повод для расследования причин."
                  formula="Штрафы = Сумма всех начисленных штрафов"
                  percentOfRevenue={penaltiesPct}
                />
              )}

              {/* Acquiring fee - only if > 0 */}
              <PnLRow
                label="Эквайринг"
                value={data.acquiring_fee}
                isNegative
                indent={1}
                showZero={false}
                tooltip="Комиссия за приём платежей от покупателей.
                        Обычно включена в основную комиссию WB,
                        отдельно выделяется для некоторых способов оплаты."
                formula="Эквайринг = % от суммы платежа"
                percentOfRevenue={acquiringPct}
              />

              {/* Loyalty fee - only if > 0 */}
              <PnLRow
                label="Программа лояльности"
                value={data.loyalty_fee}
                isNegative
                indent={1}
                showZero={false}
                tooltip="Плата за участие в программе лояльности WB.
                        Включает стоимость баллов, которые покупатели
                        использовали для оплаты ваших товаров."
                formula="Лояльность = Удержано баллов + Участие в программе"
                percentOfRevenue={loyaltyFeePct}
              />

              {/* Loyalty compensation - POSITIVE (green) - reduces deductions */}
              {(data.loyalty_compensation ?? 0) > 0 && (
                <PnLRow
                  label="Компенсация лояльности"
                  value={data.loyalty_compensation}
                  isPositive
                  indent={1}
                  highlight="positive"
                  tooltip="Компенсация ОТ WB за участие в программе лояльности.
                          Это ПЛЮС к вашему доходу — WB компенсирует часть
                          скидок, которые вы дали покупателям."
                  formula="Компенсация = Возврат части удержанных средств"
                  percentOfRevenue={loyaltyCompensationPct}
                />
              )}

              {/* Other adjustments - if exists */}
              {(data.other_adjustments ?? 0) !== 0 && (
                <>
                  <PnLRow
                    label="Прочие удержания"
                    value={data.other_adjustments}
                    isNegative={(data.other_adjustments ?? 0) > 0}
                    isPositive={(data.other_adjustments ?? 0) < 0}
                    indent={1}
                    tooltip="Общая сумма прочих корректировок и удержаний WB.
                            Ниже показана детализация по типам сервисов."
                    formula="Прочие = WB.Продвижение + Джем + Прочие сервисы"
                    percentOfRevenue={otherAdjustmentsPct}
                  />

                  {/* Request #56: WB Services Breakdown (inside other_adjustments) */}
                  {/* WB.Продвижение (реклама) */}
                  {(data.wb_promotion_cost ?? 0) > 0 && (
                    <PnLRow
                      label="→ WB.Продвижение"
                      value={data.wb_promotion_cost}
                      isNegative
                      indent={2}
                      showZero={false}
                      tooltip="Расходы на рекламу через WB.Продвижение.
                              Это внутренняя рекламная площадка Wildberries
                              для продвижения товаров в поиске и каталоге."
                      formula="Оказание услуг «WB Продвижение»"
                      percentOfRevenue={data.wb_promotion_cost && revenueBase > 0
                        ? (data.wb_promotion_cost / revenueBase) * 100
                        : null}
                    />
                  )}

                  {/* Джем (подписка) */}
                  {(data.wb_jam_cost ?? 0) > 0 && (
                    <PnLRow
                      label="→ Джем"
                      value={data.wb_jam_cost}
                      isNegative
                      indent={2}
                      showZero={false}
                      tooltip="Подписка на сервис «Джем» от Wildberries.
                              Включает аналитику, автоматизацию и инструменты
                              для управления продажами."
                      formula="Предоставление услуг по подписке «Джем»"
                      percentOfRevenue={data.wb_jam_cost && revenueBase > 0
                        ? (data.wb_jam_cost / revenueBase) * 100
                        : null}
                    />
                  )}

                  {/* Прочие сервисы WB (утилизация и др.) */}
                  {(data.wb_other_services_cost ?? 0) > 0 && (
                    <PnLRow
                      label="→ Прочие сервисы WB"
                      value={data.wb_other_services_cost}
                      isNegative
                      indent={2}
                      showZero={false}
                      tooltip="Прочие сервисы Wildberries:
                              - Утилизация товаров
                              - Другие сервисные комиссии"
                      formula="Утилизация + Другие сервисы"
                      percentOfRevenue={data.wb_other_services_cost && revenueBase > 0
                        ? (data.wb_other_services_cost / revenueBase) * 100
                        : null}
                    />
                  )}
                </>
              )}

              {/*
                NOTE: "Доп. комиссия сервисов" (commission) REMOVED - DUPLICATES total_commission_rub!

                Analysis (2025-12-12):
                - commission = commission_sales + commission_other (from weekly_margin_fact)
                - total_commission_rub = retail_price - gross = kВВ + СПП (from weekly_payout_summary)
                - commission_sales ("Вознаграждение ВВ") IS the kВВ portion of total_commission_rub
                - Showing both would DOUBLE-COUNT the kВВ commission!

                TODO (Backend): Add separate `commission_other` field to API for WB.Promotion/subscriptions
                that are NOT included in total_commission_rub. See: docs/technical-debt/commission-separation.md
              */}

              {/* SUBTOTAL: Total WB deductions */}
              <PnLRow
                label="Итого удержания WB"
                value={totalWBDeductions}
                isSubtotal
                isNegative
                tooltip="Общая сумма всех удержаний Wildberries.
                        Это все деньги, которые WB забирает из ваших продаж
                        за свои услуги (комиссия, логистика, хранение и др.)"
                formula="Итого = Комиссия + Логистика + Хранение + Штрафы + Эквайринг + Лояльность − Компенсации"
                percentOfRevenue={totalDeductionsPct}
              />
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════════
              SECTION 3: К ПЕРЕЧИСЛЕНИЮ ПРОДАВЦУ (Seller Payout)
              ══════════════════════════════════════════════════════════════════ */}
          <div>
            <SectionHeader
              title="3. К перечислению продавцу"
              description="Сколько денег WB перечислит вам после всех удержаний"
              formula="К перечислению = Чистые продажи − Удержания WB"
            />
            <div className="space-y-1">
              <PnLRow
                label="К перечислению (Payout)"
                value={sellerPayout}
                isTotal
                highlight={sellerPayout > 0 ? 'positive' : 'negative'}
                tooltip="Сумма, которую WB перечисляет на ваш расчётный счёт.
                        В личном кабинете WB это «К перечислению за товар».

                        ВАЖНО: Может быть отрицательной, если удержания
                        превышают выручку (вы должны WB)."
                formula="Payout = Net Sales − Все удержания WB"
                percentOfRevenue={payoutPct}
              />

              {/* Info about payout percentage */}
              <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground bg-blue-50 rounded-lg mt-2">
                <Info className="h-4 w-4 text-blue-500" />
                <span>
                  WB удерживает <strong className="text-slate-700">{formatPercent(totalDeductionsPct)}</strong> от продаж.
                  Вам остаётся <strong className="text-green-700">{formatPercent(payoutPct)}</strong>.
                </span>
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════════
              SECTION 4: ВАЛОВАЯ ПРИБЫЛЬ (Gross Profit)
              Only shown when COGS coverage = 100%
              ══════════════════════════════════════════════════════════════════ */}
          <div>
            <SectionHeader
              title="4. Валовая прибыль"
              description="Ваш реальный заработок после вычета себестоимости товаров"
              formula="Валовая прибыль = К перечислению − Себестоимость (COGS)"
            />
            {hasCogs ? (
              <div className="space-y-1">
                <PnLRow
                  label="К перечислению"
                  value={sellerPayout}
                  tooltip="Сумма от WB (из предыдущего раздела)"
                />
                <PnLRow
                  label="Себестоимость (COGS)"
                  value={data.cogs_total}
                  isNegative
                  indent={1}
                  tooltip="Закупочная стоимость проданных товаров.
                          Рассчитывается как: цена закупки × количество проданных единиц.

                          Включает только товары с присвоенной себестоимостью."
                  formula="COGS = Σ (Закупочная цена × Кол-во проданных)"
                  percentOfRevenue={cogsPct}
                />
                <PnLRow
                  label="Валовая прибыль"
                  value={grossProfit}
                  isTotal
                  highlight={grossProfit && grossProfit > 0 ? 'positive' : 'negative'}
                  tooltip="Ваш РЕАЛЬНЫЙ заработок после всех удержаний WB
                          и вычета себестоимости товаров.

                          Это деньги, которые остаются у вас после оплаты
                          товаров поставщикам и всех комиссий маркетплейса."
                  formula="Валовая прибыль = Payout − COGS"
                  percentOfRevenue={profitToRevenuePct}
                />

                {/* Margin indicator */}
                <div className="flex items-center gap-4 px-4 py-3 mt-3 bg-slate-50 rounded-lg border">
                  {grossProfit && grossProfit > 0 ? (
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  ) : (
                    <TrendingDown className="h-6 w-6 text-red-600" />
                  )}
                  <div className="flex-1">
                    <div className="text-sm text-muted-foreground">Валовая маржа от Payout:</div>
                    <div className={cn(
                      'text-xl font-bold',
                      grossMarginPct && grossMarginPct >= 25 ? 'text-green-600' :
                      grossMarginPct && grossMarginPct >= 15 ? 'text-amber-600' :
                      'text-red-600'
                    )}>
                      {formatPercent(grossMarginPct)}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={cn(
                      'text-sm px-3 py-1.5 rounded-full font-medium',
                      grossMarginPct && grossMarginPct >= 25 ? 'bg-green-100 text-green-800' :
                      grossMarginPct && grossMarginPct >= 15 ? 'bg-amber-100 text-amber-800' :
                      'bg-red-100 text-red-800'
                    )}>
                      {grossMarginPct && grossMarginPct >= 25 ? 'Отлично (≥25%)' :
                       grossMarginPct && grossMarginPct >= 15 ? 'Норма (15-25%)' :
                       'Низкая (<15%)'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-amber-800">Требуется 100% покрытие себестоимости</p>
                    <p className="text-sm text-amber-700 mt-1">
                      Для расчёта валовой прибыли добавьте себестоимость для всех
                      {' '}<strong>{products.without_cogs}</strong> товаров без COGS.
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      <div className="flex-1 h-2 bg-amber-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full transition-all"
                          style={{ width: `${products.coverage_pct}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-amber-700">
                        {products.coverage_pct.toFixed(0)}% ({products.with_cogs}/{products.total})
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ══════════════════════════════════════════════════════════════════
              SECTION 5: КЛЮЧЕВЫЕ МЕТРИКИ (CFO Metrics)
              ══════════════════════════════════════════════════════════════════ */}
          <div>
            <SectionHeader
              title="5. Ключевые метрики"
              description="Показатели эффективности бизнеса для принятия решений"
            />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
              {/* ROI */}
              <div className="bg-blue-50 rounded-lg p-4 text-center border border-blue-100">
                <div className="text-2xl font-bold text-blue-700">
                  {data.roi !== null ? `${data.roi.toFixed(0)}%` : '—'}
                </div>
                <div className="text-sm text-muted-foreground flex items-center justify-center gap-1 mt-1">
                  ROI
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5 text-blue-400" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="font-medium">Return on Investment</p>
                      <p className="text-xs mt-1">
                        Сколько рублей прибыли приносит каждый рубль, вложенный в закупку товаров.
                      </p>
                      <p className="text-xs font-mono mt-2 bg-slate-100 p-1 rounded">
                        ROI = (Валовая прибыль ÷ COGS) × 100%
                      </p>
                      <p className="text-xs mt-1 text-green-600">Норма: &gt;50%</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>

              {/* Profit per Unit */}
              <div className="bg-green-50 rounded-lg p-4 text-center border border-green-100">
                <div className="text-2xl font-bold text-green-700">
                  {data.profit_per_unit !== null ? formatCurrency(data.profit_per_unit) : '—'}
                </div>
                <div className="text-sm text-muted-foreground flex items-center justify-center gap-1 mt-1">
                  Прибыль/ед.
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5 text-green-400" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="font-medium">Прибыль на единицу</p>
                      <p className="text-xs mt-1">
                        Средняя валовая прибыль с каждой проданной единицы товара.
                      </p>
                      <p className="text-xs font-mono mt-2 bg-slate-100 p-1 rounded">
                        Прибыль/ед = Валовая прибыль ÷ Кол-во проданных
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>

              {/* Units Sold */}
              <div className="bg-purple-50 rounded-lg p-4 text-center border border-purple-100">
                <div className="text-2xl font-bold text-purple-700">
                  {data.qty.toLocaleString('ru-RU')}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Продано единиц
                </div>
              </div>

              {/* Dormant SKUs - only if > 0 */}
              {(data.skus_with_expenses_only ?? 0) > 0 && (
                <div className="bg-amber-50 rounded-lg p-4 text-center border border-amber-100">
                  <div className="text-2xl font-bold text-amber-700">
                    {data.skus_with_expenses_only}
                  </div>
                  <div className="text-sm text-muted-foreground flex items-center justify-center gap-1 mt-1">
                    Без продаж
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 text-amber-400" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="font-medium">Товары без продаж</p>
                        <p className="text-xs mt-1">
                          SKU, которые генерируют расходы на хранение,
                          но не имеют продаж за период.
                        </p>
                        <p className="text-xs mt-1 text-amber-600 font-medium">
                          Рекомендация: рассмотрите ликвидацию или продвижение.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}
