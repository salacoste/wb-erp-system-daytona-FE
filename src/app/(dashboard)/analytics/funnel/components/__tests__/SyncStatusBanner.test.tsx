import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { SyncStatusBanner } from '../SyncStatusBanner'

describe('SyncStatusBanner', () => {
  it('announces the initial sync-status loading state', () => {
    render(<SyncStatusBanner isLoading />)

    expect(screen.getByRole('status')).toHaveTextContent('Статус синхронизации загружается')
  })

  it('renders a recoverable terminal sync-status error', async () => {
    const onRetry = vi.fn()
    const user = userEvent.setup()
    render(<SyncStatusBanner isError onRetry={onRetry} />)

    expect(screen.getByRole('alert')).toHaveTextContent('Не удалось загрузить статус синхронизации')
    await user.click(screen.getByRole('button', { name: 'Повторить статус синхронизации' }))
    expect(onRetry).toHaveBeenCalledOnce()
  })

  it('renders the explicit never-synced gap without a trustworthy timestamp', () => {
    render(<SyncStatusBanner syncStatus={{ lastSyncAt: null, productsCount: 0 }} />)

    expect(screen.getByText(/Данные ещё не загружены/)).toBeVisible()
    expect(screen.queryByText(/актуальны/)).not.toBeInTheDocument()
  })

  it('reports the source timestamp without claiming arbitrary old data is current', () => {
    render(
      <SyncStatusBanner
        syncStatus={{ lastSyncAt: '2025-01-01T10:00:00+03:00', productsCount: 125 }}
      />
    )

    expect(screen.getByText(/Последняя синхронизация: 01.01.2025 10:00/)).toBeVisible()
    expect(screen.getByText('(125 товаров)')).toBeVisible()
    expect(screen.queryByText(/Данные актуальны/)).not.toBeInTheDocument()
  })

  it('retains the last timestamp and exposes retry after a polling failure', async () => {
    const onRetry = vi.fn()
    const user = userEvent.setup()
    render(
      <SyncStatusBanner
        syncStatus={{ lastSyncAt: '2025-01-01T10:00:00+03:00', productsCount: 125 }}
        isError
        onRetry={onRetry}
      />
    )

    expect(screen.getByRole('alert')).toHaveTextContent(/Показан ранее полученный статус/)
    expect(screen.getByText(/Последняя синхронизация: 01.01.2025 10:00/)).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Повторить статус синхронизации' }))
    expect(onRetry).toHaveBeenCalledOnce()
  })
})
