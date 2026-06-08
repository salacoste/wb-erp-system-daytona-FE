// ============================================================================
// Telegram Binding Card Component
// Epic 34-FE: Story 34.2-FE
// ============================================================================

'use client'

import { useState } from 'react'
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
}: TelegramBindingCardProps) {
  // ============================================================================
  // State
  // ============================================================================

  const { status, isBound, isCheckingStatus } = useTelegramBinding()
  const [bindingModalOpen, setBindingModalOpen] = useState(false)
  const [unbindDialogOpen, setUnbindDialogOpen] = useState(false)

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleBindingSuccess = () => {
    setBindingModalOpen(false)
    onBindingComplete?.()
  }

  const handleUnbindSuccess = () => {
    setUnbindDialogOpen(false)
    onUnbindComplete?.()
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
            <h3 className="text-lg font-semibold">Подключение Telegram</h3>
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
              <div className="flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-green-500" aria-label="Подключен" />
                <span className="text-lg font-semibold text-gray-900">Telegram подключен</span>
              </div>

              {status.telegram_username ? (
                <p className="text-sm text-muted-foreground">@{status.telegram_username}</p>
              ) : (
                <p className="text-sm text-muted-foreground">@Kernel_crypto_bot</p>
              )}

              <Button
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
      />

      {/* Unbind Confirmation Dialog */}
      <UnbindConfirmationDialog
        open={unbindDialogOpen}
        onOpenChange={setUnbindDialogOpen}
        onConfirm={handleUnbindSuccess}
      />
    </>
  )
}
