import { describe, it, expect, vi } from 'vitest'
import { screen, within } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils/test-utils'
import { ShipmentsEmptyState } from '../ShipmentsEmptyState'

describe('ShipmentsEmptyState', () => {
  const defaultProps = {
    hasSkuPackaging: true,
    onCreateClick: vi.fn(),
  }

  it('renders empty state title and description', () => {
    renderWithProviders(<ShipmentsEmptyState {...defaultProps} />)
    expect(screen.getByRole('region', { name: 'Нет отправок' })).toHaveAttribute(
      'data-state',
      'empty'
    )
    expect(
      within(screen.getByRole('region', { name: 'Нет отправок' }))
        .getAllByText(/создайте первую отправку, чтобы рассчитать стоимость доставки/i)
        .some(element => !element.classList.contains('sr-only'))
    ).toBe(true)
    expect(screen.getByText(/фильтры не применены/i)).toBeVisible()
  })

  it('shows packaging hint when hasSkuPackaging is false', () => {
    renderWithProviders(<ShipmentsEmptyState {...defaultProps} hasSkuPackaging={false} />)
    expect(screen.getByRole('link', { name: /настройте упаковку товаров/i })).toHaveAttribute(
      'href',
      '/shipments/sku-packaging'
    )
  })

  it('hides packaging hint when hasSkuPackaging is true', () => {
    renderWithProviders(<ShipmentsEmptyState {...defaultProps} hasSkuPackaging={true} />)
    expect(
      screen.queryByRole('link', { name: /настройте упаковку товаров/i })
    ).not.toBeInTheDocument()
  })

  it('disables create button when no packaging exists', () => {
    renderWithProviders(<ShipmentsEmptyState {...defaultProps} hasSkuPackaging={false} />)
    expect(screen.getByRole('button', { name: /создать отправку/i })).toBeDisabled()
  })

  it('enables create button when packaging exists', () => {
    renderWithProviders(<ShipmentsEmptyState {...defaultProps} hasSkuPackaging={true} />)
    expect(screen.getByRole('button', { name: /создать отправку/i })).toBeEnabled()
  })

  it('does not expose a create action to read-only users', () => {
    renderWithProviders(<ShipmentsEmptyState {...defaultProps} canCreate={false} />)
    expect(screen.queryByRole('button', { name: /создать отправку/i })).not.toBeInTheDocument()
  })
})
