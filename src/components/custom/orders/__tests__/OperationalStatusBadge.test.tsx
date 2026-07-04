/**
 * Story O1: OperationalStatusBadge component tests.
 * Verifies label rendering + color classes per status.
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { OperationalStatusBadge } from '../OperationalStatusBadge'

describe('OperationalStatusBadge (Story O1)', () => {
  it('renders the Russian label for each status', () => {
    const cases = [
      ['NEW', 'Новый'],
      ['ASSEMBLED', 'Собран'],
      ['PACKED', 'Упакован'],
      ['SHIPPED', 'Отгружен'],
      ['DELIVERED', 'Доставлен'],
      ['CANCELLED', 'Отменён'],
      ['RETURNED', 'Возврат'],
    ] as const

    for (const [status, label] of cases) {
      const { unmount } = render(<OperationalStatusBadge status={status} />)
      expect(screen.getByText(label)).toBeInTheDocument()
      unmount()
    }
  })

  it('applies the spec color per status', () => {
    const { container: newEl } = render(<OperationalStatusBadge status="NEW" />)
    expect(newEl.querySelector('[data-operational-status="NEW"]')).toHaveClass('text-blue-700')

    const { container: deliveredEl } = render(<OperationalStatusBadge status="DELIVERED" />)
    expect(deliveredEl.querySelector('[data-operational-status="DELIVERED"]')).toHaveClass(
      'text-green-700'
    )

    const { container: cancelledEl } = render(<OperationalStatusBadge status="CANCELLED" />)
    expect(cancelledEl.querySelector('[data-operational-status="CANCELLED"]')).toHaveClass(
      'text-red-700'
    )
  })

  it('surfaces an out-of-union status as the raw code (Defensive Frontend)', () => {
    const { container } = render(<OperationalStatusBadge status={'UNKNOWN' as never} />)
    expect(screen.getByText('UNKNOWN')).toBeInTheDocument()
    expect(container.querySelector('[data-operational-status="UNKNOWN"]')).toHaveClass(
      'text-foreground'
    )
  })
})
