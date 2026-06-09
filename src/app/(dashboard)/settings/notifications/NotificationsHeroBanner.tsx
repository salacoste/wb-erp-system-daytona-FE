'use client'

// ============================================================================
// Hero Banner for unbound Telegram state (Story 34.7-FE)
// Engaging empty state to increase binding conversion from ~20% to ~48%
// ============================================================================

import { Button } from '@/components/ui/button'
import { Rocket, Check, Smartphone } from 'lucide-react'

interface NotificationsHeroBannerProps {
  onConnect: () => void
}

/** Three benefit bullets displayed in the hero banner */
const benefits = [
  'Мгновенные уведомления о критических изменениях',
  'Аналитика по телефону — без входа в систему',
  'Бесплатно, никаких подписок',
] as const

/**
 * Empty State Hero Banner (Q19) - Only shown when NOT bound.
 * Gradient background, rocket icon, benefit bullets, large CTA.
 */
export function NotificationsHeroBanner({ onConnect }: NotificationsHeroBannerProps) {
  return (
    <div className="relative overflow-hidden rounded-lg border-2 border-blue-300 bg-gradient-to-br from-blue-500 via-purple-500 to-purple-600 p-6 sm:p-8">
      {/* Decorative blur circles */}
      <div
        className="absolute -left-8 -top-8 h-32 w-32 rounded-full bg-card/10 blur-2xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute -right-8 -bottom-8 h-32 w-32 rounded-full bg-card/10 blur-2xl pointer-events-none"
        aria-hidden="true"
      />

      {/* Rocket Icon */}
      <div className="relative mb-4 flex justify-center">
        <Rocket className="h-10 w-10 sm:h-12 sm:w-12 text-white" aria-label="Ракета" />
      </div>

      {/* Heading */}
      <h3 className="relative mb-3 text-center text-xl sm:text-2xl font-bold text-white">
        Получайте уведомления в Telegram
      </h3>

      {/* Description */}
      <p className="relative mb-6 text-center text-sm sm:text-base text-white/90">
        Мгновенные push-уведомления о состоянии импортов, синхронизаций и ошибках прямо в Telegram.
      </p>

      {/* Benefits List */}
      <ul className="relative mb-8 space-y-3">
        {benefits.map(text => (
          <li key={text} className="flex items-start gap-3">
            <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-300" aria-label="Галочка" />
            <span className="text-sm sm:text-base text-white font-medium">{text}</span>
          </li>
        ))}
      </ul>

      {/* CTA Button */}
      <div className="relative flex justify-center">
        <Button
          onClick={onConnect}
          size="lg"
          className="w-full sm:w-auto bg-[#E53935] hover:bg-[#D32F2F] text-white font-semibold px-8 py-3 text-base shadow-lg hover:shadow-xl transition-all duration-200 focus-visible:ring-2 focus-visible:ring-white/80"
          aria-label="Подключить Telegram"
        >
          <Smartphone className="h-5 w-5 mr-2" aria-hidden="true" />
          Подключить Telegram
        </Button>
      </div>

      {/* Bot info */}
      <p className="relative mt-4 text-center text-xs text-white/60">Бот: @Kernel_crypto_bot</p>
    </div>
  )
}
