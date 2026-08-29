import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { UnbindConfirmationDialog } from '../UnbindConfirmationDialog'

const mocks = vi.hoisted(() => ({
  isUnbinding: false,
  unbind: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}))

vi.mock('@/hooks/useTelegramBinding', () => ({
  useTelegramBinding: () => ({
    unbind: mocks.unbind,
    isUnbinding: mocks.isUnbinding,
  }),
}))

vi.mock('sonner', () => ({
  toast: {
    success: mocks.toastSuccess,
    error: mocks.toastError,
  },
}))

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn() },
}))

describe('UnbindConfirmationDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.isUnbinding = false
  })

  it('keeps the controlled dialog open while the async unbind is pending', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    const onConfirm = vi.fn()
    const { rerender } = render(
      <UnbindConfirmationDialog open onOpenChange={onOpenChange} onConfirm={onConfirm} />
    )

    await user.click(screen.getByRole('button', { name: 'Подтвердить отключение Telegram' }))

    expect(mocks.unbind).toHaveBeenCalledTimes(1)
    expect(onOpenChange).not.toHaveBeenCalledWith(false)
    expect(screen.getByRole('alertdialog', { name: 'Отключить Telegram?' })).toBeVisible()

    mocks.isUnbinding = true
    rerender(<UnbindConfirmationDialog open onOpenChange={onOpenChange} onConfirm={onConfirm} />)

    expect(screen.getByRole('button', { name: 'Отменить отключение' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Подтвердить отключение Telegram' })).toBeDisabled()
    await user.keyboard('{Escape}')
    expect(onOpenChange).not.toHaveBeenCalledWith(false)
  })
})
