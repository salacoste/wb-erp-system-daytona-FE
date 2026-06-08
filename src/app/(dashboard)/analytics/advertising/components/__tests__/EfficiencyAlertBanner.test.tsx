import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@/test/utils/test-utils'
import { EfficiencyAlertBanner } from '../EfficiencyAlertBanner'

// Mock the efficiency alert state utilities
vi.mock('@/lib/efficiency-utils', () => ({
  getAlertDismissState: vi.fn(() => ({ dismissed: false, lossCount: null })),
  setAlertDismissState: vi.fn(),
  shouldShowLossAlert: vi.fn((count: number) => count > 0),
}))

import {
  getAlertDismissState,
  setAlertDismissState,
  shouldShowLossAlert,
} from '@/lib/efficiency-utils'

const mockGetAlertDismissState = vi.mocked(getAlertDismissState)
const mockSetAlertDismissState = vi.mocked(setAlertDismissState)
const mockShouldShowLossAlert = vi.mocked(shouldShowLossAlert)

describe('EfficiencyAlertBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetAlertDismissState.mockReturnValue({ dismissed: false, lossCount: null })
    mockShouldShowLossAlert.mockImplementation((count: number) => count > 0)
  })

  it('renders nothing when lossCount is 0', () => {
    const { container } = render(<EfficiencyAlertBanner lossCount={0} />)
    expect(container.innerHTML).toBe('')
  })

  it('renders alert when lossCount > 0 and not dismissed', () => {
    render(<EfficiencyAlertBanner lossCount={3} />)
    expect(screen.getByText('Убыточные кампании')).toBeInTheDocument()
    expect(screen.getByText(/3 товар/)).toBeInTheDocument()
  })

  it('shows pluralized "товар" for 1 item', () => {
    render(<EfficiencyAlertBanner lossCount={1} />)
    expect(screen.getByText(/1 товар с отрицательной/)).toBeInTheDocument()
  })

  it('shows pluralized "товара" for 2-4 items', () => {
    render(<EfficiencyAlertBanner lossCount={2} />)
    expect(screen.getByText(/2 товара с отрицательной/)).toBeInTheDocument()
  })

  it('shows pluralized "товаров" for 5+ items', () => {
    render(<EfficiencyAlertBanner lossCount={5} />)
    expect(screen.getByText(/5 товаров с отрицательной/)).toBeInTheDocument()
  })

  it('shows pluralized "товаров" for 11-19 items', () => {
    render(<EfficiencyAlertBanner lossCount={12} />)
    expect(screen.getByText(/12 товаров с отрицательной/)).toBeInTheDocument()
  })

  it('renders dismiss button', () => {
    render(<EfficiencyAlertBanner lossCount={3} />)
    expect(screen.getByLabelText('Скрыть предупреждение')).toBeInTheDocument()
  })

  it('renders link to filtered view', () => {
    render(
      <EfficiencyAlertBanner
        lossCount={3}
        currentParams={{ from: '2026-01-01', to: '2026-01-31' }}
      />
    )
    const link = screen.getByText('Показать')
    expect(link).toBeInTheDocument()
    expect(link.getAttribute('href')).toContain('status=loss')
    expect(link.getAttribute('href')).toContain('from=2026-01-01')
  })

  it('builds filter URL preserving all current params', () => {
    render(
      <EfficiencyAlertBanner
        lossCount={1}
        currentParams={{
          from: '2026-01-01',
          to: '2026-01-31',
          view: 'list',
          sort: 'roas',
          order: 'desc',
        }}
      />
    )
    const link = screen.getByText('Показать')
    const href = link.getAttribute('href')!
    expect(href).toContain('status=loss')
    expect(href).toContain('view=list')
    expect(href).toContain('sort=roas')
    expect(href).toContain('order=desc')
  })

  it('renders with role="alert"', () => {
    render(<EfficiencyAlertBanner lossCount={3} />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('calls setAlertDismissState on dismiss', async () => {
    const { userEvent } = await import('@testing-library/user-event')
    const user = userEvent.setup()
    render(<EfficiencyAlertBanner lossCount={3} />)
    await user.click(screen.getByLabelText('Скрыть предупреждение'))
    expect(mockSetAlertDismissState).toHaveBeenCalledWith(3)
  })

  it('renders nothing when dismissed and shouldShowLossAlert returns false', () => {
    mockGetAlertDismissState.mockReturnValue({ dismissed: true, lossCount: 3 })
    mockShouldShowLossAlert.mockReturnValue(false)
    const { container } = render(<EfficiencyAlertBanner lossCount={3} />)
    expect(container.innerHTML).toBe('')
  })

  it('renders when dismissed but loss count increased', () => {
    mockGetAlertDismissState.mockReturnValue({ dismissed: true, lossCount: 3 })
    mockShouldShowLossAlert.mockReturnValue(true)
    render(<EfficiencyAlertBanner lossCount={5} />)
    expect(screen.getByText('Убыточные кампании')).toBeInTheDocument()
  })
})
