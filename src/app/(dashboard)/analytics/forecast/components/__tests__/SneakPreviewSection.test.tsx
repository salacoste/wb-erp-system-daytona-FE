/**
 * SneakPreviewSection full tests
 * Story 108.5-FE: Expanded from 108.3 placeholder.
 *
 * Tests:
 * - Disclaimer always visible (even without API data)
 * - Fallback disclaimer when API returns empty string
 * - Status block: collected/required weeks from status prop
 * - Renders SKU table rows with trend icons
 * - Empty skuForecasts renders "Нет данных"
 *
 * Container tests use module-level mock with mockReturnValue for per-test control.
 */
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SneakPreviewSection, SneakPreviewTableView } from '../SneakPreviewSection'
import type { AiStatusResponse } from '@/types/ai/status'
import type { AiSneakPreviewResponse } from '@/types/ai/trends-sneak'

vi.mock('@/stores/authStore', () => ({
  useAuthStore: (selector: (s: { cabinetId: string | null }) => unknown) =>
    selector({ cabinetId: 'cabinet-1' }),
}))

vi.mock('@/hooks/useAiSneakPreview', () => ({
  useAiSneakPreview: vi.fn(),
}))

import * as sneakHook from '@/hooks/useAiSneakPreview'
const mockUseAiSneakPreview = vi.mocked(sneakHook.useAiSneakPreview)

const mockStatus: AiStatusResponse = {
  readinessLevel: 'sneak_preview',
  weeksCollected: 8,
  weeksRequired: 12,
  progressPct: 67,
  missingRequirements: [],
  estimatedActivationDate: '2026-07-01',
  cogsCoveragePct: 80,
  skuCount: 25,
  orderCount: 800,
}

const mockSneakData: AiSneakPreviewResponse = {
  disclaimer: 'Данные предварительные — модель ещё обучается',
  skuForecasts: [
    {
      nmId: 111,
      vendorCode: 'SKU-X',
      avgPerDay: 3.2,
      trend: 'up',
      estimatedRange: { low: 20, high: 25 },
    },
    {
      nmId: 222,
      vendorCode: 'SKU-Y',
      avgPerDay: 1.0,
      trend: 'stable',
      estimatedRange: { low: 6, high: 8 },
    },
    {
      nmId: 333,
      vendorCode: null,
      avgPerDay: null,
      trend: 'down',
      estimatedRange: { low: null, high: null },
    },
  ],
}

function wrap(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>)
}

describe('SneakPreviewSection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAiSneakPreview.mockReturnValue({
      data: mockSneakData,
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof sneakHook.useAiSneakPreview>)
  })

  it('renders disclaimer heading always visible', () => {
    wrap(<SneakPreviewSection status={mockStatus} />)
    expect(screen.getByText('AI: предварительный прогноз — низкая уверенность')).toBeInTheDocument()
  })

  it('renders API disclaimer text', () => {
    wrap(<SneakPreviewSection status={mockStatus} />)
    expect(screen.getByText('Данные предварительные — модель ещё обучается')).toBeInTheDocument()
  })

  it('renders fallback disclaimer when API returns empty string', () => {
    mockUseAiSneakPreview.mockReturnValue({
      data: { ...mockSneakData, disclaimer: '' },
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof sneakHook.useAiSneakPreview>)
    wrap(<SneakPreviewSection status={mockStatus} />)
    expect(screen.getByText('Низкая уверенность — сбор данных продолжается')).toBeInTheDocument()
  })

  it('renders week counts from status prop', () => {
    wrap(<SneakPreviewSection status={mockStatus} />)
    expect(screen.getByText(/Собрано 8 недель/)).toBeInTheDocument()
    expect(screen.getByText(/12 недель/)).toBeInTheDocument()
  })

  it('renders "Нет данных" when skuForecasts is empty', () => {
    mockUseAiSneakPreview.mockReturnValue({
      data: { ...mockSneakData, skuForecasts: [] },
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof sneakHook.useAiSneakPreview>)
    wrap(<SneakPreviewSection status={mockStatus} />)
    expect(screen.getByText('Нет данных')).toBeInTheDocument()
  })

  it('renders fallback text when weeksRequired is null', () => {
    const statusNoRequired = { ...mockStatus, weeksRequired: null as unknown as number }
    wrap(<SneakPreviewSection status={statusNoRequired} />)
    expect(screen.getByText(/при сборе достаточного количества данных/)).toBeInTheDocument()
  })

  it('renders fallback text when weeksRequired is 0', () => {
    const statusZero = { ...mockStatus, weeksRequired: 0 }
    wrap(<SneakPreviewSection status={statusZero} />)
    expect(screen.getByText(/при сборе достаточного количества данных/)).toBeInTheDocument()
  })
})

// ── Pure view tests (no hook mocking needed) ──────────────────────────────────

describe('SneakPreviewTableView', () => {
  it('renders "Нет данных" when skuForecasts is empty', () => {
    render(<SneakPreviewTableView skuForecasts={[]} />)
    expect(screen.getByText('Нет данных')).toBeInTheDocument()
  })

  it('renders all 3 SKU rows', () => {
    render(<SneakPreviewTableView skuForecasts={mockSneakData.skuForecasts} />)
    expect(screen.getByText('111')).toBeInTheDocument()
    expect(screen.getByText('222')).toBeInTheDocument()
    expect(screen.getByText('333')).toBeInTheDocument()
  })

  it('renders avgPerDay with one decimal place', () => {
    render(<SneakPreviewTableView skuForecasts={mockSneakData.skuForecasts} />)
    expect(screen.getByText('3.2')).toBeInTheDocument()
    expect(screen.getByText('1.0')).toBeInTheDocument()
  })

  it('renders em-dash for null avgPerDay', () => {
    render(<SneakPreviewTableView skuForecasts={mockSneakData.skuForecasts} />)
    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBeGreaterThanOrEqual(1)
  })

  it('renders estimatedRange low–high', () => {
    render(<SneakPreviewTableView skuForecasts={mockSneakData.skuForecasts} />)
    expect(screen.getByText(/20 – 25/)).toBeInTheDocument()
    expect(screen.getByText(/6 – 8/)).toBeInTheDocument()
  })
})
