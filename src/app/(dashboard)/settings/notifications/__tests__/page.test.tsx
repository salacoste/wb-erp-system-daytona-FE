/**
 * Notifications Settings Page Tests
 * Tests for src/app/(dashboard)/settings/notifications/page.tsx
 * Epic 34-FE: Telegram Notification Settings
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@/test/utils/test-utils'

// Mock Telegram analytics metrics
const mockPageViewed = vi.fn()
const mockHelpClicked = vi.fn()
vi.mock('@/lib/analytics/telegram-metrics', () => ({
  TelegramMetrics: {
    pageViewed: () => mockPageViewed(),
    helpClicked: () => mockHelpClicked(),
  },
}))

// Mock useTelegramBinding hook
const mockIsBound = vi.fn<() => boolean>()
const mockStatus = vi.fn<
  () => {
    bound: boolean
    telegram_user_id: number | null
    telegram_username: string | null
    binding_expires_at: string | null
  } | null
>()
const mockIsCheckingStatus = vi.fn<() => boolean>()
const mockCheckStatus = vi.fn()
vi.mock('@/hooks/useTelegramBinding', () => ({
  useTelegramBinding: () => ({
    isBound: mockIsBound(),
    status: mockStatus(),
    isCheckingStatus: mockIsCheckingStatus(),
    startBinding: vi.fn(),
    unbind: vi.fn(),
    checkStatus: mockCheckStatus,
    isStartingBinding: false,
    isUnbinding: false,
    bindingError: null,
    unbindError: null,
  }),
}))

// Mock notification sub-components
vi.mock('@/components/notifications', () => ({
  TelegramBindingCard: () => <div data-testid="telegram-binding-card">TelegramBindingCard</div>,
  TelegramBindingModal: ({
    open,
    onOpenChange,
  }: {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
  }) =>
    open ? (
      <div data-testid="telegram-binding-modal">
        <button onClick={() => onOpenChange(false)}>Close Modal</button>
      </div>
    ) : null,
  NotificationPreferencesPanel: () => (
    <div data-testid="notification-preferences-panel">NotificationPreferencesPanel</div>
  ),
  QuietHoursPanel: () => <div data-testid="quiet-hours-panel">QuietHoursPanel</div>,
}))

// Mock local sub-components
vi.mock('../NotificationsHeroBanner', () => ({
  NotificationsHeroBanner: ({ onConnect }: { onConnect: () => void }) => (
    <div data-testid="notifications-hero-banner">
      <button data-testid="connect-button" onClick={onConnect}>
        Connect
      </button>
    </div>
  ),
}))

vi.mock('../NotificationsDisabledPanel', () => ({
  NotificationsDisabledPanel: ({
    title,
    lockMessage,
  }: {
    icon: string
    title: string
    description: string
    lockMessage: string
  }) => (
    <div data-testid="notifications-disabled-panel">
      <span>{title}</span>
      <span>{lockMessage}</span>
    </div>
  ),
}))

vi.mock('@/components/custom/settings/OrderNotificationSettings', () => ({
  OrderNotificationSettings: () => (
    <div data-testid="order-notification-settings">OrderNotificationSettings</div>
  ),
}))

// Import after mocks
import NotificationsSettingsPage from '../page'

describe('NotificationsSettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsBound.mockReturnValue(false)
    mockStatus.mockReturnValue({
      bound: false,
      telegram_user_id: null,
      telegram_username: null,
      binding_expires_at: null,
    })
    mockIsCheckingStatus.mockReturnValue(false)
  })

  describe('Page structure', () => {
    it('should render page title "Telegram Уведомления"', () => {
      mockIsBound.mockReturnValue(false)

      render(<NotificationsSettingsPage />)

      expect(screen.getByRole('heading', { name: /telegram уведомления/i })).toBeInTheDocument()
    })

    it('does not render a nested main landmark inside the dashboard shell', () => {
      mockIsBound.mockReturnValue(false)

      const { container } = render(<NotificationsSettingsPage />)

      expect(container.querySelectorAll('main')).toHaveLength(0)
      expect(
        screen.getByRole('region', { name: 'Настройки Telegram-уведомлений' })
      ).toBeInTheDocument()
    })

    it('uses the shared page header identity composition', () => {
      mockIsBound.mockReturnValue(false)

      const { container } = render(<NotificationsSettingsPage />)

      expect(container.querySelector('[data-slot="page-header"]')).toBeInTheDocument()
      expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    })

    it('should render breadcrumbs on desktop', () => {
      mockIsBound.mockReturnValue(false)

      render(<NotificationsSettingsPage />)

      expect(screen.getByText('Главная')).toBeInTheDocument()
      expect(screen.getByText('Настройки')).toBeInTheDocument()
      expect(screen.getByText('Уведомления')).toBeInTheDocument()
    })

    it('links the settings breadcrumb to the canonical settings route', () => {
      mockIsBound.mockReturnValue(false)

      render(<NotificationsSettingsPage />)

      expect(screen.getByRole('link', { name: 'Настройки' })).toHaveAttribute('href', '/settings')
    })
  })

  describe('Telegram status truthfulness', () => {
    it('shows an accessible loading state without presenting Telegram as unbound', () => {
      mockStatus.mockReturnValue(null)
      mockIsCheckingStatus.mockReturnValue(true)

      render(<NotificationsSettingsPage />)

      expect(
        screen.getByRole('heading', { name: 'Проверяем подключение Telegram' })
      ).toBeInTheDocument()
      expect(screen.queryByTestId('notifications-hero-banner')).not.toBeInTheDocument()
      expect(screen.queryByText('Статус Telegram недоступен')).not.toBeInTheDocument()
    })

    it('shows a retryable unavailable state that is distinct from unbound', () => {
      mockStatus.mockReturnValue(null)

      render(<NotificationsSettingsPage />)

      expect(
        screen.getByRole('heading', { name: 'Статус Telegram недоступен' })
      ).toBeInTheDocument()
      expect(screen.queryByTestId('notifications-hero-banner')).not.toBeInTheDocument()

      fireEvent.click(screen.getByRole('button', { name: 'Повторить проверку' }))
      expect(mockCheckStatus).toHaveBeenCalledTimes(1)
    })

    it('reports the confirmed unbound status in the shared context bar', () => {
      render(<NotificationsSettingsPage />)

      expect(screen.getByText('Не подключен')).toBeInTheDocument()
      expect(screen.getByText('Данные актуальны')).toBeInTheDocument()
    })

    it('reports the confirmed bound status in the shared context bar', () => {
      mockIsBound.mockReturnValue(true)
      mockStatus.mockReturnValue({
        bound: true,
        telegram_user_id: 1735,
        telegram_username: 'story_user',
        binding_expires_at: null,
      })

      render(<NotificationsSettingsPage />)

      expect(screen.getByText('Подключен')).toBeInTheDocument()
    })
  })

  describe('Analytics tracking', () => {
    it('should call TelegramMetrics.pageViewed on mount', () => {
      mockIsBound.mockReturnValue(false)

      render(<NotificationsSettingsPage />)

      expect(mockPageViewed).toHaveBeenCalledTimes(1)
    })

    it('should call TelegramMetrics.pageViewed only once', () => {
      mockIsBound.mockReturnValue(false)

      render(<NotificationsSettingsPage />)

      expect(mockPageViewed).toHaveBeenCalledTimes(1)
    })

    it('should track help link click via TelegramMetrics.helpClicked', () => {
      mockIsBound.mockReturnValue(false)

      render(<NotificationsSettingsPage />)

      const helpLink = screen.getByText(/открыть руководство/i)
      helpLink.addEventListener('click', event => event.preventDefault())
      fireEvent.click(helpLink)

      expect(mockHelpClicked).toHaveBeenCalledTimes(1)
    })
  })

  describe('Unbound state (not connected to Telegram)', () => {
    beforeEach(() => {
      mockIsBound.mockReturnValue(false)
    })

    it('should render the hero banner', () => {
      render(<NotificationsSettingsPage />)

      expect(screen.getByTestId('notifications-hero-banner')).toBeInTheDocument()
    })

    it('should NOT render TelegramBindingCard when not bound', () => {
      render(<NotificationsSettingsPage />)

      expect(screen.queryByTestId('telegram-binding-card')).not.toBeInTheDocument()
    })

    it('should render disabled panel for notification preferences', () => {
      render(<NotificationsSettingsPage />)

      const disabledPanels = screen.getAllByTestId('notifications-disabled-panel')
      expect(disabledPanels.length).toBe(2)
    })

    it('should show lock message for notification preferences', () => {
      render(<NotificationsSettingsPage />)

      expect(
        screen.getByText('Настройки уведомлений станут доступны после подключения')
      ).toBeInTheDocument()
    })

    it('should show lock message for quiet hours', () => {
      render(<NotificationsSettingsPage />)

      expect(screen.getByText('Тихие часы станут доступны после подключения')).toBeInTheDocument()
    })

    it('should NOT render active NotificationPreferencesPanel when not bound', () => {
      render(<NotificationsSettingsPage />)

      expect(screen.queryByTestId('notification-preferences-panel')).not.toBeInTheDocument()
    })

    it('should NOT render QuietHoursPanel when not bound', () => {
      render(<NotificationsSettingsPage />)

      expect(screen.queryByTestId('quiet-hours-panel')).not.toBeInTheDocument()
    })
  })

  describe('Bound state (connected to Telegram)', () => {
    beforeEach(() => {
      mockIsBound.mockReturnValue(true)
      mockStatus.mockReturnValue({
        bound: true,
        telegram_user_id: 1735,
        telegram_username: 'story_user',
        binding_expires_at: null,
      })
    })

    it('should render TelegramBindingCard', () => {
      render(<NotificationsSettingsPage />)

      expect(screen.getByTestId('telegram-binding-card')).toBeInTheDocument()
    })

    it('should NOT render hero banner when bound', () => {
      render(<NotificationsSettingsPage />)

      expect(screen.queryByTestId('notifications-hero-banner')).not.toBeInTheDocument()
    })

    it('should render NotificationPreferencesPanel', () => {
      render(<NotificationsSettingsPage />)

      expect(screen.getByTestId('notification-preferences-panel')).toBeInTheDocument()
    })

    it('should render QuietHoursPanel', () => {
      render(<NotificationsSettingsPage />)

      expect(screen.getByTestId('quiet-hours-panel')).toBeInTheDocument()
    })

    it('should NOT render disabled panels when bound', () => {
      render(<NotificationsSettingsPage />)

      expect(screen.queryByTestId('notifications-disabled-panel')).not.toBeInTheDocument()
    })
  })

  describe('Binding modal', () => {
    beforeEach(() => {
      mockIsBound.mockReturnValue(false)
    })

    it('should open binding modal when connect button is clicked', () => {
      render(<NotificationsSettingsPage />)

      const connectButton = screen.getByTestId('connect-button')
      fireEvent.click(connectButton)

      expect(screen.getByTestId('telegram-binding-modal')).toBeInTheDocument()
    })

    it('should close binding modal when close button is clicked', () => {
      render(<NotificationsSettingsPage />)

      // Open modal
      const connectButton = screen.getByTestId('connect-button')
      fireEvent.click(connectButton)
      expect(screen.getByTestId('telegram-binding-modal')).toBeInTheDocument()

      // Close modal
      const closeButton = screen.getByText('Close Modal')
      fireEvent.click(closeButton)
      expect(screen.queryByTestId('telegram-binding-modal')).not.toBeInTheDocument()
    })

    it('should not show modal by default', () => {
      render(<NotificationsSettingsPage />)

      expect(screen.queryByTestId('telegram-binding-modal')).not.toBeInTheDocument()
    })
  })

  describe('Help section', () => {
    beforeEach(() => {
      mockIsBound.mockReturnValue(false)
    })

    it('should render help section with guidance text', () => {
      render(<NotificationsSettingsPage />)

      expect(screen.getByText(/нужна помощь с настройкой/i)).toBeInTheDocument()
    })

    it('should render help link to /help/notifications', () => {
      render(<NotificationsSettingsPage />)

      const helpLink = screen.getByText(/открыть руководство/i)
      expect(helpLink.closest('a')).toHaveAttribute('href', '/help/notifications')
    })
  })

  describe('Accessibility', () => {
    it('should have an h1 heading', () => {
      mockIsBound.mockReturnValue(false)

      render(<NotificationsSettingsPage />)

      const heading = screen.getByRole('heading', { level: 1 })
      expect(heading).toHaveTextContent('Telegram Уведомления')
    })
  })
})
