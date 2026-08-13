import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe, toHaveNoViolations } from 'jest-axe'
import { describe, expect, it, vi } from 'vitest'

import { PageState } from '../PageState'

expect.extend(toHaveNoViolations)

describe('PageState', () => {
  it('renders a truthful retained partial state with visible recovery context', () => {
    render(
      <PageState
        state="partial"
        title="Загружена только часть заказов"
        explanation="Не удалось получить два кабинета."
        trust="Показанные 18 заказов актуальны для доступных кабинетов."
        context={<span>Период: 1–14 августа, кабинет: Север</span>}
        limitation={<span>Недоступно кабинетов: 2</span>}
        action={<button type="button">Повторить для недоступных кабинетов</button>}
      >
        <div>18 надёжных заказов</div>
      </PageState>
    )

    const region = screen.getByRole('region', { name: 'Загружена только часть заказов' })
    expect(region).toHaveAttribute('data-state', 'partial')
    expect(region).toHaveTextContent('Показанные 18 заказов актуальны')
    expect(region).toHaveTextContent('Недоступно кабинетов: 2')
    expect(region).toHaveTextContent('Период: 1–14 августа, кабинет: Север')
    expect(screen.getByText('18 надёжных заказов')).toBeInTheDocument()
  })

  it('requires filtered scope/reset and error recovery while terminal states reject retained data', () => {
    if (false) {
      // @ts-expect-error - filtered-empty requires scope and reset action
      ;<PageState
        state="filtered-empty"
        title="Нет совпадений"
        explanation="Фильтр пуст."
        trust="Полный набор данных не изменён."
      />

      // @ts-expect-error - error requires a caller-owned recovery action
      ;<PageState
        state="error"
        title="Не удалось загрузить"
        explanation="Сеть недоступна."
        trust="Актуальность данных неизвестна."
      />

      // @ts-expect-error - terminal loading cannot fabricate retained content
      ;<PageState
        state="loading"
        title="Загрузка"
        explanation="Подождите."
        trust="Данные ещё не получены."
      >
        <div>Старые данные</div>
      </PageState>

      // @ts-expect-error - every state requires an explicit data-trust statement
      ;<PageState state="empty" title="Нет данных" explanation="Записей пока нет." />

      // @ts-expect-error - not-found requires a next valid action
      ;<PageState
        state="not-found"
        title="Объект не найден"
        explanation="Он удалён или адрес изменился."
        trust="Другие данные не изменились."
      />

      ;<PageState
        state="filtered-empty"
        title="Нет совпадений"
        explanation="Фильтр пуст."
        trust="Полный набор данных не изменён."
        scope="Активные фильтры"
        // @ts-expect-error - reset evidence must be a rendered action element
        resetAction="Сбросить фильтры"
      />

      ;<PageState
        state="error"
        title="Не удалось загрузить"
        explanation="Сеть недоступна."
        trust="Актуальность данных неизвестна."
        // @ts-expect-error - recovery evidence must be a rendered action element
        recovery="Повторить загрузку"
      />

      ;<PageState
        state="not-found"
        title="Объект не найден"
        explanation="Он удалён или адрес изменился."
        trust="Другие данные не изменились."
        // @ts-expect-error - required action evidence must be a rendered element
        action="Вернуться к списку"
      />

      ;<PageState
        state="empty"
        title="Нет данных"
        explanation="Записей пока нет."
        trust="Набор данных пуст."
        // @ts-expect-error - optional page actions must be rendered elements
        action="Создать первую запись"
      />
    }

    expect(true).toBe(true)
  })

  it('rejects blank trust and missing rendered actions at runtime', () => {
    expect(() =>
      render(
        <PageState state="empty" title="Нет данных" explanation="Записей пока нет." trust="   " />
      )
    ).toThrow(/trust evidence must be a non-empty string/i)

    expect(() =>
      render(
        <PageState
          state="not-found"
          title="Объект не найден"
          explanation="Он удалён."
          trust="Другие данные не изменились."
          action={null as never}
        />
      )
    ).toThrow(/not-found.*rendered action element/i)

    expect(() =>
      render(
        <PageState
          state="filtered-empty"
          title="Нет совпадений"
          explanation="Фильтр пуст."
          trust="Полный набор данных не изменён."
          scope="Активные фильтры"
          resetAction={'Сбросить фильтры' as never}
        />
      )
    ).toThrow(/filtered-empty.*rendered reset action element/i)

    expect(() =>
      render(
        <PageState
          state="error"
          title="Не удалось загрузить"
          explanation="Сеть недоступна."
          trust="Актуальность данных неизвестна."
          recovery={'Повторить загрузку' as never}
        />
      )
    ).toThrow(/error.*rendered recovery action element/i)

    expect(() =>
      render(
        <PageState
          state="empty"
          title="Нет данных"
          explanation="Записей пока нет."
          trust="Набор данных пуст."
          action={'Создать первую запись' as never}
        />
      )
    ).toThrow(/page state action must be a rendered element/i)
  })

  it('uses an alert for errors and preserves caller-owned recovery interaction', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()

    render(
      <PageState
        state="error"
        title="Не удалось загрузить заказы"
        explanation="Соединение прервано."
        trust="Данные на странице нельзя считать актуальными."
        recovery={<button onClick={onRetry}>Повторить загрузку заказов</button>}
      />
    )

    expect(screen.getByRole('alert')).toHaveAccessibleName('Не удалось загрузить заказы')
    await user.click(screen.getByRole('button', { name: 'Повторить загрузку заказов' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('keeps routine loading polite and exposes filtered reset scope', () => {
    const { rerender } = render(
      <PageState
        state="loading"
        title="Загрузка заказов"
        explanation="Получаем данные."
        trust="Данные ещё не получены."
      />
    )

    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite')
    expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true')

    rerender(
      <PageState
        state="filtered-empty"
        title="По фильтрам ничего не найдено"
        explanation="Измените условия поиска."
        trust="Данные за пределами фильтра не изменились."
        scope={<span>Кабинет: Север, статус: новый</span>}
        resetAction={<button type="button">Сбросить фильтры заказов</button>}
      />
    )

    expect(screen.getByText('Кабинет: Север, статус: новый')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Сбросить фильтры заказов' })).toBeInTheDocument()
  })

  it('keeps retained content and actions outside the concise live state message', () => {
    render(
      <PageState
        state="partial"
        title="Загружена часть заказов"
        explanation="Два кабинета недоступны."
        trust="Показанные данные надёжны."
        limitation="Недоступны два кабинета."
        action={<button type="button">Повторить</button>}
      >
        <div>18 заказов</div>
      </PageState>
    )

    const liveStatus = screen.getByRole('status')
    expect(liveStatus).toHaveAccessibleName('Загружена часть заказов')
    expect(liveStatus).toHaveTextContent('Два кабинета недоступны.')
    expect(liveStatus).not.toHaveTextContent('Загружена часть заказов')
    expect(liveStatus).not.toHaveTextContent('18 заказов')
    expect(liveStatus).not.toHaveTextContent('Повторить')
    expect(screen.getByRole('region', { name: 'Загружена часть заказов' })).toContainElement(
      screen.getByText('18 заказов')
    )
  })

  it('lets long action labels wrap inside the shared 44px target contract', () => {
    render(
      <PageState
        state="not-found"
        title="Страница не найдена"
        explanation="Запрошенная страница отсутствует."
        trust="Путь не раскрывается в сообщении."
        action={
          <button type="button">Вернуться к очень длинному списку подтверждённых операций</button>
        }
      />
    )

    expect(screen.getByRole('button').parentElement).toHaveClass(
      '[&_button]:whitespace-normal',
      '[&_button]:break-words'
    )
  })

  it('has no automated accessibility violations', async () => {
    const { container } = render(
      <PageState
        state="stale"
        title="Данные требуют обновления"
        explanation="Последняя успешная загрузка была 14 августа в 09:30."
        trust="Существующие значения сохранены, но могли измениться."
        limitation={<span>Новые операции могут отсутствовать.</span>}
        action={<a href="/">Вернуться на главную</a>}
      >
        <div>Сохранённые значения</div>
      </PageState>
    )

    expect(await axe(container)).toHaveNoViolations()
  })
})
