import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { NotificationPreferencesResponseDto } from '@/types/notifications'
import { NotificationPreferencesPanel } from '../NotificationPreferencesPanel'

const fixture: NotificationPreferencesResponseDto = {
  cabinet_id: 'cabinet-story-173-5',
  telegram_enabled: true,
  telegram_bound: true,
  telegram_username: 'story_user',
  preferences: {
    task_completed: true,
    task_failed: false,
    task_stalled: false,
    daily_digest: true,
    digest_time: '08:00',
  },
  language: 'ru',
  quiet_hours: {
    enabled: true,
    from: '23:00',
    to: '07:00',
    timezone: 'Europe/Moscow',
  },
}

const mocks = vi.hoisted(() => ({
  preferences: undefined as NotificationPreferencesResponseDto | undefined,
  isUpdating: false,
  updatePreferences: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}))

vi.mock('@/hooks/useNotificationPreferences', () => ({
  useNotificationPreferences: () => ({
    preferences: mocks.preferences,
    isUpdating: mocks.isUpdating,
    updatePreferences: mocks.updatePreferences,
  }),
}))

vi.mock('@/lib/analytics/telegram-metrics', () => ({
  TelegramMetrics: {
    dailyDigestEnabled: vi.fn(),
    eventTypeToggled: vi.fn(),
    languageChanged: vi.fn(),
    preferencesUpdated: vi.fn(),
  },
}))

vi.mock('sonner', () => ({
  toast: {
    success: mocks.toastSuccess,
    error: mocks.toastError,
  },
}))

function cloneFixture(): NotificationPreferencesResponseDto {
  return structuredClone(fixture)
}

function mutationCallbacks() {
  return mocks.updatePreferences.mock.calls[0]?.[1] as {
    onSuccess: () => void
    onError: () => void
  }
}

describe('NotificationPreferencesPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.preferences = cloneFixture()
    mocks.isUpdating = false
  })

  it('announces the preferences loading state without exposing controls', () => {
    mocks.preferences = undefined

    render(<NotificationPreferencesPanel />)

    expect(screen.getByRole('status', { name: 'Загружаем настройки уведомлений' })).toBeVisible()
    expect(screen.queryByRole('switch')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Сохранить настройки' })).not.toBeInTheDocument()
  })

  it('exposes named switch and language states', async () => {
    render(<NotificationPreferencesPanel />)

    expect(await screen.findByRole('switch', { name: 'Задача выполнена успешно' })).toBeChecked()
    expect(screen.getByRole('switch', { name: 'Задача завершилась с ошибкой' })).not.toBeChecked()
    expect(screen.getByRole('radio', { name: /Русский/ })).toBeChecked()
    expect(screen.getByRole('radio', { name: /English/ })).not.toBeChecked()
  })

  it('sends the established full payload and announces save success', async () => {
    const user = userEvent.setup()
    render(<NotificationPreferencesPanel />)

    await user.click(await screen.findByRole('switch', { name: 'Задача завершилась с ошибкой' }))
    await user.click(screen.getByRole('button', { name: 'Сохранить настройки' }))

    expect(mocks.updatePreferences).toHaveBeenCalledTimes(1)
    expect(mocks.updatePreferences.mock.calls[0]?.[0]).toEqual({
      preferences: { ...fixture.preferences, task_failed: true },
      language: 'ru',
      quiet_hours: fixture.quiet_hours,
    })

    mutationCallbacks().onSuccess()
    expect(mocks.toastSuccess).toHaveBeenCalledWith('Настройки сохранены', { duration: 3000 })
  })

  it('announces save failure while retaining the edited retryable state', async () => {
    const user = userEvent.setup()
    render(<NotificationPreferencesPanel />)

    const failedSwitch = await screen.findByRole('switch', {
      name: 'Задача завершилась с ошибкой',
    })
    await user.click(failedSwitch)
    await user.click(screen.getByRole('button', { name: 'Сохранить настройки' }))
    mutationCallbacks().onError()

    expect(mocks.toastError).toHaveBeenCalledWith(
      'Не удалось сохранить настройки. Попробуйте ещё раз.'
    )
    expect(failedSwitch).toBeChecked()
    expect(screen.getByText(/несохранённые изменения/i)).toBeVisible()
    expect(screen.getByRole('button', { name: 'Сохранить настройки' })).toBeEnabled()
  })

  it('cancels unsaved changes without writing preferences', async () => {
    const user = userEvent.setup()
    render(<NotificationPreferencesPanel />)

    const failedSwitch = await screen.findByRole('switch', {
      name: 'Задача завершилась с ошибкой',
    })
    await user.click(failedSwitch)
    await user.click(screen.getByRole('button', { name: 'Отменить' }))

    await waitFor(() => expect(failedSwitch).not.toBeChecked())
    expect(screen.queryByText(/несохранённые изменения/i)).not.toBeInTheDocument()
    expect(mocks.updatePreferences).not.toHaveBeenCalled()
  })

  it('edits the daily digest time without disabling its event card', async () => {
    const user = userEvent.setup()
    render(<NotificationPreferencesPanel />)

    const digestSwitch = await screen.findByRole('switch', { name: 'Ежедневный дайджест' })
    const digestTime = screen.getByLabelText('Время отправки ежедневного дайджеста')
    await user.click(digestTime)
    await user.clear(digestTime)
    await user.type(digestTime, '09:15')

    expect(digestSwitch).toBeChecked()
    expect(digestTime).toHaveValue('09:15')
  })

  it('uses a route-level h2 for notification preferences', () => {
    render(<NotificationPreferencesPanel />)

    expect(screen.getByRole('heading', { level: 2, name: 'Настройки уведомлений' })).toBeVisible()
  })
})
