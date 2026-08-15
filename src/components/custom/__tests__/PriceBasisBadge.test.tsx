/**
 * Tests for PriceBasisBadge (SPP-1.7-FE)
 * Variant resolution + Russian labels + a11y attributes.
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PriceBasisBadge, resolveBasisBadgeVariant } from '@/components/custom/PriceBasisBadge'

describe('resolveBasisBadgeVariant (pure)', () => {
  it('SELLER → seller', () => {
    expect(resolveBasisBadgeVariant('SELLER')).toBe('seller')
  })

  it('STOREFRONT_ANON without flags → storefront', () => {
    expect(resolveBasisBadgeVariant('STOREFRONT_ANON')).toBe('storefront')
  })

  it('STOREFRONT_ANON + STOREFRONT_STALE flag → stale', () => {
    expect(resolveBasisBadgeVariant('STOREFRONT_ANON', ['STOREFRONT_STALE'])).toBe('stale')
  })

  it('SELLER ignores stale flag (stale is a storefront-basis concern)', () => {
    expect(resolveBasisBadgeVariant('SELLER', ['STOREFRONT_STALE'])).toBe('seller')
  })

  it('other flags do not trigger the stale variant', () => {
    expect(resolveBasisBadgeVariant('STOREFRONT_ANON', ['SOMETHING_ELSE'])).toBe('storefront')
  })
})

describe('PriceBasisBadge', () => {
  it('renders neutral «Продавец» chip for SELLER', () => {
    render(<PriceBasisBadge basis="SELLER" />)
    expect(screen.getByText('Продавец')).toBeInTheDocument()
  })

  it('renders blue «Витрина» chip for STOREFRONT_ANON', () => {
    render(<PriceBasisBadge basis="STOREFRONT_ANON" />)
    expect(screen.getByText('Витрина')).toBeInTheDocument()
  })

  it('renders amber «Витрина · устарела» chip when STOREFRONT_STALE flag present', () => {
    render(<PriceBasisBadge basis="STOREFRONT_ANON" flags={['STOREFRONT_STALE']} />)
    expect(screen.getByText('Витрина · устарела')).toBeInTheDocument()
  })

  it('carries an aria-label matching the visible label (a11y)', () => {
    render(<PriceBasisBadge basis="STOREFRONT_ANON" />)
    expect(screen.getByLabelText('Витрина')).toBeInTheDocument()
  })

  it('renders neutral «Неизвестный базис» chip for UNKNOWN (never silently SELLER)', () => {
    render(<PriceBasisBadge basis="UNKNOWN" />)
    expect(screen.getByText('Неизвестный базис')).toBeInTheDocument()
  })

  it('exposes seller tooltip via title attribute', () => {
    render(<PriceBasisBadge basis="SELLER" />)
    expect(screen.getByText('Продавец')).toHaveAttribute('title', 'Цена продавца (seller API)')
  })

  it('exposes stale tooltip via title attribute', () => {
    render(<PriceBasisBadge basis="STOREFRONT_ANON" flags={['STOREFRONT_STALE']} />)
    expect(screen.getByText('Витрина · устарела')).toHaveAttribute(
      'title',
      'Нет свежего наблюдения ≤24ч — использована цена продавца'
    )
  })
})
