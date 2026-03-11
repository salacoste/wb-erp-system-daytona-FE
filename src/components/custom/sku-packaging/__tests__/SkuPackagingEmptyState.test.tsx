import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils/test-utils'
import { SkuPackagingEmptyState } from '../SkuPackagingEmptyState'

describe('SkuPackagingEmptyState', () => {
  const defaultProps = {
    hasBoxTypes: true,
    onCreateClick: vi.fn(),
  }

  it('renders "Нет привязок упаковки" heading', () => {
    renderWithProviders(<SkuPackagingEmptyState {...defaultProps} />)
    expect(screen.getByText('Нет привязок упаковки')).toBeInTheDocument()
  })

  describe('when hasBoxTypes=false', () => {
    it('shows link to box types page', () => {
      renderWithProviders(<SkuPackagingEmptyState {...defaultProps} hasBoxTypes={false} />)
      const link = screen.getByText('Сначала добавьте типы коробок')
      expect(link).toBeInTheDocument()
      expect(link.closest('a')).toHaveAttribute('href', '/shipments/box-types')
    })

    it('disables CTA button', () => {
      renderWithProviders(<SkuPackagingEmptyState {...defaultProps} hasBoxTypes={false} />)
      expect(screen.getByRole('button', { name: /добавить упаковку/i })).toBeDisabled()
    })
  })

  describe('when hasBoxTypes=true', () => {
    it('does not show box types hint', () => {
      renderWithProviders(<SkuPackagingEmptyState {...defaultProps} />)
      expect(screen.queryByText('Сначала добавьте типы коробок')).not.toBeInTheDocument()
    })

    it('enables CTA button', () => {
      renderWithProviders(<SkuPackagingEmptyState {...defaultProps} />)
      expect(screen.getByRole('button', { name: /добавить упаковку/i })).toBeEnabled()
    })

    it('calls onCreateClick when CTA is clicked', async () => {
      const user = userEvent.setup()
      const onCreateClick = vi.fn()
      renderWithProviders(<SkuPackagingEmptyState hasBoxTypes onCreateClick={onCreateClick} />)
      await user.click(screen.getByRole('button', { name: /добавить упаковку/i }))
      expect(onCreateClick).toHaveBeenCalledOnce()
    })
  })
})
