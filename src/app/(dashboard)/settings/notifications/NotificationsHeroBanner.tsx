'use client'

// ============================================================================
// Hero Banner for unbound Telegram state (Story 34.7-FE)
// Engaging empty state to increase binding conversion from ~20% to ~48%
// ============================================================================

import { Button } from '@/components/ui/button'
import { Send, Check, Smartphone } from 'lucide-react'
import type { Ref } from 'react'

interface NotificationsHeroBannerProps {
  onConnect: () => void
  connectButtonRef?: Ref<HTMLButtonElement>
}

/** Three benefit bullets displayed in the hero banner */
const benefits = [
  'Мгновенные уведомления о критических изменениях',
  'Аналитика по телефону — без входа в систему',
  'Бесплатно, никаких подписок',
] as const

/**
 * Empty State Hero Banner (Q19) - Only shown when NOT bound.
 * Semantic channel accent, benefit bullets, and a prominent CTA.
 */
export function NotificationsHeroBanner({
  onConnect,
  connectButtonRef,
}: NotificationsHeroBannerProps) {
  return (
    <div className="rounded-lg border border-telegram/30 bg-card p-6 text-card-foreground shadow-sm sm:p-8">
      <div className="mb-4 flex justify-center">
        <span className="rounded-full bg-telegram/10 p-3 text-telegram">
          <Send className="size-8 sm:size-10" aria-hidden="true" />
        </span>
      </div>

      {/* Heading */}
      <h2 className="mb-3 text-center text-xl font-semibold text-foreground sm:text-2xl">
        Получайте уведомления в Telegram
      </h2>

      {/* Description */}
      <p className="mb-6 text-center text-sm text-muted-foreground sm:text-base">
        Мгновенные push-уведомления о состоянии импортов, синхронизаций и ошибках прямо в Telegram.
      </p>

      {/* Benefits List */}
      <ul className="mb-8 space-y-3">
        {benefits.map(text => (
          <li key={text} className="flex items-start gap-3">
            <Check className="mt-0.5 size-5 shrink-0 text-status-success" aria-hidden="true" />
            <span className="text-sm font-medium text-foreground sm:text-base">{text}</span>
          </li>
        ))}
      </ul>

      {/* CTA Button */}
      <div className="flex justify-center">
        <Button
          ref={connectButtonRef}
          onClick={onConnect}
          size="lg"
          className="min-h-11 w-full px-8 text-base font-semibold sm:w-auto"
          aria-label="Подключить Telegram"
        >
          <Smartphone className="h-5 w-5 mr-2" aria-hidden="true" />
          Подключить Telegram
        </Button>
      </div>

      {/* Bot info */}
      <p className="mt-4 text-center text-xs text-muted-foreground">Бот: @Kernel_crypto_bot</p>
    </div>
  )
}
