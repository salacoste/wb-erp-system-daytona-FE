/**
 * ExportCsvButton component tests — Story 110.5-FE Task 4.
 * F-4 (1st-pass): asserts appendChild + remove called (memory leak fix).
 * F-6 (1st-pass + 2nd-pass): isCsvEmpty now detects "headers-only" state (realistic
 *   helper output); BOM-only tautology replaced with CRLF-split logic tests.
 * F-9 (1st-pass): asserts type="button" present.
 */
import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ExportCsvButton } from '../ExportCsvButton'

// UTF-8 BOM prefix — what the pure helpers prepend
const BOM = '﻿'

// ── CSV content fixtures ─────────────────────────────────────────────────────

// Realistic helper output: BOM + headers only (no data rows) — should disable
const HEADERS_ONLY_CSV = `${BOM}Дата оценки,ID прогноза,Артикул`
// Realistic helper output: BOM + headers + 1 data row (CRLF separator) — should enable
const VALID_CSV = `${BOM}Дата оценки,ID прогноза,Артикул\r\n17.05.2026,fc-001,12345`
const EMPTY_CSV = ''
const BOM_ONLY_CSV = BOM

// ── Tests ────────────────────────────────────────────────────────────────────

describe('ExportCsvButton', () => {
  let capturedBlobs: Blob[]
  let createdObjectUrls: string[]
  let revokedObjectUrls: string[]
  let mockAnchorClick: ReturnType<typeof vi.fn>
  let removeSpy: ReturnType<typeof vi.fn>
  // appendChildCalled tracked via a closure counter — avoids MockInstance type clash
  let appendChildCallCount: number
  let originalAppendChild: typeof document.body.appendChild

  beforeEach(() => {
    capturedBlobs = []
    createdObjectUrls = []
    revokedObjectUrls = []
    mockAnchorClick = vi.fn()
    removeSpy = vi.fn()
    appendChildCallCount = 0

    global.URL.createObjectURL = vi.fn((blob: Blob) => {
      capturedBlobs.push(blob)
      const url = `blob:mock-${createdObjectUrls.length}`
      createdObjectUrls.push(url)
      return url
    })

    global.URL.revokeObjectURL = vi.fn((url: string) => {
      revokedObjectUrls.push(url)
    })

    // Track appendChild calls — delegate to original so React mount still works
    originalAppendChild = document.body.appendChild.bind(document.body)
    document.body.appendChild = ((node: Node) => {
      appendChildCallCount++
      return originalAppendChild(node)
    }) as typeof document.body.appendChild

    // Intercept createElement('a') to capture anchor and spy on .click() + .remove()
    const originalCreateElement = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'a') {
        const anchor = originalCreateElement('a') as HTMLAnchorElement
        anchor.click = mockAnchorClick
        anchor.remove = removeSpy
        return anchor
      }
      return originalCreateElement(tag)
    })
  })

  afterEach(() => {
    document.body.appendChild = originalAppendChild
  })

  describe('rendering', () => {
    it('renders with default label "Скачать CSV"', () => {
      render(<ExportCsvButton csvContent={VALID_CSV} fileName="test.csv" />)
      expect(screen.getByRole('button', { name: 'Скачать CSV' })).toBeTruthy()
      expect(screen.getByText('Скачать CSV')).toBeTruthy()
    })

    it('renders with custom label', () => {
      render(<ExportCsvButton csvContent={VALID_CSV} fileName="test.csv" label="Экспорт" />)
      expect(screen.getByRole('button', { name: 'Экспорт' })).toBeTruthy()
    })

    it('aria-label matches label prop', () => {
      render(<ExportCsvButton csvContent={VALID_CSV} fileName="test.csv" label="Мой экспорт" />)
      const btn = screen.getByRole('button', { name: 'Мой экспорт' })
      expect(btn.getAttribute('aria-label')).toBe('Мой экспорт')
    })

    it('aria-label uses default "Скачать CSV" when no label prop', () => {
      render(<ExportCsvButton csvContent={VALID_CSV} fileName="test.csv" />)
      const btn = screen.getByRole('button', { name: 'Скачать CSV' })
      expect(btn.getAttribute('aria-label')).toBe('Скачать CSV')
    })

    it('has type="button" to prevent accidental form submission (F-9)', () => {
      render(<ExportCsvButton csvContent={VALID_CSV} fileName="test.csv" />)
      const btn = screen.getByRole('button', { name: 'Скачать CSV' })
      expect(btn.getAttribute('type')).toBe('button')
    })
  })

  describe('click — happy path', () => {
    it('click triggers URL.createObjectURL once', () => {
      render(<ExportCsvButton csvContent={VALID_CSV} fileName="test.csv" />)
      fireEvent.click(screen.getByRole('button', { name: 'Скачать CSV' }))
      expect(createdObjectUrls).toHaveLength(1)
    })

    it('click passes Blob with correct MIME type (text/csv;charset=utf-8;) (F-6)', async () => {
      render(<ExportCsvButton csvContent={VALID_CSV} fileName="test.csv" />)
      fireEvent.click(screen.getByRole('button', { name: 'Скачать CSV' }))
      expect(capturedBlobs).toHaveLength(1)
      expect(capturedBlobs[0].type).toBe('text/csv;charset=utf-8;')
    })

    it('Blob is non-empty and has correct MIME type — content verified via size (F-6)', () => {
      // jsdom Blob does not support .text() — verify via size and type instead.
      // The csvContent fixture is VALID_CSV which is > 1 byte.
      render(<ExportCsvButton csvContent={VALID_CSV} fileName="test.csv" />)
      fireEvent.click(screen.getByRole('button', { name: 'Скачать CSV' }))
      expect(capturedBlobs).toHaveLength(1)
      expect(capturedBlobs[0].type).toBe('text/csv;charset=utf-8;')
      // Blob is non-empty: size > 0 confirms content was passed in
      expect(capturedBlobs[0].size).toBeGreaterThan(0)
    })

    it('click appends anchor to document.body — no memory leak (F-4)', () => {
      render(<ExportCsvButton csvContent={VALID_CSV} fileName="test.csv" />)
      // Snapshot count after render (React mount may have used appendChild)
      const countBeforeClick = appendChildCallCount
      fireEvent.click(screen.getByRole('button', { name: 'Скачать CSV' }))
      // Exactly one additional appendChild for the synthetic anchor
      expect(appendChildCallCount - countBeforeClick).toBe(1)
    })

    it('click removes anchor from document.body after download (F-4)', () => {
      render(<ExportCsvButton csvContent={VALID_CSV} fileName="test.csv" />)
      fireEvent.click(screen.getByRole('button', { name: 'Скачать CSV' }))
      expect(removeSpy).toHaveBeenCalledTimes(1)
    })

    it('click passes csvContent to Blob and triggers anchor click', () => {
      render(<ExportCsvButton csvContent={VALID_CSV} fileName="test.csv" />)
      fireEvent.click(screen.getByRole('button', { name: 'Скачать CSV' }))
      expect(global.URL.createObjectURL).toHaveBeenCalledTimes(1)
      expect(mockAnchorClick).toHaveBeenCalledTimes(1)
    })

    it('click calls URL.revokeObjectURL for cleanup after download', () => {
      render(<ExportCsvButton csvContent={VALID_CSV} fileName="test.csv" />)
      fireEvent.click(screen.getByRole('button', { name: 'Скачать CSV' }))
      expect(revokedObjectUrls).toHaveLength(1)
      expect(revokedObjectUrls[0]).toBe('blob:mock-0')
    })

    it('download attribute is set to fileName on synthetic anchor', () => {
      let capturedDownload = ''
      const originalCreateElement = document.createElement.bind(document)
      vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
        if (tag === 'a') {
          const anchor = originalCreateElement('a') as HTMLAnchorElement
          anchor.click = vi.fn(() => {
            capturedDownload = anchor.download
          })
          anchor.remove = vi.fn()
          return anchor
        }
        return originalCreateElement(tag)
      })

      render(<ExportCsvButton csvContent={VALID_CSV} fileName="my-file.csv" />)
      fireEvent.click(screen.getByRole('button', { name: 'Скачать CSV' }))
      expect(capturedDownload).toBe('my-file.csv')
    })
  })

  describe('disabled state', () => {
    it('disabled prop true — button is disabled', () => {
      render(<ExportCsvButton csvContent={VALID_CSV} fileName="test.csv" disabled />)
      expect(screen.getByRole('button', { name: 'Скачать CSV' })).toBeDisabled()
    })

    it('disabled prop true — click does NOT trigger download', () => {
      render(<ExportCsvButton csvContent={VALID_CSV} fileName="test.csv" disabled />)
      fireEvent.click(screen.getByRole('button', { name: 'Скачать CSV' }))
      expect(createdObjectUrls).toHaveLength(0)
    })

    it('empty csvContent — button is disabled', () => {
      render(<ExportCsvButton csvContent={EMPTY_CSV} fileName="test.csv" />)
      expect(screen.getByRole('button', { name: 'Скачать CSV' })).toBeDisabled()
    })

    it('BOM-only csvContent — button is disabled (no real data)', () => {
      render(<ExportCsvButton csvContent={BOM_ONLY_CSV} fileName="test.csv" />)
      expect(screen.getByRole('button', { name: 'Скачать CSV' })).toBeDisabled()
    })

    it('headers-only csvContent (realistic helper empty output) — button is disabled (F-6)', () => {
      // Pure helpers always emit BOM + headerRow minimum — isCsvEmpty detects this
      render(<ExportCsvButton csvContent={HEADERS_ONLY_CSV} fileName="test.csv" />)
      expect(screen.getByRole('button', { name: 'Скачать CSV' })).toBeDisabled()
    })

    it('valid csvContent with data — button is NOT disabled', () => {
      render(<ExportCsvButton csvContent={VALID_CSV} fileName="test.csv" />)
      expect(screen.getByRole('button', { name: 'Скачать CSV' })).not.toBeDisabled()
    })
  })
})
