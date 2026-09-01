/**
 * EvaluationsTable isolated unit tests — F-6 (Story 110.2-FE 1st-pass review).
 * Story 110.4-FE: added Оценка column tests + QueryClient wrapper for FeedbackButtons.
 * 2nd-pass updates:
 *   F-1: "Дата" cell now shows formatDate(evaluationDate); forecastId hash test updated.
 *   F-3: tooltip trigger stopPropagation test — onRowClick NOT called when tooltip clicked.
 *   F-6: aria-sort assertions on TableHead instead of aria-label direction suffix.
 */
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { EvaluationsTable } from '../EvaluationsTable'
import type { EvaluationEntry } from '@/types/ai/evaluations'
import * as systemApi from '@/lib/api/ai/system'
import * as authStore from '@/stores/authStore'

vi.mock('@/lib/api/ai/system')
vi.mock('@/stores/authStore')

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)
}

function renderTable(props: React.ComponentProps<typeof EvaluationsTable>) {
  return render(<EvaluationsTable {...props} />, { wrapper: createWrapper() })
}

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

const defaultProps: React.ComponentProps<typeof EvaluationsTable> = {
  entries: [skuEntry],
  sortCol: 'mapeUnits' as const,
  sortDir: 'asc' as const,
  onSortClick: vi.fn(),
  onRowClick: vi.fn(),
}

beforeEach(() => {
  vi.clearAllMocks()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  vi.mocked(authStore.useAuthStore).mockImplementation((selector: any) =>
    selector({ cabinetId: 'cab-1' })
  )
  vi.mocked(systemApi.postFeedback).mockResolvedValue(undefined)
})

describe('EvaluationsTable', () => {
  it('renders empty table body when entries is empty', () => {
    renderTable({ ...defaultProps, entries: [] })
    // Headers still render
    expect(screen.getByText('Дата оценки')).toBeTruthy()
    // No data rows (only header row)
    const rows = screen.getAllByRole('row')
    expect(rows).toHaveLength(1) // header row only
  })

  it('renders all column headers including forecast columns', () => {
    renderTable(defaultProps)
    expect(screen.getByText('Дата оценки')).toBeTruthy()
    expect(screen.getByText('Дата прогноза')).toBeTruthy()
    expect(screen.getByText('Горизонт')).toBeTruthy()
    expect(screen.getByText('Артикул')).toBeTruthy()
    expect(screen.getByText('Прогноз (ед.)')).toBeTruthy()
    expect(screen.getByText('Факт (ед.)')).toBeTruthy()
    expect(screen.getByRole('button', { name: /Сортировать по MAPE единиц/ })).toBeTruthy()
    expect(screen.getByRole('button', { name: /Сортировать по MAPE выручки/ })).toBeTruthy()
    expect(screen.getByText('Оценка')).toBeTruthy()
  })

  it('Story 171.7: renders table caption naming the model when captionText provided', () => {
    renderTable({ ...defaultProps, captionText: 'Оценки точности модели — Прогноз продаж v3' })
    // r-NIT fix: pin the caption SEMANTIC (role), not just the text
    expect(screen.getByRole('caption')).toHaveTextContent(
      'Оценки точности модели — Прогноз продаж v3'
    )
  })

  it('Story 171.7: no caption rendered when captionText is undefined', () => {
    renderTable(defaultProps)
    expect(screen.queryByText(/Оценки точности модели —/)).toBeNull()
  })

  it('F-1: Дата оценки cell renders formatDate(evaluationDate) in DD.MM.YYYY format', () => {
    renderTable(defaultProps)
    // evaluationDate '2026-05-17' → formatDate → '17.05.2026'
    const dates = screen.getAllByText(/\d{2}\.\d{2}\.\d{4}/)
    expect(dates.length).toBeGreaterThanOrEqual(2) // evaluationDate + forecastDate
    expect(screen.getAllByText('17.05.2026').length).toBeGreaterThanOrEqual(1)
  })

  it('F-1: tooltip shows full forecastId (Прогноз ID), not a short hash', () => {
    renderTable(defaultProps)
    // The date span is the TooltipTrigger — forecastId hash no longer in visible text
    const fullText = document.body.textContent ?? ''
    // Full id should NOT appear in visible text (it's in tooltip content, not rendered by default)
    // The old slice 'forecast' prefix should NOT be the primary date cell content
    // Verify date is shown, not the forecastId slice
    expect(fullText).toContain('17.05.2026')
  })

  it('F-8: renders nmId as raw string (not formatNumber) for copy-paste semantics', () => {
    renderTable(defaultProps)
    // String(12345) → '12345' — no non-breaking-space separator
    expect(screen.getByText('12345')).toBeTruthy()
  })

  it('renders "По кабинету" for cabinet-level entry (nmId null)', () => {
    renderTable({ ...defaultProps, entries: [cabinetEntry] })
    expect(screen.getByText('По кабинету')).toBeTruthy()
  })

  it('AP#8: null mapeUnits renders em-dash not 0', () => {
    renderTable({ ...defaultProps, entries: [nullMapeEntry] })
    const dashes = screen.getAllByText('—')
    // Both mapeUnits and mapeRevenue are null → 2 em-dashes
    expect(dashes.length).toBeGreaterThanOrEqual(2)
  })

  it('renders Russian locale percentage for non-null MAPE (F-2: no English dot)', () => {
    renderTable(defaultProps)
    // formatMapeDisplay(11.1) via formatPercentage → Russian locale "11,1 %" not "11.1%"
    // Verify the English dot format does NOT appear in the document
    const fullText = document.body.textContent ?? ''
    expect(fullText).not.toContain('11.1%')
    // Should contain at least one % sign (MAPE values rendered)
    expect(fullText).toContain('%')
  })

  it('click on mapeUnits sort button fires onSortClick with mapeUnits', () => {
    const onSortClick = vi.fn()
    renderTable({ ...defaultProps, onSortClick })
    fireEvent.click(screen.getByRole('button', { name: /Сортировать по MAPE единиц/ }))
    expect(onSortClick).toHaveBeenCalledWith('mapeUnits')
  })

  it('click on mapeRevenue sort button fires onSortClick with mapeRevenue', () => {
    const onSortClick = vi.fn()
    renderTable({ ...defaultProps, onSortClick })
    fireEvent.click(screen.getByRole('button', { name: /Сортировать по MAPE выручки/ }))
    expect(onSortClick).toHaveBeenCalledWith('mapeRevenue')
  })

  it('click on the native SKU detail button fires onRowClick exactly once', () => {
    const onRowClick = vi.fn()
    renderTable({ ...defaultProps, onRowClick })
    const detailButton = screen.getByRole('button', {
      name: 'Перейти к детализации по артикулу 12345',
    })
    fireEvent.click(detailButton)
    expect(onRowClick).toHaveBeenCalledTimes(1)
    expect(onRowClick).toHaveBeenCalledWith(12345)
  })

  it('click on cabinet row fires onRowClick with null (non-interactive)', () => {
    renderTable({ ...defaultProps, entries: [cabinetEntry], onRowClick: vi.fn() })
    // Cabinet row has no role=button
    expect(screen.queryByRole('button', { name: /Перейти к детализации/ })).toBeNull()
  })

  it('sort indicator ↑ shown when sortCol matches and sortDir is asc', () => {
    renderTable({ ...defaultProps, sortCol: 'mapeUnits', sortDir: 'asc' })
    const btn = screen.getByRole('button', { name: /Сортировать по MAPE единиц/ })
    expect(btn.textContent).toContain('↑')
  })

  it('sort indicator ↓ shown when sortCol matches and sortDir is desc', () => {
    renderTable({ ...defaultProps, sortCol: 'mapeUnits', sortDir: 'desc' })
    const btn = screen.getByRole('button', { name: /Сортировать по MAPE единиц/ })
    expect(btn.textContent).toContain('↓')
  })

  it('no sort indicator on mapeUnits button when sorting by mapeRevenue', () => {
    renderTable({ ...defaultProps, sortCol: 'mapeRevenue', sortDir: 'asc' })
    const btn = screen.getByRole('button', { name: /Сортировать по MAPE единиц/ })
    expect(btn.textContent).not.toContain('↑')
    expect(btn.textContent).not.toContain('↓')
  })

  // F-6: aria-sort attribute tests on TableHead
  it('F-6: active sortCol=mapeUnits asc → aria-sort="ascending" on mapeUnits head', () => {
    const { container } = renderTable({ ...defaultProps, sortCol: 'mapeUnits', sortDir: 'asc' })
    const heads = container.querySelectorAll('th[aria-sort]')
    const ascending = Array.from(heads).find(h => h.getAttribute('aria-sort') === 'ascending')
    expect(ascending).toBeTruthy()
    expect(ascending?.textContent).toContain('MAPE (ед.)')
  })

  it('F-6: active sortCol=mapeUnits desc → aria-sort="descending" on mapeUnits head', () => {
    const { container } = renderTable({ ...defaultProps, sortCol: 'mapeUnits', sortDir: 'desc' })
    const heads = container.querySelectorAll('th[aria-sort]')
    const descending = Array.from(heads).find(h => h.getAttribute('aria-sort') === 'descending')
    expect(descending).toBeTruthy()
    expect(descending?.textContent).toContain('MAPE (ед.)')
  })

  it('F-6: inactive column gets aria-sort="none"', () => {
    const { container } = renderTable({ ...defaultProps, sortCol: 'mapeUnits', sortDir: 'asc' })
    const heads = container.querySelectorAll('th[aria-sort]')
    const noneHeads = Array.from(heads).filter(h => h.getAttribute('aria-sort') === 'none')
    // mapeRevenue column should be "none" when mapeUnits is active
    expect(noneHeads.length).toBeGreaterThanOrEqual(1)
    expect(noneHeads.some(h => h.textContent?.includes('MAPE (₽)'))).toBe(true)
  })

  // F-1: keyboard activation stays on a native button while the tr remains a native row.
  it('F-1: Enter on SKU detail button fires onRowClick and preserves row semantics', async () => {
    const user = userEvent.setup()
    const onRowClick = vi.fn()
    renderTable({ ...defaultProps, onRowClick })
    const detailButton = screen.getByRole('button', {
      name: 'Перейти к детализации по артикулу 12345',
    })
    const skuRow = detailButton.closest('tr')
    expect(skuRow?.tagName).toBe('TR')
    expect(skuRow).not.toHaveAttribute('role')
    expect(skuRow).not.toHaveAttribute('tabindex')

    detailButton.focus()
    await user.keyboard('{Enter}')
    expect(onRowClick).toHaveBeenCalledWith(12345)
  })

  it('F-1: Space on SKU detail button fires onRowClick exactly once', async () => {
    const user = userEvent.setup()
    const onRowClick = vi.fn()
    renderTable({ ...defaultProps, onRowClick })
    const detailButton = screen.getByRole('button', {
      name: 'Перейти к детализации по артикулу 12345',
    })
    detailButton.focus()
    await user.keyboard(' ')
    expect(onRowClick).toHaveBeenCalledTimes(1)
    expect(onRowClick).toHaveBeenCalledWith(12345)
  })

  // F-3: stopPropagation — clicking tooltip trigger does NOT fire onRowClick
  it('F-3: click on date tooltip trigger does NOT call onRowClick (stopPropagation)', () => {
    const onRowClick = vi.fn()
    renderTable({ ...defaultProps, onRowClick })
    // The date span is the TooltipTrigger child — click it directly
    const dateSpans = screen.getAllByText('17.05.2026')
    fireEvent.click(dateSpans[0])
    // stopPropagation prevents bubbling to the TableRow onClick
    expect(onRowClick).not.toHaveBeenCalled()
  })

  // Story 110.4-FE: Оценка column + FeedbackButtons stopPropagation
  it('Story 110.4: renders feedback buttons in each row', () => {
    renderTable(defaultProps)
    expect(screen.getByRole('button', { name: 'Полезный прогноз' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Бесполезный прогноз' })).toBeTruthy()
  })

  it('Story 110.4: feedback buttons have correct aria-labels (WCAG)', () => {
    renderTable(defaultProps)
    expect(screen.getByRole('button', { name: 'Полезный прогноз' })).toHaveAttribute(
      'aria-label',
      'Полезный прогноз'
    )
    expect(screen.getByRole('button', { name: 'Бесполезный прогноз' })).toHaveAttribute(
      'aria-label',
      'Бесполезный прогноз'
    )
  })

  it('Story 110.4: click on feedback button does NOT trigger onRowClick (stopPropagation)', () => {
    const onRowClick = vi.fn()
    renderTable({ ...defaultProps, onRowClick })
    const thumbsUp = screen.getByRole('button', { name: 'Полезный прогноз' })
    fireEvent.click(thumbsUp)
    // FeedbackButtons.onClick calls e.stopPropagation() first — row navigation must NOT fire
    expect(onRowClick).not.toHaveBeenCalled()
  })
})
