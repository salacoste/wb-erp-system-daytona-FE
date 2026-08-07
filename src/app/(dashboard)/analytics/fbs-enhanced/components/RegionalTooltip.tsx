/**
 * RegionalTooltip — presentational recharts tooltip + typed adapter.
 *
 * Extracted in Epic 164-FE Story 164.2 to eliminate the production
 * `RegionalTooltip as any` cast on the recharts `<Tooltip content={...} />`
 * (CLAUDE.md anti-pattern #4). Replaces the opaque boundary with a typed
 * adapter that narrows the recharts payload via runtime guards.
 *
 * Two layers:
 *   1. `RegionalTooltip`        — pure presentational component (kept
 *      byte-identical to the pre-extraction implementation; pinned by direct
 *      unit tests in FbsRegionalDataSection.test.tsx).
 *   2. `regionalTooltipContent` — typed adapter assignable to recharts
 *      `content`. Owns payload normalization: extracts ONLY `label`,
 *      `name`, `color`, `value` from the recharts payload; unsupported
 *      payload members do not leak into the presentational component.
 *
 * Raw-value preservation (CLAUDE.md anti-pattern #8 + Story 164.2 AC #3):
 * the chart plots `percentage = r.percentage ?? 0` (the library requires a
 * number), so a missing percentage surfaces in `entry.value` as `0`. The
 * original null-able value is preserved on the row as `_percentageRaw`; the
 * adapter prefers it so a genuine `0` stays distinguishable from missing
 * (null → '—', 0 → '0 %').
 */

import type { ReactNode } from 'react'
import type { TooltipContentProps } from 'recharts'
import { formatPercentage } from '@/lib/utils'

/**
 * Broad value/name type params for the recharts tooltip content. The package
 * does not re-export `ValueType`/`NameType` (verified in recharts 3.4.1), and
 * `TooltipContentProps` declares both generics without defaults, so the
 * adapter must accept the SAME broadened shape that `<Tooltip content={...}>`
 * resolves to (its own defaulted generics) to be assignable without a cast.
 * `payload` is `ReadonlyArray<any>` regardless, so narrowing happens in
 * `toEntry`; the broad `label`/`value` only flow through runtime guards.
 */
type RechartsValue = number | string | ReadonlyArray<number | string>
type RechartsName = number | string
type RegionalTooltipContentProps = TooltipContentProps<RechartsValue, RechartsName>

/**
 * Presentational payload row — the ONLY fields RegionalTooltip supports.
 * Adapter-constructed; never handed a raw recharts entry.
 */
export interface RegionalTooltipEntry {
  name: string
  value: number | null
  color: string
}

interface RegionalTooltipProps {
  active?: boolean
  payload?: RegionalTooltipEntry[]
  label?: string | number
}

/**
 * Custom recharts tooltip for the regional bar chart.
 * Exported for unit-testing only — not consumed externally.
 *
 * Renders null-safe metric rows: null value → '—' per CLAUDE.md anti-pattern #8
 * and the Defensive Frontend Principle. A genuine 0 is rendered via
 * formatPercentage (0 → '0 %'), staying distinct from missing (null → '—').
 */
export function RegionalTooltip({ active, payload, label }: RegionalTooltipProps): ReactNode {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div className="rounded-md border bg-white p-3 shadow-sm text-sm">
      <p className="font-medium mb-1">{label}</p>
      {payload.map(entry => (
        <p key={entry.name} style={{ color: entry.color }}>
          {entry.name}: {entry.value == null ? '—' : formatPercentage(entry.value)}
        </p>
      ))}
    </div>
  )
}

/**
 * Shape of the raw percentage preserved on each chart row as
 * `_percentageRaw` by FbsRegionalDataSection. Kept here (not in the chart
 * data module) because it is a tooltip-boundary concern: the chart must plot
 * a number, the tooltip must distinguish null (missing) from 0.
 */
interface RegionalRowRaw {
  _percentageRaw?: number | null
}

function isRegionalRowRaw(value: unknown): value is RegionalRowRaw {
  if (typeof value !== 'object' || value === null || !('_percentageRaw' in value)) return false
  const raw = value._percentageRaw
  return raw === null || raw === undefined || typeof raw === 'number'
}

/** Narrows an unknown recharts entry to the fields RegionalTooltip reads. */
interface RawTooltipEntry {
  name?: unknown
  value?: unknown
  color?: unknown
  payload?: unknown
}

function isRawTooltipEntry(value: unknown): value is RawTooltipEntry {
  return typeof value === 'object' && value !== null
}

function toTooltipValue(entryValue: unknown, entryPayload: unknown): number | null {
  // Prefer the preserved raw value (null-able) so missing stays '—'.
  if (isRegionalRowRaw(entryPayload)) {
    const raw = entryPayload._percentageRaw
    if (raw === null || raw === undefined) return null
    if (typeof raw === 'number') return raw
  }
  // Fall back to the plotted entry value (always a number for this chart).
  if (typeof entryValue === 'number') return entryValue
  return null
}

function toEntry(rawEntry: unknown): RegionalTooltipEntry | null {
  if (!isRawTooltipEntry(rawEntry)) return null
  // A real series entry carries a string `name` (the Bar `name` prop). Entries
  // without one are not usable series — drop them so malformed/junk entries
  // do not surface as empty-labeled rows.
  if (typeof rawEntry.name !== 'string' || rawEntry.name === '') return null
  const color = typeof rawEntry.color === 'string' ? rawEntry.color : '#000'
  const value = toTooltipValue(rawEntry.value, rawEntry.payload)
  return { name: rawEntry.name, color, value }
}

/**
 * Typed recharts tooltip adapter — assignable to recharts
 * `<Tooltip content={...} />` without any cast. The recharts
 * `TooltipContentProps.payload` is typed `ReadonlyArray<any>` (verified in
 * recharts 3.4.1), so this adapter narrows the opaque payload with runtime
 * guards and forwards ONLY { name, color, value } to RegionalTooltip.
 * Inactive / empty / malformed payloads short-circuit to null.
 */
export function regionalTooltipContent({
  active,
  payload,
  label,
}: RegionalTooltipContentProps): ReactNode {
  if (!active || !payload || payload.length === 0) return null
  const entries = payload.map(toEntry).filter((e): e is RegionalTooltipEntry => e !== null)
  if (entries.length === 0) return null
  return <RegionalTooltip active={active} payload={entries} label={label} />
}
