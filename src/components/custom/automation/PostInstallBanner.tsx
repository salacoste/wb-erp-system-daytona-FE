/**
 * PostInstallBanner — post-install deep-link shown in the templates gallery
 * after a successful install (Story 163.2-FE). Links to the installed-rules
 * list with ?highlight=<ruleId> so the operator lands on the newly-installed
 * rule. Purely presentational.
 */
import Link from 'next/link'
import { ROUTES } from '@/lib/routes'

interface PostInstallBannerProps {
  /** id of the just-installed rule. */
  ruleId: string
}

export function PostInstallBanner({ ruleId }: PostInstallBannerProps) {
  return (
    <div
      className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-green-300 bg-green-50 p-3"
      data-testid="post-install-deeplink"
    >
      <p className="text-sm text-green-800">Шаблон установлен.</p>
      <Link
        href={`${ROUTES.AUTOMATION.INSTALLED_RULES}?highlight=${encodeURIComponent(ruleId)}`}
        className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        data-testid="open-installed-rules-link"
      >
        Открыть установленные правила
      </Link>
    </div>
  )
}
