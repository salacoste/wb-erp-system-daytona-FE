# Price Calculator V2 Requirements

**Date**: 2026-01-20
**Status**: Draft
**Epic**: 44-FE (Price Calculator UI)
**Backend Reference**: [98-warehouses-tariffs-BACKEND-RESPONSE.md](../../request-backend/98-warehouses-tariffs-BACKEND-RESPONSE.md)

---

## 1. Overview

### Purpose
Enhanced Price Calculator that uses real WB tariff data (warehouses, commissions, logistics coefficients) to calculate optimal selling price based on target margin.

### Current State vs New Requirements

| Aspect | Current (Epic 44 v1) | New (v2) |
|--------|---------------------|----------|
| Logistics | Manual input (₽) | Auto-calculated from dimensions + warehouse |
| Commission | Manual override or default | Auto-fetched by category + fulfillment type |
| Warehouse | Not used | Dropdown selection affects coefficients |
| Fulfillment | Not considered | FBO/FBS selection affects all calculations |
| Acceptance | Not included | Coefficient-based calculation (FBO only) |
| Tax | VAT only (0/10/20%) | Tax rate + type (income vs profit) |
| SPP | Not included | Post-calculation display |

---

## 2. User Flow

### Step 1: Тип исполнения (Fulfillment Type)
**Field**: `fulfillment_type`
**Type**: Radio buttons / SegmentedControl
**Options**:
- `FBO` - Fulfillment by WB (товар на складе WB)
- `FBS` - Fulfillment by Seller (товар у продавца)

**Business Impact**:
- Commission rates differ (FBS usually +3-4% higher)
- Storage only relevant for FBO
- Acceptance costs only for FBO

### Step 2: Категория товара (Product Category)
**Field**: `category_id`
**Type**: Searchable Select (Combobox)
**Source**: `GET /v1/tariffs/commissions`

**UI Requirements**:
- Search/filter (7346 categories!)
- Show `parentName` → `subjectName`
- Display commission preview on selection

**API Response Structure**:
```typescript
{
  parentID: number      // Use this as category_id
  parentName: string    // "Одежда"
  subjectName: string   // "Платья"
  paidStorageKgvp: number  // FBO commission %
  kgvpMarketplace: number  // FBS commission %
}
```

### Step 3: Тип упаковки (Box Type) - FBO Only [NEW]
**Field**: `box_type`
**Type**: Radio buttons / SegmentedControl
**Options**:
- `box` - Короб (standard box delivery)
- `pallet` - Монопаллета (pallet delivery)

**Default**: `box`
**Condition**: Only shown when `fulfillment_type === 'FBO'`

**Business Impact**:
- Different tariff structures: boxes use per-liter rates, pallets use fixed rates
- Affects acceptance cost calculation significantly
- API parameter: `boxTypeId=2` (boxes) or `boxTypeId=5` (pallets)

### Step 4: Габариты товара (Product Dimensions)
**Fields**:
- `length_cm`: number (длина)
- `width_cm`: number (ширина)
- `height_cm`: number (высота)

**Auto-calculated**:
```typescript
volume_liters = (length_cm * width_cm * height_cm) / 1000
```

**Validation**: All > 0

### Step 4.5: Вес товара (Product Weight) [NEW]
**Field**: `weight_exceeds_25kg`
**Type**: Checkbox
**Label**: "Вес превышает 25 кг"
**Default**: `false`

**Business Impact**:
- Heavy items (>25kg) incur logistics surcharge (typically 1.5x multiplier)
- Affects both forward and reverse logistics costs
- Critical for furniture, appliances, sports equipment

**Calculation Impact**:
```typescript
const weight_multiplier = weight_exceeds_25kg ? 1.5 : 1.0
```

### Step 5: Себестоимость (Cost of Goods Sold)
**Field**: `cogs_rub`
**Type**: Number input with ₽ suffix
**Validation**: > 0
**Label**: Себестоимость (COGS)

### Step 6: Процент выкупа (Buyback Percentage)
**Field**: `buyback_pct`
**Type**: Slider + input (10-100%)
**Default**: 98%
**Label**: Процент выкупа

**Business Logic**:
```typescript
return_rate_pct = 100 - buyback_pct
// Returned items still incur delivery costs
effective_logistics = forward_logistics + (return_logistics * return_rate_pct / 100)
```

### Step 7: Эквайринг (Acquiring Commission)
**Field**: `acquiring_pct`
**Type**: Number input
**Default**: 2%
**Range**: 0-10%
**Label**: Эквайринг %

### Step 8: Хранение (Storage Cost) - FBO Only
**Field**: `storage_rub`
**Type**: Number input with ₽ suffix
**Default**: 0
**Condition**: Only shown/enabled when `fulfillment_type === 'FBO'`
**Label**: Хранение (за единицу в день)

**Note**: For FBS, items are shipped on demand - no storage fees.

### Step 8.5: Оборачиваемость (Turnover Days) - FBO Only [NEW]
**Field**: `turnover_days`
**Type**: Number input
**Default**: `20`
**Range**: 1-365
**Condition**: Only shown when `fulfillment_type === 'FBO'`
**Label**: Оборачиваемость, дней

**Business Impact**:
- Converts daily storage rate to total storage cost per unit sold
- Critical for slow-moving goods (cosmetics, seasonal items)
- Default 20 days reflects typical WB inventory turnover

**Calculation**:
```typescript
// Auto-calculate total storage from daily rate
const storage_total_rub = storage_rub * turnover_days
// Or if using volume-based calculation:
const storage_per_day = volume_liters * storage_coefficient * 0.07 // base rate
const storage_total_rub = storage_per_day * turnover_days
```

### Step 9: Тип приёмки (Acceptance Type) - FBO Only
**Fields**:
- `acceptance_type`: 'free' | 'paid'
- `acceptance_coefficient`: number (if paid)

**Type**: Radio + conditional input
**Condition**: Only shown when `fulfillment_type === 'FBO'`
**Label**: Тип приёмки

**Options**:
- `free` - Бесплатная приёмка (coefficient = 0)
- `paid` - Платная приёмка (enter coefficient)

**Coefficient Source**: `GET /v1/tariffs/acceptance/coefficients?warehouseId={id}`

**Interpretation**:
| Value | Meaning | UI |
|-------|---------|-----|
| -1 | Недоступно | Disabled, show warning |
| 0 | Бесплатно | Badge "Бесплатно" |
| 1 | Стандартная | Normal display |
| >1 | Повышенная | Warning badge "×1.5" |

### Step 10: Склад (Warehouse Selection)
**Field**: `warehouse_id`
**Type**: Searchable Select
**Source**: `GET /v1/tariffs/warehouses`
**Label**: Склад WB

**Relevant for BOTH FBO and FBS** - affects logistics coefficient.

**On Selection - Auto-fill**:
```typescript
// From GET /v1/tariffs/acceptance/coefficients?warehouseId={id}
logistics_coefficient = coefficients.delivery.coefficient
storage_coefficient = coefficients.storage.coefficient  // FBO only
acceptance_coefficient = coefficients.coefficient       // FBO only
localization_index = coefficients.delivery.coefficient  // Auto-set (can override)
```

### Step 10.5: Индекс локализации / КТР (Localization Index) [NEW]
**Field**: `localization_index` (alias: `ktr_coefficient`)
**Type**: Number input
**Default**: `1.0` (auto-filled from warehouse coefficient)
**Range**: 0.5 - 3.0
**Label**: Индекс локализации (КТР)

**Business Impact**:
- Regional delivery cost multiplier based on distance from warehouse to buyer
- Significantly affects remote regions (Siberia, Far East: 1.5-2.5x)
- Auto-filled from warehouse selection, but can be manually overridden

**Source Options**:
1. **Auto-fill**: From `delivery.coefficient` in `/v1/tariffs/acceptance/coefficients`
2. **Manual override**: For specific regional targeting or custom scenarios

**Calculation Impact**:
```typescript
// Applied to logistics costs
const logistics_adjusted = base_logistics * localization_index
```

### Step 11: Налоги (Tax Configuration)
**Fields**:
- `tax_rate_pct`: number (0-50%)
- `tax_type`: 'income' | 'profit'

**Type**: Number input + Select
**Label**: Ставка налога / Тип налога

**Tax Types**:
- `income` - Налог с выручки (% от общей суммы продаж)
- `profit` - Налог с прибыли (% от прибыли после расходов)

**Common Values**:
| Regime | Rate | Type |
|--------|------|------|
| УСН Доходы | 6% | income |
| УСН Доходы-Расходы | 15% | profit |
| Самозанятый | 6% | income |
| ИП на ОСН | 13% | profit |
| ООО на ОСН | 20% | profit |

### Step 12: Целевая маржа (Target Margin)
**Field**: `target_margin_pct`
**Type**: Slider + input (0-50%)
**Default**: 20%
**Label**: Целевая маржа %

### Step 13: DRR (Доля рекламных расходов)
**Field**: `drr_pct`
**Type**: Number input (0-30%)
**Default**: 5%
**Label**: DRR (Доля рекламных расходов)

**Business Logic**:
- DRR = процент от розничной цены на рекламу
- Это **переменный расход** (в отличие от фиксированных: COGS, логистика)
- Влияет на финальную маржинальную прибыль

**Calculation Impact**:
```typescript
// DRR вычитается из маржи как % от цены
advertising_cost = recommended_price * (drr_pct / 100)
net_margin = gross_margin - advertising_cost
```

**UI Recommendation**:
Показывать два уровня расчёта:
1. **Минимальная цена** (только фиксированные расходы) — "пол" цены
2. **Рекомендуемая цена** (с учётом DRR и целевой маржи) — финальная цена

### Step 14: СПП (SPP - Permanent Buyer Discount)
**Field**: `spp_pct`
**Type**: Number input (0-30%)
**Default**: 0%
**Label**: СПП (Скидка постоянного покупателя)

**Business Logic**:
- WB provides this discount at their expense
- Applied AFTER price calculation to show customer-facing price
- Does NOT affect seller's revenue

```typescript
customer_price = recommended_price * (1 - spp_pct / 100)
```

### Step 15: Дополнительные расходы (Additional Expenses) [NEW - MEDIUM PRIORITY]

**Collapsible Section**: "Дополнительные расходы" (collapsed by default)

**Fields**:

#### 15.1 Логистика до МП (Logistics to Marketplace)
- **Field**: `logistics_to_mp_rub`
- **Type**: Number input with ₽ suffix
- **Default**: `0`
- **Label**: Логистика до МП, ₽
- **Note**: Seller's cost to deliver goods TO WB warehouse (not WB logistics)

#### 15.2 Упаковка (Packaging Cost)
- **Field**: `packaging_rub`
- **Type**: Number input with ₽ suffix
- **Default**: `0`
- **Label**: Упаковка, ₽
- **Note**: Cost of packaging materials per unit

#### 15.3 Тарифные опции WB (WB Tariff Options)
- **Field**: `wb_tariff_options_pct`
- **Type**: Number input (0-20%)
- **Default**: `0`
- **Label**: Тарифные опции WB, %
- **Note**: Additional WB services (premium placement, etc.)

#### 15.4 Прочие расходы (Other Expenses)
- **Field**: `other_expenses_rub`
- **Type**: Number input with ₽ suffix
- **Default**: `0`
- **Label**: Прочие расходы, ₽
- **Note**: Miscellaneous expenses (certification, photos, etc.)

### Step 16: Инвестиции и ROI (Investment & ROI) [NEW - LOW PRIORITY]

**Collapsible Section**: "Анализ ROI" (collapsed by default)

**Field**: `total_investment_rub`
**Type**: Number input with ₽ suffix
**Default**: - (optional)
**Label**: Общие инвестиции, ₽

**Note**: For ROI calculation, not required for price calculation.

**Output Calculation**:
```typescript
// Requires expected_units input for ROI calculation
const roi_pct = (margin_rub * expected_units) / total_investment_rub * 100
```

---

## 3. Input Fields Summary

### Core Fields (Existing)

| Field | Type | Required | Default | Validation | FBO | FBS |
|-------|------|----------|---------|------------|-----|-----|
| fulfillment_type | select | ✅ | FBO | enum | ✅ | ✅ |
| category_id | combobox | ✅ | - | > 0 | ✅ | ✅ |
| length_cm | number | ✅ | - | > 0 | ✅ | ✅ |
| width_cm | number | ✅ | - | > 0 | ✅ | ✅ |
| height_cm | number | ✅ | - | > 0 | ✅ | ✅ |
| cogs_rub | number | ✅ | - | > 0 | ✅ | ✅ |
| buyback_pct | slider | ✅ | 98 | 10-100 | ✅ | ✅ |
| acquiring_pct | number | ❌ | 2 | 0-10 | ✅ | ✅ |
| storage_rub | number | ❌ | 0 | ≥ 0 | ✅ | ❌ |
| acceptance_type | radio | ❌ | free | enum | ✅ | ❌ |
| acceptance_coefficient | number | ❌ | 1 | ≥ 0 | ✅ | ❌ |
| warehouse_id | select | ✅ | - | > 0 | ✅ | ✅ |
| tax_rate_pct | number | ❌ | 6 | 0-50 | ✅ | ✅ |
| tax_type | select | ❌ | income | enum | ✅ | ✅ |
| target_margin_pct | slider | ✅ | 20 | 0-50 | ✅ | ✅ |
| drr_pct | number | ❌ | 5 | 0-30 | ✅ | ✅ |
| spp_pct | number | ❌ | 0 | 0-30 | ✅ | ✅ |

### NEW Fields (from Competitor Analysis)

#### HIGH PRIORITY - Phase 1

| Field | Type | Required | Default | Validation | FBO | FBS | Priority |
|-------|------|----------|---------|------------|-----|-----|----------|
| box_type | radio | ❌ | box | enum(box,pallet) | ✅ | ❌ | HIGH |
| weight_exceeds_25kg | checkbox | ❌ | false | boolean | ✅ | ✅ | HIGH |
| localization_index | number | ❌ | 1.0 | 0.5-3.0 | ✅ | ✅ | HIGH |
| turnover_days | number | ❌ | 20 | 1-365 | ✅ | ❌ | HIGH |

#### MEDIUM PRIORITY - Phase 2 (Collapsible Section)

| Field | Type | Required | Default | Validation | FBO | FBS | Priority |
|-------|------|----------|---------|------------|-----|-----|----------|
| logistics_to_mp_rub | number | ❌ | 0 | ≥ 0 | ✅ | ✅ | MEDIUM |
| packaging_rub | number | ❌ | 0 | ≥ 0 | ✅ | ✅ | MEDIUM |
| wb_tariff_options_pct | number | ❌ | 0 | 0-20 | ✅ | ✅ | MEDIUM |
| other_expenses_rub | number | ❌ | 0 | ≥ 0 | ✅ | ✅ | MEDIUM |

#### LOW PRIORITY - Phase 3 (Collapsible Section)

| Field | Type | Required | Default | Validation | FBO | FBS | Priority |
|-------|------|----------|---------|------------|-----|-----|----------|
| total_investment_rub | number | ❌ | - | ≥ 0 | ✅ | ✅ | LOW |

---

## 4. API Dependencies

### Required Endpoints (Complete Reference)

| Endpoint | Method | Purpose | TTL | Rate Limit | Source |
|----------|--------|---------|-----|------------|--------|
| `/v1/tariffs/commissions` | GET | Category list + commissions (7346 categories) | 24h | 10/min | `test-api/18-tariffs.http` §1.1 |
| `/v1/tariffs/commissions/category/{id}` | GET | Commission for specific category | 24h | 10/min | `test-api/18-tariffs.http` §1.2 |
| `/v1/tariffs/commissions/product/{nmId}` | GET | Commission by product nmId | 24h | 10/min | `test-api/18-tariffs.http` §1.3 |
| `/v1/tariffs/warehouses` | GET | Warehouse list (~50 items) | 24h | 10/min | `test-api/18-tariffs.http` §3.1 |
| `/v1/tariffs/warehouses/box` | GET | Box tariffs (logistics/storage) | 1h | 10/min | `test-api/18-tariffs.http` §3.2 |
| `/v1/tariffs/acceptance/coefficients` | GET | Acceptance + logistics coefs (14 days) | 1h | **6/min** | `test-api/18-tariffs.http` §4.1 |
| `/v1/tariffs/acceptance/available` | GET | Available warehouses for date | 1h | **6/min** | `test-api/18-tariffs.http` §4.4 |
| `/v1/tariffs/settings` | GET | Global tariff settings (fallback) | 24h | - (local DB) | `test-api/18-tariffs.http` §2.1 |
| `/v1/tariffs/settings/logistics` | GET | Logistics rate by volume | 24h | - (local DB) | `test-api/18-tariffs.http` §2.3 |
| `/v1/tariffs/settings/acceptance/box` | GET | Acceptance cost for box | 24h | - (local DB) | `test-api/18-tariffs.http` §2.5 |
| `/v1/products/price-calculator` | POST | Calculate recommended price | - | 600/min | `test-api/15-price-calculator.http` |

**⚠️ Rate Limits by Scope:**
- `tariffs` scope: 10 req/min (commissions, warehouses, box tariffs)
- `orders_fbw` scope: **6 req/min** (acceptance coefficients - stricter!)
- Standard scope: 600 req/min (price-calculator)

### Data Loading Strategy

```typescript
// On page load - parallel fetch (3 requests, use `tariffs` scope)
const [commissions, warehouses, settings] = await Promise.all([
  getCommissions(),      // 7346 categories, cache 24h, ~50KB response
  getWarehouses(),       // ~50 warehouses, cache 24h, ~5KB response
  getTariffSettings(),   // Global rates, cache 24h, local DB (no rate limit)
])

// On warehouse selection - fetch coefficients (uses `orders_fbw` scope - 6/min!)
const coefficients = await getAcceptanceCoefficients(warehouseId)

// ⚠️ IMPORTANT: Debounce warehouse selection changes (500ms minimum)
// to avoid hitting rate limit on rapid warehouse switching
```

### Query Parameters Reference

| Endpoint | Parameter | Type | Required | Example |
|----------|-----------|------|----------|---------|
| `/commissions/category/{id}` | `fulfillmentType` | enum | ❌ | `?fulfillmentType=FBO` |
| `/warehouses/box` | `date` | string | ❌ | `?date=2026-01-20` |
| `/acceptance/coefficients` | `warehouseId` | number | ❌ | `?warehouseId=507` |
| `/acceptance/coefficients` | `warehouseIds` | string | ❌ | `?warehouseIds=507,117501` |
| `/acceptance/available` | `date` | string | ✅ | `?date=2026-01-20` |
| `/acceptance/available` | `boxTypeId` | number | ❌ | `?boxTypeId=2` (2=Короба, 5=Паллеты) |
| `/settings/logistics` | `volumeLiters` | number | ✅ | `?volumeLiters=0.5` |
| `/settings/logistics` | `fulfillmentType` | enum | ✅ | `?fulfillmentType=FBO` |

---

## 5. Calculation Formulas

### Step 1: Get Commission %
```typescript
const commissionField = fulfillmentType === 'FBO'
  ? 'paidStorageKgvp'
  : 'kgvpMarketplace'

const commission_pct = category.commissions[commissionField]
```

### Step 2: Calculate Volume
```typescript
const volume_liters = (length_cm * width_cm * height_cm) / 1000
```

### Step 3: Calculate Base Logistics Cost [UPDATED]
```typescript
function calculateLogisticsCost(
  volumeLiters: number,
  boxType: 'box' | 'pallet' = 'box'
): number {
  // [NEW] Pallet has different tariff structure
  if (boxType === 'pallet') {
    // Pallet uses fixed rate structure
    const PALLET_BASE_RATE = 500.00 // ₽ per pallet delivery
    return PALLET_BASE_RATE
  }

  // Box tariff - volume-based
  if (volumeLiters <= 1) {
    // Volume tier pricing
    const tiers = [
      { min: 0.001, max: 0.2, rate: 23 },
      { min: 0.201, max: 0.4, rate: 26 },
      { min: 0.401, max: 0.6, rate: 29 },
      { min: 0.601, max: 0.8, rate: 30 },
      { min: 0.801, max: 1.0, rate: 32 },
    ]
    const tier = tiers.find(t => volumeLiters >= t.min && volumeLiters <= t.max)
    return tier?.rate ?? 32
  } else {
    // Progressive formula for large items
    const firstLiterRate = 46
    const additionalLiterRate = 14
    return firstLiterRate + additionalLiterRate * (volumeLiters - 1)
  }
}
```

### Step 4: Apply Warehouse & Weight Coefficients [UPDATED]
```typescript
// [NEW] Weight multiplier for heavy items (>25kg)
const weight_multiplier = weight_exceeds_25kg ? 1.5 : 1.0

// [NEW] Localization index (auto-filled from warehouse or manual)
const effective_localization = localization_index ?? logistics_coefficient

// Apply all multipliers
const logistics_forward_rub = baseLogisticsCost
  * effective_localization
  * weight_multiplier

const logistics_reverse_rub = logistics_forward_rub // Usually same
```

### Step 5: Calculate Effective Logistics (with returns)
```typescript
const return_rate = (100 - buyback_pct) / 100
const logistics_effective = logistics_forward_rub + (logistics_reverse_rub * return_rate)
```

### Step 5.5: Calculate Storage Cost [NEW - with Turnover Days]
```typescript
// FBO only - calculate total storage based on turnover
function calculateStorageCost(
  volumeLiters: number,
  storageCoefficient: number,
  turnoverDays: number,
  storageRubManual?: number // User can override
): number {
  if (fulfillmentType === 'FBS') return 0

  // If user provided manual storage rate, use it with turnover
  if (storageRubManual !== undefined && storageRubManual > 0) {
    return storageRubManual * turnoverDays
  }

  // Otherwise, calculate from volume and coefficient
  const BASE_STORAGE_RATE = 0.07 // ₽ per liter per day
  const storage_per_day = volumeLiters * storageCoefficient * BASE_STORAGE_RATE
  return storage_per_day * turnoverDays
}

const storage_total_rub = calculateStorageCost(
  volume_liters,
  storage_coefficient,
  turnover_days,
  storage_rub
)
```

### Step 6: Calculate Acceptance Cost (FBO only) [UPDATED]
```typescript
function calculateAcceptanceCost(
  volumeLiters: number,
  acceptanceType: 'free' | 'paid',
  acceptanceCoefficient: number,
  boxType: 'box' | 'pallet'
): number {
  if (acceptanceType === 'free' || acceptanceCoefficient === 0) return 0
  if (acceptanceCoefficient === -1) {
    throw new Error('Warehouse unavailable for acceptance')
  }

  // [NEW] Different rates for box vs pallet
  if (boxType === 'pallet') {
    const PALLET_ACCEPTANCE_RATE = 500.00 // ₽ per pallet
    return PALLET_ACCEPTANCE_RATE * acceptanceCoefficient
  }

  // Box rate is per liter
  const BOX_ACCEPTANCE_RATE = 1.70 // ₽ per liter
  return BOX_ACCEPTANCE_RATE * volumeLiters * acceptanceCoefficient
}
```

### Step 7: Calculate Price (Two-Level Pricing) [UPDATED]

**Концепция двухуровневого ценообразования:**
1. **Минимальная цена** — покрывает только фиксированные расходы (пол цены)
2. **Рекомендуемая цена** — включает переменные расходы (DRR) и целевую маржу

```typescript
// ═══════════════════════════════════════════════════════════════
// ФИКСИРОВАННЫЕ РАСХОДЫ (Fixed Costs) [UPDATED]
// ═══════════════════════════════════════════════════════════════
// Base costs (existing)
const base_fixed_costs = cogs_rub
  + logistics_effective
  + storage_total_rub      // [UPDATED] Now uses turnover_days
  + acceptance_cost

// [NEW] Additional costs from competitor analysis (Phase 2)
const additional_fixed_costs =
  (logistics_to_mp_rub ?? 0) +     // Logistics to marketplace
  (packaging_rub ?? 0) +            // Packaging cost
  (other_expenses_rub ?? 0)         // Other expenses

const fixed_costs = base_fixed_costs + additional_fixed_costs

// ═══════════════════════════════════════════════════════════════
// ПРОЦЕНТНЫЕ СТАВКИ (Percentage Rates) [UPDATED]
// ═══════════════════════════════════════════════════════════════
const commission_rate = commission_pct / 100      // Комиссия WB
const acquiring_rate = acquiring_pct / 100        // Эквайринг
const drr_rate = drr_pct / 100                    // DRR (реклама)
const margin_rate = target_margin_pct / 100       // Целевая маржа
const wb_options_rate = (wb_tariff_options_pct ?? 0) / 100  // [NEW] WB tariff options

// Tax handling
let tax_multiplier: number
if (tax_type === 'income') {
  tax_multiplier = tax_rate_pct / 100  // Налог с выручки
} else {
  tax_multiplier = 0  // Налог с прибыли - считается отдельно
}

// ═══════════════════════════════════════════════════════════════
// УРОВЕНЬ 1: МИНИМАЛЬНАЯ ЦЕНА (без маржи и DRR)
// ═══════════════════════════════════════════════════════════════
const min_pct_rate = commission_rate + acquiring_rate + tax_multiplier + wb_options_rate
const minimum_price = fixed_costs / (1 - min_pct_rate)
// Это "пол" цены - ниже продавать убыточно

// ═══════════════════════════════════════════════════════════════
// УРОВЕНЬ 2: РЕКОМЕНДУЕМАЯ ЦЕНА (с маржой и DRR)
// ═══════════════════════════════════════════════════════════════
const total_pct_rate = commission_rate
  + acquiring_rate
  + drr_rate
  + tax_multiplier
  + margin_rate
  + wb_options_rate  // [NEW]

const recommended_price = fixed_costs / (1 - total_pct_rate)

// ═══════════════════════════════════════════════════════════════
// BREAKDOWN: Рекламные расходы и чистая маржа
// ═══════════════════════════════════════════════════════════════
const advertising_cost_rub = recommended_price * drr_rate
const gross_margin_rub = recommended_price * margin_rate
const net_margin_rub = gross_margin_rub  // После DRR уже учтён в формуле

// Если налог с прибыли
if (tax_type === 'profit') {
  const profit_before_tax = net_margin_rub
  const profit_tax = profit_before_tax * (tax_rate_pct / 100)
  const net_margin_after_tax = profit_before_tax - profit_tax
}

// [NEW] ROI Calculation (Phase 3, optional)
if (total_investment_rub && total_investment_rub > 0) {
  // Requires expected_units input for meaningful ROI
  const expected_units = ... // User input or estimate
  const roi_pct = (net_margin_rub * expected_units) / total_investment_rub * 100
}
```

### Step 8: Apply SPP for Customer Price
```typescript
const customer_price = recommended_price * (1 - spp_pct / 100)
```

---

## 6. FBO vs FBS Differences

| Feature | FBO | FBS |
|---------|-----|-----|
| Storage costs | ✅ User enters | ❌ N/A (0) |
| Acceptance costs | ✅ Calculated | ❌ N/A (0) |
| Acceptance coefficient | ✅ From API | ❌ N/A |
| Commission field | `paidStorageKgvp` | `kgvpMarketplace` |
| Commission rate | Lower (~25%) | Higher (~28%) |
| Warehouse selection | Required | Required |
| Logistics coefficient | From warehouse | From warehouse |

---

## 7. Edge Cases

### Zero/Minimal Values
| Scenario | Handling |
|----------|----------|
| buyback_pct = 100% | return_rate = 0, no return logistics |
| buyback_pct = 10% | Warning: very high return rate |
| storage_rub = 0 | Valid for FBO (free storage period) |
| acceptance_coefficient = 0 | Free acceptance (promo) |
| acceptance_coefficient = -1 | Warehouse unavailable, show error |
| spp_pct = 0 | customer_price = recommended_price |

### Large Items
```typescript
// Items > 1 liter use progressive formula
if (volume_liters > 1) {
  showInfo("Крупногабаритный товар: применяется прогрессивная ставка логистики")
}
```

### High Commission Categories
```typescript
if (commission_pct > 25) {
  showWarning(`Высокая комиссия категории: ${commission_pct}%`)
}
```

### Negative Margin Scenario
```typescript
if (recommended_price < fixed_costs) {
  showError("При заданных параметрах невозможно достичь целевой маржи")
}
```

---

## 8. Output Display

### Primary Results (Two-Level Pricing)
```
┌─────────────────────────────────────────────────────────┐
│  МИНИМАЛЬНАЯ ЦЕНА:           3 214,00 ₽                │ <- "Пол" цены
│  (покрывает фиксированные расходы)                      │
├─────────────────────────────────────────────────────────┤
│  РЕКОМЕНДУЕМАЯ ЦЕНА:         4 057,87 ₽                │ <- С маржой + DRR
│  Цена для покупателя:        3 652,08 ₽                │ <- После СПП
│  (с учётом СПП 10%)                                     │
├─────────────────────────────────────────────────────────┤
│  Маржа:          811,57 ₽  (20,0%)                     │
│  DRR (реклама):  202,89 ₽  (5,0%)                      │
│  Комиссия WB:              (25,0%)                      │
└─────────────────────────────────────────────────────────┘
```

### Cost Breakdown Table [UPDATED]
```
ФИКСИРОВАННЫЕ ЗАТРАТЫ              1 903,00 ₽
├─ Себестоимость (COGS)            1 500,00 ₽
├─ Логистика до МП [NEW]              50,00 ₽  <- Phase 2
├─ Логистика WB (прямая)              74,00 ₽
│  └─ [коэф. локализации: 1.2]                 <- Phase 1
│  └─ [вес > 25 кг: ×1.0]                      <- Phase 1
├─ Логистика (возвратная эфф.)        53,00 ₽
├─ Хранение (20 дн × 2.50 ₽)          50,00 ₽  <- Phase 1: turnover
├─ Приёмка (Короб)                    76,00 ₽  <- Phase 1: box_type
├─ Упаковка [NEW]                     50,00 ₽  <- Phase 2
└─ Прочие расходы [NEW]               50,00 ₽  <- Phase 2

ПРОЦЕНТНЫЕ ЗАТРАТЫ                 1 543,30 ₽
├─ Комиссия WB (25%)                 405,79 ₽
├─ Эквайринг (2%)                     81,16 ₽
├─ Налог с выручки (6%)              243,47 ₽
├─ Тарифные опции WB [NEW] (1%)       40,58 ₽  <- Phase 2
ПЕРЕМЕННЫЕ ЗАТРАТЫ                   202,89 ₽
└─ DRR Реклама (5%)                  202,89 ₽

МАРЖА (20%)                          811,57 ₽
└─ Чистая прибыль                    811,57 ₽

═══════════════════════════════════════════════
МИНИМАЛЬНАЯ ЦЕНА (пол)             3 364,00 ₽
РЕКОМЕНДУЕМАЯ ЦЕНА                 4 207,87 ₽
ЦЕНА ДЛЯ ПОКУПАТЕЛЯ (СПП 10%)      3 787,08 ₽
═══════════════════════════════════════════════

[PHASE 3 - ROI ANALYSIS]
Инвестиции:                      100 000,00 ₽
Прогноз продаж:                        200 шт
ROI:                                   162,3 %
Точка безубыточности:                  123 шт
═══════════════════════════════════════════════
```

### Visual Chart
Stacked bar chart showing proportion of each cost component.

---

## 9. Acceptance Criteria

### Functional (Core)
- [ ] User can select FBO or FBS fulfillment type
- [ ] Category search works with 7346+ items
- [ ] Dimensions auto-calculate volume in liters
- [ ] Warehouse selection auto-fills coefficients
- [ ] FBO-only fields hidden for FBS
- [ ] Tax type affects calculation correctly
- [ ] DRR (advertising %) affects variable costs
- [ ] Two prices shown: minimum (floor) and recommended
- [ ] SPP shows customer-facing price separately
- [ ] Results update on any input change (debounced)

### Functional (NEW - Phase 1 HIGH Priority)
- [ ] Box type selection (Короб/Монопаллета) affects tariff calculation
- [ ] Weight threshold checkbox (>25kg) applies logistics surcharge multiplier
- [ ] Localization index field auto-fills from warehouse, allows manual override
- [ ] Turnover days field calculates total storage cost from daily rate
- [ ] All HIGH priority fields show tooltips explaining business impact

### Functional (NEW - Phase 2 MEDIUM Priority)
- [ ] Additional expenses section is collapsible (default: collapsed)
- [ ] Logistics to MP field adds to fixed costs
- [ ] Packaging cost field adds to fixed costs
- [ ] WB tariff options % field adds to percentage costs
- [ ] Other expenses field adds to fixed costs

### Functional (NEW - Phase 3 LOW Priority)
- [ ] ROI analysis section is collapsible (default: collapsed)
- [ ] Total investment field enables ROI calculation display
- [ ] ROI % is calculated and displayed when investment provided

### UX
- [ ] Loading states for API calls
- [ ] Error messages in Russian
- [ ] Tooltips explain each field
- [ ] Mobile responsive layout
- [ ] Keyboard navigation works
- [ ] [NEW] Collapsible sections for advanced options
- [ ] [NEW] Visual indicator for fields affecting calculation

### Performance
- [ ] Category list loads < 2s (cached)
- [ ] Calculation completes < 500ms
- [ ] No unnecessary API calls (debounce 500ms)

### Accessibility
- [ ] WCAG 2.1 AA compliance
- [ ] All inputs have labels
- [ ] Color contrast ≥ 4.5:1

---

## 10. Open Questions

| # | Question | Status |
|---|----------|--------|
| 1 | Should we support DBS/EDBS fulfillment types? | TODO: Confirm scope |
| 2 | Include advertising % in calculation? | ✅ RESOLVED: Yes, via DRR field |
| 3 | Auto-detect category from existing products? | TODO: Phase 2? |
| 4 | Save calculation presets? | TODO: Phase 2 |
| 5 | Integration with product creation flow? | TODO: Phase 2 |
| 6 | [NEW] Pallet tariff rates - confirm exact values | TODO: Verify with WB API |
| 7 | [NEW] Heavy item (>25kg) multiplier - confirm 1.5x is accurate | TODO: Verify with WB API |
| 8 | [NEW] ROI calculation - require expected_units input? | TODO: Design decision |

---

## 11. TypeScript Types

```typescript
// ═══════════════════════════════════════════════════════════════
// Request type for enhanced calculator [UPDATED]
// ═══════════════════════════════════════════════════════════════
interface PriceCalculatorV2Request {
  // Core fields (existing)
  fulfillment_type: 'FBO' | 'FBS'
  category_id: number
  dimensions: {
    length_cm: number
    width_cm: number
    height_cm: number
  }
  cogs_rub: number
  buyback_pct: number
  acquiring_pct: number
  storage_rub: number              // FBO only, per day
  acceptance_type: 'free' | 'paid' // FBO only
  acceptance_coefficient?: number  // FBO only, if paid
  warehouse_id: number
  tax_rate_pct: number
  tax_type: 'income' | 'profit'
  target_margin_pct: number
  drr_pct: number
  spp_pct: number

  // ─────────────────────────────────────────────────────────────
  // NEW FIELDS - Phase 1 (HIGH PRIORITY)
  // ─────────────────────────────────────────────────────────────
  box_type?: 'box' | 'pallet'      // FBO only, default: 'box'
  weight_exceeds_25kg?: boolean    // Default: false
  localization_index?: number      // Default: 1.0 (auto-fill from warehouse)
  turnover_days?: number           // FBO only, default: 20

  // ─────────────────────────────────────────────────────────────
  // NEW FIELDS - Phase 2 (MEDIUM PRIORITY)
  // ─────────────────────────────────────────────────────────────
  logistics_to_mp_rub?: number     // Logistics to marketplace, default: 0
  packaging_rub?: number           // Packaging cost, default: 0
  wb_tariff_options_pct?: number   // WB tariff options %, default: 0
  other_expenses_rub?: number      // Other expenses, default: 0

  // ─────────────────────────────────────────────────────────────
  // NEW FIELDS - Phase 3 (LOW PRIORITY)
  // ─────────────────────────────────────────────────────────────
  total_investment_rub?: number    // For ROI calculation
  expected_units?: number          // For ROI calculation
}

// ═══════════════════════════════════════════════════════════════
// Response type [UPDATED]
// ═══════════════════════════════════════════════════════════════
interface PriceCalculatorV2Response {
  // Core results
  minimum_price: number           // [NEW] Floor price (no margin/DRR)
  recommended_price: number
  customer_price: number          // After SPP
  actual_margin_rub: number
  actual_margin_pct: number

  // Cost breakdown
  cost_breakdown: {
    fixed: {
      cogs: number
      logistics_forward: number
      logistics_reverse_effective: number
      storage: number             // [UPDATED] Now calculated with turnover_days
      acceptance: number
      // [NEW] Additional fixed costs
      logistics_to_mp?: number
      packaging?: number
      other_expenses?: number
      fixed_total: number
    }
    percentage: {
      commission_wb: number
      commission_pct: number
      acquiring: number
      tax: number
      drr: number                 // DRR advertising
      wb_tariff_options?: number  // [NEW]
      margin: number
      percentage_total: number
    }
  }

  // Intermediate values
  intermediate: {
    volume_liters: number
    logistics_coefficient: number
    localization_index: number    // [NEW]
    weight_multiplier: number     // [NEW] 1.0 or 1.5
    return_rate_pct: number
    turnover_days?: number        // [NEW] FBO only
    box_type?: 'box' | 'pallet'   // [NEW] FBO only
  }

  // [NEW] ROI analysis (Phase 3)
  roi_analysis?: {
    total_investment: number
    expected_units: number
    roi_pct: number
    payback_units: number         // Units needed to recover investment
  }

  warnings: string[]
}

// ═══════════════════════════════════════════════════════════════
// Box Type enum for type safety
// ═══════════════════════════════════════════════════════════════
type BoxType = 'box' | 'pallet'

const BOX_TYPE_CONFIG: Record<BoxType, { label: string; apiId: number }> = {
  box: { label: 'Короб', apiId: 2 },
  pallet: { label: 'Монопаллета', apiId: 5 },
}
```

---

## 12. Backend API Reference

### 12.1 Available Endpoints Table

| Endpoint | Method | Purpose | Response Key Fields | Documentation |
|----------|--------|---------|---------------------|---------------|
| `/v1/tariffs/commissions` | GET | All category commissions (7346) | `commissions[]`, `meta.total`, `meta.cached` | `test-api/18-tariffs.http` §1.1 |
| `/v1/tariffs/commissions/category/{id}` | GET | Commission by category | `categoryId`, `commission_pct`, `fulfillmentType` | `test-api/18-tariffs.http` §1.2 |
| `/v1/tariffs/commissions/product/{nmId}` | GET | Commission by product | `commission_pct`, `source` | `test-api/18-tariffs.http` §1.3 |
| `/v1/tariffs/warehouses` | GET | Warehouse list | `warehouses[]`, `meta.total` | `test-api/18-tariffs.http` §3.1 |
| `/v1/tariffs/warehouses/box` | GET | Box tariffs per warehouse | `tariffs[]`, `meta.date` | `test-api/18-tariffs.http` §3.2 |
| `/v1/tariffs/acceptance/coefficients` | GET | Acceptance coefficients (14 days) | `coefficients[]`, `meta.available`, `meta.unavailable` | `test-api/18-tariffs.http` §4.1 |
| `/v1/tariffs/acceptance/available` | GET | Available warehouses for date | `warehouses[]`, `meta.totalAvailable` | `test-api/18-tariffs.http` §4.4 |
| `/v1/tariffs/settings` | GET | Global tariff settings | `default_commission_*`, `logistics_volume_tiers[]` | `test-api/18-tariffs.http` §2.1 |
| `/v1/tariffs/settings/logistics` | GET | Logistics rate by volume | `rate_rub`, `calculation_method`, `tier_applied` | `test-api/18-tariffs.http` §2.3 |
| `/v1/products/price-calculator` | POST | Calculate recommended price | `result.recommended_price`, `cost_breakdown`, `warnings[]` | `test-api/15-price-calculator.http` |

---

### 12.2 Request/Response Examples

#### GET /v1/tariffs/commissions

**Purpose**: Get all category commissions (7346 categories)

```http
GET {{baseUrl}}/v1/tariffs/commissions
Authorization: Bearer {{token}}
X-Cabinet-Id: {{cabinetId}}
```

**Response 200 OK:**
```json
{
  "data": {
    "commissions": [
      {
        "parentID": 123,
        "parentName": "Одежда",
        "subjectID": 456,
        "subjectName": "Платья",
        "paidStorageKgvp": 25,        // FBO commission %
        "kgvpMarketplace": 28,        // FBS commission % (+3-4% vs FBO)
        "kgvpSupplier": 10,           // DBS commission %
        "kgvpSupplierExpress": 5      // EDBS commission %
      }
    ],
    "meta": {
      "total": 7346,
      "cached": true,
      "cache_ttl_seconds": 86400,
      "fetched_at": "2026-01-19T12:00:00Z"
    }
  }
}
```

**Business Note**: FBS commission выше FBO в **96.5% категорий** (в среднем +3.38%)

---

#### GET /v1/tariffs/warehouses

**Purpose**: Get warehouse list with metadata

```http
GET {{baseUrl}}/v1/tariffs/warehouses
Authorization: Bearer {{token}}
X-Cabinet-Id: {{cabinetId}}
```

**Response 200 OK:**
```json
{
  "data": {
    "warehouses": [
      {
        "id": 507,
        "name": "Краснодар",
        "address": "...",
        "city": "Краснодар",
        "federalDistrict": "Южный ФО",
        "cargoType": 1,
        "deliveryType": 2,
        "latitude": 45.0355,
        "longitude": 38.9753
      },
      {
        "id": 117501,
        "name": "Коледино",
        "city": "Подольск"
      }
    ],
    "meta": {
      "total": 50,
      "cached": true
    }
  }
}
```

---

#### GET /v1/tariffs/acceptance/coefficients

**Purpose**: Get acceptance + logistics coefficients for warehouses (14 days forward)

```http
GET {{baseUrl}}/v1/tariffs/acceptance/coefficients?warehouseId=507
Authorization: Bearer {{token}}
X-Cabinet-Id: {{cabinetId}}
```

**Response 200 OK:**
```json
{
  "data": {
    "coefficients": [
      {
        "warehouseId": 507,
        "warehouseName": "Краснодар",
        "date": "2026-01-20",
        "coefficient": 1,               // Acceptance coefficient
        "isAvailable": true,
        "allowUnload": true,
        "boxTypeId": 2,
        "boxTypeName": "Boxes",
        "delivery": {
          "coefficient": 1.2,           // Logistics multiplier
          "baseLiterRub": 46.0,
          "additionalLiterRub": 14.0
        },
        "storage": {
          "coefficient": 1.0,
          "baseLiterRub": 0.07,
          "additionalLiterRub": 0.05
        },
        "isSortingCenter": false
      }
    ],
    "meta": {
      "total": 250,
      "available": 200,
      "unavailable": 50,
      "cache_ttl_seconds": 3600
    }
  }
}
```

**Coefficient Interpretation:**

| Value | Meaning | UI Display |
|-------|---------|------------|
| `-1` | Приёмка недоступна | Badge "Недоступно", disabled |
| `0` | Приёмка бесплатная | Badge "Бесплатно" (green) |
| `1` | Стандартная стоимость | Normal display |
| `>1` | Повышенная стоимость | Warning badge "×1.5" |

---

#### GET /v1/tariffs/settings

**Purpose**: Global tariff settings (fallback values from DB)

```http
GET {{baseUrl}}/v1/tariffs/settings
Authorization: Bearer {{token}}
X-Cabinet-Id: {{cabinetId}}
```

**Response 200 OK:**
```json
{
  "data": {
    "default_commission_fbo_pct": 25.00,
    "default_commission_fbs_pct": 28.00,
    "acceptance_box_rate_per_liter": 1.70,
    "acceptance_pallet_rate": 500.00,
    "logistics_volume_tiers": [
      { "min": 0.001, "max": 0.2, "rate": 23 },
      { "min": 0.201, "max": 0.4, "rate": 26 },
      { "min": 0.401, "max": 0.6, "rate": 29 },
      { "min": 0.601, "max": 0.8, "rate": 30 },
      { "min": 0.801, "max": 1.0, "rate": 32 }
    ],
    "logistics_large_first_liter_rate": 46.00,
    "logistics_large_additional_liter_rate": 14.00,
    "return_logistics_fbo_rate": 50.00,
    "return_logistics_fbs_rate": 50.00,
    "storage_free_days": 60,
    "fbs_uses_fbo_logistics_rates": true,
    "effective_from": "2025-09-15"
  }
}
```

---

#### POST /v1/products/price-calculator

**Purpose**: Calculate recommended selling price based on target margin

```http
POST {{baseUrl}}/v1/products/price-calculator
Authorization: Bearer {{token}}
X-Cabinet-Id: {{cabinetId}}
Content-Type: application/json

{
  "target_margin_pct": 20,
  "cogs_rub": 1500,
  "logistics_forward_rub": 200,
  "logistics_reverse_rub": 150,
  "buyback_pct": 98,
  "advertising_pct": 5,
  "storage_rub": 50,
  "commission_pct": 10,
  "vat_pct": 20,
  "acquiring_pct": 1.8
}
```

**Response 200 OK:**
```json
{
  "meta": {
    "cabinet_id": "cabinet-uuid",
    "calculated_at": "2026-01-20T10:30:00Z"
  },
  "result": {
    "recommended_price": 4057.87,
    "target_margin_pct": 20,
    "actual_margin_rub": 811.57,
    "actual_margin_pct": 20
  },
  "cost_breakdown": {
    "cogs": 1500.00,
    "logistics_forward": 200.00,
    "logistics_reverse_effective": 3.00,
    "logistics_total": 203.00,
    "storage": 50.00,
    "fixed_total": 1753.00
  },
  "percentage_breakdown": {
    "commission_wb": 405.79,
    "commission_pct": 10,
    "acquiring": 73.04,
    "advertising": 202.89,
    "vat": 811.57,
    "margin": 811.57,
    "percentage_total": 56.8
  },
  "intermediate_values": {
    "return_rate_pct": 2,
    "logistics_effective": 203.00,
    "total_percentage_rate": 56.8
  },
  "warnings": []
}
```

---

### 12.3 Data Mapping (UI Field → API Field → Endpoint)

| UI Field (Russian) | Form Field | API Field | Endpoint | Notes |
|--------------------|------------|-----------|----------|-------|
| Тип исполнения | `fulfillment_type` | determines commission field | - | `FBO` → `paidStorageKgvp`, `FBS` → `kgvpMarketplace` |
| Категория | `category_id` | `parentID` | `GET /commissions` | Use `parentID` for lookup |
| Комиссия WB | `commission_pct` | `paidStorageKgvp` / `kgvpMarketplace` | `GET /commissions` | Field depends on `fulfillment_type` |
| Склад | `warehouse_id` | `id` | `GET /warehouses` | Store `id` for coefficients lookup |
| Логистика коэф. | `logistics_coefficient` | `delivery.coefficient` | `GET /acceptance/coefficients` | Auto-fill on warehouse selection |
| Хранение коэф. | `storage_coefficient` | `storage.coefficient` | `GET /acceptance/coefficients` | FBO only |
| Приёмка коэф. | `acceptance_coefficient` | `coefficient` | `GET /acceptance/coefficients` | FBO only, -1 means unavailable |
| Объём (л) | auto-calculated | `volumeLiters` | `GET /settings/logistics` | `(L × W × H) / 1000` |
| Базовая логистика | auto-calculated | `rate_rub` | `GET /settings/logistics` | Or use `logistics_volume_tiers` client-side |

### Commission Field Mapping by Fulfillment Type

```typescript
const COMMISSION_FIELD_MAP = {
  FBO: 'paidStorageKgvp',      // Fulfillment by WB
  FBS: 'kgvpMarketplace',      // Fulfillment by Seller
  DBS: 'kgvpSupplier',         // Delivery by Seller (future)
  EDBS: 'kgvpSupplierExpress', // Express DBS (future)
};

// Usage
const commissionPct = categoryData[COMMISSION_FIELD_MAP[fulfillmentType]];
```

---

### 12.4 Caching Strategy (Backend → Frontend)

| Endpoint | Cache Key Pattern | TTL | Frontend Strategy |
|----------|-------------------|-----|-------------------|
| `GET /commissions` | `tariffs:commissions:{cabinetId}` | 24h | React Query `staleTime: 24h`, load once on mount |
| `GET /commissions/category/{id}` | `tariffs:category:{cabinetId}:{parentId}` | 24h | Derived from full list |
| `GET /warehouses` | `tariffs:offices:{cabinetId}` | 24h | React Query `staleTime: 24h`, load once on mount |
| `GET /warehouses/box` | `tariffs:box:{cabinetId}:{date}` | 1h | Refresh on date change |
| `GET /acceptance/coefficients` | `tariffs:acceptance:{cabinetId}:{warehouseId}` | 1h | Fetch on warehouse selection |
| `GET /settings` | `wb:tariff-settings:global` | 24h | React Query `staleTime: 24h`, load once |

**Frontend Caching Pattern:**
```typescript
// Query keys for consistent caching
export const tariffsQueryKeys = {
  all: ['tariffs'] as const,
  commissions: () => [...tariffsQueryKeys.all, 'commissions'] as const,
  warehouses: () => [...tariffsQueryKeys.all, 'warehouses'] as const,
  settings: () => [...tariffsQueryKeys.all, 'settings'] as const,
  acceptanceByWarehouse: (warehouseId: number) =>
    [...tariffsQueryKeys.all, 'acceptance', warehouseId] as const,
};

// Example hook
export function useCommissions() {
  return useQuery({
    queryKey: tariffsQueryKeys.commissions(),
    queryFn: getCommissions,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    gcTime: 24 * 60 * 60 * 1000,
  });
}
```

---

### 12.5 Rate Limits Reference

| Scope | Limit | Window | Endpoints | Recovery Strategy |
|-------|-------|--------|-----------|-------------------|
| `tariffs` | 10 req/min | 60s | commissions, warehouses, box | Batch requests, cache aggressively |
| `orders_fbw` | **6 req/min** | 60s | acceptance coefficients | Debounce 500ms, cache 1h |
| Standard | 600 req/min | 60s (burst 1200) | price-calculator | No special handling needed |

**Error Response (429 Too Many Requests):**
```json
{
  "statusCode": 429,
  "error": "Too Many Requests",
  "message": "Rate limit exceeded for orders_fbw scope. Retry after 10 seconds.",
  "retryAfter": 10
}
```

**Frontend Handling:**
```typescript
// Debounce warehouse selection to avoid rate limits
const debouncedFetchCoefficients = useDebouncedCallback(
  (warehouseId: number) => fetchAcceptanceCoefficients(warehouseId),
  500 // 500ms debounce
);

// Handle 429 errors
if (error.response?.status === 429) {
  const retryAfter = error.response.data.retryAfter || 10;
  toast.error(`Превышен лимит запросов. Повторите через ${retryAfter} сек.`);
}
```

---

### 12.6 Error Responses

| Status | Code | Cause | Frontend Handling |
|--------|------|-------|-------------------|
| 400 | `VALIDATION_ERROR` | Invalid input | Show field-specific errors |
| 401 | `UNAUTHORIZED` | Invalid/expired token | Redirect to login |
| 403 | `FORBIDDEN` | Cabinet access denied | Show access error |
| 429 | `Too Many Requests` | Rate limit exceeded | Show retry timer |
| 500 | `INTERNAL_ERROR` | Server error | Show generic error + retry |

---

## 13. References

- **Backend API Response**: [98-warehouses-tariffs-BACKEND-RESPONSE.md](../../request-backend/98-warehouses-tariffs-BACKEND-RESPONSE.md)
- **Tariffs API Test File**: [test-api/18-tariffs.http](../../../../test-api/18-tariffs.http)
- **Price Calculator API Test File**: [test-api/15-price-calculator.http](../../../../test-api/15-price-calculator.http)
- **Current Implementation**: `src/components/custom/price-calculator/`
- **Current Types**: `src/types/price-calculator.ts`
- **WB Tariffs API Docs**: https://dev.wildberries.ru/openapi/wb-tariffs
- **WB OrdersFBW API Docs**: https://dev.wildberries.ru/openapi/wb-fulfillment-supplies

---

## 14. Competitor Analysis & Missing Fields

### 14.1 Analysis Summary

**Date**: 2026-01-20
**Source**: Competitor price calculator screenshots analysis
**Identified Gaps**: 9 fields missing from current implementation

Competitor analysis revealed that professional WB price calculators include additional fields that significantly impact calculation accuracy. These fields are grouped by implementation priority.

---

### 14.2 HIGH PRIORITY Fields (Core functionality gaps)

These fields directly affect tariff calculation accuracy and should be implemented in Phase 1.

#### 14.2.1 Тип упаковки (Box Type)

| Attribute | Value |
|-----------|-------|
| Field | `box_type` |
| Type | Radio buttons / SegmentedControl |
| Options | `Короб` (Box) \| `Монопаллета` (Pallet) |
| Default | `Короб` |
| Applicability | FBO only |

**Business Impact**:
- WB has completely different tariff structures for box vs pallet deliveries
- Pallet deliveries have fixed acceptance rate (~500 ₽) vs per-liter box rate (~1.70 ₽/L)
- Incorrect type selection can result in 5-15% calculation error

**API Reference**: `GET /v1/tariffs/acceptance/available?boxTypeId={id}`
- `boxTypeId=2` → Короба (Boxes)
- `boxTypeId=5` → Монопаллеты (Pallets)

---

#### 14.2.2 Вес товара (Product Weight Threshold)

| Attribute | Value |
|-----------|-------|
| Field | `weight_exceeds_25kg` |
| Type | Checkbox |
| Label | "Превышает 25 кг" |
| Default | `false` |
| Applicability | FBO & FBS |

**Business Impact**:
- Heavy items (>25kg) have surcharge multiplier on logistics (typically 1.5-2x)
- Many sellers underestimate this impact on large/heavy goods
- Critical for furniture, appliances, sports equipment categories

**Calculation Impact**:
```typescript
const weight_multiplier = weight_exceeds_25kg ? 1.5 : 1.0
const logistics_adjusted = base_logistics * weight_multiplier
```

---

#### 14.2.3 Индекс локализации / КТР (Localization Index)

| Attribute | Value |
|-----------|-------|
| Field | `localization_index` (alias: `ktr_coefficient`) |
| Type | Number input |
| Default | `1.0` |
| Range | 0.5 - 3.0 |
| Applicability | FBO & FBS |

**Business Impact**:
- Regional delivery cost multiplier based on distance from warehouse to buyer
- Significantly affects remote regions (Siberia, Far East: 1.5-2.5x)
- Auto-filled from warehouse selection when available

**Source Options**:
1. Auto-fill from `delivery.coefficient` in `/v1/tariffs/acceptance/coefficients`
2. Manual override for specific regional targeting

---

#### 14.2.4 Оборачиваемость, дней (Turnover Days)

| Attribute | Value |
|-----------|-------|
| Field | `turnover_days` |
| Type | Number input |
| Default | `20` |
| Range | 1-365 |
| Applicability | FBO only |

**Business Impact**:
- Converts daily storage rate to total storage cost per unit sold
- Critical for slow-moving goods (cosmetics, seasonal items)
- Default 20 days reflects typical WB inventory turnover

**Calculation Impact**:
```typescript
// Current: User enters storage_rub directly
// New: Auto-calculate from daily rate × turnover days
const storage_per_day = volume_liters * storage_coefficient * 0.07 // base rate
const storage_total = storage_per_day * turnover_days
```

---

### 14.3 MEDIUM PRIORITY Fields (Additional costs)

These fields improve accuracy for sellers with specific cost structures.

#### 14.3.1 Логистика до МП (Logistics to Marketplace)

| Attribute | Value |
|-----------|-------|
| Field | `logistics_to_mp_rub` |
| Type | Number input with ₽ suffix |
| Default | `0` |
| Applicability | FBO & FBS |

**Business Impact**:
- Seller's cost to deliver goods TO WB warehouse (not WB logistics)
- Often forgotten in calculations leading to margin overestimation
- Includes: courier to WB, consolidation costs, regional delivery to WB

**Note**: This is BEFORE WB takes over - separate from WB logistics fees.

---

#### 14.3.2 Упаковка (Packaging Cost)

| Attribute | Value |
|-----------|-------|
| Field | `packaging_rub` |
| Type | Number input with ₽ suffix |
| Default | `0` |
| Applicability | FBO & FBS |

**Business Impact**:
- Cost of packaging materials per unit (boxes, bubble wrap, labels)
- Often 2-5% of COGS for fragile/premium items
- Should be added to fixed costs

---

#### 14.3.3 Тарифные опции WB (WB Tariff Options)

| Attribute | Value |
|-----------|-------|
| Field | `wb_tariff_options_pct` |
| Type | Number input |
| Default | `0` |
| Range | 0-20% |
| Applicability | FBO & FBS |

**Business Impact**:
- Additional WB services as percentage of price
- Includes: premium placement, priority logistics, promotional fees
- Often overlooked by new sellers

---

#### 14.3.4 Прочие расходы (Other Expenses)

| Attribute | Value |
|-----------|-------|
| Field | `other_expenses_rub` |
| Type | Number input with ₽ suffix |
| Default | `0` |
| Applicability | FBO & FBS |

**Business Impact**:
- Catch-all for miscellaneous per-unit expenses
- Examples: certification, product photography, EAN codes, quality control
- Helps achieve more accurate unit economics

---

### 14.4 LOW PRIORITY Fields (Advanced analytics)

These fields are for business planning and ROI analysis, not core price calculation.

#### 14.4.1 Инвестиции (Total Investment)

| Attribute | Value |
|-----------|-------|
| Field | `total_investment_rub` |
| Type | Number input with ₽ suffix |
| Default | - (optional) |
| Applicability | FBO & FBS |

**Business Impact**:
- For ROI calculation based on margin and expected sales volume
- Not required for price calculation
- Useful for business case validation

**Output**: ROI % = `(margin × expected_units) / total_investment × 100`

---

### 14.5 Implementation Priority Matrix

| Priority | Field | Effort | Impact | Phase |
|----------|-------|--------|--------|-------|
| HIGH | `box_type` | Low | High | Phase 1 |
| HIGH | `weight_exceeds_25kg` | Low | Medium | Phase 1 |
| HIGH | `localization_index` | Medium | High | Phase 1 |
| HIGH | `turnover_days` | Low | High | Phase 1 |
| MEDIUM | `logistics_to_mp_rub` | Low | Medium | Phase 2 |
| MEDIUM | `packaging_rub` | Low | Medium | Phase 2 |
| MEDIUM | `wb_tariff_options_pct` | Low | Low | Phase 2 |
| MEDIUM | `other_expenses_rub` | Low | Low | Phase 2 |
| LOW | `total_investment_rub` | Medium | Low | Phase 3 |

**Estimated Total Effort**:
- Phase 1 (HIGH): 3-4 story points
- Phase 2 (MEDIUM): 2-3 story points
- Phase 3 (LOW): 1-2 story points

---

### 14.6 Recommendations

1. **Phase 1 Implementation**: Prioritize HIGH fields as they directly impact calculation accuracy
2. **UI Organization**: Group new fields in collapsible "Advanced Options" section
3. **Defaults**: Use sensible defaults to maintain simplicity for basic use cases
4. **Tooltips**: Add explanatory tooltips for all new fields (Russian)
5. **Backend Sync**: Coordinate with backend team for any new API requirements

---

**Last Updated**: 2026-01-20
**Author**: Product Manager
