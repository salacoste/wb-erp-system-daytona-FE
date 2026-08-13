'use client'

import { useAuthStore } from '@/stores/authStore'
import { LogoutButton } from './LogoutButton'

/**
 * Top navbar component
 * Story 3.1: Main Dashboard Layout & Navigation
 */
export function Navbar() {
  const { user } = useAuthStore()

  return (
    <div className="flex min-w-0 flex-1 items-center justify-end min-[20rem]:justify-between">
      <div className="min-w-0 items-center gap-4">
        <div className="hidden text-xl font-semibold text-foreground min-[20rem]:block">
          Dashboard
        </div>
      </div>

      <div className="flex min-w-0 items-center gap-4">
        {/* User Info */}
        {user && (
          <div className="min-w-0 items-center gap-2">
            <span className="hidden max-w-full truncate text-sm text-muted-foreground sm:block">
              {user.name || user.email}
            </span>
          </div>
        )}

        {/* Logout Button */}
        <div className="shrink-0 [&_button]:min-h-11 [&_button]:min-w-11">
          <LogoutButton />
        </div>
      </div>
    </div>
  )
}
