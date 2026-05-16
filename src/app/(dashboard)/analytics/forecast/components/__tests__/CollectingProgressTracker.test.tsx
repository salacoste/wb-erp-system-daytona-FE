/**
 * CollectingProgressTracker full tests
 * Story 108.4-FE: Expanded from 108.3 placeholder.
 *
 * Tests:
 * - Renders progress bar and week counts
 * - Em-dash when progressPct is null (Defensive Frontend Principle)
 * - Missing requirements list with AlertTriangle icons
 * - "All met" message when missingRequirements is empty
 * - COGS warning when coverage < 90%
 * - No COGS warning when coverage >= 90%
 * - No COGS warning when cogsCoveragePct is null
 * - Estimated activation date shown
 * - "ещё рассчитывается" when estimatedActivationDate is null
 */
import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CollectingProgressTracker } from '../CollectingProgressTracker'
import type { AiStatusResponse } from '@/types/ai/status'

// Stub useAiTrends so TopSkusTable doesn't need a real network
vi.mock('@/hooks/useAiTrends', () => ({
  useAiTrends: () => ({ data: { topSkus: [] }, isLoading: false, isError: false }),
}))

vi.mock('@/stores/authStore', () => ({
  useAuthStore: (selector: (s: { cabinetId: string | null }) => unknown) =>
    selector({ cabinetId: 'cabinet-1' }),
}))

function wrap(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>)
}

const base: AiStatusResponse = {
  readinessLevel: 'collecting',
  weeksCollected: 4,
  weeksRequired: 12,
  progressPct: 33,
  missingRequirements: ['Требуется больше данных'],
  estimatedActivationDate: '2026-08-01',
  cogsCoveragePct: null,
  skuCount: 10,
  orderCount: 300,
}

describe('CollectingProgressTracker', () => {
  it('renders heading', () => {
    wrap(<CollectingProgressTracker status={base} />)
    expect(screen.getByText('Сбор данных для AI')).toBeInTheDocument()
  })

  it('renders week counts and stats', () => {
    wrap(<CollectingProgressTracker status={base} />)
    expect(screen.getByText(/Собрано:/)).toBeInTheDocument()
    expect(screen.getByText(/4 из 12 недель/)).toBeInTheDocument()
    expect(screen.getByText(/SKU отслеживается:/)).toBeInTheDocument()
    expect(screen.getByText(/10/)).toBeInTheDocument()
    expect(screen.getByText(/Заказов:/)).toBeInTheDocument()
    expect(screen.getByText(/300/)).toBeInTheDocument()
  })

  it('renders progress percentage', () => {
    wrap(<CollectingProgressTracker status={base} />)
    expect(screen.getByText(/33% готовности/)).toBeInTheDocument()
  })

  it('renders em-dash when progressPct is null (preserve evidence, Defensive Frontend Principle)', () => {
    wrap(<CollectingProgressTracker status={{ ...base, progressPct: null }} />)
    expect(screen.getByText(/— готовности/)).toBeInTheDocument()
  })

  it('renders missing requirements list with warning icon text', () => {
    wrap(<CollectingProgressTracker status={base} />)
    expect(screen.getByText('Требуется больше данных')).toBeInTheDocument()
  })

  it('renders "all met" when missingRequirements is empty', () => {
    wrap(<CollectingProgressTracker status={{ ...base, missingRequirements: [] }} />)
    expect(screen.getByText('Все требования выполнены')).toBeInTheDocument()
  })

  it('renders COGS warning when coverage < 90%', () => {
    wrap(<CollectingProgressTracker status={{ ...base, cogsCoveragePct: 75 }} />)
    expect(screen.getByText(/Покрытие COGS: 75% \(нужно ≥90%\)/)).toBeInTheDocument()
  })

  it('does not render COGS warning when coverage >= 90%', () => {
    wrap(<CollectingProgressTracker status={{ ...base, cogsCoveragePct: 95 }} />)
    expect(screen.queryByText(/Покрытие COGS/)).not.toBeInTheDocument()
  })

  it('does not render COGS warning when cogsCoveragePct is null', () => {
    wrap(<CollectingProgressTracker status={{ ...base, cogsCoveragePct: null }} />)
    expect(screen.queryByText(/Покрытие COGS/)).not.toBeInTheDocument()
  })

  it('renders estimated activation date', () => {
    wrap(<CollectingProgressTracker status={base} />)
    expect(screen.getByText(/Ожидаемая активация:/)).toBeInTheDocument()
    // formatDate('2026-08-01') — just verify the label appears with a date
    expect(screen.getByText(/Ожидаемая активация: /)).toBeInTheDocument()
  })

  it('renders "ещё рассчитывается" when estimatedActivationDate is null', () => {
    wrap(<CollectingProgressTracker status={{ ...base, estimatedActivationDate: null }} />)
    expect(screen.getByText('Ожидаемая активация: ещё рассчитывается')).toBeInTheDocument()
  })
})
