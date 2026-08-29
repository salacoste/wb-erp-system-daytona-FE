import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { QuietHoursPanel } from '../QuietHoursPanel'

const quietHoursFixture = {
  enabled: true,
  from: '23:00',
  to: '07:00',
  timezone: 'Europe/Moscow',
}

const mocks = vi.hoisted(() => ({
  quietHours: undefined as typeof quietHoursFixture | undefined,
  updateQuietHours: vi.fn(),
}))

vi.mock('@/hooks/useQuietHours', () => ({
  useQuietHours: () => ({
    quietHours: mocks.quietHours,
    updateQuietHours: mocks.updateQuietHours,
    isUpdating: false,
    isQuietHoursActive: false,
  }),
}))

function expectAssociatedError(input: HTMLElement) {
  expect(input).toHaveAttribute('aria-invalid', 'true')

  const describedBy = input.getAttribute('aria-describedby')
  expect(describedBy).toBeTruthy()

  const associatedError = describedBy
    ?.split(/\s+/)
    .map(id => document.getElementById(id))
    .find(element => element?.getAttribute('role') === 'alert')

  expect(associatedError).toBeVisible()
  expect(associatedError).not.toHaveTextContent(/^\s*$/)
}

describe('QuietHoursPanel time validation', () => {
  beforeEach(() => {
    mocks.updateQuietHours.mockClear()
    mocks.quietHours = { ...quietHoursFixture }
  })

  it('keeps an empty start time as a visible associated error without mutating preferences', () => {
    render(<QuietHoursPanel />)

    const startTime = screen.getByLabelText('Начало тихих часов')
    fireEvent.change(startTime, { target: { value: '' } })

    expect(startTime).toHaveValue('')
    expectAssociatedError(startTime)
    expect(mocks.updateQuietHours).not.toHaveBeenCalled()
  })

  it('rejects an invalid HH:MM value without mutating preferences', () => {
    render(<QuietHoursPanel />)

    const endTime = screen.getByLabelText('Конец тихих часов') as HTMLInputElement
    Object.defineProperty(endTime, 'value', {
      configurable: true,
      value: '25:00',
    })
    fireEvent.change(endTime)

    expectAssociatedError(endTime)
    expect(mocks.updateQuietHours).not.toHaveBeenCalled()
  })

  it('writes a valid HH:MM change immediately with the complete quiet-hours value', async () => {
    render(<QuietHoursPanel />)

    fireEvent.change(screen.getByLabelText('Начало тихих часов'), {
      target: { value: '22:30' },
    })

    await waitFor(() => {
      expect(mocks.updateQuietHours).toHaveBeenCalledTimes(1)
    })
    expect(mocks.updateQuietHours).toHaveBeenCalledWith({
      ...quietHoursFixture,
      from: '22:30',
    })
  })

  it('does not send an invalid draft when the other time becomes valid', () => {
    render(<QuietHoursPanel />)

    fireEvent.change(screen.getByLabelText('Начало тихих часов'), {
      target: { value: '' },
    })
    fireEvent.change(screen.getByLabelText('Конец тихих часов'), {
      target: { value: '08:00' },
    })

    expect(mocks.updateQuietHours).not.toHaveBeenCalled()
  })

  it('does not send an invalid draft through a timezone change', async () => {
    const user = userEvent.setup()
    render(<QuietHoursPanel />)

    fireEvent.change(screen.getByLabelText('Начало тихих часов'), {
      target: { value: '' },
    })
    await user.click(screen.getByRole('combobox', { name: 'Выберите часовой пояс' }))
    await user.click(screen.getByRole('option', { name: 'Самара (GMT+4)' }))

    expect(mocks.updateQuietHours).not.toHaveBeenCalled()
  })

  it('does not send an invalid draft through the enabled switch', () => {
    render(<QuietHoursPanel />)

    fireEvent.change(screen.getByLabelText('Начало тихих часов'), {
      target: { value: '' },
    })
    fireEvent.click(screen.getByRole('switch', { name: 'Включить тихие часы' }))

    expect(mocks.updateQuietHours).not.toHaveBeenCalled()
  })

  it('writes once after the complete invalid draft becomes valid again', async () => {
    render(<QuietHoursPanel />)

    fireEvent.change(screen.getByLabelText('Начало тихих часов'), {
      target: { value: '' },
    })
    fireEvent.change(screen.getByLabelText('Конец тихих часов'), {
      target: { value: '08:00' },
    })
    fireEvent.change(screen.getByLabelText('Начало тихих часов'), {
      target: { value: '22:30' },
    })

    await waitFor(() => expect(mocks.updateQuietHours).toHaveBeenCalledTimes(1))
    expect(mocks.updateQuietHours).toHaveBeenCalledWith({
      ...quietHoursFixture,
      from: '22:30',
      to: '08:00',
    })
  })

  it('identifies an overnight range when the hours are equal but the start minute is later', () => {
    render(<QuietHoursPanel />)

    fireEvent.change(screen.getByLabelText('Конец тихих часов'), {
      target: { value: '23:00' },
    })
    fireEvent.change(screen.getByLabelText('Начало тихих часов'), {
      target: { value: '23:30' },
    })

    expect(screen.getByText('(период через полночь)')).toBeVisible()
  })

  it('uses a route-level h2 for the quiet-hours panel', () => {
    render(<QuietHoursPanel />)

    expect(screen.getByRole('heading', { level: 2, name: 'Тихие часы' })).toBeVisible()
  })

  it('keeps the route-level h2 while quiet-hours data is loading', () => {
    mocks.quietHours = undefined
    render(<QuietHoursPanel />)

    expect(screen.getByRole('heading', { level: 2, name: 'Тихие часы' })).toBeVisible()
  })
})
