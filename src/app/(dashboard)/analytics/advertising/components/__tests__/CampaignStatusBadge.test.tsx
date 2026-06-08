/**
 * Tests for CampaignInfo component (exported from CampaignStatusBadge)
 * Tests name truncation, date formatting, type badge, and placements rendering.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/utils/test-utils'
import { CampaignInfo } from '../CampaignStatusBadge'
import type { CampaignPlacements } from '@/types/advertising-analytics'

// Mock campaign-utils for CampaignStatusDot and CampaignTypeBadge
vi.mock('@/lib/campaign-utils', () => ({
  getCampaignStatusDotColor: vi.fn(() => 'bg-green-500'),
  getCampaignStatusLabel: vi.fn((_s: number, name?: string) => name ?? 'Active'),
  getCampaignTypeLabel: vi.fn((_t: number, name?: string) => name ?? 'Type'),
}))

describe('CampaignInfo', () => {
  it('renders campaign name', () => {
    render(<CampaignInfo name="My Campaign" status={9} type={8} />)
    expect(screen.getByText('My Campaign')).toBeInTheDocument()
  })

  it('truncates long names with ellipsis', () => {
    const longName = 'A'.repeat(100)
    render(<CampaignInfo name={longName} status={9} type={8} maxNameLength={30} />)
    const displayed = screen.getByTitle(longName)
    expect(displayed.textContent).toBe('A'.repeat(30) + '...')
  })

  it('renders full name when under maxNameLength', () => {
    render(<CampaignInfo name="Short" status={9} type={8} maxNameLength={30} />)
    expect(screen.getByText('Short')).toBeInTheDocument()
    expect(screen.queryByText(/\.\.\./)).not.toBeInTheDocument()
  })

  it('renders creation date in Russian format when showCreatedAt is true', () => {
    render(
      <CampaignInfo
        name="Test"
        status={9}
        type={8}
        createdAt="2025-01-15T10:00:00Z"
        showCreatedAt={true}
      />
    )
    // date-fns format with ru locale: "15 янв 2025"
    expect(screen.getByText(/15 .* 2025/)).toBeInTheDocument()
  })

  it('does not render creation date when showCreatedAt is false (default)', () => {
    render(<CampaignInfo name="Test" status={9} type={8} createdAt="2025-01-15T10:00:00Z" />)
    expect(screen.queryByText(/Создана/)).not.toBeInTheDocument()
  })

  it('does not render creation date when createdAt is undefined', () => {
    render(<CampaignInfo name="Test" status={9} type={8} showCreatedAt={true} />)
    expect(screen.queryByText(/Создана/)).not.toBeInTheDocument()
  })

  it('renders type badge by default', () => {
    render(<CampaignInfo name="Test" status={9} type={8} />)
    // getCampaignTypeLabel mock returns 'Type'
    expect(screen.getByText('Type')).toBeInTheDocument()
  })

  it('hides type badge when showType is false', () => {
    render(<CampaignInfo name="Test" status={9} type={8} showType={false} />)
    expect(screen.queryByText('Type')).not.toBeInTheDocument()
  })

  it('renders placements when showPlacements is true', () => {
    const placements: CampaignPlacements = {
      search: true,
      recommendations: false,
    }
    render(
      <CampaignInfo name="Test" status={9} type={8} placements={placements} showPlacements={true} />
    )
    expect(screen.getByText('Размещение:')).toBeInTheDocument()
  })

  it('does not render placements when showPlacements is false', () => {
    const placements: CampaignPlacements = { search: true, recommendations: false }
    render(<CampaignInfo name="Test" status={9} type={8} placements={placements} />)
    expect(screen.queryByText('Размещение:')).not.toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(
      <CampaignInfo name="Test" status={9} type={8} className="custom-cls" />
    )
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.className).toContain('custom-cls')
  })
})
