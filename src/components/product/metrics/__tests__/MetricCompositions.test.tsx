import { render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { MetricCard } from '../MetricCard'
import { MetricGroup } from '../MetricGroup'

describe('MetricCard', () => {
  it('rejects a fabricated value in the loading state at type-check time', () => {
    type MetricCardState = Parameters<typeof MetricCard>[0]['state']

    const invalidLoadingState: MetricCardState = {
      kind: 'loading',
      // @ts-expect-error - loading is structurally distinct from ready and cannot carry a value
      value: { state: 'value', value: 0 },
    }

    expect(invalidLoadingState.kind).toBe('loading')
  })

  it('rejects a second availability channel and compact ready state without precision', () => {
    type MetricCardState = Parameters<typeof MetricCard>[0]['state']

    const duplicateAvailability: MetricCardState = {
      kind: 'ready',
      value: { state: 'value', value: 10, availability: 'partial' },
      format: { kind: 'count' },
      // @ts-expect-error - availability belongs to the value model only
      availability: { state: 'available' },
    }
    // @ts-expect-error - compact cards must expose full precision
    const compactWithoutPrecision: MetricCardState = {
      kind: 'ready',
      value: { state: 'value', value: 1_234_567.89 },
      format: { kind: 'currency' },
      valueDisplay: 'compact',
    }
    const compactCount: MetricCardState = {
      kind: 'ready',
      value: { state: 'value', value: 1_234_567 },
      // @ts-expect-error - count has no compact renderer contract
      format: { kind: 'count' },
      valueDisplay: 'compact',
      fullValue: '1 234 567',
    }

    expect(duplicateAvailability.kind).toBe('ready')
    expect(compactWithoutPrecision.kind).toBe('ready')
    expect(compactCount.kind).toBe('ready')
  })

  it('renders ready value, definition, period, availability, and caller-owned action in order', () => {
    render(
      <MetricCard
        label="Валовая прибыль"
        definition="Выручка за вычетом прямых расходов"
        period="1–7 августа 2026"
        action={<button type="button">Открыть детализацию</button>}
        state={{
          kind: 'ready',
          value: {
            state: 'value',
            value: 125_400.5,
            availability: { state: 'partial', description: 'Не получены два дня' },
          },
          format: { kind: 'currency' },
        }}
      />
    )

    const card = screen.getByRole('article', { name: 'Валовая прибыль' })
    expect(within(card).getByText('Валовая прибыль')).toBeInTheDocument()
    expect(within(card).getByTestId('financial-value')).toHaveTextContent('125')
    expect(within(card).getByTestId('financial-value')).toHaveTextContent('₽')
    expect(within(card).getByText('Выручка за вычетом прямых расходов')).toBeInTheDocument()
    expect(within(card).getByText('1–7 августа 2026')).toBeInTheDocument()
    expect(within(card).getByText('Данные неполные')).toBeInTheDocument()
    expect(within(card).getByText('Не получены два дня')).toBeInTheDocument()
    expect(within(card).getByRole('button', { name: 'Открыть детализацию' })).toBeInTheDocument()
  })

  it('keeps loading explicit without fabricating a value', () => {
    render(<MetricCard label="Заказы" state={{ kind: 'loading', label: 'Загрузка заказов' }} />)

    expect(screen.getByRole('article', { name: 'Заказы' })).toHaveAttribute('data-state', 'loading')
    expect(screen.getByRole('status')).toHaveTextContent('Загрузка заказов')
    expect(screen.queryByTestId('financial-value')).not.toBeInTheDocument()
  })

  it('keeps operational error and caller-owned recovery explicit', () => {
    render(
      <MetricCard
        label="Заказы"
        state={{
          kind: 'error',
          message: 'Не удалось получить метрику',
          recovery: <button type="button">Повторить</button>,
        }}
      />
    )
    expect(screen.getByRole('article', { name: 'Заказы' })).toHaveAttribute('data-state', 'error')
    expect(screen.getByRole('alert')).toHaveTextContent('Не удалось получить метрику')
    expect(screen.getByRole('button', { name: 'Повторить' })).toBeInTheDocument()
  })

  it.each(['hero', 'standard', 'compact', 'dense'] as const)(
    'changes density without changing ready semantics in %s mode',
    variant => {
      render(
        <MetricCard
          label="Рентабельность"
          variant={variant}
          state={{
            kind: 'ready',
            value: { state: 'value', value: 15.5 },
            format: { kind: 'percent', precision: 1 },
          }}
        />
      )

      expect(screen.getByRole('article', { name: 'Рентабельность' })).toHaveAttribute(
        'data-variant',
        variant
      )
      expect(screen.getByTestId('financial-value')).toHaveTextContent(/15,5\s%/)
    }
  )

  it.each([
    ['increase', 'positive', 'Рост', '2'],
    ['increase', 'negative', 'Рост расходов', '2'],
    ['decrease', 'positive', 'Снижение расходов', '-'],
    ['decrease', 'negative', 'Снижение прибыли', '-'],
    ['unchanged', 'neutral', 'Без изменений', '0'],
    ['increase', 'unknown', 'Смысл сравнения неизвестен', '2'],
  ] as const)(
    'keeps %s direction independent from %s sentiment',
    (direction, sentiment, label, expectedDelta) => {
      const delta = direction === 'unchanged' ? 0 : direction === 'increase' ? 2 : -2
      render(
        <MetricCard
          label="Сравнение"
          state={{
            kind: 'ready',
            value: { state: 'value', value: 100 },
            format: { kind: 'count' },
            comparison: {
              label,
              direction,
              sentiment,
              delta: { state: 'value', value: delta },
              format: { kind: 'count' },
            },
          }}
        />
      )

      const comparison = screen.getByTestId('metric-comparison')
      expect(comparison).toHaveAttribute('data-direction', direction)
      expect(comparison).toHaveAttribute('data-sentiment', sentiment)
      expect(comparison).toHaveTextContent(label)
      expect(comparison).toHaveTextContent(expectedDelta)
      expect(comparison.querySelector('[data-comparison-icon]')).not.toBeNull()
    }
  )

  it('preserves a caller-supplied numeric sign even when direction disagrees', () => {
    render(
      <MetricCard
        label="Противоречивый caller input"
        state={{
          kind: 'ready',
          value: { state: 'value', value: 100 },
          format: { kind: 'count' },
          comparison: {
            label: 'Направление роста',
            direction: 'increase',
            sentiment: 'neutral',
            delta: { state: 'value', value: -2 },
            format: { kind: 'count' },
          },
        }}
      />
    )

    expect(screen.getByTestId('metric-comparison')).toHaveTextContent('-2')
    expect(screen.getByTestId('metric-comparison')).not.toHaveTextContent('+-2')
  })

  it('accepts block content in public slots without invalid DOM nesting warnings', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    render(
      <MetricCard
        label="Выручка"
        period={<div>Период блоком</div>}
        definition={<div>Определение блоком</div>}
        action={<div>Действие блоком</div>}
        state={{
          kind: 'ready',
          value: { state: 'value', value: 10 },
          format: { kind: 'currency' },
        }}
      />
    )

    expect(screen.getByText('Период блоком')).toBeInTheDocument()
    expect(screen.getByText('Определение блоком')).toBeInTheDocument()
    expect(screen.getByText('Действие блоком')).toBeInTheDocument()
    expect(consoleError).not.toHaveBeenCalled()

    consoleError.mockRestore()
  })
})

describe('MetricGroup', () => {
  it.each(['hero', 'standard', 'compact', 'dense'] as const)(
    'creates a named section and preserves child DOM order for %s',
    variant => {
      render(
        <MetricGroup
          title="Финансовый результат"
          description="Ключевые показатели"
          context="Период: август"
          variant={variant}
        >
          <span>Первая метрика</span>
          <span>Вторая метрика</span>
        </MetricGroup>
      )

      const section = screen.getByRole('region', { name: 'Финансовый результат' })
      expect(section).toHaveAttribute('data-variant', variant)
      expect(within(section).getByText('Ключевые показатели')).toBeInTheDocument()
      expect(within(section).getByText('Период: август')).toBeInTheDocument()
      expect(
        within(section)
          .getAllByText(/метрика/)
          .map(node => node.textContent)
      ).toEqual(['Первая метрика', 'Вторая метрика'])
    }
  )

  it('preserves a caller-owned group action without taking navigation ownership', () => {
    render(
      <MetricGroup
        title="Операционные метрики"
        action={<button type="button">Открыть отчёт</button>}
      >
        <span>Заказы</span>
      </MetricGroup>
    )

    const region = screen.getByRole('region', { name: 'Операционные метрики' })
    expect(within(region).getByRole('button', { name: 'Открыть отчёт' })).toBeInTheDocument()
  })

  it('accepts block content in group description and action slots', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    render(
      <MetricGroup
        title="Метрики"
        description={<div>Описание блоком</div>}
        action={<div>Действие группы блоком</div>}
      >
        <div>Метрика</div>
      </MetricGroup>
    )

    expect(screen.getByText('Описание блоком')).toBeInTheDocument()
    expect(screen.getByText('Действие группы блоком')).toBeInTheDocument()
    expect(consoleError).not.toHaveBeenCalled()

    consoleError.mockRestore()
  })
})
