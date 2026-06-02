/**
 * PipelineHeatmap tests — Epic 68-FE
 * Focus: summary.successRate is a 0-1 ratio (#149:243). The "Успешность" summary
 * item must scale to percent before formatting (1 → "100,0 %", NOT "1.0%").
 * Mocks usePipelineGrid to avoid network + auth-store wiring. Regex locale assertions.
 */

import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils/test-utils'
import { PipelineHeatmap } from '../PipelineHeatmap'
import type { PipelineHealthGrid } from '../../types/monitoring'

vi.mock('../../hooks/use-pipeline-grid', () => ({
  usePipelineGrid: vi.fn(),
}))

import { usePipelineGrid } from '../../hooks/use-pipeline-grid'

const mockUsePipelineGrid = vi.mocked(usePipelineGrid)

function makeGrid(): PipelineHealthGrid {
  return {
    cabinetId: 'cab-1',
    period: { from: '2026-01-01', to: '2026-01-07' },
    resolution: 'day',
    generatedAt: '2026-01-07T00:00:00Z',
    summary: {
      overallStatus: 'healthy',
      healthScore: 100,
      totalPipelines: 1,
      healthyPipelines: 1,
      degradedPipelines: 0,
      criticalPipelines: 0,
      totalExecutions: 42,
      totalFailures: 0,
      successRate: 1, // 0-1 ratio → must render "100,0 %"
    },
    pipelines: [],
  }
}

describe('PipelineHeatmap — summary.successRate (0-1 ratio)', () => {
  it('renders a perfect successRate of 1 as "100,0 %" (not "1.0%")', () => {
    mockUsePipelineGrid.mockReturnValue({
      data: makeGrid(),
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof usePipelineGrid>)

    renderWithProviders(<PipelineHeatmap enabled />)

    const successItem = screen.getByText('Успешность:').parentElement
    expect(successItem?.textContent).toMatch(/100,0\s%/)
    expect(successItem?.textContent).not.toContain('1.0%')
  })
})
