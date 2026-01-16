'use client'

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
import { handleCreateCabinet } from '@/services/cabinets.service'
import { ROUTES } from '@/lib/routes'

const cabinetFormSchema = z.object({
  name: z
    .string()
    .min(2, 'Название должно содержать минимум 2 символа')
    .max(100, 'Название не должно превышать 100 символов'),
})

type CabinetFormData = z.infer<typeof cabinetFormSchema>

/**
 * Cabinet creation form component
 * Handles cabinet creation with automatic JWT token refresh
 */
export function CabinetCreationForm() {
  const router = useRouter()
  const form = useForm<CabinetFormData>({
    resolver: zodResolver(cabinetFormSchema),
    defaultValues: {
      name: '',
    },
    mode: 'onBlur',
  })

  const mutation = useMutation({
    mutationFn: async (data: CabinetFormData) => {
      return await handleCreateCabinet(data.name)
    },
    onSuccess: (result) => {
      toast.success(`Кабинет "${result.cabinet.name}" успешно создан!`)
      // Navigate to next onboarding step (WB token input)
      router.push(ROUTES.ONBOARDING.WB_TOKEN)
    },
    onError: (error: Error) => {
      const errorMessage = error.message.toLowerCase()
      if (
        errorMessage.includes('token') ||
        errorMessage.includes('refresh')
      ) {
        toast.error(
          'Кабинет создан, но произошла ошибка обновления токена. Пожалуйста, обновите страницу или войдите снова.',
        )
      } else {
        toast.error(
          error.message || 'Ошибка создания кабинета. Попробуйте еще раз.',
        )
      }
    },
  })

  const onSubmit = (data: CabinetFormData) => {
    mutation.mutate(data)
  }

  const isSubmitting = mutation.isPending

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Название кабинета <span aria-label="required">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="text"
                  placeholder="Введите название кабинета"
                  disabled={isSubmitting}
                  aria-required="true"
                  aria-invalid={!!form.formState.errors.name}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full"
          disabled={isSubmitting}
          aria-busy={isSubmitting}
        >
          {isSubmitting ? 'Создание...' : 'Создать кабинет'}
        </Button>
      </form>
    </Form>
  )
}

