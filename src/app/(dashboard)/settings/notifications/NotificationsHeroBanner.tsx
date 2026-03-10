'use client'

// ============================================================================
// Hero Banner for unbound Telegram state
// Extracted from notifications/page.tsx (Epic 34-FE: Story 34.5-FE)
// ============================================================================

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Bell, Check, Clock, MessageSquare } from 'lucide-react'

interface NotificationsHeroBannerProps {
  onConnect: () => void
}

const features = [
  {
    icon: Check,
    title: 'Мгновенные уведомления о задачах',
    description: 'Получайте уведомления о завершении, сбоях и задержках задач в реальном времени',
  },
  {
    icon: Clock,
    title: 'Тихие часы',
    description: 'Настройте время, когда уведомления не будут вас беспокоить',
  },
  {
    icon: MessageSquare,
    title: 'Ежедневная сводка',
    description: 'Получайте сводку всех событий за день в удобное время',
  },
] as const

/**
 * Empty State Hero Banner (Q19) - Only shown when NOT bound
 */
export function NotificationsHeroBanner({ onConnect }: NotificationsHeroBannerProps) {
  return (
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
          {features.map(({ icon: Icon, title, description }) => (
            <div key={title} className="flex items-start gap-3">
              <Icon className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-900">{title}</p>
                <p className="text-sm text-gray-600">{description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <div className="pt-2">
          <p className="text-sm text-gray-600 mb-4">
            Начните получать уведомления прямо сейчас — подключение занимает меньше минуты
          </p>
          <Button
            onClick={onConnect}
            size="lg"
            className="bg-[#0088CC] hover:bg-[#0077B3] text-white"
          >
            <Bell className="h-5 w-5 mr-2" />
            Подключить Telegram
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
