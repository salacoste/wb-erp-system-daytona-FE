/**
 * AI Trends + Sneak Preview types — frontend-canonical shapes
 * Endpoints: GET /v1/ai/trends, GET /v1/ai/sneak-preview
 * Source: docs/AI-FRONTEND-INTEGRATION-GUIDE.md § sneak_preview state
 */

/** Top SKU entry from /v1/ai/trends — pure SQL, no ML */
export interface TopSkuEntry {
  nmId: number
  vendorCode: string | null
  /** Average units sold per day — null when backend omits */
  avgPerDay: number | null
  /** Total weekly sales volume — null when backend omits */
  weeklyVolume: number | null
}

export interface AiTrendsResponse {
  /** Top SKUs by sales volume — ordered descending */
  topSkus: TopSkuEntry[]
}

/**
 * Trend direction for sneak-preview SKU forecasts.
 * Defensive default: unknown values fall back to 'stable'.
 */
export type TrendDirection = 'up' | 'stable' | 'down'

export const TREND_DIRECTIONS: readonly TrendDirection[] = ['up', 'stable', 'down'] as const

export function isTrendDirection(value: string): value is TrendDirection {
  return (TREND_DIRECTIONS as readonly string[]).includes(value)
}

/** Per-SKU sneak-preview forecast entry */
export interface SneakPreviewSkuForecast {
  nmId: number
  vendorCode: string | null
  /** Average units per day — null when backend omits */
  avgPerDay: number | null
  /** Trend direction — defaults to 'stable' for unknown values */
  trend: TrendDirection
  /** 7-day predicted range — null when backend omits bounds */
  estimatedRange: {
    low: number | null
    high: number | null
  }
}

export interface AiSneakPreviewResponse {
  /** Always display — explains low-confidence status to the user */
  disclaimer: string
  /** Low-confidence per-SKU forecasts */
  skuForecasts: SneakPreviewSkuForecast[]
}
