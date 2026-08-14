import { RegistrationForm } from '@/components/custom/RegistrationForm'
import Link from 'next/link'

/**
 * Registration page
 * Displays registration form for new users
 */
export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/50 px-4 py-8 sm:px-6">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-card p-6 shadow-card sm:p-8">
        <div className="text-center">
          <h1 className="text-h1 text-foreground">Регистрация</h1>
          <p className="mt-2 text-body text-muted-foreground">
            Создайте аккаунт для доступа к системе
          </p>
        </div>

        <RegistrationForm />

        <div className="text-center text-sm">
          <span className="text-muted-foreground">Уже есть аккаунт? </span>
          <Link href="/login" className="font-medium text-primary hover:text-primary-dark">
            Войти
          </Link>
        </div>
      </div>
    </main>
  )
}
