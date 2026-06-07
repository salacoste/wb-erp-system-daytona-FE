/**
 * Tax Settings Page Tests
 * Tests for src/app/(dashboard)/settings/tax/page.tsx
 * Epic 66-FE: Tax & Accounting Settings
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@/test/utils/test-utils'

// Mock the TaxSettingsForm component
vi.mock('@/components/custom/settings/TaxSettingsForm', () => ({
  TaxSettingsForm: ({ cabinetId }: { cabinetId: string }) => (
    <div data-testid="tax-settings-form" data-cabinet-id={cabinetId}>
      TaxSettingsForm
    </div>
  ),
}))

// Mock auth store
const mockCabinetId = vi.fn<[], string | null>()
vi.mock('@/stores/authStore', () => ({
  useAuthStore: (selector: (state: { cabinetId: string | null }) => string | null) =>
    selector({ cabinetId: mockCabinetId() }),
}))

// Import after mocks
import TaxSettingsPage from '../page'

describe('TaxSettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Loading state (no cabinetId)', () => {
    it('should render skeleton placeholders when cabinetId is null', () => {
      mockCabinetId.mockReturnValue(null)

      const { container } = render(<TaxSettingsPage />)

      const skeletons = container.querySelectorAll('[class*="animate-pulse"]')
      expect(skeletons.length).toBeGreaterThanOrEqual(3)
    })

    it('should not render page title in loading state', () => {
      mockCabinetId.mockReturnValue(null)

      render(<TaxSettingsPage />)

      expect(screen.queryByRole('heading')).not.toBeInTheDocument()
    })

    it('should not render TaxSettingsForm in loading state', () => {
      mockCabinetId.mockReturnValue(null)

      render(<TaxSettingsPage />)

      expect(screen.queryByTestId('tax-settings-form')).not.toBeInTheDocument()
    })
  })

  describe('Main content (with cabinetId)', () => {
    beforeEach(() => {
      mockCabinetId.mockReturnValue('cabinet-456')
    })

    it('should render page title "Налоговые настройки"', () => {
      render(<TaxSettingsPage />)

      expect(
        screen.getByRole('heading', { name: /налоговые настройки/i, level: 1 })
      ).toBeInTheDocument()
    })

    it('should render subtitle about tax system and VAT', () => {
      render(<TaxSettingsPage />)

      expect(screen.getByText(/настройки системы налогообложения и ндс/i)).toBeInTheDocument()
    })

    it('should render TaxSettingsForm with correct cabinetId', () => {
      render(<TaxSettingsPage />)

      const form = screen.getByTestId('tax-settings-form')
      expect(form).toBeInTheDocument()
      expect(form).toHaveAttribute('data-cabinet-id', 'cabinet-456')
    })

    it('should not render skeleton elements when cabinetId exists', () => {
      const { container } = render(<TaxSettingsPage />)

      const skeletons = container.querySelectorAll('[class*="animate-pulse"]')
      expect(skeletons.length).toBe(0)
    })

    it('should render within a max-w-2xl container', () => {
      const { container } = render(<TaxSettingsPage />)

      const mainContainer = container.querySelector('.max-w-2xl')
      expect(mainContainer).toBeInTheDocument()
    })
  })

  describe('Different cabinetId values', () => {
    it('should pass different cabinetId to TaxSettingsForm', () => {
      mockCabinetId.mockReturnValue('other-cabinet-789')

      render(<TaxSettingsPage />)

      const form = screen.getByTestId('tax-settings-form')
      expect(form).toHaveAttribute('data-cabinet-id', 'other-cabinet-789')
    })

    it('should handle numeric-like string cabinetId', () => {
      mockCabinetId.mockReturnValue('99')

      render(<TaxSettingsPage />)

      const form = screen.getByTestId('tax-settings-form')
      expect(form).toHaveAttribute('data-cabinet-id', '99')
    })
  })

  describe('Accessibility', () => {
    it('should have an h1 heading with the page title', () => {
      mockCabinetId.mockReturnValue('cabinet-456')

      render(<TaxSettingsPage />)

      const heading = screen.getByRole('heading', { level: 1 })
      expect(heading).toHaveTextContent('Налоговые настройки')
    })

    it('should have a descriptive paragraph after the heading', () => {
      mockCabinetId.mockReturnValue('cabinet-456')

      render(<TaxSettingsPage />)

      const description = screen.getByText(/настройки системы налогообложения/i)
      expect(description.tagName).toBe('P')
    })
  })
})
