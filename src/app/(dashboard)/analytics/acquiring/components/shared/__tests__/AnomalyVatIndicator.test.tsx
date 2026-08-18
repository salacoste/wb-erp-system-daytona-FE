/**
 * AnomalyVatIndicator tests — Defensive Frontend Principle indicator (Story 89.4-FE).
 *
 * Smoke: renders AlertTriangle tooltip when VAT > fee, null when not anomalous.
 */

import { describe, it, expect } from 'vitest'
import { renderWithProviders } from '@/test/utils/test-utils'
import { AnomalyVatIndicator } from '../AnomalyVatIndicator'

describe('AnomalyVatIndicator', () => {
  it('renders nothing when fee is null', () => {
    const { container } = renderWithProviders(<AnomalyVatIndicator fee={null} vat={100} />)
    expect(container.innerHTML).toBe('')
  })

  it('renders nothing when vat is null', () => {
    const { container } = renderWithProviders(<AnomalyVatIndicator fee={100} vat={null} />)
    expect(container.innerHTML).toBe('')
  })

  it('renders nothing when vat <= fee', () => {
    const { container } = renderWithProviders(<AnomalyVatIndicator fee={100} vat={50} />)
    expect(container.innerHTML).toBe('')
  })

  it('renders nothing when vat equals fee exactly', () => {
    const { container } = renderWithProviders(<AnomalyVatIndicator fee={100} vat={100} />)
    expect(container.innerHTML).toBe('')
  })

  it('renders AlertTriangle when vat > fee (anomaly detected)', () => {
    const { container } = renderWithProviders(<AnomalyVatIndicator fee={50} vat={100} />)
    // The component renders an svg via lucide-react AlertTriangle
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })

  it('AlertTriangle has correct aria-label', () => {
    const { container } = renderWithProviders(<AnomalyVatIndicator fee={10} vat={200} />)
    const labeledEl = container.querySelector('[aria-label]')
    expect(labeledEl?.getAttribute('aria-label')).toBe('Аномалия: НДС выше суммы комиссии')
  })

  it('anomaly icon uses the status-warning semantic token (SVG class via attribute)', () => {
    const { container } = renderWithProviders(<AnomalyVatIndicator fee={50} vat={100} />)
    const svg = container.querySelector('svg')
    expect(svg).not.toBeNull()
    // SVG className is SVGAnimatedString in the DOM — assert via attribute (168.11 lesson)
    const cls = svg!.getAttribute('class') ?? ''
    expect(cls).toContain('text-status-warning')
    expect(cls).not.toContain('amber')
  })
})
