/**
 * Story 119.2-FE: funnel-table-columns top search queries column tests.
 *
 * Renamed from FunnelTable.test.tsx per Pass-1 F-3 (subject module is
 * funnel-table-columns.tsx, not FunnelTable.tsx).
 *
 * Coverage targets per AC-10:
 *   - Column renders top 3 queries when present
 *   - Empty `topSearchQueries` → `—`
 *   - Null `topSearchQueries` → `—`
 *   - Non-string entry filtered defensively
 *   - Link generation produces correct `href` with `encodeURIComponent`
 *   - Truncation: long query (>24 chars) → ellipsis + tooltip
 *   - Column position is AFTER existing metrics (header order assertion)
 *
 * Pass-1 fix coverage:
 *   - F-2: shared fixtures from src/test/fixtures/funnel-empty.ts (replaces local makeItem)
 *   - F-5: React key collision regression (duplicate query strings)
 *   - F-8: em-dash assertions scoped to the LAST cell of the row
 *   - F-9: empty-string `query` rejection in filterValidQueries
 *
 * Pure-function coverage for `truncateQuery` + `filterValidQueries` is direct
 * (per CLAUDE.md pure-functions-over-hook-mocking convention).
 */

import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { Table, TableBody } from '@/components/ui/table'
import {
  FunnelTableHeader,
  FunnelTableRow,
  truncateQuery,
  filterValidQueries,
} from '../funnel-table-columns'
import type { FunnelProductItem, TopSearchQuery } from '@/types/analytics-funnel'
import {
  emptyFunnelResponse,
  makeFunnelProductItem,
  makeTopSearchQuery,
} from '@/test/fixtures/funnel-empty'

function renderRow(item: FunnelProductItem) {
  return render(
    <Table>
      <TableBody>
        <FunnelTableRow item={item} />
      </TableBody>
    </Table>
  )
}

/** Helper for F-8: return the LAST cell of the (only) data row. */
function lastCellOfRow(): HTMLElement {
  const row = screen.getByRole('row')
  const cells = within(row).getAllByRole('cell')
  return cells[cells.length - 1]
}

describe('funnel-empty fixtures (Pattern 3 smoke-test, F-2)', () => {
  it('emptyFunnelResponse returns a stable empty shape', () => {
    const fx = emptyFunnelResponse()
    expect(fx.items).toEqual([])
    expect(fx.pagination.total).toBe(0)
  })

  it('makeFunnelProductItem accepts overrides', () => {
    const fx = makeFunnelProductItem({ nmId: 12345 })
    expect(fx.nmId).toBe(12345)
  })

  it('makeTopSearchQuery accepts overrides', () => {
    const fx = makeTopSearchQuery({ query: 'жидкая изолента' })
    expect(fx.query).toBe('жидкая изолента')
  })
})

describe('truncateQuery (pure)', () => {
  it('returns original string when under maxChars', () => {
    expect(truncateQuery('short query', 24)).toBe('short query')
  })

  it('truncates with ellipsis when over maxChars (Latin)', () => {
    expect(truncateQuery('a'.repeat(30), 24)).toBe('a'.repeat(24) + '…')
  })

  it('counts Cyrillic code points correctly (not bytes)', () => {
    // "жидкая изолента для проводов с кисточкой черная" — 47 Cyrillic chars
    const long = 'жидкая изолента для проводов с кисточкой черная'
    const result = truncateQuery(long, 24)
    expect(result.endsWith('…')).toBe(true)
    // 24 chars + ellipsis = 25 visible code points
    expect(Array.from(result).length).toBe(25)
  })

  it('uses default 24 when maxChars not provided', () => {
    expect(truncateQuery('a'.repeat(25))).toBe('a'.repeat(24) + '…')
  })
})

describe('filterValidQueries (pure)', () => {
  it('returns [] for null', () => {
    expect(filterValidQueries(null)).toEqual([])
  })

  it('returns [] for undefined', () => {
    expect(filterValidQueries(undefined)).toEqual([])
  })

  it('returns [] for non-array', () => {
    // @ts-expect-error — testing defensive behavior against shape drift
    expect(filterValidQueries('not-an-array')).toEqual([])
  })

  it('filters out entries with non-string query', () => {
    // Cast to unknown then to TopSearchQuery[] — bypasses element type-checks for defensive shape-drift testing
    const raw = [
      { query: 'valid', impressions: 1, clicks: 1, orders: 1 },
      { query: 123, impressions: 1, clicks: 1, orders: 1 },
      { query: null, impressions: 1, clicks: 1, orders: 1 },
    ] as unknown as TopSearchQuery[]
    expect(filterValidQueries(raw)).toEqual([
      { query: 'valid', impressions: 1, clicks: 1, orders: 1 },
    ])
  })

  // F-9: empty-string queries must be rejected to avoid rendering an empty <Link>.
  it('F-9: rejects empty-string queries', () => {
    expect(filterValidQueries([{ query: '', impressions: 0, clicks: 0, orders: 0 }])).toEqual([])
    expect(
      filterValidQueries([
        { query: 'valid', impressions: 0, clicks: 0, orders: 0 },
        { query: '', impressions: 0, clicks: 0, orders: 0 },
      ])
    ).toHaveLength(1)
  })

  it('passes through valid entries', () => {
    const raw: TopSearchQuery[] = [
      { query: 'a', impressions: 1, clicks: 1, orders: 1 },
      { query: 'b', impressions: 2, clicks: 2, orders: 2 },
    ]
    expect(filterValidQueries(raw)).toEqual(raw)
  })
})

describe('FunnelTableHeader — column position', () => {
  it('renders "Топ поисковых запросов" as the LAST header column', () => {
    render(
      <Table>
        <FunnelTableHeader sort="openCardCount" sortOrder="desc" onSort={() => {}} />
      </Table>
    )
    const headers = screen.getAllByRole('columnheader')
    const lastHeader = headers[headers.length - 1]
    expect(lastHeader).toHaveTextContent('Топ поисковых запросов')
  })
})

describe('FunnelTableRow — top search queries cell', () => {
  it('renders top 3 query links when 5 queries are present', () => {
    const item = makeFunnelProductItem({
      topSearchQueries: [
        makeTopSearchQuery({ query: 'q1' }),
        makeTopSearchQuery({ query: 'q2' }),
        makeTopSearchQuery({ query: 'q3' }),
        makeTopSearchQuery({ query: 'q4' }),
        makeTopSearchQuery({ query: 'q5' }),
      ],
    })
    renderRow(item)
    const links = screen.getAllByRole('link')
    expect(links).toHaveLength(3)
    expect(links[0]).toHaveTextContent('q1')
    expect(links[1]).toHaveTextContent('q2')
    expect(links[2]).toHaveTextContent('q3')
  })

  // F-5: React key collision regression — duplicate query strings must all render.
  it('F-5: renders all queries even when query strings collide (key uses index prefix)', () => {
    const item = makeFunnelProductItem({
      topSearchQueries: [
        makeTopSearchQuery({ query: 'дубль' }),
        makeTopSearchQuery({ query: 'дубль' }),
        makeTopSearchQuery({ query: 'уникальный' }),
      ],
    })
    renderRow(item)
    const links = screen.getAllByRole('link')
    expect(links).toHaveLength(3)
    expect(links[0]).toHaveTextContent('дубль')
    expect(links[1]).toHaveTextContent('дубль')
    expect(links[2]).toHaveTextContent('уникальный')
  })

  it('F-8: renders em-dash in the LAST cell when topSearchQueries is empty array', () => {
    const item = makeFunnelProductItem({ topSearchQueries: [] })
    renderRow(item)
    expect(screen.queryAllByRole('link')).toHaveLength(0)
    expect(lastCellOfRow()).toHaveTextContent('—')
  })

  it('F-8: renders em-dash in the LAST cell when topSearchQueries is undefined', () => {
    const item = makeFunnelProductItem({ topSearchQueries: undefined })
    renderRow(item)
    expect(screen.queryAllByRole('link')).toHaveLength(0)
    expect(lastCellOfRow()).toHaveTextContent('—')
  })

  it('F-8: renders em-dash in the LAST cell when all entries are non-string', () => {
    const item = makeFunnelProductItem({
      topSearchQueries: [
        // @ts-expect-error — testing defensive behavior against shape drift
        { query: 123, impressions: 1, clicks: 1, orders: 1 },
        // @ts-expect-error — testing defensive behavior against shape drift
        { query: null, impressions: 1, clicks: 1, orders: 1 },
      ],
    })
    renderRow(item)
    expect(screen.queryAllByRole('link')).toHaveLength(0)
    expect(lastCellOfRow()).toHaveTextContent('—')
  })

  it('filters non-string entries defensively', () => {
    const item = makeFunnelProductItem({
      topSearchQueries: [
        makeTopSearchQuery({ query: 'valid1' }),
        // @ts-expect-error — testing defensive behavior
        { query: 123, impressions: 1, clicks: 1, orders: 1 },
        makeTopSearchQuery({ query: 'valid2' }),
      ],
    })
    renderRow(item)
    const links = screen.getAllByRole('link')
    expect(links).toHaveLength(2)
    expect(links[0]).toHaveTextContent('valid1')
    expect(links[1]).toHaveTextContent('valid2')
  })

  it('generates href with encodeURIComponent for Cyrillic queries', () => {
    const item = makeFunnelProductItem({
      topSearchQueries: [makeTopSearchQuery({ query: 'жидкая изолента' })],
    })
    renderRow(item)
    const link = screen.getByRole('link')
    const expectedHref = `/analytics/search?query=${encodeURIComponent('жидкая изолента')}`
    expect(link).toHaveAttribute('href', expectedHref)
  })

  it('truncates long queries with ellipsis and exposes full text in title', () => {
    const long = 'жидкая изолента для проводов с кисточкой черная'
    const item = makeFunnelProductItem({
      topSearchQueries: [makeTopSearchQuery({ query: long })],
    })
    renderRow(item)
    const link = screen.getByRole('link')
    expect(link.textContent ?? '').not.toBe(long) // truncated
    expect(link.textContent ?? '').toMatch(/…$/) // ends with ellipsis
    expect(link).toHaveAttribute('title', long) // full text in tooltip
  })

  it('renders queries in a row cell that is the LAST cell in the row', () => {
    const item = makeFunnelProductItem({
      topSearchQueries: [makeTopSearchQuery({ query: 'q1' })],
    })
    renderRow(item)
    expect(within(lastCellOfRow()).getByRole('link')).toHaveTextContent('q1')
  })
})
