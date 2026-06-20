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
const mockIsBound = vi.fn<[], boolean>()
vi.mock('@/hooks/useTelegramBinding', () => ({
  useTelegramBinding: () => ({
    isBound: mockIsBound(),
    status: { bound: mockIsBound() },
    isCheckingStatus: false,
    startBinding: vi.fn(),
    unbind: vi.fn(),
    checkStatus: vi.fn(),
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
      expect(container.querySelector('section.min-h-screen')).toBeInTheDocument()
    })

    it('should render the Bell icon alongside the title', () => {
      mockIsBound.mockReturnValue(false)

      const { container } = render(<NotificationsSettingsPage />)

      // lucide-react Bell renders as an SVG
      const svg = container.querySelector('svg.lucide-bell')
      expect(svg).toBeInTheDocument()
    })

    it('should render breadcrumbs on desktop', () => {
      mockIsBound.mockReturnValue(false)

      render(<NotificationsSettingsPage />)

      expect(screen.getByText('Главная')).toBeInTheDocument()
      expect(screen.getByText('Настройки')).toBeInTheDocument()
      expect(screen.getByText('Уведомления')).toBeInTheDocument()
    })

    it('should render back link for mobile', () => {
      mockIsBound.mockReturnValue(false)

      render(<NotificationsSettingsPage />)

      expect(screen.getByText(/← настройки/i)).toBeInTheDocument()
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
