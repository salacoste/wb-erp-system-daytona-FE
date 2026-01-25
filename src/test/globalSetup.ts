/**
 * Vitest Global Setup
 *
 * Runs BEFORE any tests or setup files are loaded.
 * Used to set up global mocks like localStorage for MSW v2.
 */

export function setup() {
  // Mock localStorage globally for MSW v2 cookie store
  const store: Record<string, string> = {}
  ;(globalThis as any).localStorage = {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      Object.keys(store).forEach((k) => delete store[k])
    },
    get length() {
      return Object.keys(store).length
    },
    key: (index: number) => Object.keys(store)[index] ?? null,
  }
}
