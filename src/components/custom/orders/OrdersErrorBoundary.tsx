/**
 * Orders Error Boundary Component
 * Story 40.7-FE: Integration & Polish
 * Epic 40-FE: Orders UI & WB Native Status History
 *
 * Error boundary for the Orders module that catches rendering errors,
 * shows fallback UI with retry button, and logs errors to console.
 */

'use client'

import { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export interface OrdersErrorBoundaryProps {
  /** Child components to wrap */
  children: ReactNode
  /** Custom fallback UI (optional) */
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

/**
 * Error boundary for Orders module
 * Catches rendering errors and displays fallback UI with retry option
 */
export class OrdersErrorBoundary extends Component<OrdersErrorBoundaryProps, State> {
  constructor(props: OrdersErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error details in development mode
    if (process.env.NODE_ENV === 'development') {
      console.error('[Orders] Error caught by boundary:', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      })
    }
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null })
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <Card className="mx-auto mt-8 max-w-md" data-testid="orders-error-boundary">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-yellow-500" />
            <h3 className="mb-2 text-lg font-semibold">Произошла ошибка</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Не удалось загрузить страницу заказов. Попробуйте обновить страницу.
            </p>
            <Button onClick={this.handleRetry} variant="outline">
              <RefreshCcw className="mr-2 h-4 w-4" />
              Попробовать снова
            </Button>
          </CardContent>
        </Card>
      )
    }

    return this.props.children
  }
}
