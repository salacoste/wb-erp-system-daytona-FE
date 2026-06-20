/**
 * EvaluationsHeaderCard smoke tests — Story 112.4-FE
 *
 * Covers: null model guard, model identity row, summary cards (MAPE, date, SKU count),
 * CSV export button presence.
 */

import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils/test-utils'
import { EvaluationsHeaderCard } from '../EvaluationsHeaderCard'
import type { AiModel } from '@/types/ai/models'
import type { AiEvaluationListResponse } from '@/types/ai/evaluations'

// ── Mocks ──────────────────────────────────────────────────────────────────

vi.mock('@/components/custom/ai/ExportCsvButton', () => ({
  ExportCsvButton: ({ disabled }: { disabled: boolean }) =>
    React.createElement('button', { 'data-testid': 'export-csv', disabled }, 'Export CSV'),
}))

vi.mock('@/lib/csv/evaluations-csv-export', () => ({
  exportEvaluationsToCsv: vi.fn(() => 'csv-content'),
}))

// ── Fixtures ───────────────────────────────────────────────────────────────

const mockModel: AiModel = {
  id: 'model-1',
  modelType: 'sales_forecast',
  engine: 'prophet',
  version: 3,
  status: 'active',
  metrics: { mape: 12.4, dataPointsCount: 500 },
  trainedAt: '2026-01-15T12:00:00Z',
}

const mockEvalData: AiEvaluationListResponse = {
  evaluations: [],
  cabinetMape: 8.5,
  evaluatedAt: '2026-06-01T10:00:00Z',
  skuCount: 42,
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('EvaluationsHeaderCard', () => {
  it('renders nothing when model is undefined', () => {
    const { container } = renderWithProviders(
      <EvaluationsHeaderCard model={undefined} data={mockEvalData} modelId="model-1" />
    )
    expect(container.innerHTML).toBe('')
  })

  it('renders the summary card title', () => {
    renderWithProviders(
      <EvaluationsHeaderCard model={mockModel} data={mockEvalData} modelId="model-1" />
    )
    expect(screen.getByText('Сводка оценок')).toBeInTheDocument()
  })

  it('renders model identity: type label, version, and status badge', () => {
    renderWithProviders(
      <EvaluationsHeaderCard model={mockModel} data={mockEvalData} modelId="model-1" />
    )
    // getModelTypeLabel('sales_forecast') should render a label
    expect(screen.getByText('v3')).toBeInTheDocument()
    // STATUS_BADGE_CONFIG.active.label = 'Активна'
    expect(screen.getByText('Активна')).toBeInTheDocument()
  })

  it('renders the three summary cards', () => {
    renderWithProviders(
      <EvaluationsHeaderCard model={mockModel} data={mockEvalData} modelId="model-1" />
    )
    expect(screen.getByText('Средняя точность (MAPE)')).toBeInTheDocument()
    expect(screen.getByText('Последняя оценка')).toBeInTheDocument()
    expect(screen.getByText('SKU оценено')).toBeInTheDocument()
  })

  it('renders cabinetMape value when present', () => {
    renderWithProviders(
      <EvaluationsHeaderCard model={mockModel} data={mockEvalData} modelId="model-1" />
    )
    // cabinetMape=8.5 → formatPercentage(8.5) → "8,5 %"
    expect(screen.getByText(/8,5\s*%/)).toBeInTheDocument()
  })

  it('renders dash when cabinetMape is null', () => {
    const dataNoMape: AiEvaluationListResponse = { ...mockEvalData, cabinetMape: null }
    renderWithProviders(
      <EvaluationsHeaderCard model={mockModel} data={dataNoMape} modelId="model-1" />
    )
    // The MAPE card value should be "—"
    const mapeCard = screen.getByText('Средняя точность (MAPE)').parentElement
    expect(mapeCard?.querySelector('.text-2xl')?.textContent).toBe('—')
  })

  it('renders evaluatedAt date when present', () => {
    renderWithProviders(
      <EvaluationsHeaderCard model={mockModel} data={mockEvalData} modelId="model-1" />
    )
    // evaluatedAt='2026-06-01T10:00:00Z' → formatDate → '01.06.2026'
    expect(screen.getByText(/01\.06\.2026/)).toBeInTheDocument()
  })

  it('renders dash when evaluatedAt is null', () => {
    const dataNoDate: AiEvaluationListResponse = { ...mockEvalData, evaluatedAt: null }
    renderWithProviders(
      <EvaluationsHeaderCard model={mockModel} data={dataNoDate} modelId="model-1" />
    )
    const dateCard = screen.getByText('Последняя оценка').parentElement
    expect(dateCard?.querySelector('.text-2xl')?.textContent).toBe('—')
  })

  it('renders the CSV export button', () => {
    renderWithProviders(
      <EvaluationsHeaderCard model={mockModel} data={mockEvalData} modelId="model-1" />
    )
    expect(screen.getByTestId('export-csv')).toBeInTheDocument()
  })

  it('disables CSV export when evaluations array is empty', () => {
    renderWithProviders(
      <EvaluationsHeaderCard model={mockModel} data={mockEvalData} modelId="model-1" />
    )
    expect(screen.getByTestId('export-csv')).toHaveAttribute('disabled')
  })

  it('renders SKU count', () => {
    renderWithProviders(
      <EvaluationsHeaderCard model={mockModel} data={mockEvalData} modelId="model-1" />
    )
    // skuCount=42 → formatNumber(42) → "42"
    expect(screen.getByText('42')).toBeInTheDocument()
  })
})
