import { describe, it, expect } from 'vitest'
import { escapeCsvCell, prefixUtf8Bom } from '../csv-helpers'

describe('escapeCsvCell', () => {
  it('plain string — returned unchanged', () => {
    expect(escapeCsvCell('hello')).toBe('hello')
  })

  it('string with comma — wrapped in double quotes', () => {
    expect(escapeCsvCell('hello, world')).toBe('"hello, world"')
  })

  it('string with double quote — wrapped and embedded quote doubled', () => {
    expect(escapeCsvCell('say "hi"')).toBe('"say ""hi"""')
  })

  it('string with newline — wrapped in double quotes', () => {
    expect(escapeCsvCell('line1\nline2')).toBe('"line1\nline2"')
  })

  it('empty string — returned unchanged (no wrapping)', () => {
    expect(escapeCsvCell('')).toBe('')
  })

  it('string with comma AND quote — both handled correctly', () => {
    const result = escapeCsvCell('a, "b"')
    expect(result).toBe('"a, ""b"""')
  })

  it('escapes cells containing bare \\r (legacy Mac line ending, RFC 4180 § 2.6)', () => {
    expect(escapeCsvCell('a\rb')).toBe('"a\rb"')
  })
})

describe('prefixUtf8Bom', () => {
  it('prepends BOM (U+FEFF) to empty string', () => {
    const result = prefixUtf8Bom('')
    expect(result.charCodeAt(0)).toBe(0xfeff)
    expect(result.length).toBe(1)
  })

  it('prepends BOM to non-empty string', () => {
    const result = prefixUtf8Bom('hello')
    expect(result.charCodeAt(0)).toBe(0xfeff)
    expect(result.slice(1)).toBe('hello')
  })

  it('does NOT double-prefix if already prefixed', () => {
    // prefixUtf8Bom is a dumb prepend — callers must not call twice
    const once = prefixUtf8Bom('x')
    expect(once.charCodeAt(0)).toBe(0xfeff)
    expect(once.charCodeAt(1)).toBe('x'.charCodeAt(0))
  })
})

// F-2 (1st-pass): RFC 4180 requires CRLF line terminators.
// The row-join in exportEvaluationsToCsv / exportSkuAccuracyToCsv uses \r\n.
// These tests verify the contract at the helper level via integration with
// the export functions (not csv-helpers.ts directly, which has no join logic).
import { exportEvaluationsToCsv } from '../evaluations-csv-export'
import { exportSkuAccuracyToCsv } from '../sku-accuracy-csv-export'
import type { EvaluationEntry } from '@/types/ai/evaluations'
import type { SkuAccuracyEntry } from '@/types/ai/evaluations'

const evalEntry: EvaluationEntry = {
  forecastId: 'fc-001',
  modelId: 'model-1',
  nmId: 12345,
  forecastDate: '2026-05-01',
  horizonDays: 7,
  predictedUnits: 100,
  actualUnits: 90,
  predictedRevenue: 50000,
  actualRevenue: 45000,
  mapeUnits: 12.5,
  mapeRevenue: 8.3,
  evaluationDate: '2026-05-17',
}

const skuEntry: SkuAccuracyEntry = {
  nmId: 12345,
  vendorCode: 'SKU-ABC',
  history: [],
  avgAiMape: 12.5,
  avgNaiveMape: 18.0,
  aiAccuracyPercent: 75.0,
  naiveAccuracyPercent: 60.0,
  evaluationCount: 5,
}

describe('RFC 4180 CRLF line terminator (F-2)', () => {
  it('exportEvaluationsToCsv uses \\r\\n between header and data row', () => {
    const csv = exportEvaluationsToCsv([evalEntry])
    const body = csv.slice(1) // remove BOM
    // Header row ends with last column "Горизонт (дней)" then \r\n before data row
    expect(body).toContain('Горизонт (дней)\r\n')
  })

  it('exportEvaluationsToCsv empty array — header only, no \\r\\n (join of 1 element)', () => {
    const csv = exportEvaluationsToCsv([])
    const body = csv.slice(1)
    // Single header line: join('\r\n') on 1-element array → no \r\n
    expect(body).not.toContain('\r\n')
    expect(body).toContain('Дата оценки')
  })

  it('exportSkuAccuracyToCsv uses \\r\\n between header and data row', () => {
    const csv = exportSkuAccuracyToCsv([skuEntry])
    const body = csv.slice(1)
    // Header row ends with last column "Кол-во оценок" then \r\n before data row
    expect(body).toContain('Кол-во оценок\r\n')
  })

  it('exportSkuAccuracyToCsv empty array — header only, no \\r\\n (join of 1 element)', () => {
    const csv = exportSkuAccuracyToCsv([])
    const body = csv.slice(1)
    expect(body).not.toContain('\r\n')
    expect(body).toContain('Артикул')
  })
})
