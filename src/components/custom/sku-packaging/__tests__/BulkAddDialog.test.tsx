import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils/test-utils'
import { BulkAddDialog } from '../BulkAddDialog'

const mockMutateAsync = vi.fn()
const mockRefetchBoxTypes = vi.fn()
let mockIsPending = false
let mockBoxTypesError = false

vi.mock('@/hooks/use-sku-packaging', () => ({
  useBulkCreateSkuPackaging: () => ({
    mutateAsync: mockMutateAsync,
    isPending: mockIsPending,
  }),
}))

vi.mock('@/hooks/use-box-types', () => ({
  useBoxTypes: () => ({
    data: mockBoxTypesError
      ? undefined
      : [
          { id: 'bt-001', name: 'Коробка A', isActive: true },
          { id: 'bt-002', name: 'Коробка B', isActive: true },
        ],
    isLoading: false,
    isError: mockBoxTypesError,
    refetch: mockRefetchBoxTypes,
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
    mockBoxTypesError = false
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

    it('blocks preview and exposes retry when box types fail', async () => {
      const user = userEvent.setup()
      mockBoxTypesError = true
      renderWithProviders(<BulkAddDialog {...defaultProps} />)

      await user.type(screen.getByRole('textbox'), '123456789, bt-001, 10')

      expect(screen.getByRole('button', { name: 'Предпросмотр' })).toBeDisabled()
      expect(screen.getByRole('alert')).toHaveTextContent('Не удалось загрузить типы коробок.')
      await user.click(screen.getByRole('button', { name: 'Повторить' }))
      expect(mockRefetchBoxTypes).toHaveBeenCalledTimes(1)
      expect(screen.queryByText(/не найден или неактивен/i)).not.toBeInTheDocument()
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
      expect(
        screen.getByRole('table', { name: 'Предпросмотр массового добавления упаковки' })
      ).toBeInTheDocument()
      expect(
        screen.getByRole('region', {
          name: 'Предпросмотр массового добавления упаковки: горизонтальная прокрутка',
        })
      ).toHaveAttribute('tabindex', '0')
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
    it('submits only valid rows through the unchanged bulk payload', async () => {
      const user = userEvent.setup()
      const onSuccess = vi.fn()
      mockMutateAsync.mockResolvedValueOnce({ created: 1, updated: 0, errors: [] })
      renderWithProviders(<BulkAddDialog {...defaultProps} onSuccess={onSuccess} />)

      await user.type(screen.getByRole('textbox'), '123456789, bt-001, 10\ninvalid, bt-002, 5')
      await user.click(screen.getByRole('button', { name: 'Предпросмотр' }))
      await user.click(await screen.findByRole('button', { name: 'Отправить (1)' }))

      expect(mockMutateAsync).toHaveBeenCalledTimes(1)
      expect(mockMutateAsync).toHaveBeenCalledWith({
        items: [{ nmId: 123456789, boxTypeId: 'bt-001', unitsPerBox: 10 }],
      })
      const close = (await screen.findAllByRole('button', { name: 'Закрыть' })).find(
        button => button.textContent === 'Закрыть'
      )!
      await user.click(close)
      expect(onSuccess).toHaveBeenCalledWith(
        'Массовая обработка завершена: создано 1, обновлено 0, ошибок 1.'
      )
    })

    it('shows created/updated counts after successful submit', async () => {
      const user = userEvent.setup()
      mockMutateAsync.mockResolvedValueOnce({
        created: 1,
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
        const result = screen
          .getAllByRole('status')
          .find(node => node.textContent?.includes('Создано:'))
        expect(result).toHaveTextContent(/Создано: 1/)
        expect(result).toHaveTextContent(/обновлено: 1/)
        expect(screen.getAllByText('Сохранено')).toHaveLength(2)
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
        const result = screen
          .getAllByRole('status')
          .find(node => node.textContent?.includes('Создано:'))
        expect(result).toHaveTextContent(/Создано: 1/)
        expect(result).toHaveTextContent(/ошибок: 1/)
        expect(
          screen.getByText('Не удалось сохранить эту привязку. Проверьте данные.')
        ).toBeInTheDocument()
        expect(screen.queryByText('Product not found')).not.toBeInTheDocument()
      })
    })

    it('does not present an inconsistent server count as successful', async () => {
      const user = userEvent.setup()
      mockMutateAsync.mockResolvedValueOnce({ created: 2, updated: 1, errors: [] })
      renderWithProviders(<BulkAddDialog {...defaultProps} />)

      await user.type(screen.getByRole('textbox'), '123456789, bt-001, 10\n987654321, bt-002, 5')
      await user.click(screen.getByRole('button', { name: 'Предпросмотр' }))
      await user.click(screen.getByRole('button', { name: 'Отправить (2)' }))

      expect(
        await screen.findAllByText('Не удалось подтвердить результат сохранения.')
      ).toHaveLength(2)
      expect(screen.queryByText('Сохранено')).not.toBeInTheDocument()
    })

    it('announces a transport failure and preserves every submitted row as failed', async () => {
      const user = userEvent.setup()
      mockMutateAsync.mockRejectedValueOnce(new Error('Service unavailable'))
      renderWithProviders(<BulkAddDialog {...defaultProps} />)

      await user.type(screen.getByRole('textbox'), '123456789, bt-001, 10\n987654321, bt-002, 5')
      await user.click(screen.getByRole('button', { name: 'Предпросмотр' }))
      await user.click(await screen.findByRole('button', { name: 'Отправить (2)' }))

      expect(await screen.findByRole('alert')).toHaveTextContent('Часть привязок не сохранена')
      expect(
        screen.getAllByText('Не удалось выполнить массовое добавление. Повторите попытку.')
      ).toHaveLength(2)
      expect(defaultProps.onClose).not.toHaveBeenCalled()
    })

    it('closes exactly once from the result state', async () => {
      const user = userEvent.setup()
      const onSuccess = vi.fn()
      mockMutateAsync.mockResolvedValueOnce({ created: 1, updated: 0, errors: [] })
      renderWithProviders(<BulkAddDialog {...defaultProps} onSuccess={onSuccess} />)

      await user.type(screen.getByRole('textbox'), '123456789, bt-001, 10')
      await user.click(screen.getByRole('button', { name: 'Предпросмотр' }))
      await user.click(await screen.findByRole('button', { name: 'Отправить (1)' }))
      const close = (await screen.findAllByRole('button', { name: 'Закрыть' })).find(
        button => button.textContent === 'Закрыть'
      )!
      await user.click(close)

      expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
      expect(onSuccess).toHaveBeenCalledWith(
        'Массовая обработка завершена: создано 1, обновлено 0, ошибок 0.'
      )
    })
  })

  describe('mutation pending state', () => {
    it('announces pending work and blocks navigation, submission, and dialog close', async () => {
      const user = userEvent.setup()
      mockIsPending = true
      renderWithProviders(<BulkAddDialog {...defaultProps} />)

      await user.type(screen.getByRole('textbox'), '123456789, bt-001, 10')
      await user.click(screen.getByRole('button', { name: 'Предпросмотр' }))
      expect(screen.getByRole('status')).toHaveTextContent('Отправляем привязки')
      expect(screen.getByRole('button', { name: 'Назад' })).toBeDisabled()
      expect(screen.getByRole('button', { name: 'Отправка...' })).toBeDisabled()
      await user.click(screen.getByRole('button', { name: 'Закрыть' }))
      expect(defaultProps.onClose).not.toHaveBeenCalled()
    })

    it('submits rapid activation only once before pending state renders', async () => {
      const user = userEvent.setup()
      let resolveSubmit!: (value: { created: number; updated: number; errors: [] }) => void
      mockMutateAsync.mockReturnValueOnce(
        new Promise(resolve => {
          resolveSubmit = resolve
        })
      )
      renderWithProviders(<BulkAddDialog {...defaultProps} />)

      await user.type(screen.getByRole('textbox'), '123456789, bt-001, 10')
      await user.click(screen.getByRole('button', { name: 'Предпросмотр' }))
      await user.dblClick(await screen.findByRole('button', { name: 'Отправить (1)' }))

      expect(mockMutateAsync).toHaveBeenCalledTimes(1)
      resolveSubmit({ created: 1, updated: 0, errors: [] })
      expect(await screen.findByText(/Создано: 1/)).toBeInTheDocument()
    })
  })

  it('bounds the bulk workflow within a narrow viewport', () => {
    renderWithProviders(<BulkAddDialog {...defaultProps} />)

    expect(screen.getByRole('dialog')).toHaveClass(
      'max-h-[calc(100dvh-2rem)]',
      'w-[calc(100%-2rem)]',
      'overflow-y-auto'
    )
  })
})
