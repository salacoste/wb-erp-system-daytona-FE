# Sprint Planning: Q1 2026 - Orders & Supplies Module

**Planning Date**: 2026-01-29
**Total Scope**: 99 SP across 27 stories
**Estimated Duration**: 6 sprints (2-week sprints)

---

## Executive Summary

| Epic | Stories | SP | Priority | Sprints |
|------|---------|---:|----------|---------|
| Epic 40.9-FE | 7 | 26 | P0 Foundation | 1-2 |
| Epic 53-FE | 8 | 34 | P1 High Value | 3-4 |
| Epic 51-FE | 12 | 39 | P2 Enhancement | 4-6 |

---

## Sprint Capacity Assumptions

| Parameter | Value |
|-----------|-------|
| Sprint Duration | 2 weeks |
| Team Velocity | 18-22 SP/sprint |
| Developers | 2 |
| Buffer | 10% (meetings, reviews, bugs) |

---

## Sprint 1: Orders Foundation

**Dates**: Week 5-6 (Feb 3-14)
**Focus**: Types, API, Hooks for Orders module
**SP Planned**: 18

| Story | Title | SP | Owner | Notes |
|-------|-------|---:|-------|-------|
| 40.1-FE | Types & API Client | 3 | Dev1 | Foundation |
| 40.2-FE | React Query Hooks | 3 | Dev1 | After 40.1-FE |
| 40.3-FE | Orders List Page | 5 | Dev2 | Can start day 3 |
| 40.4-FE | Order Details Modal | 3 | Dev2 | After 40.3-FE |
| **Buffer** | Integration, fixes | 4 | Both | |

**Sprint Goals**:
- [ ] Orders list page functional
- [ ] Order details modal opens
- [ ] Navigation in sidebar

**Definition of Done**:
- Types match backend API spec
- List page renders with sample data
- Modal opens/closes properly
- Code reviewed and merged

---

## Sprint 2: Orders History & Analytics

**Dates**: Week 7-8 (Feb 17-28)
**Focus**: History timelines, analytics dashboard
**SP Planned**: 19

| Story | Title | SP | Owner | Notes |
|-------|-------|---:|-------|-------|
| 40.5-FE | History Timeline Components | 5 | Dev1 | Complex |
| 40.6-FE | Orders Analytics Dashboard | 5 | Dev2 | Parallel |
| 40.7-FE | Integration & Polish | 2 | Both | End of sprint |
| 51.1-FE | FBS Analytics Types | 2 | Dev1 | Start next epic |
| 51.2-FE | FBS Analytics Hooks | 3 | Dev1 | After types |
| **Buffer** | | 2 | | |

**Sprint Goals**:
- [ ] Complete Epic 40.9-FE ✅
- [ ] History timelines functional
- [ ] SLA/velocity widgets working
- [ ] Start Epic 51-FE foundation

**Definition of Done**:
- All 40+ WB statuses render
- Analytics refresh every minute
- Epic 40.9-FE documented in CLAUDE.md

---

## Sprint 3: Supplies Foundation

**Dates**: Week 9-10 (Mar 3-14)
**Focus**: Supplies list, create, detail pages
**SP Planned**: 20

| Story | Title | SP | Owner | Notes |
|-------|-------|---:|-------|-------|
| 53.1-FE | Types & API Client | 2 | Dev1 | Foundation |
| 53.2-FE | Supplies List Page | 5 | Dev1 | Main page |
| 53.3-FE | Create Supply Flow | 3 | Dev2 | Modal |
| 53.4-FE | Supply Detail Page | 5 | Dev2 | Dynamic route |
| 51.3-FE | Extended Date Picker | 3 | Dev1 | Parallel track |
| **Buffer** | | 2 | | |

**Sprint Goals**:
- [ ] Supplies list with filters
- [ ] Create supply modal
- [ ] Detail page with status stepper
- [ ] 365-day date picker ready

**Definition of Done**:
- CRUD operations work
- Status badges render correctly
- Navigation works end-to-end

---

## Sprint 4: Order Picker & Stickers

**Dates**: Week 11-12 (Mar 17-28)
**Focus**: Complex Order Picker, sticker generation
**SP Planned**: 21

| Story | Title | SP | Owner | Notes |
|-------|-------|---:|-------|-------|
| 53.5-FE | Order Picker Drawer | 8 | Dev1 | ⚡ Complex |
| 53.6-FE | Close Supply & Stickers | 5 | Dev2 | Parallel |
| 51.4-FE | FBS Trends Chart | 5 | Dev2 | After 53.6 |
| **Buffer** | | 3 | | |

**Sprint Goals**:
- [ ] Order Picker with 1000+ support
- [ ] Sticker preview/download
- [ ] FBS trends chart

**Definition of Done**:
- Virtualized list performs well
- All sticker formats work
- Charts render correctly

**Technical Notes**:
- Install `react-window` for virtualization
- Test with 1000 orders dataset

---

## Sprint 5: Analytics & Polish

**Dates**: Week 13-14 (Mar 31 - Apr 11)
**Focus**: Supplies polish, FBS analytics
**SP Planned**: 20

| Story | Title | SP | Owner | Notes |
|-------|-------|---:|-------|-------|
| 53.7-FE | Status Polling & Sync | 3 | Dev1 | |
| 53.8-FE | E2E Tests & Polish | 3 | Dev1 | |
| 51.5-FE | Trends Summary Cards | 2 | Dev2 | |
| 51.6-FE | Seasonal Patterns | 5 | Dev2 | |
| 51.7-FE | Period Comparison | 3 | Dev2 | |
| 51.8-FE | FBS Analytics Page | 5 | Dev1 | Integration |
| **Buffer** | | 2 | | |

**Sprint Goals**:
- [ ] Complete Epic 53-FE ✅
- [ ] FBS analytics page functional
- [ ] Seasonal patterns working

**Definition of Done**:
- E2E tests pass
- Polling works correctly
- All tabs functional

---

## Sprint 6: Admin & Final Polish

**Dates**: Week 15-16 (Apr 14-25)
**Focus**: Backfill admin, final integration
**SP Planned**: 15

| Story | Title | SP | Owner | Notes |
|-------|-------|---:|-------|-------|
| 51.9-FE | Hub Integration | 1 | Dev1 | Quick |
| 51.10-FE | Backfill Admin Types | 2 | Dev1 | |
| 51.11-FE | Backfill Admin Page | 5 | Dev2 | Owner only |
| 51.12-FE | E2E Tests | 3 | Both | |
| **Polish** | Bug fixes, docs | 4 | Both | |

**Sprint Goals**:
- [ ] Complete Epic 51-FE ✅
- [ ] All E2E tests pass
- [ ] Documentation complete

**Definition of Done**:
- All 3 epics complete
- CLAUDE.md updated
- No critical bugs

---

## Timeline Visualization

```
Feb                    Mar                    Apr
Week 5-6   Week 7-8    Week 9-10  Week 11-12  Week 13-14  Week 15-16
┌─────────┬──────────┬──────────┬───────────┬───────────┬───────────┐
│Sprint 1 │ Sprint 2 │ Sprint 3 │ Sprint 4  │ Sprint 5  │ Sprint 6  │
├─────────┴──────────┼──────────┴───────────┼───────────┴───────────┤
│   Epic 40.9-FE     │    Epic 53-FE        │    Epic 51-FE         │
│   (Orders)         │    (Supplies)        │    (Analytics)        │
└────────────────────┴─────────────────────┴───────────────────────┘
```

---

## Dependencies & Blockers

### Cross-Epic Dependencies

```
Epic 40.9-FE
    │
    └── Story 40.1-FE, 40.2-FE (useOrders hook)
              │
              ▼
        Epic 53-FE
            │
            └── Story 53.5-FE (Order Picker needs useOrders)
```

### External Dependencies

| Dependency | Required By | Status | Blocker? |
|------------|-------------|--------|----------|
| Backend Epic 40 | Sprint 1 | ✅ Complete | No |
| Backend Epic 51 | Sprint 2 | ✅ Complete | No |
| Backend Epic 53 | Sprint 3 | ✅ Complete | No |
| Orders API | Sprint 3 | ⚠️ To verify | **Potential** |
| react-window | Sprint 4 | Install | No |

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Orders API unavailable | Low | High | Verify before Sprint 3 |
| Order Picker complexity | Medium | Medium | Allocate 8 SP, spike if needed |
| 40+ WB status codes | Medium | Low | Fallback to raw codes |
| Backfill API complexity | Low | Low | P2, can defer |

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Sprint Velocity | 18-22 SP | Completed SP / Sprint |
| Bug Escape Rate | <5% | Bugs found post-merge |
| Test Coverage | >60% | Jest coverage report |
| E2E Pass Rate | 100% | Playwright CI |

---

## Milestones

| Date | Milestone | Deliverable |
|------|-----------|-------------|
| Feb 28 | Orders Complete | Epic 40.9-FE in production |
| Mar 28 | Supplies Complete | Epic 53-FE in production |
| Apr 25 | Analytics Complete | Epic 51-FE in production |

---

## Team Allocation

### Dev1 Focus Areas
- Types & API clients (foundation)
- Complex components (Order Picker, Timelines)
- Integration work

### Dev2 Focus Areas
- UI pages (List, Detail)
- Charts & visualizations
- E2E testing

---

**Document Version**: 1.0
**Created**: 2026-01-29
**Next Review**: Sprint 1 Kickoff
