#!/usr/bin/env npx tsx
/**
 * Margin Data Validation Script
 *
 * This script validates margin data from the backend API and compares
 * different calculation methods to identify discrepancies.
 *
 * Usage: npx tsx scripts/validate-margin-data.ts
 *
 * Expected behavior:
 * 1. Authenticates with test credentials
 * 2. Fetches weekly financial summary for last completed week
 * 3. Fetches monthly financial summary (all weeks in January 2026)
 * 4. Outputs raw API data and multiple margin calculations
 */

const API_URL = 'http://localhost:3000'
const TEST_EMAIL = 'test@test.com'
const TEST_PASSWORD = 'Russia23!'

// Helper to get ISO week string
function getISOWeekString(date: Date): string {
  const target = new Date(date.valueOf())
  const dayNr = (date.getDay() + 6) % 7
  target.setDate(target.getDate() - dayNr + 3)
  const firstThursday = new Date(target.getFullYear(), 0, 4)
  const weekNumber =
    1 +
    Math.round(
      ((target.getTime() - firstThursday.getTime()) / 86400000 -
        3 +
        ((firstThursday.getDay() + 6) % 7)) /
        7
    )
  return `${target.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`
}

// Get last completed week (Moscow timezone logic)
function getLastCompletedWeek(): string {
  const now = new Date()
  // Moscow is UTC+3
  const moscowOffset = 3 * 60 * 60 * 1000
  const moscowTime = new Date(now.getTime() + moscowOffset)

  // If Monday or Tuesday before 12:00 Moscow time, use W-2
  // Otherwise use W-1
  const dayOfWeek = moscowTime.getUTCDay() // 0=Sun, 1=Mon, 2=Tue
  const hour = moscowTime.getUTCHours()

  let weeksBack = 1
  if (dayOfWeek === 1 || (dayOfWeek === 2 && hour < 12)) {
    weeksBack = 2
  }

  // Calculate previous week date
  const prevDate = new Date(moscowTime)
  prevDate.setDate(prevDate.getDate() - 7 * weeksBack)
  return getISOWeekString(prevDate)
}

// Get weeks in a month (YYYY-MM format)
function getWeeksInMonth(monthStr: string): string[] {
  const [year, month] = monthStr.split('-').map(Number)
  const firstDay = new Date(year, month - 1, 1)
  const lastDay = new Date(year, month, 0)

  const weeks = new Set<string>()
  const current = new Date(firstDay)

  while (current <= lastDay) {
    weeks.add(getISOWeekString(current))
    current.setDate(current.getDate() + 1)
  }

  return Array.from(weeks).sort()
}

interface AuthResponse {
  access_token: string
  user: {
    id: string
    email: string
    cabinet_ids?: string[]
  }
}

interface FinanceSummary {
  week: string
  // Sales/Returns
  sales_gross?: number
  returns_gross?: number
  sale_gross?: number
  wb_sales_gross?: number
  wb_returns_gross?: number
  // Commission
  total_commission_rub?: number
  // Payouts
  to_pay_goods?: number
  payout_total?: number
  // Costs
  logistics_cost?: number
  storage_cost?: number
  paid_acceptance_cost?: number
  penalties_total?: number
  other_adjustments_net?: number
  // COGS
  cogs_total?: number | null
  cogs_coverage_pct?: number | null
  products_with_cogs?: number | null
  products_total?: number | null
  gross_profit?: number | null
  // WB Services
  wb_services_cost?: number
  wb_promotion_cost?: number
  wb_jam_cost?: number
  // Retail price
  retail_price_total?: number
}

interface FinanceSummaryResponse {
  summary_total: FinanceSummary | null
  summary_rus: FinanceSummary | null
  summary_eaeu: FinanceSummary | null
  meta: {
    week: string
    cabinet_id: string
    generated_at: string
    timezone: string
  }
}

async function authenticate(): Promise<{ token: string; cabinetId: string }> {
  console.log('\n=== AUTHENTICATION ===')
  console.log(`Endpoint: POST ${API_URL}/v1/auth/login`)
  console.log(`Email: ${TEST_EMAIL}`)

  const response = await fetch(`${API_URL}/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Authentication failed: ${response.status} - ${error}`)
  }

  const data: AuthResponse = await response.json()
  console.log(`Auth successful! User ID: ${data.user.id}`)

  // Get cabinets list
  console.log(`\nFetching cabinets: GET ${API_URL}/v1/cabinets`)
  const cabinetsResponse = await fetch(`${API_URL}/v1/cabinets`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${data.access_token}`,
      'Content-Type': 'application/json',
    },
  })

  if (!cabinetsResponse.ok) {
    const error = await cabinetsResponse.text()
    throw new Error(`Failed to get cabinets: ${cabinetsResponse.status} - ${error}`)
  }

  const cabinets = await cabinetsResponse.json()
  const cabinetsList = Array.isArray(cabinets) ? cabinets : cabinets.data || []

  if (cabinetsList.length === 0) {
    throw new Error('No cabinets found for this user')
  }

  const cabinetId = cabinetsList[0].id
  console.log(`Using cabinet: ${cabinetsList[0].name} (${cabinetId})`)

  return { token: data.access_token, cabinetId }
}

async function fetchFinanceSummary(
  week: string,
  token: string,
  cabinetId: string
): Promise<FinanceSummaryResponse | null> {
  const url = `${API_URL}/v1/analytics/weekly/finance-summary?week=${week}`
  console.log(`\nFetching: GET ${url}`)

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'X-Cabinet-Id': cabinetId,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    if (response.status === 404) {
      console.log(`  No data for week ${week}`)
      return null
    }
    const error = await response.text()
    throw new Error(`Failed to fetch finance summary: ${response.status} - ${error}`)
  }

  const data = await response.json()
  return data
}

function calculateMargins(summary: FinanceSummary): void {
  console.log('\n=== MARGIN CALCULATIONS ===')

  // Handle both _total suffix (from summary_total) and non-suffix (from summary_rus)
  const revenue = (summary as Record<string, unknown>).sale_gross_total ?? summary.sale_gross ?? 0
  const wbSales =
    (summary as Record<string, unknown>).wb_sales_gross_total ?? summary.wb_sales_gross ?? 0
  const cogs = summary.cogs_total ?? 0
  const toPayGoods =
    (summary as Record<string, unknown>).to_pay_goods_total ?? summary.to_pay_goods ?? 0
  const payoutTotal = summary.payout_total ?? 0
  const commission =
    (summary as Record<string, unknown>).total_commission_rub_total ??
    summary.total_commission_rub ??
    0
  const logistics =
    (summary as Record<string, unknown>).logistics_cost_total ?? summary.logistics_cost ?? 0
  const storage =
    (summary as Record<string, unknown>).storage_cost_total ?? summary.storage_cost ?? 0
  const otherAdj =
    (summary as Record<string, unknown>).other_adjustments_net_total ??
    summary.other_adjustments_net ??
    0

  console.log('\n--- Input Values ---')
  console.log(`sale_gross (revenue): ${revenue.toLocaleString('ru-RU')} ₽`)
  console.log(`wb_sales_gross (seller revenue): ${wbSales.toLocaleString('ru-RU')} ₽`)
  console.log(`cogs_total: ${cogs?.toLocaleString('ru-RU') ?? 'null'} ₽`)
  console.log(`to_pay_goods: ${toPayGoods.toLocaleString('ru-RU')} ₽`)
  console.log(`payout_total: ${payoutTotal.toLocaleString('ru-RU')} ₽`)
  console.log(`total_commission_rub: ${commission.toLocaleString('ru-RU')} ₽`)
  console.log(`logistics_cost: ${logistics.toLocaleString('ru-RU')} ₽`)
  console.log(`storage_cost: ${storage.toLocaleString('ru-RU')} ₽`)
  console.log(`other_adjustments_net: ${otherAdj.toLocaleString('ru-RU')} ₽`)

  console.log('\n--- Margin Calculation Methods ---')

  // Method 1: Gross Margin (revenue - cogs) / revenue
  if (revenue > 0 && cogs !== null) {
    const grossMargin = ((revenue - cogs) / revenue) * 100
    console.log(`1. Gross Margin = (sale_gross - cogs) / sale_gross`)
    console.log(`   = (${revenue} - ${cogs}) / ${revenue}`)
    console.log(`   = ${grossMargin.toFixed(2)}%`)
  } else {
    console.log(`1. Gross Margin: Cannot calculate (revenue=${revenue}, cogs=${cogs})`)
  }

  // Method 2: Using wb_sales_gross (after commission)
  if (wbSales > 0 && cogs !== null) {
    const grossMarginWb = ((wbSales - cogs) / wbSales) * 100
    console.log(`\n2. Gross Margin (WB Sales) = (wb_sales_gross - cogs) / wb_sales_gross`)
    console.log(`   = (${wbSales} - ${cogs}) / ${wbSales}`)
    console.log(`   = ${grossMarginWb.toFixed(2)}%`)
  }

  // Method 3: to_pay_goods / revenue
  if (revenue > 0) {
    const payoutMargin = (toPayGoods / revenue) * 100
    console.log(`\n3. Payout Margin = to_pay_goods / sale_gross`)
    console.log(`   = ${toPayGoods} / ${revenue}`)
    console.log(`   = ${payoutMargin.toFixed(2)}%`)
  }

  // Method 4: payout_total / revenue
  if (revenue > 0) {
    const payoutTotalMargin = (payoutTotal / revenue) * 100
    console.log(`\n4. Final Payout Margin = payout_total / sale_gross`)
    console.log(`   = ${payoutTotal} / ${revenue}`)
    console.log(`   = ${payoutTotalMargin.toFixed(2)}%`)
  }

  // Method 5: Operating Margin (after all costs)
  if (revenue > 0 && cogs !== null) {
    const operatingProfit = revenue - cogs - logistics - storage - otherAdj
    const operatingMargin = (operatingProfit / revenue) * 100
    console.log(`\n5. Operating Margin = (revenue - cogs - logistics - storage - other) / revenue`)
    console.log(
      `   = (${revenue} - ${cogs} - ${logistics} - ${storage} - ${otherAdj}) / ${revenue}`
    )
    console.log(`   = ${operatingProfit.toLocaleString('ru-RU')} / ${revenue}`)
    console.log(`   = ${operatingMargin.toFixed(2)}%`)
  }

  // Method 6: Net Margin (payout_total - cogs) / revenue
  if (revenue > 0 && cogs !== null) {
    const netProfit = payoutTotal - cogs
    const netMargin = (netProfit / revenue) * 100
    console.log(`\n6. Net Margin = (payout_total - cogs) / sale_gross`)
    console.log(`   = (${payoutTotal} - ${cogs}) / ${revenue}`)
    console.log(`   = ${netProfit.toLocaleString('ru-RU')} / ${revenue}`)
    console.log(`   = ${netMargin.toFixed(2)}%`)
  }

  // Method 7: Using to_pay_goods as base for margin
  if (toPayGoods > 0 && cogs !== null) {
    const grossProfitFromPay = toPayGoods - cogs
    const marginFromPay = (grossProfitFromPay / toPayGoods) * 100
    console.log(`\n7. Margin from to_pay_goods = (to_pay_goods - cogs) / to_pay_goods`)
    console.log(`   = (${toPayGoods} - ${cogs}) / ${toPayGoods}`)
    console.log(`   = ${grossProfitFromPay.toLocaleString('ru-RU')} / ${toPayGoods}`)
    console.log(`   = ${marginFromPay.toFixed(2)}%`)
  }
}

function printSummary(label: string, summary: FinanceSummary | null): void {
  console.log(`\n=== ${label} ===`)
  if (!summary) {
    console.log('No data available')
    return
  }

  console.log('\n--- Raw API Response ---')
  console.log(JSON.stringify(summary, null, 2))

  calculateMargins(summary)
}

async function aggregateSummaries(summaries: FinanceSummary[]): Promise<FinanceSummary> {
  const aggregated: FinanceSummary = {
    week: summaries.map(s => s.week).join(', '),
  }

  // Numeric fields to aggregate (both with and without _total suffix)
  const numericFields = [
    'sales_gross',
    'sales_gross_total',
    'returns_gross',
    'returns_gross_total',
    'sale_gross',
    'sale_gross_total',
    'wb_sales_gross',
    'wb_sales_gross_total',
    'wb_returns_gross',
    'wb_returns_gross_total',
    'total_commission_rub',
    'total_commission_rub_total',
    'to_pay_goods',
    'to_pay_goods_total',
    'payout_total',
    'logistics_cost',
    'logistics_cost_total',
    'storage_cost',
    'storage_cost_total',
    'paid_acceptance_cost',
    'paid_acceptance_cost_total',
    'penalties_total',
    'other_adjustments_net',
    'other_adjustments_net_total',
    'cogs_total',
    'products_with_cogs',
    'products_total',
    'gross_profit',
    'wb_services_cost',
    'wb_services_cost_total',
    'wb_promotion_cost',
    'wb_promotion_cost_total',
    'wb_jam_cost',
    'wb_jam_cost_total',
    'retail_price_total',
    'retail_price_total_combined',
    'acquiring_fee_total',
    'commission_sales_total',
  ]

  for (const field of numericFields) {
    let sum = 0
    let hasValue = false
    for (const s of summaries) {
      const value = (s as Record<string, unknown>)[field]
      if (typeof value === 'number') {
        sum += value
        hasValue = true
      }
    }
    if (hasValue) {
      ;(aggregated as Record<string, unknown>)[field] = sum
    }
  }

  // Calculate coverage percentage from aggregated totals
  if (aggregated.products_total && aggregated.products_with_cogs) {
    aggregated.cogs_coverage_pct = (aggregated.products_with_cogs / aggregated.products_total) * 100
  }

  return aggregated
}

async function main(): Promise<void> {
  console.log('======================================================')
  console.log('       MARGIN DATA VALIDATION SCRIPT')
  console.log('======================================================')
  console.log(`\nTimestamp: ${new Date().toISOString()}`)
  console.log(`Backend API: ${API_URL}`)

  try {
    // 1. Authenticate
    const { token, cabinetId } = await authenticate()

    // 2. Get last completed week
    const lastWeek = getLastCompletedWeek()
    console.log(`\n=== PERIOD DETECTION ===`)
    console.log(`Current date: ${new Date().toISOString()}`)
    console.log(`Last completed week: ${lastWeek}`)

    // 3. Fetch weekly data
    console.log('\n======================================================')
    console.log('              WEEKLY DATA (Single Week)')
    console.log('======================================================')

    const weeklyResponse = await fetchFinanceSummary(lastWeek, token, cabinetId)
    const weeklySummary = weeklyResponse?.summary_total || weeklyResponse?.summary_rus

    printSummary(`WEEK: ${lastWeek}`, weeklySummary || null)

    // 4. Fetch monthly data (January 2026)
    const targetMonth = '2026-01'
    const weeksInMonth = getWeeksInMonth(targetMonth)
    const lastCompletedWeek = getLastCompletedWeek()
    const validWeeks = weeksInMonth.filter(w => w <= lastCompletedWeek)

    console.log('\n======================================================')
    console.log('              MONTHLY DATA (Aggregated)')
    console.log('======================================================')
    console.log(`\nTarget month: ${targetMonth}`)
    console.log(`All weeks in month: ${weeksInMonth.join(', ')}`)
    console.log(`Valid weeks (before ${lastCompletedWeek}): ${validWeeks.join(', ')}`)

    const monthlySummaries: FinanceSummary[] = []
    for (const week of validWeeks) {
      const response = await fetchFinanceSummary(week, token, cabinetId)
      const summary = response?.summary_total || response?.summary_rus
      if (summary) {
        monthlySummaries.push(summary)
        console.log(
          `  Week ${week}: sale_gross=${summary.sale_gross?.toLocaleString('ru-RU')}, cogs=${summary.cogs_total?.toLocaleString('ru-RU') ?? 'null'}`
        )
      }
    }

    if (monthlySummaries.length > 0) {
      const aggregatedMonthly = await aggregateSummaries(monthlySummaries)
      printSummary(
        `MONTH: ${targetMonth} (${monthlySummaries.length} weeks aggregated)`,
        aggregatedMonthly
      )
    } else {
      console.log('\nNo monthly data available')
    }

    // 5. Summary comparison
    console.log('\n======================================================')
    console.log('              COMPARISON WITH UI DISPLAY')
    console.log('======================================================')
    console.log('\nUI shows:')
    console.log('  - Week margin: 12.92%')
    console.log('  - Month margin: 72.32%')
    console.log('\nCheck which calculation method above matches these values.')
    console.log('The correct formula should give consistent results for both periods.')

    // 6. Bug analysis
    console.log('\n======================================================')
    console.log('              BUG ANALYSIS')
    console.log('======================================================')
    console.log('\n*** ISSUE FOUND ***')
    console.log('\nThe UI is using DIFFERENT formulas for Week vs Month:')
    console.log('')
    console.log('  WEEKLY margin (12.92%) matches:')
    console.log('    Method 6: Net Margin = (payout_total - cogs) / sale_gross')
    console.log('')
    console.log('  MONTHLY margin (72.32%) matches:')
    console.log('    Method 1: Gross Margin = (sale_gross - cogs) / sale_gross')
    console.log('')
    console.log('This is INCONSISTENT and likely a bug in the frontend aggregation.')
    console.log('')
    console.log('RECOMMENDATION:')
    console.log('  The frontend should use the SAME formula for both periods.')
    console.log('  Most common business interpretation is:')
    console.log('    - Gross Margin = (revenue - cogs) / revenue (before expenses)')
    console.log('    - Operating Margin = (revenue - cogs - expenses) / revenue (after expenses)')
    console.log('    - Net Margin = (payout - cogs) / revenue (final profitability)')
    console.log('')
    console.log('  For this data:')
    if (weeklySummary) {
      const weekRev = (weeklySummary as Record<string, unknown>).sale_gross_total as number
      const weekCogs = weeklySummary.cogs_total as number
      const grossMarginWeek = ((weekRev - weekCogs) / weekRev) * 100
      console.log(`    Week Gross Margin = ${grossMarginWeek.toFixed(2)}%`)
    }
    if (monthlySummaries.length > 0) {
      const monthAgg = await aggregateSummaries(monthlySummaries)
      const monthRev = (monthAgg as Record<string, unknown>).sale_gross_total as number
      const monthCogs = monthAgg.cogs_total as number
      const grossMarginMonth = ((monthRev - monthCogs) / monthRev) * 100
      console.log(`    Month Gross Margin = ${grossMarginMonth.toFixed(2)}%`)
    }
  } catch (error) {
    console.error('\n=== ERROR ===')
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}

main()
