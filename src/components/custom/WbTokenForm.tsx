'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
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
import { wbTokenFormSchema, getErrorMessage, type WbTokenFormData } from './wb-token-form-helpers'

/**
 * WB Token input form for onboarding flow
 * Story 2.2: WB Token Input & Validation
 * Automatically uses cabinetId from auth store
 */
export function WbTokenForm() {
  const router = useRouter()
  const { token, cabinetId } = useAuthStore()
  const [formError, setFormError] = useState<{
    title: string
    message: string
    showLink: boolean
  } | null>(null)

  const form = useForm<WbTokenFormData>({
    resolver: zodResolver(wbTokenFormSchema),
    defaultValues: { token: '' },
    mode: 'onBlur',
  })

  const handleTokenChange = (value: string, onChange: (value: string) => void) => {
    if (formError) setFormError(null)
    onChange(value)
  }

  const mutation = useMutation({
    mutationFn: async (data: WbTokenFormData) => {
      setFormError(null)
      if (!token) throw new Error('User not authenticated')
      if (!cabinetId) throw new Error('Cabinet ID not found. Please create a cabinet first.')
      return await updateWbToken(cabinetId, 'wb_api_token', data.token)
    },
    onSuccess: () => {
      toast.success('WB API токен успешно сохранен!')
      form.reset()
      setFormError(null)
      router.push(ROUTES.ONBOARDING.PROCESSING)
    },
    onError: (error: Error) => {
      const errorInfo = getErrorMessage(error)
      setFormError(errorInfo)
      toast.error(errorInfo.title)
    },
  })

  const onSubmit = (data: WbTokenFormData) => mutation.mutate(data)
  const isSubmitting = mutation.isPending

  if (!cabinetId) {
    return (
      <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
        <p className="text-sm text-destructive">
          Кабинет не найден. Пожалуйста, вернитесь к предыдущему шагу и создайте кабинет.
        </p>
      </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                  onChange={e => handleTokenChange(e.target.value, field.onChange)}
                  type="password"
                  placeholder="Введите ваш WB API токен"
                  disabled={isSubmitting}
                  aria-required="true"
                  aria-invalid={!!form.formState.errors.token || !!formError}
                />
              </FormControl>
              <FormMessage />
              <p className="text-sm text-muted-foreground">
                Введите ваш Wildberries API токен. Вы можете найти его в настройках вашего аккаунта
                продавца на{' '}
                <a
                  href="https://seller.wildberries.ru/supplier-settings/access-to-api"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  Wildberries Seller Portal
                </a>
                . После сохранения токена начнется автоматическая обработка ваших данных.
              </p>
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isSubmitting} aria-busy={isSubmitting}>
          {isSubmitting ? 'Проверка токена...' : 'Сохранить токен'}
        </Button>
      </form>
    </Form>
  )
}
