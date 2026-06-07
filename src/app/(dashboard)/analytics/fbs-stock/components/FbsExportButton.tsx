'use client'

/**
 * FBS Export Trigger Button — Epic 96-FE Story 96.12-FE
 *
 * Renders "Скачать CSV" button on the Fbs Stock page header.
 * On click: POST /v1/analytics/fbs/stock/export → poll status → auto-download on ready.
 *
 * All state management (polling, rate-limit countdown, cabinet-switch reset)
 * is delegated to useFbsExportButton hook.
 *
 * @see src/hooks/use-fbs-export-button.ts
 * @see CLAUDE.md § Defensive Frontend Principle
 */

import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useFbsExportButton } from '@/hooks/use-fbs-export-button'

export function FbsExportButton() {
  const { handleClick, disabled, label } = useFbsExportButton()

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={disabled}
      data-testid="fbs-export-button"
    >
      <Download className="h-4 w-4 mr-2" />
      {label}
    </Button>
  )
}
