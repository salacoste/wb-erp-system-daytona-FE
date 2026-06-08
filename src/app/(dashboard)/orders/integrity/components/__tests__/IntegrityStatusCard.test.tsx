/**
 * IntegrityStatusCard Unit Tests
 *
 * Verifies status card rendering:
 * - Renders healthy/warning/unhealthy status correctly
 * - Displays last check timestamp
 * - Displays duration in seconds
 * - Refresh button disabled when refetching
 */

import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils/test-utils'
import { IntegrityStatusCard } from '../IntegrityStatusCard'

const baseProps = {
  status: 'healthy' as const,
  durationMs: 2500,
  lastCheck: '2025-06-01T12:00:00Z',
  onRefresh: vi.fn(),
  isRefetching: false,
}

describe('IntegrityStatusCard', () => {
  it('renders healthy status with correct label', () => {
    renderWithProviders(<IntegrityStatusCard {...baseProps} />)
    expect(screen.getByText('Данные в порядке')).toBeInTheDocument()
    expect(screen.getByText('Целостность данных')).toBeInTheDocument()
  })

  it('renders warning status with correct label', () => {
    renderWithProviders(<IntegrityStatusCard {...baseProps} status="warning" />)
    expect(screen.getByText('Есть предупреждения')).toBeInTheDocument()
  })

  it('renders unhealthy status with correct label', () => {
    renderWithProviders(<IntegrityStatusCard {...baseProps} status="unhealthy" />)
    expect(screen.getByText('Обнаружены проблемы')).toBeInTheDocument()
  })

  it('renders duration in seconds', () => {
    renderWithProviders(<IntegrityStatusCard {...baseProps} />)
    expect(screen.getByText(/\(2\.5 сек\.\)/)).toBeInTheDocument()
  })

  it('renders refresh button', () => {
    renderWithProviders(<IntegrityStatusCard {...baseProps} />)
    expect(screen.getByLabelText('Обновить проверку')).toBeInTheDocument()
    expect(screen.getByText('Обновить')).toBeInTheDocument()
  })

  it('disables refresh button when refetching', () => {
    renderWithProviders(<IntegrityStatusCard {...baseProps} isRefetching={true} />)
    expect(screen.getByLabelText('Обновить проверку')).toBeDisabled()
  })
})
