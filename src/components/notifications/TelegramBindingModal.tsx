// ============================================================================
// Telegram Binding Modal Component
// Epic 34-FE: Story 34.2-FE
// ============================================================================

'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Loader2 } from 'lucide-react'
import { useTelegramBindingModal } from './useTelegramBindingModal'
import { BindingCodeStep } from './BindingCodeStep'

// ============================================================================
// Component Props
// ============================================================================

interface TelegramBindingModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  onReturnFocus?: () => void
}

// ============================================================================
// Component
// ============================================================================

/**
 * Modal dialog for Telegram binding flow with code display and polling
 *
 * Features:
 * - Verification code display with copy button
 * - Countdown timer with color-coded progress bar
 * - Deep link button for native Telegram app
 * - 3-second polling with dynamic status messages
 * - Auto-close on successful binding
 *
 * @see docs/stories/epic-34/story-34.2-fe-telegram-binding-flow.md
 */
export function TelegramBindingModal({
  open,
  onOpenChange,
  onSuccess,
  onReturnFocus,
}: TelegramBindingModalProps) {
  const {
    bindingCode,
    isBound,
    isStartingBinding,
    timeRemaining,
    progress,
    formatTime,
    getProgressColor,
    getPollingMessage,
    handleCopyCode,
    handleOpenTelegram,
  } = useTelegramBindingModal({ open, onSuccess })

  return (
    <Dialog
      open={open}
      onOpenChange={nextOpen => {
        if (isStartingBinding && !nextOpen) return
        onOpenChange(nextOpen)
      }}
    >
      <DialogContent
        className="max-h-[90vh] max-w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-[540px]"
        onEscapeKeyDown={event => {
          if (isStartingBinding) event.preventDefault()
        }}
        onPointerDownOutside={event => {
          if (isStartingBinding) event.preventDefault()
        }}
        onCloseAutoFocus={event => {
          if (!onReturnFocus) return
          event.preventDefault()
          onReturnFocus()
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">Подключение Telegram</DialogTitle>
          <DialogDescription>
            Подключите Telegram для получения уведомлений о задачах
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Loading State */}
          {isStartingBinding && (
            <div
              role="status"
              aria-label="Создаём код привязки"
              className="flex items-center justify-center gap-3 py-8 text-muted-foreground"
            >
              <Loader2
                aria-hidden="true"
                className="size-8 animate-spin text-telegram motion-reduce:animate-none"
              />
              <span>Создаём код привязки…</span>
            </div>
          )}

          {/* Binding Code Display */}
          {bindingCode && (
            <BindingCodeStep
              bindingCode={bindingCode}
              isBound={isBound}
              timeRemaining={timeRemaining}
              progress={progress}
              formatTime={formatTime}
              getProgressColor={getProgressColor}
              getPollingMessage={getPollingMessage}
              handleCopyCode={handleCopyCode}
              handleOpenTelegram={handleOpenTelegram}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
