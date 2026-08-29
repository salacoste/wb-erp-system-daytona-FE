import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { TelegramBindingModal } from '../TelegramBindingModal'

const mocks = vi.hoisted(() => ({
  useTelegramBindingModal: vi.fn(),
}))

vi.mock('../useTelegramBindingModal', () => ({
  useTelegramBindingModal: mocks.useTelegramBindingModal,
}))

const loadingModalState = {
  bindingCode: null,
  isBound: false,
  isStartingBinding: true,
  timeRemaining: 600,
  progress: 100,
  formatTime: vi.fn((seconds: number) => `${seconds}`),
  getProgressColor: vi.fn(() => 'bg-telegram'),
  getPollingMessage: vi.fn(() => 'Ожидаем подтверждения...'),
  handleCopyCode: vi.fn(),
  handleOpenTelegram: vi.fn(),
}

describe('TelegramBindingModal pending state', () => {
  beforeEach(() => {
    mocks.useTelegramBindingModal.mockReturnValue(loadingModalState)
  })

  it('announces code creation as a named status inside the dialog', () => {
    render(<TelegramBindingModal open onOpenChange={vi.fn()} onSuccess={vi.fn()} />)

    expect(screen.getByRole('dialog', { name: 'Подключение Telegram' })).toBeVisible()
    expect(screen.getByRole('status', { name: /создаём код привязки/i })).toBeVisible()
  })

  it('does not dismiss through Escape or the close action while code creation is pending', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()

    render(<TelegramBindingModal open onOpenChange={onOpenChange} onSuccess={vi.fn()} />)

    await user.keyboard('{Escape}')
    expect(onOpenChange).not.toHaveBeenCalled()
    expect(screen.getByRole('dialog', { name: 'Подключение Telegram' })).toBeVisible()

    await user.click(screen.getByRole('button', { name: 'Закрыть' }))
    expect(onOpenChange).not.toHaveBeenCalled()
    expect(screen.getByRole('dialog', { name: 'Подключение Telegram' })).toBeVisible()
  })
})
