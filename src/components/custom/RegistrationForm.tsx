'use client'

import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Form, FormControl, FormField } from '@/components/ui/form'
import { FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { registerUser } from '@/lib/api'
import { ApiError } from '@/types/api'

const VALIDATION_SUMMARY_ID = 'registration-validation-summary'
const REQUEST_FEEDBACK_ID = 'registration-request-feedback'
const EMAIL_PATTERN = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i
const PASSWORD_MIN_MESSAGE = 'Пароль должен содержать минимум 8 символов'
const REQUIRED_MARK = <span aria-label="required">*</span>
const isPasswordPolicyError = (error: Error) =>
  error instanceof ApiError &&
  Math.trunc(error.status / 100) === 4 &&
  /password|пароль/.test(error.message.toLowerCase())

type RequestFeedback = 'duplicate' | 'password' | 'service'

type RegistrationFormData = { email: string; password: string }

export function RegistrationForm() {
  const router = useRouter()
  const [isHydrated, setIsHydrated] = useState(false)
  const [requestFeedback, setRequestFeedback] = useState<RequestFeedback | null>(null)
  const [isSuccessPendingNavigation, setIsSuccessPendingNavigation] = useState(false)
  const isSubmissionLocked = useRef(false)
  const isTerminalLocked = useRef(false)
  const requestFeedbackRef = useRef<HTMLDivElement>(null)
  const form = useForm<RegistrationFormData>({
    defaultValues: { email: '', password: '' },
    mode: 'onBlur',
  })

  useEffect(() => setIsHydrated(true), [])
  useEffect(() => requestFeedbackRef.current?.focus(), [requestFeedback])

  const mutation = useMutation({
    retry: false,
    mutationFn: (data: RegistrationFormData) => registerUser(data),
    onSuccess: () => {
      isTerminalLocked.current = true
      setIsSuccessPendingNavigation(true)
      toast.success('Регистрация успешна! Пожалуйста, войдите.')
      router.push('/login')
    },
    onError: (error: Error) => {
      if (error instanceof ApiError && error.status === 409) {
        setRequestFeedback('duplicate')
        toast.error('Этот email уже зарегистрирован. Пожалуйста, войдите.')
      } else if (isPasswordPolicyError(error)) {
        setRequestFeedback('password')
        toast.error('Пароль не соответствует требованиям.')
      } else {
        setRequestFeedback('service')
        toast.error('Ошибка регистрации. Попробуйте еще раз.')
      }
      isSubmissionLocked.current = false
    },
  })

  const onSubmit = (data: RegistrationFormData) => {
    if (isSubmissionLocked.current || isTerminalLocked.current) return

    isSubmissionLocked.current = true
    setRequestFeedback(null)
    mutation.mutate(data)
  }

  const onInvalid = (errors: typeof form.formState.errors) =>
    form.setFocus(errors.email ? 'email' : 'password')

  const submitRegistration = form.handleSubmit(onSubmit, onInvalid)
  const hasMultipleValidationErrors =
    form.formState.submitCount > 0 && Object.keys(form.formState.errors).length > 1
  const controlsDisabled = !isHydrated || mutation.isPending || isSuccessPendingNavigation
  const describedBy = [
    hasMultipleValidationErrors ? VALIDATION_SUMMARY_ID : null,
    requestFeedback ? REQUEST_FEEDBACK_ID : null,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <Form {...form}>
      <form
        aria-label="Форма регистрации"
        aria-describedby={describedBy || undefined}
        onSubmit={submitRegistration}
        className="space-y-4"
      >
        {hasMultipleValidationErrors && (
          <div
            id={VALIDATION_SUMMARY_ID}
            role="alert"
            aria-label="Исправьте ошибки в форме"
            tabIndex={-1}
            className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
          >
            Исправьте ошибки в форме и повторите попытку.
          </div>
        )}

        {requestFeedback && (
          <div
            ref={requestFeedbackRef}
            id={REQUEST_FEEDBACK_ID}
            role="alert"
            tabIndex={-1}
            className="space-y-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
          >
            {requestFeedback === 'duplicate' ? (
              <>
                <p>Этот email уже зарегистрирован.</p>
                <Link href="/login" className="font-medium underline underline-offset-4">
                  Войти
                </Link>
              </>
            ) : requestFeedback === 'password' ? (
              <p>Пароль не соответствует требованиям.</p>
            ) : (
              <>
                <p>Сервис временно недоступен. Попробуйте еще раз.</p>
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11 min-w-11"
                  onClick={submitRegistration}
                >
                  Повторить
                </Button>
              </>
            )}
          </div>
        )}

        <FormField
          control={form.control}
          name="email"
          rules={{
            required: 'Email обязателен',
            pattern: { value: EMAIL_PATTERN, message: 'Неверный формат email' },
          }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email {REQUIRED_MARK}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  onChange={event => {
                    field.onChange(event)
                    if (requestFeedback === 'duplicate') setRequestFeedback(null)
                  }}
                  className="min-h-11 border-foreground/50"
                  type="email"
                  placeholder="example@email.com"
                  autoComplete="email"
                  disabled={controlsDisabled}
                  aria-required="true"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          rules={{
            required: 'Пароль обязателен',
            minLength: { value: 8, message: PASSWORD_MIN_MESSAGE },
          }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Пароль {REQUIRED_MARK}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  onChange={event => {
                    field.onChange(event)
                    if (requestFeedback === 'password') setRequestFeedback(null)
                  }}
                  className="min-h-11 border-foreground/50"
                  type="password"
                  placeholder="Минимум 8 символов"
                  autoComplete="new-password"
                  disabled={controlsDisabled}
                  aria-required="true"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="min-h-11 w-full"
          disabled={controlsDisabled}
          aria-busy={controlsDisabled && isHydrated}
        >
          {controlsDisabled && isHydrated ? 'Регистрация...' : 'Зарегистрироваться'}
        </Button>
      </form>
    </Form>
  )
}
