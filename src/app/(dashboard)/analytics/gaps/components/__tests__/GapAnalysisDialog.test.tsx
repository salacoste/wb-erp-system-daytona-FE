import { describe, it, expect, vi } from 'vitest'
import { useRef, useState } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '@/components/ui/button'
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

const emptyReturnFocusRef = { current: null }

function DialogHarness({
  closeOnRemediate = false,
  removeInvokerOnRemediate = false,
}: {
  closeOnRemediate?: boolean
  removeInvokerOnRemediate?: boolean
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [showInvoker, setShowInvoker] = useState(true)
  const invokingActionRef = useRef<HTMLButtonElement>(null)
  const fallbackFocusRef = useRef<HTMLButtonElement>(null)

  return (
    <>
      <Button ref={fallbackFocusRef}>Диапазон дат</Button>
      {showInvoker && (
        <Button ref={invokingActionRef} onClick={() => setIsOpen(true)}>
          Анализ за 10.05.2026
        </Button>
      )}
      <GapAnalysisDialog
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        analysis={createAnalysis(RootCause.IMPORT_FAILURE)}
        isRemediating={false}
        onRemediate={() => {
          if (removeInvokerOnRemediate) setShowInvoker(false)
          if (closeOnRemediate) setIsOpen(false)
        }}
        returnFocusRef={invokingActionRef}
        fallbackFocusRef={fallbackFocusRef}
      />
    </>
  )
}

describe('GapAnalysisDialog severity chips', () => {
  it('keeps both dialog footer actions at the 44px touch target', () => {
    render(
      <GapAnalysisDialog
        isOpen={true}
        onOpenChange={vi.fn()}
        analysis={createAnalysis(RootCause.IMPORT_FAILURE)}
        isRemediating={false}
        onRemediate={vi.fn()}
        returnFocusRef={emptyReturnFocusRef}
        fallbackFocusRef={emptyReturnFocusRef}
      />
    )

    const closeAction = screen
      .getAllByRole('button', { name: 'Закрыть' })
      .find(button => button.textContent === 'Закрыть')

    expect(closeAction).toHaveClass('min-h-11')
    expect(screen.getByRole('button', { name: 'Исправить' })).toHaveClass('min-h-11')
  })

  it('bounds long evidence inside the viewport while keeping actions reachable', () => {
    const analysis = createAnalysis(RootCause.IMPORT_FAILURE)
    const importEvidence = `IMPORT_${'x'.repeat(160)}`
    const queueEvidence = `QUEUE_${'y'.repeat(160)}`
    const apiEvidence = `API_${'z'.repeat(160)}`
    analysis.evidence.imports = Array.from({ length: 12 }, (_, index) => ({
      id: `import-${index}`,
      status: 'failed',
      error_message: index === 0 ? importEvidence : `Ошибка импорта ${index}`,
      created_at: '2026-05-10T10:00:00Z',
    }))
    analysis.evidence.queue_errors = [queueEvidence]
    analysis.evidence.wb_api_status = apiEvidence

    render(
      <GapAnalysisDialog
        isOpen={true}
        onOpenChange={vi.fn()}
        analysis={analysis}
        isRemediating={false}
        onRemediate={vi.fn()}
        returnFocusRef={emptyReturnFocusRef}
        fallbackFocusRef={emptyReturnFocusRef}
      />
    )

    expect(screen.getByRole('dialog')).toHaveClass('max-h-[calc(100dvh-2rem)]', 'overflow-y-auto')
    expect(screen.getByText(importEvidence)).toHaveClass('[overflow-wrap:anywhere]')
    expect(screen.getByText(queueEvidence)).toHaveClass('[overflow-wrap:anywhere]')
    expect(screen.getByText(apiEvidence)).toHaveClass('[overflow-wrap:anywhere]')
    expect(screen.getByRole('button', { name: 'Исправить' })).toBeVisible()
  })

  it('contains forward and reverse tab focus while the dialog is open', async () => {
    const user = userEvent.setup()
    render(<DialogHarness />)

    await user.click(screen.getByRole('button', { name: 'Анализ за 10.05.2026' }))
    const dialog = screen.getByRole('dialog', { name: 'Анализ пропуска' })

    for (let step = 0; step < 5; step += 1) {
      await user.tab()
      expect(dialog).toContainElement(document.activeElement as HTMLElement)
    }

    for (let step = 0; step < 5; step += 1) {
      await user.tab({ shift: true })
      expect(dialog).toContainElement(document.activeElement as HTMLElement)
    }
  })

  it('preserves the dialog title, Escape dismissal, and focus return to the invoking action', async () => {
    const user = userEvent.setup()
    render(<DialogHarness />)
    const invokingAction = screen.getByRole('button', { name: 'Анализ за 10.05.2026' })

    await user.click(invokingAction)

    const dialog = screen.getByRole('dialog', { name: 'Анализ пропуска' })
    expect(dialog).toContainElement(document.activeElement as HTMLElement)

    await user.keyboard('{Escape}')
    await waitFor(() => expect(invokingAction).toHaveFocus())

    await user.click(invokingAction)
    const closeAction = screen
      .getAllByRole('button', { name: 'Закрыть' })
      .find(button => button.textContent === 'Закрыть')
    expect(closeAction).toBeDefined()
    await user.click(closeAction!)
    await waitFor(() => expect(invokingAction).toHaveFocus())
  })

  it('returns focus after the primary remediation action closes the dialog', async () => {
    const user = userEvent.setup()
    render(<DialogHarness closeOnRemediate />)
    const invokingAction = screen.getByRole('button', { name: 'Анализ за 10.05.2026' })

    await user.click(invokingAction)
    await user.click(screen.getByRole('button', { name: 'Исправить' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await waitFor(() => expect(invokingAction).toHaveFocus())
  })

  it('returns focus to the stable fallback when remediation removes the invoking row', async () => {
    const user = userEvent.setup()
    render(<DialogHarness closeOnRemediate removeInvokerOnRemediate />)
    const invokingAction = screen.getByRole('button', { name: 'Анализ за 10.05.2026' })
    const fallbackAction = screen.getByRole('button', { name: 'Диапазон дат' })

    await user.click(invokingAction)
    await user.click(screen.getByRole('button', { name: 'Исправить' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Анализ за 10.05.2026' })).not.toBeInTheDocument()
    await waitFor(() => expect(fallbackAction).toHaveFocus())
  })

  it('renders critical severity as an error /15 chip', () => {
    render(
      <GapAnalysisDialog
        isOpen={true}
        onOpenChange={vi.fn()}
        analysis={createAnalysis(RootCause.IMPORT_FAILURE)}
        isRemediating={false}
        onRemediate={vi.fn()}
        returnFocusRef={emptyReturnFocusRef}
        fallbackFocusRef={emptyReturnFocusRef}
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
        returnFocusRef={emptyReturnFocusRef}
        fallbackFocusRef={emptyReturnFocusRef}
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
        returnFocusRef={emptyReturnFocusRef}
        fallbackFocusRef={emptyReturnFocusRef}
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
