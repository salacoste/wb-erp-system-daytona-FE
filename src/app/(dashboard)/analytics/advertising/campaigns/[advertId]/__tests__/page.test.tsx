/**
 * Campaign Detail Page Tests — /analytics/advertising/campaigns/[advertId]
 * Story 86.1: Bid recommendations integration
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@/test/utils/test-utils'

// --- Mock next/navigation ---
const mockParams = { advertId: '12345' }
const mockSearchParams = new URLSearchParams()
vi.mock('next/navigation', () => ({
  useParams: () => mockParams,
  useSearchParams: () => mockSearchParams,
}))

// --- Mock auth store ---
const mockCabinetId = vi.fn<() => string | null>()
vi.mock('@/stores/authStore', () => ({
  useAuthStore: (selector: (s: { cabinetId: string | null }) => string | null) =>
    selector({ cabinetId: mockCabinetId() }),
}))

// --- Mock BidRecommendationsCard ---
vi.mock('@/components/custom/advertising/BidRecommendationsCard', () => ({
  BidRecommendationsCard: ({
    cabinetId,
    advertId,
    nmId,
  }: {
    cabinetId: string
    advertId: number
    nmId?: number
  }) => (
    <div
      data-testid="bid-recommendations-card"
      data-cabinet-id={cabinetId}
      data-advert-id={advertId}
      data-nm-id={nmId ?? ''}
    >
      BidRecommendationsCard
    </div>
  ),
}))

// Import after mocks
import CampaignDetailPage from '../page'

function renderPage() {
  return render(<CampaignDetailPage />)
}

describe('CampaignDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCabinetId.mockReturnValue('cabinet-uuid-1')
    mockParams.advertId = '12345'
    mockSearchParams.delete('nmId')
  })

  // --- Valid data rendering ---

  it('renders campaign heading with advertId', () => {
    renderPage()
    expect(screen.getByRole('heading', { name: /Кампания #12345/, level: 1 })).toBeInTheDocument()
  })

  it('renders back link to advertising analytics', () => {
    renderPage()
    expect(screen.getByText('Назад к рекламной аналитике')).toBeInTheDocument()
  })

  it('renders BidRecommendationsCard with correct props', () => {
    renderPage()
    const card = screen.getByTestId('bid-recommendations-card')
    expect(card).toHaveAttribute('data-cabinet-id', 'cabinet-uuid-1')
    expect(card).toHaveAttribute('data-advert-id', '12345')
  })

  it('passes nmId from search params to BidRecommendationsCard', () => {
    mockSearchParams.set('nmId', '67890')
    renderPage()
    const card = screen.getByTestId('bid-recommendations-card')
    expect(card).toHaveAttribute('data-nm-id', '67890')
  })

  it('passes empty nmId when search param absent', () => {
    renderPage()
    const card = screen.getByTestId('bid-recommendations-card')
    expect(card).toHaveAttribute('data-nm-id', '')
  })

  // --- Invalid advertId ---

  it('shows error alert for non-numeric advertId', () => {
    mockParams.advertId = 'invalid'
    renderPage()
    expect(screen.getByText('Некорректный ID кампании')).toBeInTheDocument()
    expect(screen.queryByTestId('bid-recommendations-card')).not.toBeInTheDocument()
  })

  it('shows error alert for NaN advertId', () => {
    mockParams.advertId = 'abc'
    renderPage()
    expect(screen.getByText('Некорректный ID кампании')).toBeInTheDocument()
  })

  // --- Missing cabinetId (loading) ---

  it('renders skeleton when cabinetId is null', () => {
    mockCabinetId.mockReturnValue(null)
    const { container } = renderPage()
    expect(container.querySelector('[class*="h-64"]')).toBeInTheDocument()
    expect(screen.queryByTestId('bid-recommendations-card')).not.toBeInTheDocument()
  })

  // --- Accessibility ---

  it('has exactly one h1 heading', () => {
    renderPage()
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
  })

  it('unmounts without errors', () => {
    const { unmount } = renderPage()
    expect(() => unmount()).not.toThrow()
  })
})
