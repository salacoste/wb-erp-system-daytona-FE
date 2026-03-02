import { redirect } from 'next/navigation'
import { ROUTES } from '@/lib/routes'

// D-15: Redirect /analytics/summary to cabinet summary dashboard
export default function AnalyticsSummaryPage() {
  redirect(ROUTES.ANALYTICS.DASHBOARD)
}
