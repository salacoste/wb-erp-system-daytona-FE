/**
 * Unit Tests for SyncGapsTimeline Component
 * Story 73.5-FE: Visual data coverage indicator
 *
 * Integration-style render tests — no mocks.
 */

import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SyncGapsTimeline } from '../SyncGapsTimeline'
import type { SyncStatusResponse } from '@/types/advertising-analytics'

const baseSyncStatus: SyncStatusResponse = {
  lastSyncAt: '2025-01-03T12:00:00Z',
  nextScheduledSync: '2025-01-04T04:00:00Z',
  status: 'completed',
  campaignsSynced: 5,
  dataAvailableFrom: '2025-01-01',
  dataAvailableTo: '2025-01-03',
  healthStatus: 'ok',
  dataGaps: [],
}

describe('SyncGapsTimeline', () => {
  it('renders toggle button with default text', () => {
    render(<SyncGapsTimeline from="2025-01-01" to="2025-01-03" />)

    expect(screen.getByRole('button', { name: /Показать покрытие данных/ })).toBeInTheDocument()
  })

  it('shows "Нет информации о покрытии" when syncStatus is undefined', () => {
    render(<SyncGapsTimeline from="2025-01-01" to="2025-01-03" />)

    fireEvent.click(screen.getByRole('button'))

    expect(screen.getByText('Нет информации о покрытии')).toBeInTheDocument()
  })

  it('shows coverage summary with correct text when syncStatus has data', () => {
    render(<SyncGapsTimeline from="2025-01-01" to="2025-01-03" syncStatus={baseSyncStatus} />)

    fireEvent.click(screen.getByRole('button'))

    expect(screen.getByText(/Синхронизировано 3 из 3 дней/)).toBeInTheDocument()
    expect(screen.getByText(/100\s%/)).toBeInTheDocument() // ru-RU NBSP
  })

  it('changes toggle text to "Скрыть покрытие данных" after click', () => {
    render(<SyncGapsTimeline from="2025-01-01" to="2025-01-03" syncStatus={baseSyncStatus} />)

    fireEvent.click(screen.getByRole('button'))

    expect(screen.getByRole('button', { name: /Скрыть покрытие данных/ })).toBeInTheDocument()
  })

  it('renders correct number of day cells for date range', () => {
    render(
      <SyncGapsTimeline
        from="2025-01-01"
        to="2025-01-05"
        syncStatus={{
          ...baseSyncStatus,
          dataAvailableTo: '2025-01-05',
        }}
      />
    )

    fireEvent.click(screen.getByRole('button'))

    const dayCells = screen.getAllByLabelText(/^\d{2}\.\d{2}\.\d{4}/)
    expect(dayCells).toHaveLength(5)
  })

  it('shows green coverage text when 100% synced', () => {
    render(<SyncGapsTimeline from="2025-01-01" to="2025-01-03" syncStatus={baseSyncStatus} />)

    fireEvent.click(screen.getByRole('button'))

    const coverageText = screen.getByText(/Синхронизировано 3 из 3 дней/)
    expect(coverageText).toHaveClass('text-status-success') // Story 170.1 token pin
  })
})
