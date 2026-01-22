/**
 * TDD Tests for Story 44.34-FE
 * Debounce Warehouse Selection & Rate Limit Handling
 *
 * GREEN Phase: Tests verify implemented components
 * These tests verify the behavior for:
 * - RateLimitWarning component rendering
 * - CoefficientsLoadingSkeleton component rendering
 * - Accessibility attributes
 *
 * @see docs/stories/epic-44/story-44.34-fe-debounce-warehouse-selection.md
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RateLimitWarning } from '../RateLimitWarning'
import { CoefficientsLoadingSkeleton } from '../CoefficientsLoadingSkeleton'

// ============================================================================
// Story 44.34: RateLimitWarning Component Tests
// ============================================================================

describe('Story 44.34: RateLimitWarning Component', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should render with alert role for accessibility (AC3)', () => {
    render(<RateLimitWarning remainingSeconds={10} />)
    const alert = screen.getByRole('alert')
    expect(alert).toBeInTheDocument()
  })

  it('should show user-friendly error message with retry time (AC3)', () => {
    render(<RateLimitWarning remainingSeconds={10} />)
    expect(screen.getByText(/слишком много запросов.*подождите 10 сек/i)).toBeInTheDocument()
  })

  it('should display countdown timer (AC4)', () => {
    render(<RateLimitWarning remainingSeconds={30} retryAfter={60} />)
    expect(screen.getByText(/до повторной попытки/i)).toBeInTheDocument()
    expect(screen.getByText(/0:30/)).toBeInTheDocument()
  })

  it('should show progress bar for cooldown period (AC4)', () => {
    render(<RateLimitWarning remainingSeconds={30} retryAfter={60} />)
    // Progress bar should exist
    const progressBar = document.querySelector('[role="progressbar"]')
    expect(progressBar).toBeInTheDocument()
  })

  it('should show WB API limit explanation (AC6)', () => {
    render(<RateLimitWarning remainingSeconds={10} />)
    expect(screen.getByText(/6 запросов в минуту/i)).toBeInTheDocument()
  })

  it('should have aria-live assertive for screen readers', () => {
    render(<RateLimitWarning remainingSeconds={10} />)
    const alert = screen.getByRole('alert')
    expect(alert).toHaveAttribute('aria-live', 'assertive')
  })

  it('should have aria-atomic true for complete announcement', () => {
    render(<RateLimitWarning remainingSeconds={10} />)
    const alert = screen.getByRole('alert')
    expect(alert).toHaveAttribute('aria-atomic', 'true')
  })

  it('should display custom endpoint name', () => {
    render(<RateLimitWarning remainingSeconds={10} endpointName="тестовый эндпоинт" />)
    expect(screen.getByText(/тестовый эндпоинт/)).toBeInTheDocument()
  })

  it('should display custom message when provided', () => {
    render(<RateLimitWarning remainingSeconds={10} message="Кастомное сообщение" />)
    expect(screen.getByText('Кастомное сообщение')).toBeInTheDocument()
  })

  it('should show dismiss button when onDismiss provided', () => {
    const onDismiss = vi.fn()
    render(<RateLimitWarning remainingSeconds={10} onDismiss={onDismiss} />)
    const dismissButton = screen.getByRole('button', { name: /скрыть/i })
    expect(dismissButton).toBeInTheDocument()
  })

  it('should not show dismiss button when onDismiss not provided', () => {
    render(<RateLimitWarning remainingSeconds={10} />)
    const dismissButton = screen.queryByRole('button', { name: /скрыть/i })
    expect(dismissButton).not.toBeInTheDocument()
  })
})

// ============================================================================
// Story 44.34: CoefficientsLoadingSkeleton Component Tests
// ============================================================================

describe('Story 44.34: CoefficientsLoadingSkeleton Component', () => {
  it('should render skeleton elements (AC2)', () => {
    render(<CoefficientsLoadingSkeleton />)
    // Default is 3 field skeletons (each has label + input = 6 skeletons)
    const skeletons = document.querySelectorAll('[class*="bg-muted"]')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('should show loading text by default (AC2)', () => {
    render(<CoefficientsLoadingSkeleton />)
    expect(screen.getByText('Загрузка коэффициентов...')).toBeInTheDocument()
  })

  it('should show custom loading message', () => {
    render(<CoefficientsLoadingSkeleton message="Загрузка данных склада..." />)
    expect(screen.getByText('Загрузка данных склада...')).toBeInTheDocument()
  })

  it('should show spinning indicator (AC2)', () => {
    render(<CoefficientsLoadingSkeleton />)
    const spinner = document.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
  })

  it('should hide loading message when showMessage is false', () => {
    render(<CoefficientsLoadingSkeleton showMessage={false} />)
    expect(screen.queryByText('Загрузка коэффициентов...')).not.toBeInTheDocument()
  })

  it('should render configurable number of field skeletons', () => {
    const { container } = render(<CoefficientsLoadingSkeleton fieldCount={2} />)
    // Each field has label + input skeleton
    const fieldGroups = container.querySelectorAll('.space-y-2')
    expect(fieldGroups.length).toBeGreaterThanOrEqual(2)
  })

  it('should have role status for accessibility', () => {
    render(<CoefficientsLoadingSkeleton />)
    const card = document.querySelector('[role="status"]')
    expect(card).toBeInTheDocument()
  })

  it('should have aria-busy true while loading', () => {
    render(<CoefficientsLoadingSkeleton />)
    const card = document.querySelector('[aria-busy="true"]')
    expect(card).toBeInTheDocument()
  })

  it('should have aria-live polite for loading message', () => {
    render(<CoefficientsLoadingSkeleton />)
    const loadingMessage = screen.getByText('Загрузка коэффициентов...')
    expect(loadingMessage.parentElement).toHaveAttribute('aria-live', 'polite')
  })
})

// ============================================================================
// Story 44.34: Accessibility Tests
// ============================================================================

describe('Story 44.34: Accessibility', () => {
  it('should announce loading state to screen readers', () => {
    render(<CoefficientsLoadingSkeleton />)
    const loadingContainer = screen.getByText('Загрузка коэффициентов...').parentElement
    expect(loadingContainer).toHaveAttribute('aria-live', 'polite')
  })

  it('should announce rate limit error as alert', () => {
    render(<RateLimitWarning remainingSeconds={10} />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('should have accessible progress bar in rate limit warning', () => {
    render(<RateLimitWarning remainingSeconds={30} retryAfter={60} />)
    const progressBar = document.querySelector('[role="progressbar"]')
    expect(progressBar).toBeInTheDocument()
    expect(progressBar).toHaveAttribute('aria-label')
  })

  it('should have accessible countdown timer', () => {
    render(<RateLimitWarning remainingSeconds={10} />)
    // The timer text is inside a span with aria-label
    const timerContainer = screen.getByLabelText(/осталось.*секунд/i)
    expect(timerContainer).toBeInTheDocument()
  })
})
