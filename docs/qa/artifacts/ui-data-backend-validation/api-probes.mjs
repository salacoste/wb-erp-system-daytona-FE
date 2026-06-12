import fs from 'node:fs/promises'
const out = 'docs/qa/artifacts/ui-data-backend-validation/api-probes.json'
const auth = JSON.parse(await fs.readFile('e2e/.auth/user.json','utf8'))
const entry = auth.origins?.[0]?.localStorage?.find(e => e.name === 'auth-storage')
const parsed = JSON.parse(entry.value)
const token = parsed.state?.token
const cabinetId = parsed.state?.cabinetId
const base = process.env.E2E_API_URL || 'http://localhost:3000'
const commonHeaders = { Authorization: `Bearer ${token}`, 'X-Cabinet-Id': cabinetId }
const endpoints = [
  ['/v1/health', {}],
  ['/v1/cabinets', commonHeaders],
  [`/v1/cabinets/${cabinetId}/seller-info`, commonHeaders],
  [`/v1/cabinets/${cabinetId}/token-status`, commonHeaders],
  ['/v1/imports/historical?limit=5', commonHeaders],
  ['/v1/analytics/funnel?from=2026-05-14&to=2026-06-12&groupBy=product&limit=10000&offset=0', commonHeaders],
  ['/v1/analytics/funnel?from=2026-05-14&to=2026-06-12&groupBy=product&limit=500&offset=0', commonHeaders],
  ['/v1/analytics/advertising?from=2026-05-29&to=2026-06-11&view_by=sku&group_by=sku&sort_by=spend&sort_order=desc&limit=25&offset=0&include_daily=true', commonHeaders],
  ['/v1/analytics/advertising/campaigns', commonHeaders],
  ['/v1/analytics/sku-financials', commonHeaders],
  ['/v1/analytics/storage/by-sku?weekStart=2026-W20&weekEnd=2026-W23', commonHeaders],
  ['/v1/analytics/unit-economics', commonHeaders],
  ['/v1/analytics/supply-planning', commonHeaders],
  ['/v1/products?limit=10&offset=0', commonHeaders],
]
const results=[]
for (const [path, headers] of endpoints) {
  const started=Date.now()
  let bodyText='', json=null, sample=null
  try {
    const resp=await fetch(base+path,{headers})
    bodyText=await resp.text()
    try { json=JSON.parse(bodyText) } catch {}
    if (json && typeof json==='object') {
      if (Array.isArray(json)) sample={kind:'array', length:json.length, firstKeys:Object.keys(json[0]||{}).slice(0,12)}
      else sample={kind:'object', keys:Object.keys(json).slice(0,20), dataLength:Array.isArray(json.data)?json.data.length:undefined, itemsLength:Array.isArray(json.items)?json.items.length:undefined, error:json.error}
    } else sample={kind:'text', text:bodyText.slice(0,200)}
    results.push({path,status:resp.status,ok:resp.ok,durationMs:Date.now()-started,sample})
  } catch(e) {
    results.push({path,status:null,ok:false,durationMs:Date.now()-started,error:String(e.message||e)})
  }
}
await fs.writeFile(out, JSON.stringify({generatedAt:new Date().toISOString(), cabinetId, results}, null, 2))
for (const r of results) console.log(`${r.status ?? 'ERR'} ${r.path} ${r.ok?'OK':'FAIL'} ${r.sample?.error?.message || ''}`)
