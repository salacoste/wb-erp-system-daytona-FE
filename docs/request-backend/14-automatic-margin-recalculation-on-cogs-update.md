# Request #14: Автоматический пересчёт маржи при обновлении COGS

**Дата создания:** 2025-11-24  
**Дата реализации:** 2025-01-26  
**Последнее обновление:** 2025-01-26 (missing_data_reason clarification)  
**Приоритет:** ✅ **RESOLVED** (Was: High - Blocks good UX)  
**Статус:** ✅ **COMPLETED** - Epic 20 Implementation Complete  
**Категория:** Epic 17 Analytics + Epic 18 COGS Management

**📋 Backend Response:** См. [14-automatic-margin-recalculation-on-cogs-update-backend.md](./14-automatic-margin-recalculation-on-cogs-update-backend.md) для инструкций по использованию и интеграции.

**⚠️ ВАЖНО**: Для актуальной информации о значениях `missing_data_reason` и структуре данных маржи, см. [Request #16](./16-cogs-history-and-margin-data-structure.md).

---

## 📋 Executive Summary

**Проблема:** После назначения COGS через UI, маржа не отображается в списке товаров. Таблица `weekly_margin_fact` остаётся пустой, т.к. backend не рассчитывает маржу автоматически.

**Impact:**
- 😞 **Плохой UX:** Пользователь назначил COGS → видит "— (нет продаж)" вместо маржи
- 📊 **Data inconsistency:** Таблица `cogs` заполнена, `weekly_margin_fact` пустая
- ❌ **Request #15 не работает:** `GET /v1/products?include_cogs=true` возвращает `null` для margin

**Ожидаемое поведение:** После назначения COGS, маржа должна автоматически рассчитаться и отобразиться в UI без дополнительных действий пользователя.

---

## 🎯 Пользовательские сценарии (User Flows)

### User Flow 1: Назначение COGS одному товару (текущая дата)

**Контекст:** Пользователь открыл страницу `/cogs`, выбрал товар без себестоимости, хочет назначить COGS.

#### Frontend → Backend:

**User Action:**
```
1. Открывает /cogs
2. Выбирает товар "Краска для мебели" (321678606)
3. Заполняет форму:
   - Себестоимость: 990 ₽
   - Дата начала: 2025-11-24 (сегодня)
   - Примечания: "Первоначальная себестоимость"
4. Нажимает "Назначить себестоимость"
```

**Frontend API Call:**
```http
POST /v1/products/321678606/cogs
Authorization: Bearer {jwt}
X-Cabinet-Id: {cabinet_id}
Content-Type: application/json

{
  "unit_cost_rub": 990,
  "valid_from": "2025-11-24",
  "source": "manual",
  "notes": "Первоначальная себестоимость"
}
```

#### Expected Backend Behavior:

**Step 1: Validate & Create COGS** ✅ (Already implemented)
```typescript
// src/products/products.service.ts
1. Validate product exists in WB API
2. Create COGS record in DB
3. Return ProductResponseDto with COGS data
```

**Step 2: Calculate Affected Weeks** 🔴 (NEEDS IMPLEMENTATION)
```typescript
// Determine which weeks need margin recalculation
// Logic: From valid_from date to current week

const affectedWeeks = calculateAffectedWeeks("2025-11-24");
// Result: ["2025-W47"] (только текущая неделя, т.к. valid_from = сегодня)
```

**Step 3: Enqueue Margin Recalculation Task** 🔴 (NEEDS IMPLEMENTATION)
```typescript
// src/products/products.service.ts
await this.taskQueue.add('recalculate_weekly_margin', {
  cabinetId: 'uuid',
  weeks: ["2025-W47"],
  priority: 'normal',
  reason: 'cogs_created',
  nmIds: ["321678606"], // optional optimization
});
```

**Step 4: Background Worker Processes Task** 🔴 (NEEDS IMPLEMENTATION)
```typescript
// src/queue/processors/margin-calculation.processor.ts
// For week 2025-W47:
1. Get all sales for week 2025-W47 and cabinetId
2. For each product with sales:
   - Find COGS valid on sale date (temporal lookup)
   - Calculate margin = (revenue - cogs) / revenue × 100%
3. Upsert into weekly_margin_fact table
4. Return { totalProducts, productsWithCogs, productsWithoutCogs }
```

#### Expected Response:

**Immediate Response (201 Created):**
```json
{
  "nm_id": "321678606",
  "sa_name": "Краска для мебели",
  "has_cogs": true,
  "cogs": {
    "id": "uuid",
    "unit_cost_rub": "990.00",
    "valid_from": "2025-11-24T00:00:00.000Z",
    "currency": "RUB",
    "notes": "Первоначальная себестоимость"
  },
  "current_margin_pct": null,  // ⚠️ Ещё не рассчитано (background task)
  "current_margin_period": null,
  "missing_data_reason": null  // Margin calculation in progress (Epic 20) - will be null until calculation completes
}
```

**After Background Task (3-5 seconds):**

When frontend refreshes or polls:
```http
GET /v1/products?include_cogs=true&limit=25
```

Response includes:
```json
{
  "products": [
    {
      "nm_id": "321678606",
      "sa_name": "Краска для мебели",
      "has_cogs": true,
      "cogs": {
        "unit_cost_rub": "990.00",
        "valid_from": "2025-11-24T00:00:00.000Z"
      },
      "current_margin_pct": 12.5,  // ✅ Рассчитано!
      "current_margin_period": "2025-W47",
      "current_margin_sales_qty": 10,
      "current_margin_revenue": 15000.00,
      "missing_data_reason": null
    }
  ]
}
```

#### Expected Data State:

**Table `cogs`:**
```sql
SELECT * FROM cogs WHERE nm_id = '321678606';
-- 1 row: unit_cost_rub=990, valid_from=2025-11-24, valid_to=NULL
```

**Table `weekly_margin_fact`:**
```sql
SELECT * FROM weekly_margin_fact WHERE nm_id = '321678606' AND week = '2025-W47';
-- 1 row: margin_percent=12.5, cogs_rub=9900, revenue_net_rub=15000
```

**Table `tasks`:**
```sql
SELECT * FROM tasks WHERE task_type = 'recalculate_weekly_margin' ORDER BY created_at DESC LIMIT 1;
-- 1 row: status='completed', payload={ cabinetId, weeks: ['2025-W47'] }
```

---

### User Flow 2: Назначение COGS с исторической датой

**Контекст:** Пользователь хочет назначить COGS задним числом для пересчёта маржи за прошлые периоды.

#### Frontend → Backend:

**User Action:**
```
1. Выбирает товар "Краска для мебели" (321678606)
2. Заполняет форму:
   - Себестоимость: 990 ₽
   - Дата начала: 2025-10-10 (6 недель назад!)
   - Примечания: "Историческая версия"
3. Нажимает "Назначить"
```

**Frontend API Call:**
```http
POST /v1/products/321678606/cogs

{
  "unit_cost_rub": 990,
  "valid_from": "2025-10-10",  // 6 недель назад
  "source": "manual",
  "notes": "Историческая версия"
}
```

#### Expected Backend Behavior:

**Step 2: Calculate Affected Weeks** 🔴 (NEEDS IMPLEMENTATION)
```typescript
const affectedWeeks = calculateAffectedWeeks("2025-10-10");
// Result: ["2025-W41", "2025-W42", "2025-W43", "2025-W44", "2025-W45", "2025-W46", "2025-W47"]
// 7 недель от valid_from до сегодня
```

**Step 3: Enqueue Task для ВСЕХ затронутых недель** 🔴
```typescript
await this.taskQueue.add('recalculate_weekly_margin', {
  cabinetId: 'uuid',
  weeks: ["2025-W41", "2025-W42", "2025-W43", "2025-W44", "2025-W45", "2025-W46", "2025-W47"],
  priority: 'normal',
  reason: 'cogs_backdated',
  nmIds: ["321678606"],
});
```

**Step 4: Background Worker пересчитывает ВСЕ недели** 🔴
```typescript
// For EACH week in ["2025-W41", "2025-W42", ..., "2025-W47"]:
1. Get sales for that week
2. Apply temporal COGS lookup (finds COGS with valid_from=2025-10-10 for all weeks)
3. Calculate margin
4. Upsert weekly_margin_fact
```

#### Expected Response & Data State:

**Immediate Response:** Same as Flow 1 (201 Created with `missing_data_reason: null` - calculation in progress via Epic 20)

**After Background Task (20-30 seconds for 7 weeks):**

**Table `weekly_margin_fact`:**
```sql
SELECT week, margin_percent FROM weekly_margin_fact
WHERE nm_id = '321678606' AND week >= '2025-W41'
ORDER BY week;

-- 7 rows:
-- 2025-W41 | 10.5%
-- 2025-W42 | 11.2%
-- 2025-W43 | 12.1%
-- 2025-W44 | 13.0%
-- 2025-W45 | 11.8%
-- 2025-W46 | 12.3%
-- 2025-W47 | 12.5%
```

**UI Updates:**
- Product list now shows margin for all 7 weeks of data
- Analytics graphs show historical margin trends

---

### User Flow 3: Обновление существующей COGS (та же дата)

**Контекст:** Пользователь исправляет опечатку в COGS (например, ввёл 1110 вместо 111).

#### Frontend → Backend:

**User Action:**
```
1. Выбирает товар с существующей COGS
   Текущая COGS: 1110 ₽ с 2025-11-24
2. Изменяет себестоимость на 111 ₽
3. Оставляет ТУ ЖЕ дату: 2025-11-24
4. Нажимает "Обновить себестоимость"
```

**Frontend API Call:**
```http
POST /v1/products/321678606/cogs

{
  "unit_cost_rub": 111,  // Исправленное значение
  "valid_from": "2025-11-24",  // ТА ЖЕ ДАТА!
  "source": "manual",
  "notes": "Исправление опечатки"
}
```

#### Expected Backend Behavior:

**Step 1: UPDATE existing COGS** ✅ (Already implemented - Request #12)
```typescript
// src/cogs/services/cogs.service.ts
// Find existing COGS with (nm_id=321678606, valid_from=2025-11-24)
const existing = await this.prisma.cogs.findUnique({
  where: {
    idx_cogs_nm_id_valid_from: {
      nmId: "321678606",
      validFrom: new Date("2025-11-24"),
    },
  },
});

// UPDATE instead of creating new
await this.prisma.cogs.update({
  where: { id: existing.id },
  data: {
    unitCostRub: 111,  // Updated value
    notes: "Исправление опечатки",
    updatedAt: new Date(),
  },
});
```

**Step 2: Enqueue Margin Recalculation** 🔴 (NEEDS IMPLEMENTATION)
```typescript
// COGS изменилась → margin для 2025-W47 нужно пересчитать!
await this.taskQueue.add('recalculate_weekly_margin', {
  cabinetId: 'uuid',
  weeks: ["2025-W47"],  // Только затронутая неделя
  priority: 'high',  // Higher priority for updates
  reason: 'cogs_updated',
  nmIds: ["321678606"],
});
```

#### Expected Data State:

**Table `cogs`:**
```sql
-- STILL 1 row (updated, not created new)
SELECT * FROM cogs WHERE nm_id = '321678606';
-- unit_cost_rub=111 (changed from 1110)
-- valid_from=2025-11-24 (unchanged)
-- updated_at=2025-11-24T14:30:00 (fresh timestamp)
```

**Table `weekly_margin_fact`:**
```sql
-- Updated with NEW margin based on corrected COGS
SELECT * FROM weekly_margin_fact WHERE nm_id = '321678606' AND week = '2025-W47';
-- margin_percent=87.5% (instead of 1.2% with wrong COGS 1110)
```

---

### User Flow 4: Создание новой версии COGS (новая дата)

**Контекст:** Поставщик повысил цену, нужна новая версия COGS с новой датой.

#### Frontend → Backend:

**User Action:**
```
1. Товар имеет COGS: 990 ₽ с 2025-11-24
2. Пользователь создаёт новую версию:
   - Себестоимость: 1050 ₽ (новая цена)
   - Дата начала: 2025-12-01 (будущая дата)
   - Примечания: "Повышение цен поставщиком"
3. Нажимает "Назначить"
```

**Frontend API Call:**
```http
POST /v1/products/321678606/cogs

{
  "unit_cost_rub": 1050,
  "valid_from": "2025-12-01",  // НОВАЯ дата (в будущем)
  "source": "manual"
}
```

#### Expected Backend Behavior:

**Step 1: Create NEW version** ✅ (Already works)
```typescript
// Existing COGS NOT found with valid_from=2025-12-01
// → Create NEW row
await this.prisma.cogs.create({
  data: {
    nmId: "321678606",
    unitCostRub: 1050,
    validFrom: new Date("2025-12-01"),
    validTo: null,  // New current version
  },
});
```

**Step 2: Close old version** 🔴 (NEEDS IMPLEMENTATION?)
```typescript
// OLD version should be closed?
// UPDATE cogs SET valid_to = '2025-12-01'
// WHERE nm_id = '321678606' AND valid_from = '2025-11-24' AND valid_to IS NULL

// ⚠️ Question for backend: Should we auto-close old versions?
```

**Step 3: Enqueue Margin Recalculation** 🔴 (NEEDS IMPLEMENTATION)
```typescript
// Если valid_from в будущем → enqueue НЕ нужен (нет sales data yet)
if (new Date(dto.valid_from) <= new Date()) {
  const affectedWeeks = calculateAffectedWeeks(dto.valid_from);
  await this.taskQueue.add('recalculate_weekly_margin', { ... });
}
```

#### Expected Data State:

**Table `cogs`:**
```sql
SELECT * FROM cogs WHERE nm_id = '321678606' ORDER BY valid_from;

-- 2 rows (версионирование):
-- Row 1: unit_cost=990,  valid_from=2025-11-24, valid_to=2025-12-01  (closed)
-- Row 2: unit_cost=1050, valid_from=2025-12-01, valid_to=NULL        (current)
```

**Table `weekly_margin_fact`:**
```sql
-- No changes yet (valid_from в будущем)
-- When week 2025-W48 starts, margin будет рассчитана с COGS 1050
```

---

### User Flow 5: Bulk COGS Assignment

**Контекст:** Пользователь загружает себестоимость для 500 товаров через bulk upload.

#### Frontend → Backend:

**User Action:**
```
1. Открывает страницу bulk COGS upload
2. Загружает CSV с 500 товарами
3. Нажимает "Загрузить"
```

**Frontend API Call:**
```http
POST /v1/products/cogs/bulk

{
  "items": [
    { "nm_id": "321678606", "unit_cost_rub": 990, "valid_from": "2025-10-10" },
    { "nm_id": "147205694", "unit_cost_rub": 22, "valid_from": "2025-10-10" },
    // ... 498 more items ...
  ]
}
```

#### Expected Backend Behavior:

**Step 1: Validate & Create COGS** ✅ (Already implemented)
```typescript
// For each item:
1. Validate product exists
2. Create/update COGS
3. Return summary: { created: 480, updated: 20, errors: 0 }
```

**Step 2: Calculate Affected Weeks (AGGREGATED)** 🔴 (NEEDS IMPLEMENTATION)
```typescript
// IMPORTANT: Don't create 500 separate tasks!
// Aggregate all affected weeks across ALL items

const allAffectedWeeks = new Set<string>();

for (const item of dto.items) {
  const weeks = calculateAffectedWeeks(item.valid_from);
  weeks.forEach(w => allAffectedWeeks.add(w));
}

// Result: ["2025-W41", "2025-W42", ..., "2025-W47"] (unique weeks only)
```

**Step 3: Enqueue SINGLE Batch Task** 🔴 (NEEDS IMPLEMENTATION)
```typescript
// ONE task for all products and weeks
await this.taskQueue.add('recalculate_weekly_margin_batch', {
  cabinetId: 'uuid',
  weeks: Array.from(allAffectedWeeks),  // 7 weeks
  priority: 'low',  // Bulk = lower priority
  reason: 'bulk_cogs_assignment',
  // nmIds: NOT specified → recalculate ALL products in these weeks
});
```

**Step 4: Background Worker (Batch Processing)** 🔴 (NEEDS IMPLEMENTATION)
```typescript
// Process ALL weeks in single job
for (const week of job.data.weeks) {
  await this.marginCalculator.calculateWeeklyMargin(week, cabinetId);
  // This recalculates margin for ALL products with sales in this week
}
```

#### Expected Response:

**Immediate Response (202 Accepted):**
```json
{
  "task_id": "uuid-here",
  "summary": {
    "total_items": 500,
    "created": 480,
    "updated": 20,
    "errors": 0
  },
  "margin_calculation_status": "enqueued",
  "estimated_completion_seconds": 45
}
```

#### Expected Data State:

**Table `cogs`:**
```sql
SELECT COUNT(*) FROM cogs;
-- 500 rows created/updated
```

**Table `weekly_margin_fact`:**
```sql
-- After background job completes (~45 seconds)
SELECT week, COUNT(*) as products FROM weekly_margin_fact
WHERE cabinet_id = 'uuid' AND week >= '2025-W41'
GROUP BY week;

-- 7 weeks × ~150 products with sales = ~1050 margin records
```

---

### User Flow 6: Просмотр списка товаров с маржой

**Контекст:** Пользователь открывает страницу `/cogs` после назначения COGS.

#### Frontend → Backend:

**User Action:**
```
1. Открывает /cogs
2. ProductList component рендерится с enableMarginDisplay={true}
```

**Frontend API Call:**
```http
GET /v1/products?limit=25&include_cogs=true
```

#### Expected Backend Behavior:

**Current Implementation** ✅ (Request #15 - already works)
```typescript
// src/products/products.service.ts
1. Get products from WB API
2. Get current COGS for each product
3. Get margin data from weekly_margin_fact (last week)
4. Merge and return ProductListResponseDto
```

**Expected:** Margin data должна быть доступна, если:
- ✅ COGS assigned
- ✅ Sales data exists for last week
- ✅ **weekly_margin_fact populated** ← This happens AUTOMATICALLY after Flow 1-5

#### Expected Response:

```json
{
  "products": [
    {
      "nm_id": "321678606",
      "sa_name": "Краска для мебели",
      "has_cogs": true,
      "current_margin_pct": 12.5,  // ✅ Available!
      "current_margin_period": "2025-W47",
      "current_margin_sales_qty": 10,
      "current_margin_revenue": 15000.00,
      "missing_data_reason": null
    },
    {
      "nm_id": "999999",
      "sa_name": "Товар без продаж",
      "has_cogs": true,
      "current_margin_pct": null,
      "missing_data_reason": "NO_SALES_IN_PERIOD"
    }
  ]
}
```

---

### User Flow 7: Real-time UI Update после назначения COGS

**Контекст:** Пользователь назначил COGS и хочет сразу увидеть маржу.

#### Frontend Behavior:

**Option 1: Polling (Recommended for MVP)**
```typescript
// After COGS assignment
const response = await apiClient.post(`/v1/products/${nmId}/cogs`, cogs);

// Poll for margin data
let attempts = 0;
const maxAttempts = 10;

const pollInterval = setInterval(async () => {
  const product = await apiClient.get(`/v1/products/${nmId}`);

  if (product.current_margin_pct !== null || attempts >= maxAttempts) {
    clearInterval(pollInterval);
    queryClient.invalidateQueries(['products']);

    if (product.current_margin_pct !== null) {
      toast.success(`Маржа: ${product.current_margin_pct.toFixed(2)}%`);
    }
  }

  attempts++;
}, 3000); // Poll every 3 seconds
```

**Option 2: Optimistic UI (Better UX)**
```typescript
// After COGS assignment
toast.info('Себестоимость назначена. Расчёт маржи начат...');

// Auto-refresh after expected completion time
setTimeout(() => {
  queryClient.invalidateQueries(['products']);
  toast.success('Маржа обновлена!');
}, 5000); // 5 seconds for single product
```

**Option 3: WebSocket (Future Enhancement)**
```typescript
// Backend emits event when margin calculated
socket.on('margin:calculated', (data) => {
  if (data.nmId === selectedProduct.nm_id) {
    queryClient.invalidateQueries(['products']);
    toast.success(`Маржа рассчитана: ${data.marginPercent}%`);
  }
});
```

#### Backend Support Needed:

**For Option 1 & 2:** Already works (no changes needed)

**For Option 3:** 🔴 (Future enhancement)
```typescript
// After margin calculation completes
this.websocketGateway.emit('margin:calculated', {
  cabinetId,
  nmId,
  week,
  marginPercent,
});
```

---

## 🔧 Детали реализации для Backend

### 1. Helper: Calculate Affected Weeks

```typescript
// src/analytics/helpers/affected-weeks.helper.ts
export function calculateAffectedWeeks(validFrom: string | Date): string[] {
  const startDate = new Date(validFrom);
  const today = new Date();
  const weeks: string[] = [];

  // Only include weeks that are in the past or current
  if (startDate > today) {
    return []; // Future date → no weeks to recalculate yet
  }

  let current = new Date(startDate);
  while (current <= today) {
    weeks.push(getIsoWeek(current)); // "2025-W47"
    current.setDate(current.getDate() + 7);
  }

  return [...new Set(weeks)]; // Deduplicate
}
```

### 2. Task Enqueue Logic

```typescript
// src/products/products.service.ts
private async enqueueMarginRecalculation(
  cabinetId: string,
  validFrom: string,
  nmIds?: string[],
) {
  const affectedWeeks = calculateAffectedWeeks(validFrom);

  if (affectedWeeks.length === 0) {
    this.logger.log('No weeks to recalculate (future valid_from date)');
    return;
  }

  await this.taskQueue.add('recalculate_weekly_margin', {
    cabinetId,
    weeks: affectedWeeks,
    nmIds: nmIds || undefined,  // Optional: only these products
    priority: nmIds?.length === 1 ? 'normal' : 'low',
    enqueuedAt: new Date().toISOString(),
  }, {
    jobId: `margin-${cabinetId}-${Date.now()}`,
    removeOnComplete: true,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  });

  this.logger.log(`Enqueued margin recalculation for ${affectedWeeks.length} weeks`);
}
```

### 3. Call from assignCogsToProduct

```typescript
// src/products/products.service.ts
async assignCogsToProduct(...) {
  // ... existing logic ...

  // Create COGS
  await this.cogsService.createCogs(cogsDto, userId);

  // 🔴 NEW: Auto-trigger margin recalculation
  await this.enqueueMarginRecalculation(
    cabinetId,
    dto.valid_from,
    [nmId],  // Single product
  );

  // Return full product details
  return this.getProduct(cabinetId, nmId);
}
```

### 4. Call from bulkAssignCogs

```typescript
// src/products/products.service.ts
async bulkAssignCogs(...) {
  // ... existing logic ...

  // Upload all COGS
  const result = await this.cogsService.bulkUpload(itemsWithProductInfo, userId);

  // 🔴 NEW: Aggregate affected weeks
  const allAffectedWeeks = new Set<string>();
  dto.items.forEach(item => {
    const weeks = calculateAffectedWeeks(item.valid_from);
    weeks.forEach(w => allAffectedWeeks.add(w));
  });

  // Enqueue single batch task
  if (allAffectedWeeks.size > 0) {
    await this.taskQueue.add('recalculate_weekly_margin_batch', {
      cabinetId,
      weeks: Array.from(allAffectedWeeks),
      priority: 'low',
    });
  }

  return result;
}
```

### 5. Task Processor

```typescript
// src/queue/processors/margin-calculation.processor.ts
@Processor('recalculate_weekly_margin')
export class MarginCalculationProcessor {
  @Process()
  async processMarginRecalculation(job: Job) {
    const { cabinetId, weeks, nmIds } = job.data;

    this.logger.log(`Processing margin for ${weeks.length} weeks`);

    for (const week of weeks) {
      try {
        // Use existing MarginCalculationService
        const result = await this.marginCalculationService.calculateWeeklyMargin(
          week,
          cabinetId,
          nmIds,  // Optional: filter to specific products
        );

        this.logger.log(`✅ Week ${week}: ${result.productsWithCogs} products`);
      } catch (error) {
        this.logger.error(`❌ Week ${week} failed:`, error.message);
        // Continue with other weeks instead of failing entire job
      }
    }

    return { processed: weeks.length };
  }
}
```

---

## 📊 Performance Considerations

### Single Product Assignment
- **Affected weeks:** 1 week (if current date)
- **Calculation time:** 2-5 seconds
- **Priority:** Normal

### Historical Assignment (6 weeks back)
- **Affected weeks:** 7 weeks
- **Calculation time:** 20-30 seconds
- **Priority:** Normal

### Bulk Assignment (500 products)
- **Affected weeks:** 7 weeks (deduplicated)
- **Calculation time:** 45-60 seconds
- **Priority:** Low (background)

### Optimization: Skip if Already Fresh

```typescript
// Before recalculating, check if data already exists and is recent
const existing = await this.prisma.weeklyMarginFact.findFirst({
  where: { week, cabinetId },
  select: { updatedAt: true },
});

if (existing) {
  const hoursSinceUpdate = (Date.now() - existing.updatedAt.getTime()) / (1000 * 60 * 60);

  // Skip if calculated less than 1 hour ago (unless forced)
  if (hoursSinceUpdate < 1 && !force) {
    this.logger.log(`Skipping ${week} - calculated ${hoursSinceUpdate}h ago`);
    return;
  }
}
```

---

## ✅ Acceptance Criteria

### Must Have (Phase 1):

- [ ] После `POST /v1/products/:nmId/cogs` автоматически enqueue задача margin recalculation
- [ ] После `POST /v1/products/cogs/bulk` автоматически enqueue ОДНА batch задача (не 500 отдельных!)
- [ ] Background worker успешно обрабатывает задачи и заполняет `weekly_margin_fact`
- [ ] Margin data появляется в `GET /v1/products?include_cogs=true` после завершения background job
- [ ] Для single assignment: margin доступна в течение 10 секунд
- [ ] Для bulk assignment (500): margin доступна в течение 60 секунд
- [ ] Historical COGS (6 weeks back) пересчитывает ВСЕ затронутые недели

### Performance Requirements:

- [ ] Single week recalculation: ≤ 5 seconds (100-200 products)
- [ ] 7 weeks batch: ≤ 30 seconds
- [ ] Bulk assignment (500 products): ≤ 60 seconds до появления margin
- [ ] No duplicate tasks (idempotency через jobId)

### Error Handling:

- [ ] Failed margin calculation НЕ блокирует COGS assignment (202 Accepted always)
- [ ] Failed task автоматически retry (3 attempts with exponential backoff)
- [ ] Partial failures (1 week fails) НЕ останавливают обработку других недель
- [ ] Errors логируются в structured format для debugging

---

## 🧪 Testing Scenarios

### Test 1: Single COGS Current Date
```bash
POST /v1/products/321678606/cogs { valid_from: "2025-11-24", unit_cost: 990 }
→ Wait 10 seconds
→ GET /v1/products?include_cogs=true
→ Expect: current_margin_pct !== null
```

### Test 2: Historical COGS (6 weeks)
```bash
POST /v1/products/321678606/cogs { valid_from: "2025-10-10", unit_cost: 990 }
→ Wait 30 seconds
→ SELECT COUNT(*) FROM weekly_margin_fact WHERE nm_id = '321678606'
→ Expect: 7 rows (W41-W47)
```

### Test 3: Bulk Assignment
```bash
POST /v1/products/cogs/bulk { items: [...500 items...] }
→ Wait 60 seconds
→ SELECT COUNT(*) FROM weekly_margin_fact
→ Expect: ~1000+ rows (500 products × 2-3 avg weeks with sales)
```

### Test 4: Update Existing COGS
```bash
POST /v1/products/321678606/cogs { valid_from: "2025-11-24", unit_cost: 111 }  // Changed from 1110
→ Wait 10 seconds
→ SELECT margin_percent FROM weekly_margin_fact WHERE nm_id = '321678606' AND week = '2025-W47'
→ Expect: margin recalculated with NEW COGS value
```

---

## ❓ Questions для Backend Team

1. **Temporal versioning:** При создании новой версии COGS с будущей датой, нужно ли автоматически закрывать старую версию (`valid_to = new_valid_from`)?

2. **Priority queues:** Нужны ли отдельные queues для разных приоритетов или достаточно priority field в одной queue?

3. **Monitoring:** Какие метрики нужны для мониторинга margin calculation health? (success rate, latency, queue depth)

4. **Error recovery:** Если margin calculation failed, как пользователь должен узнать об этом? Toast notification? Email?

5. **Rate limiting:** Нужен ли rate limit на enqueue задач? (защита от спама если UI баг)

---

**Дата создания:** 2025-11-24
**Статус:** 🔴 Awaiting Backend Implementation
**Ожидаемое время реализации:** 1-2 sprints (8-12 hours estimated)
**Блокирует:** Good UX for COGS management, Full adoption of Request #15
