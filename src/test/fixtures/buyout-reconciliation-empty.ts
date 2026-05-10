/**
 * Shared empty-fixture factories for Buyout Reconciliation tests.
 * Story 96.14-FE — Pattern 3 hygiene (CLAUDE.md § Multi-Source Orchestration).
 *
 * Mirrors the `monitor-empty.ts` precedent (Story 92.6-FE — first canonical
 * Pattern 3 module). Consumed by both unit tests and E2E helpers if needed.
 *
 * Convention: count fields use 0 (legitimate zero — zero anomalies is a success state).
 *   Dates/strings use empty string (matches normalizer fallback `toStr`).
 *   Note: ALL fields in ReconciliationItem are `number` or `string` (no null fields).
 *   Per backend contract, count fields are non-null (0 is OK per CLAUDE.md anti-pattern #8
 *   scope rule — counts, not money/ratio fields).
 *
 * @see src/types/buyout-reconciliation.ts
 * @see src/lib/api/buyout-reconciliation-normalizer.ts
 * @see src/test/fixtures/monitor-empty.ts (Pattern 3 canonical — Story 92.6-FE)
 * @see src/test/fixtures/fbs-stock-empty.ts (Pattern 3 sibling — Story 96.11-FE)
 */

import type {
  BuyoutReconciliationResponse,
  ReconciliationItem,
} from '@/types/buyout-reconciliation'

// ---------------------------------------------------------------------------
// Per-row item factories
// ---------------------------------------------------------------------------

/**
 * Empty reconciliation item — all counts = 0, strings = ''.
 * Useful as baseline for overrides in specific test scenarios.
 */
export function emptyReconciliationItem(): ReconciliationItem {
  return {
    nmId: 0,
    productName: '',
    brand: '',
    buyoutQuantity: 0,
    returnQuantity: 0,
    returnWithoutBuyout: 0,
    orphanBuyout: 0,
    returnQuantityMismatch: 0,
    source: 'unknown',
  }
}

/**
 * Item with all 3 anomaly counts = 0 — represents a "clean" SKU row.
 * Used to test the "no anomalies" success branch (green check state).
 */
export function noAnomalyItem(): ReconciliationItem {
  return {
    nmId: 100,
    productName: 'Тест без аномалий',
    brand: 'Brand A',
    buyoutQuantity: 50,
    returnQuantity: 5,
    returnWithoutBuyout: 0,
    orphanBuyout: 0,
    returnQuantityMismatch: 0,
    source: 'blended',
  }
}

/**
 * Item with all 3 anomaly counts > 0 — represents a row with all anomaly types present.
 * Used to test AlertTriangle indicator rendering for each anomaly column.
 */
export function withAnomalyItem(): ReconciliationItem {
  return {
    nmId: 200,
    productName: 'Тест с аномалиями',
    brand: 'Brand B',
    buyoutQuantity: 80,
    returnQuantity: 10,
    returnWithoutBuyout: 3,
    orphanBuyout: 2,
    returnQuantityMismatch: 1,
    source: 'sdk_reconciliation',
  }
}

// ---------------------------------------------------------------------------
// Response-level factories
// ---------------------------------------------------------------------------

/**
 * Empty response — `data: []`, empty period/generatedAt.
 * Triggers the "Данных по выкупам за выбранный период нет." empty-state.
 */
export function emptyBuyoutReconciliationResponse(): BuyoutReconciliationResponse {
  return {
    data: [],
    period: { from: '', to: '' },
    generatedAt: '',
  }
}

/**
 * Response with one no-anomaly item.
 * Triggers the "Аномалий не найдено за выбранный период." green-check success-state.
 */
export function noAnomalyResponse(): BuyoutReconciliationResponse {
  return {
    data: [noAnomalyItem()],
    period: { from: '2026-04-01', to: '2026-04-30' },
    generatedAt: '2026-05-01T06:30:00.000Z',
  }
}

/**
 * Response with one anomalous item.
 * Triggers the populated table branch with AnomalyIndicator icons.
 */
export function withAnomalyResponse(): BuyoutReconciliationResponse {
  return {
    data: [withAnomalyItem()],
    period: { from: '2026-04-01', to: '2026-04-30' },
    generatedAt: '2026-05-01T06:30:00.000Z',
  }
}
