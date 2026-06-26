# Spec — Persona-Based Dashboard Rework

> **Status: DRAFT — for approval. No code.** Grounded in the actual current dashboard
> (`src/app/(dashboard)/dashboard/components/DashboardContent.tsx` + `useDashboardData.ts`).
> Companion doc: [`readability-audit-spec.md`](./readability-audit-spec.md).
>
**Author intent:** this is a *direction* spec for sign-off, not an implementation plan. Approve the direction, then stories get specced/implemented in sequence.

---

## 1. Why now — the problem in one sentence

Every role sees the **same 26-section, ~31-card dashboard** with **no information hierarchy** — a single vertical dump where up to **8 conditional banners** stack before the first number, the profit chain is fragmented across **6 separate cards**, COGS coverage appears **3×**, and **~70–90 interactive elements** are scattered top-to-bottom. This directly violates the project's *own* documented design principles: **Progressive Disclosure** ("show high-level metrics first… don't overwhelm") and **Data-First hierarchy** ("clear visual hierarchy… immediately readable"). (`docs/front-end-spec.md:62-65`)

Today the **only** persona gate is `canManageOperationalData(userRole)` controlling whether **4 COGS buttons are clickable** — there is no role-based metric emphasis, ordering, or default view.

## 2. Personas (targets)

The spec documents 2 (`front-end-spec.md:19-49`); this rework targets **3** — **Operations Manager is confirmed as a 3rd persona** (approved 2026-06-26; was in the original UX-validation brief). **Action: add Operations Manager to `front-end-spec.md:19-49` personas.**

| Persona | Primary question on opening the dashboard | Cadence | Technical comfort |
|---|---|---|---|
| **Owner** (primary) | *"Am I making money? On what? What needs my attention?"* | Daily check | Moderate |
| **Operations Manager** (new) | *"Stock health, fulfillment, returns, storage cost — what's broken/at-risk?"* | Daily, operational | Moderate |
| **CFO / Financial Director** (secondary) | *"Is the P&L accurate and reconciled? Trends, anomalies, defensible numbers."* | Regular + reporting | High |

## 3. Design principles the rework enforces (from `front-end-spec.md:61-69`)

1. **Progressive disclosure** — 3 tiers: hero (always visible) → operational (scroll) → analytical (collapsed/deferred).
2. **Data-first hierarchy** — one true hero KPI, large; everything else subordinate.
3. **Clarity over cleverness** — fewer, larger, labeled cards; tooltips as *help*, not as the only way to tell cards apart.
4. **Consistent patterns** — group controls by intent, not scatter.

## 4. The rework — 5 changes

### Change A — Persona context (the keystone)

Add a **persona lens** to the dashboard: a lightweight selector (Owner / Ops / CFO), defaulting from the user's role (`Owner|Manager→Owner`, `Analyst→CFO`, `Service→CFO`) but user-overridable and persisted.

- **Implementation leverage:** extend the *existing* `useDashboardWidgetsStore` (already a 14-widget visibility model with a `WidgetSettingsSheet`) with **persona presets** — a preset = a named visibility+ordering config. **Not a rebuild**; it generalises the customisation axis already shipped.
- Each preset defines: hero KPI set, above-the-fold sections, and which analytical sections start collapsed.

### Change B — Three-tier progressive disclosure

Restructure `DashboardContent.tsx`'s flat `space-y-4` stack into 3 explicit tiers (the section inventory in §6 maps each current section to a tier).

```
TIER 1 — HERO (above the fold, always visible)
  Status strip (consolidated — see D) · Persona hero KPIs (4–6) · COGS-coverage indicator

TIER 2 — OPERATIONAL (scroll, persona-tuned)
  Period comparison · Daily breakdown · Persona widgets (stock / ads / P&L chain)

TIER 3 — ANALYTICAL (collapsed by default, lazy)
  Unit-economics table · Trends · Historical · Seasonal · Expense structure
```

### Change C — Hero declutter (the biggest density win)

Collapse the **~20-card `DashboardMetricsGrid`** into a **focused persona hero (4–6 KPIs)** + a consolidated "detail" disclosure. Merge the two main duplication sources:

- **Profit waterfall card** — fold `NetProfitCard` + `GrossProfitCard` + `OperatingProfitCard` + `GrossMarginCard` + `MarginCard` + `TaxCard` (**6 cards → 1**) into one expandable card showing the chain `Revenue → −COGS → Gross → −Logistics/Storage/Commissions → Operating → −Tax → Net`, with the persona's lead metric as the collapsed headline.
- **Sales-by-price-level card** — group the 4 near-identical cards (`Заказы РРЦ`, `Заказы со скидкой`, `Выкупы`, `Продажи розница` — currently distinguishable only by tooltip, per `simpleCardConfigs.ts:1-9`) into one card with labelled sub-rows.

**Hero KPI set per persona** (collapsed view):

| Owner | Ops | CFO |
|---|---|---|
| **Net profit** (hero) | **Stock health** (stockout risk) | **Net profit** (hero) |
| Revenue (выкупы) | Orders + fulfillment (FBO/FBS) | Operating profit |
| Margin % | Returns ₽ / rate | Gross margin % |
| Orders (шт) | Storage cost | Revenue (sale_gross) |
| COGS coverage % | COGS coverage % | Payout (к перечислению) |

### Change D — Banner → single status strip

Collapse the **8 conditional banners** (`IncompleteWeek`, `ReportPending`, `Processing`, `Failed`, `DataGaps`, `Error`, `TaxWarning`, `MissingCogs` — `DashboardContent.tsx:69-85`) into **one slim "status" strip**: a single line showing the highest-severity state + count ("⚠ 2 items need attention"), expandable to the detail. **Guarantees the hero is never pushed below the fold by banners** — currently the #1 readability failure.

### Change E — De-duplicate COGS coverage

COGS coverage appears **3×** today (`MissingCogsAlert`, `CogsCoverageMetricCard`, `InitialDataSummary`, + inside `CostsCard`). Make `CogsCoverageMetricCard` the **single canonical indicator** in the hero; convert `MissingCogsAlert` into a CTA *inside* that card; remove the standalone `InitialDataSummary` CTA (its job is the same).

## 5. Wireframes (ASCII)

### Current (the problem)
```
┌──────────────────────────────────────────────┐
│ Главная страница          [Неделя▼] [⚙ Виджеты] │
│ ⚠ Неделя неполная                              │ ← banner
│ ⏳ Отчёт формируется                           │ ← banner
│ ⚙ Налог не настроен                            │ ← banner
│ ! 12 товаров без COGS  [Назначить]            │ ← banner
│   …up to 8 stacked…                            │
│ ┌────┬────┬────┬────┬────┬────┬────┬────┐     │ ← ~20-card grid
│ │Net │Grss│Oper│Marg│GMrg│Tax │Ord₽│Buy₽│…   │   (profit chain = 6 cards;
│ └────┴────┴────┴────┴────┴────┴────┴────┘     │    sales = 4 near-identical)
│ [comparison 6 cards] [daily] [inventory 4]…   │ ← everything below the fold
│ [storage] [ads] [expense] [pie] [UE table]…   │
│ [seasonal] [trends] [historical] [next-step]  │
└──────────────────────────────────────────────┘
```

### Proposed — Owner hero (above the fold)
```
┌──────────────────────────────────────────────┐
│ Главная · Owner ▼         [Неделя▼] [⚙]       │
│ ⚠ 2 attention items ▸                         │ ← ONE status strip (expandable)
│ ┌─────────────┐ ┌──────┬──────┬──────┬──────┐ │
│ │  NET PROFIT │ │Revn │Margn│Orders│COGS %│ │ ← 5 focused KPIs
│ │  −79 055 ₽  │ │ 1.2M│ 12% │ 340  │ 87%  │ │
│ │  ▼ waterfall│ │ +5% │ +1pt│ -3%  │      │ │
│ └─────────────┘ └──────┴──────┴──────┴──────┘ │
│ ── scroll for daily / comparison / stock ──   │
└──────────────────────────────────────────────┘
```

### Proposed — CFO hero
```
│ ⚠ status ▸
│ ┌─────────────┐ ┌──────┬──────┬──────┬──────┐
│ │  NET PROFIT │ │Oper.│GrsMg│Payou│Revenue│   ← P&L chain emphasised
│ │  −79 055 ₽  │ │ -11k│ 18% │ 950k│ 1.2M │
│ │  ▼ P&L chain│ │ ✓rec│     │     │      │   ← reconciliation flag
│ └─────────────┘ └──────┴──────┴──────┴──────┘
```

### Proposed — Operations hero
```
│ ⚠ status ▸
│ ┌─────────────┐ ┌──────┬──────┬──────┬──────┐
│ │ STOCK HEALTH│ │Fulfill│Return│Storag│Orders │   ← operational lead metrics
│ │  3 at-risk  │ │ 62/38│ 4.1% │ 84k  │ 340   │
│ │  ▸ fix      │ │ FBO/F│ rate │ cost │       │
│ └─────────────┘ └──────┴──────┴──────┴──────┘
```

## 6. Section → tier mapping (current inventory → new home)

| Current section (DashboardContent.tsx) | New tier | Notes |
|---|---|---|
| Header + PeriodSelector + WidgetSettings (49-67) | T1 shell | keep |
| 8 banners (69-85) | **T1 status strip** | consolidated (Change D) |
| `DashboardMetricsGrid` ~20 cards (87-129) | **T1 hero** | decluttered to 4–6 (Change C) |
| `FulfillmentShareBar` (130) | T1 (Ops) / T2 | persona |
| `CogsCoverageMetricCard` (133) | **T1 hero** | canonical COGS indicator (Change E) |
| `PeriodComparisonSection` (140) | T2 | keep |
| `DailyBreakdownSection` (141) | T2 | keep |
| `InventorySummaryWidget` (142) | T2 (Ops hero-adjacent) | persona |
| `StorageSection` (143) | T2 (Ops) | persona |
| `AdvertisingDashboardWidget` (146) | T2 | keep |
| `MarketingKpiCard` (147) | T2 / merge into Ads | review |
| `ExpenseChart` + `ExpenseStructurePieChart` (148-149) | **T3** (collapsed) | heavy |
| `UnitEconomicsSection` (150) | **T3** (collapsed) | heavy table |
| `OrdersSeasonalPatterns` / `TrendGraph` / `HistoricalTrendsSection` (159-161) | **T3** (collapsed, lazy) | already lazy |
| `InitialDataSummary` (162) | **remove** | duplicates COGS (Change E) |

## 7. Suggested epic / stories (for after approval)

- **Story 1** — Persona context: role→preset default + persisted override; extend `dashboardWidgetsStore` with presets. (No visual change yet.)
- **Story 2** — Status strip: consolidate 8 banners into one expandable strip. (Win even without personas.)
- **Story 3** — Profit-waterfall card: merge 6 profit cards → 1 expandable.
- **Story 4** — Sales-by-price-level card: group 4 cards → 1.
- **Story 5** — Hero declutter + persona KPI sets (depends on 1,3,4).
- **Story 6** — Tier-3 collapsible analytical section + COGS de-dup (Change E).
- **Story 7** — Visual + a11y pass, persona screenshots for review.

**Suggested order:** Story 2 first (immediate readability win, lowest risk, no persona dependency), then 3 & 4 (density wins), then the persona keystone (1→5→6).

## 8. Non-goals / risks

- **Not** redesigning the analytics sub-pages (only the dashboard). Readability of sub-pages → companion `readability-audit-spec.md`.
- **Not** changing the data layer — all KPIs proposed are already surfaced (`useDashboardData.ts` already aggregates finance/fulfillment/ads/inventory).
- **Risk:** persona presets can drift from real needs — ship behind the existing widget-visibility override so users can always customise; instrument which preset is chosen.
- **Risk:** collapsing Tier-3 hides power-user tools (CFO) — Tier-3 is *collapsed*, not removed; CFO preset can default some Tier-3 open.

## 9. Acceptance criteria (for the eventual implementation)

- [ ] Default role mapping lands each persona on a hero showing ≤6 KPIs with their lead metric largest.
- [ ] No more than **one** status line above the hero on a fresh cabinet with multiple alert conditions.
- [ ] Profit chain rendered as **1** card (expandable), not 6.
- [ ] COGS coverage shown in **1** canonical place.
- [ ] Tier-3 analytical sections load lazily and start collapsed.
- [ ] Interactive-element count above the fold reduced (target: <15 from ~70–90 today).
- [ ] WCAG: persona selector keyboard-operable; collapsed sections programmatically associated.
