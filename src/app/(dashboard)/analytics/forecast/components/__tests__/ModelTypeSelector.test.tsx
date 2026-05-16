/**
 * ModelTypeSelector Tests — Story 109.1-FE.
 * Covers: MODEL_TYPE_LABELS export shape (7 entries, byte-correct Russian), default-value
 * trigger render, and label↔control accessibility association.
 */
import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MODEL_TYPE_LABELS, ModelTypeSelector } from '../ModelTypeSelector'
import { MODEL_TYPES } from '@/types/ai-forecast'

describe('MODEL_TYPE_LABELS', () => {
  it('has exactly 7 entries — one per ModelType', () => {
    expect(Object.keys(MODEL_TYPE_LABELS)).toHaveLength(7)
  })

  it('sales_forecast → Прогноз продаж', () => {
    expect(MODEL_TYPE_LABELS['sales_forecast']).toBe('Прогноз продаж')
  })
  it('daily_revenue_forecast → Прогноз выручки (день)', () => {
    expect(MODEL_TYPE_LABELS['daily_revenue_forecast']).toBe('Прогноз выручки (день)')
  })
  it('search_conversion_forecast → Конверсия в поиске', () => {
    expect(MODEL_TYPE_LABELS['search_conversion_forecast']).toBe('Конверсия в поиске')
  })
  it('weekly_margin_forecast → Маржинальность (неделя)', () => {
    expect(MODEL_TYPE_LABELS['weekly_margin_forecast']).toBe('Маржинальность (неделя)')
  })
  it('funnel_stage_prediction → Конверсия воронки', () => {
    expect(MODEL_TYPE_LABELS['funnel_stage_prediction']).toBe('Конверсия воронки')
  })
  it('demand_forecast → Прогноз спроса', () => {
    expect(MODEL_TYPE_LABELS['demand_forecast']).toBe('Прогноз спроса')
  })
  it('stockout_risk → Риск out-of-stock', () => {
    expect(MODEL_TYPE_LABELS['stockout_risk']).toBe('Риск out-of-stock')
  })

  it('covers all MODEL_TYPES entries', () => {
    for (const type of MODEL_TYPES) {
      expect(MODEL_TYPE_LABELS[type]).toBeTruthy()
    }
  })
})

describe('ModelTypeSelector', () => {
  it('renders the "Тип модели" label', () => {
    render(
      React.createElement(ModelTypeSelector, {
        value: 'sales_forecast',
        onValueChange: vi.fn(),
      })
    )
    expect(screen.getByText('Тип модели')).toBeTruthy()
  })

  it('label is associated with the trigger via htmlFor/id', () => {
    render(
      React.createElement(ModelTypeSelector, {
        value: 'sales_forecast',
        onValueChange: vi.fn(),
      })
    )
    const label = screen.getByText('Тип модели')
    expect(label.getAttribute('for')).toBe('modelType')
  })

  it('default value "sales_forecast" shows correct Russian label in trigger', () => {
    render(
      React.createElement(ModelTypeSelector, {
        value: 'sales_forecast',
        onValueChange: vi.fn(),
      })
    )
    expect(screen.getByText('Прогноз продаж')).toBeTruthy()
  })
})
