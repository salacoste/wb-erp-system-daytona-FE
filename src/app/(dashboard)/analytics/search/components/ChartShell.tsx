/**
 * ChartShell — shared card shell for loading / empty / no-selection states.
 * Extracted from PositionHistoryChart.tsx for 200-line ESLint cap compliance.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function ChartShell({
  title,
  className,
  children,
}: {
  title: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}
