/**
 * SkuAccuracyDetail unit tests — Story 110.3-FE Task 6.
 * Covers: happy path, empty-state (nmId not found), AP#8 null rendering,
 * history table rendering, locale formatters, history DESC sort.
 * Story 163.5-FE (FR10): naiveBaseline units column — positive/zero/null/ordering/labeling.
 */
import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SkuAccuracyDetail } from '../SkuAccuracyDetail'
import type { SkuAccuracyEntry } from '@/types/ai/evaluations'

const entry: SkuAccuracyEntry = {
  nmId: 12345,
  vendorCode: 'MY-SKU',
  history: [
    {
      evaluationDate: '2026-04-01',
      predictedUnits: 45,
      actualUnits: 42,
      naiveBaseline: null,
      mapeUnits: 7.14,
      naiveMape: 9.52,
    },
    {
      evaluationDate: '2026-05-01',
      predictedUnits: 50,
      actualUnits: 48,
      naiveBaseline: 38.2,
      mapeUnits: 4.0,
      naiveMape: null,
    },
    // Story 163.5-FE: zero baseline must render as "0", not "—" (AC2).
    {
      evaluationDate: '2026-06-01',
      predictedUnits: 30,
      actualUnits: 33,
      naiveBaseline: 0,
      mapeUnits: 10.0,
      naiveMape: 12.5,
    },
  ],
  avgAiMape: 5.57,
  avgNaiveMape: 9.52,
  aiAccuracyPercent: 41.5,
  naiveAccuracyPercent: 81.7,
  evaluationCount: 3,
}

const nullMapeEntry: SkuAccuracyEntry = {
  nmId: 99999,
  vendorCode: null,
  history: [],
  avgAiMape: null,
  avgNaiveMape: null,
  aiAccuracyPercent: null,
  naiveAccuracyPercent: null,
  evaluationCount: 0,
}

describe('SkuAccuracyDetail', () => {
  // F-2: loading/error states gated before empty-state check
  // F-5: skuAccuracies may be undefined (data not yet arrived) — isLoading guard precedes find()
  it('F-2: isLoading=true renders skeleton, NOT empty-state', () => {
    render(
      <SkuAccuracyDetail
        nmId={99999}
        modelId="model-1"
        skuAccuracies={undefined}
        isLoading={true}
      />
    )
    expect(screen.getByTestId('sku-detail-skeleton')).toBeTruthy()
    expect(screen.queryByText(/SKU не найден/)).toBeNull()
  })

  it('F-2: isError=true renders error alert, NOT empty-state', () => {
    render(
      <SkuAccuracyDetail nmId={99999} modelId="model-1" skuAccuracies={undefined} isError={true} />
    )
    expect(screen.getByText(/Ошибка загрузки данных по SKU/)).toBeTruthy()
    expect(screen.queryByText(/SKU не найден/)).toBeNull()
  })

  it('F-2: data arrived + nmId not found → empty-state "SKU не найден"', () => {
    // isLoading=false (default), isError=false (default), data is present but nmId missing
    render(<SkuAccuracyDetail nmId={99999} modelId="model-1" skuAccuracies={[entry]} />)
    expect(screen.getByText(/SKU не найден/)).toBeTruthy()
  })

  it('renders empty-state alert when nmId not found', () => {
    render(<SkuAccuracyDetail nmId={99999} modelId="model-1" skuAccuracies={[entry]} />)
    expect(screen.getByText(/SKU не найден/)).toBeTruthy()
    expect(screen.getByRole('link', { name: /Вернуться к обзору SKU/ })).toBeTruthy()
  })

  it('empty-state back-link points to sku-accuracy overview route', () => {
    render(<SkuAccuracyDetail nmId={99999} modelId="model-1" skuAccuracies={[entry]} />)
    const link = screen.getByRole('link', { name: /Вернуться к обзору SKU/ })
    expect(link.getAttribute('href')).toContain('sku-accuracy')
    expect(link.getAttribute('href')).toContain('model-1')
  })

  it('happy path: renders SKU header with nmId and vendorCode', () => {
    render(<SkuAccuracyDetail nmId={12345} modelId="model-1" skuAccuracies={[entry]} />)
    expect(screen.getByText(/Артикул 12345/)).toBeTruthy()
    expect(screen.getByText(/MY-SKU/)).toBeTruthy()
  })

  it('renders aggregate stats labels', () => {
    render(<SkuAccuracyDetail nmId={12345} modelId="model-1" skuAccuracies={[entry]} />)
    expect(screen.getByText('Средняя AI MAPE')).toBeTruthy()
    expect(screen.getByText('Средняя Naive MAPE')).toBeTruthy()
    expect(screen.getByText('AI accuracy %')).toBeTruthy()
    // F-3: naiveAccuracyPercent tile now rendered as 4th aggregate stat
    expect(screen.getByText('Naive accuracy %')).toBeTruthy()
  })

  // F-3: naiveAccuracyPercent tile — renders value when present, '—' when null
  it('F-3: naiveAccuracyPercent renders as formatted percentage when non-null', () => {
    render(<SkuAccuracyDetail nmId={12345} modelId="model-1" skuAccuracies={[entry]} />)
    // entry.naiveAccuracyPercent = 81.7 → should render as Russian locale percentage
    const fullText = document.body.textContent ?? ''
    expect(fullText).toContain('%')
    // Must not render as plain '81.7' (English decimal)
    expect(fullText).not.toContain('81.7%')
  })

  it('F-3: null naiveAccuracyPercent renders em-dash (AP#8 compliant)', () => {
    render(<SkuAccuracyDetail nmId={99999} modelId="model-1" skuAccuracies={[nullMapeEntry]} />)
    // nullMapeEntry has naiveAccuracyPercent: null → tile should show '—'
    expect(screen.getByText('Naive accuracy %')).toBeTruthy()
    const dashes = screen.getAllByText('—')
    // avgAiMape + avgNaiveMape + aiAccuracyPercent + naiveAccuracyPercent all null → at least 4
    expect(dashes.length).toBeGreaterThanOrEqual(4)
  })

  it('AP#8: null avgAiMape renders em-dash not 0', () => {
    render(<SkuAccuracyDetail nmId={99999} modelId="model-1" skuAccuracies={[nullMapeEntry]} />)
    const dashes = screen.getAllByText('—')
    // All 4 ratio tiles null → at least 4 em-dashes in stats (F-3: was 3, now 4)
    expect(dashes.length).toBeGreaterThanOrEqual(4)
  })

  it('renders Russian locale percentage for non-null avgAiMape', () => {
    render(<SkuAccuracyDetail nmId={12345} modelId="model-1" skuAccuracies={[entry]} />)
    const fullText = document.body.textContent ?? ''
    // Should contain % sign (MAPE rendered)
    expect(fullText).toContain('%')
    // English decimal dot must not appear in percentage output
    expect(fullText).not.toContain('5.57%')
  })

  it('renders history table with correct column headers', () => {
    render(<SkuAccuracyDetail nmId={12345} modelId="model-1" skuAccuracies={[entry]} />)
    expect(screen.getByText('Дата оценки')).toBeTruthy()
    expect(screen.getByText('Прогноз (ед.)')).toBeTruthy()
    // Story 163.5-FE: baseline units column present, distinct from Naive MAPE (%)
    expect(screen.getByText('Базовый прогноз (ед.)')).toBeTruthy()
    expect(screen.getByText('Факт (ед.)')).toBeTruthy()
    expect(screen.getByText('AI MAPE')).toBeTruthy()
    expect(screen.getByText('Naive MAPE')).toBeTruthy()
  })

  it('Story 171.8: history table caption names the SKU (RTC contract)', () => {
    render(<SkuAccuracyDetail nmId={12345} modelId="model-1" skuAccuracies={[entry]} />)
    // role-pin (semantic caption element, not just text)
    expect(screen.getByRole('caption')).toHaveTextContent('История оценок — артикул 12345')
  })

  it('history table renders all rows', () => {
    render(<SkuAccuracyDetail nmId={12345} modelId="model-1" skuAccuracies={[entry]} />)
    // 3 history entries = 3 tbody rows
    expect(screen.getByText('01.04.2026')).toBeTruthy()
    expect(screen.getByText('01.05.2026')).toBeTruthy()
    expect(screen.getByText('01.06.2026')).toBeTruthy()
  })

  it('history sorted DESC by evaluationDate (newest first)', () => {
    const { container } = render(
      <SkuAccuracyDetail nmId={12345} modelId="model-1" skuAccuracies={[entry]} />
    )
    const rows = container.querySelectorAll('tbody tr')
    // 2026-06-01 > 2026-05-01 > 2026-04-01 → June row first
    expect(rows[0].textContent).toContain('01.06.2026')
    expect(rows[1].textContent).toContain('01.05.2026')
    expect(rows[2].textContent).toContain('01.04.2026')
  })

  it('AP#8: null naiveMape in history renders em-dash', () => {
    render(<SkuAccuracyDetail nmId={12345} modelId="model-1" skuAccuracies={[entry]} />)
    // entry row with 2026-05-01 has naiveMape: null → '—'
    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBeGreaterThanOrEqual(1)
  })

  it('no history table rendered when history is empty', () => {
    render(<SkuAccuracyDetail nmId={99999} modelId="model-1" skuAccuracies={[nullMapeEntry]} />)
    // nullMapeEntry has empty history — stats card renders but history card does not
    expect(screen.queryByText('История оценок')).toBeNull()
  })

  // ----- Story 163.5-FE (FR10): naiveBaseline units column — AC2/AC3/AC4/AC5/AC6 -----

  it('163.5 AC1/AC4: "Базовый прогноз (ед.)" header is present and distinct from "Naive MAPE"', () => {
    render(<SkuAccuracyDetail nmId={12345} modelId="model-1" skuAccuracies={[entry]} />)
    // Units column carries "(ед.)"; percentage column retains MAPE labeling — understandable w/o color.
    expect(screen.getByText('Базовый прогноз (ед.)')).toBeTruthy()
    expect(screen.getByText('Naive MAPE')).toBeTruthy()
    const headers = Array.from(screen.getAllByRole('columnheader')).map(h => h.textContent ?? '')
    // Baseline column appears exactly once and is a different header than Naive MAPE.
    expect(headers.filter(h => h === 'Базовый прогноз (ед.)')).toHaveLength(1)
    expect(headers.filter(h => h === 'Naive MAPE')).toHaveLength(1)
  })

  it('163.5 AC2: finite naiveBaseline renders as a unit count via formatNumber', () => {
    const { container } = render(
      <SkuAccuracyDetail nmId={12345} modelId="model-1" skuAccuracies={[entry]} />
    )
    // 2026-05-01 row has naiveBaseline: 38.2 → formatNumber rounds to "38" (ru-RU grouping).
    const mayRow = Array.from(container.querySelectorAll('tbody tr')).find(r =>
      (r.textContent ?? '').includes('01.05.2026')
    )
    expect(mayRow).toBeTruthy()
    expect(mayRow?.textContent).toContain('38')
    // Fractional part is rounded away (unit count, integer formatter) — not "38,2".
    expect(mayRow?.textContent).not.toContain('38,2')
  })

  it('163.5 AC2: zero naiveBaseline renders "0", not "—" nor missing', () => {
    const { container } = render(
      <SkuAccuracyDetail nmId={12345} modelId="model-1" skuAccuracies={[entry]} />
    )
    // 2026-06-01 row has naiveBaseline: 0 → must render "0".
    const juneRow = Array.from(container.querySelectorAll('tbody tr')).find(r =>
      (r.textContent ?? '').includes('01.06.2026')
    )
    expect(juneRow).toBeTruthy()
    // Falsifiable guard: assert the SPECIFIC baseline cell (col index 2 —
    // date=0, прогноз=1, базовый=2, факт=3, AI MAPE=4, Naive MAPE=5) with EXACT equality.
    // Row-level toContain('0') is a no-op here: the date "01.06.2026", predictedUnits "30",
    // and mapeUnits "10,0 %" already contain "0", so a truthy-guard regression
    // (row.naiveBaseline ? formatNumber(...) : '—') would mask 0 as "—" and STILL pass.
    const juneCells = Array.from(juneRow!.querySelectorAll('td'))
    expect(juneCells[2].textContent).toBe('0')
  })

  it('163.5 AC3: null naiveBaseline renders "—" and is not coerced to 0', () => {
    const { container } = render(
      <SkuAccuracyDetail nmId={12345} modelId="model-1" skuAccuracies={[entry]} />
    )
    // 2026-04-01 row has naiveBaseline: null → must render an em-dash cell.
    const aprilRow = Array.from(container.querySelectorAll('tbody tr')).find(r =>
      (r.textContent ?? '').includes('01.04.2026')
    )
    expect(aprilRow).toBeTruthy()
    expect(aprilRow?.textContent).toContain('—')
  })

  it('163.5 AC5: baseline column sits between AI forecast and actual (column ordering)', () => {
    const { container } = render(
      <SkuAccuracyDetail nmId={12345} modelId="model-1" skuAccuracies={[entry]} />
    )
    // Read header cell text in DOM order; baseline must come after "Прогноз (ед.)" and before "Факт (ед.)".
    const headers = Array.from(container.querySelectorAll('thead th')).map(h => h.textContent ?? '')
    const baselineIdx = headers.findIndex(h => h.includes('Базовый прогноз'))
    const forecastIdx = headers.findIndex(h => h === 'Прогноз (ед.)')
    const actualIdx = headers.findIndex(h => h === 'Факт (ед.)')
    expect(baselineIdx).toBeGreaterThan(-1)
    expect(forecastIdx).toBeGreaterThan(-1)
    expect(actualIdx).toBeGreaterThan(-1)
    expect(baselineIdx).toBeGreaterThan(forecastIdx)
    expect(baselineIdx).toBeLessThan(actualIdx)
  })

  it('163.5 AC5: adding the baseline column keeps the table operable on a narrow viewport', () => {
    // jsdom ignores viewport size, but the table renders an overflow-scroll wrapper by default
    // (shadcn Table → div.overflow-x-auto). The new column must not drop existing columns/controls:
    // all 6 headers still render, and no cell throws for any null/0/finite baseline combination.
    const { container } = render(
      <SkuAccuracyDetail nmId={12345} modelId="model-1" skuAccuracies={[entry]} />
    )
    const headerTexts = Array.from(container.querySelectorAll('thead th')).map(
      h => h.textContent ?? ''
    )
    expect(headerTexts).toHaveLength(6)
    // All three baseline states (null / finite / 0) rendered without throwing — rows count matches history.
    expect(container.querySelectorAll('tbody tr')).toHaveLength(entry.history.length)
  })
})
