'use client'

import { useForm } from 'react-hook-form'
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
import { registerUser } from '@/lib/api'
import type { RegisterRequest } from '@/types/auth'

interface RegistrationFormData {
  email: string
  password: string
}

/**
 * Registration form component
 * Handles user registration with email and password validation
 */
export function RegistrationForm() {
  const router = useRouter()
  const form = useForm<RegistrationFormData>({
    defaultValues: {
      email: '',
      password: '',
    },
    mode: 'onBlur',
  })

  const mutation = useMutation({
    mutationFn: async (data: RegisterRequest) => {
      return await registerUser(data)
    },
    onSuccess: () => {
      toast.success('Регистрация успешна! Пожалуйста, войдите.')
      router.push('/login')
    },
    onError: (error: Error) => {
      const errorMessage = error.message.toLowerCase()
      if (errorMessage.includes('duplicate') || errorMessage.includes('уже')) {
        toast.error('Этот email уже зарегистрирован. Пожалуйста, войдите.')
      } else if (errorMessage.includes('password') || errorMessage.includes('пароль')) {
        toast.error('Пароль не соответствует требованиям.')
      } else {
        toast.error('Ошибка регистрации. Попробуйте еще раз.')
      }
    },
  })

  const onSubmit = (data: RegistrationFormData) => {
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
            minLength: {
              value: 8,
              message: 'Пароль должен содержать минимум 8 символов',
            },
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
                  placeholder="Минимум 8 символов"
                  autoComplete="new-password"
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
          {isSubmitting ? 'Регистрация...' : 'Зарегистрироваться'}
        </Button>
      </form>
    </Form>
  )
}

