'use client'

import { WbTokenForm } from '@/components/custom/WbTokenForm'

/**
 * WB Token input page for onboarding flow
 * Story 2.2: WB Token Input & Validation
 */
export default function WbTokenPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Ввод WB API токена</h1>
          <p className="text-muted-foreground">
            Шаг 2 из 3: Введите ваш Wildberries API токен для доступа к данным
          </p>
        </div>

        <div className="bg-card rounded-lg border p-6 shadow-sm">
          <WbTokenForm />
        </div>
      </div>
    </div>
  )
}

