'use client'

import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import { useSearchParams } from 'next/navigation'
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
import { Alert, AlertDescription } from '@/components/ui/alert'
import { loginUser } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import type { LoginRequest } from '@/types/auth'
import { ApiError } from '@/types/api'

const DEFAULT_DESTINATION = '/dashboard'
const REQUEST_FEEDBACK_ID = 'login-request-feedback'

function isSafeRedirect(redirect: string | null): redirect is string {
  if (!redirect?.startsWith('/') || redirect.startsWith('//')) return false

  try {
    const isUnsafePath =
      !redirect.startsWith('/') ||
      redirect.startsWith('//') ||
      redirect.includes('\\') ||
      /%(?![0-9a-f]{2}|$)/i.test(redirect) ||
      /[\u0000-\u001f\u007f\uFFFD]/.test(redirect)

    if (isUnsafePath) return false

    const parsedRedirect = new URL(redirect, 'https://local.invalid')
    return parsedRedirect.origin === 'https://local.invalid'
  } catch {
    return false
  }
}

interface LoginFormData {
  email: string
  password: string
}

interface LoginFormProps {
  navigate?: (href: string) => void
}

export function LoginForm({
  navigate = href => {
    window.location.href = href
  },
}: LoginFormProps) {
  const searchParams = useSearchParams()
  const { login } = useAuthStore()
  const [isHydrated, setIsHydrated] = useState(false)
  const [isSuccessPendingNavigation, setIsSuccessPendingNavigation] = useState(false)
  const [requestFeedback, setRequestFeedback] = useState<string | null>(null)
  const isSubmissionLocked = useRef(false)
  const passwordFocusFrame = useRef<number | null>(null)
  const form = useForm<LoginFormData>({
    defaultValues: {
      email: '',
      password: '',
    },
    mode: 'onBlur',
  })

  useEffect(() => setIsHydrated(true), [])
  useEffect(() => {
    if (isHydrated) form.setFocus('email')
  }, [form, isHydrated])

  useEffect(
    () => () => {
      if (passwordFocusFrame.current !== null)
        window.cancelAnimationFrame(passwordFocusFrame.current)
    },
    []
  )

  const redirect = searchParams.get('redirect')
  const isReauthentication = isSafeRedirect(redirect)
  const safeRedirect = isReauthentication ? redirect : DEFAULT_DESTINATION

  const mutation = useMutation({
    // Auth attempts must never retry automatically: retries duplicate credential submissions,
    // accelerate backend throttling, and can make E2E setup flaky after a single failed attempt.
    retry: false,
    mutationFn: (data: LoginRequest) => loginUser(data),
    onSuccess: response => {
      setIsSuccessPendingNavigation(true)
      login(response.user, response.token, response.user.cabinet_ids?.[0] || null)
      toast.success('Вход выполнен успешно!')
      // Use window.location for full page reload to ensure middleware can check auth state
      // Small delay to ensure token is saved to localStorage and cookie before navigation
      setTimeout(() => {
        navigate(safeRedirect)
      }, 100)
    },
    onError: (error: Error) => {
      const feedback =
        error instanceof ApiError && error.status === 401
          ? 'Неверный email или пароль'
          : 'Не удалось подключиться. Сервис временно недоступен, попробуйте ещё раз.'

      setRequestFeedback(feedback)
      form.resetField('password')
      // Restore focus after the Alert mounts and the password is re-enabled.
      passwordFocusFrame.current = window.requestAnimationFrame(() => {
        passwordFocusFrame.current = null
        form.setFocus('password')
      })
      isSubmissionLocked.current = false
    },
  })

  const onSubmit = (data: LoginFormData) => {
    if (isSubmissionLocked.current) return

    isSubmissionLocked.current = true
    if (passwordFocusFrame.current !== null) window.cancelAnimationFrame(passwordFocusFrame.current)
    passwordFocusFrame.current = null
    setRequestFeedback(null)
    mutation.mutate(data)
  }

  const controlsDisabled = !isHydrated || mutation.isPending || isSuccessPendingNavigation
  const isBusy = mutation.isPending || isSuccessPendingNavigation

  return (
    <Form {...form}>
      <form
        aria-label="Форма входа"
        aria-describedby={requestFeedback ? REQUEST_FEEDBACK_ID : undefined}
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4"
      >
        {isReauthentication && (
          <p className="text-sm text-muted-foreground">
            Сессия истекла. Войдите повторно, чтобы вернуться к работе.
          </p>
        )}

        {requestFeedback && (
          <Alert id={REQUEST_FEEDBACK_ID} variant="destructive">
            <AlertDescription>{requestFeedback}</AlertDescription>
          </Alert>
        )}

        <FormField
          control={form.control}
          name="email"
          rules={{
            required: 'Email обязателен',
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: 'Неверный формат email',
            },
          }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Email <span aria-label="required">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  className="min-h-11"
                  type="email"
                  placeholder="example@email.com"
                  autoComplete="email"
                  disabled={controlsDisabled}
                  aria-required="true"
                  aria-invalid={!!form.formState.errors.email}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          rules={{ required: 'Пароль обязателен' }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Пароль <span aria-label="required">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  className="min-h-11"
                  type="password"
                  placeholder="Введите пароль"
                  autoComplete="current-password"
                  disabled={controlsDisabled}
                  aria-required="true"
                  aria-invalid={!!form.formState.errors.password}
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
          aria-busy={isBusy}
        >
          {isBusy ? 'Вход...' : 'Войти'}
        </Button>
      </form>
    </Form>
  )
}
