/**
 * IntegrityChecksGrid Unit Tests
 *
 * Verifies checks grid rendering:
 * - Renders all six check types
 * - Displays pass/warn/fail status icons and labels
 * - Displays check counts
 * - Skips missing checks gracefully
 */

import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils/test-utils'
import { IntegrityChecksGrid } from '../IntegrityChecksGrid'
import type { CheckResult } from '@/types/orders-integrity'

const allChecksPassing: Record<string, CheckResult> = {
  duplicates: { status: 'pass', count: 0 },
  orphans: { status: 'pass', count: 0 },
  missing_history: { status: 'pass', count: 0 },
  duplicate_status_history: { status: 'pass', count: 5 },
  invalid_transitions: { status: 'pass', count: 0 },
  sync_overlaps: { status: 'pass', count: 2 },
}

describe('IntegrityChecksGrid', () => {
  it('renders all six check titles', () => {
    renderWithProviders(<IntegrityChecksGrid checks={allChecksPassing} />)
    expect(screen.getByText('Дубликаты')).toBeInTheDocument()
    expect(screen.getByText('Сироты')).toBeInTheDocument()
    expect(screen.getByText('Пропущенная история')).toBeInTheDocument()
    expect(screen.getByText('Дубли истории')).toBeInTheDocument()
    expect(screen.getByText('Неверные переходы')).toBeInTheDocument()
    expect(screen.getByText('Пересечения синхронизации')).toBeInTheDocument()
  })

  it('renders pass status as OK for passing checks', () => {
    renderWithProviders(<IntegrityChecksGrid checks={allChecksPassing} />)
    // All 6 checks have status 'pass', so 6 OK labels
    const okLabels = screen.getAllByText('OK')
    expect(okLabels).toHaveLength(6)
  })

  it('renders warn status with correct label', () => {
    const checks: Record<string, CheckResult> = {
      duplicates: { status: 'warn', count: 3 },
      orphans: { status: 'pass', count: 0 },
      missing_history: { status: 'pass', count: 0 },
      duplicate_status_history: { status: 'pass', count: 0 },
      invalid_transitions: { status: 'pass', count: 0 },
      sync_overlaps: { status: 'pass', count: 0 },
    }
    renderWithProviders(<IntegrityChecksGrid checks={checks} />)
    expect(screen.getByText('Внимание')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('renders fail status with correct label', () => {
    const checks: Record<string, CheckResult> = {
      duplicates: { status: 'pass', count: 0 },
      orphans: { status: 'fail', count: 12 },
      missing_history: { status: 'pass', count: 0 },
      duplicate_status_history: { status: 'pass', count: 0 },
      invalid_transitions: { status: 'pass', count: 0 },
      sync_overlaps: { status: 'pass', count: 0 },
    }
    renderWithProviders(<IntegrityChecksGrid checks={checks} />)
    expect(screen.getByText('Ошибка')).toBeInTheDocument()
    expect(screen.getByText('12')).toBeInTheDocument()
  })

  it('skips missing check keys gracefully', () => {
    const partialChecks: Record<string, CheckResult> = {
      duplicates: { status: 'pass', count: 0 },
    }
    renderWithProviders(<IntegrityChecksGrid checks={partialChecks} />)
    expect(screen.getByText('Дубликаты')).toBeInTheDocument()
    // Other check titles should not render (no check data)
    expect(screen.queryByText('Сироты')).not.toBeInTheDocument()
  })
})
