import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/utils/test-utils'
import { CampaignStatusDot, CampaignTypeBadge, PlacementBadges } from '../CampaignBadges'
import type { CampaignPlacements } from '@/types/advertising-analytics'

// Mock campaign-utils
vi.mock('@/lib/campaign-utils', () => ({
  getCampaignStatusDotColor: vi.fn((status: number) => {
    if (status === 9) return 'bg-green-500'
    if (status === 7) return 'bg-gray-400'
    if (status === 11) return 'bg-yellow-500'
    return 'bg-gray-300'
  }),
  getCampaignStatusLabel: vi.fn((status: number, name?: string) => name ?? `Status ${status}`),
  getCampaignTypeLabel: vi.fn((type: number, name?: string) => {
    if (type === 8) return 'Авто'
    if (type === 9) return 'Аукцион'
    return name ?? `Type ${type}`
  }),
}))

describe('CampaignStatusDot', () => {
  it('renders with status and default size', () => {
    render(<CampaignStatusDot status={9} />)
    const dot = screen.getByLabelText('Status 9')
    expect(dot).toBeInTheDocument()
    expect(dot.className).toContain('rounded-full')
  })

  it('renders with small size', () => {
    render(<CampaignStatusDot status={7} size="sm" />)
    const dot = screen.getByLabelText('Status 7')
    expect(dot.className).toContain('w-2')
  })

  it('renders with medium size', () => {
    render(<CampaignStatusDot status={9} size="md" />)
    const dot = screen.getByLabelText('Status 9')
    expect(dot.className).toContain('w-2.5')
  })

  it('uses statusName fallback', () => {
    render(<CampaignStatusDot status={9} statusName="Активна" />)
    expect(screen.getByLabelText('Активна')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(<CampaignStatusDot status={9} className="custom-cls" />)
    const dot = screen.getByLabelText('Status 9')
    expect(dot.className).toContain('custom-cls')
  })

  it('shows tooltip with status label', async () => {
    render(<CampaignStatusDot status={9} />)
    // TooltipProvider is rendered; the trigger exists
    const dot = screen.getByLabelText('Status 9')
    expect(dot).toBeInTheDocument()
  })
})

describe('CampaignTypeBadge', () => {
  it('renders auto type label', () => {
    render(<CampaignTypeBadge type={8} />)
    expect(screen.getByText('Авто')).toBeInTheDocument()
  })

  it('renders auction type label', () => {
    render(<CampaignTypeBadge type={9} />)
    expect(screen.getByText('Аукцион')).toBeInTheDocument()
  })

  it('uses typeName fallback', () => {
    render(<CampaignTypeBadge type={5} typeName="Каталог" />)
    expect(screen.getByText('Каталог')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(<CampaignTypeBadge type={8} className="my-badge" />)
    const badge = screen.getByText('Авто')
    expect(badge.closest('[class*="my-badge"]')).toBeTruthy()
  })
})

describe('PlacementBadges', () => {
  it('renders N/A for null placements', () => {
    render(<PlacementBadges placements={null} />)
    expect(screen.getByText('N/A')).toBeInTheDocument()
  })

  it('renders "Нет активных" when no placements are active', () => {
    const placements: CampaignPlacements = {
      search: false,
      recommendations: false,
      carousel: false,
    }
    render(<PlacementBadges placements={placements} />)
    expect(screen.getByText('Нет активных')).toBeInTheDocument()
  })

  it('renders active placements in icons mode (default)', () => {
    const placements: CampaignPlacements = {
      search: true,
      recommendations: true,
      carousel: false,
    }
    render(<PlacementBadges placements={placements} mode="icons" />)
    expect(screen.getByLabelText('Поиск')).toBeInTheDocument()
    expect(screen.getByLabelText('Рекомендации')).toBeInTheDocument()
  })

  it('renders active placements in badges mode', () => {
    const placements: CampaignPlacements = {
      search: true,
      recommendations: false,
      carousel: true,
    }
    render(<PlacementBadges placements={placements} mode="badges" />)
    expect(screen.getByText('Поиск')).toBeInTheDocument()
    expect(screen.getByText('Карусель')).toBeInTheDocument()
  })

  it('renders all three placements when all are active', () => {
    const placements: CampaignPlacements = {
      search: true,
      recommendations: true,
      carousel: true,
    }
    render(<PlacementBadges placements={placements} mode="badges" />)
    expect(screen.getByText('Поиск')).toBeInTheDocument()
    expect(screen.getByText('Рекомендации')).toBeInTheDocument()
    expect(screen.getByText('Карусель')).toBeInTheDocument()
  })
})
