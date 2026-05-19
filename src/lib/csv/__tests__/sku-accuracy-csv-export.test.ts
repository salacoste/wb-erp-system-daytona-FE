import { describe, it, expect } from 'vitest'
import { exportSkuAccuracyToCsv } from '../sku-accuracy-csv-export'
import type { SkuAccuracyEntry } from '@/types/ai/evaluations'

// ── Fixtures ────────────────────────────────────────────────────────────────

const baseEntry: SkuAccuracyEntry = {
  nmId: 12345,
  vendorCode: 'SKU-ABC',
  history: [],
  avgAiMape: 12.5,
  avgNaiveMape: 18.0,
  aiAccuracyPercent: 75.0,
  naiveAccuracyPercent: 60.0,
  evaluationCount: 5,
}

const nullFieldsEntry: SkuAccuracyEntry = {
  nmId: 99999,
  vendorCode: null,
  history: [],
  avgAiMape: null,
  avgNaiveMape: null,
  aiAccuracyPercent: null,
  naiveAccuracyPercent: null,
  evaluationCount: 0,
}

const nullNmIdEntry: SkuAccuracyEntry = {
  ...baseEntry,
  nmId: null,
  vendorCode: 'SKU-NULL',
}

const commaVendorEntry: SkuAccuracyEntry = {
  ...baseEntry,
  nmId: 200,
  vendorCode: 'SKU, comma',
}

const quoteVendorEntry: SkuAccuracyEntry = {
  ...baseEntry,
  nmId: 201,
  vendorCode: 'SKU "quoted"',
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('exportSkuAccuracyToCsv', () => {
  describe('UTF-8 BOM', () => {
    it('first character is BOM (U+FEFF)', () => {
      const csv = exportSkuAccuracyToCsv([])
      expect(csv.charCodeAt(0)).toBe(0xfeff)
    })

    it('BOM present even with data rows', () => {
      const csv = exportSkuAccuracyToCsv([baseEntry])
      expect(csv.charCodeAt(0)).toBe(0xfeff)
    })
  })

  describe('Russian headers', () => {
    it('contains all 7 column headers', () => {
      const csv = exportSkuAccuracyToCsv([])
      expect(csv).toContain('Артикул')
      expect(csv).toContain('Vendor code')
      expect(csv).toContain('Средний AI MAPE')
      expect(csv).toContain('Средний Naive MAPE')
      expect(csv).toContain('AI точность %')
      expect(csv).toContain('Naive точность %')
      expect(csv).toContain('Кол-во оценок')
    })
  })

  describe('empty array', () => {
    it('returns BOM + headers only — no error, no data rows', () => {
      const csv = exportSkuAccuracyToCsv([])
      const lines = csv.slice(1).split('\r\n')
      expect(lines).toHaveLength(1) // header only
      expect(lines[0]).toContain('Артикул')
    })
  })

  describe('AP#8 null fields → em-dash', () => {
    it('null avgAiMape renders em-dash not 0', () => {
      const csv = exportSkuAccuracyToCsv([nullFieldsEntry])
      const lines = csv.slice(1).split('\r\n')
      const cells = lines[1].split(',')
      // avgAiMape is column 2, avgNaiveMape is column 3
      expect(cells[2]).toBe('—')
      expect(cells[3]).toBe('—')
    })

    it('null aiAccuracyPercent and naiveAccuracyPercent render em-dash', () => {
      const csv = exportSkuAccuracyToCsv([nullFieldsEntry])
      const lines = csv.slice(1).split('\r\n')
      const cells = lines[1].split(',')
      expect(cells[4]).toBe('—')
      expect(cells[5]).toBe('—')
    })

    it('null vendorCode renders em-dash', () => {
      const csv = exportSkuAccuracyToCsv([nullFieldsEntry])
      const lines = csv.slice(1).split('\r\n')
      const cells = lines[1].split(',')
      expect(cells[1]).toBe('—')
    })

    it('null nmId renders em-dash', () => {
      const csv = exportSkuAccuracyToCsv([nullNmIdEntry])
      const lines = csv.slice(1).split('\r\n')
      const cells = lines[1].split(',')
      expect(cells[0]).toBe('—')
    })

    it('evaluationCount = 0 renders "0" (semantic-zero, not em-dash)', () => {
      const csv = exportSkuAccuracyToCsv([nullFieldsEntry])
      const lines = csv.slice(1).split('\r\n')
      const cells = lines[1].split(',')
      // evaluationCount is last column (index 6)
      expect(cells[6]).toBe('0')
    })
  })

  describe('cell escaping', () => {
    it('vendorCode with comma is wrapped in double quotes', () => {
      const csv = exportSkuAccuracyToCsv([commaVendorEntry])
      expect(csv).toContain('"SKU, comma"')
    })

    it('vendorCode with double-quote doubles embedded quotes', () => {
      const csv = exportSkuAccuracyToCsv([quoteVendorEntry])
      expect(csv).toContain('"SKU ""quoted"""')
    })
  })

  describe('Russian locale formatting', () => {
    it('MAPE percentage uses Russian decimal comma format', () => {
      const csv = exportSkuAccuracyToCsv([baseEntry])
      // formatPercentage(12.5) → "12,5 %" (ru-RU locale)
      expect(csv).toMatch(/12,5\s*%/)
    })

    it('nmId rendered as plain string — no locale separator on opaque ID', () => {
      const csv = exportSkuAccuracyToCsv([baseEntry])
      // String(12345) = '12345', not '12 345'
      expect(csv).toContain('12345')
    })
  })

  describe('data row count', () => {
    it('two entries produce header + two data rows', () => {
      const csv = exportSkuAccuracyToCsv([baseEntry, nullFieldsEntry])
      const lines = csv.slice(1).split('\r\n')
      expect(lines).toHaveLength(3) // header + 2 rows
    })
  })
})
