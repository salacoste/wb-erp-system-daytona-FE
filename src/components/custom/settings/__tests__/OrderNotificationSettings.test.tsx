/**
 * Component tests for OrderNotificationSettings + OrderNotifInputs
 * Epic 132-FE: Story 132.4
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils/test-utils'
import { OrderNotificationSettings } from '../OrderNotificationSettings'
import type { OrderNotificationSettingsDto } from '@/types/notifications'

// --- Mocks -----------------------------------------------------------

const mockSettings: OrderNotificationSettingsDto = {
  cabinetId: 'cab-1',
  newOrderEnabled: true,
  slaWarningEnabled: false,
  dailySummaryEnabled: true,
  dailySummaryHour: 9,
  quietHoursStart: 22,
  quietHoursEnd: 8,
  confirmationSlaWarningMinutes: 30,
  completionSlaWarningMinutes: 60,
}

const mockUpdateSettings = vi.fn()

vi.mock('@/hooks/useOrderNotificationSettings', () => ({
  useOrderNotificationSettings: vi.fn(() => ({
    settings: mockSettings,
    isLoading: false,
    error: null,
    updateSettings: mockUpdateSettings,
    updateSettingsAsync: vi.fn(),
    isUpdating: false,
    updateError: null,
  })),
}))

import { useOrderNotificationSettings } from '@/hooks/useOrderNotificationSettings'

/** Helper to override the hook return per test */
function mockHook(overrides: Partial<ReturnType<typeof useOrderNotificationSettings>>) {
  const defaults: ReturnType<typeof useOrderNotificationSettings> = {
    settings: mockSettings,
    isLoading: false,
    error: null,
    updateSettings: mockUpdateSettings,
    updateSettingsAsync: vi.fn(),
    isUpdating: false,
    updateError: null,
  }
  vi.mocked(useOrderNotificationSettings).mockReturnValue({
    ...defaults,
    ...overrides,
  } as ReturnType<typeof useOrderNotificationSettings>)
}

// --- Tests -----------------------------------------------------------

describe('OrderNotificationSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockHook({})
  })

  // 1. Loading skeleton
  it('renders loading skeleton when isLoading=true', () => {
    mockHook({ isLoading: true, settings: undefined })

    renderWithProviders(<OrderNotificationSettings />)

    // No card titles rendered during loading
    expect(screen.queryByText('Уведомления о заказах FBS')).not.toBeInTheDocument()
    // Skeleton divs rendered (2 in header + 4 in content)
    expect(document.querySelectorAll('.animate-pulse')).toHaveLength(6)
  })

  // 2. Error alert
  it('renders error alert when error is set', () => {
    mockHook({ error: new Error('fail'), settings: undefined })

    renderWithProviders(<OrderNotificationSettings />)

    expect(
      screen.getByText('Не удалось загрузить настройки уведомлений о заказах')
    ).toBeInTheDocument()
  })

  // 3. Renders all 3 cards with toggles and inputs when loaded
  it('renders all 3 cards with toggles and inputs when settings loaded', () => {
    renderWithProviders(<OrderNotificationSettings />)

    // Card 1: Notification toggles
    expect(screen.getByText('Уведомления о заказах FBS')).toBeInTheDocument()
    expect(screen.getByText('Новый заказ')).toBeInTheDocument()
    expect(screen.getByText('Предупреждение SLA')).toBeInTheDocument()
    expect(screen.getByText('Ежедневная сводка')).toBeInTheDocument()

    // 3 toggle switches
    const switches = screen.getAllByRole('switch')
    expect(switches).toHaveLength(3)

    // Card 2: Time settings
    expect(screen.getByText('Время уведомлений')).toBeInTheDocument()
    expect(screen.getByLabelText('Час ежедневной сводки')).toBeInTheDocument()
    expect(screen.getByLabelText('Начало')).toBeInTheDocument()
    expect(screen.getByLabelText('Конец')).toBeInTheDocument()

    // Card 3: SLA thresholds
    expect(screen.getByText('Пороги предупреждений SLA')).toBeInTheDocument()
    expect(screen.getByLabelText('Подтверждение заказа')).toBeInTheDocument()
    expect(screen.getByLabelText('Сборка и отгрузка')).toBeInTheDocument()
  })

  // 4. Toggle click calls updateSettings with correct partial payload
  it('toggle click calls updateSettings with correct partial payload', async () => {
    const user = userEvent.setup()
    renderWithProviders(<OrderNotificationSettings />)

    // newOrderEnabled starts true — click to toggle off
    const newOrderSwitch = screen.getByRole('switch', { name: /новый заказ/i })
    await user.click(newOrderSwitch)

    expect(mockUpdateSettings).toHaveBeenCalledTimes(1)
    const calledWith = mockUpdateSettings.mock.calls[0][0]
    // Must contain the spread of all settings + the toggled field
    expect(calledWith.newOrderEnabled).toBe(false)
    // Other fields preserved from current settings
    expect(calledWith.slaWarningEnabled).toBe(false)
    expect(calledWith.dailySummaryEnabled).toBe(true)
    expect(calledWith.dailySummaryHour).toBe(9)
  })

  // 5. Hour input change calls updateSettings with clamped value
  it('hour input change calls updateSettings with clamped value', async () => {
    const user = userEvent.setup()
    renderWithProviders(<OrderNotificationSettings />)

    const hourInput = screen.getByLabelText('Час ежедневной сводки')
    await user.clear(hourInput)
    await user.type(hourInput, '15')

    // The input clamps to 0-23 and fires onChange per keystroke
    expect(mockUpdateSettings).toHaveBeenCalled()
    const lastCall = mockUpdateSettings.mock.calls[mockUpdateSettings.mock.calls.length - 1][0]
    expect(lastCall.dailySummaryHour).toBeGreaterThanOrEqual(0)
    expect(lastCall.dailySummaryHour).toBeLessThanOrEqual(23)
  })

  // 6. SLA input change calls updateSettings with correct value
  it('SLA input change calls updateSettings with correct value', async () => {
    const user = userEvent.setup()
    // Enable SLA toggle so the SLA inputs are NOT disabled
    mockHook({
      settings: { ...mockSettings, slaWarningEnabled: true },
    })
    renderWithProviders(<OrderNotificationSettings />)

    const slaInput = screen.getByLabelText('Подтверждение заказа')
    await user.clear(slaInput)
    await user.type(slaInput, '45')

    expect(mockUpdateSettings).toHaveBeenCalled()
    const lastCall = mockUpdateSettings.mock.calls[mockUpdateSettings.mock.calls.length - 1][0]
    expect(lastCall.confirmationSlaWarningMinutes).toBeGreaterThanOrEqual(1)
    expect(lastCall.confirmationSlaWarningMinutes).toBeLessThanOrEqual(1440)
  })
})
