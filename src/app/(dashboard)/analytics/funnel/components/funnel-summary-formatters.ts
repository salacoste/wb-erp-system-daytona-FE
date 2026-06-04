/** Funnel summary card formatters — extracted from FunnelSummaryCards.tsx (Story 73.2-FE) to keep it under the 200-line cap. */

export function formatNumber(n: number): string {
  return n.toLocaleString('ru-RU')
}

// locale-percent-allow: card value renders inline (1-decimal ru-RU) consistent with sibling delta/legacy funnel cards
export function formatPercent(n: number): string {
  return `${n.toLocaleString('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`
}
