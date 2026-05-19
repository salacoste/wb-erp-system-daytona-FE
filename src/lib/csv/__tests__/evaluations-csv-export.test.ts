import { describe, it, expect } from 'vitest'
import { exportEvaluationsToCsv } from '../evaluations-csv-export'
import type { EvaluationEntry } from '@/types/ai/evaluations'

// ── Fixtures ────────────────────────────────────────────────────────────────

const baseEntry: EvaluationEntry = {
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

const nullMapeEntry: EvaluationEntry = {
  ...baseEntry,
  forecastId: 'fc-002',
  mapeUnits: null,
  mapeRevenue: null,
}

const nullNmIdEntry: EvaluationEntry = {
  ...baseEntry,
  forecastId: 'fc-003',
  nmId: null,
}

const commaEntry: EvaluationEntry = {
  ...baseEntry,
  forecastId: 'fc-comma, test',
  nmId: 99,
}

const quoteEntry: EvaluationEntry = {
  ...baseEntry,
  forecastId: 'fc-"quote"',
  nmId: 100,
}

const newlineEntry: EvaluationEntry = {
  ...baseEntry,
  forecastId: 'fc-line1\nline2',
  nmId: 101,
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('exportEvaluationsToCsv', () => {
  describe('UTF-8 BOM', () => {
    it('first character is BOM (U+FEFF)', () => {
      const csv = exportEvaluationsToCsv([])
      expect(csv.charCodeAt(0)).toBe(0xfeff)
    })

    it('BOM present even with data rows', () => {
      const csv = exportEvaluationsToCsv([baseEntry])
      expect(csv.charCodeAt(0)).toBe(0xfeff)
    })
  })

  describe('Russian headers', () => {
    it('contains all 10 Russian column headers', () => {
      const csv = exportEvaluationsToCsv([])
      expect(csv).toContain('Дата оценки')
      expect(csv).toContain('ID прогноза')
      expect(csv).toContain('Артикул')
      expect(csv).toContain('Прогноз (ед.)')
      expect(csv).toContain('Факт (ед.)')
      expect(csv).toContain('Прогноз (выручка)')
      expect(csv).toContain('Факт (выручка)')
      expect(csv).toContain('MAPE (ед.)')
      expect(csv).toContain('MAPE (выручка)')
      expect(csv).toContain('Горизонт (дней)')
    })
  })

  describe('empty array', () => {
    it('returns BOM + headers only — no error, no data rows', () => {
      const csv = exportEvaluationsToCsv([])
      const lines = csv.slice(1).split('\r\n') // strip BOM
      expect(lines).toHaveLength(1) // header only
      expect(lines[0]).toContain('Дата оценки')
    })
  })

  describe('AP#8 null MAPE → em-dash', () => {
    it('null mapeUnits renders em-dash (U+2014), not 0', () => {
      const csv = exportEvaluationsToCsv([nullMapeEntry])
      // Em-dash must appear in data (mapeUnits column)
      expect(csv).toContain('—')
      // Must NOT contain bare zero in MAPE position
      const lines = csv.slice(1).split('\r\n')
      const dataRow = lines[1]
      const cells = dataRow.split(',')
      // MAPE (ед.) is column 7 (0-indexed), MAPE (выручка) is column 8
      expect(cells[7]).toBe('—')
      expect(cells[8]).toBe('—')
    })

    it('null nmId renders em-dash', () => {
      const csv = exportEvaluationsToCsv([nullNmIdEntry])
      const lines = csv.slice(1).split('\r\n')
      const dataRow = lines[1]
      const cells = dataRow.split(',')
      expect(cells[2]).toBe('—')
    })
  })

  describe('cell escaping', () => {
    it('forecastId with comma is wrapped in double quotes', () => {
      const csv = exportEvaluationsToCsv([commaEntry])
      expect(csv).toContain('"fc-comma, test"')
    })

    it('forecastId with double-quote doubles embedded quotes', () => {
      const csv = exportEvaluationsToCsv([quoteEntry])
      expect(csv).toContain('"fc-""quote"""')
    })

    it('forecastId with newline is wrapped in double quotes', () => {
      const csv = exportEvaluationsToCsv([newlineEntry])
      expect(csv).toContain('"fc-line1\nline2"')
    })
  })

  describe('Russian locale formatting', () => {
    it('MAPE percentage uses Russian decimal comma format', () => {
      const csv = exportEvaluationsToCsv([baseEntry])
      // formatPercentage(12.5) → "12,5 %" (ru-RU locale, comma decimal separator)
      expect(csv).toMatch(/12,5\s*%/)
    })

    it('date uses DD.MM.YYYY format', () => {
      const csv = exportEvaluationsToCsv([baseEntry])
      // evaluationDate '2026-05-17' → formatDate → '17.05.2026'
      expect(csv).toContain('17.05.2026')
    })

    it('nmId rendered as plain string — no locale separator', () => {
      const csv = exportEvaluationsToCsv([baseEntry])
      // String(12345) = '12345', NOT '12 345' (no non-breaking space from formatNumber)
      expect(csv).toContain('12345')
    })
  })

  describe('opaque IDs', () => {
    it('forecastId rendered raw without transformation', () => {
      const csv = exportEvaluationsToCsv([baseEntry])
      expect(csv).toContain('fc-001')
    })
  })

  describe('data row count', () => {
    it('two entries produce header + two data rows', () => {
      const csv = exportEvaluationsToCsv([baseEntry, nullMapeEntry])
      const lines = csv.slice(1).split('\r\n')
      expect(lines).toHaveLength(3) // header + 2 rows
    })
  })
})
