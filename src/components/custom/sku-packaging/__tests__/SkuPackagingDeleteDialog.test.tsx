import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRef, useState } from 'react'
import { renderWithProviders } from '@/test/utils/test-utils'
import { SkuPackagingDeleteDialog } from '../SkuPackagingDeleteDialog'
import { ApiError } from '@/types/api'
import type { SkuPackaging } from '@/types/shipment-cost'

const mockMutateAsync = vi.fn()
let mockIsPending = false

vi.mock('@/hooks/use-sku-packaging', () => ({
  useDeleteSkuPackaging: () => ({
    mutateAsync: mockMutateAsync,
    get isPending() {
      return mockIsPending
    },
  }),
}))

const mockItem: SkuPackaging = {
  nmId: 123456789,
  cabinetId: 'cab-001',
  boxTypeId: 'bt-001',
  unitsPerBox: 10,
  boxType: {
    id: 'bt-001',
    name: 'Коробка A',
    lengthCm: '60.00',
    widthCm: '40.00',
    heightCm: '30.00',
    volumeCm3: '72000.00',
    isActive: true,
  },
  product: {
    nmId: 123456789,
    vendorCode: 'ART-001',
    brand: 'TestBrand',
    subject: 'Футболка',
  },
  createdAt: '2026-03-10T00:00:00Z',
  updatedAt: '2026-03-10T00:00:00Z',
}

function FocusReturnHarness() {
  const [item, setItem] = useState<SkuPackaging | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  return (
    <>
      <button ref={triggerRef} onClick={() => setItem(mockItem)}>
        Открыть удаление SKU 123456789
      </button>
      <SkuPackagingDeleteDialog
        item={item}
        onClose={() => setItem(null)}
        returnFocusRef={triggerRef}
      />
    </>
  )
}

function RemovingRowFocusHarness() {
  const [item, setItem] = useState<SkuPackaging | null>(mockItem)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const stableFocusRef = useRef<HTMLElement>(null)

  return (
    <section ref={stableFocusRef} tabIndex={-1} aria-label="Упаковка товаров">
      {item && <button ref={triggerRef}>Удалить SKU 123456789</button>}
      <SkuPackagingDeleteDialog
        item={item}
        onClose={() => setItem(null)}
        returnFocusRef={triggerRef}
        successFocusRef={stableFocusRef}
      />
    </section>
  )
}

describe('SkuPackagingDeleteDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsPending = false
  })

  it('renders confirmation title', () => {
    renderWithProviders(<SkuPackagingDeleteDialog item={mockItem} onClose={vi.fn()} />)
    expect(screen.getByText('Удалить привязку упаковки?')).toBeInTheDocument()
  })

  it('shows item nmId and box type name in description', () => {
    renderWithProviders(<SkuPackagingDeleteDialog item={mockItem} onClose={vi.fn()} />)
    expect(screen.getByText(/123456789/)).toBeInTheDocument()
    expect(screen.getByText(/Коробка A/)).toBeInTheDocument()
  })

  it('uses regular Button (not AlertDialogAction) for delete', () => {
    renderWithProviders(<SkuPackagingDeleteDialog item={mockItem} onClose={vi.fn()} />)
    const deleteBtn = screen.getByRole('button', { name: 'Удалить' })
    expect(deleteBtn).toBeInTheDocument()
    expect(deleteBtn.tagName).toBe('BUTTON')
  })

  it('calls deleteMutation.mutateAsync with item nmId on confirm', async () => {
    const user = userEvent.setup()
    mockMutateAsync.mockResolvedValueOnce(undefined)

    renderWithProviders(<SkuPackagingDeleteDialog item={mockItem} onClose={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'Удалить' }))
    expect(mockMutateAsync).toHaveBeenCalledWith(123456789)
  })

  it('closes exactly once only after successful deletion', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    const onSuccess = vi.fn()
    mockMutateAsync.mockResolvedValueOnce(undefined)
    renderWithProviders(
      <SkuPackagingDeleteDialog item={mockItem} onClose={onClose} onSuccess={onSuccess} />
    )

    await user.click(screen.getByRole('button', { name: 'Удалить' }))

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1))
    expect(onSuccess).toHaveBeenCalledWith('Привязка упаковки SKU 123456789 удалена.')
  })

  it('announces a deletion failure and keeps the confirmation open', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    mockMutateAsync.mockRejectedValueOnce(new Error('Service unavailable'))
    renderWithProviders(<SkuPackagingDeleteDialog item={mockItem} onClose={onClose} />)

    await user.click(screen.getByRole('button', { name: 'Удалить' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Не удалось удалить привязку. Повторите попытку.'
    )
    expect(onClose).not.toHaveBeenCalled()
    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
  })

  it('maps a delete conflict to a bounded non-retryable domain message', async () => {
    const user = userEvent.setup()
    mockMutateAsync.mockRejectedValueOnce(new ApiError('Internal relation detail', 409))
    renderWithProviders(<SkuPackagingDeleteDialog item={mockItem} onClose={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'Удалить' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Привязка используется в поставке и не может быть удалена.'
    )
    expect(screen.queryByText('Internal relation detail')).not.toBeInTheDocument()
  })

  it('uses the box type identifier when malformed data has no package name', () => {
    renderWithProviders(
      <SkuPackagingDeleteDialog
        item={{ ...mockItem, boxType: { ...mockItem.boxType, name: '' } }}
        onClose={vi.fn()}
      />
    )

    expect(screen.getByText(/bt-001/)).toBeInTheDocument()
  })

  it('disables confirm button during pending mutation', () => {
    mockIsPending = true
    renderWithProviders(<SkuPackagingDeleteDialog item={mockItem} onClose={vi.fn()} />)
    expect(screen.getByRole('button', { name: /удаление/i })).toBeDisabled()
  })

  it('announces pending deletion and disables cancellation', () => {
    mockIsPending = true
    renderWithProviders(<SkuPackagingDeleteDialog item={mockItem} onClose={vi.fn()} />)

    expect(screen.getByRole('status')).toHaveTextContent('Удаляем привязку SKU 123456789')
    expect(screen.getByRole('button', { name: 'Отмена' })).toBeDisabled()
  })

  it('submits rapid confirmation only once before pending state renders', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    let resolveDelete!: () => void
    mockMutateAsync.mockReturnValueOnce(
      new Promise<void>(resolve => {
        resolveDelete = resolve
      })
    )
    renderWithProviders(<SkuPackagingDeleteDialog item={mockItem} onClose={onClose} />)

    await user.dblClick(screen.getByRole('button', { name: 'Удалить' }))

    expect(mockMutateAsync).toHaveBeenCalledTimes(1)
    resolveDelete()
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1))
  })

  it('returns focus to the exact row trigger after cancellation', async () => {
    const user = userEvent.setup()
    renderWithProviders(<FocusReturnHarness />)
    const trigger = screen.getByRole('button', { name: 'Открыть удаление SKU 123456789' })

    await user.click(trigger)
    await user.click(screen.getByRole('button', { name: 'Отмена' }))

    await waitFor(() => expect(trigger).toHaveFocus())
  })

  it('returns focus to a stable route target after successful row removal', async () => {
    const user = userEvent.setup()
    mockMutateAsync.mockResolvedValueOnce(undefined)
    renderWithProviders(<RemovingRowFocusHarness />)
    const stableTarget = document.querySelector<HTMLElement>(
      'section[aria-label="Упаковка товаров"]'
    )!

    await user.click(screen.getByRole('button', { name: 'Удалить' }))

    await waitFor(() => expect(screen.queryByText('Удалить SKU 123456789')).not.toBeInTheDocument())
    expect(stableTarget).toHaveFocus()
  })

  it('bounds the destructive confirmation within a narrow viewport', () => {
    renderWithProviders(<SkuPackagingDeleteDialog item={mockItem} onClose={vi.fn()} />)

    expect(screen.getByRole('alertdialog')).toHaveClass(
      'max-h-[calc(100dvh-2rem)]',
      'w-[calc(100%-2rem)]',
      'overflow-y-auto'
    )
  })
})
