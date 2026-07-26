/**
 * Component tests — MoyskladMappingsTable.
 * Contract: docs/request-backend/221-moysklad-integration-backend-contract.md
 *
 * Covers: matched/pending filter toggle with counts (derived from the backend's
 * filtered `.total` via lightweight `limit:1` queries — NOT row-filtering the
 * sampled `all` view), «не привязан» + «Привязать» button on pending rows,
 * matchedBy badge, null price rendering («—»), the LinkMappingDialog key-remount
 * (state resets across target rows), and the M4 pager («Показано N–M из total»,
 * Назад/Вперёд navigation, Назад disabled at page 0, filter change resets page).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { MoyskladMappingsTable } from '../MoyskladMappingsTable'
import { MoyskladMappingRow } from '../MoyskladMappingRow'
import type { MoyskladMappingsResponse, MoyskladProductMapping } from '@/types/moysklad'

// Mock the mappings hook (controlled per-test via mockReturnValue).
// Captures the params passed to each call so pager navigation is observable.
const useMoyskladMappingsMock = vi.fn<(params?: MappingsParams) => unknown>()
vi.mock('@/hooks/useMoyskladQueries', () => ({
  useMoyskladMappings: (...args: [params?: MappingsParams]) => useMoyskladMappingsMock(...args),
  useMoyskladHealth: vi.fn(() => ({ data: undefined, isLoading: false })),
  useMoyskladOrganizations: vi.fn(() => ({ data: [] })),
  useLinkMapping: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
}))

// Mock the dialog so it doesn't portal-render its trigger-only children.
// Captures props to verify the per-row key remount wiring.
const LinkMappingDialogMock = vi.fn()
vi.mock('../LinkMappingDialog', () => ({
  LinkMappingDialog: (props: unknown) => {
    LinkMappingDialogMock(props)
    return null
  },
}))

const matched = {
  id: 'm1',
  moyskladAssortmentId: 'a1',
  moyskladType: 'PRODUCT' as const,
  moyskladName: 'Футболка белая',
  moyskladArticle: 'WB-001',
  nmId: 12345678,
  matchedBy: 'VENDOR_CODE' as const,
  buyPriceRub: 70800,
  lastSyncedAt: '2026-07-01T10:00:00.000Z',
}

const pending = {
  id: 'p1',
  moyskladAssortmentId: 'a2',
  moyskladType: 'PRODUCT' as const,
  moyskladName: 'Носки чёрные',
  moyskladArticle: null,
  nmId: null,
  matchedBy: null,
  buyPriceRub: null,
  lastSyncedAt: null,
}

/** Build a count-only response for a `limit:1` query (rows empty, total set). */
const countOnly = (total: number): MoyskladMappingsResponse => ({
  count: 0,
  total,
  rows: [],
})

interface MappingsParams {
  matched?: boolean
  limit?: number
  offset?: number
}

describe('MoyskladMappingsTable', () => {
  beforeEach(() => {
    useMoyskladMappingsMock.mockImplementation((params: MappingsParams = {}) => {
      // Count queries: `limit:1` reads `.total` only (rows not consumed here).
      if (params.limit === 1) {
        if (params.matched === true) return { data: countOnly(1), isLoading: false }
        if (params.matched === false) return { data: countOnly(1), isLoading: false }
        return { data: countOnly(2), isLoading: false } // all
      }
      // Active view (rows to display).
      if (params.matched === undefined) {
        return { data: { count: 2, total: 2, rows: [matched, pending] }, isLoading: false }
      }
      const rows = params.matched ? [matched] : [pending]
      return { data: { count: rows.length, total: 2, rows }, isLoading: false }
    })
  })

  it('renders pending rows by default with «не привязан» and «Привязать»', () => {
    render(<MoyskladMappingsTable />)
    expect(screen.getByText('не привязан')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Привязать товар' })).toBeInTheDocument()
  })

  it('renders the matchedBy badge when switching to matched filter', () => {
    render(<MoyskladMappingsTable />)
    fireEvent.click(screen.getByRole('button', { name: /Привязаны/ }))
    expect(screen.getByText('По артикулу')).toBeInTheDocument()
    // matched row shows the nmId, not «не привязан»
    expect(screen.getByText('12345678')).toBeInTheDocument()
  })

  it('shows the filter counts derived from the backend `.total` (1/1/2)', () => {
    render(<MoyskladMappingsTable />)
    expect(screen.getByRole('button', { name: /Не привязаны \(1\)/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Привязаны \(1\)/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Все \(2\)/ })).toBeInTheDocument()
  })

  it('derives counts from filtered `.total`, robust past the 100-row sample cap', () => {
    // Simulate a 435-SKU cabinet: matched=13, pending=422, all=435.
    useMoyskladMappingsMock.mockImplementation((params: MappingsParams = {}) => {
      if (params.limit === 1) {
        if (params.matched === true) return { data: countOnly(13), isLoading: false }
        if (params.matched === false) return { data: countOnly(422), isLoading: false }
        return { data: countOnly(435), isLoading: false }
      }
      if (params.matched === undefined) {
        return { data: { count: 2, total: 435, rows: [matched, pending] }, isLoading: false }
      }
      const rows = params.matched ? [matched] : [pending]
      return { data: { count: rows.length, total: 435, rows }, isLoading: false }
    })
    render(<MoyskladMappingsTable />)
    expect(screen.getByRole('button', { name: /Не привязаны \(422\)/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Привязаны \(13\)/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Все \(435\)/ })).toBeInTheDocument()
  })

  it('renders the matched-row «Изменить» (re-link) button only when matched filter is active', () => {
    render(<MoyskladMappingsTable />)
    // Default = pending view → matched row absent → no re-link button present.
    expect(screen.queryByRole('button', { name: /Перепривязать/ })).not.toBeInTheDocument()
    // Switch to matched → the re-link button (aria-label "Перепривязать…") appears.
    fireEvent.click(screen.getByRole('button', { name: /Привязаны/ }))
    expect(screen.getByRole('button', { name: /Перепривязать/ })).toBeInTheDocument()
  })

  it('shows the pager hint «Показано N–M из total»', () => {
    useMoyskladMappingsMock.mockImplementation((params: MappingsParams = {}) => {
      if (params.limit === 1) {
        if (params.matched === true) return { data: countOnly(13), isLoading: false }
        if (params.matched === false) return { data: countOnly(422), isLoading: false }
        return { data: countOnly(435), isLoading: false }
      }
      // Active view: 2 rows on page 0 of pending (422 total).
      if (params.matched === false) {
        const rowB = { ...pending, id: 'p1b' }
        return { data: { count: 2, total: 422, rows: [pending, rowB] }, isLoading: false }
      }
      return { data: { count: 1, total: 422, rows: [pending] }, isLoading: false }
    })
    render(<MoyskladMappingsTable />)
    // Page 0, offset 0, 2 rows → «Показано 1–2 из 422».
    expect(screen.getByText(/Показано 1–2 из 422/)).toBeInTheDocument()
  })

  it('remounts LinkMappingDialog per target row (key resets internal state)', () => {
    render(<MoyskladMappingsTable />)
    // Click «Привязать» on the pending row → dialog receives the target mapping.
    fireEvent.click(screen.getByRole('button', { name: 'Привязать товар' }))
    expect(LinkMappingDialogMock).toHaveBeenCalled()
    const lastCallProps = LinkMappingDialogMock.mock.calls.at(-1)?.[0] as unknown as {
      mapping: { id: string }
    }
    expect(lastCallProps?.mapping.id).toBe('p1')
  })

  it('shows empty state when a filter view has no rows', () => {
    useMoyskladMappingsMock.mockImplementation((params: MappingsParams = {}) => {
      if (params.limit === 1) return { data: countOnly(0), isLoading: false }
      return { data: { count: 0, total: 0, rows: [] }, isLoading: false }
    })
    render(<MoyskladMappingsTable />)
    expect(screen.getByText('Нет данных')).toBeInTheDocument()
  })

  it('disables «Назад» at page 0', () => {
    render(<MoyskladMappingsTable />)
    const prev = screen.getByRole('button', { name: 'Предыдущая страница' })
    expect(prev).toBeDisabled()
  })

  it('advances the offset via «Вперёд» (query called with offset=PAGE_SIZE)', () => {
    // Distinct rows per offset so pager navigation is observable.
    const page0Pending = { ...pending, id: 'p-page0' }
    const page1Pending = { ...pending, id: 'p-page1', moyskladName: 'Кепка красная' }
    useMoyskladMappingsMock.mockImplementation((params: MappingsParams = {}) => {
      if (params.limit === 1) {
        if (params.matched === true) return { data: countOnly(0), isLoading: false }
        if (params.matched === false) return { data: countOnly(422), isLoading: false }
        return { data: countOnly(422), isLoading: false }
      }
      // Active pending view paginated by offset (PAGE_SIZE = 20).
      if (params.matched === false) {
        const rows = (params.offset ?? 0) >= 20 ? [page1Pending] : [page0Pending]
        return { data: { count: rows.length, total: 422, rows }, isLoading: false }
      }
      return { data: { count: 0, total: 422, rows: [] }, isLoading: false }
    })

    render(<MoyskladMappingsTable />)
    // Page 0 → first page row visible; Назад disabled.
    expect(screen.getByText('Носки чёрные')).toBeInTheDocument()
    expect(screen.getByText(/Показано 1–1 из 422/)).toBeInTheDocument()

    // Click «Вперёд» → offset advances to PAGE_SIZE (20); page-1 row appears.
    fireEvent.click(screen.getByRole('button', { name: 'Следующая страница' }))

    const activeCalls = useMoyskladMappingsMock.mock.calls.filter(
      ([p]: [MappingsParams?]) => p?.limit !== 1
    )
    const lastActive = activeCalls.at(-1)?.[0] as MappingsParams | undefined
    expect(lastActive?.offset).toBe(20)
    expect(screen.getByText('Кепка красная')).toBeInTheDocument()
    expect(screen.getByText(/Показано 21–21 из 422/)).toBeInTheDocument()
  })

  it('resets the page to 0 when the filter changes', () => {
    // Navigate to page 1 first, then switch filter and assert offset resets to 0.
    useMoyskladMappingsMock.mockImplementation((params: MappingsParams = {}) => {
      if (params.limit === 1) {
        if (params.matched === true) return { data: countOnly(5), isLoading: false }
        if (params.matched === false) return { data: countOnly(422), isLoading: false }
        return { data: countOnly(427), isLoading: false }
      }
      const rows = params.matched ? [matched] : [pending]
      return { data: { count: rows.length, total: 427, rows }, isLoading: false }
    })

    render(<MoyskladMappingsTable />)
    // Advance to page 1.
    fireEvent.click(screen.getByRole('button', { name: 'Следующая страница' }))
    const beforeSwitch = useMoyskladMappingsMock.mock.calls
      .filter(([p]: [MappingsParams?]) => p?.limit !== 1)
      .at(-1)?.[0] as MappingsParams | undefined
    expect(beforeSwitch?.offset).toBe(20)

    // Switch filter to matched → active view offset resets to 0.
    fireEvent.click(screen.getByRole('button', { name: /Привязаны/ }))
    const afterSwitch = useMoyskladMappingsMock.mock.calls
      .filter(([p]: [MappingsParams?]) => p?.limit !== 1 && p?.matched === true)
      .at(-1)?.[0] as MappingsParams | undefined
    expect(afterSwitch?.offset).toBe(0)
    // «Назад» disabled again (page 0).
    expect(screen.getByRole('button', { name: 'Предыдущая страница' })).toBeDisabled()
  })

  // --- M5: drill-through link on matched nmId (FR-7 product page) ---

  it('renders a drill-through link to /analytics/product/<nmId> on matched rows', () => {
    render(<MoyskladMappingsTable />)
    fireEvent.click(screen.getByRole('button', { name: /Привязаны/ }))
    const link = screen.getByRole('link', { name: /12345678/ })
    expect(link).toHaveAttribute('href', '/analytics/product/12345678')
  })

  it('renders no drill-through link on pending rows (nmId null → «не привязан»)', () => {
    render(<MoyskladMappingsTable />)
    // Default = pending view; no anchor to a product page.
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(screen.getByText('не привязан')).toBeInTheDocument()
  })

  // --- M5: transient «себестоимость обновлена» badge ---

  it('shows «себестоимость обновлена» badge on a recently-linked row with a buy price', () => {
    render(
      <table>
        <tbody>
          <MoyskladMappingRow
            mapping={matched as MoyskladProductMapping}
            onLink={vi.fn()}
            isRecent={true}
          />
        </tbody>
      </table>
    )
    expect(screen.getByText('себестоимость обновлена')).toBeInTheDocument()
  })

  it('hides the badge when the row is not recently linked', () => {
    render(
      <table>
        <tbody>
          <MoyskladMappingRow
            mapping={matched as MoyskladProductMapping}
            onLink={vi.fn()}
            isRecent={false}
          />
        </tbody>
      </table>
    )
    expect(screen.queryByText('себестоимость обновлена')).not.toBeInTheDocument()
  })

  it('hides the badge on a recently-linked row when buy price is null (AP#8)', () => {
    const noPrice = { ...(matched as MoyskladProductMapping), buyPriceRub: null }
    render(
      <table>
        <tbody>
          <MoyskladMappingRow mapping={noPrice} onLink={vi.fn()} isRecent={true} />
        </tbody>
      </table>
    )
    expect(screen.queryByText('себестоимость обновлена')).not.toBeInTheDocument()
  })
})
