import { Suspense } from 'react'
import { LoginForm } from '@/components/custom/LoginForm'

/**
 * Login page
 * Allows users to authenticate with email and password
 */
export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg">
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
          Войти в аккаунт
        </h2>
        <Suspense fallback={<div>Загрузка...</div>}>
        <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}

