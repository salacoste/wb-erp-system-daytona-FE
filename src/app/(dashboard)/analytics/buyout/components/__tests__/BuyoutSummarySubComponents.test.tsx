/**
 * Unit tests for BuyoutSummarySubComponents — Epic 169.4 status-triplet pins
 *
 * Return-reason segments must keep THREE distinct status tokens (information / warning /
 * error) matching table headers and ReasonCell — guards against tier-collapse regressions.
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ReturnBreakdownBar } from '../BuyoutSummarySubComponents'
import type { ReturnBreakdown } from '@/types/fulfillment'

const breakdown: ReturnBreakdown = {
  cancelBeforeShipment: 40,
  refusalAtPvz: 30,
  returnAfterReceipt: 20,
  total: 90,
  classificationCoverage: 100,
}

describe('ReturnBreakdownBar (Epic 169.4 status-triplet pins)', () => {
  it('renders all three reason segments with distinct status bg tokens', () => {
    const { container } = render(<ReturnBreakdownBar breakdown={breakdown} />)
    const track = container.querySelector('.bg-muted') as HTMLElement
    const segments = Array.from(track.children) as HTMLElement[]
    expect(segments).toHaveLength(3)
    expect(segments[0].classList.contains('bg-status-information')).toBe(true)
    expect(segments[1].classList.contains('bg-status-warning')).toBe(true)
    expect(segments[2].classList.contains('bg-status-error')).toBe(true)
  })

  it('legend labels use matching text-status tokens', () => {
    render(<ReturnBreakdownBar breakdown={breakdown} />)
    const cancel = screen.getByText(/До отправки: 40/)
    const pvz = screen.getByText(/Отказ на ПВЗ: 30/)
    const receipt = screen.getByText(/После получения: 20/)
    expect(cancel.classList.contains('text-status-information')).toBe(true)
    expect(pvz.classList.contains('text-status-warning')).toBe(true)
    expect(receipt.classList.contains('text-status-error')).toBe(true)
  })

  it('track uses muted token (not gray literal)', () => {
    const { container } = render(<ReturnBreakdownBar breakdown={breakdown} />)
    const track = container.querySelector('.bg-muted') as HTMLElement
    expect(track.classList.contains('bg-muted')).toBe(true)
    expect(track.classList.contains('bg-gray-100')).toBe(false)
  })
})
