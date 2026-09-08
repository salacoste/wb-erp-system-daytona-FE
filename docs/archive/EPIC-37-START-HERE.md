# Epic 37: Start Here - Documentation Index

**Date**: 2025-12-29
**Status**: ✅ **READY FOR DEVELOPMENT** - All stories validated and approved
**Location**: `/frontend/docs/` (Frontend documentation)

---

## 🎯 Quick Start

Начинаешь работу над Epic 37? **Начни здесь!**

### 1. Прочитай Epic Document

📄 **File**: `docs/epics/epic-37-merged-group-table-display.md`

**Содержание**:

- Бизнес-контекст и ценность
- 3-tier rowspan table архитектура
- Epic 35/36 интеграция
- 5 stories breakdown (37.1-37.5)
- Визуальный mockup
- Success metrics

**Время**: 15-20 минут чтения

---

### 2. Прочитай Implementation Plan

📄 **File**: `docs/implementation-plans/epic-37-frontend-implementation-plan.md`

**Содержание**:

- Development strategy (параллельно с backend)
- Mock data approach (temporary)
- 5-phase implementation plan
- Timeline & dependencies
- Risk mitigation

**Время**: 10-15 минут чтения

---

### 3. Прочитай Mock Data Management Plan

📄 **File**: `docs/EPIC-37-MOCK-DATA-MANAGEMENT.md`

**Содержание**:

- ⚠️ **КРИТИЧНО**: Inventory всех mock файлов
- Процесс замены mock → real API (5 фаз)
- Cleanup checklist (что удалять, когда)
- Verification steps

**Время**: 5 минут чтения

---

### 4. Выполни Stories по Порядку

| Story    | File                                                                   | Effort | Status                       |
| -------- | ---------------------------------------------------------------------- | ------ | ---------------------------- |
| **37.1** | `docs/stories/epic-37/story-37.1-backend-api-validation.BMAD.md`       | 1-2h   | ⏳ BLOCKED (waiting backend) |
| **37.2** | `docs/stories/epic-37/story-37.2-merged-group-table-component.BMAD.md` | 3-4h   | ✅ CAN START NOW             |
| **37.3** | `docs/stories/epic-37/story-37.3-aggregate-metrics-display.BMAD.md`    | 2-3h   | After 37.2                   |
| **37.4** | `docs/stories/epic-37/story-37.4-visual-styling-hierarchy.BMAD.md`     | 2-3h   | After 37.3                   |
| **37.5** | `docs/stories/epic-37/story-37.5-testing-documentation.BMAD.md`        | 1-2h   | After 37.4                   |

**Порядок чтения**: 37.2 → 37.3 → 37.4 → 37.5 → 37.1 (validation в конце)

---

## 📁 Documentation Structure (Frontend)

```
frontend/docs/
│
├── epics/
│   └── epic-37-merged-group-table-display.md          # ← ГЛАВНЫЙ EPIC DOC
│
├── stories/epic-37/
│   ├── story-37.1-backend-api-validation.BMAD.md      # Validation (BLOCKED)
│   ├── story-37.2-merged-group-table-component.BMAD.md # Component (START HERE)
│   ├── story-37.3-aggregate-metrics-display.BMAD.md   # Metrics
│   ├── story-37.4-visual-styling-hierarchy.BMAD.md    # Styling
│   ├── story-37.5-testing-documentation.BMAD.md       # Testing
│   ├── story-37.6-post-mvp-enhancements.md            # Future (backlog)
│   ├── STORY-VALIDATION-REPORT-2025-12-29.md          # PO validation
│   ├── PO-VALIDATION-REPORT-EPIC-37.md                # PO approval
│   ├── CONVERSION-COMPLETE.md                         # Conversion notes
│   ├── api-response-sample-EXPECTED.json              # Expected API structure
│   └── api-response-sample-ACTUAL.json                # Current API structure
│
├── implementation-plans/
│   ├── epic-37-frontend-implementation-plan.md        # ← IMPLEMENTATION PLAN
│   └── epic-37-phase-0-completion-report.md           # Phase 0 done
│
├── request-backend/
│   └── 88-epic-37-individual-product-metrics.md       # Backend request (Story 37.0)
│
├── EPIC-37-MOCK-DATA-MANAGEMENT.md                    # ← MOCK DATA CLEANUP PLAN
└── EPIC-37-START-HERE.md                              # ← THIS FILE
```

---

## 🗂️ Code Files Structure (Frontend)

```
frontend/src/
│
├── types/advertising-analytics.ts
│   └── Epic 37 Types Added:
│       ├── MainProduct                    # Main product reference
│       ├── AggregateMetrics              # Group-level sums
│       ├── MergedGroupProduct            # Individual product metrics
│       └── AdvertisingGroup              # Complete group structure
│
├── config/features.ts
│   └── epic37MergedGroups:
│       ├── enabled: true                 # Feature flag
│       ├── useRealApi: false             # ⚠️ MOCK MODE (current)
│       └── debug: true                   # Development logging
│
├── mocks/
│   ├── data/
│   │   └── epic-37-merged-groups.ts      # ⚠️ TEMPORARY MOCK DATA
│   │       ├── mockMergedGroup1          # Normal group (6 products)
│   │       ├── mockMergedGroup2          # Small group (2 products)
│   │       ├── mockStandaloneProduct     # Standalone (imtId=null)
│   │       └── Validation utilities      # Data integrity helpers
│   │
│   └── handlers/
│       └── advertising.ts                # ⚠️ TO UPDATE: Add mock handler
│
└── components/advertising/               # ⏳ TO CREATE in Story 37.2
    └── MergedGroupTable.tsx
```

---

## ⚠️ Mock Data Locations (TEMPORARY FILES)

**Критично**: Эти файлы **ОБЯЗАТЕЛЬНЫ к удалению** после интеграции с backend!

### Mock Data Files

1. **Primary Mock Data**:
   - `src/mocks/data/epic-37-merged-groups.ts` ← **DELETE after Story 37.1 validation PASS**

2. **Mock Usage Locations**:
   - `src/mocks/handlers/advertising.ts` ← **REMOVE mock handler code**
   - `src/app/(dashboard)/analytics/advertising/page.tsx` ← **REMOVE mock import**
   - `src/components/advertising/MergedGroupTable.tsx` ← **REMOVE mock import**

3. **Feature Flag**:
   - `src/config/features.ts` ← **UPDATE default: useRealApi=true** (keep file)

### How to Find All Mock References

```bash
# Search for all Epic 37 mock data usages
grep -r "epic-37-merged-groups" src/
grep -r "mockMergedGroup" src/
grep -r "MOCK DATA" src/ | grep -i epic-37

# Expected after cleanup: No results
```

### Cleanup Process

📖 **See**: `docs/EPIC-37-MOCK-DATA-MANAGEMENT.md` - Complete deletion checklist

---

## 🚀 Development Workflow

### Option A: Start Immediately (Recommended)

**What**: Начать Stories 37.2-37.5 с mock данными (параллельно с backend)

**How**:

1. ✅ Phase 0 COMPLETE (mock data ready)
2. 🚀 Start Story 37.2 (MergedGroupTable Component) - uses mock data
3. Continue Story 37.3-37.5 - uses mock data
4. ⏳ Wait for backend Story 37.0 complete
5. Execute Story 37.1 (API Validation) - test real API
6. 🔀 Switch to real API (`useRealApi=true`)
7. 🗑️ Delete all mock files

**Timeline**: 4-5 days frontend + 2-3 days backend = **1 week total**

---

### Option B: Wait for Backend (Not Recommended)

**What**: Ждать готовности backend перед началом frontend разработки

**Timeline**: +3-5 days delay

**Cons**: ❌ Slower delivery, ❌ No parallel development

---

## 📊 Current Status

### ✅ COMPLETE

- [x] Epic 37 document created and validated (9.8/10)
- [x] 5 BMad stories created and validated (9.6/10 average)
- [x] Implementation plan created
- [x] Mock data created (3 test groups)
- [x] Feature flags configured
- [x] TypeScript types updated
- [x] Mock data management plan created

### ⏳ IN PROGRESS

- [ ] Backend Story 37.0 (Request #88) - Backend team working
- [ ] Story 37.2: MergedGroupTable Component - Ready to start

### 🚫 BLOCKED

- [ ] Story 37.1: Backend API Validation - Waiting for Story 37.0

---

## 🎯 Next Actions (Choose Path)

### If Starting Development Now (Recommended):

```bash
# 1. Verify Phase 0 complete
cat docs/implementation-plans/epic-37-phase-0-completion-report.md

# 2. Read Story 37.2
cat docs/stories/epic-37/story-37.2-merged-group-table-component.BMAD.md

# 3. Start coding
# - Create MergedGroupTable.tsx component
# - Use mock data from src/mocks/data/epic-37-merged-groups.ts
# - Follow Story 37.2 acceptance criteria
```

### If Waiting for Backend:

```bash
# Monitor backend progress
# Wait for notification: "Story 37.0 COMPLETE"
# Then start with Story 37.1 (API Validation)
```

---

## 📞 Coordination Points

### Daily Sync with Backend Team

**Question**: "Story 37.0 (Request #88) status?"

**Expected Responses**:

- "In progress, 60% complete" → Continue frontend development with mock
- "Complete, deployed to staging" → Execute Story 37.1 validation
- "Blocked by X" → Continue mock development, coordinate on blocker

### Integration Handoff (After Story 37.0)

**Backend provides**:

1. Notification: "Story 37.0 COMPLETE"
2. Test endpoint URL (staging)
3. Sample response JSON
4. Auth credentials for testing

**Frontend executes**:

1. Story 37.1: API Validation (1-2h)
2. Integration testing
3. Switch feature flag to real API
4. Delete mock data files
5. Verify all features work

---

## 📚 Additional Resources

### Epic Dependencies

- ✅ **Epic 36**: Product Card Linking (backend complete)
- ✅ **Epic 35**: Total Sales & Organic Split (backend complete)

### Related Requests

- **Request #83**: Epic 36 API Contract (current FLAT structure)
- **Request #87**: imtId field in SKU mode (Epic 36)
- **Request #88**: Epic 37 Individual Product Metrics (Story 37.0)

### Validation Reports

- `docs/stories/epic-37/STORY-VALIDATION-REPORT-2025-12-29.md` - All 5 stories validated
- `docs/stories/epic-37/PO-VALIDATION-REPORT-EPIC-37.md` - PO approval
- `docs/stories/epic-37/api-validation-report-37.1.md` - API structure analysis

---

## ❓ Common Questions

### Q: Когда можно начинать разработку?

**A**: **СЕЙЧАС!** Stories 37.2-37.5 не блокированы, используют mock данные.

### Q: Нужно ли ждать backend?

**A**: **НЕТ!** Разрабатывай параллельно с mock данными. Story 37.1 (validation) сделаешь когда backend готов.

### Q: Где хранятся mock данные?

**A**: `src/mocks/data/epic-37-merged-groups.ts` - **единственный источник** mock данных.

### Q: Когда удалять mock данные?

**A**: После успешной валидации Story 37.1 + интеграции с real API. См. `docs/EPIC-37-MOCK-DATA-MANAGEMENT.md`.

### Q: Как переключиться на real API?

**A**: Установить `NEXT_PUBLIC_EPIC_37_USE_REAL_API=true` в `.env.local`.

### Q: Что делать если backend затягивается?

**A**: Продолжать разработку с mock данными. Frontend работает независимо.

---

## 📋 Development Checklist

### Before Starting

- [ ] Read Epic 37 main document (15 min)
- [ ] Read Implementation Plan (10 min)
- [ ] Read Mock Data Management Plan (5 min)
- [ ] Verify Phase 0 complete (mock data + feature flags ready)

### During Development

- [ ] Follow BMad story order: 37.2 → 37.3 → 37.4 → 37.5
- [ ] Use mock data from `src/mocks/data/epic-37-merged-groups.ts`
- [ ] Document any mock data usage with `⚠️ TEMPORARY` comments
- [ ] Include references to cleanup plan in all mock-related code

### After Backend Ready

- [ ] Execute Story 37.1 (API Validation)
- [ ] Switch to real API (`useRealApi=true`)
- [ ] Delete all mock data files (see cleanup checklist)
- [ ] Verify integration works
- [ ] Mark Epic 37 COMPLETE

---

**Created**: 2025-12-29
**Owner**: Frontend Dev Team
**Next Review**: After Story 37.2 complete
