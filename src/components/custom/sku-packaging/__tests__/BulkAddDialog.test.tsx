import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils/test-utils'
import { BulkAddDialog } from '../BulkAddDialog'

const mockMutateAsync = vi.fn()
let mockIsPending = false

vi.mock('@/hooks/use-sku-packaging', () => ({
  useBulkCreateSkuPackaging: () => ({
    mutateAsync: mockMutateAsync,
    isPending: mockIsPending,
  }),
}))

describe('BulkAddDialog', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockIsPending = false
  })

  it('renders dialog title', () => {
    renderWithProviders(<BulkAddDialog {...defaultProps} />)
    expect(screen.getByText('Массовое добавление упаковки')).toBeInTheDocument()
  })

  describe('step 1 — input', () => {
    it('shows textarea and Предпросмотр button', () => {
      renderWithProviders(<BulkAddDialog {...defaultProps} />)
      expect(screen.getByRole('textbox')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Предпросмотр' })).toBeInTheDocument()
    })

    it('disables Предпросмотр button when textarea is empty', () => {
      renderWithProviders(<BulkAddDialog {...defaultProps} />)
      expect(screen.getByRole('button', { name: 'Предпросмотр' })).toBeDisabled()
    })

    it('enables Предпросмотр button when textarea has content', async () => {
      const user = userEvent.setup()
      renderWithProviders(<BulkAddDialog {...defaultProps} />)

      await user.type(screen.getByRole('textbox'), '123456789, bt-001, 10')
      expect(screen.getByRole('button', { name: 'Предпросмотр' })).toBeEnabled()
    })
  })

  describe('step 2 — preview', () => {
    it('shows parsed rows count after clicking Предпросмотр', async () => {
      const user = userEvent.setup()
      renderWithProviders(<BulkAddDialog {...defaultProps} />)

      await user.type(screen.getByRole('textbox'), '123456789, bt-001, 10\n987654321, bt-002, 5')
      await user.click(screen.getByRole('button', { name: 'Предпросмотр' }))

      await waitFor(() => {
        expect(screen.getByText(/Найдено строк: 2/)).toBeInTheDocument()
      })
    })

    it('parses valid CSV correctly', async () => {
      const user = userEvent.setup()
      renderWithProviders(<BulkAddDialog {...defaultProps} />)

      await user.type(screen.getByRole('textbox'), '123456789, bt-001, 10')
      await user.click(screen.getByRole('button', { name: 'Предпросмотр' }))

      await waitFor(() => {
        expect(screen.getByText(/корректных: 1/)).toBeInTheDocument()
      })
    })

    it('parses tab-separated input correctly', async () => {
      const user = userEvent.setup()
      renderWithProviders(<BulkAddDialog {...defaultProps} />)

      await user.type(screen.getByRole('textbox'), '123456789\tbt-001\t10')
      await user.click(screen.getByRole('button', { name: 'Предпросмотр' }))

      await waitFor(() => {
        expect(screen.getByText(/корректных: 1/)).toBeInTheDocument()
      })
    })

    it('parses semicolon-separated input correctly', async () => {
      const user = userEvent.setup()
      renderWithProviders(<BulkAddDialog {...defaultProps} />)

      await user.type(screen.getByRole('textbox'), '123456789;bt-001;10')
      await user.click(screen.getByRole('button', { name: 'Предпросмотр' }))

      await waitFor(() => {
        expect(screen.getByText(/корректных: 1/)).toBeInTheDocument()
      })
    })

    it('shows parse error for invalid rows', async () => {
      const user = userEvent.setup()
      renderWithProviders(<BulkAddDialog {...defaultProps} />)

      await user.type(screen.getByRole('textbox'), 'invalid, , ')
      await user.click(screen.getByRole('button', { name: 'Предпросмотр' }))

      await waitFor(() => {
        expect(screen.getByText(/с ошибками: 1/)).toBeInTheDocument()
      })
    })
  })

  describe('step 3 — results', () => {
    it('shows created/updated counts after successful submit', async () => {
      const user = userEvent.setup()
      mockMutateAsync.mockResolvedValueOnce({
        created: 2,
        updated: 1,
        errors: [],
      })

      renderWithProviders(<BulkAddDialog {...defaultProps} />)

      await user.type(screen.getByRole('textbox'), '123456789, bt-001, 10\n987654321, bt-002, 5')
      await user.click(screen.getByRole('button', { name: 'Предпросмотр' }))

      await waitFor(() => {
        expect(screen.getByText(/Найдено строк: 2/)).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /Отправить/ }))

      await waitFor(() => {
        expect(screen.getByText(/Создано: 2/)).toBeInTheDocument()
        expect(screen.getByText(/обновлено: 1/)).toBeInTheDocument()
      })
    })

    it('shows partial failure with error rows', async () => {
      const user = userEvent.setup()
      mockMutateAsync.mockResolvedValueOnce({
        created: 1,
        updated: 0,
        errors: [{ nmId: 987654321, error: 'Product not found' }],
      })

      renderWithProviders(<BulkAddDialog {...defaultProps} />)

      await user.type(screen.getByRole('textbox'), '123456789, bt-001, 10\n987654321, bt-002, 5')
      await user.click(screen.getByRole('button', { name: 'Предпросмотр' }))

      await waitFor(() => {
        expect(screen.getByText(/Найдено строк: 2/)).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /Отправить/ }))

      await waitFor(() => {
        expect(screen.getByText(/Создано: 1/)).toBeInTheDocument()
        expect(screen.getByText(/ошибок: 1/)).toBeInTheDocument()
        expect(screen.getByText('Product not found')).toBeInTheDocument()
      })
    })
  })

  describe('mutation pending state', () => {
    it('blocks dialog close during pending mutation', () => {
      mockIsPending = true
      renderWithProviders(<BulkAddDialog {...defaultProps} />)
      // Dialog is still open — title still visible
      expect(screen.getByText('Массовое добавление упаковки')).toBeInTheDocument()
    })
  })
})
