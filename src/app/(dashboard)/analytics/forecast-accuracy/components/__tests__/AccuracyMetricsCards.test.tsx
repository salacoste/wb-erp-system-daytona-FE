import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AccuracyMetricsCards } from '../AccuracyMetricsCards'

describe('AccuracyMetricsCards', () => {
  it('renders all four metric cards', () => {
    render(<AccuracyMetricsCards totalValidated={150} avgMAPE={12.5} avgMAE={3.2} avgBias={0.8} />)
    expect(screen.getByText('Валидировано')).toBeInTheDocument()
    expect(screen.getByText('Средний MAPE')).toBeInTheDocument()
    expect(screen.getByText('Средний MAE')).toBeInTheDocument()
    expect(screen.getByText('Смещение (Bias)')).toBeInTheDocument()
  })

  it('displays total validated count formatted in Russian locale', () => {
    render(<AccuracyMetricsCards totalValidated={1500} avgMAPE={10} avgMAE={2} avgBias={0} />)
    expect(screen.getByText('1 500')).toBeInTheDocument()
  })

  it('shows dash for null MAPE', () => {
    render(<AccuracyMetricsCards totalValidated={10} avgMAPE={null} avgMAE={2} avgBias={0} />)
    // When avgMAPE is null, formatMape returns '—'
    expect(screen.getByText('Средний MAPE')).toBeInTheDocument()
    // MAPE card should render '—' instead of a number
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(1)
  })

  it('shows + sign for positive bias', () => {
    render(<AccuracyMetricsCards totalValidated={10} avgMAPE={10} avgMAE={2} avgBias={1.5} />)
    expect(screen.getByText('+1.5')).toBeInTheDocument()
  })

  it('shows no sign for negative bias', () => {
    render(<AccuracyMetricsCards totalValidated={10} avgMAPE={10} avgMAE={2} avgBias={-2.3} />)
    expect(screen.getByText('-2.3')).toBeInTheDocument()
  })

  it('shows "Завышение" label for positive bias', () => {
    render(<AccuracyMetricsCards totalValidated={10} avgMAPE={10} avgMAE={2} avgBias={1.0} />)
    expect(screen.getByText('Завышение')).toBeInTheDocument()
  })

  it('shows "Занижение" label for negative bias', () => {
    render(<AccuracyMetricsCards totalValidated={10} avgMAPE={10} avgMAE={2} avgBias={-1.0} />)
    expect(screen.getByText('Занижение')).toBeInTheDocument()
  })

  it('shows "Систематическая ошибка" for zero/null bias', () => {
    render(<AccuracyMetricsCards totalValidated={10} avgMAPE={10} avgMAE={2} avgBias={null} />)
    expect(screen.getByText('Систематическая ошибка')).toBeInTheDocument()
  })
})
