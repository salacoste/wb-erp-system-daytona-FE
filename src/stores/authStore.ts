import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { User } from '@/types/auth'
import { setAuthCookie, removeAuthCookie } from '@/lib/utils'

// Storage key for cross-tab communication
const STORAGE_KEY = 'auth-storage'
const STORAGE_EVENT_KEY = 'auth-storage-event'

/**
 * Backend ↔ frontend role-case bridge.
 *
 * Backend `UserRole` enum (src/auth/interfaces/jwt-payload.interface.ts) emits
 * lowercase values: `'owner' | 'manager' | 'analyst' | 'service'`. The frontend
 * `User` type and every `user.role === 'Owner'` comparison expects capitalized
 * variants. Normalizing here keeps the rest of the codebase ignorant of this
 * mismatch — single source of truth, backend can change case freely.
 *
 * The mapping is intentionally exhaustive so an unexpected backend value (e.g.
 * 'admin') falls through unchanged and surfaces as a clear runtime mismatch in
 * any role-gated feature, instead of being silently coerced.
 */
const ROLE_CASE_MAP: Record<string, User['role']> = {
  owner: 'Owner',
  manager: 'Manager',
  analyst: 'Analyst',
  service: 'Service',
}

function normalizeUser(user: User): User {
  const incoming = user.role as unknown as string
  const canonical = ROLE_CASE_MAP[incoming.toLowerCase()] ?? user.role
  if (canonical === user.role) return user
  return { ...user, role: canonical }
}

interface AuthState {
  // State
  user: User | null
  token: string | null
  cabinetId: string | null
  isAuthenticated: boolean

  // Actions
  setUser: (user: User) => void
  setToken: (token: string) => void
  setCabinetId: (cabinetId: string | null) => void
  login: (user: User, token: string, cabinetId?: string | null) => void
  refreshToken: (token: string, user?: User) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    set => ({
      // Initial state
      user: null,
      token: null,
      cabinetId: null,
      isAuthenticated: false,

      // Actions
      // All entry points run the user object through normalizeUser so role
      // case is canonicalized once at the boundary; downstream consumers can
      // safely compare against `'Owner'` etc.
      setUser: user => set({ user: normalizeUser(user), isAuthenticated: true }),

      setToken: token => set({ token }),

      setCabinetId: cabinetId => set({ cabinetId }),

      login: (user, token, cabinetId = null) => {
        const normalized = normalizeUser(user)
        set({
          user: normalized,
          token,
          cabinetId: cabinetId || normalized.cabinet_ids?.[0] || null,
          isAuthenticated: true,
        })
        // Set cookie for middleware to read (middleware runs on server and can't access localStorage)
        setAuthCookie(token, 24) // 24 hours, same as JWT expiration
      },

      refreshToken: (token, user) => {
        const normalized = user ? normalizeUser(user) : undefined
        set(state => ({
          token,
          user: normalized || state.user, // Keep existing user if not provided
          isAuthenticated: true,
          // Keep existing cabinetId if user not provided
          cabinetId: normalized?.cabinet_ids?.[0] || state.cabinetId,
        }))
        // Update cookie with new token so middleware can verify it
        setAuthCookie(token, 24) // 24 hours, same as JWT expiration
      },

      logout: () => {
        set({
          user: null,
          token: null,
          cabinetId: null,
          isAuthenticated: false,
        })
        // Remove auth cookie so middleware knows user is logged out
        removeAuthCookie()
        // Trigger storage event for cross-tab sync
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(STORAGE_EVENT_KEY, Date.now().toString())
          window.localStorage.removeItem(STORAGE_EVENT_KEY)
        }
      },
    }),
    {
      name: STORAGE_KEY, // localStorage key
      storage: createJSONStorage(() => localStorage),
      // Only persist token and user, not isAuthenticated (computed)
      partialize: state => ({
        user: state.user,
        token: state.token,
        cabinetId: state.cabinetId,
      }),
      // Listen to storage events for cross-tab sync
      onRehydrateStorage: () => state => {
        if (typeof window !== 'undefined' && state) {
          // Restore isAuthenticated flag if token exists after rehydration
          // This is needed because isAuthenticated is not persisted (it's computed)
          if (state.token && state.user) {
            state.isAuthenticated = true
            // Normalize role case from any stale localStorage data written
            // before the bridge existed (e.g. existing logged-in sessions).
            state.user = normalizeUser(state.user)
          }

          // Sync cookie with token from localStorage on page load/reload
          // This ensures middleware can verify authentication even after page refresh
          if (state.token) {
            setAuthCookie(state.token, 24)
          }

          // Listen for storage events from other tabs
          const handleStorageChange = (e: StorageEvent) => {
            if (e.key === STORAGE_EVENT_KEY) {
              // Another tab triggered logout, sync this tab
              if (!e.newValue) {
                useAuthStore.getState().logout()
              }
            }
            if (e.key === STORAGE_KEY && e.newValue) {
              // Another tab updated auth, sync this tab
              try {
                const newState = JSON.parse(e.newValue)
                if (newState.state) {
                  // Normalize the user role coming from a peer tab — same
                  // boundary contract as setUser/login above.
                  const synced = newState.state.user
                    ? { ...newState.state, user: normalizeUser(newState.state.user) }
                    : newState.state
                  useAuthStore.setState(synced)
                  // Sync cookie when auth state changes from another tab
                  if (newState.state.token) {
                    setAuthCookie(newState.state.token, 24)
                  }
                }
              } catch {
                // Ignore parse errors
              }
            }
          }

          window.addEventListener('storage', handleStorageChange)

          // Cleanup on unmount (if needed)
          return () => {
            window.removeEventListener('storage', handleStorageChange)
          }
        }
      },
    }
  )
)

// Set up cross-tab sync listener
if (typeof window !== 'undefined') {
  window.addEventListener('storage', e => {
    if (e.key === STORAGE_EVENT_KEY && !e.newValue) {
      // Logout event from another tab
      useAuthStore.getState().logout()
    }
  })
}
