import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils/test-utils'
import { PipelineStatusGrid } from '../PipelineStatusGrid'
import type { DashboardPipeline } from '../../types/monitoring'

function pipeline(overrides: Partial<DashboardPipeline> = {}): DashboardPipeline {
  return {
    pipelineId: 'fbo_orders_sync',
    displayName: 'FBO Заказы',
    category: 'high_frequency',
    status: 'healthy',
    lastSuccessAt: '2026-06-03T02:00:00.000Z',
    dataLagMinutes: 11,
    successRate24h: 1,
    ...overrides,
  }
}

function renderGrid(pipelines: DashboardPipeline[]) {
  // renderWithProviders already supplies a TooltipProvider (test-utils AllProviders).
  return renderWithProviders(<PipelineStatusGrid pipelines={pipelines} isLoading={false} />)
}

describe('PipelineStatusGrid — error badge degrades when backend omits errorRate', () => {
  // Live GET /v1/monitoring/dashboard pipeline objects omit errorRate/tasksWithErrors/
  // totalResultErrors. The old required typing ran `undefined >= 0.01` (always false). The fix
  // makes them optional + `(errorRate ?? 0) >= 0.01` — badge stays hidden, no "NaN%"/crash.
  it('hides the amber error badge when errorRate is absent (live dashboard shape)', () => {
    const { container } = renderGrid([pipeline()])
    expect(screen.getByText('FBO Заказы')).toBeInTheDocument()
    expect(container.querySelector('.border-amber-500')).toBeNull()
  })

  it('hides the badge for a sub-1% error rate (0.004 → no "0%" badge)', () => {
    const { container } = renderGrid([
      pipeline({ errorRate: 0.004, tasksWithErrors: 0, totalResultErrors: 1 }),
    ])
    expect(container.querySelector('.border-amber-500')).toBeNull()
  })

  it('renders the amber error badge when errorRate is present and >= 1%', () => {
    const { container } = renderGrid([
      pipeline({ status: 'warning', errorRate: 0.1, tasksWithErrors: 2, totalResultErrors: 5 }),
    ])
    expect(container.querySelector('.border-amber-500')).not.toBeNull()
    expect(screen.getByText('10%')).toBeInTheDocument()
  })
})
