/**
 * Tests for BoxTypeDeactivateDialog component
 * Epic 75-FE, Story 75.2: Box Types CRUD Page (AC: #5, #7)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe, toHaveNoViolations } from 'jest-axe'
import { renderWithProviders } from '@/test/utils/test-utils'
import { BoxTypeDeactivateDialog } from '../BoxTypeDeactivateDialog'
import type { BoxType } from '@/types/shipment-cost'
import { useRef, useState } from 'react'

expect.extend(toHaveNoViolations)

const mockMutateAsync = vi.fn()

vi.mock('@/hooks/use-box-types', () => ({
  useDeactivateBoxType: vi.fn(() => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  })),
}))

const mockBoxType: BoxType = {
  id: 'bt-001',
  cabinetId: 'cab-001',
  name: 'Коробка A',
  lengthCm: '60.00',
  widthCm: '40.00',
  heightCm: '30.00',
  volumeCm3: '72000.00',
  isActive: true,
  createdAt: '2026-03-10T00:00:00Z',
  updatedAt: '2026-03-10T00:00:00Z',
}

function FocusReturnHarness() {
  const [boxType, setBoxType] = useState<BoxType | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  return (
    <>
      <button ref={triggerRef} onClick={() => setBoxType(mockBoxType)}>
        Открыть деактивацию
      </button>
      <BoxTypeDeactivateDialog
        boxType={boxType}
        onClose={() => setBoxType(null)}
        returnFocusRef={triggerRef}
      />
    </>
  )
}

function RemovingRowFocusHarness() {
  const [boxType, setBoxType] = useState<BoxType | null>(mockBoxType)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const stableFocusRef = useRef<HTMLElement>(null)

  return (
    <section ref={stableFocusRef} tabIndex={-1} aria-label="Типы коробок">
      {boxType && <button ref={triggerRef}>Деактивировать строку</button>}
      <BoxTypeDeactivateDialog
        boxType={boxType}
        onClose={() => setBoxType(null)}
        returnFocusRef={triggerRef}
        successFocusRef={stableFocusRef}
      />
    </section>
  )
}

function SwitchingErrorHarness() {
  const [boxType, setBoxType] = useState<BoxType | null>(mockBoxType)

  return (
    <>
      <button onClick={() => setBoxType({ ...mockBoxType, id: 'bt-002', name: 'Коробка B' })}>
        Открыть другую коробку
      </button>
      <BoxTypeDeactivateDialog boxType={boxType} onClose={() => setBoxType(null)} />
    </>
  )
}

describe('BoxTypeDeactivateDialog', () => {
  const onClose = vi.fn()

  beforeEach(async () => {
    vi.clearAllMocks()
    const { useDeactivateBoxType } = await import('@/hooks/use-box-types')
    vi.mocked(useDeactivateBoxType).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useDeactivateBoxType>)
  })

  it('renders confirmation title', () => {
    renderWithProviders(<BoxTypeDeactivateDialog boxType={mockBoxType} onClose={onClose} />)

    expect(screen.getByText('Деактивировать тип коробки?')).toBeInTheDocument()
  })

  it('renders box type name in description', () => {
    renderWithProviders(<BoxTypeDeactivateDialog boxType={mockBoxType} onClose={onClose} />)

    expect(screen.getByText(/Коробка A/)).toBeInTheDocument()
  })

  it('uses Button (not AlertDialogAction) for confirmation', () => {
    renderWithProviders(<BoxTypeDeactivateDialog boxType={mockBoxType} onClose={onClose} />)

    const confirmButton = screen.getByRole('button', { name: /деактивировать$/i })
    // Button component renders <button>, not an AlertDialogAction
    expect(confirmButton.tagName).toBe('BUTTON')
    expect(confirmButton).toBeInTheDocument()
  })

  it('calls mutateAsync with boxType.id on confirm click', async () => {
    const user = userEvent.setup()
    mockMutateAsync.mockResolvedValue(undefined)
    renderWithProviders(<BoxTypeDeactivateDialog boxType={mockBoxType} onClose={onClose} />)

    await user.click(screen.getByRole('button', { name: /деактивировать$/i }))

    expect(mockMutateAsync).toHaveBeenCalledWith('bt-001')
  })

  it('disables confirm button during pending state', async () => {
    const { useDeactivateBoxType } = await import('@/hooks/use-box-types')
    vi.mocked(useDeactivateBoxType).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: true,
    } as unknown as ReturnType<typeof useDeactivateBoxType>)

    renderWithProviders(<BoxTypeDeactivateDialog boxType={mockBoxType} onClose={onClose} />)

    expect(screen.getByRole('button', { name: /деактивация/i })).toBeDisabled()
  })

  it('announces pending deactivation', async () => {
    const { useDeactivateBoxType } = await import('@/hooks/use-box-types')
    vi.mocked(useDeactivateBoxType).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: true,
    } as unknown as ReturnType<typeof useDeactivateBoxType>)

    renderWithProviders(<BoxTypeDeactivateDialog boxType={mockBoxType} onClose={onClose} />)

    expect(screen.getByRole('status')).toHaveTextContent('Деактивируем тип коробки')
  })

  it('disables cancellation during pending deactivation', async () => {
    const { useDeactivateBoxType } = await import('@/hooks/use-box-types')
    vi.mocked(useDeactivateBoxType).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: true,
    } as unknown as ReturnType<typeof useDeactivateBoxType>)

    renderWithProviders(<BoxTypeDeactivateDialog boxType={mockBoxType} onClose={onClose} />)

    expect(screen.getByRole('button', { name: 'Отмена' })).toBeDisabled()
  })

  it('closes exactly once when cancellation is activated', async () => {
    const user = userEvent.setup()
    renderWithProviders(<BoxTypeDeactivateDialog boxType={mockBoxType} onClose={onClose} />)

    await user.click(screen.getByRole('button', { name: 'Отмена' }))

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('closes only after a successful deactivation', async () => {
    const user = userEvent.setup()
    mockMutateAsync.mockResolvedValueOnce(mockBoxType)
    renderWithProviders(<BoxTypeDeactivateDialog boxType={mockBoxType} onClose={onClose} />)

    await user.click(screen.getByRole('button', { name: /деактивировать$/i }))

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('announces the binding conflict', async () => {
    const user = userEvent.setup()
    mockMutateAsync.mockRejectedValueOnce(new Error('409 Conflict'))
    renderWithProviders(<BoxTypeDeactivateDialog boxType={mockBoxType} onClose={onClose} />)

    await user.click(screen.getByRole('button', { name: /деактивировать$/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Невозможно деактивировать — есть привязки к товарам'
    )
  })

  it('keeps the confirmation open after a binding conflict', async () => {
    const user = userEvent.setup()
    mockMutateAsync.mockRejectedValueOnce(new Error('409 Conflict'))
    renderWithProviders(<BoxTypeDeactivateDialog boxType={mockBoxType} onClose={onClose} />)

    await user.click(screen.getByRole('button', { name: /деактивировать$/i }))

    await screen.findByRole('alert')
    expect(onClose).not.toHaveBeenCalled()
  })

  it('announces a generic deactivation failure without closing', async () => {
    const user = userEvent.setup()
    mockMutateAsync.mockRejectedValueOnce(new Error('Service unavailable'))
    renderWithProviders(<BoxTypeDeactivateDialog boxType={mockBoxType} onClose={onClose} />)

    await user.click(screen.getByRole('button', { name: /деактивировать$/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Service unavailable')
    expect(onClose).not.toHaveBeenCalled()
  })

  it('returns focus to the exact row trigger after cancel', async () => {
    const user = userEvent.setup()
    renderWithProviders(<FocusReturnHarness />)
    const trigger = screen.getByRole('button', { name: 'Открыть деактивацию' })

    await user.click(trigger)
    await user.click(screen.getByRole('button', { name: 'Отмена' }))

    await waitFor(() => expect(trigger).toHaveFocus())
  })

  it('returns focus to a stable route target after the active row is removed', async () => {
    const user = userEvent.setup()
    mockMutateAsync.mockResolvedValueOnce(mockBoxType)
    renderWithProviders(<RemovingRowFocusHarness />)
    const trigger = screen.getByText('Деактивировать строку').closest('button')!
    const stableTarget = document.querySelector<HTMLElement>('section[aria-label="Типы коробок"]')!

    await user.click(screen.getByRole('button', { name: /деактивировать$/i }))

    await waitFor(() => expect(trigger).not.toBeInTheDocument())
    expect(stableTarget).toHaveFocus()
  })

  it('submits a rapid deactivation activation only once before pending state renders', async () => {
    const user = userEvent.setup()
    let resolveDeactivate!: (value: BoxType) => void
    mockMutateAsync.mockReset()
    mockMutateAsync.mockReturnValueOnce(
      new Promise(resolve => {
        resolveDeactivate = resolve
      })
    )
    renderWithProviders(<BoxTypeDeactivateDialog boxType={mockBoxType} onClose={onClose} />)

    await user.dblClick(screen.getByRole('button', { name: /деактивировать$/i }))

    expect(mockMutateAsync).toHaveBeenCalledTimes(1)
    resolveDeactivate(mockBoxType)
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1))
  })

  it('does not announce a previous box error for a newly selected box type', async () => {
    const user = userEvent.setup()
    mockMutateAsync.mockRejectedValueOnce(new Error('409 Conflict'))
    renderWithProviders(<SwitchingErrorHarness />)

    await user.click(screen.getByRole('button', { name: /деактивировать$/i }))
    await screen.findByRole('alert')
    await user.click(screen.getByRole('button', { name: 'Отмена' }))
    await user.click(screen.getByRole('button', { name: 'Открыть другую коробку' }))

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByText(/Коробка B/)).toBeInTheDocument()
  })

  it('does not restore a previous error when the same box type is reopened', async () => {
    const user = userEvent.setup()
    mockMutateAsync.mockRejectedValueOnce(new Error('409 Conflict'))
    renderWithProviders(<FocusReturnHarness />)

    await user.click(screen.getByRole('button', { name: 'Открыть деактивацию' }))
    await user.click(screen.getByRole('button', { name: /деактивировать$/i }))
    await screen.findByRole('alert')
    await user.click(screen.getByRole('button', { name: 'Отмена' }))
    await user.click(screen.getByRole('button', { name: 'Открыть деактивацию' }))

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('bounds the confirmation dialog within a narrow viewport', () => {
    renderWithProviders(<BoxTypeDeactivateDialog boxType={mockBoxType} onClose={onClose} />)

    expect(screen.getByRole('alertdialog')).toHaveClass(
      'max-h-[calc(100dvh-2rem)]',
      'w-[calc(100%-2rem)]',
      'overflow-y-auto'
    )
  })

  it('has no detectable accessibility violations in the failure state', async () => {
    const user = userEvent.setup()
    mockMutateAsync.mockRejectedValueOnce(new Error('409 Conflict'))
    const { baseElement } = renderWithProviders(
      <BoxTypeDeactivateDialog boxType={mockBoxType} onClose={onClose} />
    )

    await user.click(screen.getByRole('button', { name: /деактивировать$/i }))
    await screen.findByRole('alert')

    expect(await axe(baseElement)).toHaveNoViolations()
  })
})
