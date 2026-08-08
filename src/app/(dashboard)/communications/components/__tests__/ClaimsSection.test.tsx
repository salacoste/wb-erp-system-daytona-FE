/**
 * ClaimsSection tests — NEW-2 (independent states, AC4).
 *
 * Mocks useClaims and verifies: loading skeleton, populated (nmId as String,
 * AP#10; orderId/status nullable AP#8 → '—'), empty, and error + retry.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { ClaimsSection } from '../ClaimsSection'
import { useClaims } from '@/hooks/useCommunications'
import type { ClaimsResult } from '@/types/communications'

vi.mock('@/hooks/useCommunications', () => ({
  useClaims: vi.fn(),
}))

const useClaimsMock = useClaims as unknown as ReturnType<typeof vi.fn>

function mockResult(
  result: Partial<{
    data: ClaimsResult | undefined
    isLoading: boolean
    isError: boolean
    refetch: ReturnType<typeof vi.fn>
  }>
) {
  useClaimsMock.mockReturnValue({
    data: undefined,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
    ...result,
  })
}

describe('ClaimsSection — independent states (AC4)', () => {
  beforeEach(() => {
    useClaimsMock.mockReset()
  })
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('renders a scoped skeleton while loading', () => {
    mockResult({ isLoading: true })
    const { container } = render(<ClaimsSection />)
    expect(container.querySelector('.animate-pulse')).toBeTruthy()
  })

  it('renders populated claims with nmId as String + orderId + status', () => {
    mockResult({
      data: {
        rows: [
          {
            id: 'cl-1',
            cabinetId: 'c',
            claimId: '3001',
            nmId: 12345678,
            orderId: 'order-1',
            status: 'open',
            createdAt: '2026-08-01T09:00:00Z',
            updatedAt: '2026-08-01T09:00:00Z',
          },
        ],
        total: 1,
      },
    })
    render(<ClaimsSection />)
    expect(screen.getByText('12345678')).toBeInTheDocument()
    expect(screen.getByText('order-1')).toBeInTheDocument()
    expect(screen.getByText('open')).toBeInTheDocument()
  })

  it('renders "—" for nullable claim fields (AP#8)', () => {
    mockResult({
      data: {
        rows: [
          {
            id: 'cl-2',
            cabinetId: 'c',
            claimId: '3002',
            nmId: null,
            orderId: null,
            status: null,
            createdAt: null,
            updatedAt: '2026-08-02T09:00:00Z',
          },
        ],
        total: 1,
      },
    })
    render(<ClaimsSection />)
    expect(screen.getAllByText('—').length).toBeGreaterThan(0)
    expect(screen.queryByText('NaN')).not.toBeInTheDocument()
  })

  it('renders the empty state when there are no rows', () => {
    mockResult({ data: { rows: [], total: 0 } })
    render(<ClaimsSection />)
    expect(screen.getByText('Нет претензий')).toBeInTheDocument()
  })

  it('renders error + retry control when isError (RU canonical string)', () => {
    mockResult({ isError: true })
    render(<ClaimsSection />)
    expect(
      screen.getByText('Не удалось загрузить претензии. Попробуйте ещё раз.')
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Повторить/ })).toBeInTheDocument()
  })

  it('retry button invokes refetch', () => {
    const refetch = vi.fn()
    mockResult({ isError: true, refetch })
    render(<ClaimsSection />)
    fireEvent.click(screen.getByRole('button', { name: /Повторить/ }))
    expect(refetch).toHaveBeenCalledTimes(1)
  })
})
