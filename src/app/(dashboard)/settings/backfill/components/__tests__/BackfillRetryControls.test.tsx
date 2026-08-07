/**
 * BackfillRetryControls — Story 165.5 per-source retry component.
 * AC3/AC4/AC5: a retry control renders ONLY when THAT source is `failed`; the two
 * sources are independent (one failing never shows/blocks the other); in-flight
 * disables ONLY the matching source's button; clicks call ONLY the matching endpoint.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BackfillRetryControls } from '../BackfillRetryControls'
import type { BackfillCabinetStatus } from '@/types/backfill'

const base = {
  cabinet_id: 'cab-1',
  cabinet_name: 'Магазин Тест',
  data_source: 'none' as const,
  oldest_available_date: null,
  newest_available_date: null,
  progress: null,
  last_error: null,
  started_at: null,
  completed_at: null,
  updated_at: '',
}

function cabinet(
  status: BackfillCabinetStatus['status'],
  analytics_status: BackfillCabinetStatus['analytics_status']
): BackfillCabinetStatus {
  return { ...base, status, analytics_status }
}

describe('BackfillRetryControls — Story 165.5', () => {
  it('renders NOTHING when neither source failed', () => {
    const onRetry = vi.fn()
    const { container } = render(
      <BackfillRetryControls
        cabinet={cabinet('completed', 'in_progress')}
        retryingKeys={new Set()}
        onRetry={onRetry}
      />
    )
    expect(container).toBeEmptyDOMElement()
    expect(onRetry).not.toHaveBeenCalled()
  })

  it('renders ONLY the reports retry when reports=failed and analytics=completed (AC3)', () => {
    render(
      <BackfillRetryControls
        cabinet={cabinet('failed', 'completed')}
        retryingKeys={new Set()}
        onRetry={vi.fn()}
      />
    )
    expect(screen.getByRole('button', { name: /Повторить отчёты/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Повторить аналитику/ })).not.toBeInTheDocument()
  })

  it('renders ONLY the analytics retry when analytics=failed and reports=completed (AC4)', () => {
    render(
      <BackfillRetryControls
        cabinet={cabinet('completed', 'failed')}
        retryingKeys={new Set()}
        onRetry={vi.fn()}
      />
    )
    expect(screen.getByRole('button', { name: /Повторить аналитику/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Повторить отчёты/ })).not.toBeInTheDocument()
  })

  it('renders BOTH retries when both sources failed', () => {
    render(
      <BackfillRetryControls
        cabinet={cabinet('failed', 'failed')}
        retryingKeys={new Set()}
        onRetry={vi.fn()}
      />
    )
    expect(screen.getByRole('button', { name: /Повторить отчёты/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Повторить аналитику/ })).toBeInTheDocument()
  })

  it('calls onRetry(cabinetId, "reports") for the reports button — never analytics', () => {
    const onRetry = vi.fn()
    render(
      <BackfillRetryControls
        cabinet={cabinet('failed', 'completed')}
        retryingKeys={new Set()}
        onRetry={onRetry}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /Повторить отчёты/ }))
    expect(onRetry).toHaveBeenCalledTimes(1)
    expect(onRetry).toHaveBeenCalledWith('cab-1', 'reports')
  })

  it('calls onRetry(cabinetId, "analytics") for the analytics button — never reports', () => {
    const onRetry = vi.fn()
    render(
      <BackfillRetryControls
        cabinet={cabinet('completed', 'failed')}
        retryingKeys={new Set()}
        onRetry={onRetry}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /Повторить аналитику/ }))
    expect(onRetry).toHaveBeenCalledWith('cab-1', 'analytics')
  })

  it('disables ONLY the in-flight source (reports) — analytics stays enabled (AC5 concurrent guard)', () => {
    render(
      <BackfillRetryControls
        cabinet={cabinet('failed', 'failed')}
        retryingKeys={new Set(['cab-1:reports'])}
        onRetry={vi.fn()}
      />
    )
    const reportsBtn = screen.getByRole('button', { name: /Повторить отчёты/ })
    const analyticsBtn = screen.getByRole('button', { name: /Повторить аналитику/ })
    expect(reportsBtn).toBeDisabled()
    expect(analyticsBtn).toBeEnabled()
  })

  it('disables ONLY the in-flight source (analytics) — reports stays enabled', () => {
    render(
      <BackfillRetryControls
        cabinet={cabinet('failed', 'failed')}
        retryingKeys={new Set(['cab-1:analytics'])}
        onRetry={vi.fn()}
      />
    )
    expect(screen.getByRole('button', { name: /Повторить отчёты/ })).toBeEnabled()
    expect(screen.getByRole('button', { name: /Повторить аналитику/ })).toBeDisabled()
  })

  it('isolates in-flight state per cabinet — a different cabinet key never disables this one', () => {
    render(
      <BackfillRetryControls
        cabinet={cabinet('failed', 'failed')}
        retryingKeys={new Set(['cab-OTHER:reports'])}
        onRetry={vi.fn()}
      />
    )
    expect(screen.getByRole('button', { name: /Повторить отчёты/ })).toBeEnabled()
    expect(screen.getByRole('button', { name: /Повторить аналитику/ })).toBeEnabled()
  })

  it('marks the in-flight button aria-busy so assistive tech announces the pending state', () => {
    render(
      <BackfillRetryControls
        cabinet={cabinet('failed', 'completed')}
        retryingKeys={new Set(['cab-1:reports'])}
        onRetry={vi.fn()}
      />
    )
    expect(screen.getByRole('button', { name: /Повторить отчёты/ })).toHaveAttribute(
      'aria-busy',
      'true'
    )
  })
})
