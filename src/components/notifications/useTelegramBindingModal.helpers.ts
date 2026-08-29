/**
 * Helper functions for Telegram Binding Modal
 * Extracted from useTelegramBindingModal.ts for file-size compliance
 */

export const BINDING_CODE_TTL_SECONDS = 600

export const TELEGRAM_BOT_USERNAME =
  process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'Kernel_crypto_bot'

/** Format seconds as MM:SS countdown display */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

/** Get progress bar color based on remaining time */
export function getProgressColor(timeRemaining: number): string {
  if (timeRemaining > 120) return 'bg-telegram'
  if (timeRemaining > 30) return 'bg-status-warning'
  return 'bg-status-error'
}

/** Get polling status message based on elapsed duration */
export function getPollingMessage(pollingDurationSeconds: number): string {
  if (pollingDurationSeconds <= 5) return 'Ожидаем подтверждения...'
  if (pollingDurationSeconds <= 60) return 'Всё ещё ожидаем... Проверьте Telegram.'
  return 'Подтверждение занимает дольше обычного. Убедитесь, что вы отправили команду боту.'
}
