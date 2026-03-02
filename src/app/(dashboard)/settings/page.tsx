import { redirect } from 'next/navigation'
import { ROUTES } from '@/lib/routes'

// D-15: Redirect /settings to default sub-page
export default function SettingsPage() {
  redirect(ROUTES.SETTINGS.NOTIFICATIONS)
}
