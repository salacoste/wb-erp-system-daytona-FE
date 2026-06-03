'use client'

import { useRouter } from 'next/navigation'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/lib/routes'
import { Info } from 'lucide-react'

/**
 * Terminal "nothing to import" state for onboarding /processing.
 * Rendered when no import batches enqueue within MAX_EMPTY_POLLS (~30s).
 *
 * Defensive Frontend Principle (Story 89.4-FE): the FE cannot distinguish
 * "already up to date" from "best-effort enqueue that never fired", so the copy
 * stays neutral ("возможно, данные уже актуальны") and does NOT assert up-to-date
 * as fact. No auto-redirect — manual CTA only.
 */
export function ProcessingNoData() {
  const router = useRouter()

  return (
    <Alert>
      <Info className="h-4 w-4" />
      <AlertTitle>Импорт не начался</AlertTitle>
      <AlertDescription>
        Импорт не начался за отведённое время. Возможно, данные уже актуальны — вы можете перейти к
        дашборду.
      </AlertDescription>
      <Button variant="outline" className="mt-4" onClick={() => router.push(ROUTES.DASHBOARD)}>
        Перейти к дашборду
      </Button>
    </Alert>
  )
}
