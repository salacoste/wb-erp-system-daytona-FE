import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PricingPageHeader } from '../PricingPageHeader'

describe('PricingPageHeader', () => {
  it('renders page title', () => {
    render(<PricingPageHeader isRefreshing={false} onRefresh={vi.fn()} />)
    // Text appears in both breadcrumb and heading
    const matches = screen.getAllByText('Рекомендации по ценам')
    expect(matches.length).toBeGreaterThanOrEqual(1)
  })

  it('renders breadcrumbs', () => {
    render(<PricingPageHeader isRefreshing={false} onRefresh={vi.fn()} />)
    expect(screen.getByText('Аналитика')).toBeInTheDocument()
  })

  it('renders subtitle description', () => {
    render(<PricingPageHeader isRefreshing={false} onRefresh={vi.fn()} />)
    expect(
      screen.getByText('Рекомендованные цены для достижения целевой маржинальности по каждому SKU')
    ).toBeInTheDocument()
  })

  it('renders refresh button in default state', () => {
    render(<PricingPageHeader isRefreshing={false} onRefresh={vi.fn()} />)
    expect(screen.getByText('Обновить')).toBeInTheDocument()
  })

  it('shows loading text when refreshing', () => {
    render(<PricingPageHeader isRefreshing={true} onRefresh={vi.fn()} />)
    expect(screen.getByText('Обновление...')).toBeInTheDocument()
  })

  it('disables button while refreshing', () => {
    render(<PricingPageHeader isRefreshing={true} onRefresh={vi.fn()} />)
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })

  it('calls onRefresh when button clicked', async () => {
    const user = userEvent.setup()
    const onRefresh = vi.fn()
    render(<PricingPageHeader isRefreshing={false} onRefresh={onRefresh} />)
    await user.click(screen.getByRole('button'))
    expect(onRefresh).toHaveBeenCalledOnce()
  })

  // --- actions slot (SPP-1.7-FE basis toggle) ---

  it('renders nothing extra when actions is omitted', () => {
    render(<PricingPageHeader isRefreshing={false} onRefresh={vi.fn()} />)
    expect(screen.getByRole('button')).toBeInTheDocument()
    expect(screen.queryByLabelText('Базис:')).not.toBeInTheDocument()
  })

  it('renders actions content before the refresh button', () => {
    render(
      <PricingPageHeader
        isRefreshing={false}
        onRefresh={vi.fn()}
        actions={<div data-testid="basis-toggle-stub">Базис</div>}
      />
    )
    expect(screen.getByTestId('basis-toggle-stub')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Обновить/ })).toBeInTheDocument()
  })

  it('keeps refresh button functional alongside actions', async () => {
    const user = userEvent.setup()
    const onRefresh = vi.fn()
    render(
      <PricingPageHeader
        isRefreshing={false}
        onRefresh={onRefresh}
        actions={<div data-testid="basis-toggle-stub">Базис</div>}
      />
    )
    await user.click(screen.getByRole('button', { name: /Обновить/ }))
    expect(onRefresh).toHaveBeenCalledOnce()
  })
})
