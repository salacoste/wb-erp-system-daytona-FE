'use client'

import { useEffect } from 'react'
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
  const { data, isLoading, isError } = useCabinetTaxSettings(cabinetId)
  const mutation = useUpdateTaxSettings(cabinetId)
  const userRole = useAuthStore(state => state.user?.role)
  const canManageTargetMargin = canManageOperationalData(userRole)
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
          toast.success('Целевая маржа сохранена')
        },
        onError: () => toast.error('Не удалось сохранить целевую маржу'),
      }
    )
  }

  if (isLoading) return <Skeleton className="h-52 w-full rounded-lg" />
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
        <CardTitle className="flex items-center gap-2 text-lg">
          <Target className="h-5 w-5" />
          Целевая маржа
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="targetMarginPct"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Целевая маржа, %</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      inputMode="decimal"
                      disabled={mutation.isPending || !canManageTargetMargin}
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    Для кабинетов без сохранённого значения предлагается 20%. Изменение применяется
                    только после сохранения.
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
            {canManageTargetMargin ? (
              <div className="flex justify-end border-t pt-4">
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Сохранить
                </Button>
              </div>
            ) : (
              <Alert>
                <AlertDescription>
                  Целевая маржа доступна только для просмотра вашей роли.
                </AlertDescription>
              </Alert>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
