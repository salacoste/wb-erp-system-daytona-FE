/**
 * Shared test helpers for Epic 65 Wave 4 UX tests
 * Provides reusable render functions, mock factories, and a11y assertions
 *
 * @see docs/epics/epic-65-dashboard-metrics-parity/stories-wave-4-ux.md
 */

import React from 'react'
import type { TrendDirection } from '@/lib/comparison-helpers'

// ---------------------------------------------------------------------------
// BaseMetricCard prop types (mirrored from future component for test authoring)
// ---------------------------------------------------------------------------

export interface BaseMetricCardProps {
  // Identity
  title: string
  tooltip: string
  icon: React.ComponentType<{ className?: string }>
  accentColor: string

  // Value
  value: number | null | undefined
  previousValue?: number | null | undefined
  format: 'currency' | 'percent' | 'number' | 'days'
  inverted?: boolean

  // Dual value (Story 65.16)
  secondaryValue?: string

  // Variant
  variant?: 'standard' | 'highlighted'
  valueColor?: string

  // Sentiment background (Story 65.15)
  sentimentBg?: boolean

  // Slots
  badge?: React.ReactNode
  actions?: React.ReactNode
  subtitle?: React.ReactNode
  breakdownCount?: number
  onBreakdownClick?: () => void

  // States
  isLoading?: boolean
  error?: Error | null
  onRetry?: () => void

  // Styling
  className?: string
  'data-testid'?: string
}

// ---------------------------------------------------------------------------
// SectionHeader prop types (mirrored from future component)
// ---------------------------------------------------------------------------

export interface SectionHeaderProps {
  title: string
  collapsed?: boolean
  onToggle?: () => void
  className?: string
}

// ---------------------------------------------------------------------------
// SubcategoryTooltip prop types (mirrored from future component)
// ---------------------------------------------------------------------------

export interface SubcategoryItem {
  label: string
  value: number
}

export interface SubcategoryTooltipProps {
  subcategories: SubcategoryItem[]
  parentTotal: number
  formatValue?: (value: number) => string
}

// ---------------------------------------------------------------------------
// Mock Factories
// ---------------------------------------------------------------------------

/** Stub icon component for tests — spreads extra props like aria-hidden */
export function MockIcon({ className, ...rest }: { className?: string; [key: string]: unknown }) {
  return <span data-testid="mock-icon" className={className} {...rest} />
}

/** Create default BaseMetricCard props with sensible values */
export function createBaseMetricCardProps(
  overrides: Partial<BaseMetricCardProps> = {}
): BaseMetricCardProps {
  return {
    title: 'Тестовая метрика',
    tooltip: 'Описание тестовой метрики',
    icon: MockIcon,
    accentColor: 'text-blue-500',
    value: 12345,
    format: 'currency',
    ...overrides,
  }
}

/** Create props for standard variant (default) */
export function createStandardCardProps(
  overrides: Partial<BaseMetricCardProps> = {}
): BaseMetricCardProps {
  return createBaseMetricCardProps({
    variant: 'standard',
    ...overrides,
  })
}

/** Create props for highlighted variant */
export function createHighlightedCardProps(
  overrides: Partial<BaseMetricCardProps> = {}
): BaseMetricCardProps {
  return createBaseMetricCardProps({
    variant: 'highlighted',
    value: 40794,
    valueColor: 'text-green-600',
    ...overrides,
  })
}

/** Create props with comparison data */
export function createComparisonProps(
  direction: TrendDirection,
  overrides: Partial<BaseMetricCardProps> = {}
): BaseMetricCardProps {
  const valueMap: Record<TrendDirection, { value: number; previousValue: number }> = {
    positive: { value: 110, previousValue: 100 },
    negative: { value: 90, previousValue: 100 },
    neutral: { value: 100, previousValue: 100 },
  }

  return createBaseMetricCardProps({
    ...valueMap[direction],
    ...overrides,
  })
}

/** Create props for inverted metric (expense: lower=better) */
export function createInvertedMetricProps(
  overrides: Partial<BaseMetricCardProps> = {}
): BaseMetricCardProps {
  return createBaseMetricCardProps({
    title: 'Расходы на логистику',
    inverted: true,
    value: 5000,
    previousValue: 6000,
    ...overrides,
  })
}

/** Create subcategory data for tooltip tests */
export function createSubcategories(count = 3): SubcategoryItem[] {
  const items: SubcategoryItem[] = [
    { label: 'Комиссия за продажу', value: 15000 },
    { label: 'Эквайринг', value: 3200 },
    { label: 'Программа лояльности', value: 1800 },
    { label: 'Штрафы', value: 500 },
    { label: 'Услуги WB', value: 250 },
  ]
  return items.slice(0, count)
}

// ---------------------------------------------------------------------------
// Viewport Helpers
// ---------------------------------------------------------------------------

/**
 * Set window.innerWidth for responsive breakpoint tests.
 * Call in beforeEach/afterEach or within test body.
 * NOTE: In jsdom, CSS media queries are not evaluated. These helpers
 * help verify that correct CSS classes are applied based on responsive design.
 */
export function setViewportWidth(width: number): void {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  })
  window.dispatchEvent(new Event('resize'))
}

/** Mobile viewport (< 768px) */
export const MOBILE_WIDTH = 375
/** Tablet viewport (768-1279px) */
export const TABLET_WIDTH = 768
/** Desktop viewport (>= 1280px) */
export const DESKTOP_WIDTH = 1280

// ---------------------------------------------------------------------------
// Accessibility Assertion Helpers
// ---------------------------------------------------------------------------

/**
 * Assert common accessibility requirements on a card element
 */
export function expectAccessibleCard(element: HTMLElement): void {
  // Must have article role or equivalent landmark
  expect(element.getAttribute('role')).toBe('article')
  // Must have aria-label
  expect(element).toHaveAttribute('aria-label')
  // aria-label must not be empty
  expect(element.getAttribute('aria-label')?.length).toBeGreaterThan(0)
}

/**
 * Assert skeleton loading state accessibility
 */
export function expectAccessibleSkeleton(container: HTMLElement): void {
  const skeleton = container.querySelector('[aria-busy="true"]')
  expect(skeleton).toBeInTheDocument()
  // Per AC-65.19.8: skeleton should NOT have aria-hidden="true" simultaneously
  if (skeleton) {
    expect(skeleton).not.toHaveAttribute('aria-hidden', 'true')
  }
}

/**
 * Assert that a collapsible section has correct ARIA attributes
 */
export function expectAccessibleCollapsible(trigger: HTMLElement, expanded: boolean): void {
  expect(trigger).toHaveAttribute('aria-expanded', String(expanded))
  expect(trigger).toHaveAttribute('aria-controls')
  const controlsId = trigger.getAttribute('aria-controls')
  expect(controlsId).toBeTruthy()
}

// ---------------------------------------------------------------------------
// localStorage Mock Helpers
// ---------------------------------------------------------------------------

/** Create a mock localStorage for settings persistence tests */
export function createMockLocalStorage(): {
  store: Record<string, string>
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
  removeItem: (key: string) => void
  clear: () => void
} {
  const store: Record<string, string> = {}
  return {
    store,
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      Object.keys(store).forEach(key => delete store[key])
    },
  }
}
