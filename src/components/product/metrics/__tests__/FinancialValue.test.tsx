import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { DataAvailability } from '../DataAvailability'
import { FinancialValue } from '../FinancialValue'

describe('FinancialValue', () => {
  it('rejects a numeric payload for the missing state at type-check time', () => {
    type FinancialValueModel = Parameters<typeof FinancialValue>[0]['model']

    // @ts-expect-error - a valid zero uses state "value"; missing cannot carry a numeric value
    const invalidMissingModel: FinancialValueModel = {
      state: 'missing',
      value: 0,
    }

    expect(invalidMissingModel.state).toBe('missing')
  })

  it('rejects incompatible model/format pairs and compact display without precision', () => {
    type FinancialValueProps = Parameters<typeof FinancialValue>[0]

    // @ts-expect-error - numeric models cannot be rendered with temporal formats
    const numericWithTemporalFormat: FinancialValueProps = {
      model: { state: 'value', value: 1 },
      format: { kind: 'date' },
    }
    // @ts-expect-error - temporal models cannot be rendered with numeric formats
    const temporalWithNumericFormat: FinancialValueProps = {
      model: { state: 'temporal', value: '2026-08-12T00:00:00.000Z' },
      format: { kind: 'currency' },
    }
    // @ts-expect-error - compact values must expose caller-supplied full precision
    const compactWithoutPrecision: FinancialValueProps = {
      model: { state: 'value', value: 1_234_567.89 },
      format: { kind: 'currency' },
      display: 'compact',
    }
    // @ts-expect-error - count has no compact renderer contract
    const compactCount: FinancialValueProps = {
      model: { state: 'value', value: 1_234_567 },
      format: { kind: 'count' },
      display: 'compact',
      fullValue: '1 234 567',
    }
    // @ts-expect-error - percentages retain their established full presentation
    const compactPercent: FinancialValueProps = {
      model: { state: 'value', value: 15.5 },
      format: { kind: 'percent' },
      display: 'compact',
      fullValue: '15,5 %',
    }
    // @ts-expect-error - temporal formats do not define compact presentation
    const compactDate: FinancialValueProps = {
      model: { state: 'temporal', value: '2026-08-12T00:00:00.000Z' },
      format: { kind: 'date' },
      display: 'compact',
      fullValue: '12.08.2026',
    }

    expect(numericWithTemporalFormat.model.state).toBe('value')
    expect(temporalWithNumericFormat.model.state).toBe('temporal')
    expect(compactWithoutPrecision.display).toBe('compact')
    expect(compactCount.display).toBe('compact')
    expect(compactPercent.display).toBe('compact')
    expect(compactDate.display).toBe('compact')
  })

  it('renders valid currency zero as available neutral data', () => {
    render(<FinancialValue model={{ state: 'value', value: 0 }} format={{ kind: 'currency' }} />)

    expect(screen.getByTestId('financial-value')).toHaveTextContent('0')
    expect(screen.getByTestId('financial-value')).toHaveTextContent('₽')
    expect(screen.getByTestId('financial-value')).toHaveAttribute('data-direction', 'neutral')
    expect(screen.queryByText('Нет данных')).not.toBeInTheDocument()
  })

  it('renders missing data without fabricating currency zero', () => {
    render(<FinancialValue model={{ state: 'missing' }} format={{ kind: 'currency' }} />)

    expect(screen.getByText('Нет данных')).toHaveAttribute('data-availability', 'missing')
    expect(screen.queryByTestId('financial-value')).not.toBeInTheDocument()
  })

  it('renders unavailable data without collapsing it into missing data', () => {
    render(<FinancialValue model={{ state: 'unavailable' }} format={{ kind: 'currency' }} />)

    expect(screen.getByText('Данные недоступны')).toHaveAttribute(
      'data-availability',
      'unavailable'
    )
    expect(screen.queryByText('Нет данных')).not.toBeInTheDocument()
  })

  it('renders not-calculated as its own explicit state', () => {
    render(<FinancialValue model={{ state: 'not-calculated' }} format={{ kind: 'currency' }} />)

    expect(screen.getByText('Не рассчитано')).toHaveAttribute('data-availability', 'not-calculated')
    expect(screen.queryByTestId('financial-value')).not.toBeInTheDocument()
  })

  it('renders filtered-out as an explicit state distinct from missing and unknown', () => {
    render(<FinancialValue model={{ state: 'filtered-out' }} format={{ kind: 'currency' }} />)

    expect(screen.getByText('Исключено фильтрами')).toHaveAttribute(
      'data-availability',
      'filtered-out'
    )
    expect(screen.queryByText('Нет данных')).not.toBeInTheDocument()
    expect(screen.queryByText('Состояние данных неизвестно')).not.toBeInTheDocument()
    expect(screen.queryByTestId('financial-value')).not.toBeInTheDocument()
  })

  it.each([
    [{ state: 'value', value: 1_234_567.89 } as const, /1\s?234\s?567,89/],
    [{ state: 'value', value: -1_234_567.89 } as const, /-1\s?234\s?567,89/],
  ])(
    'preserves Russian RUB precision and sign without inferring meaning for %o',
    (model, expected) => {
      render(<FinancialValue model={model} format={{ kind: 'currency' }} />)

      const value = screen.getByTestId('financial-value')
      expect(value).toHaveTextContent(expected)
      expect(value).toHaveTextContent('₽')
      expect(value).toHaveAttribute('data-direction', 'neutral')
      expect(value).toHaveClass('tabular-nums')
    }
  )

  it('preserves the percent-unit convention', () => {
    render(
      <FinancialValue
        model={{ state: 'value', value: 15.5 }}
        format={{ kind: 'percent', precision: 1 }}
      />
    )

    expect(screen.getByTestId('financial-value')).toHaveTextContent(/15,5\s%/)
  })

  it('preserves the percentage-point convention independently from percent', () => {
    render(
      <FinancialValue
        model={{ state: 'value', value: -2 }}
        format={{ kind: 'percentage-points' }}
      />
    )
    expect(screen.getByTestId('financial-value')).toHaveTextContent('-2,0 п.п.')
    expect(screen.getByTestId('financial-value')).not.toHaveTextContent('%')
  })

  it('formats a caller-declared quantity with Russian precision and a visible unit', () => {
    render(
      <FinancialValue
        model={{ state: 'value', value: 1_234.56 }}
        format={{ kind: 'quantity', unit: 'кг', precision: 2 }}
      />
    )

    expect(screen.getByTestId('financial-value')).toHaveTextContent(/1\s234,56\sкг/)
  })

  it('formats duration minutes with established Russian duration semantics', () => {
    render(<FinancialValue model={{ state: 'value', value: 150 }} format={{ kind: 'duration' }} />)

    expect(screen.getByTestId('financial-value')).toHaveTextContent('2 ч 30 мин')
  })

  it('honours caller-provided fixed decimal precision', () => {
    render(
      <FinancialValue
        model={{ state: 'value', value: 12.3456 }}
        format={{ kind: 'decimal', precision: 3 }}
      />
    )

    expect(screen.getByTestId('financial-value')).toHaveTextContent('12,346')
  })

  it.each([
    [{ kind: 'date' } as const, '2026-01-20T00:00:00.000Z', /20\.01\.2026/],
    [{ kind: 'date-time' } as const, '2026-01-20T09:30:00.000Z', /20\.01\.2026.*12:30/],
    [{ kind: 'iso-week' } as const, '2024-12-30T00:00:00.000Z', /2025-W01/],
  ])('reuses established temporal semantics for %o', (format, temporal, expected) => {
    render(<FinancialValue model={{ state: 'temporal', value: temporal }} format={format} />)

    expect(screen.getByTestId('financial-value')).toHaveTextContent(expected)
  })

  it.each([
    { kind: 'date' } as const,
    { kind: 'date-time' } as const,
    { kind: 'iso-week' } as const,
  ])('turns invalid temporal input for %o into explicit unknown data', format => {
    render(<FinancialValue model={{ state: 'temporal', value: 'not-a-date' }} format={format} />)

    expect(screen.getByText('Неизвестное значение')).toHaveAttribute('data-availability', 'unknown')
    expect(screen.queryByText('—')).not.toBeInTheDocument()
  })

  it.each([
    ['stale', 'Данные устарели'],
    ['partial', 'Данные неполные'],
    ['estimated', 'Оценочное значение'],
  ] as const)(
    'keeps a supplied %s value visible with textual qualification',
    (availability, label) => {
      render(
        <FinancialValue
          model={{ state: 'value', value: 12, availability }}
          format={{ kind: 'count' }}
        />
      )

      expect(screen.getByTestId('financial-value')).toHaveTextContent('12')
      expect(screen.getByText(label)).toHaveAttribute('data-availability', availability)
    }
  )

  it('discloses caller-supplied full precision in compact mode without title-only access', () => {
    render(
      <FinancialValue
        model={{ state: 'value', value: 1_234_567.89 }}
        format={{ kind: 'currency' }}
        display="compact"
        fullValue="1 234 567,891 ₽"
      />
    )

    expect(screen.getByTestId('financial-value')).toHaveTextContent(/1,2\sмлн/)
    const disclosure = screen.getByText('Точное значение')
    expect(disclosure.closest('summary')).not.toBeNull()
    expect(screen.getByTestId('financial-value-full')).toHaveTextContent('1 234 567,891 ₽')
    expect(screen.getByTestId('financial-value')).not.toHaveAttribute('title')
  })

  it('supports compact duration with caller-supplied full precision disclosure', () => {
    render(
      <FinancialValue
        model={{ state: 'value', value: 150 }}
        format={{ kind: 'duration' }}
        display="compact"
        fullValue="2 часа 30 минут"
      />
    )

    expect(screen.getByTestId('financial-value')).toHaveTextContent('2ч30м')
    expect(screen.getByTestId('financial-value-full')).toHaveTextContent('2 часа 30 минут')
  })

  it.each([Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])(
    'turns non-finite numeric input %s into explicit unknown data',
    value => {
      render(<FinancialValue model={{ state: 'value', value }} format={{ kind: 'count' }} />)

      expect(screen.getByText('Неизвестное значение')).toHaveAttribute(
        'data-availability',
        'unknown'
      )
      expect(screen.queryByText(/^0$/)).not.toBeInTheDocument()
    }
  )

  it('keeps the numeric sign while respecting caller-owned semantic direction', () => {
    render(
      <FinancialValue
        model={{ state: 'value', value: -1250 }}
        format={{ kind: 'currency' }}
        direction="positive"
      />
    )

    expect(screen.getByTestId('financial-value')).toHaveTextContent(/-1\s250/)
    expect(screen.getByTestId('financial-value')).toHaveAttribute('data-direction', 'positive')
  })
})

describe('DataAvailability', () => {
  it.each([
    ['loading', 'Данные загружаются', 'status-pending'],
    ['available', 'Данные доступны', 'availability-available'],
    ['missing', 'Нет данных', 'availability-unknown'],
    ['unavailable', 'Данные недоступны', 'availability-unavailable'],
    ['not-calculated', 'Не рассчитано', 'availability-unknown'],
    ['filtered-out', 'Исключено фильтрами', 'availability-unknown'],
    ['stale', 'Данные устарели', 'availability-stale'],
    ['partial', 'Данные неполные', 'availability-partial'],
    ['estimated', 'Оценочное значение', 'availability-unknown'],
    ['restricted', 'Доступ ограничен', 'availability-restricted'],
    ['unknown', 'Состояние данных неизвестно', 'availability-unknown'],
  ] as const)(
    'renders %s with explicit visible meaning and semantic role',
    (state, label, token) => {
      render(<DataAvailability state={state} />)

      const availability = screen.getByText(label)
      expect(availability).toHaveAttribute('data-availability', state)
      expect(availability).toHaveClass(token)
    }
  )
})
