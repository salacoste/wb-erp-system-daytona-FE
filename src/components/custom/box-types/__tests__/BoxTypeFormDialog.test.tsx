/**
 * Tests for BoxTypeFormDialog component
 * Epic 75-FE, Story 75.2: Box Types CRUD Page (AC: #3, #4, #7)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe, toHaveNoViolations } from 'jest-axe'
import { renderWithProviders } from '@/test/utils/test-utils'
import { BoxTypeFormDialog } from '../BoxTypeFormDialog'
import type { BoxType } from '@/types/shipment-cost'
import { useRef, useState } from 'react'

expect.extend(toHaveNoViolations)

const mockCreateMutateAsync = vi.fn()
const mockUpdateMutateAsync = vi.fn()

vi.mock('@/hooks/use-box-types', () => ({
  useCreateBoxType: vi.fn(() => ({
    mutateAsync: mockCreateMutateAsync,
    isPending: false,
  })),
  useUpdateBoxType: vi.fn(() => ({
    mutateAsync: mockUpdateMutateAsync,
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

function FocusReturnHarness({ boxType }: { boxType: BoxType | null }) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)

  return (
    <>
      <button ref={triggerRef} onClick={() => setOpen(true)}>
        {boxType ? 'Открыть редактирование' : 'Открыть создание'}
      </button>
      <BoxTypeFormDialog
        open={open}
        boxType={boxType}
        onClose={() => setOpen(false)}
        returnFocusRef={triggerRef}
      />
    </>
  )
}

function ReplacingCreateTriggerHarness() {
  const [open, setOpen] = useState(false)
  const [created, setCreated] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const stableFocusRef = useRef<HTMLElement>(null)

  return (
    <section ref={stableFocusRef} tabIndex={-1} aria-label="Типы коробок">
      {!created && (
        <button ref={triggerRef} onClick={() => setOpen(true)}>
          Открыть создание из пустого состояния
        </button>
      )}
      {created && <p>Таблица типов коробок</p>}
      <BoxTypeFormDialog
        open={open}
        boxType={null}
        onClose={() => {
          setOpen(false)
          setCreated(true)
        }}
        returnFocusRef={triggerRef}
        successFocusRef={stableFocusRef}
        focusFallbackOnSuccess
      />
    </section>
  )
}

describe('BoxTypeFormDialog', () => {
  const onClose = vi.fn()

  beforeEach(async () => {
    vi.clearAllMocks()
    const { useCreateBoxType, useUpdateBoxType } = await import('@/hooks/use-box-types')
    vi.mocked(useCreateBoxType).mockReturnValue({
      mutateAsync: mockCreateMutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useCreateBoxType>)
    vi.mocked(useUpdateBoxType).mockReturnValue({
      mutateAsync: mockUpdateMutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateBoxType>)
  })

  it('renders create dialog title when boxType is null', () => {
    renderWithProviders(<BoxTypeFormDialog open boxType={null} onClose={onClose} />)

    expect(screen.getByText('Добавить тип коробки')).toBeInTheDocument()
  })

  it('renders edit dialog title when boxType is provided', () => {
    renderWithProviders(<BoxTypeFormDialog open boxType={mockBoxType} onClose={onClose} />)

    expect(screen.getByText('Редактировать тип коробки')).toBeInTheDocument()
  })

  it('pre-fills form inputs in edit mode', () => {
    renderWithProviders(<BoxTypeFormDialog open boxType={mockBoxType} onClose={onClose} />)

    expect(screen.getByLabelText('Название')).toHaveValue('Коробка A')
    expect(screen.getByLabelText('Длина (см)')).toHaveValue(60)
    expect(screen.getByLabelText('Ширина (см)')).toHaveValue(40)
    expect(screen.getByLabelText('Высота (см)')).toHaveValue(30)
  })

  it('shows validation error when name is empty on submit', async () => {
    const user = userEvent.setup()
    renderWithProviders(<BoxTypeFormDialog open boxType={null} onClose={onClose} />)

    await user.click(screen.getByRole('button', { name: /создать/i }))

    await waitFor(() => {
      expect(screen.getByText('Название обязательно')).toBeInTheDocument()
    })
  })

  it('sets aria-invalid and aria-describedby on inputs with errors', async () => {
    const user = userEvent.setup()
    renderWithProviders(<BoxTypeFormDialog open boxType={null} onClose={onClose} />)

    await user.click(screen.getByRole('button', { name: /создать/i }))

    await waitFor(() => {
      const nameInput = screen.getByLabelText('Название')
      expect(nameInput).toHaveAttribute('aria-invalid', 'true')
      expect(nameInput).toHaveAttribute('aria-describedby', 'bt-name-error')
    })
  })

  it('calls createMutation with form data on valid submit', async () => {
    const user = userEvent.setup()
    mockCreateMutateAsync.mockResolvedValueOnce({ id: 'bt-new' })
    renderWithProviders(<BoxTypeFormDialog open boxType={null} onClose={onClose} />)

    await user.type(screen.getByLabelText('Название'), 'Новая коробка')
    await user.type(screen.getByLabelText('Длина (см)'), '50')
    await user.type(screen.getByLabelText('Ширина (см)'), '30')
    await user.type(screen.getByLabelText('Высота (см)'), '20')
    await user.click(screen.getByRole('button', { name: /создать/i }))

    await waitFor(() => {
      expect(mockCreateMutateAsync).toHaveBeenCalledWith({
        name: 'Новая коробка',
        lengthCm: 50,
        widthCm: 30,
        heightCm: 20,
      })
    })
  })

  it('disables submit button during pending mutation', async () => {
    const { useCreateBoxType } = await import('@/hooks/use-box-types')
    vi.mocked(useCreateBoxType).mockReturnValue({
      mutateAsync: mockCreateMutateAsync,
      isPending: true,
    } as unknown as ReturnType<typeof useCreateBoxType>)

    renderWithProviders(<BoxTypeFormDialog open boxType={null} onClose={onClose} />)

    expect(screen.getByRole('button', { name: /сохранение/i })).toBeDisabled()
  })

  it('focuses the first invalid field after submit', async () => {
    const user = userEvent.setup()
    renderWithProviders(<BoxTypeFormDialog open boxType={null} onClose={onClose} />)

    await user.click(screen.getByRole('button', { name: /создать/i }))

    expect(screen.getByLabelText('Название')).toHaveFocus()
  })

  it.each(['Длина (см)', 'Ширина (см)', 'Высота (см)'])(
    'associates the invalid %s dimension with its error',
    async label => {
      const user = userEvent.setup()
      renderWithProviders(<BoxTypeFormDialog open boxType={null} onClose={onClose} />)

      await user.click(screen.getByRole('button', { name: /создать/i }))

      const input = screen.getByLabelText(label)
      expect(input).toHaveAttribute('aria-invalid', 'true')
      expect(input).toHaveAccessibleDescription(/должна быть больше 0/i)
    }
  )

  it('suppresses mutation when validation fails', async () => {
    const user = userEvent.setup()
    renderWithProviders(<BoxTypeFormDialog open boxType={null} onClose={onClose} />)

    await user.click(screen.getByRole('button', { name: /создать/i }))

    expect(mockCreateMutateAsync).not.toHaveBeenCalled()
  })

  it('submits the unchanged update contract and closes after success', async () => {
    const user = userEvent.setup()
    mockUpdateMutateAsync.mockResolvedValueOnce(mockBoxType)
    renderWithProviders(<BoxTypeFormDialog open boxType={mockBoxType} onClose={onClose} />)

    await user.clear(screen.getByLabelText('Ширина (см)'))
    await user.type(screen.getByLabelText('Ширина (см)'), '45.5')
    await user.click(screen.getByRole('button', { name: 'Сохранить' }))

    await waitFor(() => {
      expect(mockUpdateMutateAsync).toHaveBeenCalledWith({
        id: 'bt-001',
        data: {
          name: 'Коробка A',
          lengthCm: 60,
          widthCm: 45.5,
          heightCm: 30,
        },
      })
      expect(onClose).toHaveBeenCalledTimes(1)
    })
  })

  it('announces pending create', async () => {
    const { useCreateBoxType } = await import('@/hooks/use-box-types')
    vi.mocked(useCreateBoxType).mockReturnValue({
      mutateAsync: mockCreateMutateAsync,
      isPending: true,
    } as unknown as ReturnType<typeof useCreateBoxType>)

    renderWithProviders(<BoxTypeFormDialog open boxType={null} onClose={onClose} />)

    expect(screen.getByRole('status')).toHaveTextContent('Сохраняем тип коробки')
  })

  it('announces pending edit', async () => {
    const { useUpdateBoxType } = await import('@/hooks/use-box-types')
    vi.mocked(useUpdateBoxType).mockReturnValue({
      mutateAsync: mockUpdateMutateAsync,
      isPending: true,
    } as unknown as ReturnType<typeof useUpdateBoxType>)

    renderWithProviders(<BoxTypeFormDialog open boxType={mockBoxType} onClose={onClose} />)

    expect(screen.getByRole('status')).toHaveTextContent('Сохраняем тип коробки')
    expect(screen.getByRole('button', { name: 'Отмена' })).toBeDisabled()
    expect(screen.getByRole('button', { name: /сохранение/i })).toBeDisabled()
  })

  it('blocks cancellation while create is pending', async () => {
    const { useCreateBoxType } = await import('@/hooks/use-box-types')
    vi.mocked(useCreateBoxType).mockReturnValue({
      mutateAsync: mockCreateMutateAsync,
      isPending: true,
    } as unknown as ReturnType<typeof useCreateBoxType>)

    renderWithProviders(<BoxTypeFormDialog open boxType={null} onClose={onClose} />)

    expect(screen.getByRole('button', { name: 'Отмена' })).toBeDisabled()
  })

  it('maps duplicate-name failure to an announced recoverable error', async () => {
    const user = userEvent.setup()
    mockCreateMutateAsync.mockRejectedValueOnce(new Error('409 Conflict'))
    renderWithProviders(<BoxTypeFormDialog open boxType={null} onClose={onClose} />)

    await user.type(screen.getByLabelText('Название'), 'Коробка A')
    await user.type(screen.getByLabelText('Длина (см)'), '50')
    await user.type(screen.getByLabelText('Ширина (см)'), '30')
    await user.type(screen.getByLabelText('Высота (см)'), '20')
    await user.click(screen.getByRole('button', { name: /создать/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Тип коробки с таким названием уже существует'
    )
  })

  it('keeps the dialog open after duplicate-name failure', async () => {
    const user = userEvent.setup()
    mockCreateMutateAsync.mockRejectedValueOnce(new Error('409 Conflict'))
    renderWithProviders(<BoxTypeFormDialog open boxType={null} onClose={onClose} />)

    await user.type(screen.getByLabelText('Название'), 'Коробка A')
    await user.type(screen.getByLabelText('Длина (см)'), '50')
    await user.type(screen.getByLabelText('Ширина (см)'), '30')
    await user.type(screen.getByLabelText('Высота (см)'), '20')
    await user.click(screen.getByRole('button', { name: /создать/i }))

    await screen.findByRole('alert')
    expect(onClose).not.toHaveBeenCalled()
  })

  it('announces a generic save failure without closing', async () => {
    const user = userEvent.setup()
    mockCreateMutateAsync.mockRejectedValueOnce(new Error('Service unavailable'))
    renderWithProviders(<BoxTypeFormDialog open boxType={null} onClose={onClose} />)

    await user.type(screen.getByLabelText('Название'), 'Новая коробка')
    await user.type(screen.getByLabelText('Длина (см)'), '50')
    await user.type(screen.getByLabelText('Ширина (см)'), '30')
    await user.type(screen.getByLabelText('Высота (см)'), '20')
    await user.click(screen.getByRole('button', { name: 'Создать' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Service unavailable')
    expect(onClose).not.toHaveBeenCalled()
  })

  it('announces an update conflict and keeps the edit dialog open', async () => {
    const user = userEvent.setup()
    mockUpdateMutateAsync.mockRejectedValueOnce(new Error('409 Conflict'))
    renderWithProviders(<BoxTypeFormDialog open boxType={mockBoxType} onClose={onClose} />)

    await user.click(screen.getByRole('button', { name: 'Сохранить' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Тип коробки с таким названием уже существует'
    )
    expect(onClose).not.toHaveBeenCalled()
  })

  it.each([
    { boxType: null, triggerName: 'Открыть создание' },
    { boxType: mockBoxType, triggerName: 'Открыть редактирование' },
  ])(
    'returns focus to the exact $triggerName trigger after cancel',
    async ({ boxType, triggerName }) => {
      const user = userEvent.setup()
      renderWithProviders(<FocusReturnHarness boxType={boxType} />)
      const trigger = screen.getByRole('button', { name: triggerName })

      await user.click(trigger)
      await user.click(screen.getByRole('button', { name: 'Отмена' }))

      await waitFor(() => expect(trigger).toHaveFocus())
    }
  )

  it('returns focus to a stable route target when create replaces the empty trigger', async () => {
    const user = userEvent.setup()
    mockCreateMutateAsync.mockResolvedValueOnce({ id: 'bt-new' })
    renderWithProviders(<ReplacingCreateTriggerHarness />)
    const trigger = screen.getByRole('button', { name: 'Открыть создание из пустого состояния' })
    const stableTarget = screen.getByRole('region', { name: 'Типы коробок' })

    await user.click(trigger)
    await user.type(screen.getByLabelText('Название'), 'Новая коробка')
    await user.type(screen.getByLabelText('Длина (см)'), '50')
    await user.type(screen.getByLabelText('Ширина (см)'), '30')
    await user.type(screen.getByLabelText('Высота (см)'), '20')
    await user.click(screen.getByRole('button', { name: 'Создать' }))

    await waitFor(() => expect(trigger).not.toBeInTheDocument())
    expect(stableTarget).toHaveFocus()
  })

  it('submits a rapid create activation only once before pending state renders', async () => {
    const user = userEvent.setup()
    let resolveCreate!: (value: { id: string }) => void
    mockCreateMutateAsync.mockReturnValueOnce(
      new Promise(resolve => {
        resolveCreate = resolve
      })
    )
    renderWithProviders(<BoxTypeFormDialog open boxType={null} onClose={onClose} />)

    await user.type(screen.getByLabelText('Название'), 'Новая коробка')
    await user.type(screen.getByLabelText('Длина (см)'), '50')
    await user.type(screen.getByLabelText('Ширина (см)'), '30')
    await user.type(screen.getByLabelText('Высота (см)'), '20')
    await user.dblClick(screen.getByRole('button', { name: 'Создать' }))

    expect(mockCreateMutateAsync).toHaveBeenCalledTimes(1)
    resolveCreate({ id: 'bt-new' })
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1))
  })

  it('returns focus to the edit trigger after successful save', async () => {
    const user = userEvent.setup()
    mockUpdateMutateAsync.mockResolvedValueOnce(mockBoxType)
    renderWithProviders(<FocusReturnHarness boxType={mockBoxType} />)
    const trigger = screen.getByRole('button', { name: 'Открыть редактирование' })

    await user.click(trigger)
    await user.click(screen.getByRole('button', { name: 'Сохранить' }))

    await waitFor(() => expect(trigger).toHaveFocus())
  })

  it('stacks dimensions responsively and bounds the dialog viewport', () => {
    renderWithProviders(<BoxTypeFormDialog open boxType={null} onClose={onClose} />)

    const dialog = screen.getByRole('dialog')
    const dimensions = screen.getByLabelText('Длина (см)').parentElement?.parentElement

    expect(dialog).toHaveClass(
      'max-h-[calc(100dvh-2rem)]',
      'w-[calc(100%-2rem)]',
      'overflow-y-auto'
    )
    expect(dimensions).toHaveClass('grid', 'sm:grid-cols-3')
    expect(dimensions).not.toHaveClass('grid-cols-3')
  })

  it('has no detectable accessibility violations in create validation state', async () => {
    const user = userEvent.setup()
    const { baseElement } = renderWithProviders(
      <BoxTypeFormDialog open boxType={null} onClose={onClose} />
    )

    await user.click(screen.getByRole('button', { name: 'Создать' }))

    expect(await axe(baseElement)).toHaveNoViolations()
  })

  it('has no detectable accessibility violations in edit state', async () => {
    const { baseElement } = renderWithProviders(
      <BoxTypeFormDialog open boxType={mockBoxType} onClose={onClose} />
    )

    expect(await axe(baseElement)).toHaveNoViolations()
  })
})
