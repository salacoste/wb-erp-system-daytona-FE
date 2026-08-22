import type { RetainedChartState } from '@/components/product/charts'

interface FunnelOverlayRetainedStateInput {
  isError: boolean
  showAdOverlay: boolean
  isAdLoading: boolean
  isAdError: boolean
  availableAdDays: number
  unavailableAdDays: number
  totalDays: number
}

export function getFunnelOverlayRetainedState({
  isError,
  showAdOverlay,
  isAdLoading,
  isAdError,
  availableAdDays,
  unavailableAdDays,
  totalDays,
}: FunnelOverlayRetainedStateInput): RetainedChartState {
  const messages: string[] = []

  if (isError) {
    messages.push('Показаны ранее загруженные данные воронки; обновление завершилось ошибкой.')
  }

  if (showAdOverlay && !isAdLoading) {
    if (isAdError && availableAdDays > 0) {
      messages.push(
        'Показаны ранее загруженные рекламные расходы; обновление рекламы завершилось ошибкой.'
      )
    } else if (isAdError) {
      messages.push('Рекламные расходы не загрузились; данные этапов воронки сохранены.')
    } else if (unavailableAdDays === totalDays) {
      messages.push(
        'Рекламные расходы недоступны за выбранный период; данные этапов воронки сохранены.'
      )
    } else if (unavailableAdDays > 0) {
      messages.push(
        `Рекламные расходы недоступны для ${unavailableAdDays} из ${totalDays} дней; отсутствующие значения не заменены нулями.`
      )
    }
  }

  return messages.length > 0
    ? { kind: 'partial', message: messages.join(' ') }
    : { kind: 'rendered' }
}
