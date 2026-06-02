/**
 * Funnel conversion anomaly detector — Defensive Frontend Principle.
 *
 * A funnel conversion is impossible when it exceeds 100% or buyouts exceed
 * orders — the backend aggregates buyoutCount on a different basis than
 * orders/openCard (tech ticket #197). The funnel should be monotonically
 * decreasing (openCard ≥ cart ≥ orders ≥ buyout) and conversion ≤ 100%.
 * (NOTE: this detector covers ONLY the buyout/total-conversion break — the
 * dominant live anomaly per #197; it does not check openCard<cart or cart<orders
 * mid-funnel inversions.) Distinct from #191 (flat daily series + buyoutConversion formula).
 *
 * Per the Defensive Frontend Principle (CLAUDE.md / CLAUDE-PATTERNS.md):
 * INDICATE the anomaly + preserve the raw value — never clamp or hide it.
 * Reference: docs/request-backend/197-FUNNEL-CONVERSION-EXCEEDS-100.md.
 */
export function isFunnelConversionAnomalous(x: {
  totalConversion: number
  buyoutCount: number
  ordersCount: number
}): boolean {
  return x.totalConversion > 100 || (x.ordersCount > 0 && x.buyoutCount > x.ordersCount)
}

export const FUNNEL_CONVERSION_ANOMALY_MESSAGE =
  'Невозможное значение конверсии (>100% или выкупов больше, чем заказов) — бэкенд агрегирует выкупы иначе, чем заказы и открытия карточки (тех. задача #197). Значение показано без изменений.'
