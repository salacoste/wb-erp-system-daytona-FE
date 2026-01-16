# Frontend Backlog - Available Tasks

**Last Updated**: 2025-12-29 09:30 MSK
**Team Status**: ✅ Available (Epic 37 + Epic 34-FE complete)

---

## ✅ Recently Completed

### Epic 34-FE: Telegram Notifications UI (DONE)
**Status**: ✅ 100% Complete (Production Ready)
**Date**: 2025-12-29
**Quality**: 100% tests passing (7 unit + 10 E2E + 30 manual QA)

**Delivered**:
- 8 UI components (/settings/notifications page)
- API integration layer (6 endpoints, SSR-safe)
- 3 React Query hooks
- Complete test suite (17 scenarios + 30 manual QA)
- Backend integration guide

**Remaining**: Backend API implementation (Request #73) - Backend team

**Documentation**:
- Changelog: `docs/CHANGELOG-EPIC-34-FE.md`
- Integration Guide: `docs/API-INTEGRATION-GUIDE-EPIC-34-FE.md`
- Epic: `docs/epics/epic-34-fe-telegram-notifications-ui.md`

---

## 🔧 Medium Priority Tasks

### 2. Request #15: includeCogs Parameter Enhancement
**Estimated**: 3-4 hours
**Status**: 📝 Pending Review
**Priority**: 🟡 P2 - Enhancement

**Description**: Add margin data to product list endpoint to show current margin alongside COGS.

**What it includes**:
- Update `GET /v1/products` to include margin fields
- Show current_margin_pct in product list table
- Display margin period and sales qty
- Handle missing data gracefully

**Why defer**:
- Nice-to-have UX improvement, not blocking
- Requires backend changes (not ready yet)
- Product list works without this enhancement

**Documentation**: `docs/request-backend/15-add-includecogs-to-product-list-endpoint.md`

---

### 3. Request #19: Margin Returned Without COGS
**Estimated**: 2-3 hours
**Status**: 📝 Pending Review
**Priority**: 🟡 P2 - Bug/Enhancement

**Description**: Fix edge case where margin endpoint returns data even when COGS is missing.

**What it includes**:
- Add validation to check COGS existence
- Return proper error/warning when COGS missing
- Update UI to show "COGS required" message

**Why defer**:
- Edge case, low impact (most products have COGS)
- Requires backend validation changes
- Current workaround exists (UI shows "—")

**Documentation**: `docs/request-backend/19-margin-returned-without-cogs.md`

---

### 4. Request #58: Retail Price Total Aggregation
**Estimated**: 4-5 hours
**Status**: 📝 Pending Review
**Priority**: 🟡 P2 - Enhancement

**Description**: Add total retail price aggregation to analytics endpoints.

**What it includes**:
- Sum of retail_price_with_discount across products
- Display in summary cards
- New column in tables

**Why defer**:
- Enhancement request, not core feature
- Requires backend aggregation logic
- Analytics work fine without this metric

**Documentation**: `docs/request-backend/58-retail-price-total-aggregation.md`

---

## 🧪 Testing & Quality Tasks

### 5. Epic 37 Phase 2: Manual QA (if needed)
**Estimated**: 7.5-11.5 hours
**Status**: 🚧 Assigned to QA team
**Priority**: QA team responsibility

**Description**: Manual testing tasks for Epic 37 (E2E, accessibility, performance, UAT).

**What it includes**:
- Execute E2E tests (1-2h)
- Execute accessibility tests (30min)
- Screen reader testing (2-3h)
- Performance testing (1-2h)
- UAT with 3 users (1-2h)
- Screenshot capture (30min)

**Why defer**:
- QA team handles this, not frontend dev
- Code is production-ready without Phase 2
- Phase 2 validates quality, doesn't add features

**Documentation**: `docs/stories/epic-37/QA-HANDOFF-PHASE-2.md`

---

## 📚 Documentation & Refactoring Tasks

### 6. Code Review & Documentation
**Estimated**: Variable (2-4 hours)
**Status**: Always available
**Priority**: 🟢 Maintenance

**What it includes**:
- Review open PRs
- Update technical documentation
- Write technical guides
- Code refactoring (technical debt)

**Examples**:
- Update README with new features
- Create developer onboarding guide
- Refactor shared components
- Improve TypeScript types

---

## 🚫 Blocked/Deferred Tasks

### Request #70: Category Brand True Operating Profit
**Status**: ❌ Blocked (requires backend)
**Estimated**: Unknown

### Request #59: Loyalty Fields Verification
**Status**: ❌ Blocked (requires WB API changes)
**Estimated**: Unknown

---

## 📊 Task Status Matrix

| Task | Estimated Effort | Business Value | Dependencies | Status |
|------|-----------------|----------------|--------------|--------|
| **Epic 34-FE** | 21 SP (7-10d) | ⭐⭐⭐⭐⭐ High | ⚠️ Backend API | ✅ DONE (waiting for backend) |
| Request #15 | 3-4h | ⭐⭐⭐ Medium | ⚠️ Backend | ⏳ Blocked |
| Request #19 | 2-3h | ⭐⭐ Low | ⚠️ Backend | ⏳ Blocked |
| Request #58 | 4-5h | ⭐⭐ Low | ⚠️ Backend | ⏳ Blocked |
| Epic 37 Phase 2 | 7.5-11.5h | ⭐⭐⭐ Medium | ✅ None | 🚧 QA team |
| Code Review | 2-4h | ⭐⭐⭐ Medium | ✅ None | ✅ Available |
| Technical Debt | Variable | ⭐⭐⭐ Medium | ✅ None | ✅ Available |

---

## 🎯 Recommendations (Current State)

### Status: All Frontend Development Complete! 🎉

**3 Epics Delivered in 3 Days**:
- ✅ Epic 36: Product Card Linking (100%)
- ✅ Epic 37: Merged Group Table (96%, production ready)
- ✅ Epic 34-FE: Telegram Notifications UI (100%, waiting for backend)

---

### Option 1: Code Review & Documentation ⭐ RECOMMENDED
**Estimated**: 2-4 hours
**Why now**:
- ✅ No blocking dependencies
- 📚 Consolidate knowledge from 3 epic deliveries
- 🧠 Knowledge transfer while fresh
- ⏱️ Flexible time commitment

**Suggested Activities**:
- Review Epic 37 code (MergedGroupTable component)
- Review Epic 34-FE code (Telegram Notifications UI)
- Update main README with new features
- Write MergedGroupTable usage guide
- Document Telegram Notifications setup
- Create developer onboarding guide

---

### Option 2: Technical Debt & Refactoring
**Estimated**: Variable (2-8 hours)
**Why now**:
- ✅ No blocking dependencies
- 🔧 Improve code quality after rapid development
- 🎯 Optimize performance
- 📦 Reduce bundle size

**Suggested Activities**:
- Refactor shared components
- Optimize TypeScript types
- Add PropTypes/JSDoc
- Code splitting improvements
- Dependency updates
- Accessibility improvements

---

### Option 3: Wait for Backend Team ⏳
**Backend Tasks Pending**:
1. **Epic 34 API (Request #73)** - Telegram Notifications backend
   - Frontend ready, needs backend API
   - Integration guide available
2. **Request #15, #19, #58** - Enhancement requests
   - All blocked by backend changes

**While Waiting**: Option 1 or Option 2

---

## 📝 Next Steps

**Current Situation**:
- ✅ Frontend dev **100% complete** for Epic 36, 37, 34-FE
- ⚠️ **All enhancement requests blocked** by backend team
- 🚧 QA team working on Epic 37 Phase 2

**Recommended Action**:
1. **Start with**: Code Review & Documentation (2-4h)
2. **Then**: Technical Debt & Refactoring (2-8h)
3. **Wait for**: Backend team to finish Epic 34 API (Request #73)

**Alternative**: Take a well-deserved break! Team delivered 3 epics in 3 days! 🎉

---

**Backlog Status**: 3 epics complete, all tasks blocked by backend
**Team Availability**: ✅ Frontend dev available
**Blocking Issues**: Backend API (Request #73) for Epic 34 integration
