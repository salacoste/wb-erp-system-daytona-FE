/**
 * SkuAccuracyTable unit tests — Story 110.3-FE Task 4.
 * Covers: empty state, AP#8 null rendering, aria-sort, sort-click row reorder,
 * row-click navigation, locale formatters.
 * Pattern: mirrors EvaluationsTable.test.tsx (Story 110.2-FE F-3, F-6).
 */
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SkuAccuracyTable } from '../SkuAccuracyTable'
import type { SkuAccuracyEntry } from '@/types/ai/evaluations'

// Mock next/navigation
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

const entryA: SkuAccuracyEntry = {
  nmId: 11111,
  vendorCode: 'SKU-A',
  history: [],
  avgAiMape: 8.5,
  avgNaiveMape: 15.2,
  aiAccuracyPercent: 44.1,
  naiveAccuracyPercent: 81.7,
  evaluationCount: 6,
}

const entryB: SkuAccuracyEntry = {
  nmId: 22222,
  vendorCode: 'SKU-B',
  history: [],
  avgAiMape: 20.0,
  avgNaiveMape: 25.0,
  aiAccuracyPercent: 20.0,
  naiveAccuracyPercent: null,
  evaluationCount: 3,
}

const nullMapeEntry: SkuAccuracyEntry = {
  nmId: 33333,
  vendorCode: null,
  history: [],
  avgAiMape: null,
  avgNaiveMape: null,
  aiAccuracyPercent: null,
  naiveAccuracyPercent: null,
  evaluationCount: 0,
}

const defaultProps = {
  entries: [entryA],
  modelId: 'model-1',
  sortCol: 'avgAiMape' as const,
  sortDir: 'asc' as const,
  onSortClick: vi.fn(),
}

describe('SkuAccuracyTable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders empty table body when entries is empty', () => {
    const { container } = render(<SkuAccuracyTable {...defaultProps} entries={[]} />)
    const rows = container.querySelectorAll('tbody tr')
    expect(rows).toHaveLength(0)
  })

  it('renders all 6 column headers', () => {
    render(<SkuAccuracyTable {...defaultProps} />)
    expect(screen.getByText('Артикул (nmId)')).toBeTruthy()
    expect(screen.getByText('Vendor code')).toBeTruthy()
    expect(screen.getByRole('button', { name: /Сортировать по AI MAPE/ })).toBeTruthy()
    expect(screen.getByRole('button', { name: /Сортировать по Naive MAPE/ })).toBeTruthy()
    expect(screen.getByRole('button', { name: /Сортировать по AI accuracy %/ })).toBeTruthy()
    expect(screen.getByText('Кол-во оценок')).toBeTruthy()
  })

  it('Story 171.8: table caption names the model (RTC contract)', () => {
    render(<SkuAccuracyTable {...defaultProps} />)
    // role-pin (semantic caption element, not just text)
    expect(screen.getByRole('caption')).toHaveTextContent('Точность по SKU — модель model-1')
  })

  it('F-8: renders nmId as raw string (not formatNumber) for copy-paste semantics', () => {
    render(<SkuAccuracyTable {...defaultProps} />)
    // String(11111) → '11111' — no non-breaking-space separator
    expect(screen.getByText('11111')).toBeTruthy()
  })

  it('renders vendorCode when present', () => {
    render(<SkuAccuracyTable {...defaultProps} />)
    expect(screen.getByText('SKU-A')).toBeTruthy()
  })

  it('renders em-dash for null vendorCode', () => {
    render(<SkuAccuracyTable {...defaultProps} entries={[nullMapeEntry]} />)
    // multiple '—' expected (vendorCode + 3 null MAPE columns)
    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBeGreaterThanOrEqual(1)
  })

  it('AP#8: null avgAiMape renders em-dash not 0', () => {
    render(<SkuAccuracyTable {...defaultProps} entries={[nullMapeEntry]} />)
    const dashes = screen.getAllByText('—')
    // avgAiMape + avgNaiveMape + aiAccuracyPercent all null → at least 3 em-dashes
    expect(dashes.length).toBeGreaterThanOrEqual(3)
  })

  it('renders Russian locale percentage for non-null MAPE (no English decimal dot)', () => {
    render(<SkuAccuracyTable {...defaultProps} />)
    const fullText = document.body.textContent ?? ''
    expect(fullText).not.toContain('8.5%')
    expect(fullText).toContain('%')
  })

  it('sort ascending: avgAiMape button shows ↑ indicator', () => {
    render(<SkuAccuracyTable {...defaultProps} sortCol="avgAiMape" sortDir="asc" />)
    const btn = screen.getByRole('button', { name: /Сортировать по AI MAPE/ })
    expect(btn.textContent).toContain('↑')
  })

  it('sort descending: avgAiMape button shows ↓ indicator', () => {
    render(<SkuAccuracyTable {...defaultProps} sortCol="avgAiMape" sortDir="desc" />)
    const btn = screen.getByRole('button', { name: /Сортировать по AI MAPE/ })
    expect(btn.textContent).toContain('↓')
  })

  it('no sort indicator on inactive column', () => {
    render(<SkuAccuracyTable {...defaultProps} sortCol="avgAiMape" sortDir="asc" />)
    const btn = screen.getByRole('button', { name: /Сортировать по Naive MAPE/ })
    expect(btn.textContent).not.toContain('↑')
    expect(btn.textContent).not.toContain('↓')
  })

  it('click avgAiMape sort button fires onSortClick with avgAiMape', () => {
    const onSortClick = vi.fn()
    render(<SkuAccuracyTable {...defaultProps} onSortClick={onSortClick} />)
    fireEvent.click(screen.getByRole('button', { name: /Сортировать по AI MAPE/ }))
    expect(onSortClick).toHaveBeenCalledWith('avgAiMape')
  })

  it('click avgNaiveMape sort button fires onSortClick with avgNaiveMape', () => {
    const onSortClick = vi.fn()
    render(<SkuAccuracyTable {...defaultProps} onSortClick={onSortClick} />)
    fireEvent.click(screen.getByRole('button', { name: /Сортировать по Naive MAPE/ }))
    expect(onSortClick).toHaveBeenCalledWith('avgNaiveMape')
  })

  it('click aiAccuracyPercent sort button fires onSortClick with aiAccuracyPercent', () => {
    const onSortClick = vi.fn()
    render(<SkuAccuracyTable {...defaultProps} onSortClick={onSortClick} />)
    fireEvent.click(screen.getByRole('button', { name: /Сортировать по AI accuracy %/ }))
    expect(onSortClick).toHaveBeenCalledWith('aiAccuracyPercent')
  })

  // aria-sort tests — F-3 strengthened: assert exact counts across all 3 sortable columns
  it('F-3/F-6: sortCol=avgAiMape asc → exactly 1 "ascending", exactly 2 "none" among sortable heads', () => {
    const { container } = render(
      <SkuAccuracyTable {...defaultProps} sortCol="avgAiMape" sortDir="asc" />
    )
    const heads = container.querySelectorAll('th[aria-sort]')
    const ascHeads = Array.from(heads).filter(h => h.getAttribute('aria-sort') === 'ascending')
    const noneHeads = Array.from(heads).filter(h => h.getAttribute('aria-sort') === 'none')
    // 3 sortable columns total → exactly 1 ascending (active), exactly 2 none (inactive)
    expect(ascHeads).toHaveLength(1)
    expect(noneHeads).toHaveLength(2)
    expect(ascHeads[0].textContent).toContain('AI MAPE')
  })

  it('F-3/F-6: sortCol=avgAiMape desc → exactly 1 "descending", exactly 2 "none"', () => {
    const { container } = render(
      <SkuAccuracyTable {...defaultProps} sortCol="avgAiMape" sortDir="desc" />
    )
    const heads = container.querySelectorAll('th[aria-sort]')
    const descHeads = Array.from(heads).filter(h => h.getAttribute('aria-sort') === 'descending')
    const noneHeads = Array.from(heads).filter(h => h.getAttribute('aria-sort') === 'none')
    expect(descHeads).toHaveLength(1)
    expect(noneHeads).toHaveLength(2)
  })

  it('F-1: Enter key on row navigates to detail URL (keyboard accessibility)', () => {
    render(<SkuAccuracyTable {...defaultProps} />)
    const row = screen.getByRole('button', { name: /Перейти к детализации по артикулу 11111/ })
    fireEvent.keyDown(row, { key: 'Enter', code: 'Enter' })
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('nmId=11111'))
  })

  it('F-1: Space key on row navigates to detail URL (keyboard accessibility)', () => {
    render(<SkuAccuracyTable {...defaultProps} />)
    const row = screen.getByRole('button', { name: /Перейти к детализации по артикулу 11111/ })
    fireEvent.keyDown(row, { key: ' ', code: 'Space' })
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('nmId=11111'))
  })

  it('row click navigates to detail URL with nmId', () => {
    render(<SkuAccuracyTable {...defaultProps} />)
    const row = screen.getByRole('button', { name: /Перейти к детализации по артикулу 11111/ })
    fireEvent.click(row)
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('nmId=11111'))
  })

  // Sort row reorder — F-3 pattern: use container.querySelectorAll('tr') per Story 110.2-FE
  it('sort reorder: asc puts lower avgAiMape first (container.querySelectorAll tr)', () => {
    const { container } = render(
      <SkuAccuracyTable
        {...defaultProps}
        entries={[entryB, entryA]}
        sortCol="avgAiMape"
        sortDir="asc"
      />
    )
    const rows = container.querySelectorAll('tbody tr')
    expect(rows).toHaveLength(2)
    // entryA (8.5) < entryB (20.0) → entryA first in ASC
    expect(rows[0].textContent).toContain('SKU-A')
    expect(rows[1].textContent).toContain('SKU-B')
  })

  it('sort reorder: desc puts higher avgAiMape first', () => {
    const { container } = render(
      <SkuAccuracyTable
        {...defaultProps}
        entries={[entryA, entryB]}
        sortCol="avgAiMape"
        sortDir="desc"
      />
    )
    const rows = container.querySelectorAll('tbody tr')
    // entryB (20.0) > entryA (8.5) → entryB first in DESC
    expect(rows[0].textContent).toContain('SKU-B')
    expect(rows[1].textContent).toContain('SKU-A')
  })

  // F-7: null-last sort — assert both rows in ASC and add DESC variant
  it('F-7: nulls go last in ASC — row[0] non-null entry, row[1] null entry', () => {
    const { container } = render(
      <SkuAccuracyTable
        {...defaultProps}
        entries={[nullMapeEntry, entryA]}
        sortCol="avgAiMape"
        sortDir="asc"
      />
    )
    const rows = container.querySelectorAll('tbody tr')
    expect(rows).toHaveLength(2)
    // entryA (8.5) first, nullMapeEntry (null) last
    expect(rows[0].textContent).toContain('SKU-A')
    expect(rows[1].textContent).toMatch(/33333|—/)
  })

  it('F-7: nulls go last in DESC — row[0] non-null entry, row[1] null entry', () => {
    const { container } = render(
      <SkuAccuracyTable
        {...defaultProps}
        entries={[nullMapeEntry, entryA]}
        sortCol="avgAiMape"
        sortDir="desc"
      />
    )
    const rows = container.querySelectorAll('tbody tr')
    expect(rows).toHaveLength(2)
    // entryA (8.5) still first (only non-null), nullMapeEntry still last regardless of direction
    expect(rows[0].textContent).toContain('SKU-A')
    expect(rows[1].textContent).toMatch(/33333|—/)
  })

  it('evaluationCount rendered with formatNumber', () => {
    render(<SkuAccuracyTable {...defaultProps} />)
    // evaluationCount: 6 → '6'
    expect(screen.getByText('6')).toBeTruthy()
  })
})
