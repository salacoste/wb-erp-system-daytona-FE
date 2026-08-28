import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import FinancesError from '../error'

describe('FinancesError', () => {
  it('renders an accessible Russian recovery state and invokes reset', () => {
    const reset = vi.fn()
    render(<FinancesError error={new Error('boom')} reset={reset} />)

    expect(screen.getByRole('alert')).toHaveAccessibleName('Не удалось открыть финансы')
    fireEvent.click(screen.getByRole('button', { name: 'Повторить' }))
    expect(reset).toHaveBeenCalledTimes(1)
  })
})
