import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { axe, toHaveNoViolations } from 'jest-axe'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TariffSettingsForm } from '../TariffSettingsForm'

expect.extend(toHaveNoViolations)

const mockGetTariffSettings = vi.fn()
const mockPatchTariffSettings = vi.fn()
const mockPutTariffSettings = vi.fn()

vi.mock('@/lib/api/tariffs-admin', () => ({
  getTariffSettings: () => mockGetTariffSettings(),
  patchTariffSettings: (data: unknown) => mockPatchTariffSettings(data),
  putTariffSettings: (data: unknown) => mockPutTariffSettings(data),
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}))

const settings = {
  acceptanceBoxRatePerLiter: 1.8,
  acceptancePalletRate: 520,
  logisticsVolumeTiers: [
    { fromLiters: 0.001, toLiters: 0.2, rateRub: 24 },
    { fromLiters: 0.201, toLiters: 0.4, rateRub: 27 },
  ],
  logisticsLargeFirstLiterRate: 48,
  logisticsLargeAdditionalLiterRate: 15,
  returnLogisticsFboRate: 50,
  returnLogisticsFbsRate: 60,
  defaultCommissionFboPct: 15,
  defaultCommissionFbsPct: 12,
  storageFreeDays: 30,
  fixationClothingDays: 14,
  fixationOtherDays: 7,
  fbsUsesFboLogisticsRates: true,
  source: 'manual' as const,
  notes: '',
}

function renderForm() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: 1 },
    },
  })
  return render(
    <QueryClientProvider client={client}>
      <TariffSettingsForm />
    </QueryClientProvider>
  )
}

async function loadForm() {
  const result = renderForm()
  await screen.findByRole('heading', { name: 'Редактирование тарифов' })
  return result
}

async function openSaveDialog(user: ReturnType<typeof userEvent.setup>) {
  const input = screen.getByLabelText(/тариф приёмки.*₽\/литр/i)
  await user.clear(input)
  await user.type(input, '2.5')
  await user.click(screen.getByRole('button', { name: 'Сохранить' }))
  return screen.findByRole('alertdialog', { name: 'Сохранить изменения тарифов?' })
}

describe('Story 173.6 tariff form state and accessibility contract', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetTariffSettings.mockResolvedValue(settings)
    mockPatchTariffSettings.mockResolvedValue(settings)
    mockPutTariffSettings.mockResolvedValue(settings)
  })

  it('announces loading without exposing an unlabelled visual-only skeleton', () => {
    mockGetTariffSettings.mockImplementation(() => new Promise(() => undefined))
    renderForm()

    expect(screen.getByRole('status', { name: 'Загрузка настроек тарифов' })).toHaveAttribute(
      'aria-busy',
      'true'
    )
  })

  it('identifies unavailable server values instead of silently presenting defaults as current', async () => {
    mockGetTariffSettings.mockResolvedValue({
      ...settings,
      fixationClothingDays: undefined,
      fixationOtherDays: undefined,
    })
    await loadForm()

    const notice = screen.getByRole('status', { name: 'Часть значений тарифов недоступна' })
    expect(notice).toHaveTextContent('Фиксация одежда')
    expect(notice).toHaveTextContent('Фиксация прочее')
  })

  it('associates the field unit, description, and validation feedback with the input', async () => {
    const user = userEvent.setup()
    await loadForm()
    const input = screen.getByLabelText(/тариф приёмки.*₽\/литр/i)
    const description = screen.getByText('Стоимость приёмки за литр объёма')

    expect(input).toHaveAccessibleDescription('Стоимость приёмки за литр объёма')
    await user.clear(input)
    await user.type(input, '0')

    const error = await waitFor(() => {
      const inlineError = screen
        .getAllByText('Должно быть больше 0')
        .find(element => element.id.startsWith('tariff-error-'))
      expect(inlineError).toBeDefined()
      return inlineError!
    })
    const describedBy = input.getAttribute('aria-describedby')?.split(' ') ?? []
    expect(describedBy).toEqual(expect.arrayContaining([description.id, error.id]))
    expect(input).toHaveAttribute('aria-invalid', 'true')
  })

  it('shows a form-level validation summary while keeping the inline error association', async () => {
    const user = userEvent.setup()
    await loadForm()
    const input = screen.getByLabelText(/тариф приёмки.*₽\/литр/i)
    await user.clear(input)
    await user.type(input, '0')

    const summary = await screen.findByRole('alert', { name: 'Ошибки формы тарифов' })
    expect(summary).toHaveTextContent('Тариф приёмки')
    expect(summary).toHaveTextContent('Должно быть больше 0')
    expect(screen.getByRole('button', { name: 'Сохранить' })).toBeDisabled()
  })

  it('names the logistics table and associates invalid tier feedback with its cell', async () => {
    const user = userEvent.setup()
    await loadForm()
    expect(screen.getByRole('table', { name: 'Тарифные уровни по объёму' })).toBeInTheDocument()

    const fromLiters = screen.getByLabelText('От литров для уровня 1')
    await user.clear(fromLiters)
    await user.type(fromLiters, '0')

    await waitFor(() => expect(fromLiters).toHaveAttribute('aria-invalid', 'true'))
    expect(fromLiters).toHaveAccessibleDescription('От (л) должно быть больше 0')
  })

  it('treats notes and tier-editor changes as dirty and resets them to server values', async () => {
    const user = userEvent.setup()
    await loadForm()
    const notes = screen.getByLabelText('Заметки')

    await user.type(notes, 'Проверка длинного русского пояснения')
    expect(screen.getByRole('button', { name: 'Сохранить' })).toBeEnabled()
    await user.click(screen.getByRole('button', { name: 'Отмена' }))
    expect(notes).toHaveValue('')
    expect(screen.getByRole('button', { name: 'Сохранить' })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Добавить уровень' }))
    expect(screen.getByRole('button', { name: 'Сохранить' })).toBeEnabled()
  })

  it('keeps the confirmation dialog contained until an asynchronous save succeeds', async () => {
    const user = userEvent.setup()
    let resolvePatch!: (value: typeof settings) => void
    mockPatchTariffSettings.mockImplementation(
      () => new Promise<typeof settings>(resolve => (resolvePatch = resolve))
    )
    await loadForm()
    const dialog = await openSaveDialog(user)

    await user.click(within(dialog).getByRole('button', { name: 'Подтвердить' }))
    expect(dialog).toBeVisible()
    expect(within(dialog).getByRole('button', { name: 'Сохранение...' })).toBeDisabled()
    expect(within(dialog).getByRole('button', { name: 'Отмена' })).toBeDisabled()
    await user.keyboard('{Escape}')
    expect(dialog).toBeVisible()

    await act(async () => resolvePatch({ ...settings, acceptanceBoxRatePerLiter: 2.5 }))
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
    expect(screen.getByRole('status', { name: 'Результат сохранения тарифов' })).toHaveTextContent(
      'Тарифы сохранены'
    )
    expect(screen.getByRole('button', { name: 'Сохранить' })).toBeDisabled()
  })

  it('retains valid input and the retry path after a recoverable save failure', async () => {
    const user = userEvent.setup()
    mockPatchTariffSettings.mockRejectedValueOnce(new Error('network'))
    await loadForm()
    const dialog = await openSaveDialog(user)

    await user.click(within(dialog).getByRole('button', { name: 'Подтвердить' }))
    const failure = await within(dialog).findByRole('alert')
    expect(failure).toHaveTextContent('Не удалось сохранить тарифы')
    expect(screen.getByLabelText(/тариф приёмки.*₽\/литр/i)).toHaveValue(2.5)
    expect(within(dialog).getByRole('button', { name: 'Повторить сохранение' })).toBeEnabled()

    mockPatchTariffSettings.mockResolvedValueOnce({
      ...settings,
      acceptanceBoxRatePerLiter: 2.5,
    })
    await user.click(within(dialog).getByRole('button', { name: 'Повторить сохранение' }))
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
    expect(mockPatchTariffSettings).toHaveBeenCalledTimes(2)
  })

  it('has no automated accessibility violations in the loaded pristine form', async () => {
    const { container } = await loadForm()
    expect(await axe(container)).toHaveNoViolations()
  })
})
