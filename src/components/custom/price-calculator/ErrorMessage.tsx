'use client'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertCircle, ExternalLink } from 'lucide-react'
import { useCallback } from 'react'
import { ApiError } from '@/types/api'

/**
 * Props for ErrorMessage component
 */
export interface ErrorMessageProps {
  /** Error object from API call */
  error: Error | null
  /** Callback for retry action */
  onRetry?: () => void
}

/** Type for error action with link */
type LinkAction = { label: string; href: string; onClick?: never }

/** Type for error action with button */
type ButtonAction = { label: string; onClick: true; href?: never }

/** Union type for error actions */
type ErrorAction = LinkAction | ButtonAction

/**
 * Error configuration type
 */
interface ErrorConfig {
  title: string
  message: string
  action?: ErrorAction
  variant: 'warning' | 'destructive'
  icon: React.ComponentType<{ className?: string }>
}

/**
 * Error configuration mapping
 * Maps HTTP status codes to user-friendly messages and actions
 */
const ERROR_CONFIG: Record<number, ErrorConfig> = {
  400: {
    title: 'Invalid input',
    message: 'Please check your input values and try again.',
    variant: 'warning',
    icon: AlertCircle,
  },
  401: {
    title: 'Not authenticated',
    message: 'Please log in to use the Price Calculator.',
    action: { label: 'Go to Login', href: '/login' },
    variant: 'destructive',
    icon: AlertCircle,
  },
  403: {
    title: 'Cabinet access denied',
    message: 'Please select a valid cabinet to continue.',
    action: { label: 'Select Cabinet', href: '/cabinets' },
    variant: 'destructive',
    icon: AlertCircle,
  },
  429: {
    title: 'Too many requests',
    message: 'Please wait a moment before trying again.',
    variant: 'warning',
    icon: AlertCircle,
  },
  0: {
    title: 'Connection error',
    message: 'Could not reach the server. Please check your connection.',
    action: { label: 'Retry', onClick: true },
    variant: 'destructive',
    icon: AlertCircle,
  },
}

/**
 * Displays error messages with appropriate actions
 * Handles validation, auth, network, and rate limit errors
 *
 * Story 44.5-FE: Real-time Calculation & UX Enhancements
 *
 * @example
 * <ErrorMessage
 *   error={error}
 *   onRetry={() => mutate(requestData)}
 * />
 */
export function ErrorMessage({ error, onRetry }: ErrorMessageProps) {
  // Extract status code from ApiError
  const getStatusCode = useCallback((err: Error): number => {
    // Check if it's an ApiError instance (has status property)
    if (err instanceof ApiError) {
      return err.status
    }
    // Fallback for plain Error objects with status property
    if ('status' in err && typeof err.status === 'number') {
      return err.status
    }
    return 0 // Network error
  }, [])

  // Get error configuration based on status code
  const getErrorConfig = useCallback((err: Error) => {
    const status = getStatusCode(err)
    return ERROR_CONFIG[status as keyof typeof ERROR_CONFIG] || ERROR_CONFIG[0]
  }, [getStatusCode])

  if (!error) {
    return null
  }

  const config = getErrorConfig(error)
  const Icon = config.icon

  return (
    <Alert variant={config.variant} role="alert" aria-live="polite">
      <Icon className="h-4 w-4" />
      <AlertTitle>{config.title}</AlertTitle>
      <AlertDescription className="space-y-2">
        <p>{config.message}</p>

        {/* Action button */}
        {config.action && (
          <div className="flex items-center gap-2 mt-2">
            {'onClick' in config.action ? (
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="h-7"
              >
                {config.action.label}
              </Button>
            ) : (
              <a
                href={config.action.href}
                className="inline-flex items-center gap-1 text-sm underline hover:no-underline"
              >
                {config.action.label}
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        )}

        {/* Error details for debugging */}
        {process.env.NODE_ENV === 'development' && (
          <details className="text-xs mt-2">
            <summary className="cursor-pointer opacity-70 hover:opacity-100">
              Technical details
            </summary>
            <pre className="mt-2 p-2 bg-black/5 rounded overflow-x-auto">
              {error.message}
            </pre>
          </details>
        )}
      </AlertDescription>
    </Alert>
  )
}
