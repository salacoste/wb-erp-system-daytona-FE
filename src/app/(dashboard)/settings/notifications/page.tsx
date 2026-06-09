'use client'

// ============================================================================
// Telegram Notifications Settings Page
// Epic 34-FE: Story 34.5-FE
// Integration of all notification components with layout and empty states
// Analytics: Page view tracking and help link clicks
// ============================================================================

import { useTelegramBinding } from '@/hooks/useTelegramBinding'
import {
  TelegramBindingCard,
  TelegramBindingModal,
  NotificationPreferencesPanel,
  QuietHoursPanel,
} from '@/components/notifications'
import { Card, CardContent } from '@/components/ui/card'
import { Bell } from 'lucide-react'
import { TelegramMetrics } from '@/lib/analytics/telegram-metrics'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { NotificationsHeroBanner } from './NotificationsHeroBanner'
import { NotificationsDisabledPanel } from './NotificationsDisabledPanel'
import { OrderNotificationSettings } from '@/components/custom/settings/OrderNotificationSettings'

/**
 * Telegram Notifications Settings Page
 *
 * Layout (Q16): Vertical stack with max-width 1024px
 * Empty State (Q19): Hero banner when not bound
 * Mobile (Q18): Full-width cards, reduced padding
 */
export default function NotificationsSettingsPage() {
  const { isBound } = useTelegramBinding()
  const [isBindingModalOpen, setIsBindingModalOpen] = useState(false)

  // Track page view on mount (Epic 34-FE Analytics)
  useEffect(() => {
    TelegramMetrics.pageViewed()
  }, [])

  // Track help link clicks
  const handleHelpClick = () => {
    TelegramMetrics.helpClicked()
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Breadcrumbs - Desktop only */}
          <nav className="hidden sm:block text-sm text-gray-600 mb-2">
            <Link href="/dashboard" className="hover:text-gray-900">
              Главная
            </Link>
            {' > '}
            <Link href="/dashboard" className="hover:text-gray-900">
              Настройки
            </Link>
            {' > '}
            <span className="text-gray-900">Уведомления</span>
          </nav>

          {/* Back Link - Mobile only */}
          <Link
            href="/dashboard"
            className="sm:hidden text-sm text-gray-600 hover:text-gray-900 mb-2 inline-block"
          >
            ← Настройки
          </Link>

          {/* Page Title */}
          <div className="flex items-center gap-3">
            <Bell className="h-8 w-8 text-gray-700" />
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Telegram Уведомления</h1>
          </div>
        </div>
      </div>

      {/* Page Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-4 sm:space-y-6">
        {/* Empty State Hero Banner (Q19) - Only shown when NOT bound */}
        {!isBound && <NotificationsHeroBanner onConnect={() => setIsBindingModalOpen(true)} />}

        {/* Card 1: Telegram Binding Status - Only shown when bound */}
        {isBound && <TelegramBindingCard />}

        {/* Card 2: Notification Preferences */}
        {isBound ? (
          <NotificationPreferencesPanel />
        ) : (
          <NotificationsDisabledPanel
            icon="⚙️"
            title="Настройки уведомлений"
            description="Здесь вы сможете настроить типы уведомлений, язык сообщений и время ежедневной сводки"
            lockMessage="Настройки уведомлений станут доступны после подключения"
          />
        )}

        {/* Card 3: Quiet Hours Configuration */}
        {isBound ? (
          <QuietHoursPanel />
        ) : (
          <NotificationsDisabledPanel
            icon="🌙"
            title="Тихие часы"
            description="Здесь вы сможете настроить время, когда уведомления не будут приходить"
            lockMessage="Тихие часы станут доступны после подключения"
          />
        )}

        {/* Card 4: FBS Order Notification Settings (Epic 132-FE) */}
        <OrderNotificationSettings />

        {/* Help Section */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="text-3xl">💡</div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Нужна помощь с настройкой?</h3>
                <p className="text-sm text-gray-700 mb-3">
                  Если у вас возникли вопросы по настройке Telegram уведомлений, обратитесь к нашему
                  руководству или свяжитесь с поддержкой.
                </p>
                <Link
                  href="/help/notifications"
                  onClick={handleHelpClick}
                  className="text-sm text-[#0088CC] hover:underline font-medium"
                >
                  Открыть руководство →
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Telegram Binding Modal */}
      <TelegramBindingModal
        open={isBindingModalOpen}
        onOpenChange={setIsBindingModalOpen}
        onSuccess={() => setIsBindingModalOpen(false)}
      />
    </main>
  )
}
