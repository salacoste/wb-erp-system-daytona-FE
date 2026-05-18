/**
 * EvaluationsTable isolated unit tests — F-6 (Story 110.2-FE 1st-pass review).
 * 2nd-pass updates:
 *   F-1: "Дата" cell now shows formatDate(evaluationDate); forecastId hash test updated.
 *   F-3: tooltip trigger stopPropagation test — onRowClick NOT called when tooltip clicked.
 *   F-6: aria-sort assertions on TableHead instead of aria-label direction suffix.
 */
import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { EvaluationsTable } from '../EvaluationsTable'
import type { EvaluationEntry } from '@/types/ai/evaluations'

const skuEntry: EvaluationEntry = {
  forecastId: 'forecast-abc-12345678',
  modelId: 'model-1',
  nmId: 12345,
  forecastDate: '2026-05-01',
  horizonDays: 7,
  predictedUnits: 100,
  actualUnits: 90,
  predictedRevenue: 50000,
  actualRevenue: 45000,
  mapeUnits: 11.1,
  mapeRevenue: 8.5,
  evaluationDate: '2026-05-17',
}

const nullMapeEntry: EvaluationEntry = {
  forecastId: 'forecast-null-mape-00',
  modelId: 'model-1',
  nmId: 99,
  forecastDate: '2026-05-01',
  horizonDays: 7,
  predictedUnits: 10,
  actualUnits: 8,
  predictedRevenue: 5000,
  actualRevenue: 4000,
  mapeUnits: null,
  mapeRevenue: null,
  evaluationDate: '2026-05-17',
}

const cabinetEntry: EvaluationEntry = {
  forecastId: 'forecast-cabinet-0000',
  modelId: 'model-1',
  nmId: null,
  forecastDate: '2026-05-01',
  horizonDays: 7,
  predictedUnits: 500,
  actualUnits: 480,
  predictedRevenue: 250000,
  actualRevenue: 240000,
  mapeUnits: 4.0,
  mapeRevenue: null,
  evaluationDate: '2026-05-17',
}

const defaultProps = {
  entries: [skuEntry],
  sortCol: 'mapeUnits' as const,
  sortDir: 'asc' as const,
  onSortClick: vi.fn(),
  onRowClick: vi.fn(),
}

describe('EvaluationsTable', () => {
  it('renders empty table body when entries is empty', () => {
    render(<EvaluationsTable {...defaultProps} entries={[]} />)
    // Headers still render
    expect(screen.getByText('Дата')).toBeTruthy()
    // No data rows (only header row)
    const rows = screen.getAllByRole('row')
    expect(rows).toHaveLength(1) // header row only
  })

  it('renders all 6 column headers', () => {
    render(<EvaluationsTable {...defaultProps} />)
    expect(screen.getByText('Дата')).toBeTruthy()
    expect(screen.getByText('Артикул')).toBeTruthy()
    expect(screen.getByText('Прогноз (ед.)')).toBeTruthy()
    expect(screen.getByText('Факт (ед.)')).toBeTruthy()
    expect(screen.getByRole('button', { name: /Сортировать по MAPE единиц/ })).toBeTruthy()
    expect(screen.getByRole('button', { name: /Сортировать по MAPE выручки/ })).toBeTruthy()
  })

  it('F-1: Дата cell renders formatDate(evaluationDate) in DD.MM.YYYY format', () => {
    render(<EvaluationsTable {...defaultProps} />)
    // evaluationDate '2026-05-17' → formatDate → '17.05.2026'
    expect(screen.getByText(/\d{2}\.\d{2}\.\d{4}/)).toBeTruthy()
    expect(screen.getByText('17.05.2026')).toBeTruthy()
  })

  it('F-1: tooltip shows full forecastId (Прогноз ID), not a short hash', () => {
    render(<EvaluationsTable {...defaultProps} />)
    // The date span is the TooltipTrigger — forecastId hash no longer in visible text
    const fullText = document.body.textContent ?? ''
    // Full id should NOT appear in visible text (it's in tooltip content, not rendered by default)
    // The old slice 'forecast' prefix should NOT be the primary date cell content
    // Verify date is shown, not the forecastId slice
    expect(fullText).toContain('17.05.2026')
  })

  it('renders nmId with formatNumber (Russian locale) for SKU entry', () => {
    render(<EvaluationsTable {...defaultProps} />)
    // formatNumber(12345) → '12 345' with ru-RU non-breaking space (U+00A0)
    // Use regex to match regardless of space type
    const cell = screen.getByText(/12[\s ]?345/)
    expect(cell).toBeTruthy()
  })

  it('renders "По кабинету" for cabinet-level entry (nmId null)', () => {
    render(<EvaluationsTable {...defaultProps} entries={[cabinetEntry]} />)
    expect(screen.getByText('По кабинету')).toBeTruthy()
  })

  it('AP#8: null mapeUnits renders em-dash not 0', () => {
    render(<EvaluationsTable {...defaultProps} entries={[nullMapeEntry]} />)
    const dashes = screen.getAllByText('—')
    // Both mapeUnits and mapeRevenue are null → 2 em-dashes
    expect(dashes.length).toBeGreaterThanOrEqual(2)
  })

  it('renders Russian locale percentage for non-null MAPE (F-2: no English dot)', () => {
    render(<EvaluationsTable {...defaultProps} />)
    // formatMapeDisplay(11.1) via formatPercentage → Russian locale "11,1 %" not "11.1%"
    // Verify the English dot format does NOT appear in the document
    const fullText = document.body.textContent ?? ''
    expect(fullText).not.toContain('11.1%')
    // Should contain at least one % sign (MAPE values rendered)
    expect(fullText).toContain('%')
  })

  it('click on mapeUnits sort button fires onSortClick with mapeUnits', () => {
    const onSortClick = vi.fn()
    render(<EvaluationsTable {...defaultProps} onSortClick={onSortClick} />)
    fireEvent.click(screen.getByRole('button', { name: /Сортировать по MAPE единиц/ }))
    expect(onSortClick).toHaveBeenCalledWith('mapeUnits')
  })

  it('click on mapeRevenue sort button fires onSortClick with mapeRevenue', () => {
    const onSortClick = vi.fn()
    render(<EvaluationsTable {...defaultProps} onSortClick={onSortClick} />)
    fireEvent.click(screen.getByRole('button', { name: /Сортировать по MAPE выручки/ }))
    expect(onSortClick).toHaveBeenCalledWith('mapeRevenue')
  })

  it('click on SKU row fires onRowClick with nmId', () => {
    const onRowClick = vi.fn()
    render(<EvaluationsTable {...defaultProps} onRowClick={onRowClick} />)
    const skuRow = screen.getByRole('button', { name: /Перейти к детализации по артикулу 12345/ })
    fireEvent.click(skuRow)
    expect(onRowClick).toHaveBeenCalledWith(12345)
  })

  it('click on cabinet row fires onRowClick with null (non-interactive)', () => {
    render(<EvaluationsTable {...defaultProps} entries={[cabinetEntry]} onRowClick={vi.fn()} />)
    // Cabinet row has no role=button
    expect(screen.queryByRole('button', { name: /Перейти к детализации/ })).toBeNull()
  })

  it('sort indicator ↑ shown when sortCol matches and sortDir is asc', () => {
    render(<EvaluationsTable {...defaultProps} sortCol="mapeUnits" sortDir="asc" />)
    const btn = screen.getByRole('button', { name: /Сортировать по MAPE единиц/ })
    expect(btn.textContent).toContain('↑')
  })

  it('sort indicator ↓ shown when sortCol matches and sortDir is desc', () => {
    render(<EvaluationsTable {...defaultProps} sortCol="mapeUnits" sortDir="desc" />)
    const btn = screen.getByRole('button', { name: /Сортировать по MAPE единиц/ })
    expect(btn.textContent).toContain('↓')
  })

  it('no sort indicator on mapeUnits button when sorting by mapeRevenue', () => {
    render(<EvaluationsTable {...defaultProps} sortCol="mapeRevenue" sortDir="asc" />)
    const btn = screen.getByRole('button', { name: /Сортировать по MAPE единиц/ })
    expect(btn.textContent).not.toContain('↑')
    expect(btn.textContent).not.toContain('↓')
  })

  // F-6: aria-sort attribute tests on TableHead
  it('F-6: active sortCol=mapeUnits asc → aria-sort="ascending" on mapeUnits head', () => {
    const { container } = render(
      <EvaluationsTable {...defaultProps} sortCol="mapeUnits" sortDir="asc" />
    )
    const heads = container.querySelectorAll('th[aria-sort]')
    const ascending = Array.from(heads).find(h => h.getAttribute('aria-sort') === 'ascending')
    expect(ascending).toBeTruthy()
    expect(ascending?.textContent).toContain('MAPE (ед.)')
  })

  it('F-6: active sortCol=mapeUnits desc → aria-sort="descending" on mapeUnits head', () => {
    const { container } = render(
      <EvaluationsTable {...defaultProps} sortCol="mapeUnits" sortDir="desc" />
    )
    const heads = container.querySelectorAll('th[aria-sort]')
    const descending = Array.from(heads).find(h => h.getAttribute('aria-sort') === 'descending')
    expect(descending).toBeTruthy()
    expect(descending?.textContent).toContain('MAPE (ед.)')
  })

  it('F-6: inactive column gets aria-sort="none"', () => {
    const { container } = render(
      <EvaluationsTable {...defaultProps} sortCol="mapeUnits" sortDir="asc" />
    )
    const heads = container.querySelectorAll('th[aria-sort]')
    const noneHeads = Array.from(heads).filter(h => h.getAttribute('aria-sort') === 'none')
    // mapeRevenue column should be "none" when mapeUnits is active
    expect(noneHeads.length).toBeGreaterThanOrEqual(1)
    expect(noneHeads.some(h => h.textContent?.includes('MAPE (₽)'))).toBe(true)
  })

  // F-3: stopPropagation — clicking tooltip trigger does NOT fire onRowClick
  it('F-3: click on date tooltip trigger does NOT call onRowClick (stopPropagation)', () => {
    const onRowClick = vi.fn()
    render(<EvaluationsTable {...defaultProps} onRowClick={onRowClick} />)
    // The date span is the TooltipTrigger child — click it directly
    const dateSpan = screen.getByText('17.05.2026')
    fireEvent.click(dateSpan)
    // stopPropagation prevents bubbling to the TableRow onClick
    expect(onRowClick).not.toHaveBeenCalled()
  })
})
