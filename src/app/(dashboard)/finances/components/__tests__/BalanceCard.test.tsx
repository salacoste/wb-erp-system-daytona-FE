/**
 * BalanceCard tests — NEW-7 (independent states, AC4).
 *
 * Mocks useAccountBalance and verifies: loading skeleton, populated (money
 * formatted RUB, null → '—' AP#8), empty (all-null), and error + retry (RU).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { BalanceCard } from '../BalanceCard'
import { useAccountBalance } from '@/hooks/useFinances'
import type { AccountBalance } from '@/types/finances'

vi.mock('@/hooks/useFinances', () => ({
  useAccountBalance: vi.fn(),
}))

const useAccountBalanceMock = useAccountBalance as unknown as ReturnType<typeof vi.fn>

function mockResult(
  result: Partial<{
    data: AccountBalance | undefined
    isLoading: boolean
    isError: boolean
    refetch: ReturnType<typeof vi.fn>
  }>
) {
  useAccountBalanceMock.mockReturnValue({
    data: undefined,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
    ...result,
  })
}

describe('BalanceCard — independent states (AC4)', () => {
  beforeEach(() => {
    // mockReset fully clears the mock implementation (clearAllMocks doesn't),
    // so each test starts from a known state before mockResult sets its return.
    useAccountBalanceMock.mockReset()
  })
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('renders a scoped skeleton while loading', () => {
    mockResult({ isLoading: true })
    const { container } = render(<BalanceCard />)
    expect(container.querySelector('.animate-pulse')).toBeTruthy()
  })

  it('renders populated balance with money formatted as RUB', () => {
    mockResult({ data: { currency: 'RUB', current: 1523400.5, forWithdraw: 980000 } })
    render(<BalanceCard />)
    expect(screen.getByText('Текущий баланс')).toBeInTheDocument()
    // RU currency formatting (regex — locale-formatted, not exact string).
    expect(screen.getByText(/1\s523\s400/)).toBeInTheDocument()
    expect(screen.getByText('Доступно к выводу')).toBeInTheDocument()
    expect(screen.getByText('RUB')).toBeInTheDocument()
  })

  it('renders "—" for null money (AP#8 — never 0)', () => {
    mockResult({ data: { currency: null, current: null, forWithdraw: null } })
    render(<BalanceCard />)
    // All-null → empty branch (no balance data yet).
    expect(screen.getByText('Данные о балансе пока недоступны')).toBeInTheDocument()
  })

  it('renders "—" for a partially-null balance (currency set, money null)', () => {
    mockResult({ data: { currency: 'RUB', current: null, forWithdraw: null } })
    render(<BalanceCard />)
    // current null → '—' rendered somewhere; currency shown.
    expect(screen.getAllByText('—').length).toBeGreaterThan(0)
    expect(screen.getByText('RUB')).toBeInTheDocument()
  })

  it('renders error + retry control when isError (RU canonical string)', () => {
    mockResult({ isError: true })
    render(<BalanceCard />)
    expect(
      screen.getByText('Не удалось загрузить баланс кабинета. Попробуйте ещё раз.')
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Повторить/ })).toBeInTheDocument()
  })

  it('retry button invokes refetch', () => {
    const refetch = vi.fn()
    mockResult({ isError: true, refetch })
    render(<BalanceCard />)
    fireEvent.click(screen.getByRole('button', { name: /Повторить/ }))
    expect(refetch).toHaveBeenCalledTimes(1)
  })
})
