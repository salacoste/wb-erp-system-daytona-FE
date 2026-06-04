/**
 * TrainModelButton tests — Story 109.4-FE.
 * AC-3, AC-4, AC-7: 8 visual states, Russian copy, WCAG attributes, auto-clear timers.
 */
import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { TrainModelButton } from '../TrainModelButton'
import { ApiError } from '@/types/api'

// ── Mock useTrainAiModel ──────────────────────────────────────────────────────

vi.mock('@/hooks/useTrainAiModel', async importOriginal => {
  const actual = await importOriginal<typeof import('@/hooks/useTrainAiModel')>()
  return {
    ...actual, // keep parseTrainErrorMessage real — pure function
    useTrainAiModel: vi.fn(),
  }
})

import { useTrainAiModel } from '@/hooks/useTrainAiModel'

const mockUseTrainAiModel = vi.mocked(useTrainAiModel)

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeMutation(overrides: Partial<ReturnType<typeof useTrainAiModel>>) {
  return {
    mutate: vi.fn(),
    isPending: false,
    isSuccess: false,
    isError: false,
    data: undefined,
    error: null,
    reset: vi.fn(),
    ...overrides,
  } as unknown as ReturnType<typeof useTrainAiModel>
}

function renderButton(
  modelType: Parameters<typeof TrainModelButton>[0]['modelType'] = 'sales_forecast',
  currentStatus: Parameters<typeof TrainModelButton>[0]['currentStatus'] = 'active'
) {
  return render(React.createElement(TrainModelButton, { modelType, currentStatus }))
}

// ── Tests ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('TrainModelButton — idle state', () => {
  it('renders enabled "Обучить" button when status is active', () => {
    mockUseTrainAiModel.mockReturnValue(makeMutation({}))
    renderButton('sales_forecast', 'active')
    const btn = screen.getByRole('button', { name: 'Обучить' })
    expect(btn).toBeTruthy()
    expect(btn.hasAttribute('disabled')).toBe(false)
  })
})

describe('TrainModelButton — disabled state (currentStatus=training)', () => {
  it('renders disabled button with "Обучается" text and spinner', () => {
    mockUseTrainAiModel.mockReturnValue(makeMutation({}))
    renderButton('sales_forecast', 'training')
    // Button is disabled — can't find by accessible name 'Обучается' alone since
    // Loader2 is also present; find by text content.
    const btn = screen.getByRole('button')
    expect(btn.hasAttribute('disabled')).toBe(true)
    expect(btn.textContent).toContain('Обучается')
  })

  it('spinner has aria-hidden="true" in disabled state', () => {
    mockUseTrainAiModel.mockReturnValue(makeMutation({}))
    const { container } = renderButton('sales_forecast', 'training')
    const spinners = container.querySelectorAll('[aria-hidden="true"]')
    expect(spinners.length).toBeGreaterThanOrEqual(1)
  })

  it('disabled training-state button has aria-busy="true" (F-5 fix, WCAG 2.1 AA)', () => {
    mockUseTrainAiModel.mockReturnValue(makeMutation({}))
    renderButton('sales_forecast', 'training')
    const btn = screen.getByRole('button')
    expect(btn.getAttribute('aria-busy')).toBe('true')
  })
})

describe('TrainModelButton — pending state (mutation in flight)', () => {
  it('renders disabled button with "Обучение запущено..." and aria-busy', () => {
    mockUseTrainAiModel.mockReturnValue(makeMutation({ isPending: true }))
    renderButton('sales_forecast', 'active')
    const btn = screen.getByRole('button')
    expect(btn.hasAttribute('disabled')).toBe(true)
    expect(btn.textContent).toContain('Обучение запущено...')
    expect(btn.getAttribute('aria-busy')).toBe('true')
  })
})

describe('TrainModelButton — click triggers mutation', () => {
  it('calls mutate(modelType) on button click', () => {
    const mutateFn = vi.fn()
    mockUseTrainAiModel.mockReturnValue(makeMutation({ mutate: mutateFn }))
    renderButton('demand_forecast', 'active')
    fireEvent.click(screen.getByRole('button', { name: 'Обучить' }))
    expect(mutateFn).toHaveBeenCalledWith(
      'demand_forecast',
      expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) })
    )
  })

  it('click does NOT propagate to parent (stopPropagation)', () => {
    const parentClickFn = vi.fn()
    mockUseTrainAiModel.mockReturnValue(makeMutation({}))
    const { container } = render(
      React.createElement(
        'div',
        { onClick: parentClickFn },
        React.createElement(TrainModelButton, {
          modelType: 'sales_forecast',
          currentStatus: 'active',
        })
      )
    )
    const btn = container.querySelector('button')!
    fireEvent.click(btn)
    expect(parentClickFn).not.toHaveBeenCalled()
  })
})

describe('TrainModelButton — success states', () => {
  it('success queued (201) → shows "Запущено" inline with role=status aria-live=polite', async () => {
    let capturedOnSuccess: ((response: { status: string; modelType: string }) => void) | undefined
    const mutateFn = vi.fn((_modelType, callbacks) => {
      capturedOnSuccess = callbacks.onSuccess
    })
    mockUseTrainAiModel.mockReturnValue(makeMutation({ mutate: mutateFn }))
    renderButton('sales_forecast', 'active')

    fireEvent.click(screen.getByRole('button', { name: 'Обучить' }))
    act(() => {
      capturedOnSuccess?.({ status: 'queued', modelType: 'sales_forecast' })
    })

    const statusEl = screen.getByRole('status')
    expect(statusEl.textContent).toBe('Запущено')
    expect(statusEl.getAttribute('aria-live')).toBe('polite')
  })

  it('success duplicate (202) → shows "Обучение уже идёт" inline', async () => {
    let capturedOnSuccess: ((response: { status: string; modelType: string }) => void) | undefined
    const mutateFn = vi.fn((_modelType, callbacks) => {
      capturedOnSuccess = callbacks.onSuccess
    })
    mockUseTrainAiModel.mockReturnValue(makeMutation({ mutate: mutateFn }))
    renderButton('sales_forecast', 'active')

    fireEvent.click(screen.getByRole('button', { name: 'Обучить' }))
    act(() => {
      capturedOnSuccess?.({ status: 'duplicate', modelType: 'sales_forecast' })
    })

    expect(screen.getByRole('status').textContent).toBe('Обучение уже идёт')
  })

  it('success message auto-clears after 5 seconds', async () => {
    vi.useFakeTimers()
    let capturedOnSuccess: ((response: { status: string; modelType: string }) => void) | undefined
    const mutateFn = vi.fn((_modelType, callbacks) => {
      capturedOnSuccess = callbacks.onSuccess
    })
    mockUseTrainAiModel.mockReturnValue(makeMutation({ mutate: mutateFn }))
    renderButton('sales_forecast', 'active')

    fireEvent.click(screen.getByRole('button', { name: 'Обучить' }))
    act(() => {
      capturedOnSuccess?.({ status: 'queued', modelType: 'sales_forecast' })
    })
    expect(screen.getByRole('status').textContent).toBe('Запущено')

    act(() => {
      vi.advanceTimersByTime(5_000)
    })
    expect(screen.queryByRole('status')).toBeNull()
  })
})

describe('TrainModelButton — error states', () => {
  it('error 422 with structured body → renders interpolated copy', () => {
    let capturedOnError: ((err: ApiError) => void) | undefined
    const mutateFn = vi.fn((_modelType, callbacks) => {
      capturedOnError = callbacks.onError
    })
    mockUseTrainAiModel.mockReturnValue(makeMutation({ mutate: mutateFn }))
    renderButton('sales_forecast', 'active')

    fireEvent.click(screen.getByRole('button', { name: 'Обучить' }))
    act(() => {
      capturedOnError?.(
        new ApiError('Insufficient data', 422, {
          error: { code: 'INSUFFICIENT_DATA', message: 'Not enough data' },
          weeksCollected: 8,
          weeksRequired: 12,
          cogsCoveragePct: 75,
        })
      )
    })

    const statusEl = screen.getByRole('status')
    // textContent preserves the real U+00A0 NBSP (no getByText normalization) → "75 %"
    expect(statusEl.textContent).toBe(
      `Недостаточно данных: собрано 8/12 нед., покрытие COGS 75${String.fromCharCode(0xa0)}%`
    )
    expect(statusEl.className).toContain('text-destructive')
  })

  it('error 429 → renders "Превышен лимит обучения, попробуйте через час"', () => {
    let capturedOnError: ((err: ApiError) => void) | undefined
    const mutateFn = vi.fn((_modelType, callbacks) => {
      capturedOnError = callbacks.onError
    })
    mockUseTrainAiModel.mockReturnValue(makeMutation({ mutate: mutateFn }))
    renderButton('sales_forecast', 'active')

    fireEvent.click(screen.getByRole('button', { name: 'Обучить' }))
    act(() => {
      capturedOnError?.(new ApiError('Too Many Requests', 429, null))
    })

    expect(screen.getByRole('status').textContent).toBe(
      'Превышен лимит обучения, попробуйте через час'
    )
  })

  it('error other → renders "Ошибка запуска обучения: {message}"', () => {
    let capturedOnError: ((err: ApiError) => void) | undefined
    const mutateFn = vi.fn((_modelType, callbacks) => {
      capturedOnError = callbacks.onError
    })
    mockUseTrainAiModel.mockReturnValue(makeMutation({ mutate: mutateFn }))
    renderButton('sales_forecast', 'active')

    fireEvent.click(screen.getByRole('button', { name: 'Обучить' }))
    act(() => {
      capturedOnError?.(new ApiError('Service unavailable', 503, null))
    })

    expect(screen.getByRole('status').textContent).toBe(
      'Ошибка запуска обучения: Service unavailable'
    )
  })

  it('error message auto-clears after 8 seconds', () => {
    vi.useFakeTimers()
    let capturedOnError: ((err: ApiError) => void) | undefined
    const mutateFn = vi.fn((_modelType, callbacks) => {
      capturedOnError = callbacks.onError
    })
    mockUseTrainAiModel.mockReturnValue(makeMutation({ mutate: mutateFn }))
    renderButton('sales_forecast', 'active')

    fireEvent.click(screen.getByRole('button', { name: 'Обучить' }))
    act(() => {
      capturedOnError?.(new ApiError('Server Error', 500, null))
    })
    expect(screen.getByRole('status')).toBeTruthy()

    act(() => {
      vi.advanceTimersByTime(8_000)
    })
    expect(screen.queryByRole('status')).toBeNull()
  })
})

describe('TrainModelButton — WCAG attributes', () => {
  it('idle button has aria-busy=false', () => {
    mockUseTrainAiModel.mockReturnValue(makeMutation({}))
    renderButton('sales_forecast', 'active')
    const btn = screen.getByRole('button', { name: 'Обучить' })
    expect(btn.getAttribute('aria-busy')).toBe('false')
  })

  it('pending button has aria-busy=true', () => {
    mockUseTrainAiModel.mockReturnValue(makeMutation({ isPending: true }))
    renderButton('sales_forecast', 'active')
    expect(screen.getByRole('button').getAttribute('aria-busy')).toBe('true')
  })

  it('status span has role=status and aria-live=polite', () => {
    let capturedOnSuccess: ((response: { status: string; modelType: string }) => void) | undefined
    const mutateFn = vi.fn((_modelType, callbacks) => {
      capturedOnSuccess = callbacks.onSuccess
    })
    mockUseTrainAiModel.mockReturnValue(makeMutation({ mutate: mutateFn }))
    renderButton('sales_forecast', 'active')
    fireEvent.click(screen.getByRole('button', { name: 'Обучить' }))
    act(() => {
      capturedOnSuccess?.({ status: 'queued', modelType: 'sales_forecast' })
    })
    const el = screen.getByRole('status')
    expect(el.getAttribute('aria-live')).toBe('polite')
  })
})
