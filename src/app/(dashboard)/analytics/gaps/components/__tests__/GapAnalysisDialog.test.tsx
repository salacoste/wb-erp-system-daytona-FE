import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { GapAnalysisDialog } from '../GapAnalysisDialog'
import { RootCause, RemediationAction } from '@/types/financial-gaps'
import type { GapAnalysisResponse } from '@/types/financial-gaps'

function createAnalysis(rootCause: RootCause): GapAnalysisResponse {
  return {
    missing_date: '2026-05-10',
    root_cause: rootCause,
    remediation: RemediationAction.RE_IMPORT,
    evidence: {
      imports: [],
      task_schedule: null,
      queue_errors: [],
      wb_api_status: 'ok',
    },
  }
}

function severityBadge() {
  // The root-cause label is rendered inside the severity Badge
  return screen.getByText('Ошибка импорта').closest('div')
}

describe('GapAnalysisDialog severity chips', () => {
  it('renders critical severity as an error /15 chip', () => {
    render(
      <GapAnalysisDialog
        isOpen={true}
        onOpenChange={vi.fn()}
        analysis={createAnalysis(RootCause.IMPORT_FAILURE)}
        isRemediating={false}
        onRemediate={vi.fn()}
      />
    )
    const badge = severityBadge()
    expect(badge).toHaveClass('bg-status-error/15', 'text-status-error', 'border-status-error/30')
    expect(badge).not.toHaveClass('bg-red-100', 'text-red-800')
  })

  it('renders warning severity as a warning /15 chip', () => {
    render(
      <GapAnalysisDialog
        isOpen={true}
        onOpenChange={vi.fn()}
        analysis={createAnalysis(RootCause.SCHEDULER_GAP)}
        isRemediating={false}
        onRemediate={vi.fn()}
      />
    )
    const badge = screen.getByText('Пропуск расписания').closest('div')
    expect(badge).toHaveClass(
      'bg-status-warning/15',
      'text-status-warning',
      'border-status-warning/30'
    )
    expect(badge).not.toHaveClass('bg-yellow-100', 'text-yellow-800')
  })

  it('renders info severity as an information /15 chip', () => {
    render(
      <GapAnalysisDialog
        isOpen={true}
        onOpenChange={vi.fn()}
        analysis={createAnalysis(RootCause.WB_API_ISSUE)}
        isRemediating={false}
        onRemediate={vi.fn()}
      />
    )
    const badge = screen.getByText('Проблема API WB').closest('div')
    expect(badge).toHaveClass(
      'bg-status-information/15',
      'text-status-information',
      'border-status-information/30'
    )
    expect(badge).not.toHaveClass('bg-blue-100', 'text-blue-800')
  })
})
