'use client'

/**
 * Analytics Navigation Components
 * Extracted from analytics/page.tsx - pure structural refactoring
 * Navigation card and section components for the analytics hub
 */

import Link from 'next/link'
import { cn } from '@/lib/utils'
import { ArrowRight } from 'lucide-react'
import type { NavigationItem } from './analytics-navigation-config'

// Re-export config and type for convenience
export { analyticsNavigation } from './analytics-navigation-config'
export type { NavigationItem } from './analytics-navigation-config'

/**
 * Navigation Card Component
 * UX: Large click targets, clear visual feedback, accessible
 */
function NavigationCard({
  href,
  icon: Icon,
  title,
  description,
  color,
  bgColor,
  hoverBg,
  borderColor,
  badge,
  className,
}: NavigationItem & { className?: string }) {
  return (
    <Link
      href={href}
      className={cn(
        'group relative flex flex-col p-4 rounded-xl border-2 transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        borderColor,
        bgColor,
        hoverBg,
        'hover:shadow-md hover:scale-[1.02]',
        className
      )}
    >
      {/* Badge */}
      {badge && (
        <span className="absolute -top-2 -right-2 px-2 py-0.5 text-xs font-semibold rounded-full bg-red-500 text-white">
          {badge}
        </span>
      )}

      {/* Icon */}
      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center mb-3', bgColor)}>
        <Icon className={cn('h-5 w-5', color)} />
      </div>

      {/* Content */}
      <h3 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
        {title}
        <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 text-gray-400" />
      </h3>
      <p className="text-sm text-gray-600 line-clamp-2">{description}</p>
    </Link>
  )
}

/**
 * Navigation Section Component
 */
export function NavigationSection({
  title,
  description,
  items,
}: {
  title: string
  description: string
  items: NavigationItem[]
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="mb-3">
        {/* h2 — analytics hub renders h1 in AnalyticsPageHeader; section title groups navigation cards */}
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{title}</h2>
        <p className="text-xs text-gray-400">{description}</p>
      </div>
      <div
        className={cn('grid gap-3 flex-1', items.length === 1 ? 'grid-cols-1' : 'sm:grid-cols-2')}
      >
        {items.map(item => (
          <NavigationCard
            key={item.href}
            {...item}
            className={items.length === 1 ? 'h-full' : ''}
          />
        ))}
      </div>
    </div>
  )
}
