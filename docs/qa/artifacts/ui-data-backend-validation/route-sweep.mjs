import { chromium } from 'playwright'
import fs from 'node:fs/promises'
import path from 'node:path'

const baseURL = process.env.E2E_BASE_URL || 'http://localhost:3100'
const outDir = 'docs/qa/artifacts/ui-data-backend-validation'
const routes = [
  '/dashboard',
  '/analytics/dashboard',
  '/analytics/orders',
  '/analytics/funnel',
  '/analytics/advertising',
  '/analytics/buyout',
  '/analytics/returns',
  '/analytics/search',
  '/analytics/sku',
  '/analytics/storage',
  '/analytics/unit-economics',
  '/analytics/supply-planning',
  '/cogs',
  '/cogs/price-calculator',
  '/cogs/bulk',
  '/orders/list',
  '/orders/integrity',
  '/supplies',
  '/shipments',
  '/settings',
  '/settings/notifications',
  '/settings/backfill',
  '/settings/cabinet',
  '/settings/expenses',
  '/settings/tax',
  '/settings/tariffs',
]
const badTextPatterns = [/\bNaN\b/, /\bundefined\b/i, /\bInfinity\b/, /Invalid Date/i, /\[object Object\]/]
const apiResponses = []
const results = []

await fs.mkdir(outDir, { recursive: true })
const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({ storageState: 'e2e/.auth/user.json', viewport: { width: 1440, height: 1000 } })

async function auditRoute(route) {
  const page = await context.newPage()
  const consoleMessages = []
  const pageErrors = []
  const failedRequests = []
  const responses = []
  page.on('console', msg => {
    if (['error', 'warning'].includes(msg.type())) consoleMessages.push({ type: msg.type(), text: msg.text().slice(0, 1000) })
  })
  page.on('pageerror', err => pageErrors.push(String(err.message || err).slice(0, 1000)))
  page.on('requestfailed', req => failedRequests.push({ method: req.method(), url: req.url(), failure: req.failure()?.errorText }))
  page.on('response', resp => {
    const url = resp.url()
    if (url.includes('/v1/')) {
      const entry = { route, method: resp.request().method(), url, status: resp.status() }
      responses.push(entry)
      apiResponses.push(entry)
    }
  })
  const url = baseURL + route
  let navStatus = null
  let finalUrl = null
  let screenshot = null
  try {
    const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 })
    navStatus = resp?.status() ?? null
    await page.waitForTimeout(1600)
    finalUrl = page.url()
    const metrics = await page.evaluate((patterns) => {
      const text = document.body?.innerText || ''
      return {
        title: document.title,
        textSample: text.slice(0, 500),
        mainCount: document.querySelectorAll('main').length,
        h1Texts: Array.from(document.querySelectorAll('h1')).map(e => e.textContent?.trim()).filter(Boolean),
        suspiciousText: patterns.filter(p => new RegExp(p.source, p.flags).test(text)).map(p => p.source),
        bodyLength: text.length,
        visibleButtons: Array.from(document.querySelectorAll('button')).filter(b => b.offsetParent !== null).slice(0, 12).map(b => b.textContent?.trim()).filter(Boolean),
      }
    }, badTextPatterns.map(re => ({ source: re.source, flags: re.flags })))
    const failedApi = responses.filter(r => r.status >= 400)
    const severeConsole = consoleMessages.filter(m => m.type === 'error' || /hydration|duplicate key|failed|error/i.test(m.text))
    const problem = pageErrors.length || failedRequests.length || failedApi.length || severeConsole.length || metrics.suspiciousText.length || metrics.mainCount !== 1 || metrics.h1Texts.length !== 1 || metrics.bodyLength < 100
    if (problem) {
      const safe = route.replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '') || 'root'
      screenshot = `${outDir}/route-${safe}.png`
      await page.screenshot({ path: screenshot, fullPage: true })
    }
    results.push({ route, url, finalUrl, navStatus, ...metrics, consoleMessages, pageErrors, failedRequests, apiResponses: responses, failedApi, screenshot, status: problem ? 'problem' : 'ok' })
  } catch (e) {
    screenshot = `${outDir}/route-${route.replace(/[^a-z0-9]+/gi, '_') || 'root'}-exception.png`
    try { await page.screenshot({ path: screenshot, fullPage: true }) } catch {}
    results.push({ route, url, finalUrl, navStatus, status: 'exception', error: String(e.message || e), consoleMessages, pageErrors, failedRequests, apiResponses: responses, screenshot })
  } finally {
    await page.close()
  }
}

for (const route of routes) await auditRoute(route)

// Unauthenticated protected-route smoke
const unauth = await browser.newContext({ storageState: { cookies: [], origins: [] } })
const page = await unauth.newPage()
await page.goto(baseURL + '/dashboard', { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(800)
results.push({ route: '[unauth]/dashboard', url: baseURL + '/dashboard', finalUrl: page.url(), status: page.url().includes('/login') ? 'ok' : 'problem', note: 'Unauthenticated protected route should redirect to login' })
await unauth.close()
await context.close()
await browser.close()

const uniqueApi = Array.from(new Map(apiResponses.map(r => [`${r.method} ${r.url} ${r.status}`, r])).values())
await fs.writeFile(path.join(outDir, 'route-sweep.json'), JSON.stringify({ generatedAt: new Date().toISOString(), baseURL, results, apiResponses: uniqueApi }, null, 2))
const md = ['# Route Sweep Summary', '', `Generated: ${new Date().toISOString()}`, '', '| Route | Status | Final URL | main | h1 | Failed API | Console warn/error | Suspicious | Screenshot |', '|---|---:|---|---:|---|---:|---:|---|---|']
for (const r of results) {
  md.push(`| ${r.route} | ${r.status} | ${r.finalUrl || ''} | ${r.mainCount ?? ''} | ${(r.h1Texts || []).join('<br>')} | ${(r.failedApi || []).length} | ${(r.consoleMessages || []).length} | ${(r.suspiciousText || []).join(', ')} | ${r.screenshot ? path.basename(r.screenshot) : ''} |`)
}
await fs.writeFile(path.join(outDir, 'route-sweep.md'), md.join('\n'))
console.log(JSON.stringify({ total: results.length, problems: results.filter(r => r.status !== 'ok').length, apiResponses: uniqueApi.length }, null, 2))
