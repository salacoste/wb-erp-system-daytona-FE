/**
 * FunnelSummaryCards — conversion anomaly indicator (Defensive Frontend Principle, #191).
 *
 * The totalConversion card must flag an impossible >100% value with an
 * AlertTriangle warning while still rendering the raw value (never clamped).
 * A normal summary must NOT show the warning.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils/test-utils'
import { FunnelSummaryCards } from '../FunnelSummaryCards'
import { emptyFunnelResponse } from '@/test/fixtures/funnel-empty'
import type { FunnelSummary } from '@/types/analytics-funnel'

const useFunnelDataMock = vi.fn()
vi.mock('@/hooks/use-funnel-analytics', () => ({
  useFunnelData: (...args: unknown[]) => useFunnelDataMock(...args),
}))

const ANOMALY_LABEL = /Невозможное значение конверсии/

function mockSummary(overrides: Partial<Record<keyof FunnelSummary, number | undefined>>) {
  const base = emptyFunnelResponse().summary
  useFunnelDataMock.mockReturnValue({
    data: { ...emptyFunnelResponse(), summary: { ...base, ...overrides } as FunnelSummary },
    isLoading: false,
  })
}

function metricCard(label: string) {
  const card = screen.getByText(label).parentElement
  expect(card).toBeInTheDocument()
  return within(card as HTMLElement)
}

describe('FunnelSummaryCards — conversion anomaly indicator (#191)', () => {
  beforeEach(() => {
    useFunnelDataMock.mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('flags the totalConversion card with a warning AND preserves the raw value', () => {
    mockSummary({ ordersCount: 140, buyoutCount: 3141, totalConversion: 136.15 })
    renderWithProviders(<FunnelSummaryCards from="2025-01-01" to="2025-01-07" />)

    expect(screen.getByLabelText(ANOMALY_LABEL)).toBeInTheDocument()
    expect(screen.getByText('136,2%')).toBeInTheDocument()
  })

  it('does NOT flag a normal summary', () => {
    mockSummary({ ordersCount: 140, buyoutCount: 90, totalConversion: 42 })
    renderWithProviders(<FunnelSummaryCards from="2025-01-01" to="2025-01-07" />)

    expect(screen.queryByLabelText(ANOMALY_LABEL)).not.toBeInTheDocument()
    expect(screen.getByText('42,0%')).toBeInTheDocument()
  })

  it('does not flag exactly 100 percent or a zero-order buyout mismatch', () => {
    mockSummary({ ordersCount: 0, buyoutCount: 1, totalConversion: 100 })
    renderWithProviders(<FunnelSummaryCards from="2025-01-01" to="2025-01-07" />)

    expect(screen.queryByLabelText(ANOMALY_LABEL)).not.toBeInTheDocument()
    expect(screen.getByText('100,0%')).toBeVisible()
  })

  it('flags buyouts greater than orders below 100% and preserves the raw value', () => {
    mockSummary({ ordersCount: 140, buyoutCount: 150, totalConversion: 80 })
    renderWithProviders(<FunnelSummaryCards from="2025-01-01" to="2025-01-07" />)

    expect(screen.getByLabelText(ANOMALY_LABEL)).toBeInTheDocument()
    expect(screen.getByText('80,0%')).toBeInTheDocument()
  })

  it('renders explicit zeroes when a valid summary reports zero values', () => {
    mockSummary({})
    renderWithProviders(<FunnelSummaryCards from="2025-01-01" to="2025-01-07" />)

    expect(screen.getAllByText('0')).toHaveLength(5)
    expect(screen.getAllByText('0,0%')).toHaveLength(2)
    expect(screen.getByText(/0.*₽/)).toBeInTheDocument()
  })

  it('renders Недоступно when one metric is missing from a present summary', () => {
    mockSummary({ ordersCount: undefined })

    renderWithProviders(<FunnelSummaryCards from="2025-01-01" to="2025-01-07" />)

    const orders = metricCard('Заказы')
    expect(orders.getByText('Недоступно')).toBeInTheDocument()
    expect(orders.queryByText('0')).not.toBeInTheDocument()
    expect(screen.getByText(/Часть метрик недоступна: Заказы/)).toBeVisible()
  })

  it('renders Недоступно for every missing metric in a present partial summary', () => {
    mockSummary({
      openCardCount: undefined,
      buyoutSumRub: undefined,
      totalConversion: undefined,
    })

    renderWithProviders(<FunnelSummaryCards from="2025-01-01" to="2025-01-07" />)

    const views = metricCard('Просмотры')
    const buyoutSum = metricCard('Сумма выкупов')
    const totalConversion = metricCard('Сквозная конверсия')
    expect(views.getByText('Недоступно')).toBeInTheDocument()
    expect(views.queryByText('0')).not.toBeInTheDocument()
    expect(buyoutSum.getByText('Недоступно')).toBeInTheDocument()
    expect(buyoutSum.queryByText(/0.*₽/)).not.toBeInTheDocument()
    expect(totalConversion.getByText('Недоступно')).toBeInTheDocument()
    expect(totalConversion.queryByText('0,0%')).not.toBeInTheDocument()
  })

  it('keeps a valid explicit zero when another metric is missing', () => {
    mockSummary({ ordersCount: 0, buyoutCount: undefined })

    renderWithProviders(<FunnelSummaryCards from="2025-01-01" to="2025-01-07" />)

    expect(metricCard('Заказы').getByText('0')).toBeInTheDocument()
  })

  it('does not calculate a delta when the previous comparison metric is missing', () => {
    const current = emptyFunnelResponse()
    const previous = emptyFunnelResponse()
    current.summary.ordersCount = 12
    ;(previous.summary as Partial<FunnelSummary>).ordersCount = undefined
    useFunnelDataMock
      .mockReturnValueOnce({ data: current, isLoading: false })
      .mockReturnValueOnce({ data: previous, isLoading: false })

    renderWithProviders(
      <FunnelSummaryCards
        from="2025-01-01"
        to="2025-01-07"
        compareEnabled
        compareFrom="2024-12-25"
        compareTo="2024-12-31"
      />
    )

    expect(metricCard('Заказы').getByText('Нет данных')).toBeVisible()
  })

  it('does not present unavailable summary data as eight trustworthy zeroes', () => {
    useFunnelDataMock.mockReturnValue({ data: undefined, isLoading: false, isError: false })
    renderWithProviders(<FunnelSummaryCards from="2025-01-01" to="2025-01-07" />)

    expect(screen.getByText(/Метрики воронки недоступны/)).toBeInTheDocument()
    expect(screen.queryByText('0,0%')).not.toBeInTheDocument()
  })

  it('renders a failed summary query as a destructive alert', () => {
    useFunnelDataMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: vi.fn(),
    })

    renderWithProviders(<FunnelSummaryCards from="2025-01-01" to="2025-01-07" />)

    expect(screen.getByRole('alert')).toHaveClass('text-destructive')
    expect(screen.getByText('Не удалось загрузить метрики воронки')).toBeInTheDocument()
  })

  it('retries the failed summary query from its error action', async () => {
    const user = userEvent.setup()
    const refetch = vi.fn()
    useFunnelDataMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch,
    })

    renderWithProviders(<FunnelSummaryCards from="2025-01-01" to="2025-01-07" />)

    await user.click(screen.getByRole('button', { name: /Повторить/ }))

    expect(refetch).toHaveBeenCalledTimes(1)
  })

  it('retains prior summary evidence and retries after a background refresh failure', async () => {
    const user = userEvent.setup()
    const refetch = vi.fn()
    useFunnelDataMock.mockReturnValue({
      data: emptyFunnelResponse(),
      isLoading: false,
      isError: true,
      refetch,
    })

    renderWithProviders(<FunnelSummaryCards from="2025-01-01" to="2025-01-07" />)

    expect(screen.getByText(/Показаны ранее загруженные метрики/)).toBeVisible()
    expect(metricCard('Заказы').getByText('0')).toBeVisible()
    const retry = screen.getByRole('button', { name: 'Повторить метрики' })
    expect(retry).toHaveClass('min-h-11')
    await user.click(retry)
    expect(refetch).toHaveBeenCalledOnce()
  })

  it('distinguishes comparison failure and retries it without hiding current metrics', async () => {
    const user = userEvent.setup()
    const refetchPrevious = vi.fn()
    useFunnelDataMock
      .mockReturnValueOnce({ data: emptyFunnelResponse(), isLoading: false, isError: false })
      .mockReturnValueOnce({
        data: undefined,
        isLoading: false,
        isError: true,
        refetch: refetchPrevious,
      })

    renderWithProviders(
      <FunnelSummaryCards
        from="2025-01-01"
        to="2025-01-07"
        compareEnabled
        compareFrom="2024-12-25"
        compareTo="2024-12-31"
      />
    )

    expect(screen.getByText(/Не удалось загрузить сравнение/)).toBeVisible()
    expect(metricCard('Заказы').getByText('0')).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Повторить сравнение' }))
    expect(refetchPrevious).toHaveBeenCalledOnce()
  })

  it('does not present retained comparison deltas as current after refresh failure', () => {
    const current = emptyFunnelResponse()
    const previous = emptyFunnelResponse()
    current.summary.ordersCount = 12
    previous.summary.ordersCount = 10
    useFunnelDataMock
      .mockReturnValueOnce({ data: current, isLoading: false, isError: false })
      .mockReturnValueOnce({ data: previous, isLoading: false, isError: true, refetch: vi.fn() })

    renderWithProviders(
      <FunnelSummaryCards
        from="2025-01-01"
        to="2025-01-07"
        compareEnabled
        compareFrom="2024-12-25"
        compareTo="2024-12-31"
      />
    )

    expect(metricCard('Заказы').getByText('Сравнение недоступно')).toBeVisible()
    expect(metricCard('Заказы').queryByText('+20,0%')).not.toBeInTheDocument()
  })

  it('replaces long-loading skeletons with an explicit retry state', () => {
    vi.useFakeTimers()
    useFunnelDataMock.mockReturnValue({
      data: undefined,
      isLoading: true,
      refetch: vi.fn(),
    })

    renderWithProviders(<FunnelSummaryCards from="2025-01-01" to="2025-01-07" />)

    act(() => {
      vi.advanceTimersByTime(5_000)
    })

    expect(screen.getByText(/Метрики воронки загружаются дольше обычного/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Повторить/ })).toHaveClass('min-h-11')
  })

  it('uses a single-column base grid and keeps full large values visible', () => {
    mockSummary({ openCardCount: 123456789 })
    renderWithProviders(<FunnelSummaryCards from="2025-01-01" to="2025-01-07" />)

    const grid = screen.getByText('Просмотры').closest('[class*="grid"]')
    expect(grid).toHaveClass('grid-cols-1', 'sm:grid-cols-2')
    expect(metricCard('Просмотры').getByText('123 456 789')).not.toHaveClass('truncate')
  })
})
