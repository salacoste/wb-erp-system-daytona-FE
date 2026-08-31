// ============================================================================
// Telegram Binding Card Component
// Epic 34-FE: Story 34.2-FE
// ============================================================================

'use client'

import { useRef, useState } from 'react'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useTelegramBinding } from '@/hooks/useTelegramBinding'
import { TelegramBindingModal } from './TelegramBindingModal'
import { UnbindConfirmationDialog } from './UnbindConfirmationDialog'
import { CheckCircle } from 'lucide-react'

// ============================================================================
// Component Props
// ============================================================================

interface TelegramBindingCardProps {
  onBindingComplete?: () => void
  onUnbindComplete?: () => void
  onUnbindReturnFocus?: () => void
}

// ============================================================================
// Component
// ============================================================================

/**
 * Main card showing Telegram binding status and triggering bind/unbind flows
 *
 * States:
 * 1. Not Bound (Empty State) - Shows "Подключить Telegram" button
 * 2. Bound (Connected State) - Shows username and "Отключить Telegram" button
 *
 * @see docs/stories/epic-34/story-34.2-fe-telegram-binding-flow.md
 */
export function TelegramBindingCard({
  onBindingComplete,
  onUnbindComplete,
  onUnbindReturnFocus,
}: TelegramBindingCardProps) {
  // ============================================================================
  // State
  // ============================================================================

  const { status, isBound, isCheckingStatus } = useTelegramBinding()
  const [bindingModalOpen, setBindingModalOpen] = useState(false)
  const [unbindDialogOpen, setUnbindDialogOpen] = useState(false)
  const connectButtonRef = useRef<HTMLButtonElement>(null)
  const unbindButtonRef = useRef<HTMLButtonElement>(null)
  const unbindSucceededRef = useRef(false)

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleBindingSuccess = () => {
    setBindingModalOpen(false)
    onBindingComplete?.()
  }

  const handleUnbindSuccess = () => {
    unbindSucceededRef.current = true
    setUnbindDialogOpen(false)
    onUnbindComplete?.()
  }

  const returnUnbindFocus = () => {
    if (unbindSucceededRef.current && onUnbindReturnFocus) {
      unbindSucceededRef.current = false
      onUnbindReturnFocus()
      return
    }
    unbindButtonRef.current?.focus()
  }

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <span className="text-2xl" role="img" aria-label="Телефон">
              📱
            </span>
            <h2 className="text-lg font-semibold">Подключение Telegram</h2>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Loading State */}
          {isCheckingStatus && !status && (
            <Alert>
              <AlertDescription>Загрузка...</AlertDescription>
            </Alert>
          )}

          {/* Not Bound State */}
          {!isCheckingStatus && !isBound && (
            <>
              <Alert variant="default">
                <AlertDescription className="space-y-2">
                  <p className="font-medium">Telegram не подключен</p>
                  <p className="text-sm text-muted-foreground">
                    Подключите Telegram для получения уведомлений о задачах
                  </p>
                </AlertDescription>
              </Alert>

              <Button
                ref={connectButtonRef}
                onClick={() => setBindingModalOpen(true)}
                className="w-full sm:w-auto"
                aria-label="Подключить Telegram"
              >
                Подключить Telegram
              </Button>
            </>
          )}

          {/* Bound State (Story 34.7-FE) */}
          {!isCheckingStatus && isBound && status && (
            <>
              <div className="flex items-center gap-3" role="status">
                <CheckCircle className="size-6 text-status-success" aria-hidden="true" />
                <span className="text-lg font-semibold text-foreground">Telegram подключен</span>
              </div>

              {status.telegram_username ? (
                <p className="break-all text-sm text-muted-foreground">
                  @{status.telegram_username}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">@Kernel_crypto_bot</p>
              )}

              <Button
                ref={unbindButtonRef}
                variant="destructive"
                onClick={() => setUnbindDialogOpen(true)}
                className="w-full sm:w-auto"
                aria-label="Отключить Telegram"
              >
                Отключить
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Binding Modal */}
      <TelegramBindingModal
        open={bindingModalOpen}
        onOpenChange={setBindingModalOpen}
        onSuccess={handleBindingSuccess}
        onReturnFocus={() => connectButtonRef.current?.focus()}
      />

      {/* Unbind Confirmation Dialog */}
      <UnbindConfirmationDialog
        open={unbindDialogOpen}
        onOpenChange={setUnbindDialogOpen}
        onConfirm={handleUnbindSuccess}
        onReturnFocus={returnUnbindFocus}
      />
    </>
  )
}
