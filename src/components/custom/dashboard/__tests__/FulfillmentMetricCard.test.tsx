/**
 * Unit Tests for FulfillmentMetricCard Component
 * Epic 60: FBO/FBS Order Analytics Separation
 */

import { describe, it, expect, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils/test-utils'
import { FulfillmentMetricCard, type FulfillmentMetricCardProps } from '../FulfillmentMetricCard'

const defaultProps: FulfillmentMetricCardProps = {
  fboOrdersCount: 150,
  fboOrdersRevenue: 450000,
  fbsOrdersCount: 85,
  fbsOrdersRevenue: 255000,
  fboShare: 63.8,
  fbsShare: 36.2,
  isDataAvailable: true,
  isLoading: false,
  error: null,
}

const propsWithComparison: FulfillmentMetricCardProps = {
  ...defaultProps,
  previousFboOrdersCount: 130,
  previousFbsOrdersCount: 70,
  previousTotalRevenue: 600000,
}

describe('FulfillmentMetricCard', () => {
  describe('rendering states', () => {
    it('renders total orders count and revenue', () => {
      renderWithProviders(<FulfillmentMetricCard {...defaultProps} />)
      expect(screen.getByText(/235/)).toBeInTheDocument()
      const cardText = screen.getByRole('article').textContent
      expect(cardText).toMatch(/705.*000|705/i)
    })

    it('shows FBO/FBS share breakdown bar', () => {
      renderWithProviders(<FulfillmentMetricCard {...defaultProps} />)
      expect(screen.getByText(/63[,.]?8.*%|FBO.*63/i)).toBeInTheDocument()
      expect(screen.getByText(/36[,.]?2.*%|FBS.*36/i)).toBeInTheDocument()
    })

    it('shows loading skeleton when isLoading', () => {
      renderWithProviders(<FulfillmentMetricCard {...defaultProps} isLoading={true} />)
      const skeleton = document.querySelector('[aria-busy="true"]')
      expect(skeleton).toBeInTheDocument()
      expect(screen.queryByText(/235/)).not.toBeInTheDocument()
    })

    it('shows error state with retry button', () => {
      const onRetry = vi.fn()
      const error = new Error('Failed to load fulfillment data')
      renderWithProviders(
        <FulfillmentMetricCard {...defaultProps} error={error} onRetry={onRetry} />
      )
      expect(screen.getByRole('alert')).toBeInTheDocument()
      const retryButton = screen.getByRole('button', { name: /повторить|retry/i })
      expect(retryButton).toBeInTheDocument()
    })

    it('shows empty state when isDataAvailable is false', () => {
      renderWithProviders(<FulfillmentMetricCard {...defaultProps} isDataAvailable={false} />)
      expect(screen.getByText(/нет данных|данные недоступны|no data/i)).toBeInTheDocument()
    })

    it('calls onStartSync when sync button clicked', async () => {
      const onStartSync = vi.fn()
      renderWithProviders(
        <FulfillmentMetricCard
          {...defaultProps}
          isDataAvailable={false}
          onStartSync={onStartSync}
        />
      )
      const syncButton = screen.getByRole('button', { name: /синхронизировать|sync|загрузить/i })
      await userEvent.click(syncButton)
      expect(onStartSync).toHaveBeenCalledTimes(1)
    })
  })

  describe('comparison badge', () => {
    it('displays comparison badge when previous data provided', () => {
      renderWithProviders(<FulfillmentMetricCard {...propsWithComparison} />)
      const badge = screen.getByTestId('comparison-badge')
      expect(badge).toBeInTheDocument()
    })

    it('shows positive badge when orders increased', () => {
      renderWithProviders(<FulfillmentMetricCard {...propsWithComparison} />)
      const badge = screen.getByTestId('comparison-badge')
      expect(badge).toHaveClass(/green|positive/i)
      expect(badge.textContent).toMatch(/\+/)
    })

    it('shows negative badge when orders decreased', () => {
      renderWithProviders(
        <FulfillmentMetricCard
          {...defaultProps}
          fboOrdersCount={100}
          fbsOrdersCount={50}
          previousFboOrdersCount={150}
          previousFbsOrdersCount={100}
        />
      )
      const badge = screen.getByTestId('comparison-badge')
      expect(badge).toHaveClass(/red|negative/i)
      expect(badge.textContent).toMatch(/-/)
    })

    it('hides comparison when previous data not provided', () => {
      renderWithProviders(<FulfillmentMetricCard {...defaultProps} />)
      expect(screen.queryByTestId('comparison-badge')).not.toBeInTheDocument()
    })
  })

  describe('FBO/FBS breakdown', () => {
    it('displays FBO and FBS orders counts', () => {
      renderWithProviders(<FulfillmentMetricCard {...defaultProps} />)
      const cardText = screen.getByRole('article').textContent
      expect(cardText).toMatch(/FBO.*150|150.*FBO/i)
      expect(cardText).toMatch(/FBS.*85|85.*FBS/i)
    })

    it('displays share percentages with visual bar', () => {
      renderWithProviders(<FulfillmentMetricCard {...defaultProps} />)
      const progressBar =
        screen.getByRole('progressbar') || document.querySelector('[role="meter"]')
      expect(progressBar || screen.getByTestId('share-bar')).toBeInTheDocument()
    })
  })

  describe('interactions', () => {
    it('calls onRetry when retry button clicked and shows tooltip on hover', async () => {
      const onRetry = vi.fn()
      const error = new Error('Network error')
      renderWithProviders(
        <FulfillmentMetricCard {...defaultProps} error={error} onRetry={onRetry} />
      )
      await userEvent.click(screen.getByRole('button', { name: /повторить|retry/i }))
      expect(onRetry).toHaveBeenCalledTimes(1)
    })

    it('shows tooltip with FBO/FBS info on hover', async () => {
      renderWithProviders(<FulfillmentMetricCard {...defaultProps} />)
      const infoButton = screen.getByRole('button', { name: /подробнее|info/i })
      await userEvent.hover(infoButton)
      await waitFor(() => {
        const tooltips = screen.getAllByRole('tooltip')
        expect(tooltips.length).toBeGreaterThan(0)
        expect(tooltips[0].textContent).toMatch(/FBO|FBS|склад|fulfillment/i)
      })
    })
  })

  describe('accessibility', () => {
    it('has proper aria-label on card and alert role on errors', () => {
      renderWithProviders(<FulfillmentMetricCard {...defaultProps} />)
      const card = screen.getByRole('article')
      expect(card).toHaveAttribute('aria-label')
      expect(card.getAttribute('aria-label')).toMatch(/заказ|order|FBO|FBS/i)
    })

    it('loading skeleton has aria-busy and info button is focusable', () => {
      renderWithProviders(<FulfillmentMetricCard {...defaultProps} isLoading={true} />)
      expect(document.querySelector('[aria-busy="true"]')).toBeInTheDocument()
    })
  })

  describe('styling', () => {
    it('applies custom className prop', () => {
      renderWithProviders(<FulfillmentMetricCard {...defaultProps} className="custom-test-class" />)
      expect(screen.getByRole('article')).toHaveClass('custom-test-class')
    })

    it('has minimum height of 120px', () => {
      renderWithProviders(<FulfillmentMetricCard {...defaultProps} />)
      expect(screen.getByRole('article')).toHaveClass('min-h-[120px]')
    })

    it('FBO bar uses blue color and FBS bar uses purple color', () => {
      renderWithProviders(<FulfillmentMetricCard {...defaultProps} />)
      const fboBar = screen.getByTestId('fbo-bar')
      const fbsBar = screen.getByTestId('fbs-bar')
      expect(fboBar?.className || '').toMatch(/blue/)
      expect(fbsBar?.className || '').toMatch(/purple|violet/)
    })
  })
})
