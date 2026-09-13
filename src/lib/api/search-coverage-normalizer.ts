import { asRecord } from '@/lib/api/normalizer-helpers'
import type {
  SearchAnalyticsCoverage,
  SearchAnalyticsCoverageStatus,
  SearchAnalyticsDataStatus,
} from '@/types/search-analytics'

const COVERAGE_STATUS_VALUES: readonly SearchAnalyticsCoverageStatus[] = [
  'complete',
  'partial',
  'uncovered',
  'unknown',
  'error',
]

/** Cast-free membership guard — the sole authority for status literals (Pass-1 L6). */
function parseCoverageStatus(value: unknown): SearchAnalyticsCoverageStatus | undefined {
  return COVERAGE_STATUS_VALUES.find(status => status === value)
}

const DAY_MS = 86_400_000

function parseIsoDate(value: unknown): number | null {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const timestamp = Date.parse(`${value}T00:00:00.000Z`)
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString().slice(0, 10) === value
    ? timestamp
    : null
}

function expectedDates(period?: { from: string; to: string }): string[] | null {
  if (!period) return null
  const start = parseIsoDate(period.from)
  const end = parseIsoDate(period.to)
  if (start == null || end == null || start > end) return []
  const values: string[] = []
  for (let cursor = start; cursor <= end; cursor += DAY_MS) {
    values.push(new Date(cursor).toISOString().slice(0, 10))
  }
  return values
}

function dates(raw: unknown): { values: string[]; valid: boolean } {
  if (!Array.isArray(raw)) return { values: [], valid: false }
  const values = raw.filter((value): value is string => typeof value === 'string')
  const valid =
    values.length === raw.length &&
    values.every(value => parseIsoDate(value) != null) &&
    new Set(values).size === values.length
  return { values: [...values].sort(), valid }
}

function strictCoverageCount(value: unknown): number | null {
  return typeof value === 'number' &&
    Number.isFinite(value) &&
    Number.isInteger(value) &&
    value >= 0
    ? value
    : null
}

function isContiguousDatePartition(values: string[]): boolean {
  if (values.length === 0) return false
  for (let index = 1; index < values.length; index += 1) {
    const previous = parseIsoDate(values[index - 1])
    const current = parseIsoDate(values[index])
    if (previous == null || current == null || current - previous !== DAY_MS) return false
  }
  return true
}

/**
 * Canonical fail-closed coverage: no authority, no counts, no dates. 'error' is kept
 * ONLY for an explicit retrieval failure — never synthesized here. Fresh arrays per
 * call so consumers (fixtures, test literals) can never mutate a shared instance.
 */
export function unknownSearchCoverage(
  status: 'unknown' | 'error' = 'unknown'
): SearchAnalyticsCoverage {
  return {
    coverageKnown: false,
    requestedDayCount: 0,
    coveredDayCount: 0,
    missingDayCount: 0,
    coverageComplete: false,
    coveredDates: [],
    missingDates: [],
    status,
  }
}

export function normalizeSearchCoverage(
  raw: unknown,
  expectedPeriod?: { from: string; to: string }
): SearchAnalyticsCoverage {
  const r = asRecord(raw)
  const normalizedCovered = dates(r.coveredDates)
  const normalizedMissing = dates(r.missingDates)
  const coveredDates = normalizedCovered.values
  const missingDates = normalizedMissing.values
  const rawRequestedDayCount = strictCoverageCount(r.requestedDayCount)
  const rawCoveredDayCount = strictCoverageCount(r.coveredDayCount)
  const rawMissingDayCount = strictCoverageCount(r.missingDayCount)
  const requestedDayCount = rawRequestedDayCount ?? -1
  const partitionDates = [...coveredDates, ...missingDates].sort()
  const coverageKnown = r.coverageKnown === true
  const requestedDates = expectedDates(expectedPeriod)
  const requestedSet = requestedDates === null ? null : new Set(requestedDates)
  const rawStatus = parseCoverageStatus(r.status)
  const validPartition =
    coverageKnown &&
    rawRequestedDayCount !== null &&
    rawCoveredDayCount !== null &&
    rawMissingDayCount !== null &&
    requestedDayCount > 0 &&
    (requestedDates === null || requestedDates.length > 0) &&
    normalizedCovered.valid &&
    normalizedMissing.valid &&
    isContiguousDatePartition(partitionDates) &&
    requestedDayCount === coveredDates.length + missingDates.length &&
    rawCoveredDayCount === coveredDates.length &&
    rawMissingDayCount === missingDates.length &&
    !coveredDates.some(date => missingDates.includes(date)) &&
    (requestedSet === null ||
      (requestedDayCount === requestedDates?.length &&
        [...coveredDates, ...missingDates].every(date => requestedSet.has(date)) &&
        requestedDates.every(
          date => coveredDates.includes(date) || missingDates.includes(date)
        ))) &&
    rawStatus !== undefined &&
    rawStatus !== 'unknown' &&
    rawStatus !== 'error'

  if (!validPartition) {
    const unavailableStatus = !coverageKnown && rawStatus === 'error' ? 'error' : 'unknown'
    return unknownSearchCoverage(unavailableStatus)
  }
  const coverageComplete = missingDates.length === 0
  const expectedStatus = coverageComplete
    ? 'complete'
    : coveredDates.length > 0
      ? 'partial'
      : 'uncovered'
  if (r.coverageComplete !== coverageComplete || rawStatus !== expectedStatus) {
    return unknownSearchCoverage()
  }
  return {
    coverageKnown: true,
    requestedDayCount,
    coveredDayCount: coveredDates.length,
    missingDayCount: missingDates.length,
    coverageComplete,
    coveredDates,
    missingDates,
    status: rawStatus,
  }
}

export function normalizeSearchDataStatus(raw: unknown): SearchAnalyticsDataStatus {
  return parseCoverageStatus(raw) ?? (raw === 'no_data' ? 'no_data' : 'unknown')
}
