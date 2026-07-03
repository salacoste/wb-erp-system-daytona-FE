/**
 * Component tests — MoyskladVariantsTable (M3 «МС модификации» tab).
 * Contract: docs/request-backend/221-moysklad-integration-backend-contract.md
 *
 * Covers: row rendering (name, code, barcodesCount, parentProductHref, updated),
 * «—» on null code/parentProductHref/updated (AP#8), NO «Артикул» column header
 * (variants lack article), pager (Назад/Вперёд + «Показано N–M из total», disabled
 * state, offset advance), empty state, and the live-call error banner.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { MoyskladVariantsTable } from '../MoyskladVariantsTable'
import type { MoyskladVariant, MoyskladVariantsResponse } from '@/types/moysklad'

// Controlled per-test mock.
const useMoyskladVariantsMock = vi.fn()
vi.mock('@/hooks/useMoyskladQueries', () => ({
  useMoyskladVariants: (...args: unknown[]) => useMoyskladVariantsMock(...args),
}))

const rowFull = {
  id: 'var-1',
  name: 'Футболка белая / M',
  code: '00001-M',
  parentProductHref: 'https://online.moysklad.ru/api/remap/1.2/entity/product/prod-1',
  barcodesCount: 3,
  updated: '2026-07-01T10:00:00.000Z',
} satisfies MoyskladVariant

const rowNulls = {
  id: 'var-2',
  name: 'Носки чёрные / 42',
  code: null,
  parentProductHref: null,
  barcodesCount: 0,
  updated: null,
} satisfies MoyskladVariant

const dataResponse = (rows: MoyskladVariant[], total = 41): MoyskladVariantsResponse => ({
  rows,
  total,
})

describe('MoyskladVariantsTable', () => {
  beforeEach(() => {
    useMoyskladVariantsMock.mockReturnValue({
      data: dataResponse([rowFull, rowNulls]),
    })
  })

  it('renders a variant row with name, code, barcodesCount, parent ref, and updated', () => {
    render(<MoyskladVariantsTable />)
    expect(screen.getByText('Футболка белая / M')).toBeInTheDocument()
    expect(screen.getByText('00001-M')).toBeInTheDocument()
    // barcodesCount rendered as the raw count.
    expect(screen.getByText('3')).toBeInTheDocument()
    // parentProductHref rendered verbatim (short form).
    expect(screen.getByText(/entity\/product\/prod-1/)).toBeInTheDocument()
  })

  it('does NOT render an «Артикул» column header (variants lack article)', () => {
    render(<MoyskladVariantsTable />)
    expect(screen.queryByText('Артикул')).not.toBeInTheDocument()
    // The variant-specific columns ARE present.
    expect(screen.getByText('Модификация')).toBeInTheDocument()
    expect(screen.getByText('Штрихкоды')).toBeInTheDocument()
    expect(screen.getByText('Родит. товар')).toBeInTheDocument()
  })

  it('renders «—» for null code/parentProductHref/updated (AP#8 — count stays 0, not «—»)', () => {
    render(<MoyskladVariantsTable />)
    expect(screen.getByText('Носки чёрные / 42')).toBeInTheDocument()
    // code, parentProductHref, updated → «—» (3 cells). Plus barcodesCount=0 (a count,
    // rendered as '0', NOT «—»). At least the 3 null cells show «—».
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(3)
    // barcodesCount=0 renders as '0' (count exception), distinct from the «—» glyph.
    expect(screen.getByText('0')).toBeInTheDocument()
  })

  it('shows the pager hint «Показано N–M из total»', () => {
    render(<MoyskladVariantsTable />)
    expect(screen.getByText(/Показано 1–2 из 41/)).toBeInTheDocument()
  })

  it('disables Назад on the first page and enables Вперёд when more rows exist', () => {
    render(<MoyskladVariantsTable />)
    expect(screen.getByRole('button', { name: /Назад/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: /Вперёд/ })).toBeEnabled()
  })

  it('advances offset when Вперёд is clicked (calls hook with new offset)', () => {
    render(<MoyskladVariantsTable />)
    fireEvent.click(screen.getByRole('button', { name: /Вперёд/ }))
    // PAGE_SIZE=20 → second call has offset 20.
    expect(useMoyskladVariantsMock).toHaveBeenLastCalledWith({ limit: 20, offset: 20 })
  })

  it('disables Вперёд on the last page (offset + rows >= total)', () => {
    useMoyskladVariantsMock.mockReturnValue({
      data: dataResponse([rowFull], 1),
    })
    render(<MoyskladVariantsTable />)
    expect(screen.getByRole('button', { name: /Вперёд/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: /Назад/ })).toBeDisabled()
  })

  it('shows the empty state when there are no variants', () => {
    useMoyskladVariantsMock.mockReturnValue({ data: dataResponse([], 0) })
    render(<MoyskladVariantsTable />)
    expect(screen.getByText('Нет модификаций в МойСклад')).toBeInTheDocument()
    expect(screen.getByText(/Показано 0 из 0/)).toBeInTheDocument()
  })

  it('surfaces the live-call error banner (graceful, no crash)', () => {
    useMoyskladVariantsMock.mockReturnValue({
      data: undefined,
      isError: true,
      isLoading: false,
    })
    render(<MoyskladVariantsTable />)
    expect(
      screen.getByText(/Не удалось загрузить модификации из МойСклад — проверьте подключение/)
    ).toBeInTheDocument()
  })
})
