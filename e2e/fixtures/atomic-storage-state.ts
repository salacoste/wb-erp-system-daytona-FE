/**
 * Atomic storageState writer — eliminates the partial-write window that caused
 * the storageState ENOENT race under `--workers=1 --repeat-each=2`.
 *
 * Playwright's `context.storageState({ path })` writes the file in-place via
 * `writeFileSync`, so a concurrent reader (another run's lazy `newContext()`
 * read of the same storageState path) can observe a missing or half-written
 * file. Writing to a temp file then `rename`-ing is an atomic replace on the
 * same volume, so readers either see the previous complete file or the new one
 * — never an intermediate state. The temp name embeds a random UUID + timestamp so
 * concurrent runs don't collide on the temp file itself.
 *
 * See `scripts/e2e-preflight.mjs` (auth-rm removal) for the companion fix.
 */
import { randomUUID } from 'node:crypto'
import { rename, unlink, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import type { BrowserContext } from '@playwright/test'

/**
 * Persist an already-captured storage state to `filePath` atomically.
 *
 * Writes `JSON.stringify(state)` to a temp file (`.${uuid}.${ts}.auth.tmp` in
 * the same directory, so the `rename` is same-volume → atomic replace), then
 * renames it over the destination. Readers either see the previous complete
 * file or the new one — never a missing or half-written file. The temp name
 * embeds a random UUID + timestamp so concurrent runs don't collide on the temp itself.
 *
 * This is the low-level primitive used by the network guard's privileged
 * storageState handler, which is the only layer trusted to read the REAL
 * context state (test code never receives it — the guard returns an empty
 * stub and atomically writes the allowed file internally).
 *
 * @param state The captured storage state (cookies/origins) to persist.
 * @param filePath Destination auth-state file (e.g. `e2e/.auth/user.json`).
 */
export async function atomicWriteStorageStateFile(filePath: string, state: unknown): Promise<void> {
  // randomUUID (not process.pid) so the file stays compliant with the
  // static-transport boundary (src/test/playwright-static-boundary), which
  // forbids `process.*` (except .env) in e2e sources. UUID + ts stays unique
  // across concurrent runs without a process reference.
  const tmp = join(dirname(filePath), `.${randomUUID().slice(0, 8)}.${Date.now()}.auth.tmp`)
  await writeFile(tmp, JSON.stringify(state), 'utf8')
  try {
    await rename(tmp, filePath)
  } catch (error) {
    // Never strand an orphan temp in e2e/.auth/ if the atomic rename fails.
    await unlink(tmp).catch(() => {})
    throw error
  }
}

/**
 * Back-compat wrapper: capture `context.storageState()` then atomically write
 * it. NOTE: callers must NOT be inside the network guard's proxied surface —
 * `context.storageState()` here is a zero-arg read, which the guard denies.
 * The guard itself calls `atomicWriteStorageStateFile` directly with the
 * privileged in-place read; auth setups now use the standard
 * `context.storageState({ path })` API which the guard routes to the atomic
 * write. Kept for any future unguarded caller.
 *
 * @param context Playwright BrowserContext whose cookies/origins to capture.
 * @param filePath Destination auth-state file (e.g. `e2e/.auth/user.json`).
 */
export async function atomicWriteStorageState(
  context: BrowserContext,
  filePath: string
): Promise<void> {
  const state = await context.storageState()
  await atomicWriteStorageStateFile(filePath, state)
}
