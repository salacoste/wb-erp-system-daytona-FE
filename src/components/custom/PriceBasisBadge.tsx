'use client'

/**
 * Price Basis Badge (SPP-1.7-FE)
 * Compact chip identifying which price basis a recommendation row was computed
 * under. Mirrors MarginBadge styling (rounded-full border + text-xs).
 * 'STOREFRONT_STALE' flag → warning variant: no fresh observation ≤24h, seller
 * fallback price used.
 * Story 174.2-FE (C2): legacy gray/blue/amber palette → semantic valences —
 * storefront → status-information, stale → status-warning, seller/unknown → muted.
 */

import { cn } from '@/lib/utils'
import type { PriceBasisOrUnknown } from '@/types/price-recommendations'

export const STOREFRONT_STALE_FLAG = 'STOREFRONT_STALE'

interface PriceBasisBadgeProps {
  basis: PriceBasisOrUnknown
  flags?: string[]
}

/** Resolve badge variant from basis + validation flags (pure, testable). */
export function resolveBasisBadgeVariant(
  basis: PriceBasisOrUnknown,
  flags?: string[]
): 'seller' | 'storefront' | 'stale' | 'unknown' {
  if (basis === 'SELLER') return 'seller'
  if (basis === 'UNKNOWN') return 'unknown'
  return flags?.includes(STOREFRONT_STALE_FLAG) ? 'stale' : 'storefront'
}

const VARIANTS = {
  seller: {
    className: 'border-border bg-muted text-muted-foreground',
    label: 'Продавец',
    title: 'Цена продавца (seller API)',
  },
  storefront: {
    className: 'border-status-information/40 bg-status-information/10 text-status-information',
    label: 'Витрина',
    title: 'Цена витрины (аноним, с промо)',
  },
  stale: {
    className: 'border-status-warning/40 bg-status-warning/10 text-status-warning',
    label: 'Витрина · устарела',
    title: 'Нет свежего наблюдения ≤24ч — использована цена продавца',
  },
  unknown: {
    className: 'border-border bg-muted text-muted-foreground',
    label: 'Неизвестный базис',
    title: 'Бэкенд вернул нераспознанное значение базиса — не подменяем его молча',
  },
} as const

export function PriceBasisBadge({ basis, flags }: PriceBasisBadgeProps) {
  const variant = resolveBasisBadgeVariant(basis, flags)
  const { className, label, title } = VARIANTS[variant]

  // Static label chip: plain span + aria-label (role="status" would create N
  // aria-live regions in the table — wrong semantics for a static label).
  return (
    <span
      aria-label={label}
      title={title}
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold',
        className
      )}
    >
      {label}
    </span>
  )
}
