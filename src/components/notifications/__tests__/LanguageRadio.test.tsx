import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { LanguageRadio } from '../LanguageRadio'

describe('LanguageRadio', () => {
  it('shows a semantic focus ring when keyboard focus enters the radio', async () => {
    const user = userEvent.setup()
    render(<LanguageRadio value="ru" label="Русский" selected onSelect={vi.fn()} />)

    await user.tab()

    const radio = screen.getByRole('radio', { name: 'Русский' })
    expect(radio).toHaveFocus()
    expect(radio.closest('label')).toHaveClass(
      'focus-within:ring-2',
      'focus-within:ring-ring',
      'focus-within:ring-offset-2'
    )
  })
})
