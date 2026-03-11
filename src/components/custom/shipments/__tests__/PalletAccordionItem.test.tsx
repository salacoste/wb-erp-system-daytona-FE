import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PalletAccordionItem } from '../PalletAccordionItem'
import type { Pallet } from '@/types/shipment-cost'

const mockPallet: Pallet = {
  id: 'p-1',
  shipmentId: 's-001',
  palletNumber: 1,
  boxLines: [
    {
      id: 'bl-1',
      palletId: 'p-1',
      nmId: 123,
      boxCount: 5,
      totalUnits: null,
      unitCostRub: null,
      boxVolume: null,
      totalVolume: null,
      volumeShare: null,
      allocatedDeliveryCost: null,
      deliveryCostPerUnit: null,
      finalCostPerUnit: null,
      finalCostLine: null,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    },
    {
      id: 'bl-2',
      palletId: 'p-1',
      nmId: 456,
      boxCount: 3,
      totalUnits: null,
      unitCostRub: null,
      boxVolume: null,
      totalVolume: null,
      volumeShare: null,
      allocatedDeliveryCost: null,
      deliveryCostPerUnit: null,
      finalCostPerUnit: null,
      finalCostLine: null,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    },
  ],
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}

let mockOnRemove: ReturnType<typeof vi.fn>

describe('PalletAccordionItem', () => {
  beforeEach(() => {
    mockOnRemove = vi.fn()
  })

  it('renders pallet number and box line count', () => {
    render(
      <PalletAccordionItem
        pallet={mockPallet}
        isDraft={false}
        onRemove={mockOnRemove}
        isPending={false}
      />
    )
    expect(screen.getByText(/Паллета #1/)).toBeInTheDocument()
    expect(screen.getByText('(2 товаров)')).toBeInTheDocument()
  })

  it('shows default placeholder when collapsed, shows children when expanded', async () => {
    const user = userEvent.setup()
    render(
      <PalletAccordionItem
        pallet={mockPallet}
        isDraft={false}
        onRemove={mockOnRemove}
        isPending={false}
      >
        <p>Child content here</p>
      </PalletAccordionItem>
    )
    // Content not in DOM when collapsed (Radix removes it)
    expect(screen.queryByText('Child content here')).not.toBeInTheDocument()
    // Expand via trigger
    await user.click(screen.getByLabelText('Раскрыть паллету 1'))
    expect(screen.getByText('Child content here')).toBeVisible()
  })

  it('shows fallback text when no children provided and expanded', async () => {
    const user = userEvent.setup()
    render(
      <PalletAccordionItem
        pallet={mockPallet}
        isDraft={false}
        onRemove={mockOnRemove}
        isPending={false}
      />
    )
    await user.click(screen.getByLabelText('Раскрыть паллету 1'))
    expect(screen.getByText('Товары будут добавлены позже')).toBeVisible()
  })

  it('does NOT render delete button when isDraft is false', () => {
    render(
      <PalletAccordionItem
        pallet={mockPallet}
        isDraft={false}
        onRemove={mockOnRemove}
        isPending={false}
      />
    )
    expect(screen.queryByLabelText('Удалить паллету 1')).not.toBeInTheDocument()
  })

  it('renders delete button when isDraft is true and opens AlertDialog on click', async () => {
    const user = userEvent.setup()
    render(
      <PalletAccordionItem
        pallet={mockPallet}
        isDraft={true}
        onRemove={mockOnRemove}
        isPending={false}
      />
    )
    const deleteBtn = screen.getByLabelText('Удалить паллету 1')
    expect(deleteBtn).toBeInTheDocument()
    await user.click(deleteBtn)
    expect(screen.getByText('Удалить паллету #1?')).toBeInTheDocument()
    expect(
      screen.getByText('При удалении паллеты будут удалены все товары в ней.')
    ).toBeInTheDocument()
  })

  it('calls onRemove with pallet id when confirming delete', async () => {
    const user = userEvent.setup()
    render(
      <PalletAccordionItem
        pallet={mockPallet}
        isDraft={true}
        onRemove={mockOnRemove}
        isPending={false}
      />
    )
    await user.click(screen.getByLabelText('Удалить паллету 1'))
    await user.click(screen.getByRole('button', { name: 'Удалить' }))
    expect(mockOnRemove).toHaveBeenCalledOnce()
    expect(mockOnRemove).toHaveBeenCalledWith('p-1')
  })

  it('disables cancel and confirm buttons when isPending, shows loading text', async () => {
    const user = userEvent.setup()
    render(
      <PalletAccordionItem
        pallet={mockPallet}
        isDraft={true}
        onRemove={mockOnRemove}
        isPending={true}
      />
    )
    await user.click(screen.getByLabelText('Удалить паллету 1'))
    expect(screen.getByText('Удаление...')).toBeInTheDocument()
    const cancelBtn = screen.getByRole('button', { name: 'Отмена' })
    const confirmBtn = screen.getByRole('button', { name: 'Удаление...' })
    expect(cancelBtn).toBeDisabled()
    expect(confirmBtn).toBeDisabled()
  })

  it('renders expanded by default when defaultOpen is true', () => {
    render(
      <PalletAccordionItem
        pallet={mockPallet}
        isDraft={false}
        onRemove={mockOnRemove}
        isPending={false}
        defaultOpen={true}
      >
        <p>Visible immediately</p>
      </PalletAccordionItem>
    )
    expect(screen.getByText('Visible immediately')).toBeVisible()
  })
})
