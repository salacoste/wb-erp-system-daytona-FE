'use client'

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
import { loginUser } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import type { LoginRequest } from '@/types/auth'

interface LoginFormData {
  email: string
  password: string
}

/**
 * Login form component
 * Handles user authentication with email and password validation
 */
export function LoginForm() {
  const searchParams = useSearchParams()
  const { login } = useAuthStore()
  const form = useForm<LoginFormData>({
    defaultValues: {
      email: '',
      password: '',
    },
    mode: 'onBlur',
  })

  const mutation = useMutation({
    mutationFn: async (data: LoginRequest) => {
      return await loginUser(data)
    },
    onSuccess: (response) => {
      // Store user and token in auth store (localStorage)
      // login() also sets cookie automatically for middleware
      login(
        response.user,
        response.token,
        response.user.cabinet_ids?.[0] || null,
      )

      toast.success('Вход выполнен успешно!')

      // Redirect to specified page or default to dashboard
      const redirectTo = searchParams.get('redirect') || '/dashboard'
      // Ensure redirect is a safe path (prevent open redirects)
      const safeRedirect = redirectTo.startsWith('/') ? redirectTo : '/dashboard'

      // Use window.location for full page reload to ensure middleware can check auth state
      // Small delay to ensure token is saved to localStorage and cookie before navigation
      setTimeout(() => {
        window.location.href = safeRedirect
      }, 100)
    },
    onError: (_error: Error) => {
      // Generic error message for security
      toast.error('Неверный email или пароль')
    },
  })

  const onSubmit = (data: LoginFormData) => {
    mutation.mutate(data)
  }

  const isSubmitting = mutation.isPending

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                  type="email"
                  placeholder="example@email.com"
                  autoComplete="email"
                  disabled={isSubmitting}
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
          rules={{
            required: 'Пароль обязателен',
          }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Пароль <span aria-label="required">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="password"
                  placeholder="Введите пароль"
                  autoComplete="current-password"
                  disabled={isSubmitting}
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
          className="w-full"
          disabled={isSubmitting}
          aria-busy={isSubmitting}
        >
          {isSubmitting ? 'Вход...' : 'Войти'}
        </Button>
      </form>
    </Form>
  )
}

