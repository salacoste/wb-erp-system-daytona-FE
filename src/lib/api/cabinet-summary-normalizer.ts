import type { CabinetSummaryResponse } from '@/types/analytics'

/** Request #56: the cabinet-summary endpoint sends summary.totals.wb_services_breakdown
 *  {promotion,jam,other}, NOT the flat wb_*_cost fields the P&L waterfall reads
 *  (OtherAdjustmentsRows.tsx). Map breakdown → flat so the
 *  → WB.Продвижение / → Джем / → Прочие сервисы sub-rows render.
 *  Prefer an existing flat value if the backend ever sends one; else the breakdown.
 *  AP#8: money → null (never ?? 0) — the component's `> 0` display-guard hides null/0 rows.
 *  Note: totals is nested under `summary` per CabinetSummaryResponse (request #56 § contract). */
export function normalizeCabinetSummaryResponse(
  raw: CabinetSummaryResponse
): CabinetSummaryResponse {
  const totals = raw?.summary?.totals
  if (!totals) return raw
  const bd = totals.wb_services_breakdown
  return {
    ...raw,
    summary: {
      ...raw.summary,
      totals: {
        ...totals,
        wb_promotion_cost: totals.wb_promotion_cost ?? bd?.promotion ?? null,
        wb_jam_cost: totals.wb_jam_cost ?? bd?.jam ?? null,
        wb_other_services_cost: totals.wb_other_services_cost ?? bd?.other ?? null,
      },
    },
  }
}
