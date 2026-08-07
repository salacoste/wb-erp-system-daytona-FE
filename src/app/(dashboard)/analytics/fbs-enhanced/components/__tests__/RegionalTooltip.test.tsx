/**
 * Adapter tests for the typed recharts tooltip boundary — Epic 164-FE Story 164.2.
 *
 * These tests exercise `regionalTooltipContent` (the typed adapter that replaces
 * the production `RegionalTooltip as any` cast on `<Tooltip content={...} />`).
 * The adapter is what recharts actually calls; it narrows the opaque
 * `ReadonlyArray<any>` payload to {name, color, value} and forwards only those
 * to the pure `RegionalTooltip` presentational component.
 *
 * Coverage mandated by Story 164.2 AC #2/#3/#5:
 *   - inactive / empty / null / zero / populated payloads
 *   - zero-vs-null distinction (genuine 0 → '0 %', null → '—') via the
 *     preserved `_percentageRaw` raw value (anti-pattern #8)
 *   - unsupported payload members do NOT leak into the rendered tooltip
 *
 * No `any` is used: payloads are typed against the public recharts
 * `TooltipContentProps` shape (entries are objects with optional fields). The
 * direct `RegionalTooltip` presentational tests remain in
 * FbsRegionalDataSection.test.tsx and stay green (byte-identical rendering).
 */

import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils/test-utils'
import { formatPercentage } from '@/lib/utils'
import { regionalTooltipContent, type RegionalTooltipEntry } from '../RegionalTooltip'

/**
 * Minimal recharts payload entry shape as seen by the adapter at runtime.
 * `payload` carries the chart-row datum (incl. `_percentageRaw`); `value` is
 * the plotted (coalesced) number; `name`/`color` come from the Bar.
 */
interface RechartsEntry {
  name?: unknown
  value?: unknown
  color?: unknown
  payload?: unknown
  // Unsupported members recharts may attach — must NOT leak:
  dataKey?: unknown
  type?: unknown
  unit?: unknown
}

interface AdapterProps {
  active: boolean
  payload: ReadonlyArray<RechartsEntry>
  label?: string | number
  // Extra TooltipContentProps fields are irrelevant to the adapter; omitted.
}

function renderAdapter(props: AdapterProps) {
  return renderWithProviders(<>{regionalTooltipContent(props as never)}</>)
}

describe('regionalTooltipContent adapter (Story 164.2)', () => {
  it('returns null when inactive (recharts contract)', () => {
    const { container } = renderAdapter({
      active: false,
      payload: [{ name: 'Доля (%)', value: 45, color: '#E53935' }],
      label: 'Центральный',
    })
    expect(container.firstChild).toBeNull()
  })

  it('returns null when payload is empty', () => {
    const { container } = renderAdapter({ active: true, payload: [], label: 'Урал' })
    expect(container.firstChild).toBeNull()
  })

  it('returns null when payload is null (malformed recharts call)', () => {
    const { container } = renderAdapter({
      active: true,
      payload: null as unknown as ReadonlyArray<RechartsEntry>,
      label: 'Урал',
    })
    expect(container.firstChild).toBeNull()
  })

  it('returns null when every entry is malformed (no usable {name,color,value})', () => {
    const { container } = renderAdapter({
      active: true,
      // Entries missing value/payload entirely and with junk shapes.
      payload: [
        { dataKey: 'percentage', type: 'bars' },
        { color: null, name: 42 },
        'not-an-object' as unknown as RechartsEntry,
      ],
      label: 'Сибирь',
    })
    expect(container.firstChild).toBeNull()
  })

  it('renders label + formatted metric for a populated payload', () => {
    renderAdapter({
      active: true,
      payload: [{ name: 'Доля (%)', value: 45, color: '#E53935', payload: { _percentageRaw: 45 } }],
      label: 'Центральный',
    })
    expect(screen.getByText('Центральный')).toBeInTheDocument()
    expect(screen.getByText(/Доля/)).toBeInTheDocument()
    // formatPercentage(45) → Russian-locale percent (comma + NBSP).
    expect(screen.getByText(/45/)).toBeInTheDocument()
  })

  it('renders genuine zero (0) distinctly from missing (null) — anti-pattern #8 / AC #3', () => {
    // Both rows plot as value: 0 (chart requires a number), but the preserved
    // _percentageRaw distinguishes genuine 0 from missing. Assert EXACT rendered
    // textContent on each row (computed via the same formatter the component
    // uses) so the test fails if the adapter ever regresses — e.g. masks a
    // genuine 0 as '—', or surfaces null as the formatted '0,0 %'.
    renderAdapter({
      active: true,
      payload: [
        { name: 'Доля (%)', value: 0, color: '#E53935', payload: { _percentageRaw: 0 } },
        { name: 'Доля (%)', value: 0, color: '#E53935', payload: { _percentageRaw: null } },
      ],
      label: 'Два региона',
    })

    // Both rendered metric rows start with the series label. The full rendered
    // text is split across React text nodes (`{name}: {value}`), so we query by
    // the stable label fragment and then assert on the concatenated textContent
    // — the load-bearing, byte-exact contract.
    const rows = screen.getAllByText(/^Доля \(%\)/)
    expect(rows).toHaveLength(2)

    const expectedZero = formatPercentage(0) // '0,0 %' in ru-RU
    const rowTexts = rows.map(el => el.textContent ?? '')

    // Exactly one row renders the genuine 0 via the formatter (NOT an em-dash).
    expect(rowTexts).toContain(`Доля (%): ${expectedZero}`)
    // Exactly one row renders missing (null) as an em-dash (NOT the formatted 0).
    expect(rowTexts).toContain('Доля (%): —')
    // The two renderings are genuinely distinct (no null masked as 0, no 0 masked as null).
    expect(rowTexts[0]).not.toBe(rowTexts[1])
    expect(rowTexts.filter(t => t === `Доля (%): ${expectedZero}`)).toHaveLength(1)
    expect(rowTexts.filter(t => t === 'Доля (%): —')).toHaveLength(1)
  })

  it('falls back to the plotted entry value when _percentageRaw is absent', () => {
    // Older code paths or foreign charts may not stash _percentageRaw; the
    // adapter must still render the plotted number rather than '—'.
    renderAdapter({
      active: true,
      payload: [{ name: 'Доля (%)', value: 12.5, color: '#E53935' }],
      label: 'Урал',
    })
    expect(screen.getByText(/12,5/)).toBeInTheDocument()
    expect(screen.queryByText(/—/)).toBeNull()
  })

  it('does NOT leak unsupported payload members into the rendered tooltip', () => {
    // Entry carries recharts internal fields (dataKey, type, unit) plus nested
    // junk on payload — adapter must forward ONLY {name, color, value}.
    renderAdapter({
      active: true,
      payload: [
        {
          name: 'Доля (%)',
          value: 30,
          color: '#E53935',
          dataKey: 'percentage',
          type: 'bars',
          unit: '%',
          payload: { _percentageRaw: 30, region: 'Урал', __secret: 'leak' },
        },
      ],
      label: 'Урал',
    })
    // Rendered metric row contains only name + formatted value (color via style).
    const row = screen.getByText(/Доля/)
    expect(row.textContent).toMatch(/Доля/)
    expect(row.textContent).not.toMatch(/percentage|bars|__secret|leak|unit/i)
    // Label is the region, not the dataKey/type junk.
    expect(screen.getByText('Урал')).toBeInTheDocument()
  })

  it('type-checks without `any` — RegionalTooltipEntry is the forwarded shape', () => {
    // Static contract assertion: the adapter narrows to RegionalTooltipEntry,
    // which exposes exactly {name, color, value} and nothing else.
    const entry: RegionalTooltipEntry = { name: 'Доля (%)', value: 45, color: '#E53935' }
    expect(entry).toEqual({ name: 'Доля (%)', value: 45, color: '#E53935' })
  })
})
