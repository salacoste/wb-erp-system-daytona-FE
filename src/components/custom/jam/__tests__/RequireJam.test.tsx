/**
 * Tests for RequireJam gating component
 * Story 71.3-FE: RequireJam Gating Component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createTestQueryClient, createQueryWrapper } from '@/test/utils/test-utils'
import type { QueryClient } from '@tanstack/react-query'
import type { JamStatusResponse } from '@/types/cabinet'

const mockUseAuthStore = vi.fn(() => ({ cabinetId: 'cab-1' as string | null }))

vi.mock('@/hooks/useJamStatus', () => ({
  useJamStatus: vi.fn(),
}))

vi.mock('@/stores/authStore', () => ({
  useAuthStore: () => mockUseAuthStore(),
}))

import { useJamStatus } from '@/hooks/useJamStatus'
import { RequireJam } from '../RequireJam'

const mockedUseJamStatus = vi.mocked(useJamStatus)
let queryClient: QueryClient

const mockJamData: JamStatusResponse = {
  tier: 'advanced',
  searchTextsLimit: 100,
  checkedAt: '2026-03-06T12:00:00.000Z',
  probeCallsMade: 2,
}

beforeEach(() => {
  vi.clearAllMocks()
  queryClient = createTestQueryClient()
})

function renderWithWrapper(ui: React.ReactElement) {
  return render(ui, { wrapper: createQueryWrapper(queryClient) })
}

describe('RequireJam', () => {
  describe('sufficient tier', () => {
    it('renders children when user tier meets required tier', () => {
      mockedUseJamStatus.mockReturnValue({
        data: mockJamData,
        isLoading: false,
        isError: false,
      } as ReturnType<typeof useJamStatus>)

      renderWithWrapper(
        <RequireJam requiredTier="standard">
          <div data-testid="protected-content">Search Data</div>
        </RequireJam>
      )

      expect(screen.getByTestId('protected-content')).toBeInTheDocument()
      expect(screen.queryByText('Доступно с подпиской WB Джем')).not.toBeInTheDocument()
    })

    it('renders children when user tier equals required tier', () => {
      mockedUseJamStatus.mockReturnValue({
        data: { ...mockJamData, tier: 'standard' },
        isLoading: false,
        isError: false,
      } as ReturnType<typeof useJamStatus>)

      renderWithWrapper(
        <RequireJam requiredTier="standard">
          <div data-testid="protected-content">Search Data</div>
        </RequireJam>
      )

      expect(screen.getByTestId('protected-content')).toBeInTheDocument()
    })
  })

  describe('insufficient tier', () => {
    it('shows overlay when tier is insufficient', () => {
      mockedUseJamStatus.mockReturnValue({
        data: { ...mockJamData, tier: 'none' },
        isLoading: false,
        isError: false,
      } as ReturnType<typeof useJamStatus>)

      renderWithWrapper(
        <RequireJam requiredTier="standard">
          <div>Search Data</div>
        </RequireJam>
      )

      expect(screen.getByText('Доступно с подпиской WB Джем')).toBeInTheDocument()
    })

    it('overlay contains CTA with tier label', () => {
      mockedUseJamStatus.mockReturnValue({
        data: { ...mockJamData, tier: 'none' },
        isLoading: false,
        isError: false,
      } as ReturnType<typeof useJamStatus>)

      renderWithWrapper(
        <RequireJam requiredTier="standard">
          <div>Content</div>
        </RequireJam>
      )

      expect(screen.getByText('Джем Стандарт')).toBeInTheDocument()
    })

    it('blurred content has aria-hidden', () => {
      mockedUseJamStatus.mockReturnValue({
        data: { ...mockJamData, tier: 'none' },
        isLoading: false,
        isError: false,
      } as ReturnType<typeof useJamStatus>)

      renderWithWrapper(
        <RequireJam requiredTier="standard">
          <div data-testid="content">Content</div>
        </RequireJam>
      )

      const blurredContainer = screen.getByTestId('content').closest('[aria-hidden="true"]')
      expect(blurredContainer).toBeInTheDocument()
    })

    it('overlay region has aria-label', () => {
      mockedUseJamStatus.mockReturnValue({
        data: { ...mockJamData, tier: 'none' },
        isLoading: false,
        isError: false,
      } as ReturnType<typeof useJamStatus>)

      renderWithWrapper(
        <RequireJam requiredTier="standard">
          <div>Content</div>
        </RequireJam>
      )

      expect(screen.getByRole('region', { name: 'Требуется подписка WB Джем' })).toBeInTheDocument()
    })

    it('CTA button has aria-label', () => {
      mockedUseJamStatus.mockReturnValue({
        data: { ...mockJamData, tier: 'none' },
        isLoading: false,
        isError: false,
      } as ReturnType<typeof useJamStatus>)

      renderWithWrapper(
        <RequireJam requiredTier="standard">
          <div>Content</div>
        </RequireJam>
      )

      expect(screen.getByLabelText('Подробнее о подписке WB Джем')).toBeInTheDocument()
    })

    it('renders previewContent as blurred preview instead of children', () => {
      mockedUseJamStatus.mockReturnValue({
        data: { ...mockJamData, tier: 'none' },
        isLoading: false,
        isError: false,
      } as ReturnType<typeof useJamStatus>)

      renderWithWrapper(
        <RequireJam
          requiredTier="standard"
          previewContent={<div data-testid="preview">Preview Data</div>}
        >
          <div data-testid="real-content">Real Data</div>
        </RequireJam>
      )

      expect(screen.getByTestId('preview')).toBeInTheDocument()
      expect(screen.queryByTestId('real-content')).not.toBeInTheDocument()
    })
  })

  describe('loading state', () => {
    it('shows skeleton during loading', () => {
      mockedUseJamStatus.mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
      } as ReturnType<typeof useJamStatus>)

      const { container } = renderWithWrapper(
        <RequireJam requiredTier="standard">
          <div data-testid="content">Content</div>
        </RequireJam>
      )

      // Skeleton renders pulse animation divs
      const skeletons = container.querySelectorAll('[class*="animate-pulse"]')
      expect(skeletons.length).toBeGreaterThan(0)
      expect(screen.queryByTestId('content')).not.toBeInTheDocument()
    })
  })

  describe('error state', () => {
    it('shows skeleton on error (fail-closed)', () => {
      mockedUseJamStatus.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
      } as ReturnType<typeof useJamStatus>)

      const { container } = renderWithWrapper(
        <RequireJam requiredTier="standard">
          <div data-testid="content">Content</div>
        </RequireJam>
      )

      // Skeleton renders on error (fail-closed behavior)
      const skeletons = container.querySelectorAll('[class*="animate-pulse"]')
      expect(skeletons.length).toBeGreaterThan(0)
      expect(screen.queryByTestId('content')).not.toBeInTheDocument()
    })
  })

  describe('cabinetId null state', () => {
    it('shows skeleton when cabinetId is null (fail-closed)', () => {
      mockUseAuthStore.mockReturnValueOnce({ cabinetId: null })
      mockedUseJamStatus.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
      } as ReturnType<typeof useJamStatus>)

      const { container } = renderWithWrapper(
        <RequireJam requiredTier="standard">
          <div data-testid="content">Content</div>
        </RequireJam>
      )

      // Skeleton renders when no data available (fail-closed behavior)
      const skeletons = container.querySelectorAll('[class*="animate-pulse"]')
      expect(skeletons.length).toBeGreaterThan(0)
      expect(screen.queryByTestId('content')).not.toBeInTheDocument()
    })
  })

  describe('keyboard accessibility', () => {
    it('CTA link is keyboard-focusable via tab', async () => {
      const user = userEvent.setup()
      mockedUseJamStatus.mockReturnValue({
        data: { ...mockJamData, tier: 'none' },
        isLoading: false,
        isError: false,
      } as ReturnType<typeof useJamStatus>)

      renderWithWrapper(
        <RequireJam requiredTier="standard">
          <div>Content</div>
        </RequireJam>
      )

      await user.tab()
      const ctaLink = screen.getByLabelText('Подробнее о подписке WB Джем')
      expect(ctaLink).toHaveFocus()
    })
  })
})
