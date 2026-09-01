import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@/test/utils/test-utils'
import userEvent from '@testing-library/user-event'
import { RecoveryPanel } from '../RecoveryPanel'

// Mock auth store
vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn((selector: (s: { cabinetId: string | null }) => unknown) =>
    selector({ cabinetId: 'cab-123' })
  ),
}))

const mockTasks = [
  {
    taskType: 'weekly_sync',
    displayName: 'Еженедельная синхронизация',
    lastAttempt: '2026-03-01T10:00:00Z',
    totalAttempts: 5,
    status: 'healthy',
    canRetry: true,
  },
  {
    taskType: 'daily_sync',
    displayName: 'Ежедневная синхронизация',
    lastAttempt: '2026-03-02T08:00:00Z',
    totalAttempts: 3,
    status: 'overdue',
    canRetry: true,
  },
  {
    taskType: 'stocks_sync',
    displayName: 'Синхронизация остатков',
    lastAttempt: null,
    totalAttempts: 0,
    status: 'no_history',
    canRetry: true,
  },
]

// Mock recovery hooks
const mockUseRecoveryStatus = vi.fn()
const mockUseTriggerRecovery = vi.fn()

vi.mock('../../hooks/use-recovery', () => ({
  useRecoveryStatus: (...args: unknown[]) => mockUseRecoveryStatus(...args),
  useTriggerRecovery: (...args: unknown[]) => mockUseTriggerRecovery(...args),
}))

// Mock RecoveryPanelSubcomponents (relative from __tests__/ -> ../)
vi.mock('../RecoveryPanelSubcomponents', async importOriginal => {
  const actual = await importOriginal<typeof import('../RecoveryPanelSubcomponents')>()
  return {
    ...actual,
    Tip: () => <span data-testid="tip" />,
    Skel: () => <div data-testid="skeleton">Loading...</div>,
  }
})

describe('RecoveryPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseRecoveryStatus.mockReturnValue({
      data: { cabinetId: 'cab-123', tasks: mockTasks },
      isLoading: false,
    })
    mockUseTriggerRecovery.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    })
  })

  it('renders table with recovery tasks when enabled', () => {
    render(<RecoveryPanel enabled={true} />)
    expect(screen.getByRole('region', { name: /восстановление/i })).toBeInTheDocument()
  })

  it('renders table headers', () => {
    render(<RecoveryPanel enabled={true} />)
    expect(screen.getByText('Задача')).toBeInTheDocument()
    expect(screen.getByText('Статус')).toBeInTheDocument()
    expect(screen.getByText('Попыток')).toBeInTheDocument()
    expect(screen.getByText('Последняя попытка')).toBeInTheDocument()
    expect(screen.getByText('Действие')).toBeInTheDocument()
  })

  it('renders task display names', () => {
    render(<RecoveryPanel enabled={true} />)
    expect(screen.getByText('Еженедельная синхронизация')).toBeInTheDocument()
    expect(screen.getByText('Ежедневная синхронизация')).toBeInTheDocument()
    expect(screen.getByText('Синхронизация остатков')).toBeInTheDocument()
  })

  it('renders status badges', () => {
    render(<RecoveryPanel enabled={true} />)
    expect(screen.getByText('✓ OK')).toBeInTheDocument()
    expect(screen.getByText('⚠ Просрочено')).toBeInTheDocument()
    expect(screen.getByText('— Нет данных')).toBeInTheDocument()
  })

  it('renders attempt counts', () => {
    render(<RecoveryPanel enabled={true} />)
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('0')).toBeInTheDocument()
  })

  it('shows recover buttons for non-healthy tasks', () => {
    render(<RecoveryPanel enabled={true} />)
    // Both overdue and no_history tasks have "▶ Восстановить"
    const recoverButtons = screen.getAllByText('▶ Восстановить')
    expect(recoverButtons.length).toBe(2)
  })

  it('opens the recovery confirmation and cancels without mutation', async () => {
    const mutate = vi.fn()
    mockUseTriggerRecovery.mockReturnValue({ mutate, isPending: false })
    const user = userEvent.setup()
    render(<RecoveryPanel enabled={true} />)

    const trigger = screen.getAllByRole('button', { name: '▶ Восстановить' })[0]
    await user.click(trigger)
    expect(screen.getByRole('alertdialog', { name: 'Восстановить данные?' })).toBeVisible()
    expect(
      screen.getByText('Задача «Ежедневная синхронизация» будет перезапущена.')
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Отмена' }))
    expect(
      screen.queryByRole('alertdialog', { name: 'Восстановить данные?' })
    ).not.toBeInTheDocument()
    expect(mutate).not.toHaveBeenCalled()
    expect(trigger).toHaveFocus()
  })

  it('shows empty message when no tasks', () => {
    mockUseRecoveryStatus.mockReturnValue({
      data: { cabinetId: 'cab-123', tasks: [] },
      isLoading: false,
    })
    render(<RecoveryPanel enabled={true} />)
    expect(screen.getByText('Нет задач для восстановления')).toBeInTheDocument()
  })

  it('shows skeleton during loading', () => {
    mockUseRecoveryStatus.mockReturnValue({
      data: undefined,
      isLoading: true,
    })
    render(<RecoveryPanel enabled={true} />)
    expect(screen.getByTestId('skeleton')).toBeInTheDocument()
  })
})
