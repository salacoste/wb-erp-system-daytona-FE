import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils/test-utils'
import { ProductCombobox } from '../ProductCombobox'

vi.mock('@/hooks/useProducts', () => ({
  useProducts: () => ({
    data: {
      products: [
        {
          nm_id: 111222333,
          sa_name: 'Кроссовки',
          brand: 'Nike',
          vendor_code: 'NK-001',
        },
      ],
    },
    isLoading: false,
  }),
}))

describe('ProductCombobox', () => {
  const defaultProps = {
    value: null as number | null,
    onChange: vi.fn(),
    disabled: false,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders combobox trigger button', () => {
    renderWithProviders(<ProductCombobox {...defaultProps} />)
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('shows "Выберите товар..." placeholder when no value', () => {
    renderWithProviders(<ProductCombobox {...defaultProps} />)
    expect(screen.getByText('Выберите товар...')).toBeInTheDocument()
  })

  it('forwards aria-describedby to trigger button', () => {
    renderWithProviders(<ProductCombobox {...defaultProps} aria-describedby="error-id" />)
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-describedby', 'error-id')
  })

  it('forwards aria-invalid to trigger button', () => {
    renderWithProviders(<ProductCombobox {...defaultProps} aria-invalid={true} />)
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-invalid', 'true')
  })

  it('displays selected label when value is set', () => {
    renderWithProviders(<ProductCombobox {...defaultProps} value={111222333} />)
    // When value is set but no selectedLabel from interaction,
    // falls back to String(value)
    expect(screen.getByText('111222333')).toBeInTheDocument()
  })

  it('disables button when disabled prop is true', () => {
    renderWithProviders(<ProductCombobox {...defaultProps} disabled />)
    expect(screen.getByRole('combobox')).toBeDisabled()
  })
})
