/**
 * CollectingProgressTracker placeholder tests
 * Story 108.3-FE: Minimal scaffold; Story 108.4 will expand with progress bar, SKUs, etc.
 */
import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CollectingProgressTracker } from '../CollectingProgressTracker'
import type { AiStatusResponse } from '@/types/ai/status'

const mockStatus: AiStatusResponse = {
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
  it('renders collecting progress text with correct counts', () => {
    render(<CollectingProgressTracker status={mockStatus} />)
    expect(screen.getByText(/Собрано 4 из 12 недель/)).toBeInTheDocument()
    expect(screen.getByText(/33% готовности/)).toBeInTheDocument()
  })

  it('renders section heading', () => {
    render(<CollectingProgressTracker status={mockStatus} />)
    expect(screen.getByText('Сбор данных для AI')).toBeInTheDocument()
  })

  it('renders progressPct as 0 when null', () => {
    const statusNullPct: AiStatusResponse = { ...mockStatus, progressPct: null }
    render(<CollectingProgressTracker status={statusNullPct} />)
    expect(screen.getByText(/0% готовности/)).toBeInTheDocument()
  })
})
