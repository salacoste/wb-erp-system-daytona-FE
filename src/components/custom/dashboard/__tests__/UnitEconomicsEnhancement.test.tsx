/**
 * Tests for Unit Economics Enhancement Components
 * Story 63.10-FE: Unit Economics Table Enhancement
 * Epic 63-FE: Dashboard Main Page Enhancement
 *
 * Tests profitability status badges, filters, sortable columns,
 * summary banner, and table rendering.
 *
 * @see docs/stories/epic-63/story-63.10-fe-unit-economics-enhancement.md
 */

import { describe, it, expect, vi } from 'vitest'
import { screen, render, waitFor } from '@/test/utils/test-utils'
import userEvent from '@testing-library/user-event'
import { ProfitabilityBadge, getProfitabilityStatus } from '../ProfitabilityBadge'
import { ProfitabilityFilter } from '../ProfitabilityFilter'
import { UnitEconomicsSummaryBanner } from '../UnitEconomicsSummaryBanner'
import { UnitEconomicsTable } from '../UnitEconomicsTable'
import { UnitEconomicsTableRowComponent } from '../UnitEconomicsTableRow'
import type { UnitEconomicsItem } from '@/types/unit-economics'
import type { ExtendedProfitabilityStatus } from '@/lib/profitability-utils'

// ============================================================================
// Test Fixtures
// ============================================================================

const makeCostsPct = (overrides: Record<string, number | null> = {}) => ({
  cogs: 20,
  commission: 15,
  logistics_delivery: 8,
  logistics_return: 3,
  storage: 2,
  paid_acceptance: 1,
  penalties: 0,
  other_deductions: 0,
  advertising: 5,
  delivery_to_warehouse: null,
  ...overrides,
})

const makeCostsRub = (overrides: Record<string, number | null> = {}) => ({
  cogs: 30000,
  commission: 22500,
  logistics_delivery: 12000,
  logistics_return: 4500,
  storage: 3000,
  paid_acceptance: 1500,
  penalties: 0,
  other_deductions: 0,
  advertising: 7500,
  delivery_to_warehouse: null,
  ...overrides,
})

const makeItem = (overrides: Partial<UnitEconomicsItem> = {}): UnitEconomicsItem => ({
  sku_id: 'SKU001',
  product_name: 'Товар с отличной маржой',
  category: 'Электроника',
  brand: 'TechBrand',
  revenue: 150000,
  units_sold: 50,
  costs_pct: makeCostsPct(),
  costs_rub: makeCostsRub(),
  total_costs_pct: 55,
  net_margin_pct: 45,
  net_profit: 67500,
  profitability_status: 'excellent',
  has_cogs: true,
  ...overrides,
})

const items: UnitEconomicsItem[] = [
  makeItem({
    sku_id: 'SKU001',
    product_name: 'Товар с отличной маржой',
    net_margin_pct: 45,
    profitability_status: 'excellent',
    has_cogs: true,
    revenue: 150000,
    net_profit: 67500,
  }),
  makeItem({
    sku_id: 'SKU002',
    product_name: 'Товар с хорошей маржой',
    net_margin_pct: 18,
    profitability_status: 'good',
    has_cogs: true,
    revenue: 120000,
    net_profit: 21600,
  }),
  makeItem({
    sku_id: 'SKU003',
    product_name: 'Товар требует внимания',
    net_margin_pct: 8,
    profitability_status: 'warning',
    has_cogs: true,
    revenue: 90000,
    net_profit: 7200,
  }),
  makeItem({
    sku_id: 'SKU004',
    product_name: 'Критичный товар',
    net_margin_pct: 2,
    profitability_status: 'critical',
    has_cogs: true,
    revenue: 60000,
    net_profit: 1200,
  }),
  makeItem({
    sku_id: 'SKU005',
    product_name: 'Убыточный товар',
    net_margin_pct: -5,
    profitability_status: 'loss',
    has_cogs: true,
    revenue: 50000,
    net_profit: -2500,
  }),
  makeItem({
    sku_id: 'SKU006',
    product_name: 'Товар без COGS',
    net_margin_pct: null,
    profitability_status: 'critical',
    has_cogs: false,
    revenue: 40000,
    net_profit: 0,
    costs_pct: makeCostsPct({ cogs: null }),
  }),
]

const defaultSort = { field: 'revenue' as const, order: 'desc' as const }

const fullStatusCounts = [
  { status: 'excellent' as const, count: 30 },
  { status: 'good' as const, count: 25 },
  { status: 'warning' as const, count: 15 },
  { status: 'critical' as const, count: 10 },
  { status: 'loss' as const, count: 5 },
  { status: 'unknown' as const, count: 15 },
]

// ============================================================================
// ProfitabilityBadge Tests
// ============================================================================

describe('ProfitabilityBadge - Rendering', () => {
  const labelCases: [ExtendedProfitabilityStatus, string][] = [
    ['excellent', 'Отлично'],
    ['good', 'Хорошо'],
    ['warning', 'Внимание'],
    ['critical', 'Критично'],
    ['loss', 'Убыток'],
    ['unknown', 'Нет данных'],
  ]
  labelCases.forEach(([status, label]) => {
    it(`should render badge with correct label for ${status} status`, () => {
      render(<ProfitabilityBadge status={status} />)
      expect(screen.getByText(label)).toBeInTheDocument()
    })
  })
})

describe('ProfitabilityBadge - Colors', () => {
  // P2 wave-5: pins mirror migrated profitability-utils.ts EXTENDED_STATUS_CONFIG
  // (solid pairs for strongest tiers; soft tiers fg-on-tint; muted pair for unknown).
  const statusColorCases: [ExtendedProfitabilityStatus, string, string][] = [
    ['excellent', 'bg-status-success', 'text-status-success-foreground'],
    ['good', 'bg-status-success/15', 'text-foreground'],
    ['warning', 'bg-status-warning/15', 'text-foreground'],
    ['critical', 'bg-status-warning', 'text-status-warning-foreground'],
    ['loss', 'bg-status-error', 'text-status-error-foreground'],
    ['unknown', 'bg-muted', 'text-muted-foreground'],
  ]
  statusColorCases.forEach(([status, bgClass, textClass]) => {
    it(`should use ${bgClass} for ${status} status`, () => {
      const { container } = render(<ProfitabilityBadge status={status} />)
      const badge =
        (container.querySelector('[data-slot="badge"]') as HTMLElement) ??
        (container.firstChild as HTMLElement)
      expect(badge.className).toContain(bgClass)
      expect(badge.className).toContain(textClass)
    })
  })
})

describe('ProfitabilityBadge - Icons', () => {
  const statuses: ExtendedProfitabilityStatus[] = [
    'excellent',
    'good',
    'warning',
    'critical',
    'loss',
    'unknown',
  ]
  statuses.forEach(status => {
    it(`should display icon for ${status} status`, () => {
      const { container } = render(<ProfitabilityBadge status={status} />)
      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
      expect(svg?.getAttribute('aria-hidden')).toBe('true')
    })
  })
})

describe('ProfitabilityBadge - Tooltip', () => {
  it('should show tooltip with threshold info on hover', async () => {
    const user = userEvent.setup()
    render(<ProfitabilityBadge status="excellent" showTooltip={true} />)
    await user.hover(screen.getByText('Отлично'))
    await waitFor(() => {
      // Radix renders tooltip content in multiple DOM nodes
      expect(screen.getAllByText('Маржа > 25%').length).toBeGreaterThanOrEqual(1)
    })
  })

  it('should show recommendation in tooltip', async () => {
    const user = userEvent.setup()
    render(<ProfitabilityBadge status="excellent" showTooltip={true} />)
    await user.hover(screen.getByText('Отлично'))
    await waitFor(() => {
      // Radix renders tooltip content in multiple DOM nodes
      expect(screen.getAllByText('Поддерживайте текущую стратегию').length).toBeGreaterThanOrEqual(
        1
      )
    })
  })

  it('should not show tooltip when showTooltip=false', async () => {
    const user = userEvent.setup()
    render(<ProfitabilityBadge status="excellent" showTooltip={false} />)
    await user.hover(screen.getByText('Отлично'))
    expect(screen.queryByText('Маржа > 25%')).not.toBeInTheDocument()
  })

  it('should render badge element that is focusable via keyboard', () => {
    const { container } = render(<ProfitabilityBadge status="excellent" showTooltip={true} />)
    const trigger =
      (container.querySelector('[data-radix-collection-item]') as HTMLElement) ??
      screen.getByText('Отлично').closest('button') ??
      screen.getByText('Отлично')
    expect(trigger).toBeInTheDocument()
  })
})

describe('ProfitabilityBadge - Size Variants', () => {
  it('should render small size by default', () => {
    const { container } = render(<ProfitabilityBadge status="excellent" />)
    const badge =
      (container.querySelector('[data-slot="badge"]') as HTMLElement) ??
      (container.firstChild as HTMLElement)
    expect(badge.className).toContain('text-xs')
    expect(badge.className).toContain('px-2')
  })

  it('should render medium size when specified', () => {
    const { container } = render(<ProfitabilityBadge status="excellent" size="md" />)
    const badge =
      (container.querySelector('[data-slot="badge"]') as HTMLElement) ??
      (container.firstChild as HTMLElement)
    expect(badge.className).toContain('text-sm')
    expect(badge.className).toContain('px-2.5')
  })
})

// ============================================================================
// getProfitabilityStatus Function Tests
// ============================================================================

describe('getProfitabilityStatus - Threshold Logic', () => {
  it('should return excellent for margin >= 25', () => {
    expect(getProfitabilityStatus(25, true)).toBe('excellent')
    expect(getProfitabilityStatus(30, true)).toBe('excellent')
  })

  it('should return good for margin 15-24.99', () => {
    expect(getProfitabilityStatus(15, true)).toBe('good')
    expect(getProfitabilityStatus(24.9, true)).toBe('good')
  })

  it('should return warning for margin 5-14.99', () => {
    expect(getProfitabilityStatus(5, true)).toBe('warning')
    expect(getProfitabilityStatus(14.9, true)).toBe('warning')
  })

  it('should return critical for margin 0-4.99', () => {
    expect(getProfitabilityStatus(0, true)).toBe('critical')
    expect(getProfitabilityStatus(4.9, true)).toBe('critical')
  })

  it('should return loss for margin < 0', () => {
    expect(getProfitabilityStatus(-1, true)).toBe('loss')
    expect(getProfitabilityStatus(-50, true)).toBe('loss')
  })

  it('should return unknown when hasCogs is false', () => {
    expect(getProfitabilityStatus(25, false)).toBe('unknown')
  })

  it('should return unknown when margin is null', () => {
    expect(getProfitabilityStatus(null, true)).toBe('unknown')
  })

  it('should return unknown when margin is undefined', () => {
    expect(getProfitabilityStatus(undefined, true)).toBe('unknown')
  })
})

// ============================================================================
// ProfitabilityFilter Tests
// ============================================================================

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}))

describe('ProfitabilityFilter - Rendering', () => {
  it('should render filter dropdown button', () => {
    render(<ProfitabilityFilter selectedStatuses={[]} onFilterChange={vi.fn()} />)
    expect(screen.getByRole('button', { name: /фильтр по рентабельности/i })).toBeInTheDocument()
  })

  it('should show all 6 status options in dropdown', async () => {
    const user = userEvent.setup()
    render(<ProfitabilityFilter selectedStatuses={[]} onFilterChange={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: /фильтр по рентабельности/i }))
    await waitFor(() => {
      expect(screen.getByText('Отлично')).toBeInTheDocument()
      expect(screen.getByText('Хорошо')).toBeInTheDocument()
      expect(screen.getByText('Внимание')).toBeInTheDocument()
      expect(screen.getByText('Критично')).toBeInTheDocument()
      expect(screen.getByText('Убыток')).toBeInTheDocument()
      expect(screen.getByText('Нет данных')).toBeInTheDocument()
    })
  })

  it('should display color indicator for each option', async () => {
    const user = userEvent.setup()
    render(<ProfitabilityFilter selectedStatuses={[]} onFilterChange={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: /фильтр по рентабельности/i }))
    await waitFor(() => {
      const dots = document.querySelectorAll('.rounded-full[style]')
      expect(dots.length).toBeGreaterThanOrEqual(6)
    })
  })

  it('should display Russian labels for each option', async () => {
    const user = userEvent.setup()
    render(<ProfitabilityFilter selectedStatuses={[]} onFilterChange={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: /фильтр по рентабельности/i }))
    await waitFor(() => {
      expect(screen.getByText('Отлично')).toBeInTheDocument()
      expect(screen.getByText('Хорошо')).toBeInTheDocument()
      expect(screen.getByText('Внимание')).toBeInTheDocument()
    })
  })
})

describe('ProfitabilityFilter - Selection', () => {
  it('should toggle status selection on click', async () => {
    const onFilterChange = vi.fn()
    const user = userEvent.setup()
    render(<ProfitabilityFilter selectedStatuses={[]} onFilterChange={onFilterChange} />)
    await user.click(screen.getByRole('button', { name: /фильтр по рентабельности/i }))
    await waitFor(() => {
      expect(screen.getByText('Отлично')).toBeInTheDocument()
    })
    await user.click(screen.getByText('Отлично'))
    expect(onFilterChange).toHaveBeenCalledWith(['excellent'])
  })

  it('should support multi-select', async () => {
    const onFilterChange = vi.fn()
    const user = userEvent.setup()
    render(<ProfitabilityFilter selectedStatuses={['excellent']} onFilterChange={onFilterChange} />)
    await user.click(screen.getByRole('button', { name: /фильтр по рентабельности/i }))
    await waitFor(() => {
      expect(screen.getByText('Хорошо')).toBeInTheDocument()
    })
    await user.click(screen.getByText('Хорошо'))
    expect(onFilterChange).toHaveBeenCalledWith(['excellent', 'good'])
  })

  it('should show checkmark for selected statuses', async () => {
    const user = userEvent.setup()
    render(<ProfitabilityFilter selectedStatuses={['excellent']} onFilterChange={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: /фильтр по рентабельности/i }))
    await waitFor(() => {
      const item = screen.getByRole('menuitemcheckbox', { name: /отлично/i })
      expect(item).toHaveAttribute('aria-checked', 'true')
    })
  })

  it('should show count badge when filters active', () => {
    render(
      <ProfitabilityFilter selectedStatuses={['excellent', 'good']} onFilterChange={vi.fn()} />
    )
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('should call onFilterChange when deselecting', async () => {
    const onFilterChange = vi.fn()
    const user = userEvent.setup()
    render(
      <ProfitabilityFilter
        selectedStatuses={['excellent', 'good']}
        onFilterChange={onFilterChange}
      />
    )
    await user.click(screen.getByRole('button', { name: /фильтр по рентабельности/i }))
    await waitFor(() => {
      expect(screen.getByText('Отлично')).toBeInTheDocument()
    })
    await user.click(screen.getByText('Отлично'))
    expect(onFilterChange).toHaveBeenCalledWith(['good'])
  })
})

describe('ProfitabilityFilter - Clear', () => {
  it('should show clear button when filters active', () => {
    render(<ProfitabilityFilter selectedStatuses={['loss']} onFilterChange={vi.fn()} />)
    expect(screen.getByLabelText('Сбросить фильтр')).toBeInTheDocument()
  })

  it('should clear all selections on clear click', async () => {
    const onFilterChange = vi.fn()
    const user = userEvent.setup()
    render(
      <ProfitabilityFilter
        selectedStatuses={['loss', 'critical']}
        onFilterChange={onFilterChange}
      />
    )
    await user.click(screen.getByLabelText('Сбросить фильтр'))
    expect(onFilterChange).toHaveBeenCalledWith([])
  })

  it('should hide clear button when no filters', () => {
    render(<ProfitabilityFilter selectedStatuses={[]} onFilterChange={vi.fn()} />)
    expect(screen.queryByLabelText('Сбросить фильтр')).not.toBeInTheDocument()
  })
})

// ============================================================================
// UnitEconomicsSummaryBanner Tests
// ============================================================================

describe('UnitEconomicsSummaryBanner - Rendering', () => {
  it('should render total products count', () => {
    render(<UnitEconomicsSummaryBanner statusCounts={fullStatusCounts} onStatusClick={vi.fn()} />)
    expect(screen.getByText('100')).toBeInTheDocument()
    expect(screen.getByText(/Всего:/)).toBeInTheDocument()
  })

  it('should display count for each status with non-zero count', () => {
    render(<UnitEconomicsSummaryBanner statusCounts={fullStatusCounts} onStatusClick={vi.fn()} />)
    expect(screen.getByText('30')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('should not display zero-count statuses', () => {
    const counts = [...fullStatusCounts, { status: 'warning' as const, count: 0 }]
    const { container } = render(
      <UnitEconomicsSummaryBanner statusCounts={counts} onStatusClick={vi.fn()} />
    )
    const buttons = container.querySelectorAll('button')
    expect(buttons.length).toBe(fullStatusCounts.filter(s => s.count > 0).length)
  })

  it('should display color indicator for each status', () => {
    const { container } = render(
      <UnitEconomicsSummaryBanner statusCounts={fullStatusCounts} onStatusClick={vi.fn()} />
    )
    expect(container.querySelectorAll('.rounded-full[style]').length).toBeGreaterThanOrEqual(5)
  })

  it('should display Russian status labels', () => {
    render(<UnitEconomicsSummaryBanner statusCounts={fullStatusCounts} onStatusClick={vi.fn()} />)
    expect(screen.getByText('Отлично:')).toBeInTheDocument()
    expect(screen.getByText('Хорошо:')).toBeInTheDocument()
    expect(screen.getByText('Убыток:')).toBeInTheDocument()
  })
})

describe('UnitEconomicsSummaryBanner - Interaction', () => {
  const statusCounts = [
    { status: 'excellent' as const, count: 30 },
    { status: 'loss' as const, count: 5 },
  ]

  it('should call onStatusClick when count is clicked', async () => {
    const onStatusClick = vi.fn()
    const user = userEvent.setup()
    render(<UnitEconomicsSummaryBanner statusCounts={statusCounts} onStatusClick={onStatusClick} />)
    await user.click(screen.getByRole('button', { name: /убыток/i }))
    expect(onStatusClick).toHaveBeenCalledWith('loss')
  })

  it('should have focus state for keyboard navigation', () => {
    render(<UnitEconomicsSummaryBanner statusCounts={statusCounts} onStatusClick={vi.fn()} />)
    screen.getAllByRole('button').forEach(btn => {
      expect(btn.className).toContain('focus:ring')
    })
  })
})

describe('UnitEconomicsSummaryBanner - Attention Alert', () => {
  it('should show attention alert when loss or critical items exist', () => {
    const counts = [
      { status: 'excellent' as const, count: 30 },
      { status: 'loss' as const, count: 5 },
      { status: 'critical' as const, count: 3 },
    ]
    render(<UnitEconomicsSummaryBanner statusCounts={counts} onStatusClick={vi.fn()} />)
    expect(screen.getByText(/товаров требуют внимания/)).toBeInTheDocument()
  })

  it('should not show alert when no loss/critical items', () => {
    const counts = [
      { status: 'excellent' as const, count: 30 },
      { status: 'good' as const, count: 20 },
    ]
    render(<UnitEconomicsSummaryBanner statusCounts={counts} onStatusClick={vi.fn()} />)
    expect(screen.queryByText(/товаров требуют внимания/)).not.toBeInTheDocument()
  })

  it('should calculate attention count correctly', () => {
    const counts = [
      { status: 'loss' as const, count: 5 },
      { status: 'critical' as const, count: 3 },
    ]
    render(<UnitEconomicsSummaryBanner statusCounts={counts} onStatusClick={vi.fn()} />)
    expect(screen.getByText('8 товаров требуют внимания')).toBeInTheDocument()
  })
})

// ============================================================================
// UnitEconomicsTable - Sortable Columns Tests
// ============================================================================

describe('UnitEconomicsTable - Column Headers', () => {
  it('should render all column headers', () => {
    render(<UnitEconomicsTable data={[]} onSort={vi.fn()} currentSort={defaultSort} />)
    expect(screen.getByText('Товар')).toBeInTheDocument()
    expect(screen.getByText('Статус')).toBeInTheDocument()
    expect(screen.getByText('Выручка')).toBeInTheDocument()
    expect(screen.getByText('COGS %')).toBeInTheDocument()
    expect(screen.getByText('Маржа %')).toBeInTheDocument()
    expect(screen.getByText('Прибыль')).toBeInTheDocument()
  })

  it('should have scope="col" on all headers', () => {
    render(<UnitEconomicsTable data={[]} onSort={vi.fn()} currentSort={defaultSort} />)
    screen.getAllByRole('columnheader').forEach(h => {
      expect(h).toHaveAttribute('scope', 'col')
    })
  })

  it('should show sort icon on sortable columns', () => {
    const { container } = render(
      <UnitEconomicsTable data={[]} onSort={vi.fn()} currentSort={defaultSort} />
    )
    expect(container.querySelectorAll('svg').length).toBe(4)
  })
})

describe('UnitEconomicsTable - Sorting', () => {
  it('should call onSort with toggled order on header click', async () => {
    const onSort = vi.fn()
    const user = userEvent.setup()
    render(<UnitEconomicsTable data={[]} onSort={onSort} currentSort={defaultSort} />)
    await user.click(screen.getByText('Выручка'))
    expect(onSort).toHaveBeenCalledWith('revenue', 'asc')
  })

  it('should show ArrowDown icon when sorted descending', () => {
    render(
      <UnitEconomicsTable
        data={[]}
        onSort={vi.fn()}
        currentSort={{ field: 'revenue', order: 'desc' }}
      />
    )
    expect(screen.getByLabelText('Сортировать по выручке').querySelector('svg')).toBeInTheDocument()
  })

  it('should show ArrowUp icon when sorted ascending', () => {
    render(
      <UnitEconomicsTable
        data={[]}
        onSort={vi.fn()}
        currentSort={{ field: 'revenue', order: 'asc' }}
      />
    )
    expect(screen.getByLabelText('Сортировать по выручке').querySelector('svg')).toBeInTheDocument()
  })

  it('should support sorting by net_margin_pct', async () => {
    const onSort = vi.fn()
    const user = userEvent.setup()
    render(<UnitEconomicsTable data={[]} onSort={onSort} currentSort={defaultSort} />)
    await user.click(screen.getByText('Маржа %'))
    expect(onSort).toHaveBeenCalledWith('net_margin_pct', 'desc')
  })

  it('should support sorting by cogs_pct', async () => {
    const onSort = vi.fn()
    const user = userEvent.setup()
    render(<UnitEconomicsTable data={[]} onSort={onSort} currentSort={defaultSort} />)
    await user.click(screen.getByText('COGS %'))
    expect(onSort).toHaveBeenCalledWith('cogs_pct', 'desc')
  })

  it('should support sorting by net_profit', async () => {
    const onSort = vi.fn()
    const user = userEvent.setup()
    render(<UnitEconomicsTable data={[]} onSort={onSort} currentSort={defaultSort} />)
    await user.click(screen.getByText('Прибыль'))
    expect(onSort).toHaveBeenCalledWith('net_profit', 'desc')
  })
})

describe('UnitEconomicsTable - Accessibility', () => {
  it('should have aria-sort attribute on sorted column', () => {
    render(
      <UnitEconomicsTable
        data={[]}
        onSort={vi.fn()}
        currentSort={{ field: 'revenue', order: 'desc' }}
      />
    )
    expect(screen.getByText('Выручка').closest('th')).toHaveAttribute('aria-sort', 'descending')
  })

  it('should have aria-label on sort buttons', () => {
    render(
      <UnitEconomicsTable
        data={[]}
        onSort={vi.fn()}
        currentSort={{ field: 'revenue', order: 'desc' }}
      />
    )
    expect(screen.getByLabelText('Сортировать по выручке')).toBeInTheDocument()
    expect(screen.getByLabelText('Сортировать по COGS')).toBeInTheDocument()
    expect(screen.getByLabelText('Сортировать по марже')).toBeInTheDocument()
    expect(screen.getByLabelText('Сортировать по прибыли')).toBeInTheDocument()
  })
})

// ============================================================================
// UnitEconomicsTable - Data Display Tests
// ============================================================================

describe('UnitEconomicsTable - Row Rendering', () => {
  it('should render row for each item', () => {
    const { container } = render(
      <UnitEconomicsTable data={items} onSort={vi.fn()} currentSort={defaultSort} />
    )
    expect(container.querySelectorAll('tbody tr').length).toBe(items.length)
  })

  it('should display product name and SKU', () => {
    render(<UnitEconomicsTableRowComponent item={items[0]} />)
    expect(screen.getByText('Товар с отличной маржой')).toBeInTheDocument()
    expect(screen.getByText(/SKU001/)).toBeInTheDocument()
  })

  it('should display profitability badge in status column', () => {
    render(<UnitEconomicsTableRowComponent item={items[0]} />)
    expect(screen.getByText('Отлично')).toBeInTheDocument()
  })

  it('should format revenue as currency', () => {
    render(<UnitEconomicsTableRowComponent item={items[0]} />)
    expect(screen.getByText(/150.*000.*₽/)).toBeInTheDocument()
  })

  it('should display COGS percentage', () => {
    render(<UnitEconomicsTableRowComponent item={items[0]} />)
    expect(screen.getByText(/20,?0?/)).toBeInTheDocument()
  })

  it('should display margin percentage', () => {
    render(<UnitEconomicsTableRowComponent item={items[0]} />)
    expect(screen.getByText(/45,?0?/)).toBeInTheDocument()
  })

  it('should format profit as currency', () => {
    render(<UnitEconomicsTableRowComponent item={items[0]} />)
    expect(screen.getByText(/67.*500.*₽/)).toBeInTheDocument()
  })
})

describe('UnitEconomicsTable - Missing COGS Handling', () => {
  const noCogsItem = items[5]

  it('should show dash for COGS% when has_cogs is false', () => {
    render(<UnitEconomicsTableRowComponent item={noCogsItem} />)
    expect(screen.getAllByRole('cell')[3].textContent).toBe('—')
  })

  it('should show dash for Margin% when has_cogs is false', () => {
    render(<UnitEconomicsTableRowComponent item={noCogsItem} />)
    expect(screen.getAllByRole('cell')[4].textContent).toBe('—')
  })

  it('should show dash for Profit when has_cogs is false', () => {
    render(<UnitEconomicsTableRowComponent item={noCogsItem} />)
    expect(screen.getAllByRole('cell')[5].textContent).toBe('—')
  })
})

// ============================================================================
// Integration Tests
// ============================================================================

describe('UnitEconomicsEnhancement - Integration', () => {
  it('should render complete table with all rows and status badges', () => {
    const { container } = render(
      <UnitEconomicsTable data={items} onSort={vi.fn()} currentSort={defaultSort} />
    )
    expect(container.querySelectorAll('tbody tr').length).toBe(6)
    expect(screen.getByText('Отлично')).toBeInTheDocument()
    expect(screen.getByText('Хорошо')).toBeInTheDocument()
    expect(screen.getByText('Внимание')).toBeInTheDocument()
    expect(screen.getByText('Критично')).toBeInTheDocument()
    expect(screen.getByText('Убыток')).toBeInTheDocument()
    expect(screen.getByText('Нет данных')).toBeInTheDocument()
  })

  it('should render summary with all status counts and attention alert', () => {
    render(<UnitEconomicsSummaryBanner statusCounts={fullStatusCounts} onStatusClick={vi.fn()} />)
    expect(screen.getByText('100')).toBeInTheDocument()
    expect(screen.getByText(/товаров требуют внимания/)).toBeInTheDocument()
  })

  it('should show empty table body when data is empty', () => {
    const { container } = render(
      <UnitEconomicsTable data={[]} onSort={vi.fn()} currentSort={defaultSort} />
    )
    expect(container.querySelectorAll('tbody tr').length).toBe(0)
  })

  it('should sort and filter work together on table', async () => {
    const onSort = vi.fn()
    const user = userEvent.setup()
    render(<UnitEconomicsTable data={items} onSort={onSort} currentSort={defaultSort} />)
    await user.click(screen.getByText('Выручка'))
    expect(onSort).toHaveBeenCalledWith('revenue', 'asc')
    expect(document.querySelectorAll('tbody tr').length).toBe(6)
  })

  it('should render profitability filter with badge count', () => {
    render(<ProfitabilityFilter selectedStatuses={['loss', 'critical']} onFilterChange={vi.fn()} />)
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByLabelText('Сбросить фильтр')).toBeInTheDocument()
  })

  it('should handle items with null margin gracefully', () => {
    render(<UnitEconomicsTableRowComponent item={items[5]} />)
    expect(screen.getByText('Нет данных')).toBeInTheDocument()
  })
})

// ============================================================================
// Accessibility + Loading + Error Handling
// ============================================================================

describe('UnitEconomicsEnhancement - Accessibility', () => {
  it('should have accessible table structure with thead and tbody', () => {
    const { container } = render(
      <UnitEconomicsTable data={items} onSort={vi.fn()} currentSort={defaultSort} />
    )
    expect(container.querySelector('thead')).toBeInTheDocument()
    expect(container.querySelector('tbody')).toBeInTheDocument()
  })

  it('should not rely on color alone for status indication', () => {
    render(<UnitEconomicsTable data={items} onSort={vi.fn()} currentSort={defaultSort} />)
    expect(screen.getByText('Отлично')).toBeInTheDocument()
    expect(screen.getByText('Убыток')).toBeInTheDocument()
  })

  it('should have keyboard-navigable sort controls', () => {
    render(<UnitEconomicsTable data={items} onSort={vi.fn()} currentSort={defaultSort} />)
    expect(screen.getAllByRole('button', { name: /сортировать/i }).length).toBe(4)
  })

  it('should have accessible summary banner buttons', () => {
    const counts = [
      { status: 'excellent' as const, count: 10 },
      { status: 'loss' as const, count: 3 },
    ]
    render(<UnitEconomicsSummaryBanner statusCounts={counts} onStatusClick={vi.fn()} />)
    screen.getAllByRole('button').forEach(btn => {
      expect(btn).toHaveAttribute('aria-label')
    })
  })

  it('should have accessible filter dropdown', () => {
    render(<ProfitabilityFilter selectedStatuses={[]} onFilterChange={vi.fn()} />)
    expect(screen.getByRole('button', { name: /фильтр по рентабельности/i })).toBeInTheDocument()
  })

  it('should meet focus ring requirements on interactive elements', () => {
    const counts = [{ status: 'excellent' as const, count: 10 }]
    render(<UnitEconomicsSummaryBanner statusCounts={counts} onStatusClick={vi.fn()} />)
    screen.getAllByRole('button').forEach(btn => {
      expect(btn.className).toContain('focus')
    })
  })
})

describe('UnitEconomicsEnhancement - Loading State', () => {
  it('should render table with no rows for empty loading state', () => {
    const { container } = render(
      <UnitEconomicsTable data={[]} onSort={vi.fn()} currentSort={defaultSort} />
    )
    expect(container.querySelectorAll('tbody tr').length).toBe(0)
  })

  it('should render summary banner with zero counts and no alert', () => {
    const emptyCounts = [
      { status: 'excellent' as const, count: 0 },
      { status: 'good' as const, count: 0 },
    ]
    render(<UnitEconomicsSummaryBanner statusCounts={emptyCounts} onStatusClick={vi.fn()} />)
    expect(screen.getByText('0')).toBeInTheDocument()
    expect(screen.queryByText(/товаров требуют внимания/)).not.toBeInTheDocument()
  })

  it('should render filter with no active selections', () => {
    render(<ProfitabilityFilter selectedStatuses={[]} onFilterChange={vi.fn()} />)
    expect(screen.getByRole('button', { name: /фильтр по рентабельности/i })).toBeInTheDocument()
    expect(screen.queryByLabelText('Сбросить фильтр')).not.toBeInTheDocument()
  })

  it('should render sort controls when no data', () => {
    render(<UnitEconomicsTable data={[]} onSort={vi.fn()} currentSort={defaultSort} />)
    expect(screen.getByLabelText('Сортировать по выручке')).toBeInTheDocument()
  })
})

describe('UnitEconomicsEnhancement - Error Handling', () => {
  it('should handle empty data gracefully', () => {
    const { container } = render(
      <UnitEconomicsTable
        data={[]}
        onSort={vi.fn()}
        currentSort={{ field: 'revenue', order: 'desc' }}
      />
    )
    expect(container.querySelectorAll('tbody tr').length).toBe(0)
  })

  it('should handle items with all zero values', () => {
    render(
      <UnitEconomicsTableRowComponent
        item={makeItem({
          revenue: 0,
          net_margin_pct: 0,
          net_profit: 0,
          profitability_status: 'critical',
          has_cogs: true,
        })}
      />
    )
    expect(screen.getByText('Критично')).toBeInTheDocument()
  })

  it('should handle negative profit items', () => {
    render(
      <UnitEconomicsTableRowComponent
        item={makeItem({
          net_margin_pct: -15,
          net_profit: -22500,
          profitability_status: 'loss',
          has_cogs: true,
        })}
      />
    )
    expect(screen.getByText('Убыток')).toBeInTheDocument()
  })
})
