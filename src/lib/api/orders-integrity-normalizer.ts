/**
 * Orders Integrity — Boundary Normalizer
 *
 * Normalizes raw backend responses from the integrity and reconciliation
 * endpoints into the frontend-canonical shapes defined in src/types/orders-integrity.ts.
 *
 * Responsibilities:
 *   - snake_case → camelCase via dual-lookup on every field
 *   - Null-vs-zero: count fields coerced to 0 (counts; zero is legitimate)
 *   - NaN guard on all numeric conversions via Number.isFinite
 *   - Ratio/money fields → toNullableNumber (null renders '—')
 *
 * @see src/types/orders-integrity.ts
 * @see CLAUDE.md § Boundary Normalizer Pattern
 */

import type {
  CheckPassStatus,
  CheckResult,
  IntegrityCheckStatus,
  OrdersIntegrityResponse,
  ReconciliationByDate,
  ReconciliationByStatus,
  ReconciliationReport,
} from '@/types/orders-integrity'
import { toCount, toNullableNumber, toStr } from '@/lib/api/normalizer-helpers'

// ---------------------------------------------------------------------------
// Enum coercion
// ---------------------------------------------------------------------------

const VALID_STATUSES: ReadonlySet<IntegrityCheckStatus> = new Set([
  'healthy',
  'warning',
  'unhealthy',
])

function toIntegrityStatus(raw: unknown): IntegrityCheckStatus {
  const s = String(raw ?? '')
  return VALID_STATUSES.has(s as IntegrityCheckStatus) ? (s as IntegrityCheckStatus) : 'unhealthy'
}

const VALID_CHECK_STATUSES: ReadonlySet<CheckPassStatus> = new Set(['pass', 'warn', 'fail'])

function toCheckPassStatus(raw: unknown): CheckPassStatus {
  const s = String(raw ?? '')
  return VALID_CHECK_STATUSES.has(s as CheckPassStatus) ? (s as CheckPassStatus) : 'fail'
}

// ---------------------------------------------------------------------------
// Integrity health normalizer
// ---------------------------------------------------------------------------

/**
 * Normalizes the /health/orders-integrity response.
 * This endpoint is NOT wrapped in { data: ... } — raw response is the payload.
 */
export function normalizeIntegrityResponse(raw: unknown): OrdersIntegrityResponse {
  const r = (raw ?? {}) as Record<string, unknown>
  const rawChecks = (r.checks ?? {}) as Record<string, unknown>

  const checks: Record<string, CheckResult> = {}
  for (const [key, value] of Object.entries(rawChecks)) {
    const d = (value ?? {}) as Record<string, unknown>
    checks[key] = {
      status: toCheckPassStatus(d.status),
      count: toCount(d.count),
    }
  }

  return {
    status: toIntegrityStatus(r.status),
    checks,
    lastCheck: toStr(r.last_check ?? r.lastCheck),
    durationMs: toCount(r.duration_ms ?? r.durationMs),
  }
}

// ---------------------------------------------------------------------------
// Reconciliation normalizer
// ---------------------------------------------------------------------------

function normalizeByStatus(raw: unknown): ReconciliationByStatus {
  const d = (raw ?? {}) as Record<string, unknown>
  return {
    status: toStr(d.status),
    localCount: toCount(d.local_count ?? d.localCount),
    expectedCount: toCount(d.expected_count ?? d.expectedCount),
    variance: toCount(d.variance),
    variancePercent: toNullableNumber(d.variance_percent ?? d.variancePercent),
  }
}

function normalizeByDate(raw: unknown): ReconciliationByDate {
  const d = (raw ?? {}) as Record<string, unknown>
  return {
    date: toStr(d.date),
    localCount: toCount(d.local_count ?? d.localCount),
    expectedCount: toCount(d.expected_count ?? d.expectedCount),
    variance: toCount(d.variance),
    variancePercent: toNullableNumber(d.variance_percent ?? d.variancePercent),
  }
}

/**
 * Normalizes GET /v1/orders/reconciliation response.
 * Standard { data: {...}, meta: {...} } envelope — apiClient auto-unwraps data.
 */
export function normalizeReconciliationResponse(raw: unknown): ReconciliationReport {
  const d = (raw ?? {}) as Record<string, unknown>
  return {
    totalCount: toCount(d.total_count ?? d.totalCount),
    localCount: toCount(d.local_count ?? d.localCount),
    expectedCount: toCount(d.expected_count ?? d.expectedCount),
    variance: toCount(d.variance),
    variancePercent: toNullableNumber(d.variance_percent ?? d.variancePercent),
    byStatus: Array.isArray(d.by_status ?? d.byStatus)
      ? ((d.by_status ?? d.byStatus) as unknown[]).map(normalizeByStatus)
      : [],
    byDate: Array.isArray(d.by_date ?? d.byDate)
      ? ((d.by_date ?? d.byDate) as unknown[]).map(normalizeByDate)
      : [],
  }
}
