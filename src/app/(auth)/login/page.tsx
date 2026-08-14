import { Suspense } from 'react'
import { LoginForm } from '@/components/custom/LoginForm'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

/**
 * Login page
 * Allows users to authenticate with email and password
 */
export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/50 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Войти в аккаунт</h1>
        </CardHeader>
        <CardContent className="max-w-md">
          <Suspense
            fallback={
              <p role="status" className="text-center text-sm text-muted-foreground">
                Подготавливаем форму входа…
              </p>
            }
          >
            <LoginForm />
          </Suspense>
        </CardContent>
      </Card>
    </main>
  )
}
