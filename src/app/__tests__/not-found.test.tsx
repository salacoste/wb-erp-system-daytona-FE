import { render, screen } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { describe, expect, it } from 'vitest'

import NotFound from '../not-found'

expect.extend(toHaveNoViolations)

describe('global not-found boundary', () => {
  it('explains the missing page in Russian and provides semantic recovery', () => {
    render(<NotFound />)

    expect(
      screen.getByRole('heading', { level: 1, name: 'Страница не найдена' })
    ).toBeInTheDocument()
    expect(screen.getAllByText(/адрес мог измениться/i)).toHaveLength(2)
    expect(screen.getByRole('link', { name: 'Вернуться на главную' })).toHaveAttribute('href', '/')
  })

  it('does not expose a requested path or technical stack details', () => {
    const { container } = render(<NotFound />)
    expect(container).not.toHaveTextContent('/analytics/acquiring/reports/secret')
    expect(container).not.toHaveTextContent('NEXT_NOT_FOUND')
    expect(container).not.toHaveTextContent('404.tsx')
  })

  it('has no automated accessibility violations', async () => {
    const { container } = render(<NotFound />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
