/**
 * Tests for MultiCampaignWarningBanner component
 * Tests visibility, dismiss logic, Russian pluralization, and sessionStorage integration.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@/test/utils/test-utils'
import userEvent from '@testing-library/user-event'
import { MultiCampaignWarningBanner } from '../MultiCampaignWarningBanner'

describe('MultiCampaignWarningBanner', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('returns null when warningCount is 0', () => {
    const { container } = render(<MultiCampaignWarningBanner warningCount={0} />)
    expect(container.innerHTML).toBe('')
  })

  it('renders alert when warningCount > 0 and not dismissed', () => {
    render(<MultiCampaignWarningBanner warningCount={3} />)
    const alert = screen.getByRole('alert')
    const title = screen.getByText('Мультипликация расходов')
    const description = screen.getByText(/3 товара участвуют/)

    expect(alert).toHaveClass('bg-status-warning/15', 'border-status-warning/30')
    expect(title).toHaveClass('text-foreground')
    expect(description).toHaveClass('text-foreground')
    expect(title).not.toHaveClass('text-status-warning')
    expect(description).not.toHaveClass('text-status-warning')
  })

  it('shows correct Russian pluralization for 1 item', () => {
    render(<MultiCampaignWarningBanner warningCount={1} />)
    expect(screen.getByText(/1 товар/)).toBeInTheDocument()
    expect(screen.getByText(/участвует/)).toBeInTheDocument()
  })

  it('shows correct Russian pluralization for 2-4 items', () => {
    render(<MultiCampaignWarningBanner warningCount={3} />)
    expect(screen.getByText(/3 товара/)).toBeInTheDocument()
    expect(screen.getByText(/участвуют/)).toBeInTheDocument()
  })

  it('shows correct Russian pluralization for 5+ items', () => {
    render(<MultiCampaignWarningBanner warningCount={11} />)
    expect(screen.getByText(/11 товаров/)).toBeInTheDocument()
    expect(screen.getByText(/участвуют/)).toBeInTheDocument()
  })

  it('renders dismiss button with aria-label', () => {
    render(<MultiCampaignWarningBanner warningCount={2} />)
    expect(screen.getByLabelText('Скрыть предупреждение')).toBeInTheDocument()
  })

  it('dismisses the banner on click and stores count in sessionStorage', async () => {
    const user = userEvent.setup()
    render(<MultiCampaignWarningBanner warningCount={5} />)
    const alert = screen.getByRole('alert')
    expect(alert).toBeInTheDocument()

    await user.click(screen.getByLabelText('Скрыть предупреждение'))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(sessionStorage.getItem('multi-campaign-warning-dismissed')).toBe('5')
  })

  it('stays dismissed when sessionStorage has equal count', () => {
    sessionStorage.setItem('multi-campaign-warning-dismissed', '3')
    render(<MultiCampaignWarningBanner warningCount={3} />)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('re-shows when warningCount increases beyond stored value', () => {
    sessionStorage.setItem('multi-campaign-warning-dismissed', '3')
    render(<MultiCampaignWarningBanner warningCount={5} />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('renders AlertTriangle icon hidden from screen readers', () => {
    render(<MultiCampaignWarningBanner warningCount={2} />)
    const icons = document.querySelectorAll('svg')
    // AlertTriangle is an SVG with aria-hidden="true"
    const hiddenIcons = Array.from(icons).filter(svg => svg.getAttribute('aria-hidden') === 'true')
    expect(hiddenIcons.length).toBeGreaterThanOrEqual(1)
  })
})
