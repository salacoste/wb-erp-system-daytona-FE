/**
 * SkuAccuracyDetail unit tests — Story 110.3-FE Task 6.
 * Covers: happy path, empty-state (nmId not found), AP#8 null rendering,
 * history table rendering, locale formatters, history DESC sort.
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
  ],
  avgAiMape: 5.57,
  avgNaiveMape: 9.52,
  aiAccuracyPercent: 41.5,
  naiveAccuracyPercent: 81.7,
  evaluationCount: 2,
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
    expect(screen.getByText('Факт (ед.)')).toBeTruthy()
    expect(screen.getByText('AI MAPE')).toBeTruthy()
    expect(screen.getByText('Naive MAPE')).toBeTruthy()
  })

  it('history table renders both rows', () => {
    render(<SkuAccuracyDetail nmId={12345} modelId="model-1" skuAccuracies={[entry]} />)
    // 2 history entries = 2 tbody rows
    expect(screen.getByText('01.04.2026')).toBeTruthy()
    expect(screen.getByText('01.05.2026')).toBeTruthy()
  })

  it('history sorted DESC by evaluationDate (newest first)', () => {
    const { container } = render(
      <SkuAccuracyDetail nmId={12345} modelId="model-1" skuAccuracies={[entry]} />
    )
    const rows = container.querySelectorAll('tbody tr')
    // 2026-05-01 > 2026-04-01 → May row first
    expect(rows[0].textContent).toContain('01.05.2026')
    expect(rows[1].textContent).toContain('01.04.2026')
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
})
