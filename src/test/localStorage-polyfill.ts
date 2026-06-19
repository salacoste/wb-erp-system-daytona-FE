/**
 * localStorage Polyfill for MSW v2
 *
 * MSW v2 uses localStorage for cookie storage and requires it to be available
 * before any MSW imports. This polyfill ensures localStorage is properly defined
 * in the jsdom test environment.
 *
 * This file MUST be listed BEFORE setup.ts in vitest.config.ts setupFiles.
 *
 * Important: do not probe `localStorage` or `window.localStorage` before
 * defining this polyfill. Recent Node versions expose an experimental
 * globalThis.localStorage getter that emits a `--localstorage-file` warning
 * when no backing file is configured. Installing a deterministic test storage
 * avoids that warning and keeps test isolation explicit.
 */

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
    Object.keys(store).forEach(key => delete store[key])
  },
  get length(): number {
    return Object.keys(store).length
  },
  key(index: number): string | null {
    const keys = Object.keys(store)
    return index >= 0 && index < keys.length ? keys[index] : null
  },
}

Object.defineProperty(globalThis, 'localStorage', {
  value: localStoragePolyfill,
  writable: true,
  configurable: true,
})

if (globalThis.window) {
  Object.defineProperty(globalThis.window, 'localStorage', {
    value: localStoragePolyfill,
    writable: true,
    configurable: true,
  })
}
