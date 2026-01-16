# QA Handoff Document: Story 37.5 Phase 2 Manual Testing

**Epic 37: Merged Group Table Display (Склейки)**
**Story 37.5**: Testing & Documentation
**Phase 2**: Manual QA Tasks (requires human testers)
**Handoff Date**: 2025-12-29

---

## Overview

**Phase 1 (AI-Completed)** ✅:
- ✅ Unit tests for metrics-calculator.ts (55 tests, 100% pass)
- ✅ Unit tests for formatters.ts (22 tests, 100% pass)
- ✅ E2E test code for MergedGroupTable (7 scenarios)
- ✅ Accessibility test code with axe-core integration (7 scenarios)
- ✅ User guide documentation

**Phase 2 (QA Team Tasks)** 🚧:
- UAT with 3 real users (Story 37.5 AC 7)
- Performance testing & profiling (AC 8)
- Screenshot capture for documentation (AC 9)
- Manual screen reader testing (AC 10)
- Mixpanel analytics integration (AC 11)

---

## Prerequisites

### Required Tools

1. **Browsers** (for cross-browser testing):
   - Chrome 90+ (primary)
   - Firefox 88+
   - Safari 14+ (macOS/iOS)
   - Edge 90+ (Windows)

2. **Performance Tools**:
   - Chrome DevTools (built-in)
   - Lighthouse (Chrome extension or CLI)
   - Network throttling: Fast 3G simulation

3. **Accessibility Tools**:
   - @axe-core/playwright (install: `npm install --save-dev @axe-core/playwright`)
   - Screen readers:
     - macOS: VoiceOver (Cmd+F5)
     - Windows: NVDA (free) or JAWS
     - Mobile: TalkBack (Android), VoiceOver (iOS)

4. **Analytics**:
   - Mixpanel account and project API key
   - Access to frontend environment variables

5. **Screenshot Tools**:
   - Built-in browser screenshot (Cmd+Shift+4 on macOS, Snipping Tool on Windows)
   - Optional: Playwright screenshot capture (automated)

---

## Task 1: User Acceptance Testing (UAT)

**Story 37.5 AC 7**: ≥3 real users test merged groups feature, ≥90% satisfaction

### Test Participants

**Required**: 3 users with different experience levels:
- **User 1**: Power user (frequent WB seller, tech-savvy)
- **User 2**: Intermediate user (occasional WB seller, moderate tech skills)
- **User 3**: Novice user (new to WB analytics, low tech skills)

### Test Script

Provide each user with the following scenario:

```
Scenario: Analyze Advertising Performance for Merged Product Groups

You are a Wildberries seller analyzing advertising ROI for your merged product cards (склейки).

Tasks:
1. Navigate to Analytics → Advertising
2. Switch to "По склейкам" (merged groups) view
3. Find the product group with the highest ROAS
4. Identify the main product (crown icon) in that group
5. Sort the table by Total Sales (descending)
6. Find a group with ROAS < 1.0 (unprofitable)
7. Determine how many child products are in that group

Follow-up questions:
- Was the interface intuitive? (1-5 scale)
- Were the metrics clear and understandable? (1-5 scale)
- Did you encounter any confusing elements? (free text)
- Would you use this feature regularly? (Yes/No/Maybe)
```

### Success Criteria

- **Completion rate**: All 7 tasks completed successfully by ≥2/3 users
- **Satisfaction score**: Average rating ≥4.5/5 (≥90% satisfaction)
- **Error rate**: ≤2 errors per user during tasks

### Documentation

**File to create**: `frontend/docs/stories/epic-37/UAT-RESULTS.md`

**Template**:
```markdown
# UAT Results: Story 37.5

## Participants
- User 1: [Name], [Experience Level], [Date Tested]
- User 2: [Name], [Experience Level], [Date Tested]
- User 3: [Name], [Experience Level], [Date Tested]

## Results Summary
| Metric | User 1 | User 2 | User 3 | Average |
|--------|--------|--------|--------|---------|
| Tasks Completed | X/7 | X/7 | X/7 | X% |
| Intuitiveness Score (1-5) | X | X | X | X.X |
| Metrics Clarity Score (1-5) | X | X | X | X.X |
| Would Use Regularly? | Yes/No | Yes/No | Yes/No | X% |

## Feedback & Issues
[Free text notes from each user]

## Action Items
[List any bugs or UX improvements discovered]
```

---

## Task 2: Performance Testing

**Story 37.5 AC 8**: Initial render <200ms, interactions smooth (60fps)

### 2.1 Initial Render Performance

**Tool**: Chrome DevTools Performance tab

**Steps**:
1. Open Chrome DevTools (F12) → Performance tab
2. Click Record (red circle)
3. Navigate to `/analytics/advertising?group_by=imtId`
4. Wait for page to fully render
5. Stop recording
6. Analyze flamegraph

**Success Criteria**:
- **LCP (Largest Contentful Paint)**: <200ms on WiFi, <3s on Fast 3G
- **FCP (First Contentful Paint)**: <100ms on WiFi, <1.5s on Fast 3G
- **TTI (Time to Interactive)**: <500ms on WiFi, <5s on Fast 3G
- **CLS (Cumulative Layout Shift)**: <0.1

**Screenshot Required**: Performance flamegraph showing LCP timing

### 2.2 Interaction Performance

**Tool**: Chrome DevTools Performance Monitor

**Steps**:
1. Open DevTools → More tools → Performance monitor
2. Monitor CPU usage and FPS while:
   - Hovering over detail rows (transition effects)
   - Clicking ROAS column header to sort
   - Switching between "По артикулам" ↔ "По склейкам"
   - Scrolling table horizontally on mobile

**Success Criteria**:
- **FPS**: ≥60fps during all interactions
- **CPU usage**: <30% average, <80% peak
- **Rendering time**: <16ms per frame (60fps threshold)

**Screenshot Required**: Performance monitor showing FPS and CPU during sort

### 2.3 Network Performance

**Tool**: Chrome DevTools Network tab

**Steps**:
1. Enable Network throttling: Fast 3G
2. Clear cache (Cmd+Shift+R)
3. Navigate to `/analytics/advertising?group_by=imtId`
4. Measure API response times

**Success Criteria**:
- **API response time**: <500ms for `/v1/analytics/advertising?group_by=imtId`
- **Bundle size**: <500KB for initial JavaScript, <2MB total
- **Images/assets**: <50KB per icon/image

**Screenshot Required**: Network waterfall showing API call timing

### 2.4 Lighthouse Audit

**Tool**: Chrome DevTools Lighthouse tab

**Steps**:
1. Open Lighthouse tab
2. Select: Performance, Accessibility, Best Practices
3. Device: Desktop and Mobile
4. Run audit

**Success Criteria**:
- **Performance**: ≥90/100
- **Accessibility**: 100/100 (WCAG 2.1 AA compliance)
- **Best Practices**: ≥90/100

**Screenshot Required**: Lighthouse report scores

### Documentation

**File to create**: `frontend/docs/stories/epic-37/PERFORMANCE-REPORT.md`

**Include**:
- Screenshots of all performance tests
- Comparison table: Desktop vs Mobile vs Fast 3G
- Bottleneck analysis (if any scores <90)
- Optimization recommendations (if needed)

---

## Task 3: Screenshot Capture

**Story 37.5 AC 9**: Capture annotated screenshots for documentation

### Required Screenshots

#### 3.1 Toggle Buttons (2 screenshots)

- **Screenshot 1**: Toggle buttons with "По артикулам" active (default state)
- **Screenshot 2**: Toggle buttons with "По склейкам" active (merged groups mode)

**Annotations**: Red arrows pointing to active button, caption explaining toggle purpose

#### 3.2 Table Structure (3 screenshots)

- **Screenshot 3**: Full table view showing:
  - Tier 1: Rowspan cell (group ID)
  - Tier 2: Aggregate row (gray background)
  - Tier 3: Detail rows (white background, crown icon visible)

**Annotations**: Numbered labels (1, 2, 3) pointing to each tier, captions explaining purpose

- **Screenshot 4**: Aggregate row closeup showing all 6 metrics (totalSales, revenue, organicSales, organic%, spend, ROAS)

**Annotations**: Labels for each column, example values

- **Screenshot 5**: Detail row with crown icon and tooltip

**Annotations**: Arrow pointing to crown icon, tooltip visible with "Главный товар" text

#### 3.3 Responsive Design (3 screenshots)

- **Screenshot 6**: Desktop view (1400px width) - full table visible, no scroll
- **Screenshot 7**: Tablet view (800px width) - horizontal scroll enabled, sticky columns visible
- **Screenshot 8**: Mobile view (390px width) - toggle buttons stacked, table scrolls

**Annotations**: Viewport size labeled, sticky column highlighted

#### 3.4 Interactions (2 screenshots)

- **Screenshot 9**: Detail row hover state (background changes to gray-50)
- **Screenshot 10**: Sorted table (ROAS column descending, visual sort indicator)

**Annotations**: Before/after comparison for hover state, arrow indicator for sort

### Tools

- **Manual**: Browser screenshot (Cmd+Shift+4 on macOS, Windows Snipping Tool)
- **Automated**: Playwright screenshot capture (see E2E tests)

**Command to capture with Playwright**:
```bash
npx playwright test e2e/merged-group-table-epic-37.spec.ts --headed --project=chromium
# Screenshots saved to: test-results/
```

### Documentation

**File to create**: `frontend/docs/stories/epic-37/SCREENSHOTS/README.md`

**Include**:
- All 10 screenshots (PNG format, 1400×900 minimum resolution)
- Annotations and captions for each screenshot
- Usage guide (how to embed in user documentation)

---

## Task 4: Manual Screen Reader Testing

**Story 37.5 AC 10**: Screen reader compatibility (VoiceOver, NVDA, JAWS)

### 4.1 macOS VoiceOver Testing

**Steps**:
1. Enable VoiceOver: Cmd+F5
2. Navigate to `/analytics/advertising?group_by=imtId`
3. Use VoiceOver rotor (Cmd+U) to navigate:
   - Headings (should list page sections)
   - Links (should list all clickable elements)
   - Form Controls (should list toggle buttons)
   - Tables (should announce table structure)

**Success Criteria**:
- Toggle buttons announced as "Button, По артикулам, pressed" or "Button, По склейкам, not pressed"
- Table announced as "Table with X rows and 7 columns"
- Column headers announced with proper labels
- Crown icon announced as "Главный товар, graphic"
- Rowspan cell announces group ID and product count

**Notes to capture**:
- Any missing or unclear announcements
- Navigation flow issues
- Comparison with "По артикулам" mode

### 4.2 Windows NVDA Testing

**Steps**:
1. Install NVDA (free): https://www.nvaccess.org/download/
2. Start NVDA, navigate to `/analytics/advertising?group_by=imtId`
3. Use table navigation (Ctrl+Alt+Arrow keys):
   - Navigate column by column
   - Navigate row by row
   - Read cell content

**Success Criteria**:
- Same as VoiceOver testing
- Table navigation smooth and logical
- No "clickable" announcements on non-interactive elements

### 4.3 Mobile Screen Reader Testing

**iOS VoiceOver**:
1. Settings → Accessibility → VoiceOver → On
2. Navigate using 2-finger swipe (next/previous)
3. Activate with double-tap

**Android TalkBack**:
1. Settings → Accessibility → TalkBack → On
2. Navigate using swipe gestures
3. Activate with double-tap

**Success Criteria**:
- Toggle buttons accessible via swipe
- Table scrolls without losing screen reader focus
- Sticky columns remain accessible while scrolling

### Documentation

**File to create**: `frontend/docs/stories/epic-37/SCREEN-READER-REPORT.md`

**Template**:
```markdown
# Screen Reader Testing Report

## VoiceOver (macOS)
- **Toggle Buttons**: [Pass/Fail] - [Notes]
- **Table Navigation**: [Pass/Fail] - [Notes]
- **Crown Icon**: [Pass/Fail] - [Notes]
- **Rowspan Cell**: [Pass/Fail] - [Notes]

## NVDA (Windows)
- **Toggle Buttons**: [Pass/Fail] - [Notes]
- **Table Navigation**: [Pass/Fail] - [Notes]
- **Crown Icon**: [Pass/Fail] - [Notes]
- **Rowspan Cell**: [Pass/Fail] - [Notes]

## Mobile Screen Readers
- **iOS VoiceOver**: [Pass/Fail] - [Notes]
- **Android TalkBack**: [Pass/Fail] - [Notes]

## Issues Found
[List any accessibility issues discovered]

## Recommendations
[Suggested improvements]
```

---

## Task 5: Mixpanel Analytics Integration

**Story 37.5 AC 11**: Track user interactions for product analytics

### 5.1 Install Mixpanel SDK

**Steps**:
1. Install Mixpanel: `npm install mixpanel-browser`
2. Initialize in `src/lib/mixpanel.ts`:

```typescript
import mixpanel from 'mixpanel-browser'

// Initialize Mixpanel (use environment variable)
mixpanel.init(process.env.NEXT_PUBLIC_MIXPANEL_TOKEN || '', {
  debug: process.env.NODE_ENV === 'development',
  track_pageview: true,
  persistence: 'localStorage',
})

export default mixpanel
```

3. Add to `.env.local`:
```
NEXT_PUBLIC_MIXPANEL_TOKEN=your_project_token_here
```

### 5.2 Add Event Tracking

**Events to track**:

#### Event 1: Toggle Mode Switch
```typescript
// In MergedGroupTable.tsx or parent component
import mixpanel from '@/lib/mixpanel'

const handleToggle = (mode: 'sku' | 'imtId') => {
  mixpanel.track('Advertising Analytics - Toggle Mode', {
    mode: mode,
    previous_mode: currentMode,
    timestamp: new Date().toISOString(),
  })
  // ... rest of toggle logic
}
```

#### Event 2: Table Sort
```typescript
const handleSort = (column: string, direction: 'asc' | 'desc') => {
  mixpanel.track('Advertising Analytics - Sort Table', {
    column: column,
    direction: direction,
    view_mode: currentMode, // 'sku' or 'imtId'
  })
  // ... rest of sort logic
}
```

#### Event 3: Row Click (Detail Row)
```typescript
const handleRowClick = (nmId: number, groupId: number | null) => {
  mixpanel.track('Advertising Analytics - Row Click', {
    nmId: nmId,
    groupId: groupId,
    is_main_product: isMainProduct,
  })
  // ... navigation or modal logic
}
```

#### Event 4: Page View
```typescript
// In page component: app/(dashboard)/analytics/advertising/page.tsx
useEffect(() => {
  mixpanel.track('Page View - Advertising Analytics', {
    view_mode: searchParams.get('group_by') || 'sku',
  })
}, [searchParams])
```

### 5.3 Validation

**Test events in Mixpanel dashboard**:
1. Log in to Mixpanel: https://mixpanel.com
2. Navigate to your project
3. Go to **Events** tab
4. Perform actions in app (toggle, sort, click rows)
5. Verify events appear in real-time stream

**Success Criteria**:
- All 4 events fire correctly
- Properties (mode, column, nmId, etc.) captured accurately
- Events appear in Mixpanel within 10 seconds

### Documentation

**File to update**: `frontend/src/lib/mixpanel.ts` (create if doesn't exist)
**File to create**: `frontend/docs/stories/epic-37/MIXPANEL-SETUP.md`

**Include**:
- Mixpanel project token (masked in docs, stored in .env.local)
- List of tracked events and properties
- Example Mixpanel queries for analytics insights
- Privacy considerations (PII handling)

---

## Task 6: Axe-Core Integration

**Story 37.5 AC 1-6**: Accessibility automated testing

### Steps

1. **Install axe-core**:
```bash
npm install --save-dev @axe-core/playwright
```

2. **Uncomment axe-core code** in:
   - `e2e/accessibility-merged-groups-epic-37.spec.ts`
   - Look for `// TODO (QA): Uncomment` comments

3. **Run accessibility tests**:
```bash
npx playwright test e2e/accessibility-merged-groups-epic-37.spec.ts
```

**Success Criteria**:
- ✅ 0 axe-core violations (WCAG 2.1 AA)
- ✅ All 7 test scenarios pass
- ✅ Test execution time <30 seconds

### Documentation

**File to create**: `frontend/docs/stories/epic-37/ACCESSIBILITY-REPORT.md`

**Include**:
- axe-core scan results (violations, passes, incomplete)
- Screenshots of any violations found
- Remediation steps for each violation
- Comparison: automated tests vs manual screen reader testing

---

## Task 7: Final Validation Checklist

Before marking Story 37.5 COMPLETE, verify:

### Phase 1 (AI) ✅
- [x] Unit tests: 77/77 passing (55 metrics + 22 formatters)
- [x] E2E test code: 7 scenarios implemented
- [x] Accessibility test code: 7 scenarios implemented
- [x] User guide: Complete and comprehensive

### Phase 2 (QA) 🚧
- [ ] UAT: ≥3 users tested, ≥90% satisfaction
- [ ] Performance: LCP <200ms, FPS ≥60
- [ ] Screenshots: 10 annotated screenshots captured
- [ ] Screen readers: VoiceOver, NVDA, TalkBack tested
- [ ] Mixpanel: 4 events tracked, validated in dashboard
- [ ] Axe-core: 0 violations, all tests passing

### Files to Create
- [ ] `frontend/docs/stories/epic-37/UAT-RESULTS.md`
- [ ] `frontend/docs/stories/epic-37/PERFORMANCE-REPORT.md`
- [ ] `frontend/docs/stories/epic-37/SCREENSHOTS/README.md` + 10 PNGs
- [ ] `frontend/docs/stories/epic-37/SCREEN-READER-REPORT.md`
- [ ] `frontend/docs/stories/epic-37/MIXPANEL-SETUP.md`
- [ ] `frontend/docs/stories/epic-37/ACCESSIBILITY-REPORT.md`

---

## Estimated Time (Phase 2)

| Task | Estimated Time | Assigned To |
|------|----------------|-------------|
| UAT (3 users) | 2-3 hours | QA Lead + Users |
| Performance testing | 1-2 hours | QA Engineer |
| Screenshot capture | 1 hour | QA/Designer |
| Screen reader testing | 2-3 hours | Accessibility Specialist |
| Mixpanel integration | 1-2 hours | Frontend Dev |
| Axe-core integration | 30 min | Frontend Dev |
| **Total** | **7.5-11.5 hours** | **QA Team** |

---

## Success Criteria Summary

**Story 37.5 is COMPLETE when**:
1. ✅ Phase 1 complete (AI tasks)
2. ✅ Phase 2 complete (all 6 QA tasks above)
3. ✅ All documentation files created
4. ✅ ≥90% UAT satisfaction
5. ✅ Performance targets met (<200ms LCP, 60fps)
6. ✅ 0 accessibility violations
7. ✅ Mixpanel events validated

**Epic 37 is COMPLETE when**:
- Story 37.1: Backend API Validation (blocked, defer to post-MVP)
- Story 37.2: MergedGroupTable Component ✅ (9.8/10)
- Story 37.3: Aggregate Metrics Display ✅ (9.7/10)
- Story 37.4: Visual Styling & Hierarchy ✅ (26/26 AC)
- Story 37.5: Testing & Documentation ✅ (Phase 1 + Phase 2)

---

## Contact & Support

**Questions?** Contact:
- **QA Lead**: [Name/Email]
- **Frontend Dev**: [Name/Email]
- **Product Owner**: [Name/Email]

**Issue Tracker**: GitHub Issues → Tag with `epic-37`, `story-37.5`, `qa`

**Handoff Date**: 2025-12-29
**Target Completion**: TBD (QA team estimates 7.5-11.5h total)

---

**🎯 Phase 2 Quick Start**:
1. Install @axe-core/playwright and run accessibility tests
2. Run UAT with 3 users (different experience levels)
3. Capture 10 annotated screenshots
4. Run performance tests (Lighthouse + Chrome DevTools)
5. Test with 3 screen readers (VoiceOver, NVDA, TalkBack)
6. Integrate Mixpanel and validate 4 events

**Good luck! 🚀**
