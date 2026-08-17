import type { RefObject } from 'react'
import type { SubmitHandler, UseFormReturn } from 'react-hook-form'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
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

export interface CabinetFormData {
  name: string
  targetMarginPct: string
}

interface CabinetCreationFormPresentationProps {
  form: UseFormReturn<CabinetFormData>
  onSubmit: SubmitHandler<CabinetFormData>
  recoveryError: string | null
  recoveryErrorRef: RefObject<HTMLDivElement | null>
  isExistingCabinet: boolean
  isHydratingExistingCabinet: boolean
  isSubmitting: boolean
  canCreateCabinet: boolean
}

const RECOVERY_ERROR_ID = 'cabinet-creation-recovery-error'

export function CabinetCreationFormPresentation({
  form,
  onSubmit,
  recoveryError,
  recoveryErrorRef,
  isExistingCabinet,
  isHydratingExistingCabinet,
  isSubmitting,
  canCreateCabinet,
}: CabinetCreationFormPresentationProps) {
  return (
    <Form {...form}>
      <form
        aria-label="Форма создания кабинета"
        aria-describedby={recoveryError ? RECOVERY_ERROR_ID : undefined}
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4"
      >
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
                  disabled={isSubmitting || isExistingCabinet}
                  className="min-h-11"
                  aria-required="true"
                  aria-invalid={!!form.formState.errors.name}
                />
              </FormControl>
              <FormDescription className="sr-only">Введите название кабинета.</FormDescription>
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
                  className="min-h-11"
                  aria-required="true"
                  aria-invalid={!!form.formState.errors.targetMarginPct}
                />
              </FormControl>
              <FormDescription className="text-xs">
                Предлагаемое начальное значение — 20%. Оно сохранится только после создания
                кабинета.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {recoveryError && (
          <Alert ref={recoveryErrorRef} id={RECOVERY_ERROR_ID} variant="destructive" tabIndex={-1}>
            <AlertDescription>{recoveryError}</AlertDescription>
          </Alert>
        )}

        <Button
          type="submit"
          className="min-h-11 w-full"
          disabled={isSubmitting || isHydratingExistingCabinet || !canCreateCabinet}
          aria-busy={isSubmitting}
        >
          {isSubmitting
            ? isExistingCabinet
              ? 'Сохранение...'
              : 'Создание...'
            : isExistingCabinet
              ? 'Сохранить и продолжить'
              : 'Создать кабинет'}
        </Button>
      </form>
    </Form>
  )
}
