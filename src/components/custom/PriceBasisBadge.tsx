'use client'

/**
 * Price Basis Badge (SPP-1.7-FE)
 * Compact chip identifying which price basis a recommendation row was computed
 * under. Mirrors MarginBadge styling (rounded-full border + text-xs).
 * 'STOREFRONT_STALE' flag → amber variant: no fresh observation ≤24h, seller
 * fallback price used.
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
    className: 'border-gray-200 bg-gray-50 text-gray-700',
    label: 'Продавец',
    title: 'Цена продавца (seller API)',
  },
  storefront: {
    className: 'border-blue-200 bg-blue-50 text-blue-700',
    label: 'Витрина',
    title: 'Цена витрины (аноним, с промо)',
  },
  stale: {
    className: 'border-amber-200 bg-amber-50 text-amber-700',
    label: 'Витрина · устарела',
    title: 'Нет свежего наблюдения ≤24ч — использована цена продавца',
  },
  unknown: {
    className: 'border-gray-300 bg-gray-100 text-gray-600',
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
