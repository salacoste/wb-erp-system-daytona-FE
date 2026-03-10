/**
 * WbTokenForm helpers - validation schema and error message mapping
 * Extracted from WbTokenForm.tsx for file size compliance
 * Story 2.2: WB Token Input & Validation
 */

import { z } from 'zod'

/** Error type for API errors with additional data */
interface ApiErrorWithData extends Error {
  data?: {
    code?: string
    message?: string
    details?: Array<{ field?: string; issue?: string; recommendation?: string }>
  }
}

export const wbTokenFormSchema = z.object({
  token: z
    .string()
    .min(1, 'WB API токен обязателен')
    .min(50, 'Токен кажется слишком коротким. Пожалуйста, проверьте токен.')
    .refine(
      value => {
        const parts = value.split('.')
        return parts.length === 3
      },
      {
        message: 'Формат токена кажется неверным. Пожалуйста, проверьте токен.',
      }
    ),
})

export type WbTokenFormData = z.infer<typeof wbTokenFormSchema>

/**
 * Get user-friendly error message based on API error
 */
export function getErrorMessage(error: Error): {
  title: string
  message: string
  showLink: boolean
} {
  const errorMessage = error.message.toLowerCase()

  const apiError = error as ApiErrorWithData
  const errorCode = apiError.data?.code?.toLowerCase() || ''

  if (
    errorCode.includes('invalid') ||
    errorCode.includes('token_validation') ||
    errorMessage.includes('invalid') ||
    errorMessage.includes('expired') ||
    errorMessage.includes('validation failed')
  ) {
    return {
      title: 'Токен недействителен',
      message:
        'WB API токен недействителен или истек. Пожалуйста, проверьте правильность токена или получите новый в личном кабинете Wildberries.',
      showLink: true,
    }
  }

  if (
    errorCode.includes('rate') ||
    errorMessage.includes('rate limit') ||
    errorMessage.includes('429')
  ) {
    return {
      title: 'Превышен лимит запросов',
      message:
        'Превышен лимит запросов к WB API. Пожалуйста, подождите несколько минут и попробуйте снова.',
      showLink: false,
    }
  }

  if (
    errorCode.includes('network') ||
    errorMessage.includes('network') ||
    errorMessage.includes('connection')
  ) {
    return {
      title: 'Ошибка сети',
      message:
        'Не удалось подключиться к WB API. Проверьте интернет-соединение и попробуйте снова.',
      showLink: false,
    }
  }

  if (
    errorMessage.includes('permission') ||
    errorMessage.includes('forbidden') ||
    errorMessage.includes('403')
  ) {
    return {
      title: 'Нет доступа',
      message: 'У вас нет прав для сохранения токена. Требуется роль Owner или Manager.',
      showLink: false,
    }
  }

  if (errorMessage.includes('cabinet') || errorMessage.includes('not found')) {
    return {
      title: 'Кабинет не найден',
      message: 'Кабинет не найден. Пожалуйста, вернитесь к предыдущему шагу и создайте кабинет.',
      showLink: false,
    }
  }

  return {
    title: 'Ошибка сохранения токена',
    message: error.message || 'Произошла неизвестная ошибка. Попробуйте снова.',
    showLink: true,
  }
}
