import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils/test-utils'
import { ShipmentsEmptyState } from '../ShipmentsEmptyState'

describe('ShipmentsEmptyState', () => {
  const defaultProps = {
    hasSkuPackaging: true,
    onCreateClick: vi.fn(),
  }

  it('renders empty state title and description', () => {
    renderWithProviders(<ShipmentsEmptyState {...defaultProps} />)
    expect(screen.getByText('Нет отправок')).toBeInTheDocument()
    expect(
      screen.getByText('Создайте первую отправку для расчёта стоимости доставки')
    ).toBeInTheDocument()
  })

  it('shows packaging hint when hasSkuPackaging is false', () => {
    renderWithProviders(<ShipmentsEmptyState {...defaultProps} hasSkuPackaging={false} />)
    expect(screen.getByText('Сначала настройте упаковку товаров')).toBeInTheDocument()
  })

  it('hides packaging hint when hasSkuPackaging is true', () => {
    renderWithProviders(<ShipmentsEmptyState {...defaultProps} hasSkuPackaging={true} />)
    expect(screen.queryByText('Сначала настройте упаковку товаров')).not.toBeInTheDocument()
  })

  it('disables create button when no packaging exists', () => {
    renderWithProviders(<ShipmentsEmptyState {...defaultProps} hasSkuPackaging={false} />)
    expect(screen.getByRole('button', { name: /создать отправку/i })).toBeDisabled()
  })

  it('enables create button when packaging exists', () => {
    renderWithProviders(<ShipmentsEmptyState {...defaultProps} hasSkuPackaging={true} />)
    expect(screen.getByRole('button', { name: /создать отправку/i })).toBeEnabled()
  })
})
