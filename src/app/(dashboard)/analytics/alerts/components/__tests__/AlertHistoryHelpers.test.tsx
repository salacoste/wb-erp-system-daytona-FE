/**
 * AlertHistoryHelpers unit tests
 *
 * Story 168.2: pins StatusBadge semantic tone tokens (sent/pending/failed +
 * unknown fallback) and guards against legacy palette classes.
 */

import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { StatusBadge, parseMessage } from '../AlertHistoryHelpers'

describe('StatusBadge — semantic tone tokens (168.2)', () => {
  const LEGACY_PALETTE_RE =
    /((bg|text|border|ring|divide|fill|stroke|outline)-(red|yellow|blue|green|gray|rose|amber|emerald|sky|orange|slate|zinc|neutral|stone|lime|teal|cyan|indigo|violet|purple|fuchsia|pink)(-\d+)?)/

  it.each([
    ['sent', 'text-status-success', 'Отправлено'],
    ['pending', 'text-status-warning', 'В очереди'],
    ['failed', 'text-status-error', 'Ошибка'],
  ] as const)('renders %s badge with semantic class %s', (status, token, label) => {
    const { container, getByText } = render(<StatusBadge status={status} />)
    // Exact full-class-token match (classList.contains) — no substring false-pass
    const badge = Array.from(container.querySelectorAll<HTMLElement>('*')).find(el =>
      el.classList.contains(token)
    )
    expect(badge).toBeDefined()
    expect(getByText(label)).toBeInTheDocument()
  })

  it('falls back to muted tokens for unknown status strings', () => {
    const { container, getByText } = render(<StatusBadge status="weird-legacy-status" />)
    // Exact full-class-token match (classList.contains) — no substring false-pass
    const badge = Array.from(container.querySelectorAll<HTMLElement>('*')).find(el =>
      el.classList.contains('bg-muted')
    )
    expect(badge).toBeDefined()
    expect(getByText('weird-legacy-status')).toBeInTheDocument()
  })

  it('renders no legacy palette classes in the DOM', () => {
    const { container } = render(
      <div>
        <StatusBadge status="sent" />
        <StatusBadge status="pending" />
        <StatusBadge status="failed" />
        <StatusBadge status="unknown" />
      </div>
    )
    expect(container.innerHTML).not.toMatch(LEGACY_PALETTE_RE)
  })
})

describe('parseMessage', () => {
  it('parses valid JSON message text', () => {
    expect(parseMessage('{"title":"Т","message":"М"}')).toEqual({ title: 'Т', message: 'М' })
  })

  it('falls back to raw string for invalid JSON', () => {
    expect(parseMessage('plain text')).toEqual({ title: 'plain text', message: '' })
  })
})
