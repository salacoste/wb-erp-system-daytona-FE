import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { User } from '@/types/auth'
import { setAuthCookie, removeAuthCookie } from '@/lib/utils'
import { normalizeUser, STORAGE_KEY, STORAGE_EVENT_KEY } from './authStoreHelpers'

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
        })
        removeAuthCookie()
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(STORAGE_EVENT_KEY, Date.now().toString())
          window.localStorage.removeItem(STORAGE_EVENT_KEY)
        }
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: state => ({
        user: state.user,
        token: state.token,
        cabinetId: state.cabinetId,
      }),
      onRehydrateStorage: () => state => {
        if (typeof window !== 'undefined' && state) {
          if (state.token && state.user) {
            state.isAuthenticated = true
            state.user = normalizeUser(state.user)
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
