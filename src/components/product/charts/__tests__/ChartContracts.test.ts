import { createElement } from 'react'
import { describe, expect, it } from 'vitest'

import type {
  ChartActivity,
  ChartFrameProps,
  ChartSelectionEvidence,
  ChartSeriesEvidence,
  ChartSeriesMarker,
  ChartSeriesRole,
  ChartTooltipEntry,
} from '../index'

describe('chart presentation contracts', () => {
  it('keeps terminal and retained chart props structurally distinct', () => {
    const retained: ChartFrameProps = {
      title: 'Выручка',
      period: 'Август',
      units: '₽',
      plotLabel: 'График выручки',
      state: { kind: 'partial', message: 'Доступна часть периода' },
      plot: createElement('div'),
      evidence: {
        summary: 'Сводка',
        alternativeLabel: 'Точные значения',
        dataAlternative: createElement('table'),
      },
    }
    const terminal: ChartFrameProps = {
      title: 'Выручка',
      period: 'Август',
      units: '₽',
      state: { kind: 'empty', message: 'Нет значений' },
    }

    if (false) {
      // @ts-expect-error - terminal data-trust states prohibit plot content
      const loadingWithPlot: ChartFrameProps = {
        title: 'Выручка',
        period: 'Август',
        units: '₽',
        state: { kind: 'loading', message: 'Загрузка' },
        plot: createElement('div'),
      }

      // @ts-expect-error - retained states require both plot and evidence
      const partialWithoutEvidence: ChartFrameProps = {
        title: 'Выручка',
        period: 'Август',
        units: '₽',
        plotLabel: 'График выручки',
        state: { kind: 'partial', message: 'Частичные данные' },
        plot: createElement('div'),
      }

      const renderedWithNullPlot: ChartFrameProps = {
        title: 'Выручка',
        period: 'Август',
        units: '₽',
        plotLabel: 'График выручки',
        state: { kind: 'rendered' },
        // @ts-expect-error - retained plots must be real elements, not nullable placeholders
        plot: null,
        evidence: {
          summary: 'Сводка',
          alternativeLabel: 'Точные значения',
          dataAlternative: createElement('table'),
        },
      }

      const renderedWithStringEvidence: ChartFrameProps = {
        title: 'Выручка',
        period: 'Август',
        units: '₽',
        plotLabel: 'График выручки',
        state: { kind: 'rendered' },
        plot: createElement('div'),
        // @ts-expect-error - retained evidence is a structured contract, not arbitrary content
        evidence: 'not equivalent evidence',
      }

      expect([
        loadingWithPlot,
        partialWithoutEvidence,
        renderedWithNullPlot,
        renderedWithStringEvidence,
      ]).toHaveLength(4)
    }

    expect(retained.state.kind).toBe('partial')
    expect(terminal.state.kind).toBe('empty')
  })

  it('freezes independent activity selection series and tooltip axes', () => {
    const activity = { kind: 'updating', message: 'Обновление' } satisfies ChartActivity
    const selection = {
      label: 'Выбрана неделя',
      effect: 'Детализация ограничена неделей',
    } satisfies ChartSelectionEvidence
    const roles = [
      'categorical',
      'positive',
      'negative',
      'reference',
      'target',
      'forecast',
      'confidence',
      'selection',
    ] satisfies readonly ChartSeriesRole[]
    const markers = [
      'solid',
      'dashed',
      'dotted',
      'point',
      'bar',
      'area',
      'band',
    ] satisfies readonly ChartSeriesMarker[]
    const series = {
      id: 'forecast',
      label: 'Прогноз',
      role: 'forecast',
      marker: 'dashed',
    } satisfies ChartSeriesEvidence
    const tooltip = {
      id: 'forecast',
      label: 'Прогноз',
      formattedValue: '1 234,567',
      unit: '₽',
      role: 'forecast',
      marker: 'dashed',
    } satisfies ChartTooltipEntry

    expect(activity.kind).toBe('updating')
    expect(selection.effect).toContain('неделей')
    expect(roles).toHaveLength(8)
    expect(markers).toHaveLength(7)
    expect(series.role).toBe('forecast')
    expect(tooltip.formattedValue).toBe('1 234,567')
  })
})
