'use client'

import { useEffect, useState } from 'react'
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
import { canManageOperationalData } from '@/lib/role-permissions'
import { useAuthStore } from '@/stores/authStore'
import { useCabinetTaxSettings, useUpdateTaxSettings } from '@/hooks/useCabinetTaxSettings'

const cabinetFormSchema = z.object({
  name: z
    .string()
    .min(2, 'Название должно содержать минимум 2 символа')
    .max(100, 'Название не должно превышать 100 символов'),
  targetMarginPct: z
    .string()
    .trim()
    .min(1, 'Укажите целевую маржу')
    .refine(value => Number.isFinite(Number(value)), 'Введите корректное число')
    .refine(value => {
      const parsed = Number(value)
      return Number.isFinite(parsed) && parsed >= 0 && parsed <= 100
    }, 'Целевая маржа должна быть от 0 до 100%'),
})

type CabinetFormData = z.infer<typeof cabinetFormSchema>

/**
 * Cabinet creation form component
 * Handles cabinet creation with automatic JWT token refresh
 */
export function CabinetCreationForm() {
  const router = useRouter()
  const userRole = useAuthStore(state => state.user?.role)
  const activeCabinetId = useAuthStore(state => state.cabinetId)
  const canCreateCabinet = canManageOperationalData(userRole)
  const [pendingMarginRetry, setPendingMarginRetry] = useState(false)
  const existingCabinet = useCabinetTaxSettings(activeCabinetId ?? '')
  const updateExistingCabinet = useUpdateTaxSettings(activeCabinetId ?? '')
  const form = useForm<CabinetFormData>({
    resolver: zodResolver(cabinetFormSchema),
    defaultValues: {
      name: '',
      targetMarginPct: '20',
    },
    mode: 'onBlur',
  })

  useEffect(() => {
    if (!existingCabinet.data || pendingMarginRetry) return
    form.reset({
      name: existingCabinet.data.name,
      targetMarginPct:
        existingCabinet.data.targetMarginPct != null
          ? String(existingCabinet.data.targetMarginPct)
          : '20',
    })
  }, [existingCabinet.data, form, pendingMarginRetry])

  const createMutation = useMutation({
    mutationFn: (data: CabinetFormData) =>
      handleCreateCabinet(data.name, Number(data.targetMarginPct)).catch((error: unknown) => {
        if (error instanceof Error && error.message.toLowerCase().includes('target margin')) {
          setPendingMarginRetry(true)
        }
        throw error
      }),
    onSuccess: result => {
      // Story 167.9: only an `applied` settlement belongs to the live session;
      // stale/indeterminate must not toast/navigate/reset (no error UI either).
      if (result.status !== 'applied' || !result.cabinet) return
      setPendingMarginRetry(false)
      toast.success(`Кабинет "${result.cabinet.name}" успешно создан!`)
      // Navigate to next onboarding step (WB token input)
      router.push(ROUTES.ONBOARDING.WB_TOKEN)
    },
    onError: (error: Error) => {
      const errorMessage = error.message.toLowerCase()
      if (errorMessage.includes('token') || errorMessage.includes('refresh')) {
        toast.error(
          'Кабинет создан, но произошла ошибка обновления токена. Пожалуйста, обновите страницу или войдите снова.'
        )
      } else if (errorMessage.includes('target margin')) {
        setPendingMarginRetry(true)
        toast.error(
          'Кабинет создан, но целевая маржа не сохранилась. Исправьте ошибку и повторите попытку.'
        )
      } else {
        toast.error(error.message || 'Ошибка создания кабинета. Попробуйте еще раз.')
      }
    },
  })

  const onSubmit = (data: CabinetFormData) => {
    if (!canCreateCabinet) return
    if (activeCabinetId) {
      updateExistingCabinet.mutate(
        { targetMarginPct: Number(data.targetMarginPct) },
        {
          onSuccess: updatedCabinet => {
            setPendingMarginRetry(false)
            form.reset({
              name: updatedCabinet.name || data.name,
              targetMarginPct:
                updatedCabinet.targetMarginPct != null
                  ? String(updatedCabinet.targetMarginPct)
                  : '20',
            })
            toast.success('Целевая маржа сохранена')
            router.push(ROUTES.ONBOARDING.WB_TOKEN)
          },
          onError: () => {
            setPendingMarginRetry(true)
            toast.error('Не удалось сохранить целевую маржу. Повторите попытку.')
          },
        }
      )
      return
    }
    createMutation.mutate(data)
  }

  const isHydratingExistingCabinet =
    Boolean(activeCabinetId) && existingCabinet.isLoading && !pendingMarginRetry
  const isSubmitting = createMutation.isPending || updateExistingCabinet.isPending

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
                  disabled={isSubmitting || Boolean(activeCabinetId)}
                  aria-required="true"
                  aria-invalid={!!form.formState.errors.name}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="targetMarginPct"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Целевая маржа, % <span aria-label="required">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  inputMode="decimal"
                  disabled={isSubmitting}
                  aria-required="true"
                  aria-invalid={!!form.formState.errors.targetMarginPct}
                />
              </FormControl>
              <p className="text-xs text-muted-foreground">
                Предлагаемое начальное значение — 20%. Оно сохранится только после создания
                кабинета.
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full"
          disabled={isSubmitting || isHydratingExistingCabinet || !canCreateCabinet}
          aria-busy={isSubmitting}
        >
          {isSubmitting
            ? activeCabinetId
              ? 'Сохранение...'
              : 'Создание...'
            : activeCabinetId
              ? 'Сохранить и продолжить'
              : 'Создать кабинет'}
        </Button>
      </form>
    </Form>
  )
}
