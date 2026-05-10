/**
 * OrdersTableRow — Price Anomaly Indicator Tests
 * Story 87.3-FE: Defensive warning icon when salePrice > price * 1.2
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Table, TableBody } from '@/components/ui/table'
import { OrdersTableRow } from '../OrdersTableRow'
import { mockOrderFbsItem } from '@/test/fixtures/orders'
import type { OrderFbsItem } from '@/types/orders'

function renderRow(order: OrderFbsItem) {
  return render(
    <Table>
      <TableBody>
        <OrdersTableRow order={order} onClick={vi.fn()} />
      </TableBody>
    </Table>
  )
}

describe('OrdersTableRow — price anomaly indicator (Story 87.3-FE)', () => {
  it('does NOT render warning icon for normal order (price=1500, salePrice=1200)', () => {
    renderRow({ ...mockOrderFbsItem, price: 1500, salePrice: 1200 })
    // AlertTriangle has aria-label starting with "Аномалия"
    const icon = screen.queryByLabelText(/Аномалия/i)
    expect(icon).toBeNull()
  })

  it('does NOT render warning icon for equal prices (no discount)', () => {
    renderRow({ ...mockOrderFbsItem, price: 1000, salePrice: 1000 })
    expect(screen.queryByLabelText(/Аномалия/i)).toBeNull()
  })

  it('renders warning icon for anomalous order (price=56, salePrice=1510 — 27x inversion)', () => {
    renderRow({ ...mockOrderFbsItem, price: 56, salePrice: 1510 })
    const icon = screen.getByLabelText(/Аномалия/i)
    expect(icon).toBeTruthy()
    // aria-label should include the ratio
    expect(icon.getAttribute('aria-label')).toMatch(/в 27\.0 раз/)
  })

  it('does NOT render warning icon when price=0 (guards against div-by-zero)', () => {
    renderRow({ ...mockOrderFbsItem, price: 0, salePrice: 100 })
    expect(screen.queryByLabelText(/Аномалия/i)).toBeNull()
  })

  it('does NOT render warning icon when price is negative', () => {
    renderRow({ ...mockOrderFbsItem, price: -100, salePrice: 200 })
    expect(screen.queryByLabelText(/Аномалия/i)).toBeNull()
  })

  it('renders warning icon at exactly 1.3x threshold (well above 1.2x)', () => {
    renderRow({ ...mockOrderFbsItem, price: 100, salePrice: 130 })
    expect(screen.getByLabelText(/Аномалия/i)).toBeTruthy()
  })

  it('does NOT render warning icon at 1.1x (below 1.2x threshold)', () => {
    renderRow({ ...mockOrderFbsItem, price: 100, salePrice: 110 })
    expect(screen.queryByLabelText(/Аномалия/i)).toBeNull()
  })

  // Story 96.16-FE: regression guard after #165 closure-citation comment swap.
  // Confirms Number.isFinite guard still rejects NaN/Infinity inputs (defense-in-depth retained).
  it('does NOT render warning icon when price is NaN (Number.isFinite guard)', () => {
    renderRow({ ...mockOrderFbsItem, price: Number.NaN, salePrice: 100 })
    expect(screen.queryByLabelText(/Аномалия/i)).toBeNull()
  })

  // Story 96.16-FE 1st-pass review L-1: extend coverage to symmetric NaN guard (salePrice=NaN).
  it('does NOT render warning icon when salePrice is NaN (Number.isFinite guard, salePrice side)', () => {
    renderRow({ ...mockOrderFbsItem, price: 100, salePrice: Number.NaN })
    expect(screen.queryByLabelText(/Аномалия/i)).toBeNull()
  })

  // Story 96.16-FE 1st-pass review L-1: extend coverage to Number.POSITIVE_INFINITY (JSDoc claims this is guarded).
  it('does NOT render warning icon when salePrice is Infinity (Number.isFinite guard)', () => {
    renderRow({ ...mockOrderFbsItem, price: 100, salePrice: Number.POSITIVE_INFINITY })
    expect(screen.queryByLabelText(/Аномалия/i)).toBeNull()
  })

  // Story 96.16-FE 1st-pass review L-1: exact-boundary test confirms predicate is `>` not `>=` at 1.2× threshold.
  it('does NOT render warning icon at EXACTLY 1.2x threshold (predicate is `>`, not `>=`)', () => {
    renderRow({ ...mockOrderFbsItem, price: 100, salePrice: 120 })
    expect(screen.queryByLabelText(/Аномалия/i)).toBeNull()
  })

  // Story 96.16-FE 2nd-pass review H2-2: positive-side boundary companion to the 1.2× exact test.
  // Pins BOTH sides of the strict inequality (`>` not `>=`): exactly-1.2× is false, just-above-1.2× is true.
  // Without this test, the predicate could be silently broken to `false` always and the negative-side test would still pass.
  it('renders warning icon JUST ABOVE 1.2x threshold (price=100, salePrice=120.01) — strict inequality positive side', () => {
    renderRow({ ...mockOrderFbsItem, price: 100, salePrice: 120.01 })
    expect(screen.getByLabelText(/Аномалия/i)).toBeTruthy()
  })
})
