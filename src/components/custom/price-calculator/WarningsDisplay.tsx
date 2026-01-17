'use client'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import type { PriceCalculatorResponse } from '@/types/price-calculator'

/**
 * Props for WarningsDisplay component
 */
export interface WarningsDisplayProps {
  /** Calculation result from API */
  data: PriceCalculatorResponse
}

/**
 * Displays backend warning messages if any exist
 *
 * @example
 * <WarningsDisplay data={result} />
 */
export function WarningsDisplay({ data }: WarningsDisplayProps) {
  if (!data.warnings || data.warnings.length === 0) {
    return null
  }

  return (
    <Alert variant="warning">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        <p className="font-medium">Warnings:</p>
        <ul className="list-disc list-inside space-y-1 ml-4">
          {data.warnings.map((warning, index) => (
            <li key={index}>{warning}</li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  )
}
