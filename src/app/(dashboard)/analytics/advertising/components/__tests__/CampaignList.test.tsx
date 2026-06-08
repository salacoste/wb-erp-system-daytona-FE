/**
 * Tests for CampaignList component
 * Tests loading, error, empty, and populated states with campaign toggling.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/utils/test-utils'
import userEvent from '@testing-library/user-event'
import { CampaignList } from '../CampaignList'
import type { Campaign } from '@/types/advertising-analytics'

// Mock CampaignStatusBadge — it uses date-fns and campaign-utils
vi.mock('@/lib/campaign-utils', () => ({
  getCampaignStatusDotColor: vi.fn(() => 'bg-green-500'),
  getCampaignStatusLabel: vi.fn((_s: number, name?: string) => name ?? 'Active'),
  getCampaignTypeLabel: vi.fn((_t: number, name?: string) => name ?? 'Type'),
}))

function makeCampaign(overrides: Partial<Campaign> = {}): Campaign {
  return {
    campaign_id: 1,
    name: 'Test Campaign',
    type: 8,
    type_name: 'Авто',
    status: 9,
    status_name: 'Активна',
    created_at: '2025-01-15T10:00:00Z',
    start_time: '2025-01-15T10:00:00Z',
    end_time: null,
    daily_budget: 5000,
    nm_ids: ['12345'],
    sku_count: 1,
    placements: null,
    ...overrides,
  }
}

describe('CampaignList', () => {
  describe('Loading State', () => {
    it('renders skeleton rows when loading', () => {
      render(
        <CampaignList
          campaigns={[]}
          selectedIds={[]}
          isLoading={true}
          error={null}
          search=""
          onToggle={vi.fn()}
        />
      )
      // Skeleton renders as <div class="animate-pulse ...">
      const skeletons = document.querySelectorAll('.animate-pulse')
      expect(skeletons.length).toBeGreaterThanOrEqual(5)
    })
  })

  describe('Error State', () => {
    it('renders error message', () => {
      render(
        <CampaignList
          campaigns={[]}
          selectedIds={[]}
          isLoading={false}
          error={new Error('fail')}
          search=""
          onToggle={vi.fn()}
        />
      )
      expect(screen.getByText('Не удалось загрузить кампании')).toBeInTheDocument()
    })
  })

  describe('Empty State', () => {
    it('shows "Нет рекламных кампаний" when no campaigns and no search', () => {
      render(
        <CampaignList
          campaigns={[]}
          selectedIds={[]}
          isLoading={false}
          error={null}
          search=""
          onToggle={vi.fn()}
        />
      )
      expect(screen.getByText('Нет рекламных кампаний')).toBeInTheDocument()
      expect(screen.getByText(/Создайте рекламную кампанию/)).toBeInTheDocument()
    })

    it('shows "Кампании не найдены" when searching with no results', () => {
      render(
        <CampaignList
          campaigns={[]}
          selectedIds={[]}
          isLoading={false}
          error={null}
          search="xyz"
          onToggle={vi.fn()}
        />
      )
      expect(screen.getByText('Кампании не найдены')).toBeInTheDocument()
    })
  })

  describe('Campaign List', () => {
    it('renders campaign items with names', () => {
      const campaigns = [
        makeCampaign({ campaign_id: 1, name: 'Campaign Alpha' }),
        makeCampaign({ campaign_id: 2, name: 'Campaign Beta' }),
      ]
      render(
        <CampaignList
          campaigns={campaigns}
          selectedIds={[]}
          isLoading={false}
          error={null}
          search=""
          onToggle={vi.fn()}
        />
      )
      expect(screen.getByText('Campaign Alpha')).toBeInTheDocument()
      expect(screen.getByText('Campaign Beta')).toBeInTheDocument()
    })

    it('marks selected campaigns with aria-selected', () => {
      const campaigns = [
        makeCampaign({ campaign_id: 1, name: 'Selected' }),
        makeCampaign({ campaign_id: 2, name: 'Unselected' }),
      ]
      render(
        <CampaignList
          campaigns={campaigns}
          selectedIds={[1]}
          isLoading={false}
          error={null}
          search=""
          onToggle={vi.fn()}
        />
      )
      const selected = screen.getByRole('option', { name: /Selected/ })
      expect(selected).toHaveAttribute('aria-selected', 'true')
      const unselected = screen.getByRole('option', { name: /Unselected/ })
      expect(unselected).toHaveAttribute('aria-selected', 'false')
    })

    it('calls onToggle with campaign_id when item is clicked', async () => {
      const user = userEvent.setup()
      const handleToggle = vi.fn()
      const campaigns = [makeCampaign({ campaign_id: 42, name: 'ClickMe' })]
      render(
        <CampaignList
          campaigns={campaigns}
          selectedIds={[]}
          isLoading={false}
          error={null}
          search=""
          onToggle={handleToggle}
        />
      )
      await user.click(screen.getByRole('option', { name: /ClickMe/ }))
      expect(handleToggle).toHaveBeenCalledWith(42)
    })

    it('renders checkboxes for each campaign', () => {
      const campaigns = [makeCampaign({ campaign_id: 1, name: 'Camp1' })]
      render(
        <CampaignList
          campaigns={campaigns}
          selectedIds={[]}
          isLoading={false}
          error={null}
          search=""
          onToggle={vi.fn()}
        />
      )
      const checkbox = screen.getByRole('checkbox', { name: /Выбрать Camp1/ })
      expect(checkbox).toBeInTheDocument()
    })
  })
})
