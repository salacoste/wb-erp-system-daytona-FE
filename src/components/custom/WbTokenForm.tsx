'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, ExternalLink } from 'lucide-react'
import { updateWbToken } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import { ROUTES } from '@/lib/routes'

// Error type for API errors with additional data
interface ApiErrorWithData extends Error {
  data?: {
    code?: string
    message?: string
    details?: Array<{ field?: string; issue?: string; recommendation?: string }>
  }
}

const wbTokenFormSchema = z.object({
  token: z
    .string()
    .min(1, 'WB API токен обязателен')
    .min(50, 'Токен кажется слишком коротким. Пожалуйста, проверьте токен.')
    .refine(
      (value) => {
        // Базовая валидация формата JWT (3 части, разделенные точками)
        const parts = value.split('.')
        return parts.length === 3
      },
      {
        message: 'Формат токена кажется неверным. Пожалуйста, проверьте токен.',
      },
    ),
})

type WbTokenFormData = z.infer<typeof wbTokenFormSchema>

/**
 * WB Token input form for onboarding flow
 * Story 2.2: WB Token Input & Validation
 * Automatically uses cabinetId from auth store
 *
 * 📝 Важно: Использует имя ключа 'wb_api_token' (см. docs/CHANGELOG-wb-token-key-name.md)
 */
/**
 * Get user-friendly error message based on API error
 */
function getErrorMessage(error: Error | ApiErrorWithData): { title: string; message: string; showLink: boolean } {
  const errorMessage = error.message.toLowerCase()

  // Check if it's an ApiError with error data
  const apiError = error as ApiErrorWithData
  const errorCode = apiError.data?.code?.toLowerCase() || ''

  // Invalid or expired token
  if (errorCode.includes('invalid') || errorCode.includes('token_validation') ||
      errorMessage.includes('invalid') || errorMessage.includes('expired') ||
      errorMessage.includes('validation failed')) {
    return {
      title: 'Токен недействителен',
      message: 'WB API токен недействителен или истек. Пожалуйста, проверьте правильность токена или получите новый в личном кабинете Wildberries.',
      showLink: true,
    }
  }

  // Rate limit
  if (errorCode.includes('rate') || errorMessage.includes('rate limit') || errorMessage.includes('429')) {
    return {
      title: 'Превышен лимит запросов',
      message: 'Превышен лимит запросов к WB API. Пожалуйста, подождите несколько минут и попробуйте снова.',
      showLink: false,
    }
  }

  // Network error
  if (errorCode.includes('network') || errorMessage.includes('network') || errorMessage.includes('connection')) {
    return {
      title: 'Ошибка сети',
      message: 'Не удалось подключиться к WB API. Проверьте интернет-соединение и попробуйте снова.',
      showLink: false,
    }
  }

  // Permission error
  if (errorMessage.includes('permission') || errorMessage.includes('forbidden') || errorMessage.includes('403')) {
    return {
      title: 'Нет доступа',
      message: 'У вас нет прав для сохранения токена. Требуется роль Owner или Manager.',
      showLink: false,
    }
  }

  // Cabinet not found
  if (errorMessage.includes('cabinet') || errorMessage.includes('not found')) {
    return {
      title: 'Кабинет не найден',
      message: 'Кабинет не найден. Пожалуйста, вернитесь к предыдущему шагу и создайте кабинет.',
      showLink: false,
    }
  }

  // Default error
  return {
    title: 'Ошибка сохранения токена',
    message: error.message || 'Произошла неизвестная ошибка. Попробуйте снова.',
    showLink: true,
  }
}

export function WbTokenForm() {
  const router = useRouter()
  const { token, cabinetId } = useAuthStore()
  const [formError, setFormError] = useState<{ title: string; message: string; showLink: boolean } | null>(null)

  const form = useForm<WbTokenFormData>({
    resolver: zodResolver(wbTokenFormSchema),
    defaultValues: {
      token: '',
    },
    mode: 'onBlur',
  })

  // Clear error when user starts typing (better UX)
  const handleTokenChange = (value: string, onChange: (value: string) => void) => {
    if (formError) {
      setFormError(null)
    }
    onChange(value)
  }

  const mutation = useMutation({
    mutationFn: async (data: WbTokenFormData) => {
      // Clear previous error
      setFormError(null)

      if (!token) {
        throw new Error('User not authenticated')
      }
      if (!cabinetId) {
        throw new Error('Cabinet ID not found. Please create a cabinet first.')
      }
      return await updateWbToken(cabinetId, 'wb_api_token', data.token)
    },
    onSuccess: () => {
      toast.success('WB API токен успешно сохранен!')
      form.reset()
      setFormError(null)
      // Navigate to data processing status page
      router.push(ROUTES.ONBOARDING.PROCESSING)
    },
    onError: (error: Error) => {
      const errorInfo = getErrorMessage(error)
      setFormError(errorInfo)
      toast.error(errorInfo.title)
    },
  })

  const onSubmit = (data: WbTokenFormData) => {
    mutation.mutate(data)
  }

  const isSubmitting = mutation.isPending

  if (!cabinetId) {
    return (
      <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
        <p className="text-sm text-destructive">
          Кабинет не найден. Пожалуйста, вернитесь к предыдущему шагу и создайте
          кабинет.
        </p>
      </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Error Alert */}
        {formError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{formError.title}</AlertTitle>
            <AlertDescription>
              <p>{formError.message}</p>
              {formError.showLink && (
                <a
                  href="https://seller.wildberries.ru/supplier-settings/access-to-api"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-2 text-sm underline hover:no-underline"
                >
                  Получить новый токен
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </AlertDescription>
          </Alert>
        )}

        <FormField
          control={form.control}
          name="token"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                WB API токен <span aria-label="required">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  onChange={(e) => handleTokenChange(e.target.value, field.onChange)}
                  type="password"
                  placeholder="Введите ваш WB API токен"
                  disabled={isSubmitting}
                  aria-required="true"
                  aria-invalid={!!form.formState.errors.token || !!formError}
                />
              </FormControl>
              <FormMessage />
              <p className="text-sm text-muted-foreground">
                Введите ваш Wildberries API токен. Вы можете найти его в настройках
                вашего аккаунта продавца на{' '}
                <a
                  href="https://seller.wildberries.ru/supplier-settings/access-to-api"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  Wildberries Seller Portal
                </a>
                . После сохранения токена начнется автоматическая обработка ваших
                данных.
              </p>
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full"
          disabled={isSubmitting}
          aria-busy={isSubmitting}
        >
          {isSubmitting ? 'Проверка токена...' : 'Сохранить токен'}
        </Button>
      </form>
    </Form>
  )
}

