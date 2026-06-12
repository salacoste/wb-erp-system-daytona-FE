import { chromium } from 'playwright'
const baseURL='http://localhost:3100'
const routes=['/dashboard','/analytics/storage']
const browser=await chromium.launch({headless:true})
const context=await browser.newContext({storageState:'e2e/.auth/user.json'})
for (const route of routes) {
  const page=await context.newPage()
  console.log('\n##', route)
  page.on('console', async msg => {
    if (!['error','warning'].includes(msg.type())) return
    const vals=[]
    for (const a of msg.args()) {
      try { vals.push(await a.jsonValue()) } catch { vals.push(String(a)) }
    }
    console.log(msg.type(), msg.text().slice(0,300), 'ARGS=', JSON.stringify(vals).slice(0,1000))
  })
  await page.goto(baseURL+route,{waitUntil:'domcontentloaded'})
  await page.waitForTimeout(3500)
  await page.close()
}
await browser.close()
