import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@/test/utils/test-utils'
import userEvent from '@testing-library/user-event'
import { ProductCombobox } from '../ProductCombobox'

vi.mock('@/hooks/useProducts', () => ({
  useProducts: () => ({ data: { products: [] }, isLoading: false }),
}))

describe('ProductCombobox', () => {
  it('opens and closes the product-search popover by keyboard with focus return', async () => {
    const user = userEvent.setup()
    render(<ProductCombobox value={undefined} onChange={vi.fn()} />)

    const trigger = screen.getByRole('combobox', { name: 'Поиск товара' })
    trigger.focus()
    await user.keyboard('{Enter}')
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByPlaceholderText('Поиск по названию, артикулу или nmId...')).toHaveFocus()
    expect(screen.getByText('Введите минимум 2 символа для поиска')).toBeInTheDocument()

    await user.keyboard('{Escape}')
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(trigger).toHaveFocus()
  })
})
