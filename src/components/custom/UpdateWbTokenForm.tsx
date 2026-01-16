'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
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
import { updateWbToken } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'

const updateTokenFormSchema = z.object({
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

type UpdateTokenFormData = z.infer<typeof updateTokenFormSchema>

interface UpdateWbTokenFormProps {
  cabinetId: string
  keyName?: string // По умолчанию "wb_api_token"
  onSuccess?: () => void // Callback после успешного обновления
  onError?: (error: Error) => void // Callback при ошибке
}

/**
 * Update WB API token form component
 * Handles token update with proper error handling and X-Cabinet-Id header
 *
 * 📝 Важно: По умолчанию использует имя ключа 'wb_api_token' (см. docs/CHANGELOG-wb-token-key-name.md)
 */
export function UpdateWbTokenForm({
  cabinetId,
  keyName = 'wb_api_token',
  onSuccess,
  onError,
}: UpdateWbTokenFormProps) {
  const { token } = useAuthStore()
  const form = useForm<UpdateTokenFormData>({
    resolver: zodResolver(updateTokenFormSchema),
    defaultValues: {
      token: '',
    },
    mode: 'onBlur',
  })

  const mutation = useMutation({
    mutationFn: async (data: UpdateTokenFormData) => {
      if (!token) {
        throw new Error('User not authenticated')
      }
      return await updateWbToken(cabinetId, keyName, data.token, token)
    },
    onSuccess: () => {
      toast.success('WB API токен успешно обновлен!')
      form.reset() // Очищаем поле ввода
      if (onSuccess) {
        onSuccess()
      }
    },
    onError: (error: Error) => {
      const errorMessage = error.message.toLowerCase()
      let userMessage = error.message

      // Пользовательские сообщения для специфичных ошибок
      if (errorMessage.includes('invalid') || errorMessage.includes('expired')) {
        userMessage =
          'WB API токен недействителен или истек. Пожалуйста, проверьте токен или получите новый на https://seller.wildberries.ru/'
      } else if (errorMessage.includes('permission') || errorMessage.includes('forbidden')) {
        userMessage =
          'У вас нет прав для обновления токена. Требуется роль Owner или Manager.'
      } else if (errorMessage.includes('not found')) {
        userMessage = 'Кабинет или ключ не найден. Пожалуйста, проверьте данные.'
      } else if (errorMessage.includes('rate limit')) {
        userMessage =
          'Превышен лимит запросов к WB API. Пожалуйста, подождите несколько минут и попробуйте снова.'
      }

      toast.error(userMessage)

      if (onError) {
        onError(error)
      }
    },
  })

  const onSubmit = (data: UpdateTokenFormData) => {
    mutation.mutate(data)
  }

  const isSubmitting = mutation.isPending

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="token"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Новый WB API токен <span aria-label="required">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="password" // Скрываем токен при вводе
                  placeholder="Введите новый WB API токен"
                  disabled={isSubmitting}
                  aria-required="true"
                  aria-invalid={!!form.formState.errors.token}
                />
              </FormControl>
              <FormMessage />
              <p className="text-sm text-muted-foreground">
                Получите токен на{' '}
                <a
                  href="https://seller.wildberries.ru/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  Wildberries Seller Portal
                </a>
              </p>
            </FormItem>
          )}
        />

        <div className="flex gap-2">
          <Button
            type="submit"
            className="flex-1"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
          >
            {isSubmitting ? 'Обновление...' : 'Обновить токен'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              form.reset()
            }}
            disabled={isSubmitting}
          >
            Очистить
          </Button>
        </div>
      </form>
    </Form>
  )
}

