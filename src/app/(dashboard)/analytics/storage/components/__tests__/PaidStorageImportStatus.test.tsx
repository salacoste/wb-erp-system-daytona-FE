/**
 * Story 169.12: import result-state contracts — 4-state machine distinctness,
 * focusable result summaries with bounded live announcements, and the neutral
 * unknown-status hint (Task 0 preface follow-up; NOT error-red).
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@/test/utils/test-utils'
import {
  ImportIdleForm,
  ImportProcessing,
  ImportSuccess,
  ImportError,
} from '../PaidStorageImportStatus'

const noop = () => {}

describe('PaidStorageImportStatus - Story 169.12 contracts', () => {
  it('idle form renders labelled date inputs', () => {
    render(
      <ImportIdleForm
        dateFrom="2026-03-01"
        dateTo="2026-03-07"
        setDateFrom={noop}
        setDateTo={noop}
        validationError={null}
        isPending={false}
        onStart={noop}
        onCancel={noop}
      />
    )
    expect(screen.getByLabelText('С')).toBeInTheDocument()
    expect(screen.getByLabelText('По')).toBeInTheDocument()
  })

  it('processing renders without the unknown hint by default', () => {
    render(<ImportProcessing />)
    expect(screen.getByText('Импорт выполняется...')).toBeInTheDocument()
    expect(screen.queryByText('Статус импорта неизвестен')).not.toBeInTheDocument()
  })

  it('unknown poll status renders a NEUTRAL muted hint (not error-red)', () => {
    const { container } = render(<ImportProcessing statusUnknown />)
    const hint = screen.getByText('Статус импорта неизвестен')
    expect(hint).toHaveClass('text-muted-foreground')
    expect(hint).not.toHaveClass('text-status-error')
    expect(hint.className).not.toContain('destructive')
    expect(container.textContent).toContain('Импорт выполняется...')
  })

  it('success is a focusable bounded live summary with status-success icon', () => {
    render(
      <ImportSuccess rowsImported={1234} dateFrom="2026-03-01" dateTo="2026-03-07" onClose={noop} />
    )
    const summary = screen.getByRole('status')
    expect(summary).toHaveAttribute('tabIndex', '0')
    expect(screen.getByText('Импорт завершён!')).toBeInTheDocument()
    expect(screen.getByText('Импортировано строк: 1 234')).toBeInTheDocument()
    const icon = screen.getByRole('status').querySelector('svg')
    expect(icon).toHaveClass('text-status-success')
  })

  it('renders an unavailable marker when the completed row count is absent', () => {
    render(
      <ImportSuccess
        rowsImported={undefined}
        dateFrom="2026-03-01"
        dateTo="2026-03-07"
        onClose={noop}
      />
    )
    expect(screen.getByText('Импортировано строк: —')).toBeInTheDocument()
  })

  it('error shows the safe nested message, stable code, and whole-range retry scope', () => {
    render(
      <ImportError
        code="UNKNOWN_QUEUE_STATE"
        message="WB API недоступен"
        onClose={noop}
        onRetry={noop}
      />
    )
    const alert = screen.getByRole('alert')
    expect(alert).toHaveAttribute('tabIndex', '0')
    expect(screen.getByText('Ошибка импорта')).toBeInTheDocument()
    expect(screen.getByText('WB API недоступен')).toBeInTheDocument()
    expect(screen.getByText(/UNKNOWN_QUEUE_STATE/)).toBeInTheDocument()
    expect(
      screen.getByText(
        'Для повторной попытки вернитесь к форме и запустите импорт для всего выбранного периода.'
      )
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Вернуться к периоду' })).toBeInTheDocument()
    expect(alert).not.toHaveTextContent('частично')
    expect(alert.querySelector('svg')).toHaveClass('text-status-error')
  })

  it('does not fabricate a failure code when structured detail is absent', () => {
    render(<ImportError message="Ошибка импорта" onClose={noop} onRetry={noop} />)
    expect(screen.queryByText(/Код ошибки:/)).not.toBeInTheDocument()
  })
})
