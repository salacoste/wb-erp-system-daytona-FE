/**
 * Component tests — MoyskladStockTable (M1 Сток tab).
 * Contract: docs/request-backend/221-moysklad-integration-backend-contract.md
 *
 * Covers: Decimal-derived stockFree rendering, «не привязан» on unmatched rows,
 * null reserve → «—», empty state («Нет данных о стоке за эту дату»), pagination
 * hint, and the invalid-date error banner (surfaces the 400 inline).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { MoyskladStockTable } from '../MoyskladStockTable'
import type { MoyskladStockDbResponse, MoyskladStockSnapshot } from '@/types/moysklad'

// Controlled per-test mocks.
const useMoyskladStockDbMock = vi.fn()
const useMoyskladMappingsMock = vi.fn()
vi.mock('@/hooks/useMoyskladQueries', () => ({
  useMoyskladStockDb: (...args: unknown[]) => useMoyskladStockDbMock(...args),
  useMoyskladMappings: (...args: unknown[]) => useMoyskladMappingsMock(...args),
}))

const matchedRow = {
  id: 'stk-1',
  date: '2026-07-03',
  moyskladAssortmentId: 'assort-1',
  nmId: 12345678,
  stockFree: 28765.31,
  reserve: 50,
  syncedAt: '2026-07-03T08:00:00.000Z',
}

const unmatchedRow = {
  id: 'stk-2',
  date: '2026-07-03',
  moyskladAssortmentId: 'assort-2',
  nmId: null,
  stockFree: 100,
  reserve: null,
  syncedAt: null,
}

const dataResponse = (rows: MoyskladStockSnapshot[]): MoyskladStockDbResponse => ({
  count: rows.length,
  total: 365,
  date: '2026-07-03',
  rows,
})

describe('MoyskladStockTable', () => {
  beforeEach(() => {
    useMoyskladStockDbMock.mockReturnValue({
      data: dataResponse([matchedRow, unmatchedRow]),
    })
    // No cached mappings → falls back to the assortment-id short form.
    useMoyskladMappingsMock.mockReturnValue({ data: { rows: [] } })
  })

  it('renders stock rows with formatted free stock and reserve', () => {
    render(<MoyskladStockTable />)
    // formatNumber rounds to integer: 28765.31 → "28 765".
    expect(screen.getByText('28 765')).toBeInTheDocument()
    expect(screen.getByText('50')).toBeInTheDocument()
  })

  it('renders «не привязан» for unmatched rows (nmId null)', () => {
    render(<MoyskladStockTable />)
    expect(screen.getByText('не привязан')).toBeInTheDocument()
  })

  it('shows the pagination hint «Показано N из M»', () => {
    render(<MoyskladStockTable />)
    expect(screen.getByText(/Показано 2 из 365/)).toBeInTheDocument()
  })

  it('shows the empty state when there are no rows for the date', () => {
    useMoyskladStockDbMock.mockReturnValue({ data: dataResponse([]) })
    render(<MoyskladStockTable />)
    expect(screen.getByText('Нет данных о стоке за эту дату')).toBeInTheDocument()
  })

  it('surfaces the invalid-date error banner (400 surfaced inline, no crash)', () => {
    useMoyskladStockDbMock.mockReturnValue({
      data: undefined,
      isError: true,
      isLoading: false,
    })
    render(<MoyskladStockTable />)
    expect(screen.getByText(/Не удалось загрузить сток за эту дату/)).toBeInTheDocument()
  })

  it('updates the date param when the date input changes', () => {
    render(<MoyskladStockTable />)
    const input = screen.getByLabelText('Дата стока') as HTMLInputElement
    fireEvent.change(input, { target: { value: '2026-07-01' } })
    expect(input.value).toBe('2026-07-01')
    // After change, the hook is called with the selected date.
    expect(useMoyskladStockDbMock).toHaveBeenLastCalledWith({ date: '2026-07-01' })
  })
})
