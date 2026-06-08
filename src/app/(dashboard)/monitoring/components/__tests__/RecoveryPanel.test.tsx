import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@/test/utils/test-utils'
import { RecoveryPanel } from '../RecoveryPanel'

// Mock auth store
vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn((selector: (s: { cabinetId: string | null }) => unknown) =>
    selector({ cabinetId: 'cab-123' })
  ),
}))

// Mock recovery hooks
vi.mock('../../hooks/use-recovery', () => ({
  useRecoveryStatus: vi.fn((enabled: boolean) => ({
    data: enabled
      ? {
          cabinetId: 'cab-123',
          tasks: [
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
          ],
        }
      : undefined,
    isLoading: false,
  })),
  useTriggerRecovery: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
  })),
}))

// Mock RecoveryPanelSubcomponents
vi.mock('./RecoveryPanelSubcomponents', () => ({
  Confirm: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="confirm">{children}</div>
  ),
  Tip: () => <span data-testid="tip" />,
  Skel: () => <div data-testid="skeleton">Loading...</div>,
}))

describe('RecoveryPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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

  it('shows recover button for non-healthy tasks', () => {
    render(<RecoveryPanel enabled={true} />)
    // overdue task shows "▶ Восстановить" button
    expect(screen.getByText('▶ Восстановить')).toBeInTheDocument()
  })

  it('shows empty message when no tasks', () => {
    // Override mock to return empty tasks
    const { useRecoveryStatus } = vi.mocked(await import('../../hooks/use-recovery'))
    useRecoveryStatus.mockReturnValueOnce({
      data: { cabinetId: 'cab-123', tasks: [] },
      isLoading: false,
    } as never)
    render(<RecoveryPanel enabled={true} />)
    expect(screen.getByText('Нет задач для восстановления')).toBeInTheDocument()
  })

  it('shows skeleton during loading', () => {
    const { useRecoveryStatus } = vi.mocked(await import('../../hooks/use-recovery'))
    useRecoveryStatus.mockReturnValueOnce({
      data: undefined,
      isLoading: true,
    } as never)
    render(<RecoveryPanel enabled={true} />)
    expect(screen.getByTestId('skeleton')).toBeInTheDocument()
  })
})
