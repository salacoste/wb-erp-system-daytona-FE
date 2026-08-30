import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { RefObject } from 'react'

import { render } from '@/test/utils/test-utils'

const mockPageState = vi.fn()

vi.mock('../useSkuPackagingPageState', () => ({
  useSkuPackagingPageState: () => mockPageState(),
}))

vi.mock('@/components/custom/sku-packaging', () => ({
  SkuPackagingEmptyState: ({
    onCreateClick,
  }: {
    onCreateClick: (trigger: HTMLButtonElement) => void
  }) => (
    <button data-testid="empty-state" onClick={event => onCreateClick(event.currentTarget)}>
      Пустое состояние
    </button>
  ),
  SkuPackagingFilterToolbar: ({
    query,
    onQueryChange,
    onReset,
    inputRef,
  }: {
    query: string
    onQueryChange: (value: string) => void
    onReset: () => void
    inputRef: RefObject<HTMLInputElement | null>
  }) => (
    <div>
      <label htmlFor="packaging-filter">Поиск привязок</label>
      <input
        ref={inputRef}
        id="packaging-filter"
        aria-label="Поиск привязок"
        value={query}
        onChange={event => onQueryChange(event.target.value)}
      />
      <button onClick={onReset}>Сбросить поиск</button>
    </div>
  ),
  SkuPackagingTable: ({ items }: { items: unknown[] }) => (
    <div data-testid="packaging-table">Таблица: {items.length}</div>
  ),
  SkuPackagingFormDialog: ({
    open,
    onSuccess,
  }: {
    open: boolean
    onSuccess: (message: string) => void
  }) => (
    <div data-testid="form-dialog" data-open={open}>
      {open && (
        <button onClick={() => onSuccess('Упаковка SKU 123456789 сохранена.')}>
          Завершить сохранение
        </button>
      )}
    </div>
  ),
  SkuPackagingDeleteDialog: ({ item }: { item: unknown }) => (
    <div data-testid="delete-dialog" data-open={!!item} />
  ),
  BulkAddDialog: ({ open }: { open: boolean }) => (
    <div data-testid="bulk-dialog" data-open={open} />
  ),
}))

import SkuPackagingPage from '../page'

function state(overrides: Record<string, unknown> = {}) {
  return {
    items: [],
    filteredItems: [],
    query: '',
    setQuery: vi.fn(),
    clearQuery: vi.fn(),
    hasBoxTypes: true,
    isLoading: false,
    isFetching: false,
    isError: false,
    isBoxTypesError: false,
    error: null,
    refetch: vi.fn(),
    refetchBoxTypes: vi.fn(),
    isCreateOpen: false,
    handleCreate: vi.fn(),
    isBulkOpen: false,
    handleBulk: vi.fn(),
    editingItem: null,
    deletingItem: null,
    handleEdit: vi.fn(),
    handleDelete: vi.fn(),
    handleFormClose: vi.fn(),
    handleDeleteClose: vi.fn(),
    handleBulkClose: vi.fn(),
    returnFocusRef: { current: null },
    ...overrides,
  }
}

describe('SkuPackagingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPageState.mockReturnValue(state())
  })

  it('preserves route identity and announces the combined dependency loading state', () => {
    mockPageState.mockReturnValue(state({ isLoading: true, isFetching: true }))

    render(<SkuPackagingPage />)

    expect(screen.getByRole('heading', { level: 1, name: 'Упаковка товаров' })).toBeInTheDocument()
    expect(
      screen.getAllByText('Получаем привязки SKU и доступные типы коробок текущего кабинета.')
    ).not.toHaveLength(0)
    expect(screen.getByRole('heading', { name: 'Загружаем привязки упаковки' })).toBeInTheDocument()
  })

  it('renders a safe packaging-query failure and retries exactly once', async () => {
    const user = userEvent.setup()
    const refetch = vi.fn()
    mockPageState.mockReturnValue(
      state({ isError: true, error: new Error('Sensitive backend detail'), refetch })
    )

    render(<SkuPackagingPage />)

    expect(screen.getByRole('alert')).toHaveAccessibleName('Не удалось загрузить привязки упаковки')
    expect(screen.queryByText('Sensitive backend detail')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Повторить' }))
    expect(refetch).toHaveBeenCalledTimes(1)
  })

  it('disables repeated packaging retry while recovery is fetching', () => {
    mockPageState.mockReturnValue(state({ isError: true, isFetching: true }))

    render(<SkuPackagingPage />)

    expect(screen.getByRole('button', { name: 'Повторяем...' })).toBeDisabled()
  })

  it('truthfully blocks mutations when the box-type dependency fails', () => {
    mockPageState.mockReturnValue(
      state({
        isBoxTypesError: true,
        items: [{ nmId: 123456789 }],
        filteredItems: [{ nmId: 123456789 }],
      })
    )

    render(<SkuPackagingPage />)

    expect(screen.getByRole('alert')).toHaveAccessibleName('Не удалось проверить типы коробок')
    expect(screen.queryByRole('button', { name: 'Добавить упаковку' })).not.toBeInTheDocument()
    expect(screen.queryByTestId('packaging-table')).not.toBeInTheDocument()
  })

  it('opens creation from the exact empty-state trigger', async () => {
    const user = userEvent.setup()
    const handleCreate = vi.fn()
    mockPageState.mockReturnValue(state({ handleCreate }))
    render(<SkuPackagingPage />)
    const trigger = screen.getByTestId('empty-state')

    await user.click(trigger)

    expect(handleCreate).toHaveBeenCalledWith(trigger)
  })

  it('renders stable header actions for loaded data and preserves their invoking triggers', async () => {
    const user = userEvent.setup()
    const handleCreate = vi.fn()
    const handleBulk = vi.fn()
    const item = { nmId: 123456789 }
    mockPageState.mockReturnValue(
      state({ items: [item], filteredItems: [item], handleCreate, handleBulk })
    )
    render(<SkuPackagingPage />)

    expect(screen.getByRole('navigation', { name: 'Навигация по странице' })).toBeInTheDocument()
    const create = screen.getByRole('button', { name: 'Добавить упаковку' })
    const bulk = screen.getByRole('button', { name: 'Массовое добавление' })
    await user.click(create)
    await user.click(bulk)
    expect(handleCreate).toHaveBeenCalledWith(create)
    expect(handleBulk).toHaveBeenCalledWith(bulk)
  })

  it('renders only client-filtered items without changing route ownership', () => {
    const allItems = [{ nmId: 1 }, { nmId: 2 }]
    mockPageState.mockReturnValue(
      state({ items: allItems, filteredItems: [allItems[1]], query: '2' })
    )

    render(<SkuPackagingPage />)

    expect(screen.getByTestId('packaging-table')).toHaveTextContent('Таблица: 1')
    expect(screen.getByLabelText('Поиск привязок')).toHaveValue('2')
  })

  it('renders filtered-empty recovery and resets the presentation-local query', async () => {
    const user = userEvent.setup()
    const clearQuery = vi.fn()
    mockPageState.mockReturnValue(
      state({ items: [{ nmId: 1 }], filteredItems: [], query: 'нет', clearQuery })
    )

    render(<SkuPackagingPage />)

    expect(
      screen.getAllByText('Измените поисковый запрос или покажите все привязки.')
    ).not.toHaveLength(0)
    expect(
      screen.getByRole('heading', { name: 'По фильтру ничего не найдено' })
    ).toBeInTheDocument()
    expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Показать все привязки' }))
    expect(clearQuery).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(screen.getByLabelText('Поиск привязок')).toHaveFocus())
  })

  it('keeps a dialog success announcement in the route DOM', async () => {
    const user = userEvent.setup()
    mockPageState.mockReturnValue(state({ isCreateOpen: true }))

    render(<SkuPackagingPage />)
    await user.click(screen.getByRole('button', { name: 'Завершить сохранение' }))

    expect(screen.getByRole('status')).toHaveTextContent('Упаковка SKU 123456789 сохранена.')
  })
})
