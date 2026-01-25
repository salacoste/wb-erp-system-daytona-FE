/**
 * localStorage Polyfill for MSW v2
 *
 * MSW v2 uses localStorage for cookie storage and requires it to be available
 * before any MSW imports. This polyfill ensures localStorage is properly defined
 * in the jsdom test environment.
 *
 * This file MUST be listed BEFORE setup.ts in vitest.config.ts setupFiles.
 */

// Check if localStorage already exists and works properly
const hasWorkingLocalStorage = (() => {
  try {
    if (typeof localStorage !== 'undefined' && typeof localStorage.getItem === 'function') {
      return true
    }
  } catch {
    // localStorage is not available
  }
  return false
})()

if (!hasWorkingLocalStorage) {
  // Create a localStorage polyfill
  const store: Record<string, string> = {}

  const localStoragePolyfill = {
    getItem(key: string): string | null {
      return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null
    },
    setItem(key: string, value: string): void {
      store[key] = String(value)
    },
    removeItem(key: string): void {
      delete store[key]
    },
    clear(): void {
      Object.keys(store).forEach((key) => delete store[key])
    },
    get length(): number {
      return Object.keys(store).length
    },
    key(index: number): string | null {
      const keys = Object.keys(store)
      return index >= 0 && index < keys.length ? keys[index] : null
    },
  }

  // Define localStorage on globalThis
  Object.defineProperty(globalThis, 'localStorage', {
    value: localStoragePolyfill,
    writable: true,
    configurable: true,
  })
}
