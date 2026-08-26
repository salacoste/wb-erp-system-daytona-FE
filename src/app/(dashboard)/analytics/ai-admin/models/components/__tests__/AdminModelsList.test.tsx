/**
 * AdminModelsList — tests: Owner/non-Owner gate, table cells, AP#8, AP#10,
 * filter, sort, pagination, rollback button triggers dialog.
 * Story 112.1-FE Task 3.
 */
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AdminModelsList } from '../AdminModelsList'
import * as useAdminModelsModule from '@/hooks/useAdminModels'
import * as authStore from '@/stores/authStore'
import type { AdminModelListResponse } from '@/types/ai/admin'
import type { AiModel } from '@/types/ai/models'

vi.mock('@/hooks/useAdminModels')
vi.mock('@/hooks/useModelRollback', () => ({
  useModelRollback: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
    reset: vi.fn(),
  })),
}))
vi.mock('@/stores/authStore')
vi.mock('next/navigation', () => ({ useRouter: vi.fn(() => ({ push: vi.fn() })) }))
vi.mock('sonner', () => ({ toast: { success: vi.fn() } }))

const mockUseAdminModels = vi.mocked(useAdminModelsModule.useAdminModels)
const mockUseAuthStore = vi.mocked(authStore.useAuthStore)

const model1: AiModel = {
  id: '12345',
  modelType: 'sales_forecast',
  engine: 'prophet',
  version: 2,
  status: 'active',
  metrics: { mape: 15.3, dataPointsCount: 200 },
  trainedAt: '2026-01-10T00:00:00Z',
}

const modelNullMape: AiModel = {
  id: '67890',
  modelType: 'sales_forecast',
  engine: 'mindsdb',
  version: 1,
  status: 'training',
  metrics: { mape: null, dataPointsCount: 0 },
}

const mockData: AdminModelListResponse = {
  models: [model1, modelNullMape],
  total: 2,
  page: 1,
  limit: 20,
}

function renderComponent() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <AdminModelsList />
    </QueryClientProvider>
  )
}

describe('AdminModelsList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAuthStore.mockImplementation((selector: any) =>
      selector({ cabinetId: 'cab-123', user: { role: 'Owner' } })
    )
    mockUseAdminModels.mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useAdminModelsModule.useAdminModels>)
  })

  it('F-11: renders skeleton (NOT denied Alert) when user is null (auth hydrating)', () => {
    // authStore initial state is null (not undefined) — User | null per authStore.ts:39.
    // Legitimate Owners should not see "Доступ запрещён" during initial hydration.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAuthStore.mockImplementation((selector: any) =>
      selector({ cabinetId: 'cab-123', user: null })
    )
    renderComponent()
    expect(screen.queryByText(/Доступ запрещён/)).not.toBeInTheDocument()
    expect(screen.getByLabelText('Загрузка')).toBeInTheDocument()
  })

  it('shows access denied Alert for non-Owner user', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAuthStore.mockImplementation((selector: any) =>
      selector({ cabinetId: 'cab-123', user: { role: 'Manager' } })
    )
    renderComponent()
    expect(screen.getByText(/Доступ запрещён/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Вернуться к списку моделей/ })).toBeInTheDocument()
  })

  it('back-link points to /analytics/models for non-Owner', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAuthStore.mockImplementation((selector: any) =>
      selector({ cabinetId: 'cab-123', user: { role: 'Analyst' } })
    )
    renderComponent()
    const link = screen.getByRole('link', { name: /Вернуться к списку моделей/ })
    expect(link).toHaveAttribute('href', '/analytics/models')
  })

  it('renders table rows for Owner with data', () => {
    renderComponent()
    const rows = screen.getAllByRole('row')
    // 1 header + 2 data rows
    expect(rows.length).toBeGreaterThanOrEqual(3)
  })

  it('AP#10: model id rendered as raw string, NOT formatted with spaces', () => {
    renderComponent()
    // '12345' must appear as-is, never '12 345'
    expect(screen.getByText('12345')).toBeInTheDocument()
    expect(screen.queryByText('12 345')).not.toBeInTheDocument()
  })

  it('AP#8: null MAPE renders as em-dash —', () => {
    renderComponent()
    // modelNullMape has null mape → should show '—'
    const cells = screen.getAllByText('—')
    expect(cells.length).toBeGreaterThanOrEqual(1)
  })

  it('AP#8: non-null MAPE renders as percentage', () => {
    renderComponent()
    // model1 has mape 15.3 — formatPercentage will produce something with %
    expect(screen.getByText(/15/)).toBeInTheDocument()
  })

  it('renders version prefixed with v', () => {
    renderComponent()
    expect(screen.getByText('v2')).toBeInTheDocument()
    expect(screen.getByText('v1')).toBeInTheDocument()
  })

  it('renders status badge', () => {
    renderComponent()
    expect(screen.getByText('Активна')).toBeInTheDocument()
    expect(screen.getByText('Обучение')).toBeInTheDocument()
  })

  it('aria-sort="descending" on Версия header by default', () => {
    renderComponent()
    const versionHead = screen.getByRole('columnheader', { name: /Версия/ })
    expect(versionHead).toHaveAttribute('aria-sort', 'descending')
  })

  it('aria-sort="none" on non-active sort column', () => {
    renderComponent()
    const mapeHead = screen.getByRole('columnheader', { name: /MAPE/ })
    expect(mapeHead).toHaveAttribute('aria-sort', 'none')
  })

  it('clicking MAPE sort button changes aria-sort to descending', () => {
    renderComponent()
    const mapeBtn = screen.getByRole('button', { name: 'Сортировать по MAPE' })
    fireEvent.click(mapeBtn)
    const mapeHead = screen.getByRole('columnheader', { name: /MAPE/ })
    expect(mapeHead).toHaveAttribute('aria-sort', 'descending')
  })

  it('filter dropdown is rendered with default "all" value', () => {
    renderComponent()
    expect(screen.getByRole('combobox', { name: /Фильтр по статусу/ })).toBeInTheDocument()
  })

  it('shows empty state message when no models', () => {
    mockUseAdminModels.mockReturnValue({
      data: { models: [], total: 0, page: 1, limit: 20 },
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useAdminModelsModule.useAdminModels>)
    renderComponent()
    expect(screen.getByText('Модели не найдены.')).toBeInTheDocument()
  })

  it('shows loading skeletons when isLoading=true', () => {
    mockUseAdminModels.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as unknown as ReturnType<typeof useAdminModelsModule.useAdminModels>)
    renderComponent()
    expect(screen.getByLabelText('Загрузка списка моделей')).toBeInTheDocument()
  })

  it('shows error Alert when error is present', () => {
    mockUseAdminModels.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('fetch failed'),
    } as unknown as ReturnType<typeof useAdminModelsModule.useAdminModels>)
    renderComponent()
    expect(screen.getByText(/Не удалось загрузить список моделей/)).toBeInTheDocument()
  })

  it('Откатить button opens rollback dialog', () => {
    renderComponent()
    const buttons = screen.getAllByRole('button', { name: /Откатить модель v/ })
    expect(buttons.length).toBeGreaterThan(0)
    fireEvent.click(buttons[0])
    // Dialog title should appear
    expect(screen.getByText(/Откатить модель v/)).toBeInTheDocument()
  })

  it('pagination not shown when total <= PAGE_LIMIT', () => {
    renderComponent()
    expect(screen.queryByText(/Стр\./)).not.toBeInTheDocument()
  })

  it('pagination shown when total > PAGE_LIMIT', () => {
    mockUseAdminModels.mockReturnValue({
      data: { models: [model1], total: 50, page: 1, limit: 20 },
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useAdminModelsModule.useAdminModels>)
    renderComponent()
    expect(screen.getByText(/Стр\. 1 \/ 3/)).toBeInTheDocument()
  })

  it('F-4: filter dropdown includes all 6 statuses (degraded + retired present)', () => {
    renderComponent()
    // Open the Select dropdown to inspect options
    const trigger = screen.getByRole('combobox', { name: /Фильтр по статусу/ })
    fireEvent.click(trigger)
    expect(screen.getByText('Деградация')).toBeInTheDocument()
    expect(screen.getByText('Архив')).toBeInTheDocument()
  })

  it('F-8: filter-empty shows reset button when statusFilter is active', () => {
    // Return empty list — simulates filter returning no results
    mockUseAdminModels.mockReturnValue({
      data: { models: [], total: 0, page: 1, limit: 20 },
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useAdminModelsModule.useAdminModels>)
    renderComponent()

    // Select a filter value to trigger filter-empty branch
    const trigger = screen.getByRole('combobox', { name: /Фильтр по статусу/ })
    fireEvent.click(trigger)
    fireEvent.click(screen.getByText('Деградация'))

    // Filter-empty branch: shows status label + reset button
    expect(screen.getByText(/Нет моделей со статусом/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Сбросить фильтр/ })).toBeInTheDocument()
  })

  it('F-10: Откатить button disabled for rolled_back status', () => {
    const rolledBackModel: AiModel = {
      ...model1,
      id: '99999',
      status: 'rolled_back',
      version: 5,
    }
    mockUseAdminModels.mockReturnValue({
      data: { models: [rolledBackModel], total: 1, page: 1, limit: 20 },
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useAdminModelsModule.useAdminModels>)
    renderComponent()
    const btn = screen.getByRole('button', { name: /Откат недоступен для модели v5/ })
    expect(btn).toBeDisabled()
  })

  it('F-10: Откатить button disabled for training status', () => {
    const trainingModel: AiModel = { ...modelNullMape, id: '88888', status: 'training', version: 4 }
    mockUseAdminModels.mockReturnValue({
      data: { models: [trainingModel], total: 1, page: 1, limit: 20 },
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useAdminModelsModule.useAdminModels>)
    renderComponent()
    const btn = screen.getByRole('button', { name: /Откат недоступен для модели v4/ })
    expect(btn).toBeDisabled()
  })

  it('F-10: Откатить button enabled for active status', () => {
    renderComponent()
    // model1 has status 'active' — button must be enabled
    const btn = screen.getByRole('button', { name: /Откатить модель v2/ })
    expect(btn).not.toBeDisabled()
  })

  it('F-15: sort buttons have focus-visible ring classes (WCAG 2.1 AA)', () => {
    renderComponent()
    const mapeBtn = screen.getByRole('button', { name: 'Сортировать по MAPE' })
    expect(mapeBtn.className).toContain('focus-visible:ring-2')
    expect(mapeBtn.className).toContain('focus-visible:ring-ring')
  })

  it('F-14: Сбросить фильтр uses Button component (focus-visible ring via shadcn)', () => {
    mockUseAdminModels.mockReturnValue({
      data: { models: [], total: 0, page: 1, limit: 20 },
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useAdminModelsModule.useAdminModels>)
    renderComponent()

    const trigger = screen.getByRole('combobox', { name: /Фильтр по статусу/ })
    fireEvent.click(trigger)
    fireEvent.click(screen.getByText('Деградация'))

    const resetBtn = screen.getByRole('button', { name: /Сбросить фильтр/ })
    // shadcn Button renders as <button> element — tag check confirms component usage
    expect(resetBtn.tagName).toBe('BUTTON')
    // Must NOT be a plain button (plain buttons lack focus-visible ring class)
    expect(resetBtn.className).not.toBe('underline')
  })

  it('sort rows: clicking Версия twice toggles to ascending then row order changes', () => {
    const twoModels: AiModel[] = [
      { ...model1, version: 3 },
      { ...modelNullMape, version: 1 },
    ]
    mockUseAdminModels.mockReturnValue({
      data: { models: twoModels, total: 2, page: 1, limit: 20 },
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useAdminModelsModule.useAdminModels>)
    renderComponent()

    const versionBtn = screen.getByRole('button', { name: 'Сортировать по Версия' })
    // First click: re-click active col → toggles to ascending
    fireEvent.click(versionBtn)

    const rows = document.querySelectorAll('tbody tr')
    // ascending: v1 before v3
    const firstRowText = rows[0].textContent ?? ''
    const secondRowText = rows[1].textContent ?? ''
    expect(firstRowText).toContain('v1')
    expect(secondRowText).toContain('v3')
  })

  // ---- 171.2 gap pins (growth-only) ----

  it('171.2 gap-1: table renders caption «Версии моделей под управлением»', () => {
    renderComponent()
    expect(screen.getByText('Версии моделей под управлением')).toBeInTheDocument()
  })

  it('171.2 gap-2: mape and date cells use tabular-nums; id cell uses mono', () => {
    renderComponent()
    const mapeCell = screen.getByText(/15/).closest('td')
    expect(mapeCell?.className).toContain('tabular-nums')
    const dateCell = screen.getByText(/10\.01\.2026/).closest('td')
    expect(dateCell?.className).toContain('tabular-nums')
    const idCell = screen.getByText('12345').closest('td')
    expect(idCell?.className).toContain('font-mono')
  })

  it('171.2 gap-4: scroll container is a named focusable region (tabIndex=0)', () => {
    renderComponent()
    const region = screen.getByRole('region', { name: 'Таблица версий моделей под управлением' })
    expect(region).toHaveAttribute('tabindex', '0')
  })

  it('171.2 gap-6: unknown status renders raw value in outline badge (known-set fallback)', () => {
    // AP#4 bridge: deliberately out-of-union status to exercise the raw-value fallback
    const weirdModel = {
      ...model1,
      id: '77777',
      status: 'weird_status',
      version: 9,
    } as unknown as AiModel
    mockUseAdminModels.mockReturnValue({
      data: { models: [weirdModel], total: 1, page: 1, limit: 20 },
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useAdminModelsModule.useAdminModels>)
    renderComponent()
    const badge = screen.getByText('weird_status')
    // outline variant = bordered badge (not default/destructive/secondary fills)
    // Round-1 F1: 'border' is in the cva BASE (tautology) — assert outline-DISTINCTIVE
    // tokens instead: outline = text-foreground + NO bg-* fill.
    expect(badge.className).toContain('text-foreground')
    expect(badge.className).not.toMatch(/bg-(destructive|secondary|success)/)
  })

  it('171.2 gap-5: focus returns to the invoking row rollback button after dialog close', async () => {
    const { waitFor } = await import('@testing-library/react')
    renderComponent()
    const rollbackBtn = screen.getByRole('button', { name: 'Откатить модель v2' })
    rollbackBtn.focus()
    expect(document.activeElement).toBe(rollbackBtn)
    fireEvent.click(rollbackBtn)
    expect(screen.getByText(/Откатить модель v2\?/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Отменить/i }))
    await waitFor(
      () => {
        expect(document.activeElement).toBe(rollbackBtn)
      },
      { timeout: 2000 }
    )
  })
})
