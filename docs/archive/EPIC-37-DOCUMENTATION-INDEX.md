# Epic 37: Complete Documentation Index

**Date**: 2025-12-29  
**Location**: Frontend Documentation (`/frontend/docs/`)  
**Status**: ✅ All documents validated and in correct locations

---

## 📍 File Locations Summary

### ✅ Epic Document (Main)

\`\`\`
frontend/docs/epics/
└── epic-37-merged-group-table-display.md # Main Epic doc (23KB)
\`\`\`

### ✅ Story Files (BMad Format)

\`\`\`
frontend/docs/stories/epic-37/
├── story-37.1-backend-api-validation.BMAD.md # Story 37.1 (11KB)
├── story-37.2-merged-group-table-component.BMAD.md # Story 37.2 (15KB)
├── story-37.3-aggregate-metrics-display.BMAD.md # Story 37.3 (13KB)
├── story-37.4-visual-styling-hierarchy.BMAD.md # Story 37.4 (14KB)
├── story-37.5-testing-documentation.BMAD.md # Story 37.5 (12KB)
└── story-37.6-post-mvp-enhancements.md # Post-MVP backlog
\`\`\`

### ✅ Implementation Plans

\`\`\`
frontend/docs/implementation-plans/
├── epic-37-frontend-implementation-plan.md # Full plan (26KB)
└── epic-37-phase-0-completion-report.md # Phase 0 report (9KB)
\`\`\`

### ✅ Mock Data Management

\`\`\`
frontend/docs/
├── EPIC-37-MOCK-DATA-MANAGEMENT.md # Cleanup plan (12KB)
└── EPIC-37-START-HERE.md # Quick start guide (5KB)
\`\`\`

### ✅ Backend Request

\`\`\`
frontend/docs/request-backend/
└── 88-epic-37-individual-product-metrics.md # Backend Story 37.0 spec (18KB)
\`\`\`

### ✅ Validation Reports

\`\`\`
frontend/docs/stories/epic-37/
├── STORY-VALIDATION-REPORT-2025-12-29.md # All stories (PO approved)
├── PO-VALIDATION-REPORT-EPIC-37.md # PO validation (9.6/10)
├── api-validation-report-37.1.md # API structure analysis
├── api-response-sample-EXPECTED.json # Expected structure
└── api-response-sample-ACTUAL.json # Current structure
\`\`\`

---

## 📊 Documentation Status

| Category            | Location                       | Files | Status      |
| ------------------- | ------------------------------ | ----- | ----------- |
| **Epic Doc**        | \`docs/epics/\`                | 1     | ✅ Complete |
| **Stories**         | \`docs/stories/epic-37/\`      | 5     | ✅ Complete |
| **Implementation**  | \`docs/implementation-plans/\` | 2     | ✅ Complete |
| **Mock Management** | \`docs/\`                      | 2     | ✅ Complete |
| **Backend Request** | \`docs/request-backend/\`      | 1     | ✅ Sent     |
| **Validation**      | \`docs/stories/epic-37/\`      | 5     | ✅ Complete |

**Total Documentation**: 17 files, ~150KB

---

## ⚠️ Mock Data Tracking

### Mock Files (TEMPORARY - DELETE after backend ready)

| File                                                  | Purpose          | Delete When     |
| ----------------------------------------------------- | ---------------- | --------------- |
| \`src/mocks/data/epic-37-merged-groups.ts\`           | Test data source | Story 37.1 PASS |
| Mock handler in \`src/mocks/handlers/advertising.ts\` | MSW interception | Story 37.1 PASS |
| Mock import in \`page.tsx\`                           | Page integration | Story 37.1 PASS |
| Mock import in \`MergedGroupTable.tsx\`               | Component dev    | Story 37.1 PASS |

### Feature Flag (KEEP - update default)

| File                       | Setting        | Current   | After Backend |
| -------------------------- | -------------- | --------- | ------------- |
| \`src/config/features.ts\` | \`useRealApi\` | \`false\` | \`true\`      |

**📖 Full cleanup process**: See \`docs/EPIC-37-MOCK-DATA-MANAGEMENT.md\`

---

## 🎯 Read Order (For Developers)

### Quick Start (30 minutes):

1. **EPIC-37-START-HERE.md** (this file) - 5 min
2. **epic-37-merged-group-table-display.md** - 15 min
3. **epic-37-frontend-implementation-plan.md** - 10 min

### Full Context (60 minutes):

4. **EPIC-37-MOCK-DATA-MANAGEMENT.md** - 5 min
5. **story-37.2** (Component) - 10 min
6. **story-37.3** (Metrics) - 10 min
7. **story-37.4** (Styling) - 10 min
8. **story-37.5** (Testing) - 10 min
9. **story-37.1** (Validation) - 5 min

### Reference (as needed):

- Request #88 (Backend API spec)
- Validation reports
- API response samples

---

**All Epic 37 documentation is in correct locations** ✅  
**Ready for development** ✅  
**Mock data management documented** ✅
