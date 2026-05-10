/**
 * Shared empty-fixture factories for Acquiring Analytics tests.
 * Story 96.9-FE — Pattern 3 hygiene (CLAUDE.md § Multi-Source Orchestration & Visualization Patterns).
 *
 * Mirrors the `monitor-empty.ts` precedent (Story 92.6-FE — first canonical
 * Pattern 3 module). Consumed by both unit tests and E2E helpers if needed.
 *
 * Convention: money fields use null per CLAUDE.md anti-pattern #8
 *   (null = "unknown / not yet calculated"; 0 ₽ would mislead).
 *   IDs and counts use 0 (legitimate zero).
 *   Dates and names use empty string (matches normalizer fallback at
 *   `src/lib/api/acquiring-normalizer.ts` `toStringOrEmpty`).
 *
 * @see src/types/acquiring-analytics.ts
 * @see src/lib/api/acquiring-normalizer.ts
 */

import type {
  AcquiringDetailResponse,
  AcquiringListResponse,
  AcquiringReportDetailItem,
  AcquiringReportListItem,
} from '@/types/acquiring-analytics'

/**
 * Empty list-endpoint response — `data: []`, `cachedAt: ''`.
 * Triggers the "Отчёты за выбранный период не найдены" empty-state in
 * `AcquiringPageContent`.
 */
export function emptyAcquiringListResponse(): AcquiringListResponse {
  return {
    data: [],
    cachedAt: '',
  }
}

/**
 * Empty detail-endpoint response — `data: []`, `cachedAt: ''`.
 * Used by both `GET /acquiring/reports/:id/detail` and
 * `GET /acquiring/detail?from=&to=` consumers.
 */
export function emptyAcquiringDetailResponse(): AcquiringDetailResponse {
  return {
    data: [],
    cachedAt: '',
  }
}

/**
 * Single empty list-row factory — money fields = null, IDs = 0,
 * dates/strings = ''. Useful for testing column-rendering edge cases
 * (null → '—' rendering, anomaly indicators).
 */
export function emptyAcquiringReport(): AcquiringReportListItem {
  return {
    reportId: 0,
    sellerFinanceName: '',
    dateFrom: '',
    dateTo: '',
    createDate: '',
    currency: '',
    acquiringFeeSum: null,
    acquiringFeeVatSum: null,
  }
}

/**
 * Single empty detail-row (transaction) factory — money fields = null,
 * IDs and counts = 0, dates/strings = ''.
 */
export function emptyAcquiringTransaction(): AcquiringReportDetailItem {
  return {
    rrdId: 0,
    reportId: 0,
    acqDate: '',
    acquiringBank: '',
    saleDate: '',
    srid: '',
    docTypeName: '',
    nmId: 0,
    retailAmount: null,
    acquiringFee: null,
    acquiringFeeVat: null,
    currency: '',
  }
}
