import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils/test-utils'
import {
  CogsHistoryEmpty,
  CogsHistoryError,
  CogsHistoryLoading,
  CogsHistoryNoNmId,
} from '../CogsHistoryPageStates'

describe('CogsHistoryPageStates — page heading', () => {
  it('renders a page-level h1 when nmId is missing', () => {
    renderWithProviders(<CogsHistoryNoNmId />)

    expect(screen.getByRole('heading', { level: 1, name: 'История COGS' })).toBeInTheDocument()
  })

  it('renders a page-level h1 in loading state', () => {
    renderWithProviders(<CogsHistoryLoading />)

    expect(screen.getByRole('heading', { level: 1, name: 'История COGS' })).toBeInTheDocument()
  })

  it('renders a page-level h1 in error state', () => {
    renderWithProviders(<CogsHistoryError error={new Error('boom')} onRetry={vi.fn()} />)

    expect(screen.getByRole('heading', { level: 1, name: 'История COGS' })).toBeInTheDocument()
  })

  it('renders a generic h1 for empty state without product metadata', () => {
    renderWithProviders(<CogsHistoryEmpty nmId="123" meta={null} />)

    expect(screen.getByRole('heading', { level: 1, name: 'История COGS' })).toBeInTheDocument()
  })

  it('uses product metadata h1 without adding a duplicate h1 when metadata exists', () => {
    renderWithProviders(
      <CogsHistoryEmpty
        nmId="123"
        meta={
          {
            nm_id: '123',
            product_name: 'Тестовый товар',
            current_cogs: null,
            total_versions: 0,
          } as Parameters<typeof CogsHistoryEmpty>[0]['meta']
        }
      />
    )

    expect(screen.getByRole('heading', { level: 1, name: 'Тестовый товар' })).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { level: 1, name: 'История COGS' })
    ).not.toBeInTheDocument()
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
  })
})
