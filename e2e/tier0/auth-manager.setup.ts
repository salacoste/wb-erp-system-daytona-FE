import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { test as setup, expect } from '../fixtures/tier0-runtime'

setup('create bound Tier-0 manager storage state', async ({ page }) => {
  const email = process.env.E2E_MANAGER_EMAIL
  const password = process.env.E2E_MANAGER_PASSWORD
  const storageStatePath = process.env.TIER0_MANAGER_STORAGE_STATE
  if (!email || !password || !storageStatePath) {
    throw new Error('Tier-0 manager authority and private storage-state path are required')
  }

  await page.goto('/login')
  await expect(page.locator('form')).toBeVisible()
  await page.locator('input[type="email"]').fill(email)
  await page.locator('input[type="password"]').fill(password)
  await page.locator('button[type="submit"]').click()
  await page.waitForURL(url => !url.pathname.includes('/login'))
  await expect(page.locator('main').first()).toBeVisible()

  await mkdir(path.dirname(storageStatePath), { recursive: true, mode: 0o700 })
  await page.context().storageState({ path: storageStatePath })
})
