/**
 * Test fixtures for Price Recommendation History (Story 122.2-FE).
 */

import type { PriceRecommendationHistoryPoint } from '@/types/price-recommendations'

export const mockSingleHistoryPoint: PriceRecommendationHistoryPoint = {
  weekStart: '2026-05-26',
  lastPrice: 2500,
  recommendedPrice: 2250,
  breakEvenPrice: 1800,
  marginAtCurrentPct: 15.5,
  marginAtRecPct: 20,
  gap: 250,
  gapPct: 11.1,
  targetMarginPct: 20,
  recomputationCount: 3,
}

export const mockPriceHistoryNormalized: PriceRecommendationHistoryPoint[] = [
  {
    weekStart: '2026-05-12',
    lastPrice: 2600,
    recommendedPrice: 2300,
    breakEvenPrice: 1850,
    marginAtCurrentPct: 14.2,
    marginAtRecPct: 19.5,
    gap: 300,
    gapPct: 13,
    targetMarginPct: 20,
    recomputationCount: 2,
  },
  {
    weekStart: '2026-05-19',
    lastPrice: 2550,
    recommendedPrice: 2275,
    breakEvenPrice: 1825,
    marginAtCurrentPct: 14.8,
    marginAtRecPct: 19.8,
    gap: 275,
    gapPct: 12.1,
    targetMarginPct: 20,
    recomputationCount: 1,
  },
  {
    weekStart: '2026-05-26',
    lastPrice: 2500,
    recommendedPrice: 2250,
    breakEvenPrice: 1800,
    marginAtCurrentPct: 15.5,
    marginAtRecPct: 20,
    gap: 250,
    gapPct: 11.1,
    targetMarginPct: 20,
    recomputationCount: 3,
  },
]

/** Raw backend shape (before normalization) — DESC order as backend returns */
export const mockPriceHistoryRaw = [
  {
    weekStart: '2026-05-26',
    lastPrice: 2500,
    recommendedPrice: 2250,
    breakEvenPrice: 1800,
    marginAtCurrentPct: 15.5,
    marginAtRecPct: 20,
    gap: 250,
    gapPct: 11.1,
    targetMarginPct: 20,
    recomputationCount: 3,
  },
  {
    weekStart: '2026-05-19',
    lastPrice: 2550,
    recommendedPrice: 2275,
    breakEvenPrice: 1825,
    marginAtCurrentPct: 14.8,
    marginAtRecPct: 19.8,
    gap: 275,
    gapPct: 12.1,
    targetMarginPct: 20,
    recomputationCount: 1,
  },
  {
    weekStart: '2026-05-12',
    lastPrice: 2600,
    recommendedPrice: 2300,
    breakEvenPrice: 1850,
    marginAtCurrentPct: 14.2,
    marginAtRecPct: 19.5,
    gap: 300,
    gapPct: 13,
    targetMarginPct: 20,
    recomputationCount: 2,
  },
]

export const mockEmptyHistoryResponse: PriceRecommendationHistoryPoint[] = []
