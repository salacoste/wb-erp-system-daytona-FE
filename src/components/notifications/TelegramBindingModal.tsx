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
export function TelegramBindingModal({ open, onOpenChange, onSuccess }: TelegramBindingModalProps) {
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">Подключение Telegram</DialogTitle>
          <DialogDescription>
            Подключите Telegram для получения уведомлений о задачах
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Loading State */}
          {isStartingBinding && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-[#0088CC]" />
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
