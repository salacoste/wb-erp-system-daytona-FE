import { act, fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { axe } from 'jest-axe'
import { renderWithProviders } from '@/test/utils/test-utils'
import { useAuthStore } from '@/stores/authStore'
import { TaxSettingsForm } from '../TaxSettingsForm'

const mockMutate = vi.fn()
const mockRefetch = vi.fn()

const serverSettings = {
  id: 'cab-1',
  name: 'Основной кабинет',
  isActive: true,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-08-30T00:00:00Z',
  taxSystem: 'usn6' as const,
  taxRate: null as number | null,
  vatPayer: false,
  vatRate: null as number | null,
  targetMarginPct: null,
}

let queryState: Record<string, unknown>
let mutationState: Record<string, unknown>

vi.mock('@/hooks/useCabinetTaxSettings', () => ({
  useCabinetTaxSettings: vi.fn(() => queryState),
  useUpdateTaxSettings: vi.fn(() => mutationState),
}))

function renderForm() {
  return renderWithProviders(<TaxSettingsForm cabinetId="cab-1" />)
}

function mutationOptions(call = 0) {
  return mockMutate.mock.calls[call][1] as {
    onSuccess: () => void
    onError: () => void
  }
}

describe('TaxSettingsForm Story 173.7 state contract', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    queryState = {
      data: serverSettings,
      isLoading: false,
      isError: false,
      refetch: mockRefetch,
    }
    mutationState = { mutate: mockMutate, isPending: false }
    useAuthStore.setState({
      user: { id: 'owner-1', email: 'owner@test.local', role: 'Owner' },
      token: 'token',
      cabinetId: 'cab-1',
      isAuthenticated: true,
    })
  })

  it('exposes named loading and recoverable query-error states', async () => {
    queryState = { data: undefined, isLoading: true, isError: false, refetch: mockRefetch }
    const { rerender } = renderForm()

    expect(screen.getByRole('status', { name: 'Загрузка налоговых настроек' })).toHaveAttribute(
      'aria-busy',
      'true'
    )

    queryState = { data: undefined, isLoading: false, isError: true, refetch: mockRefetch }
    rerender(<TaxSettingsForm cabinetId="cab-1" />)

    expect(screen.getByRole('alert')).toHaveTextContent('Не удалось загрузить налоговые настройки')
    await userEvent.click(screen.getByRole('button', { name: 'Повторить загрузку' }))
    expect(mockRefetch).toHaveBeenCalledTimes(1)
  })

  it.each(['-0.01', '100.01'])(
    'rejects an out-of-range manual percentage %s with associated error and no request',
    async value => {
      const user = userEvent.setup()
      renderForm()

      await user.click(screen.getByRole('radio', { name: /Пользовательская ставка/ }))
      const rate = screen.getByRole('spinbutton', { name: 'Ставка налога (%)' })
      await user.clear(rate)
      await user.type(rate, value)
      await user.click(screen.getByRole('button', { name: 'Сохранить' }))

      expect(rate).toHaveAttribute('aria-invalid', 'true')
      expect(rate).toHaveAccessibleDescription(/от 0 до 100 процентов/)
      expect(screen.getByRole('alert')).toHaveTextContent('Исправьте ошибки в форме')
      expect(rate).toHaveFocus()
      expect(mockMutate).not.toHaveBeenCalled()
    }
  )

  it('associates the required VAT-rate error with its radio group and error summary', async () => {
    const user = userEvent.setup()
    renderForm()

    await user.click(screen.getByRole('checkbox', { name: /плательщиком НДС/ }))
    await user.click(screen.getByRole('button', { name: 'Сохранить' }))

    const group = screen.getByRole('radiogroup', { name: 'Ставка НДС' })
    expect(group).toHaveAttribute('aria-invalid', 'true')
    expect(group).toHaveAccessibleDescription('Выберите ставку НДС')
    expect(screen.getByRole('alert')).toHaveTextContent('Исправьте ошибки в форме')
    expect(screen.getByRole('radio', { name: /0%.*экспорт/ })).toHaveFocus()
    expect(mockMutate).not.toHaveBeenCalled()
  })

  it('submits the exact manual and VAT payload once at a decimal value', async () => {
    const user = userEvent.setup()
    renderForm()

    await user.click(screen.getByRole('radio', { name: /Пользовательская ставка/ }))
    const rate = screen.getByRole('spinbutton', { name: 'Ставка налога (%)' })
    await user.clear(rate)
    await user.type(rate, '7.5')
    await user.click(screen.getByRole('checkbox', { name: /плательщиком НДС/ }))
    await user.click(screen.getByRole('radio', { name: /20%.*стандартная/ }))
    await user.click(screen.getByRole('button', { name: 'Сохранить' }))

    expect(mockMutate).toHaveBeenCalledTimes(1)
    expect(mockMutate).toHaveBeenCalledWith(
      { taxSystem: 'manual', taxRate: 7.5, vatPayer: true, vatRate: 20 },
      expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) })
    )
  })

  it.each(['0', '100'])('accepts the inclusive manual-rate boundary %s', async value => {
    const user = userEvent.setup()
    renderForm()

    await user.click(screen.getByRole('radio', { name: /Пользовательская ставка/ }))
    const rate = screen.getByRole('spinbutton', { name: 'Ставка налога (%)' })
    await user.clear(rate)
    await user.type(rate, value)
    await user.click(screen.getByRole('button', { name: 'Сохранить' }))

    expect(mockMutate).toHaveBeenCalledTimes(1)
    expect(mockMutate.mock.calls[0][0]).toEqual({
      taxSystem: 'manual',
      taxRate: Number(value),
      vatPayer: false,
      vatRate: 0,
    })
  })

  it('preserves the manual-rate draft across a reversible tax-system round trip', async () => {
    const user = userEvent.setup()
    renderForm()

    await user.click(screen.getByRole('radio', { name: /Пользовательская ставка/ }))
    const rate = screen.getByRole('spinbutton', { name: 'Ставка налога (%)' })
    await user.type(rate, '7.5')
    await user.click(screen.getByRole('radio', { name: /УСН 15%/ }))
    await user.click(screen.getByRole('radio', { name: /Пользовательская ставка/ }))

    expect(screen.getByRole('spinbutton', { name: 'Ставка налога (%)' })).toHaveValue(7.5)
    expect(mockMutate).not.toHaveBeenCalled()
  })

  it('preserves a dirty draft across query replacement and cancels to the refreshed baseline', async () => {
    const user = userEvent.setup()
    const { rerender } = renderForm()

    await user.click(screen.getByRole('radio', { name: /УСН 15%/ }))
    queryState = {
      ...queryState,
      data: { ...serverSettings, taxSystem: 'manual', taxRate: 12.5 },
    }
    rerender(<TaxSettingsForm cabinetId="cab-1" />)

    expect(screen.getByRole('radio', { name: /УСН 15%/ })).toBeChecked()
    await user.click(screen.getByRole('button', { name: 'Отменить' }))
    expect(screen.getByRole('radio', { name: /Пользовательская ставка/ })).toBeChecked()
    expect(screen.getByRole('spinbutton', { name: 'Ставка налога (%)' })).toHaveValue(12.5)
    expect(mockMutate).not.toHaveBeenCalled()
  })

  it('retries the failed payload after query replacement converges the server baseline', async () => {
    const user = userEvent.setup()
    const { rerender } = renderForm()

    await user.click(screen.getByRole('radio', { name: /УСН 15%/ }))
    await user.click(screen.getByRole('button', { name: 'Сохранить' }))
    act(() => mutationOptions().onError())

    queryState = {
      ...queryState,
      data: { ...serverSettings, taxSystem: 'usn15' },
    }
    rerender(<TaxSettingsForm cabinetId="cab-1" />)

    expect(screen.getByRole('radio', { name: /УСН 15%/ })).toBeChecked()
    expect(screen.getByRole('alert')).toHaveTextContent('Черновик сохранён')
    await user.click(screen.getByRole('button', { name: 'Повторить сохранение' }))
    expect(mockMutate.mock.calls.map(call => call[0])).toEqual([
      { taxSystem: 'usn15', taxRate: null, vatPayer: false, vatRate: 0 },
      { taxSystem: 'usn15', taxRate: null, vatPayer: false, vatRate: 0 },
    ])
  })

  it('keeps an open warning aligned with its visible draft across query replacement', async () => {
    const user = userEvent.setup()
    const { rerender } = renderForm()

    await user.click(screen.getByRole('radio', { name: 'Не настроена' }))
    await user.click(screen.getByRole('button', { name: 'Сохранить' }))
    queryState = {
      ...queryState,
      data: { ...serverSettings, taxSystem: 'manual', taxRate: 8 },
    }
    rerender(<TaxSettingsForm cabinetId="cab-1" />)

    expect(
      screen.getByRole('alertdialog', { name: 'Сохранить без налоговой системы?' })
    ).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Сохранить без системы' }))
    expect(mockMutate).toHaveBeenCalledWith(
      { taxSystem: null, taxRate: null, vatPayer: false, vatRate: 0 },
      expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) })
    )
  })

  it('replaces a dirty draft with the new cabinet baseline', async () => {
    const user = userEvent.setup()
    const { rerender } = renderForm()

    await user.click(screen.getByRole('radio', { name: /УСН 15%/ }))
    queryState = {
      ...queryState,
      data: { ...serverSettings, id: 'cab-2', taxSystem: 'manual', taxRate: 12.5 },
    }
    rerender(<TaxSettingsForm key="cab-2" cabinetId="cab-2" />)

    expect(screen.getByRole('radio', { name: /Пользовательская ставка/ })).toBeChecked()
    expect(screen.getByRole('spinbutton', { name: 'Ставка налога (%)' })).toHaveValue(12.5)
    expect(screen.getByRole('button', { name: 'Сохранить' })).toBeDisabled()
  })

  it('drops a failed payload when the active cabinet changes', async () => {
    const user = userEvent.setup()
    const { rerender } = renderForm()

    await user.click(screen.getByRole('radio', { name: /УСН 15%/ }))
    await user.click(screen.getByRole('button', { name: 'Сохранить' }))
    act(() => mutationOptions().onError())

    queryState = { ...queryState, data: { ...serverSettings, id: 'cab-2' } }
    rerender(<TaxSettingsForm key="cab-2" cabinetId="cab-2" />)

    expect(screen.queryByRole('button', { name: 'Повторить сохранение' })).not.toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /УСН 6%/ })).toBeChecked()
    expect(mockMutate).toHaveBeenCalledTimes(1)
  })

  it('closes the no-tax warning when the active cabinet changes', async () => {
    const user = userEvent.setup()
    const { rerender } = renderForm()

    await user.click(screen.getByRole('radio', { name: 'Не настроена' }))
    await user.click(screen.getByRole('button', { name: 'Сохранить' }))
    expect(screen.getByRole('alertdialog')).toBeVisible()

    queryState = { ...queryState, data: { ...serverSettings, id: 'cab-2' } }
    rerender(<TaxSettingsForm key="cab-2" cabinetId="cab-2" />)

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /УСН 6%/ })).toBeChecked()
    expect(mockMutate).not.toHaveBeenCalled()
  })

  it('ignores an in-flight result after the active cabinet changes', async () => {
    const user = userEvent.setup()
    const { rerender } = renderForm()

    await user.click(screen.getByRole('radio', { name: /УСН 15%/ }))
    await user.click(screen.getByRole('button', { name: 'Сохранить' }))
    const staleMutation = mutationOptions()

    queryState = {
      ...queryState,
      data: { ...serverSettings, id: 'cab-2', taxSystem: 'manual', taxRate: 8 },
    }
    rerender(<TaxSettingsForm key="cab-2" cabinetId="cab-2" />)
    act(() => {
      staleMutation.onSuccess()
      staleMutation.onError()
    })

    expect(screen.getByRole('radio', { name: /Пользовательская ставка/ })).toBeChecked()
    expect(screen.getByRole('spinbutton', { name: 'Ставка налога (%)' })).toHaveValue(8)
    expect(screen.queryByRole('status', { name: 'Результат сохранения' })).not.toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('renders an unsupported saved VAT rate truthfully and blocks it until replacement', async () => {
    queryState = {
      ...queryState,
      data: { ...serverSettings, vatPayer: true, vatRate: 10 },
    }
    const user = userEvent.setup()
    renderForm()

    expect(screen.getByText('10% — сохранённая ставка недоступна для выбора')).toBeVisible()
    await user.click(screen.getByRole('radio', { name: /УСН 15%/ }))
    await user.click(screen.getByRole('button', { name: 'Сохранить' }))
    expect(screen.getByRole('radiogroup', { name: 'Ставка НДС' })).toHaveAccessibleDescription(
      /Сохранённая ставка недоступна/
    )
    expect(mockMutate).not.toHaveBeenCalled()

    await user.click(screen.getByRole('radio', { name: /20%.*стандартная/ }))
    await user.click(screen.getByRole('button', { name: 'Сохранить' }))
    expect(mockMutate).toHaveBeenCalledWith(
      { taxSystem: 'usn15', taxRate: null, vatPayer: true, vatRate: 20 },
      expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) })
    )
  })

  it('requires confirmation before persisting the known no-tax consequence', async () => {
    const user = userEvent.setup()
    renderForm()

    await user.click(screen.getByRole('radio', { name: 'Не настроена' }))
    const save = screen.getByRole('button', { name: 'Сохранить' })
    await user.click(save)

    expect(mockMutate).not.toHaveBeenCalled()
    expect(
      screen.getByRole('alertdialog', { name: 'Сохранить без налоговой системы?' })
    ).toHaveTextContent('Прибыль продолжит отображаться до вычета налогов')

    await user.click(screen.getByRole('button', { name: 'Вернуться к настройкам' }))
    await waitFor(() => expect(save).toHaveFocus())
    expect(screen.getByRole('radio', { name: 'Не настроена' })).toBeChecked()

    await user.click(save)
    await user.click(screen.getByRole('button', { name: 'Сохранить без системы' }))

    expect(mockMutate).toHaveBeenCalledTimes(1)
    expect(mockMutate).toHaveBeenCalledWith(
      { taxSystem: null, taxRate: null, vatPayer: false, vatRate: 0 },
      expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) })
    )
  })

  it('blocks every editable control and both actions while a save is pending', () => {
    mutationState = { mutate: mockMutate, isPending: true }
    renderForm()

    expect(screen.getByRole('form', { name: 'Налоговые настройки' })).toHaveAttribute(
      'aria-busy',
      'true'
    )
    expect(screen.getByRole('status', { name: 'Состояние сохранения' })).toHaveTextContent(
      'Сохраняем налоговые настройки'
    )
    expect(screen.getByRole('radio', { name: /УСН 6%/ })).toBeDisabled()
    expect(screen.getByRole('checkbox', { name: /плательщиком НДС/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Отменить' })).toBeDisabled()
    expect(screen.getByRole('button', { name: /Сохранение/ })).toBeDisabled()
  })

  it('keeps the warning modal contained through pending failure and identical retry', async () => {
    const user = userEvent.setup()
    const { rerender } = renderForm()

    await user.click(screen.getByRole('radio', { name: 'Не настроена' }))
    await user.click(screen.getByRole('button', { name: 'Сохранить' }))
    await user.click(screen.getByRole('button', { name: 'Сохранить без системы' }))

    mutationState = { mutate: mockMutate, isPending: true }
    rerender(<TaxSettingsForm cabinetId="cab-1" />)
    const dialog = screen.getByRole('alertdialog', { name: 'Сохранить без налоговой системы?' })
    expect(dialog).toHaveAttribute('aria-busy', 'true')
    expect(
      screen.getByRole('status', { name: 'Состояние сохранения без налоговой системы' })
    ).toHaveTextContent('Не закрывайте окно')
    expect(screen.getByRole('button', { name: 'Вернуться к настройкам' })).toBeDisabled()
    expect(screen.getByRole('button', { name: /Сохранение/ })).toBeDisabled()

    await user.keyboard('{Escape}')
    fireEvent.pointerDown(document.body)
    fireEvent.click(document.body)
    expect(dialog).toBeVisible()

    mutationState = { mutate: mockMutate, isPending: false }
    act(() => mutationOptions().onError())
    expect(screen.getByRole('alert')).toHaveTextContent('Черновик сохранён')

    await user.click(screen.getByRole('button', { name: 'Повторить сохранение' }))
    expect(mockMutate).toHaveBeenCalledTimes(2)
    expect(mockMutate.mock.calls.map(call => call[0])).toEqual([
      { taxSystem: null, taxRate: null, vatPayer: false, vatRate: 0 },
      { taxSystem: null, taxRate: null, vatPayer: false, vatRate: 0 },
    ])

    act(() => mutationOptions(1).onSuccess())
    await waitFor(() => expect(dialog).not.toBeInTheDocument())
    expect(screen.getByRole('form', { name: 'Налоговые настройки' })).toHaveFocus()
  })

  it('retains a failed draft, announces recovery, and rebases only after success', async () => {
    const user = userEvent.setup()
    renderForm()

    await user.click(screen.getByRole('radio', { name: /УСН 15%/ }))
    await user.click(screen.getByRole('button', { name: 'Сохранить' }))
    act(() => mutationOptions().onError())

    expect(screen.getByRole('alert')).toHaveTextContent('Не удалось сохранить налоговые настройки')
    expect(screen.getByRole('radio', { name: /УСН 15%/ })).toBeChecked()
    const retry = screen.getByRole('button', { name: 'Повторить сохранение' })
    expect(retry).toBeEnabled()
    expect(retry).toHaveFocus()

    await user.click(retry)
    expect(mockMutate).toHaveBeenCalledTimes(2)
    expect(mockMutate.mock.calls[1][0]).toEqual({
      taxSystem: 'usn15',
      taxRate: null,
      vatPayer: false,
      vatRate: 0,
    })
    act(() => mutationOptions(1).onSuccess())

    expect(screen.getByRole('status', { name: 'Результат сохранения' })).toHaveTextContent(
      'Налоговые настройки сохранены'
    )
    expect(screen.getByRole('button', { name: 'Сохранить' })).toBeDisabled()
    await waitFor(() =>
      expect(screen.getByRole('form', { name: 'Налоговые настройки' })).toHaveFocus()
    )
  })

  it('restores all server values and clears errors without sending a request', async () => {
    queryState = {
      data: { ...serverSettings, taxSystem: 'manual', taxRate: 12.5, vatPayer: true, vatRate: 5 },
      isLoading: false,
      isError: false,
      refetch: mockRefetch,
    }
    const user = userEvent.setup()
    renderForm()

    const rate = screen.getByRole('spinbutton', { name: 'Ставка налога (%)' })
    await user.clear(rate)
    await user.type(rate, '101')
    await user.click(screen.getByRole('button', { name: 'Сохранить' }))
    await user.click(screen.getByRole('button', { name: 'Отменить' }))

    expect(screen.getByRole('radio', { name: /Пользовательская ставка/ })).toBeChecked()
    expect(rate).toHaveValue(12.5)
    expect(screen.getByRole('checkbox', { name: /плательщиком НДС/ })).toBeChecked()
    expect(screen.getByRole('radio', { name: /5%.*УСН/ })).toBeChecked()
    expect(rate).not.toHaveAttribute('aria-invalid')
    expect(mockMutate).not.toHaveBeenCalled()
  })

  it('presents a truthful read-only view for Analyst without mutation actions', async () => {
    useAuthStore.setState({
      user: { id: 'analyst-1', email: 'analyst@test.local', role: 'Analyst' },
      token: 'token',
      cabinetId: 'cab-1',
      isAuthenticated: true,
    })
    const { container } = renderForm()

    expect(screen.getByText(/доступны только для просмотра/)).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /УСН 6%/ })).toBeDisabled()
    expect(screen.getByRole('checkbox', { name: /плательщиком НДС/ })).toBeDisabled()
    expect(screen.queryByRole('button', { name: 'Сохранить' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Отменить' })).not.toBeInTheDocument()
    expect((await axe(container)).violations).toEqual([])
  })
})
