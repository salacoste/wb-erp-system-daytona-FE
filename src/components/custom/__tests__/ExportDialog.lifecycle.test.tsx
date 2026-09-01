import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('../export-dialog/ExportDialogForm', () => ({
  ExportDialogForm: () => <div>Параметры экспорта</div>,
}))

vi.mock('../ExportStatusDisplay', () => ({
  ExportStatusDisplay: () => <div>Статус экспорта</div>,
}))

vi.mock('../export-dialog/useExportDialogState', () => ({
  useExportDialogState: vi.fn(),
}))

import { ExportDialog } from '../ExportDialog'
import { useExportDialogState } from '../export-dialog/useExportDialogState'

const mockUseExportDialogState = vi.mocked(useExportDialogState)

function pendingState() {
  return {
    type: 'by-brand' as const,
    setType: vi.fn(),
    weekStart: '2026-W34',
    weekEnd: '2026-W35',
    format: 'xlsx' as const,
    setFormat: vi.fn(),
    includeCogs: true,
    setIncludeCogs: vi.fn(),
    isCreating: true,
    status: null,
    createError: null,
    handleExport: vi.fn(),
    handleClose: vi.fn(),
    handleRetry: vi.fn(),
    handleRangeChange: vi.fn(),
    showForm: true,
    showStatus: false,
    isCompleted: false,
    isFailed: false,
  }
}

describe('ExportDialog delegated route lifecycle', () => {
  it('renders the delegated by-brand export pending state with the route defaults', () => {
    mockUseExportDialogState.mockReturnValue(pendingState())

    render(
      <ExportDialog
        open
        onOpenChange={vi.fn()}
        defaultType="by-brand"
        defaultWeekStart="2026-W34"
        defaultWeekEnd="2026-W35"
      />
    )

    expect(screen.getByRole('button', { name: 'Создание...' })).toBeDisabled()
    expect(mockUseExportDialogState).toHaveBeenCalledWith(
      expect.objectContaining({
        open: true,
        defaultType: 'by-brand',
        defaultWeekStart: '2026-W34',
        defaultWeekEnd: '2026-W35',
      })
    )
  })

  it('renders the delegated by-category export pending state with the route defaults', () => {
    mockUseExportDialogState.mockReturnValue({ ...pendingState(), type: 'by-category' })

    render(
      <ExportDialog
        open
        onOpenChange={vi.fn()}
        defaultType="by-category"
        defaultWeekStart="2026-W34"
        defaultWeekEnd="2026-W35"
      />
    )

    expect(screen.getByRole('button', { name: 'Создание...' })).toBeDisabled()
    expect(mockUseExportDialogState).toHaveBeenCalledWith(
      expect.objectContaining({
        open: true,
        defaultType: 'by-category',
        defaultWeekStart: '2026-W34',
        defaultWeekEnd: '2026-W35',
      })
    )
  })
})
