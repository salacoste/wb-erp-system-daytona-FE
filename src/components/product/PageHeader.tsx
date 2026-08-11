'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

import { cn } from '@/lib/utils'

/** A route-owned breadcrumb item. The composition never changes route state. */
export interface BreadcrumbItem {
  /** Already-localized non-interactive text displayed for this item. */
  label: string
  /** Optional destination. Omit it for the current page. */
  href?: string
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[]
  /** Zero-based current item. Invalid values safely fall back to the final item. */
  currentIndex?: number
  /** Accessible label for the breadcrumb navigation landmark. */
  ariaLabel?: string
  className?: string
}

/** Standalone breadcrumb composition for routes that do not need the full header. */
export function Breadcrumbs({
  items,
  currentIndex: requestedCurrentIndex,
  ariaLabel = 'Навигация по странице',
  className,
}: BreadcrumbsProps) {
  const resolvedItems = items.map(item => ({ ...item, label: item.label.trim() }))
  if (resolvedItems.some(item => !item.label)) {
    throw new Error('Breadcrumb item labels must be non-empty')
  }

  const fallbackCurrentIndex = resolvedItems.length - 1
  const currentIndex =
    requestedCurrentIndex !== undefined &&
    Number.isInteger(requestedCurrentIndex) &&
    requestedCurrentIndex >= 0 &&
    requestedCurrentIndex < resolvedItems.length
      ? requestedCurrentIndex
      : fallbackCurrentIndex
  const resolvedAriaLabel = ariaLabel.trim() || 'Навигация по странице'

  return (
    <nav aria-label={resolvedAriaLabel} data-slot="breadcrumbs" className={className}>
      <ol className="flex flex-wrap items-center gap-x-1 gap-y-1 text-sm text-muted-foreground">
        {resolvedItems.map((item, index) => {
          const isCurrent = index === currentIndex
          const key = `${index}-${item.label}`

          return (
            <li key={key} className="inline-flex min-w-0 items-center gap-1">
              {index > 0 && (
                <ChevronRight
                  aria-hidden="true"
                  className="size-4 shrink-0 text-muted-foreground/70"
                />
              )}
              {isCurrent || !item.href ? (
                <span
                  aria-current={isCurrent ? 'page' : undefined}
                  className={cn('min-w-0 break-words', isCurrent && 'font-medium text-foreground')}
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="min-w-0 break-words rounded-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  {item.label}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

export interface PageHeaderProps {
  /** Stable route identity. This is always rendered as the page's single h1. */
  title: string
  /** Optional explanation of the route's business purpose. */
  description?: ReactNode
  /** Useful route-owned navigation context. */
  breadcrumbs?: BreadcrumbItem[]
  /** Zero-based current breadcrumb; the final item is current by default. */
  currentBreadcrumbIndex?: number
  /** Context metadata or controls supplied by the route. */
  context?: ReactNode
  /** Status/availability content supplied by the route. */
  status?: ReactNode
  /** Primary and secondary actions in task order. */
  actions?: ReactNode
  /** An optional additional slot below the identity row. */
  children?: ReactNode
  /** Compact headers are useful in contextual detail views. */
  compact?: boolean
  /** Indicates that metadata is being refreshed without replacing the title. */
  busy?: boolean
  /** Accessible label for the breadcrumb navigation landmark. */
  breadcrumbLabel?: string
  className?: string
}

/**
 * Shared route identity composition.
 *
 * PageHeader is deliberately presentational: breadcrumbs, actions, and context
 * are supplied by the route, so URL/search/debounce/persistence semantics stay
 * with their owners. It renders one logical h1 regardless of the visual size.
 */
export function PageHeader({
  title,
  description,
  breadcrumbs,
  currentBreadcrumbIndex,
  context,
  status,
  actions,
  children,
  compact = false,
  busy = false,
  breadcrumbLabel = 'Навигация по странице',
  className,
}: PageHeaderProps) {
  const hasBreadcrumbs = Boolean(breadcrumbs?.length)
  const resolvedTitle = title.trim()

  if (!resolvedTitle) throw new Error('PageHeader title must be non-empty')

  return (
    <header
      data-slot="page-header"
      data-compact={compact ? 'true' : 'false'}
      data-busy={busy ? 'true' : 'false'}
      className={cn('space-y-4', compact && 'space-y-3', className)}
    >
      {hasBreadcrumbs && (
        <Breadcrumbs
          items={breadcrumbs!}
          currentIndex={currentBreadcrumbIndex}
          ariaLabel={breadcrumbLabel}
        />
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <div data-slot="page-header-identity" aria-busy={busy || undefined} className="space-y-1">
            <h1
              className={cn(
                'break-words text-2xl font-semibold tracking-tight',
                compact && 'text-xl'
              )}
            >
              {resolvedTitle}
            </h1>
            {description && (
              <div className="max-w-3xl break-words text-sm text-muted-foreground">
                {description}
              </div>
            )}
            {context && (
              <div
                data-slot="page-header-context"
                className="flex flex-wrap items-center gap-2 pt-1"
              >
                {context}
              </div>
            )}
          </div>
          {status && (
            <div
              data-slot="page-header-status"
              role="status"
              aria-live={busy ? 'polite' : undefined}
              className="flex flex-wrap items-center gap-2 pt-1"
            >
              {status}
            </div>
          )}
        </div>

        {actions && (
          <div
            data-slot="page-header-actions"
            className="flex w-full min-w-0 flex-wrap items-center gap-2 sm:w-auto sm:justify-end [&_button]:h-auto [&_button]:min-h-11 [&_button]:max-w-full [&_button]:whitespace-normal [&_button]:break-words"
          >
            {actions}
          </div>
        )}
      </div>

      {children && <div data-slot="page-header-content">{children}</div>}
    </header>
  )
}

export default PageHeader
