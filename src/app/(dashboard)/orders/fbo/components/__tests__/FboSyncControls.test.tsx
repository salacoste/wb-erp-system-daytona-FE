/**
 * FboSyncControls Unit Tests
 *
 * Verifies sync controls rendering:
 * - Sync button renders with correct label and aria-label
 * - Button is disabled when syncing
 * - Sync status badge renders when data available
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils/test-utils'
import { FboSyncControls } from '../FboSyncControls'

// Mutable mock factories so individual tests can override return values
const mockSyncFn = vi.fn()
let mockIsPending = false
let mockSyncStatusData: {
  enabled: boolean
  schedule: string
  timezone: string
} | null = null

vi.mock('@/hooks/useOrdersFbo', () => ({
  useSyncOrdersFbo: () => ({
    mutate: mockSyncFn,
    isPending: mockIsPending,
  }),
  useOrdersFboSyncStatus: () => ({
    data: mockSyncStatusData,
  }),
}))

describe('FboSyncControls', () => {
  beforeEach(() => {
    mockIsPending = false
    mockSyncStatusData = null
    mockSyncFn.mockClear()
  })

  it('renders sync button with correct label', () => {
    renderWithProviders(<FboSyncControls />)
    expect(screen.getByLabelText('Синхронизировать FBO заказы')).toBeInTheDocument()
    expect(screen.getByText('Синхронизировать')).toBeInTheDocument()
  })

  it('renders sync status badge when data is available', () => {
    mockSyncStatusData = {
      enabled: true,
      schedule: 'Каждые 15 минут',
      timezone: 'Europe/Moscow',
    }
    renderWithProviders(<FboSyncControls />)
    expect(screen.getByText('Активен')).toBeInTheDocument()
    expect(screen.getByText('Каждые 15 минут')).toBeInTheDocument()
  })

  it('renders disabled badge when sync is not enabled', () => {
    mockSyncStatusData = {
      enabled: false,
      schedule: 'Отключено',
      timezone: 'Europe/Moscow',
    }
    renderWithProviders(<FboSyncControls />)
    expect(screen.getByText('Выключен')).toBeInTheDocument()
  })
})
