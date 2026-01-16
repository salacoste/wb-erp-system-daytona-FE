// ============================================================================
// Telegram Binding Modal Component
// Epic 34-FE: Story 34.2-FE
// ============================================================================

'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useTelegramBinding } from '@/hooks/useTelegramBinding';
import { TelegramMetrics } from '@/lib/analytics/telegram-metrics';
import { Loader2, Copy, Send } from 'lucide-react';
import { toast } from 'sonner';

// ============================================================================
// Constants
// ============================================================================

/**
 * Binding code expiration time in seconds (10 minutes)
 * Must match backend TTL configuration
 */
const BINDING_CODE_TTL_SECONDS = 600;

/**
 * Telegram bot username for binding instructions
 * Configured via NEXT_PUBLIC_TELEGRAM_BOT_USERNAME env var
 * Fallback to hardcoded bot for development
 */
const TELEGRAM_BOT_USERNAME =
  process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'Kernel_crypto_bot';

// ============================================================================
// Component Props
// ============================================================================

interface TelegramBindingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
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
}: TelegramBindingModalProps) {
  // ============================================================================
  // State
  // ============================================================================

  const [bindingCode, setBindingCode] = useState<string | null>(null);
  const [deepLink, setDeepLink] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(BINDING_CODE_TTL_SECONDS);

  const { startBinding, isBound, isStartingBinding } = useTelegramBinding();

  // ============================================================================
  // Analytics Tracking Refs
  // ============================================================================

  const bindingStartTimeRef = useRef<number | null>(null);
  const modalOpenTimeRef = useRef<number | null>(null);
  const bindingExpiredTrackedRef = useRef(false);
  const previousIsBoundRef = useRef(false); // Track previous bound state

  // ============================================================================
  // Start Binding on Modal Open
  // ============================================================================

  useEffect(() => {
    if (open && !bindingCode) {
      // Track modal opened and binding flow started
      modalOpenTimeRef.current = Date.now();
      bindingStartTimeRef.current = Date.now();
      TelegramMetrics.bindingStarted();

      startBinding(undefined, {
        onSuccess: (data) => {
          setBindingCode(data.binding_code);
          setDeepLink(data.deep_link);
          setExpiresAt(data.expires_at);
        },
        onError: (error) => {
          toast.error('Не удалось создать код привязки. Попробуйте ещё раз.');
          console.error('Binding start error:', error);

          // Track binding failed
          TelegramMetrics.bindingFailed(
            error instanceof Error ? error.message : 'Unknown error'
          );
        },
      });
    }
  }, [open, bindingCode, startBinding]);

  // ============================================================================
  // Countdown Timer
  // ============================================================================

  useEffect(() => {
    if (!expiresAt) return;

    const interval = setInterval(() => {
      const remaining = Math.floor(
        (new Date(expiresAt).getTime() - Date.now()) / 1000
      );
      setTimeRemaining(Math.max(0, remaining));

      if (remaining <= 0) {
        clearInterval(interval);

        // Track binding expired (only once)
        if (!bindingExpiredTrackedRef.current) {
          TelegramMetrics.bindingExpired();
          bindingExpiredTrackedRef.current = true;
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  // ============================================================================
  // Success Handler
  // ============================================================================

  useEffect(() => {
    // Only show toast when:
    // 1. Modal is open (user is actively binding)
    // 2. Binding code was generated (binding flow started in this session)
    // 3. Status changed from unbound to bound (prevents page reload toast)
    if (open && bindingCode && isBound && !previousIsBoundRef.current) {
      toast.success('Telegram успешно подключен!');

      // Track binding completion with duration
      if (bindingStartTimeRef.current) {
        const durationSeconds = (Date.now() - bindingStartTimeRef.current) / 1000;
        TelegramMetrics.bindingCompleted(durationSeconds);
      }

      onSuccess();
    }

    // Update previous state
    previousIsBoundRef.current = isBound;
  }, [open, bindingCode, isBound, onSuccess]);

  // ============================================================================
  // Modal Close Tracking (Cancellation)
  // ============================================================================

  useEffect(() => {
    // Track cancellation when modal closes without binding completion
    return () => {
      if (
        !isBound &&
        bindingCode &&
        modalOpenTimeRef.current &&
        timeRemaining > 0
      ) {
        const elapsedSeconds = (Date.now() - modalOpenTimeRef.current) / 1000;
        TelegramMetrics.bindingCancelled(elapsedSeconds);
      }
    };
  }, [isBound, bindingCode, timeRemaining]);

  // ============================================================================
  // Polling Time Tracking
  // ============================================================================

  const [pollingStartTime] = useState(() => Date.now());
  const pollingDuration = Math.floor((Date.now() - pollingStartTime) / 1000);

  // ============================================================================
  // Helpers
  // ============================================================================

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = (timeRemaining / BINDING_CODE_TTL_SECONDS) * 100;

  // Progress bar color based on time remaining
  const getProgressColor = () => {
    if (timeRemaining > 120) return 'bg-[#0088CC]'; // Telegram Blue
    if (timeRemaining > 30) return 'bg-orange-500'; // Warning Orange
    return 'bg-red-500'; // Error Red
  };

  // Dynamic polling message based on elapsed time
  const getPollingMessage = () => {
    if (pollingDuration <= 5) return 'Ожидаем подтверждения...';
    if (pollingDuration <= 60) return 'Всё ещё ожидаем... Проверьте Telegram.';
    return 'Подтверждение занимает дольше обычного. Убедитесь, что вы отправили команду боту.';
  };

  const handleCopyCode = async () => {
    if (!bindingCode) return;

    try {
      await navigator.clipboard.writeText(`/start ${bindingCode}`);
      toast.success('Команда скопирована!');
    } catch (error) {
      toast.error('Не удалось скопировать');
    }
  };

  const handleOpenTelegram = () => {
    if (!deepLink) return;
    window.open(deepLink, '_blank', 'noopener,noreferrer');
  };

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">
            Подключение Telegram
          </DialogTitle>
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
            <>
              {/* Step 1: Instructions */}
              <div>
                <h4 className="text-base font-medium mb-2">
                  Шаг 1: Откройте бот в Telegram
                </h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Отправьте боту @{TELEGRAM_BOT_USERNAME}:
                </p>

                {/* Verification Code */}
                <div className="flex items-center gap-2 p-3 bg-gray-100 rounded-lg">
                  <code className="flex-1 font-mono text-lg select-all">
                    /start {bindingCode}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyCode}
                    aria-label="Копировать код"
                  >
                    <Copy className="h-4 w-4" />
                    <span className="ml-2">Копировать</span>
                  </Button>
                </div>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-gray-300" />
                <span className="text-sm text-muted-foreground">или</span>
                <div className="flex-1 h-px bg-gray-300" />
              </div>

              {/* Deep Link Button */}
              <Button
                className="w-full bg-[#0088CC] hover:bg-[#0077B3] text-white"
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
                    <strong className="font-semibold">
                      {formatTime(timeRemaining)}
                    </strong>
                  </p>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getProgressColor()} transition-all duration-1000 ${
                        timeRemaining <= 30 ? 'animate-pulse' : ''
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
                  <Loader2 className="h-6 w-6 animate-spin text-[#0088CC]" />
                  <p>{getPollingMessage()}</p>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
