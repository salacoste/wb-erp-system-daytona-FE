'use client'

import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'

/**
 * Status icon for processing tasks
 * Story 2.3: Data Processing Status Indicators
 */
export function getStatusIcon(taskStatus: string): React.ReactNode {
  if (taskStatus === 'completed') {
    // Story 167.6: semantic status-success token instead of hardcoded green
    return <CheckCircle2 className="h-5 w-5 text-status-success" />
  }
  if (taskStatus === 'failed') {
    return <AlertCircle className="h-5 w-5 text-destructive" />
  }
  return <Loader2 className="h-5 w-5 text-primary animate-spin" />
}

/**
 * Status text for processing tasks
 * Story 2.3: Data Processing Status Indicators
 */
export function getStatusText(taskStatus: string, taskName: string): string {
  if (taskStatus === 'completed') {
    return `${taskName} завершено`
  }
  if (taskStatus === 'failed') {
    return `${taskName} завершилось с ошибкой`
  }
  if (taskStatus === 'in_progress') {
    return `${taskName} выполняется...`
  }
  return `${taskName} ожидает начала...`
}
