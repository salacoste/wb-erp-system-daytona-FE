/**
 * Component tests — MoyskladMappingsTable.
 * Contract: docs/request-backend/221-moysklad-integration-backend-contract.md
 *
 * Covers: matched/pending filter toggle with counts (derived from the backend's
 * filtered `.total` via lightweight `limit:1` queries — NOT row-filtering the
 * sampled `all` view), «не привязан» + «Привязать» button on pending rows,
 * matchedBy badge, null price rendering («—»), pagination hint, and the
 * LinkMappingDialog key-remount (state resets across target rows).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { MoyskladMappingsTable } from '../MoyskladMappingsTable'
import type { MoyskladMappingsResponse } from '@/types/moysklad'

// Mock the mappings hook (controlled per-test via mockReturnValue).
const useMoyskladMappingsMock = vi.fn()
vi.mock('@/hooks/useMoyskladQueries', () => ({
  useMoyskladMappings: (...args: unknown[]) => useMoyskladMappingsMock(...args),
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

describe('MoyskladMappingsTable', () => {
  beforeEach(() => {
    useMoyskladMappingsMock.mockImplementation(
      (params: { matched?: boolean; limit?: number } = {}) => {
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
      }
    )
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
    useMoyskladMappingsMock.mockImplementation(
      (params: { matched?: boolean; limit?: number } = {}) => {
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
      }
    )
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

  it('shows the pagination hint «Показано N из M»', () => {
    useMoyskladMappingsMock.mockImplementation(
      (params: { matched?: boolean; limit?: number } = {}) => {
        if (params.limit === 1) {
          if (params.matched === true) return { data: countOnly(13), isLoading: false }
          if (params.matched === false) return { data: countOnly(422), isLoading: false }
          return { data: countOnly(435), isLoading: false }
        }
        if (params.matched === undefined) {
          return { data: { count: 2, total: 435, rows: [matched, pending] }, isLoading: false }
        }
        return { data: { count: 1, total: 422, rows: [pending] }, isLoading: false }
      }
    )
    render(<MoyskladMappingsTable />)
    // Default view = pending (422 total), 1 row shown.
    expect(screen.getByText(/Показано 1 из 422/)).toBeInTheDocument()
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
    useMoyskladMappingsMock.mockImplementation(
      (params: { matched?: boolean; limit?: number } = {}) => {
        if (params.limit === 1) return { data: countOnly(0), isLoading: false }
        return { data: { count: 0, total: 0, rows: [] }, isLoading: false }
      }
    )
    render(<MoyskladMappingsTable />)
    expect(screen.getByText('Нет данных')).toBeInTheDocument()
  })
})
