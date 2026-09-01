import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen } from '@/test/utils/test-utils'
import type { ImportState } from '../storage-import-utils'

// Mock the useStorageImport hook
const mockHandleClose = vi.fn()
const mockHandleStartImport = vi.fn()
const mockHandleReset = vi.fn()
const mockSetDateFrom = vi.fn()
const mockSetDateTo = vi.fn()
const mockHandleConfirmClose = vi.fn()
const mockSetShowCloseConfirm = vi.fn()

interface MockImportStateHolder {
  current: ImportState
  validationError: string | null
}

const mockImportState = vi.hoisted<MockImportStateHolder>(() => ({
  current: { status: 'idle' },
  validationError: null,
}))

vi.mock('../useStorageImport', () => ({
  useStorageImport: () => ({
    dateFrom: '2026-03-01',
    dateTo: '2026-03-08',
    setDateFrom: mockSetDateFrom,
    setDateTo: mockSetDateTo,
    importState: mockImportState.current,
    showCloseConfirm: false,
    setShowCloseConfirm: mockSetShowCloseConfirm,
    validationError: mockImportState.validationError,
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
    mockImportState.current = { status: 'idle' }
    mockImportState.validationError = null
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

  it('keeps invalid paid-storage dates visible and associates the validation message', () => {
    mockImportState.validationError = 'Период не может превышать 8 дней'

    render(<PaidStorageImportDialog open={true} onOpenChange={vi.fn()} />)

    expect(screen.getByLabelText('С')).toHaveValue('2026-03-01')
    expect(screen.getByLabelText('По')).toHaveValue('2026-03-08')
    expect(screen.getByText('Период не может превышать 8 дней')).toBeInTheDocument()
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

  it('wires authoritative failure detail and whole-range recovery through the dialog', () => {
    mockImportState.current = {
      status: 'error',
      code: 'UNKNOWN_QUEUE_STATE',
      message: 'Не удалось определить состояние очереди',
    }

    render(<PaidStorageImportDialog open={true} onOpenChange={vi.fn()} />)

    expect(screen.getByText('Не удалось определить состояние очереди')).toBeInTheDocument()
    expect(screen.getByText(/UNKNOWN_QUEUE_STATE/)).toBeInTheDocument()
    expect(
      screen.getByText(
        'Для повторной попытки вернитесь к форме и запустите импорт для всего выбранного периода.'
      )
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Вернуться к периоду' }))
    expect(mockHandleReset).toHaveBeenCalledTimes(1)
  })
})
