/**
 * Profit-waterfall model (TZ-2).
 *
 * Pure helper that assembles the P&L chain rows for the ProfitWaterfallCard's
 * expanded breakdown: `Revenue → −COGS → Gross → −Logistics/Storage/Commissions
 * → Operating → −Tax → Net`, plus the two margin-% rows. Subtotal rows (gross,
 * operating, net) are flagged for emphasis; each row carries a sign marker.
 *
 * Values are the backend's own figures (not FE-recomputed) — the waterfall is a
 * labelled presentation of the P&L structure, not a reconciliation. `null` is
 * preserved for missing values (rendered as "—").
 *
 * @see docs/ux/IMPLEMENTATION-TZ.md (TZ-2)
 */

export type WaterfallSign = '+' | '-' | '='

export interface ProfitWaterfallRow {
  id: string
  label: string
  value: number | null
  sign: WaterfallSign
  /** Subtotal/total rows (gross, operating, net) render emphasized. */
  emphasis: boolean
  /** Margin-% rows render with % formatting and no leading sign. */
  isPercentage: boolean
}

export interface ProfitWaterfallInput {
  revenue: number | undefined
  cogs: number | undefined
  gross: number | undefined
  logistics: number | undefined
  storage: number | undefined
  commissionsComponents: Array<number | undefined>
  operating: number | undefined
  tax: number | undefined
  net: number | undefined
  grossMarginPct: number | undefined
  marginPct: number | undefined
}

/** Sum the defined components; null when none are present (so the row shows "—"). */
function sumOrNone(components: Array<number | undefined>): number | null {
  if (!components.some(v => v != null)) return null
  return components.reduce<number>((acc, v) => acc + (v ?? 0), 0)
}

/**
 * Build the ordered P&L waterfall rows. Sign convention: revenue `+`,
 * deductions (COGS, logistics, storage, commissions, tax) `-`, subtotals
 * (gross, operating, net) `=`. Margin rows are unsigned percentages.
 */
export function buildProfitWaterfall(input: ProfitWaterfallInput): ProfitWaterfallRow[] {
  const commissions = sumOrNone(input.commissionsComponents)
  return [
    {
      id: 'revenue',
      label: 'Выручка',
      value: input.revenue ?? null,
      sign: '+',
      emphasis: false,
      isPercentage: false,
    },
    {
      id: 'cogs',
      label: 'Себестоимость',
      value: input.cogs ?? null,
      sign: '-',
      emphasis: false,
      isPercentage: false,
    },
    {
      id: 'gross',
      label: 'Валовая прибыль',
      value: input.gross ?? null,
      sign: '=',
      emphasis: true,
      isPercentage: false,
    },
    {
      id: 'logistics',
      label: 'Логистика',
      value: input.logistics ?? null,
      sign: '-',
      emphasis: false,
      isPercentage: false,
    },
    {
      id: 'storage',
      label: 'Хранение',
      value: input.storage ?? null,
      sign: '-',
      emphasis: false,
      isPercentage: false,
    },
    {
      id: 'commissions',
      label: 'Комиссии WB',
      value: commissions,
      sign: '-',
      emphasis: false,
      isPercentage: false,
    },
    {
      id: 'operating',
      label: 'Операционная прибыль',
      value: input.operating ?? null,
      sign: '=',
      emphasis: true,
      isPercentage: false,
    },
    {
      id: 'tax',
      label: 'Налог',
      value: input.tax ?? null,
      sign: '-',
      emphasis: false,
      isPercentage: false,
    },
    {
      id: 'net',
      label: 'Чистая прибыль',
      value: input.net ?? null,
      sign: '=',
      emphasis: true,
      isPercentage: false,
    },
    // Margin-% rows: `sign` is ignored by the renderer (isPercentage suppresses the glyph);
    // kept as '+' only to satisfy the WaterfallSign union. Unsigned percentages by design.
    {
      id: 'grossMargin',
      label: 'Валовая маржа',
      value: input.grossMarginPct ?? null,
      sign: '+',
      emphasis: false,
      isPercentage: true,
    },
    {
      id: 'margin',
      label: 'Маржа',
      value: input.marginPct ?? null,
      sign: '+',
      emphasis: false,
      isPercentage: true,
    },
  ]
}
