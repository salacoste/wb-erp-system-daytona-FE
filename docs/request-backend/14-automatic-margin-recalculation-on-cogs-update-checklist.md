# Request #14: Backend Implementation Checklist

**Дата:** 2025-11-24
**Приоритет:** 🔴 High - Blocks COGS Management UX
**Команда:** Backend Team
**Estimated Effort:** 8-12 hours (1-1.5 days)

---

## 📚 Documentation Package

Вся необходимая документация готова для начала работы:

### 1. Quick Start (Обязательно прочитать первым)
📄 **`docs/HOW-COGS-MARGIN-SHOULD-WORK.md`**
- ⏱️ 5 минут чтения
- 🎯 Объясняет основной принцип работы системы
- 📊 3 ключевых сценария с ожидаемым поведением
- ✅ Acceptance criteria

### 2. Detailed Specification (Основная документация)
📄 **`frontend/docs/request-backend/14-automatic-margin-recalculation-on-cogs-update.md`**
- ⏱️ 30-40 минут изучения
- 🔍 7 детальных user flows с кодом
- 💻 Code examples для каждого компонента
- ⚡ Performance benchmarks
- 🧪 Testing scenarios

### 3. Related Documentation
- 📄 `frontend/docs/COGS-BACKDATING-BUSINESS-LOGIC.md` - Temporal COGS versioning
- 📄 `frontend/docs/request-backend/README.md` - Request index
- 📄 `docs/architecture/09-database-schema.md` - Database schema reference

---

## 🎯 Implementation Tasks

### Phase 1: Core Auto-Recalculation (6-8 hours)

- [ ] **Task 1.1:** Create `calculateAffectedWeeks()` helper function
  - Input: `valid_from` date
  - Output: Array of ISO weeks from `valid_from` to current week
  - Location: `src/cogs/utils/` or `src/analytics/utils/`

- [ ] **Task 1.2:** Create background task processor
  - New file: `src/queue/processors/margin-calculation.processor.ts`
  - Task type: `recalculate_weekly_margin`
  - Logic: Fetch sales → temporal COGS lookup → calculate margin → upsert `weekly_margin_fact`

- [ ] **Task 1.3:** Modify COGS assignment endpoints
  - File: `src/products/products.service.ts` (method `assignCogsToProduct`)
  - File: `src/cogs/cogs.service.ts` (if separate)
  - Add: Call `enqueueMarginRecalculation()` after COGS create/update

- [ ] **Task 1.4:** Create task enqueue service
  - New file: `src/analytics/services/margin-recalculation.service.ts`
  - Method: `enqueueMarginRecalculation(cabinetId, validFrom, nmIds?)`
  - Integrate with BullMQ queue

### Phase 2: Optimization & Edge Cases (2-4 hours)

- [ ] **Task 2.1:** Bulk COGS optimization
  - Single batch task for bulk operations (не N отдельных tasks)
  - Endpoint: `POST /v1/cogs/bulk` should trigger ONE task

- [ ] **Task 2.2:** Idempotency for margin recalculation
  - Use jobId based on `{cabinetId, week, reason}`
  - Prevent duplicate tasks for same week

- [ ] **Task 2.3:** Error handling & retry logic
  - Failed margin calculation НЕ блокирует COGS assignment
  - Auto-retry (3 attempts, exponential backoff)
  - Partial failures не останавливают другие недели

### Phase 3: Testing & Validation (2-3 hours)

- [ ] **Test 3.1:** Single COGS assignment (current date)
  - Margin появляется в течение 10 секунд ✅

- [ ] **Test 3.2:** Historical COGS (6 weeks back)
  - Все 7 недель пересчитаны в течение 30 секунд ✅

- [ ] **Test 3.3:** Bulk COGS (500 products)
  - Single task, margin в течение 60 секунд ✅

- [ ] **Test 3.4:** Request #15 integration
  - `GET /v1/products?include_cogs=true` возвращает margin data ✅

- [ ] **Test 3.5:** Temporal COGS lookup validation
  - Маржа использует COGS valid на дату продажи (не текущую дату) ✅

---

## 🔍 Key Technical Requirements

### Database Tables
```sql
-- Source data
cogs (nm_id, valid_from, valid_to, unit_cost_rub, ...)

-- Target data (populated by background worker)
weekly_margin_fact (week, cabinet_id, nm_id, revenue_net_rub, cogs_rub, profit_rub, margin_pct, ...)

-- Task tracking
tasks (task_uuid, task_type='recalculate_weekly_margin', ...)
```

### Formulas
```typescript
// Margin calculation
margin_percent = ((revenue_net - cogs_total) / revenue_net) × 100%

// Temporal COGS lookup
function findCogsForDate(nmId: string, saleDate: Date): number | null {
  return db.cogs.findFirst({
    where: {
      nm_id: nmId,
      valid_from: { lte: saleDate },
      OR: [
        { valid_to: null },
        { valid_to: { gt: saleDate } }
      ]
    },
    orderBy: { valid_from: 'desc' }
  })?.unit_cost_rub ?? null;
}

// Affected weeks calculation
function calculateAffectedWeeks(validFrom: string | Date): string[] {
  const startDate = new Date(validFrom);
  const today = new Date();
  const weeks: string[] = [];

  if (startDate > today) return []; // Future date → no recalc

  let current = new Date(startDate);
  while (current <= today) {
    weeks.push(getIsoWeek(current)); // e.g., "2025-W47"
    current.setDate(current.getDate() + 7);
  }

  return [...new Set(weeks)]; // Deduplicate
}
```

### Performance Targets
- Single week calculation: **≤ 5 seconds**
- 7 weeks batch: **≤ 30 seconds**
- Bulk 500 products: **≤ 60 seconds**
- No duplicate tasks (idempotency)

---

## ✅ Acceptance Criteria

### Must Have
- [ ] После создания COGS автоматически enqueue background task
- [ ] Background worker успешно рассчитывает margin
- [ ] Margin появляется в `GET /v1/products?include_cogs=true` автоматически
- [ ] Single product: margin доступна в течение 10 секунд
- [ ] Bulk (500): margin доступна в течение 60 секунд
- [ ] Historical COGS: пересчитываются ВСЕ затронутые недели

### Performance
- [ ] Single week calculation: ≤ 5 seconds
- [ ] 7 weeks batch: ≤ 30 seconds
- [ ] No duplicate tasks (idempotency)

### Error Handling
- [ ] Failed margin calculation НЕ блокирует COGS assignment
- [ ] Auto-retry (3 attempts with exponential backoff)
- [ ] Partial failures не останавливают обработку других недель

---

## 🚫 What NOT to Do

❌ **Не создавать 500 отдельных tasks при bulk upload**
✅ Вместо этого: ONE batch task с массивом nmIds

❌ **Не блокировать COGS assignment если margin calculation failed**
✅ Вместо этого: COGS сохраняется → task enqueued → async margin calculation

❌ **Не оставлять `weekly_margin_fact` пустой после COGS assignment**
✅ Вместо этого: Background worker заполняет таблицу автоматически

❌ **Не использовать текущую дату для temporal COGS lookup**
✅ Вместо этого: Искать COGS valid на дату продажи (sale_dt)

---

## 📞 Communication

### Questions & Clarifications
- **Frontend team contact:** See `frontend/docs/request-backend/README.md`
- **Documentation issues:** Create issue referencing Request #14
- **Technical questions:** Reference specific user flow number (1-7) from detailed spec

### Progress Updates
- [ ] Started implementation (update README.md status)
- [ ] Core tasks complete (Phase 1 done)
- [ ] Testing in progress (Phase 3)
- [ ] Ready for frontend integration testing
- [ ] Deployed to production

### Completion
When complete:
1. Update `frontend/docs/request-backend/README.md` → move Request #14 to "Resolved Requests"
2. Document actual effort vs. estimate
3. Notify frontend team for integration testing

---

## 🎯 Quick Summary

**Current State:**
- ✅ COGS assignment works
- ✅ Request #15 (`include_cogs=true`) works
- ❌ Margin calculation NOT automatic

**Needed:**
- 🔴 Auto-enqueue background task after COGS create/update
- 🔴 Background worker to process margin calculation
- 🔴 Populate `weekly_margin_fact` automatically

**Result:**
- ✨ Perfect UX: User assigns COGS → margin appears automatically
- ✨ No manual scripts needed
- ✨ Data consistency guaranteed

---

**Prepared by:** Frontend Team
**Date:** 2025-11-24
**Estimated Implementation Time:** 8-12 hours
**Priority:** High - Blocks good COGS management UX
