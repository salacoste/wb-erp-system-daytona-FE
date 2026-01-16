# Story 37.6: Post-MVP Enhancements (Склейки Table)

**Epic**: Epic 37 - Merged Group Table Display (Склейки)
**Status**: 📋 **BACKLOG** - Post-MVP Enhancements
**Effort**: TBD (varies by enhancement)
**Priority**: Low (Nice-to-have)
**Assignee**: [TO BE ASSIGNED - Post-MVP]

---

## 🎯 Purpose

This story is a **placeholder** for future enhancements to the Merged Group Table (Склейки) feature that were **deferred from MVP** during PO approval on 2025-12-29.

**MVP Rationale**: These features were deemed **not critical** for initial launch to keep scope manageable and deliver core functionality quickly. They can be prioritized post-MVP based on user feedback and actual usage patterns.

---

## 📋 Deferred Enhancements

### **Enhancement #1: Progressive Disclosure (Collapse/Expand)**

**Current MVP Behavior**: All groups display fully expanded, regardless of product count

**Enhancement Request**: Add collapse/expand functionality for large groups (>10 products)

**User Story**:
- **As a** user viewing groups with many products
- **I want** to collapse large groups to reduce visual clutter
- **So that** I can focus on key metrics without scrolling through long lists

**Acceptance Criteria**:
- [ ] Groups with >10 products collapsed by default
- [ ] "Show all N products" button expands group
- [ ] "Show less" button collapses group
- [ ] Aggregate row always visible (never collapsed)
- [ ] Expansion state persists in localStorage per cabinet
- [ ] Smooth animation on expand/collapse (200ms transition)

**Design Notes**:
- Collapsed state shows: Aggregate row + main product row only
- Button placement: Below main product row, centered
- Icon: ChevronDown (collapsed) / ChevronUp (expanded)

**Estimated Effort**: 3-4 hours

---

### **Enhancement #2: ROAS Color-Coding**

**Current MVP Behavior**: All ROAS values display in consistent gray-900 text

**Enhancement Request**: Color-code ROAS values based on performance tiers

**User Story**:
- **As a** user analyzing advertising performance
- **I want** ROAS values color-coded by performance tier
- **So that** I can quickly identify high-performing and underperforming groups

**Acceptance Criteria**:
- [ ] Excellent (≥2.0): Green (#10B981, green-500)
- [ ] Good (1.0-1.99): Yellow (#F59E0B, yellow-500)
- [ ] Poor (<1.0): Red (#EF4444, red-500)
- [ ] N/A (spend=0): Gray (#6B7280, gray-600)
- [ ] Color applies to both aggregate and detail row ROAS
- [ ] Tooltip explains tier thresholds on hover
- [ ] WCAG 2.1 AA contrast verified for all colors

**Design Notes**:
- Bold text for colored ROAS values (font-weight: 600)
- Background color option: Subtle pill badge (bg-green-50, text-green-700)
- PO to decide: Text color only vs. pill badge

**Estimated Effort**: 2-3 hours

---

### **Enhancement #3: Aggregate Row Click Interaction**

**Current MVP Behavior**: Aggregate row not clickable (no hover effect)

**Enhancement Request**: Make aggregate row clickable to collapse/expand group

**User Story**:
- **As a** user navigating large tables
- **I want** to click aggregate rows to collapse/expand groups
- **So that** I can quickly manage table density without hunting for buttons

**Acceptance Criteria**:
- [ ] Aggregate row cursor changes to pointer on hover
- [ ] Hover effect: Background #E5E7EB (gray-200)
- [ ] Click toggles group collapse/expand state
- [ ] Visual indicator: Chevron icon on right side (rotates on expand/collapse)
- [ ] Keyboard accessible: Space/Enter to toggle
- [ ] Screen reader announces state: "Collapsed group" / "Expanded group"

**Dependencies**: Requires Enhancement #1 (Progressive Disclosure) to be implemented first

**Estimated Effort**: 1-2 hours (incremental if #1 complete)

---

### **Enhancement #4: Mobile Card Layout**

**Current MVP Behavior**: Horizontal scroll on mobile (<768px) with sticky left columns

**Enhancement Request**: Card-based layout for mobile devices

**User Story**:
- **As a** mobile user viewing склейки analytics
- **I want** a card layout optimized for small screens
- **So that** I can read metrics without horizontal scrolling

**Acceptance Criteria**:
- [ ] Mobile (<768px) switches to card layout (no table)
- [ ] Each group = 1 card with:
  - Header: Group name + product count
  - Metrics: Stacked vertical layout (totalSales, revenue, ROAS)
  - Products: Expandable list (collapsed by default)
- [ ] Swipe gesture to expand/collapse product list
- [ ] Maintains color-coding from Enhancement #2 (if implemented)
- [ ] Touch-friendly targets (min 44px height)

**Design Notes**:
- Card background: white, shadow-sm
- Header background: gray-100 (matches aggregate row)
- Spacing: p-4 padding, mb-4 margin between cards

**Estimated Effort**: 4-5 hours (complex responsive redesign)

---

### **Enhancement #5: Dark Mode Support**

**Current MVP Behavior**: Light mode only (white/gray backgrounds)

**Enhancement Request**: Dark mode variant classes

**User Story**:
- **As a** user working in low-light environments
- **I want** dark mode support for the склейки table
- **So that** I can reduce eye strain during late-night analysis

**Acceptance Criteria**:
- [ ] Detect system dark mode preference (`prefers-color-scheme: dark`)
- [ ] Dark variants for all colors:
  - Rowspan cell: `dark:bg-gray-800`, `dark:border-gray-600`
  - Aggregate row: `dark:bg-gray-700`, `dark:text-gray-100`
  - Detail row: `dark:bg-gray-900`, `dark:hover:bg-gray-800`
  - Crown icon: `dark:text-yellow-400`
- [ ] WCAG 2.1 AA contrast verified for dark mode
- [ ] Manual toggle button (optional, if system detection insufficient)
- [ ] Preference saved in localStorage

**Dependencies**: Requires project-wide dark mode strategy decision

**Estimated Effort**: 3-4 hours (assuming project dark mode foundation exists)

---

### **Enhancement #6: Visual Regression Testing**

**Current MVP Behavior**: Manual QA only (no automated visual testing)

**Enhancement Request**: Percy or Chromatic integration for screenshot diffs

**User Story**:
- **As a** developer making style changes
- **I want** automated visual regression detection
- **So that** I can catch unintended UI changes before deployment

**Acceptance Criteria**:
- [ ] Percy or Chromatic account set up
- [ ] Screenshot baseline captured for 5 scenarios:
  - Normal group (6 products)
  - Single-product group
  - Large group (20+ products)
  - Zero spend edge case
  - Negative revenue edge case
- [ ] CI/CD integration: Auto-run on PRs to main
- [ ] Diff approval workflow established

**Estimated Effort**: 2-3 hours (setup + baseline capture)

---

### **Enhancement #7: Advanced Analytics Tracking**

**Current MVP Behavior**: Basic events (group view, product click)

**Enhancement Request**: Detailed interaction analytics

**User Story**:
- **As a** product team
- **I want** detailed analytics on user interaction patterns
- **So that** we can optimize the склейки feature based on actual usage

**Acceptance Criteria**:
- [ ] Track additional events:
  - `advertising_group_expanded` (if Enhancement #1 implemented)
  - `advertising_sort_clicked` (column, direction)
  - `advertising_tooltip_viewed` (field name)
  - `advertising_roas_tier_filtered` (if filtering added)
- [ ] Event properties:
  - `group_size` (product count)
  - `group_roas` (performance tier)
  - `viewport_width` (responsive breakpoint)
  - `time_on_page` (engagement duration)
- [ ] Mixpanel funnel: View → Sort → Click Product → [External Action]
- [ ] Weekly report: Top 10 groups by views

**Estimated Effort**: 2-3 hours (event instrumentation)

---

### **Enhancement #8: Export to Excel**

**Current MVP Behavior**: No export functionality (view-only table)

**Enhancement Request**: Export склейки data to Excel/CSV

**User Story**:
- **As a** finance analyst
- **I want** to export склейки table data to Excel
- **So that** I can perform custom analysis in spreadsheets

**Acceptance Criteria**:
- [ ] "Export to Excel" button (top right, near filter controls)
- [ ] Exports visible rows only (respects current sorting/filtering)
- [ ] File format: `.xlsx` (Excel) or `.csv` (user choice)
- [ ] Columns: All visible columns + group hierarchy preserved
- [ ] Formatting: Russian locale currency, percentages
- [ ] Filename: `skleitki-analytics-{cabinet}-{date}.xlsx`

**Technical Notes**:
- Use `xlsx` npm package for client-side generation
- Max file size: 10MB (warn if larger)

**Estimated Effort**: 3-4 hours

---

## 🎯 Prioritization Criteria

**High Priority** (implement first if user demand):
1. **Enhancement #1** (Progressive Disclosure) - Addresses table density for large groups
2. **Enhancement #2** (ROAS Color-Coding) - High user value, low effort
3. **Enhancement #8** (Export to Excel) - Common analyst request

**Medium Priority**:
4. **Enhancement #3** (Aggregate Click) - Depends on #1
5. **Enhancement #7** (Advanced Analytics) - Product team need

**Low Priority** (nice-to-have):
6. **Enhancement #4** (Mobile Card Layout) - Complex, mobile usage unknown
7. **Enhancement #5** (Dark Mode) - Depends on project-wide strategy
8. **Enhancement #6** (Visual Regression) - QA improvement, not user-facing

---

## 📊 Success Metrics (Post-Enhancement)

If these enhancements are implemented, success measured by:

- **Adoption**: ≥90% of users switch to "По склейкам" mode (up from MVP target 80%)
- **Engagement**: Average session duration increases by 20%
- **Satisfaction**: NPS ≥9 for склейки feature (up from MVP target ≥8)
- **Support**: <2 questions/month about feature usage (down from MVP target <5)

---

## 🔗 References

- **Epic 37 Main**: `docs/epics/epic-37-merged-group-table-display.md` - MVP scope
- **PO Approval**: `docs/stories/epic-37/PO-APPROVAL-EPIC-37.md` - Decisions and rationale
- **MVP Stories**: `docs/stories/epic-37/story-37.1-37.5.md` - Current implementation

---

## 🎯 Next Steps (When Prioritized)

1. **PO**: Select 1-3 enhancements for next sprint based on user feedback
2. **UX Expert (Sally)**: Design mockups for selected enhancements
3. **Frontend Dev**: Estimate effort for each selected enhancement
4. **Create individual stories**: Break this placeholder into granular stories (e.g., Story 37.7, 37.8, etc.)
5. **Implement & test**: Follow standard development workflow
6. **Deploy & monitor**: Track success metrics post-release

---

**Story Owner**: Sarah (PO) - Backlog Maintenance
**Created**: 2025-12-29
**Last Updated**: 2025-12-29
**Status**: Backlog - Awaiting User Feedback from MVP
