'use client'

import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Loader2, Save, Target } from 'lucide-react'
import { toast } from 'sonner'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useCabinetTaxSettings, useUpdateTaxSettings } from '@/hooks/useCabinetTaxSettings'
import { canManageOperationalData } from '@/lib/role-permissions'
import { useAuthStore } from '@/stores/authStore'

const targetMarginSchema = z.object({
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

type TargetMarginFormData = z.infer<typeof targetMarginSchema>

export function TargetMarginSettingsCard({ cabinetId }: { cabinetId: string }) {
  return <TargetMarginSettingsCardContent key={cabinetId} cabinetId={cabinetId} />
}

function TargetMarginSettingsCardContent({ cabinetId }: { cabinetId: string }) {
  const { data, isLoading, isError } = useCabinetTaxSettings(cabinetId)
  const mutation = useUpdateTaxSettings(cabinetId)
  const userRole = useAuthStore(state => state.user?.role)
  const canManageTargetMargin = canManageOperationalData(userRole)
  const [saveOutcome, setSaveOutcome] = useState<string | null>(null)
  const form = useForm<TargetMarginFormData>({
    resolver: zodResolver(targetMarginSchema),
    defaultValues: { targetMarginPct: '20' },
    mode: 'onBlur',
  })

  useEffect(() => {
    if (!data) return
    form.reset({
      targetMarginPct: data.targetMarginPct != null ? String(data.targetMarginPct) : '20',
    })
  }, [data, form])

  const onSubmit = (values: TargetMarginFormData) => {
    setSaveOutcome(null)
    mutation.mutate(
      { targetMarginPct: Number(values.targetMarginPct) },
      {
        onSuccess: updatedCabinet => {
          form.reset({
            targetMarginPct:
              updatedCabinet.targetMarginPct != null
                ? String(updatedCabinet.targetMarginPct)
                : '20',
          })
          setSaveOutcome('Целевая маржа сохранена')
          toast.success('Целевая маржа сохранена')
        },
        onError: () => {
          setSaveOutcome('Не удалось сохранить целевую маржу')
          toast.error('Не удалось сохранить целевую маржу')
        },
      }
    )
  }

  if (isLoading) {
    return (
      <div role="status" aria-label="Загрузка целевой маржи" aria-busy="true">
        <span className="sr-only">Загружаем целевую маржу</span>
        <Skeleton className="h-52 w-full rounded-lg" />
      </div>
    )
  }
  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Не удалось загрузить целевую маржу.</AlertDescription>
      </Alert>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2 className="flex items-center gap-2 text-lg">
            <Target aria-hidden="true" className="h-5 w-5" />
            Целевая маржа
          </h2>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit, () => setSaveOutcome(null))}
            className="space-y-4"
            aria-busy={mutation.isPending || undefined}
          >
            <FormField
              control={form.control}
              name="targetMarginPct"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Целевая маржа, %</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      onChange={event => {
                        setSaveOutcome(null)
                        field.onChange(event)
                      }}
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      inputMode="decimal"
                      disabled={mutation.isPending || !canManageTargetMargin}
                    />
                  </FormControl>
                  <FormDescription>
                    Для кабинетов без сохранённого значения предлагается 20%. Изменение применяется
                    только после сохранения.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            {canManageTargetMargin ? (
              <div className="flex justify-end border-t pt-4">
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? (
                    <Loader2
                      aria-hidden="true"
                      className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none"
                    />
                  ) : (
                    <Save aria-hidden="true" className="mr-2 h-4 w-4" />
                  )}
                  Сохранить
                </Button>
              </div>
            ) : (
              <Alert role="note">
                <AlertDescription>
                  Целевая маржа доступна только для просмотра вашей роли.
                </AlertDescription>
              </Alert>
            )}
            <p
              role="status"
              aria-live="polite"
              aria-atomic="true"
              aria-label={
                mutation.isPending
                  ? 'Сохранение целевой маржи'
                  : 'Результат сохранения целевой маржи'
              }
              className="sr-only"
            >
              {mutation.isPending ? 'Сохраняем целевую маржу' : (saveOutcome ?? '')}
            </p>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
