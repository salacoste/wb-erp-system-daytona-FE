import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { User } from '@/types/auth'
import { setAuthCookie, removeAuthCookie } from '@/lib/utils'
import { normalizeUser, STORAGE_KEY, STORAGE_EVENT_KEY } from './authStoreHelpers'

function getBrowserLocalStorage(): Storage {
  if (typeof window === 'undefined') {
    throw new Error('localStorage is unavailable during server rendering')
  }

  return window.localStorage
}

interface AuthState {
  // State
  user: User | null
  token: string | null
  cabinetId: string | null
  isAuthenticated: boolean
  /**
   * Story 167.9: unique identity of the current login session. Regenerated on
   * every login() call so a re-login by the same account is a NEW session;
   * persisted with auth state so reloads keep the same session identity.
   * Null for sessions persisted before this field existed (settlement then
   * resolves to `indeterminate`).
   */
  sessionNonce: string | null

  // Actions
  setUser: (user: User) => void
  setToken: (token: string) => void
  setCabinetId: (cabinetId: string | null) => void
  login: (user: User, token: string, cabinetId?: string | null) => void
  refreshToken: (token: string, user?: User) => void
  logout: () => void
  /**
   * D-1 (PB-1): mint a session nonce at cabinet-create INITIATION when the
   * authenticated session still lacks one (persisted before Story 167.9, or a
   * cross-tab storage sync that bypassed rehydration). Mirrors the Story 167.9
   * review-fix HIGH-2 rehydrate mint (onRehydrateStorage) — together they close
   * the nonce-less-session class. Never mints for an unauthenticated store.
   */
  ensureSessionNonce: () => string | null
}

function createSessionNonce(): string {
  return crypto.randomUUID()
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      token: null,
      cabinetId: null,
      isAuthenticated: false,
      sessionNonce: null,

      // Actions — normalize role case at the boundary
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
          sessionNonce: createSessionNonce(),
        })
        setAuthCookie(token, 24)
      },

      refreshToken: (token, user) => {
        const normalized = user ? normalizeUser(user) : undefined
        set(state => ({
          token,
          user: normalized || state.user,
          isAuthenticated: true,
          cabinetId: normalized?.cabinet_ids?.[0] || state.cabinetId,
        }))
        setAuthCookie(token, 24)
      },

      logout: () => {
        set({
          user: null,
          token: null,
          cabinetId: null,
          isAuthenticated: false,
          sessionNonce: null,
        })
        removeAuthCookie()
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(STORAGE_EVENT_KEY, Date.now().toString())
          window.localStorage.removeItem(STORAGE_EVENT_KEY)
        }
      },

      // D-1 (PB-1): idempotent initiation mint — returns the current nonce,
      // minting one only for an authenticated nonce-less session (see interface
      // doc). Logged-out state returns null unchanged.
      ensureSessionNonce: () => {
        const { sessionNonce, token, user } = get()
        if (!token || !user) return null
        if (sessionNonce) return sessionNonce
        const minted = createSessionNonce()
        set({ sessionNonce: minted })
        return minted
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => getBrowserLocalStorage()),
      partialize: state => ({
        user: state.user,
        token: state.token,
        cabinetId: state.cabinetId,
        sessionNonce: state.sessionNonce,
      }),
      onRehydrateStorage: () => state => {
        if (typeof window !== 'undefined' && state) {
          if (state.token && state.user) {
            state.isAuthenticated = true
            state.user = normalizeUser(state.user)

            // Story 167.9 (review fix HIGH-2): sessions persisted before
            // sessionNonce existed rehydrate without a nonce — the first cabinet
            // create post-deploy would then settle `indeterminate` (server-side
            // success, no commits, no UI). Mint a nonce here so every SUBSEQUENT
            // initiation carries one. A create that was already in flight at
            // deploy time stays indeterminate: the initiating capture is
            // immutable — acceptable, documented fail-safe.
            if (!state.sessionNonce) {
              useAuthStore.setState({ sessionNonce: createSessionNonce() })
            }
          }

          if (state.token) {
            setAuthCookie(state.token, 24)
          }

          const handleStorageChange = (e: StorageEvent) => {
            if (e.key === STORAGE_EVENT_KEY && !e.newValue) {
              useAuthStore.getState().logout()
            }
            if (e.key === STORAGE_KEY && e.newValue) {
              try {
                const newState = JSON.parse(e.newValue)
                if (newState.state) {
                  const synced = newState.state.user
                    ? { ...newState.state, user: normalizeUser(newState.state.user) }
                    : newState.state
                  useAuthStore.setState(synced)
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
      useAuthStore.getState().logout()
    }
  })
}
