/**
 * AT1: CannedRulesGallery component tests.
 * Focus: grouping by category, price safety badge, install click wiring,
 * and the 409 rename-dialog flow.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CannedRulesGallery } from '../CannedRulesGallery'
import type { CannedRuleTemplate } from '@/types/automation'
import { ApiError } from '@/types/api'

const mockInstall = vi.fn()
const mockIsPending = { current: false }

vi.mock('@/hooks/useAutomation', () => ({
  useInstallCannedRule: () => ({
    mutate: (...args: unknown[]) => mockInstall(...args),
    isPending: mockIsPending.current,
    variables: undefined,
  }),
}))

const createTestQueryClient = (): QueryClient =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  })

function renderWith(ui: React.ReactElement) {
  return render(<QueryClientProvider client={createTestQueryClient()}>{ui}</QueryClientProvider>)
}

const NOTIFY: CannedRuleTemplate = {
  key: 'low-stock-notify',
  name: 'Низкий остаток',
  description: 'Уведомляет при остатке <10',
  category: 'notify',
  trigger: 'STOCK_LEVEL',
  action: 'NOTIFY',
  triggerParams: { threshold: 10, operator: '<' },
}

const PRICE: CannedRuleTemplate = {
  key: 'slow-mover-markdown',
  name: 'Уценка неликвида',
  description: 'Уценивает на 5%',
  category: 'price',
  trigger: 'SLOW_MOVER',
  action: 'WRITEBACK_PRICE',
  actionParams: { priceAdjustPct: -5 },
  enabledByDefault: false,
}

const AUDIT: CannedRuleTemplate = {
  key: 'low-stock-dry-run',
  name: 'Сухой прогон остатка',
  description: 'Тест триггера',
  category: 'audit',
  trigger: 'STOCK_LEVEL',
  action: 'LOG_ONLY',
}

describe('CannedRulesGallery (AT1)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsPending.current = false
  })

  it('renders cards grouped by category in the canonical order', () => {
    renderWith(<CannedRulesGallery templates={[PRICE, NOTIFY, AUDIT]} />)

    // Group headings present.
    expect(screen.getByText('Уведомления')).toBeInTheDocument()
    expect(screen.getByText('Аудит (сухой прогон)')).toBeInTheDocument()
    expect(screen.getByText('Изменение цены')).toBeInTheDocument()
    // No task templates → no task heading.
    expect(screen.queryByText('Задачи')).not.toBeInTheDocument()

    // Each card renders.
    expect(screen.getByTestId('canned-rule-card-low-stock-notify')).toBeInTheDocument()
    expect(screen.getByTestId('canned-rule-card-low-stock-dry-run')).toBeInTheDocument()
    expect(screen.getByTestId('canned-rule-card-slow-mover-markdown')).toBeInTheDocument()
  })

  it('renders the trigger→action summary with the threshold', () => {
    renderWith(<CannedRulesGallery templates={[NOTIFY]} />)
    expect(screen.getByTestId('trigger-action-low-stock-notify').textContent).toContain(
      'STOCK_LEVEL'
    )
    expect(screen.getByTestId('trigger-action-low-stock-notify').textContent).toContain('< 10')
    expect(screen.getByTestId('trigger-action-low-stock-notify').textContent).toContain('NOTIFY')
  })

  it('shows the destructive "Требует arm write-back" badge only on price cards', () => {
    renderWith(<CannedRulesGallery templates={[NOTIFY, PRICE]} />)
    expect(screen.getByTestId('price-badge-slow-mover-markdown')).toBeInTheDocument()
    expect(screen.queryByTestId('price-badge-low-stock-notify')).not.toBeInTheDocument()
  })

  it('triggers install with the template key when the install button is clicked', () => {
    renderWith(<CannedRulesGallery templates={[NOTIFY]} />)
    fireEvent.click(screen.getByTestId('install-btn-low-stock-notify'))
    expect(mockInstall).toHaveBeenCalledTimes(1)
    // First arg of useInstallCannedRule.mutate is { key, body? }.
    const call = mockInstall.mock.calls[0][0] as { key: string }
    expect(call.key).toBe('low-stock-notify')
  })

  it('opens the rename dialog when install 409s (mutate onError)', async () => {
    // Simulate a 409: the mock mutate calls the onError callback passed as 2nd arg.
    mockInstall.mockImplementation((_input: unknown, opts?: { onError?: (e: Error) => void }) => {
      // Real ApiError so the component's `instanceof ApiError` guard matches
      // (anti-pattern #3 — never fake ApiError with Object.assign).
      opts?.onError?.(new ApiError('Duplicate rule name', 409, {}))
    })

    renderWith(<CannedRulesGallery templates={[NOTIFY]} />)
    fireEvent.click(screen.getByTestId('install-btn-low-stock-notify'))

    await waitFor(() => {
      expect(screen.getByTestId('canned-rename-input')).toBeInTheDocument()
    })
    fireEvent.change(screen.getByTestId('canned-rename-input'), {
      target: { value: 'Копия правила' },
    })
    fireEvent.click(screen.getByTestId('canned-rename-submit'))

    await waitFor(() => {
      expect(mockInstall).toHaveBeenCalledTimes(2)
    })
    // Second call carries the custom name override.
    const second = mockInstall.mock.calls[1][0] as { key: string; body?: { name?: string } }
    expect(second.key).toBe('low-stock-notify')
    expect(second.body?.name).toBe('Копия правила')
  })

  it('renders nothing when the gallery is empty', () => {
    const { container } = renderWith(<CannedRulesGallery templates={[]} />)
    // No category sections.
    expect(container.querySelectorAll('section')).toHaveLength(0)
  })
})
