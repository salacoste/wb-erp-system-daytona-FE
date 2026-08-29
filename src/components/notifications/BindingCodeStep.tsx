// ============================================================================
// Binding Code Step - Verification code display & actions
// Epic 34-FE: Story 34.2-FE (extracted from TelegramBindingModal.tsx)
// ============================================================================

'use client'

import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Copy, Send } from 'lucide-react'
import { TELEGRAM_BOT_USERNAME } from './useTelegramBindingModal'

// ============================================================================
// Component Props
// ============================================================================

interface BindingCodeStepProps {
  bindingCode: string
  isBound: boolean
  timeRemaining: number
  progress: number
  formatTime: (seconds: number) => string
  getProgressColor: () => string
  getPollingMessage: () => string
  handleCopyCode: () => void
  handleOpenTelegram: () => void
}

// ============================================================================
// Component
// ============================================================================

/**
 * Displays the binding verification code, deep link button,
 * countdown timer, and polling indicator.
 */
export function BindingCodeStep({
  bindingCode,
  isBound,
  timeRemaining,
  progress,
  formatTime,
  getProgressColor,
  getPollingMessage,
  handleCopyCode,
  handleOpenTelegram,
}: BindingCodeStepProps) {
  return (
    <>
      {/* Step 1: Instructions */}
      <div>
        <h4 className="text-base font-medium mb-2">Шаг 1: Откройте бот в Telegram</h4>
        <p className="text-sm text-muted-foreground mb-4">
          Отправьте боту @{TELEGRAM_BOT_USERNAME}:
        </p>

        {/* Verification Code */}
        <div className="flex flex-wrap items-center gap-2 rounded-lg bg-muted p-3">
          <code className="flex-1 font-mono text-lg select-all">/start {bindingCode}</code>
          <Button variant="ghost" size="sm" onClick={handleCopyCode} aria-label="Копировать код">
            <Copy className="h-4 w-4" />
            <span className="ml-2">Копировать</span>
          </Button>
        </div>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-4">
        <div className="h-px flex-1 bg-border" />
        <span className="text-sm text-muted-foreground">или</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {/* Deep Link Button */}
      <Button
        variant="outline"
        className="w-full border-telegram/40 text-telegram hover:bg-telegram/10 hover:text-telegram"
        size="lg"
        onClick={handleOpenTelegram}
        aria-label="Открыть в Telegram"
      >
        <Send className="h-5 w-5" />
        Открыть в Telegram
      </Button>

      {/* Countdown Timer */}
      {timeRemaining > 0 ? (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Код действителен ещё:{' '}
            <strong className="font-semibold">{formatTime(timeRemaining)}</strong>
          </p>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full ${getProgressColor()} transition-all duration-1000 motion-reduce:transition-none ${
                timeRemaining <= 30 ? 'animate-pulse motion-reduce:animate-none' : ''
              }`}
              style={{ width: `${progress}%` }}
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Время до истечения кода: ${formatTime(timeRemaining)}`}
            />
          </div>
        </div>
      ) : (
        <Alert variant="destructive">
          <AlertDescription>
            Код истёк. Пожалуйста, закройте окно и попробуйте снова.
          </AlertDescription>
        </Alert>
      )}

      {/* Polling Indicator */}
      {!isBound && timeRemaining > 0 && (
        <div
          className="flex items-center gap-3 text-sm text-muted-foreground"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <Loader2
            aria-hidden="true"
            className="size-6 animate-spin text-telegram motion-reduce:animate-none"
          />
          <p>{getPollingMessage()}</p>
        </div>
      )}
    </>
  )
}
