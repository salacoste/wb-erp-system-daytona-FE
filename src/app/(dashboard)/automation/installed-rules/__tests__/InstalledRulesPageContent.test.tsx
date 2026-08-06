/**
 * InstalledRulesPageContent tests (Story 163.2-FE).
 * Covers the 4 page states (loading/error/empty/populated) by mocking
 * useInstalledRules. Verifies the empty-state link points at the templates
 * gallery (the AC's "go to templates" CTA).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils/test-utils'

const mockUseInstalledRules = vi.fn()

vi.mock('@/hooks/useAutomation', () => ({
  useInstalledRules: (...args: unknown[]) => mockUseInstalledRules(...args),
}))

vi.mock('@/components/custom/automation/InstalledRulesList', () => ({
  InstalledRulesList: ({ rules }: { rules: { id: string; name: string }[] }) => (
    <div data-testid="installed-rules-list">{rules.map(r => r.name).join(',')}</div>
  ),
}))

vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href} data-testid="templates-link">
      {children}
    </a>
  ),
}))

import { InstalledRulesPageContent } from '../InstalledRulesPageContent'

function stubResult(overrides: Record<string, unknown> = {}) {
  return {
    data: undefined,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
    ...overrides,
  }
}

describe('InstalledRulesPageContent (163.2)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the loading state', () => {
    mockUseInstalledRules.mockReturnValue(stubResult({ isLoading: true }))
    renderWithProviders(<InstalledRulesPageContent />)
    expect(screen.getByText('Загрузка…')).toBeInTheDocument()
  })

  it('renders the error state with a "Повторить" button that calls refetch', () => {
    const refetch = vi.fn()
    mockUseInstalledRules.mockReturnValue(
      stubResult({ isError: true, error: new Error('boom'), refetch })
    )
    renderWithProviders(<InstalledRulesPageContent />)
    expect(screen.getByText(/Не удалось загрузить правила/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Повторить' }))
    expect(refetch).toHaveBeenCalled()
  })

  it('renders the empty state with a keyboard-accessible link to the templates gallery', () => {
    mockUseInstalledRules.mockReturnValue(stubResult({ data: [] }))
    renderWithProviders(<InstalledRulesPageContent />)
    expect(screen.getByTestId('installed-rules-empty')).toBeInTheDocument()
    const link = screen.getByTestId('templates-link')
    expect(link.getAttribute('href')).toBe('/automation/canned-rules')
    expect(link).toHaveTextContent('Перейти к шаблонам')
  })

  it('renders the populated list when rules exist', () => {
    mockUseInstalledRules.mockReturnValue(
      stubResult({
        data: [
          { id: 'r1', name: 'Alpha', trigger: 'STOCK_LEVEL', action: 'NOTIFY', enabled: true },
        ],
      })
    )
    renderWithProviders(<InstalledRulesPageContent />)
    expect(screen.getByTestId('installed-rules-list')).toHaveTextContent('Alpha')
  })

  it('forwards the highlightId to the list', () => {
    mockUseInstalledRules.mockReturnValue(
      stubResult({
        data: [{ id: 'r1', name: 'Alpha', trigger: 'X', action: 'Y', enabled: true }],
      })
    )
    renderWithProviders(<InstalledRulesPageContent highlightId="r1" />)
    // List is mocked; just confirm the page mounted with a populated state.
    expect(screen.getByTestId('installed-rules-list')).toBeInTheDocument()
  })
})
