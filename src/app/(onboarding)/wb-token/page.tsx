'use client'

import { WbTokenForm } from '@/components/custom/WbTokenForm'
import { PageHeader } from '@/components/product'
import { Card, CardContent } from '@/components/ui/card'
import { useOnboardingGuard } from '@/hooks/useOnboardingGuard'

/**
 * WB Token input page for onboarding flow
 * Story 2.2: WB Token Input & Validation
 * Story 167.7: shadcn migration — PageHeader composition + main landmark + Card primitive
 */
export default function WbTokenPage() {
  useOnboardingGuard()
  return (
    <main className="container mx-auto w-full max-w-md px-4 py-8 sm:py-12">
      <div className="space-y-6">
        <PageHeader
          title="Ввод WB API токена"
          className="text-center [&_[data-slot=page-header-identity]]:items-center [&_[data-slot=page-header-context]]:justify-center"
          context={
            <p className="text-muted-foreground">
              Шаг 2 из 3: Введите ваш Wildberries API токен для доступа к данным
            </p>
          }
        />

        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <WbTokenForm />
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
