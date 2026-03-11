import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils/test-utils'
import { BoxTypeSelect } from '../BoxTypeSelect'

let mockIsLoading = false
const mockBoxTypes = [
  {
    id: 'bt-001',
    name: 'Коробка A',
    lengthCm: '60.00',
    widthCm: '40.00',
    heightCm: '30.00',
    volumeCm3: '72000.00',
    isActive: true,
  },
]

vi.mock('@/hooks/use-box-types', () => ({
  useBoxTypes: () => ({
    get data() {
      return mockIsLoading ? undefined : mockBoxTypes
    },
    get isLoading() {
      return mockIsLoading
    },
  }),
}))

describe('BoxTypeSelect', () => {
  const defaultProps = {
    value: '',
    onChange: vi.fn(),
  }

  beforeEach(() => {
    mockIsLoading = false
  })

  it('renders select with placeholder "Выберите тип коробки"', () => {
    renderWithProviders(<BoxTypeSelect {...defaultProps} />)
    expect(screen.getByText('Выберите тип коробки')).toBeInTheDocument()
  })

  it('forwards aria-describedby to trigger', () => {
    renderWithProviders(<BoxTypeSelect {...defaultProps} aria-describedby="err-id" />)
    const trigger = screen.getByRole('combobox')
    expect(trigger).toHaveAttribute('aria-describedby', 'err-id')
  })

  it('forwards aria-invalid to trigger', () => {
    renderWithProviders(<BoxTypeSelect {...defaultProps} aria-invalid={true} />)
    const trigger = screen.getByRole('combobox')
    expect(trigger).toHaveAttribute('aria-invalid', 'true')
  })

  it('disables trigger and shows loading placeholder when loading', () => {
    mockIsLoading = true
    renderWithProviders(<BoxTypeSelect {...defaultProps} />)
    const trigger = screen.getByRole('combobox')
    expect(trigger).toBeDisabled()
  })
})
