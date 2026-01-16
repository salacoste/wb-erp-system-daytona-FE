'use client';

// ============================================================================
// Telegram Notifications Settings Page
// Epic 34-FE: Story 34.5-FE
// Integration of all notification components with layout and empty states
// Analytics: Page view tracking and help link clicks
// ============================================================================

import { useTelegramBinding } from '@/hooks/useTelegramBinding';
import {
  TelegramBindingCard,
  TelegramBindingModal,
  NotificationPreferencesPanel,
  QuietHoursPanel,
} from '@/components/notifications';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Bell, Lock, Check, Clock, MessageSquare } from 'lucide-react';
import { TelegramMetrics } from '@/lib/analytics/telegram-metrics';
import Link from 'next/link';
import { useState, useEffect } from 'react';

/**
 * Telegram Notifications Settings Page
 *
 * Layout (Q16): Vertical stack with max-width 1024px
 * Empty State (Q19): Hero banner when not bound
 * Mobile (Q18): Full-width cards, reduced padding
 */
export default function NotificationsSettingsPage() {
  const { isBound } = useTelegramBinding();
  const [isBindingModalOpen, setIsBindingModalOpen] = useState(false);

  // Track page view on mount (Epic 34-FE Analytics)
  useEffect(() => {
    TelegramMetrics.pageViewed();
  }, []);

  // Track help link clicks
  const handleHelpClick = () => {
    TelegramMetrics.helpClicked();
  };

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
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Telegram Уведомления
            </h1>
          </div>
        </div>
      </div>

      {/* Page Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-4 sm:space-y-6">
        {/* Empty State Hero Banner (Q19) - Only shown when NOT bound */}
        {!isBound && (
          <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-3">
                <Bell className="h-7 w-7 text-[#0088CC]" />
                Подключите Telegram для мгновенных уведомлений
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Feature List */}
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">
                      Мгновенные уведомления о задачах
                    </p>
                    <p className="text-sm text-gray-600">
                      Получайте уведомления о завершении, сбоях и задержках задач в реальном времени
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">
                      Тихие часы
                    </p>
                    <p className="text-sm text-gray-600">
                      Настройте время, когда уведомления не будут вас беспокоить
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MessageSquare className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">
                      Ежедневная сводка
                    </p>
                    <p className="text-sm text-gray-600">
                      Получайте сводку всех событий за день в удобное время
                    </p>
                  </div>
                </div>
              </div>

              {/* CTA Button */}
              <div className="pt-2">
                <p className="text-sm text-gray-600 mb-4">
                  Начните получать уведомления прямо сейчас — подключение занимает меньше минуты
                </p>
                <Button
                  onClick={() => setIsBindingModalOpen(true)}
                  size="lg"
                  className="bg-[#0088CC] hover:bg-[#0077B3] text-white"
                >
                  <Bell className="h-5 w-5 mr-2" />
                  Подключить Telegram
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Card 1: Telegram Binding Status - Only shown when bound */}
        {isBound && <TelegramBindingCard />}

        {/* Card 2: Notification Preferences */}
        {isBound ? (
          <NotificationPreferencesPanel />
        ) : (
          <Card className="relative">
            {/* Disabled Overlay */}
            <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 rounded-lg flex items-center justify-center">
              <div className="text-center px-6">
                <Lock className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-lg font-medium text-gray-700 mb-1">
                  Подключите Telegram
                </p>
                <p className="text-sm text-gray-500">
                  Настройки уведомлений станут доступны после подключения
                </p>
              </div>
            </div>

            {/* Disabled Preferences Panel (for visual structure) */}
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <span className="text-2xl">⚙️</span>
                Настройки уведомлений
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 opacity-40">
              <Alert>
                <AlertDescription className="text-sm">
                  Здесь вы сможете настроить типы уведомлений, язык сообщений и время ежедневной сводки
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}

        {/* Card 3: Quiet Hours Configuration */}
        {isBound ? (
          <QuietHoursPanel />
        ) : (
          <Card className="relative">
            {/* Disabled Overlay */}
            <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 rounded-lg flex items-center justify-center">
              <div className="text-center px-6">
                <Lock className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-lg font-medium text-gray-700 mb-1">
                  Подключите Telegram
                </p>
                <p className="text-sm text-gray-500">
                  Тихие часы станут доступны после подключения
                </p>
              </div>
            </div>

            {/* Disabled Quiet Hours Panel (for visual structure) */}
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <span className="text-2xl">🌙</span>
                Тихие часы
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 opacity-40">
              <Alert>
                <AlertDescription className="text-sm">
                  Здесь вы сможете настроить время, когда уведомления не будут приходить
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}

        {/* Help Section */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="text-3xl">💡</div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Нужна помощь с настройкой?
                </h3>
                <p className="text-sm text-gray-700 mb-3">
                  Если у вас возникли вопросы по настройке Telegram уведомлений, обратитесь к нашему руководству или свяжитесь с поддержкой.
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
  );
}
