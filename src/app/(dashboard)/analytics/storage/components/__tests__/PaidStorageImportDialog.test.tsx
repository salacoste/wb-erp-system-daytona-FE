import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@/test/utils/test-utils'

// Mock the useStorageImport hook
const mockHandleClose = vi.fn()
const mockHandleStartImport = vi.fn()
const mockHandleReset = vi.fn()
const mockSetDateFrom = vi.fn()
const mockSetDateTo = vi.fn()
const mockHandleConfirmClose = vi.fn()
const mockSetShowCloseConfirm = vi.fn()

vi.mock('../useStorageImport', () => ({
  useStorageImport: () => ({
    dateFrom: '2026-03-01',
    dateTo: '2026-03-08',
    setDateFrom: mockSetDateFrom,
    setDateTo: mockSetDateTo,
    importState: { status: 'idle' },
    showCloseConfirm: false,
    setShowCloseConfirm: mockSetShowCloseConfirm,
    validationError: null,
    statusData: null,
    isPending: false,
    handleStartImport: mockHandleStartImport,
    handleClose: mockHandleClose,
    handleConfirmClose: mockHandleConfirmClose,
    handleReset: mockHandleReset,
  }),
}))

vi.mock('../storage-import-utils', () => ({
  formatDateDisplay: vi.fn((d: string) => d),
}))

import { PaidStorageImportDialog } from '../PaidStorageImportDialog'

describe('PaidStorageImportDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders dialog title when open', () => {
    render(<PaidStorageImportDialog open={true} onOpenChange={vi.fn()} />)
    expect(screen.getByText('Импорт данных о хранении')).toBeInTheDocument()
  })

  it('renders date inputs', () => {
    render(<PaidStorageImportDialog open={true} onOpenChange={vi.fn()} />)
    expect(screen.getByLabelText('С')).toBeInTheDocument()
    expect(screen.getByLabelText('По')).toBeInTheDocument()
  })

  it('renders start import button', () => {
    render(<PaidStorageImportDialog open={true} onOpenChange={vi.fn()} />)
    expect(screen.getByText('Начать импорт')).toBeInTheDocument()
  })

  it('renders cancel button', () => {
    render(<PaidStorageImportDialog open={true} onOpenChange={vi.fn()} />)
    expect(screen.getByText('Отмена')).toBeInTheDocument()
  })

  it('renders WB API period limitation notice', () => {
    render(<PaidStorageImportDialog open={true} onOpenChange={vi.fn()} />)
    expect(screen.getByText(/максимальный период: 8 дней/i)).toBeInTheDocument()
  })

  it('renders auto-import schedule info', () => {
    render(<PaidStorageImportDialog open={true} onOpenChange={vi.fn()} />)
    expect(screen.getByText(/автоматический импорт.*вторник/i)).toBeInTheDocument()
  })

  it('renders dialog description', () => {
    render(<PaidStorageImportDialog open={true} onOpenChange={vi.fn()} />)
    expect(screen.getByText('Загрузка данных о платном хранении из WB API')).toBeInTheDocument()
  })
})
