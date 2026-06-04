/**
 * Tests for ProductTabPlaceholder — backend-pending "coming soon" card (Story 120.5-FE).
 * Locks in the construction-state UX (Story 112.3-FE pattern): both copy lines render,
 * the decorative icon is aria-hidden, and the copy does NOT leak an internal ticket
 * number or blame the backend (Request #177 is RESOLVED).
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProductTabPlaceholder } from '../ProductTabPlaceholder'

describe('ProductTabPlaceholder', () => {
  it('renders the "in development" heading with the tab label', () => {
    render(<ProductTabPlaceholder label="Воронка" />)
    expect(screen.getByText('Раздел «Воронка» в разработке')).toBeInTheDocument()
  })

  it('renders the neutral coming-soon sub-line', () => {
    render(<ProductTabPlaceholder label="Реклама" />)
    expect(screen.getByText('Скоро здесь появятся данные по товару')).toBeInTheDocument()
  })

  it('does not leak an internal ticket number or blame the backend', () => {
    const { container } = render(<ProductTabPlaceholder label="Обзор" />)
    expect(container.textContent).not.toMatch(/#177|бэкенд|запрос/i)
  })

  it('marks the decorative icon aria-hidden', () => {
    const { container } = render(<ProductTabPlaceholder label="Органика" />)
    expect(container.querySelector('svg[aria-hidden="true"]')).not.toBeNull()
  })
})
