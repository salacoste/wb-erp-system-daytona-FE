import { redirect } from 'next/navigation'

/**
 * Redirect /cogs/single → /cogs
 *
 * The single-COGS assignment UI lives on the root /cogs page.
 * Dashboard components (CostsCard, SalesCogsMetricCard, OrdersCogsMetricCard)
 * link to ROUTES.COGS.SINGLE — this redirect prevents a 404.
 */
export default function CogsSinglePage() {
  redirect('/cogs')
}
