/**
 * Cabinet Settings Page Tests
 * Tests for src/app/(dashboard)/settings/cabinet/page.tsx
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@/test/utils/test-utils'

// Mock the CabinetInfoCard component
vi.mock('@/components/custom/settings/CabinetInfoCard', () => ({
  CabinetInfoCard: ({ cabinetId }: { cabinetId: string }) => (
    <div data-testid="cabinet-info-card" data-cabinet-id={cabinetId}>
      CabinetInfoCard
    </div>
  ),
}))

// Mock the JamStatusBadge component
vi.mock('@/components/custom/settings/JamStatusBadge', () => ({
  JamStatusBadge: ({ cabinetId }: { cabinetId: string }) => (
    <div data-testid="jam-status-badge" data-cabinet-id={cabinetId}>
      JamStatusBadge
    </div>
  ),
}))

// Mock auth store
const mockCabinetId = vi.fn<() => string | null>()
vi.mock('@/stores/authStore', () => ({
  useAuthStore: (selector: (state: { cabinetId: string | null }) => string | null) =>
    selector({ cabinetId: mockCabinetId() }),
}))

// Import after mocks
import CabinetSettingsPage from '../page'

describe('CabinetSettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Loading state (no cabinetId)', () => {
    it('should render skeleton placeholders when cabinetId is null', () => {
      mockCabinetId.mockReturnValue(null)

      const { container } = render(<CabinetSettingsPage />)

      // Should render 3 skeleton elements
      const skeletons = container.querySelectorAll('[class*="animate-pulse"]')
      expect(skeletons.length).toBeGreaterThanOrEqual(3)
    })

    it('should not render page title in loading state', () => {
      mockCabinetId.mockReturnValue(null)

      render(<CabinetSettingsPage />)

      expect(screen.queryByRole('heading')).not.toBeInTheDocument()
    })

    it('should not render CabinetInfoCard in loading state', () => {
      mockCabinetId.mockReturnValue(null)

      render(<CabinetSettingsPage />)

      expect(screen.queryByTestId('cabinet-info-card')).not.toBeInTheDocument()
    })
  })

  describe('Main content (with cabinetId)', () => {
    beforeEach(() => {
      mockCabinetId.mockReturnValue('cabinet-123')
    })

    it('should render page title "Кабинет"', () => {
      render(<CabinetSettingsPage />)

      expect(screen.getByRole('heading', { name: /кабинет/i, level: 1 })).toBeInTheDocument()
    })

    it('should render page subtitle about subscription info', () => {
      render(<CabinetSettingsPage />)

      expect(screen.getByText(/информация о продавце и статус подписки/i)).toBeInTheDocument()
    })

    it('should render CabinetInfoCard with correct cabinetId', () => {
      render(<CabinetSettingsPage />)

      const card = screen.getByTestId('cabinet-info-card')
      expect(card).toBeInTheDocument()
      expect(card).toHaveAttribute('data-cabinet-id', 'cabinet-123')
    })

    it('should not render skeleton elements when cabinetId exists', () => {
      const { container } = render(<CabinetSettingsPage />)

      const skeletons = container.querySelectorAll('[class*="animate-pulse"]')
      expect(skeletons.length).toBe(0)
    })

    it('should render within a max-w-2xl container', () => {
      const { container } = render(<CabinetSettingsPage />)

      const mainContainer = container.querySelector('.max-w-2xl')
      expect(mainContainer).toBeInTheDocument()
    })
  })

  describe('Different cabinetId values', () => {
    it('should pass different cabinetId to CabinetInfoCard', () => {
      mockCabinetId.mockReturnValue('different-cabinet-456')

      render(<CabinetSettingsPage />)

      const card = screen.getByTestId('cabinet-info-card')
      expect(card).toHaveAttribute('data-cabinet-id', 'different-cabinet-456')
    })

    it('should handle numeric-like string cabinetId', () => {
      mockCabinetId.mockReturnValue('42')

      render(<CabinetSettingsPage />)

      const card = screen.getByTestId('cabinet-info-card')
      expect(card).toHaveAttribute('data-cabinet-id', '42')
    })
  })

  describe('Accessibility', () => {
    it('should have an h1 heading with the page title', () => {
      mockCabinetId.mockReturnValue('cabinet-123')

      render(<CabinetSettingsPage />)

      const heading = screen.getByRole('heading', { level: 1 })
      expect(heading).toHaveTextContent('Кабинет')
    })

    it('should have a descriptive paragraph after the heading', () => {
      mockCabinetId.mockReturnValue('cabinet-123')

      render(<CabinetSettingsPage />)

      const description = screen.getByText(/информация о продавце/i)
      expect(description.tagName).toBe('P')
    })
  })
})
