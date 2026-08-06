/**
 * Atomic storageState writer — eliminates the partial-write window that caused
 * the storageState ENOENT race under `--workers=1 --repeat-each=2`.
 *
 * Playwright's `context.storageState({ path })` writes the file in-place via
 * `writeFileSync`, so a concurrent reader (another run's lazy `newContext()`
 * read of the same storageState path) can observe a missing or half-written
 * file. Writing to a temp file then `rename`-ing is an atomic replace on the
 * same volume, so readers either see the previous complete file or the new one
 * — never an intermediate state. The temp name embeds pid + timestamp so
 * concurrent runs don't collide on the temp file itself.
 *
 * See `scripts/e2e-preflight.mjs` (auth-rm removal) for the companion fix.
 */
import { rename, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import type { BrowserContext } from '@playwright/test'

/**
 * Persist the given context's storage state to `filePath` atomically.
 *
 * @param context Playwright BrowserContext whose cookies/origins to capture.
 * @param filePath Destination auth-state file (e.g. `e2e/.auth/user.json`).
 */
export async function atomicWriteStorageState(
  context: BrowserContext,
  filePath: string
): Promise<void> {
  const state = await context.storageState()
  const tmp = join(dirname(filePath), `.${process.pid}.${Date.now()}.auth.tmp`)
  await writeFile(tmp, JSON.stringify(state), 'utf8')
  await rename(tmp, filePath)
}
