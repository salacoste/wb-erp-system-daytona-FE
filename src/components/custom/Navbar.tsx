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
    <div className="flex flex-1 items-center justify-between">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
      </div>

      <div className="flex items-center gap-4">
        {/* User Info */}
        {user && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700">
              {user.name || user.email}
            </span>
          </div>
        )}

        {/* Logout Button */}
        <LogoutButton />
      </div>
    </div>
  )
}

