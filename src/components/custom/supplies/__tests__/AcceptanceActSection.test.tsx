/**
 * Story O5: AcceptanceActSection component tests.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils/test-utils'
import { AcceptanceActSection } from '../AcceptanceActSection'
import type { SupplyDocument } from '@/types/supplies'

const storedAct: SupplyDocument = {
  type: 'acceptance_act',
  format: 'xlsx',
  generatedAt: '2026-07-05T12:00:00Z',
  downloadUrl: '/v1/supplies/supply-1/acceptance-act',
  sizeBytes: 2048,
}

describe('AcceptanceActSection (Story O5)', () => {
  const onUpload = vi.fn()
  const onDownload = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the empty state (no stored act, no download button)', () => {
    renderWithProviders(
      <AcceptanceActSection storedAct={null} onUpload={onUpload} onDownload={onDownload} />
    )
    expect(screen.getByText('Акт приёмки ещё не загружен')).toBeInTheDocument()
    expect(screen.queryByTestId('acceptance-act-download-btn')).toBeNull()
  })

  it('renders the stored indicator + download button when an act is stored', () => {
    renderWithProviders(
      <AcceptanceActSection storedAct={storedAct} onUpload={onUpload} onDownload={onDownload} />
    )
    expect(screen.getByText(/Загружен/)).toBeInTheDocument()
    expect(screen.getByTestId('acceptance-act-download-btn')).toBeInTheDocument()
  })

  it('fires onDownload when «Скачать» clicked', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <AcceptanceActSection storedAct={storedAct} onUpload={onUpload} onDownload={onDownload} />
    )
    await user.click(screen.getByTestId('acceptance-act-download-btn'))
    expect(onDownload).toHaveBeenCalledTimes(1)
  })

  it('announces an acceptance-act upload in progress', () => {
    renderWithProviders(
      <AcceptanceActSection
        storedAct={null}
        onUpload={onUpload}
        onDownload={onDownload}
        uploadPending
      />
    )

    expect(screen.getByRole('status')).toHaveTextContent('Акт приёмки загружается')
  })

  it('announces acceptance-act download preparation', () => {
    renderWithProviders(
      <AcceptanceActSection
        storedAct={storedAct}
        onUpload={onUpload}
        onDownload={onDownload}
        downloadPending
      />
    )

    expect(screen.getByRole('status')).toHaveTextContent(
      'Акт приёмки подготавливается к скачиванию'
    )
  })

  it('uploads a valid .xlsx file picked via the hidden input', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <AcceptanceActSection storedAct={null} onUpload={onUpload} onDownload={onDownload} />
    )
    const file = new File(['x'], 'act.xlsx', { type: 'application/vnd.ms-excel' })
    await user.upload(screen.getByTestId('acceptance-act-file-input'), file)

    expect(onUpload).toHaveBeenCalledWith(file)
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('rejects an unsupported extension with a validation message (no upload)', () => {
    renderWithProviders(
      <AcceptanceActSection storedAct={null} onUpload={onUpload} onDownload={onDownload} />
    )
    const file = new File(['x'], 'act.pdf', { type: 'application/pdf' })
    // fireEvent.change bypasses the input's `accept` filter so onChange sees the pdf.
    fireEvent.change(screen.getByTestId('acceptance-act-file-input'), {
      target: { files: [file] },
    })

    expect(onUpload).not.toHaveBeenCalled()
    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent('Поддерживаются только файлы .xlsx и .zip')
  })
})
