import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PricingPageHeader } from '../PricingPageHeader'

const EMPTY_ITEMS: [] = []

describe('PricingPageHeader', () => {
  it('renders page title', () => {
    render(<PricingPageHeader items={EMPTY_ITEMS} isRefreshing={false} onRefresh={vi.fn()} />)
    // Text appears in both breadcrumb and heading
    const matches = screen.getAllByText('Рекомендации по ценам')
    expect(matches.length).toBeGreaterThanOrEqual(1)
  })

  it('renders breadcrumbs', () => {
    render(<PricingPageHeader items={EMPTY_ITEMS} isRefreshing={false} onRefresh={vi.fn()} />)
    expect(screen.getByText('Аналитика')).toBeInTheDocument()
  })

  it('renders subtitle description', () => {
    render(<PricingPageHeader items={EMPTY_ITEMS} isRefreshing={false} onRefresh={vi.fn()} />)
    expect(
      screen.getByText('Рекомендованные цены для достижения целевой маржинальности по каждому SKU')
    ).toBeInTheDocument()
  })

  it('renders refresh button in default state', () => {
    render(<PricingPageHeader items={EMPTY_ITEMS} isRefreshing={false} onRefresh={vi.fn()} />)
    expect(screen.getByText('Обновить')).toBeInTheDocument()
  })

  it('shows loading text when refreshing', () => {
    render(<PricingPageHeader items={EMPTY_ITEMS} isRefreshing={true} onRefresh={vi.fn()} />)
    expect(screen.getByText('Обновление...')).toBeInTheDocument()
  })

  it('disables refresh button while refreshing', () => {
    render(<PricingPageHeader items={EMPTY_ITEMS} isRefreshing={true} onRefresh={vi.fn()} />)
    const button = screen.getByText('Обновление...')
    expect(button.closest('button')).toBeDisabled()
  })

  it('calls onRefresh when button clicked', async () => {
    const user = userEvent.setup()
    const onRefresh = vi.fn()
    render(<PricingPageHeader items={EMPTY_ITEMS} isRefreshing={false} onRefresh={onRefresh} />)
    await user.click(screen.getByText('Обновить'))
    expect(onRefresh).toHaveBeenCalledOnce()
  })
})
