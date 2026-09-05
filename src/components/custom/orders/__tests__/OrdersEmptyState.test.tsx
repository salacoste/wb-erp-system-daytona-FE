/**
 * Style pins for OrdersEmptyState — p2-80-sweep (WCAG AA).
 *
 * The "Сбросить фильтры" link button renders from OrdersTable's early return
 * OUTSIDE any Card (orders page wraps only OrdersFilters in a Card) — the actual
 * surface is the page background. Measured hover (before): primary/80 on bg =
 * 4.13:1 light (FAIL 4.5 text); base primary = 5.62:1 / 8.67:1 (PASS; the
 * card-variant 8.27:1 was the conservative pre-fix attestation).
 * Remediation: drop hover:text-primary/80
 * AND hover:no-underline → variant=link default hover:underline returns as the
 * hover affordance (contrast unchanged on hover).
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { OrdersEmptyState } from '../OrdersEmptyState'

describe('OrdersEmptyState — /80-sweep contrast pins', () => {
  it('clear-filters button: link-variant underline affordance, no /80 darkening', () => {
    render(<OrdersEmptyState hasFilters onClearFilters={vi.fn()} />)
    const btn = screen.getByRole('button', { name: /Сбросить фильтры/ })
    expect(btn).toHaveClass('text-primary')
    expect(btn.className).not.toContain('/80')
    expect(btn.className).not.toContain('hover:no-underline')
    expect(btn).toHaveClass('hover:underline')
  })
})
