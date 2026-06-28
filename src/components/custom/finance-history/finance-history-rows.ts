/**
 * Finance History — row schema (pure, no React).
 *
 * Defines the metric×week P&L grid shown on `/analytics/finance-history`.
 * Each row extracts one value from a `FinanceSummary` so the table renderer
 * stays a thin presentational loop. Mirrors the competitor's financial-report
 * history page (Чистая/Маржинальная прибыль, маржа %, доли расходов, выручка,
 * расходы, налог) — sourced entirely from the existing finance-summary data we
 * already load per week, so no new backend contract is required.
 *
 * Margin/ratio extraction prefers backend-precomputed analytical fields
 * (gross_margin_pct / operating_margin_pct) and recomputes expense-share rows
 * from absolute values vs net revenue, matching dashboard math.
 */

import type { FinanceSummary } from '@/types/finance-summary'
import { getNetProfit } from '@/lib/tax-display-helpers'

export type FinanceHistoryRowKind = 'currency' | 'percent'

export interface FinanceHistorySection {
  id: string
  label: string
}

export interface FinanceHistoryRow {
  id: string
  label: string
  section: string
  kind: FinanceHistoryRowKind
  /** Bold row (profit headlines). */
  emphasis?: boolean
  /** For WoW trend coloring: when true, an increase is bad (red). Expenses/returns. */
  isNegativeMetric?: boolean
  tooltip?: string
  /** Pull the row's numeric value (in display units: currency ₽, or percent 0–100). */
  extract: (summary: FinanceSummary) => number | null
}

/** Net revenue (sales − returns). Single source for expense-share denominators. */
export function resolveRevenue(s: FinanceSummary): number | null {
  return s.sale_gross_total ?? s.sale_gross ?? s.revenue_net ?? null
}

/** Part / whole × 100, null when undefined or divide-by-zero. */
export function ratio(
  part: number | null | undefined,
  whole: number | null | undefined
): number | null {
  if (part == null || whole == null || whole === 0) return null
  return (part / whole) * 100
}

/** Net profit via the canonical tax cascade (byte-faithful to NetProfitCard). */
export function resolveNetProfit(s: FinanceSummary): number {
  // The operating slot takes operating_profit_analytical ONLY — never gross_profit
  // (gross omits logistics/storage/commission/promo, so it is LARGER than operating
  // and would inflate "net profit", breaking the Gross > Operating > Net hierarchy
  // that Story 87.1-FE fixed). `payout_total ?? 0` mirrors NetProfitCard.tsx:65.
  return getNetProfit(s.tax ?? null, s.payout_total ?? 0, s.operating_profit_analytical ?? null)
    .value
}

export const FINANCE_HISTORY_SECTIONS: readonly FinanceHistorySection[] = [
  { id: 'revenue', label: 'Доходы' },
  { id: 'profit', label: 'Прибыль и маржинальность' },
  { id: 'ratios', label: 'Структура расходов (% от выручки)' },
  { id: 'expenses', label: 'Абсолютные расходы' },
] as const

export const FINANCE_HISTORY_ROWS: readonly FinanceHistoryRow[] = [
  // — Доходы —
  {
    id: 'revenue_net',
    label: 'Выручка (нетто)',
    section: 'revenue',
    kind: 'currency',
    emphasis: true,
    tooltip: 'Продажи за вычетом возвратов (sale_gross).',
    extract: resolveRevenue,
  },
  {
    id: 'returns',
    label: 'Возвраты',
    section: 'revenue',
    kind: 'currency',
    isNegativeMetric: true,
    extract: s => s.returns_gross_total ?? s.returns_gross ?? null,
  },

  // — Прибыль и маржинальность —
  {
    id: 'cogs',
    label: 'Себестоимость (COGS)',
    section: 'profit',
    kind: 'currency',
    isNegativeMetric: true,
    extract: s => s.cogs_total ?? null,
  },
  {
    id: 'gross_profit',
    label: 'Валовая прибыль',
    section: 'profit',
    kind: 'currency',
    emphasis: true,
    tooltip: 'Выручка − COGS (до удержаний WB).',
    extract: s => s.gross_profit_analytical ?? s.gross_profit ?? null,
  },
  {
    id: 'gross_margin_pct',
    label: 'Валовая маржа, %',
    section: 'profit',
    kind: 'percent',
    // Backend gross_margin_pct = (revenue_net − COGS) / revenue_net; the fallback
    // recomputes from that same pair so both paths agree (no sale_gross mixing).
    extract: s =>
      s.gross_margin_pct ?? ratio(s.gross_profit_analytical ?? null, s.revenue_net ?? null),
  },
  {
    id: 'operating_profit',
    label: 'Операционная прибыль',
    section: 'profit',
    kind: 'currency',
    extract: s => s.operating_profit_analytical ?? null,
  },
  {
    id: 'operating_margin_pct',
    label: 'Операционная маржа, %',
    section: 'profit',
    kind: 'percent',
    extract: s => s.operating_margin_pct ?? null,
  },
  {
    id: 'net_profit',
    label: 'Чистая прибыль',
    section: 'profit',
    kind: 'currency',
    emphasis: true,
    tooltip: 'После налогового каскада (соответствует карточке на дашборде).',
    extract: resolveNetProfit,
  },

  // — Доли расходов (% от выручки) — ключевой блок как у конкурента —
  {
    id: 'logistics_share',
    label: 'Доля логистики, %',
    section: 'ratios',
    kind: 'percent',
    isNegativeMetric: true,
    tooltip: 'Логистика / выручка × 100.',
    extract: s => ratio(s.logistics_cost_total ?? null, resolveRevenue(s)),
  },
  {
    id: 'storage_share',
    label: 'Доля хранения, %',
    section: 'ratios',
    kind: 'percent',
    isNegativeMetric: true,
    extract: s => ratio(s.storage_cost_total ?? null, resolveRevenue(s)),
  },
  {
    id: 'commission_share',
    label: 'Доля комиссии, %',
    section: 'ratios',
    kind: 'percent',
    isNegativeMetric: true,
    extract: s =>
      ratio(s.total_commission_rub_total ?? s.commission_sales_total ?? null, resolveRevenue(s)),
  },
  {
    id: 'promotion_share',
    label: 'Доля продвижения WB, %',
    section: 'ratios',
    kind: 'percent',
    isNegativeMetric: true,
    tooltip: 'Удержание за продвижение WB / выручка × 100.',
    extract: s => ratio(s.wb_promotion_cost_total ?? null, resolveRevenue(s)),
  },

  // — Абсолютные расходы —
  {
    id: 'logistics',
    label: 'Логистика',
    section: 'expenses',
    kind: 'currency',
    isNegativeMetric: true,
    extract: s => s.logistics_cost_total ?? null,
  },
  {
    id: 'storage',
    label: 'Хранение',
    section: 'expenses',
    kind: 'currency',
    isNegativeMetric: true,
    extract: s => s.storage_cost_total ?? null,
  },
  {
    id: 'commission',
    label: 'Комиссия WB',
    section: 'expenses',
    kind: 'currency',
    isNegativeMetric: true,
    extract: s => s.total_commission_rub_total ?? s.commission_sales_total ?? null,
  },
  {
    id: 'promotion',
    label: 'Продвижение',
    section: 'expenses',
    kind: 'currency',
    isNegativeMetric: true,
    extract: s => s.wb_promotion_cost_total ?? null,
  },
  {
    id: 'tax',
    label: 'Налог',
    section: 'expenses',
    kind: 'currency',
    isNegativeMetric: true,
    extract: s => s.tax?.tax_amount ?? null,
  },
] as const

/** Rows belonging to a section, in declaration order. */
export function rowsForSection(sectionId: string): FinanceHistoryRow[] {
  return FINANCE_HISTORY_ROWS.filter(r => r.section === sectionId)
}
