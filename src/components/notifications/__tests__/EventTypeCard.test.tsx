import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { EventTypeCard } from '../EventTypeCard'

describe('EventTypeCard', () => {
  const onToggle = vi.fn()

  beforeEach(() => {
    onToggle.mockClear()
  })

  it('exposes one Switch as the sole interactive control with its current state', () => {
    const { container } = render(
      <EventTypeCard
        title="Задача выполнена"
        description="Уведомлять после успешного завершения задачи"
        enabled
        onToggle={onToggle}
      />
    )

    const switches = screen.getAllByRole('switch')
    expect(switches).toHaveLength(1)
    expect(switches[0]).toBeChecked()

    const interactiveElements = container.querySelectorAll(
      'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    expect(interactiveElements).toHaveLength(1)
    expect(interactiveElements[0]).toBe(switches[0])
  })

  it('explicitly associates the Switch with its title and description', () => {
    render(
      <EventTypeCard
        title="Ошибка задачи"
        description="Уведомлять, когда задача завершилась с ошибкой"
        enabled={false}
        onToggle={onToggle}
      />
    )

    const control = screen.getByRole('switch', { name: 'Ошибка задачи' })
    const title = screen.getByText('Ошибка задачи')
    const description = screen.getByText('Уведомлять, когда задача завершилась с ошибкой')

    expect(control).not.toBeChecked()
    expect(title).toHaveAttribute('id')
    expect(description).toHaveAttribute('id')
    expect(control).toHaveAttribute('aria-labelledby', title.id)
    expect(control).toHaveAttribute('aria-describedby', description.id)
    expect(control).toHaveAccessibleDescription(description.textContent ?? '')
  })

  it('toggles exactly once from either the card label or the Switch', async () => {
    const user = userEvent.setup()

    render(
      <EventTypeCard
        title="Ежедневный дайджест"
        description="Получать ежедневную сводку"
        enabled={false}
        onToggle={onToggle}
      />
    )

    await user.click(screen.getByText('Ежедневный дайджест'))
    expect(onToggle).toHaveBeenCalledTimes(1)

    onToggle.mockClear()
    await user.click(screen.getByRole('switch', { name: 'Ежедневный дайджест' }))
    expect(onToggle).toHaveBeenCalledTimes(1)
  })

  it('does not toggle when an interactive child is used', async () => {
    const user = userEvent.setup()

    render(
      <EventTypeCard
        title="Ежедневный дайджест"
        description="Получать ежедневную сводку"
        enabled
        onToggle={onToggle}
      >
        <label>
          Время отправки
          <input type="time" aria-label="Время отправки" defaultValue="08:00" />
        </label>
      </EventTypeCard>
    )

    const timeInput = screen.getByLabelText('Время отправки')
    await user.click(timeInput)
    await user.clear(timeInput)
    await user.type(timeInput, '09:15')

    expect(onToggle).not.toHaveBeenCalled()
  })
})
