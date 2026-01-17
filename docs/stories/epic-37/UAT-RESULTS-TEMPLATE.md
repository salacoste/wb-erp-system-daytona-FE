# UAT Results Template: Epic 37 - Merged Groups Display

**Date**: YYYY-MM-DD
**Facilitator**: [Name]
**Story**: 37.5 Phase 2 - Testing & Documentation
**Epic**: 37 - Merged Group Table Display (Advertising Analytics)

---

## Overview

**Purpose**: Validate the Merged Groups (Склейки) feature with real users to ensure it meets business requirements and provides intuitive UX.

**Success Criteria**:
- **Completion rate**: ≥67% tasks completed (5/7 by ≥2/3 users)
- **Satisfaction score**: ≥4.5/5 (≥90% satisfaction)
- **Error rate**: ≤2 errors per user during tasks

---

## Test Participants

| # | Name | Experience Level | Role | Date Tested |
|---|------|------------------|------|-------------|
| 1 | [Name] | **Power User** (frequent WB seller, tech-savvy) | [Internal Finance User] | YYYY-MM-DD |
| 2 | [Name] | **Intermediate** (occasional WB seller, moderate tech skills) | [Internal Team Member] | YYYY-MM-DD |
| 3 | [Name | **Novice** (new to WB analytics, low tech skills) | [QA/PO Team Member] | YYYY-MM-DD |

---

## Test Script

### Scenario
> "You are a Wildberries seller analyzing advertising ROI for your merged product cards (склейки)."

### Tasks

| # | Task | Expected Outcome | Notes |
|---|------|------------------|-------|
| 1 | Navigate to **Analytics → Advertising** | User can find the page in sidebar | 5s expected |
| 2 | Switch to "По склейкам" (merged groups) | Toggle button works, view changes | Crown icon visible |
| 3 | Find product group with highest ROAS | User identifies correct group | Sort by ROAS desc helps |
| 4 | Identify main product (crown icon 👑) | User notices the visual indicator | Present in aggregate rows |
| 5 | Sort table by Total Sales (descending) | Sort works, visual indicator shows | Header arrow appears |
| 6 | Find group with ROAS < 1.0 (unprofitable) | User can identify loss-making groups | Red color coding helps |
| 7 | Determine child product count in loss group | User can see detail rows under rowspan | Rowspan structure understood |

---

## Results Summary

| Metric | User 1 | User 2 | User 3 | Average |
|--------|--------|--------|--------|---------|
| Tasks Completed | X/7 | X/7 | X/7 | X% |
| Completion Time | X min | X min | X min | X min |
| Intuitiveness Score (1-5) | X | X | X | X.X/5 |
| Metrics Clarity Score (1-5) | X | X | X | X.X/5 |
| Would Use Regularly? | Yes/No/Maybe | Yes/No/Maybe | Yes/No/Maybe | X% |

**Satisfaction Rate**: `X%` (Target: ≥90%)

---

## Feedback & Issues

### User 1: [Name] (Power User)

**Tasks Completed**: X/7

**Feedback**:
- **Positive**: [What worked well]
- **Issues**: [Confusing elements encountered]
- **Suggestions**: [Improvement ideas]

**Errors Made**: X (Target: ≤2)

---

### User 2: [Name] (Intermediate User)

**Tasks Completed**: X/7

**Feedback**:
- **Positive**: [What worked well]
- **Issues**: [Confusing elements encountered]
- **Suggestions**: [Improvement ideas]

**Errors Made**: X (Target: ≤2)

---

### User 3: [Name] (Novice User)

**Tasks Completed**: X/7

**Feedback**:
- **Positive**: [What worked well]
- **Issues**: [Confusing elements encountered]
- **Suggestions**: [Improvement ideas]

**Errors Made**: X (Target: ≤2)

---

## Issues Summary

| Issue | Severity | Users Affected | Suggested Fix |
|-------|----------|-----------------|---------------|
| [Issue description] | Critical/Medium/Low | User 1,3 | [Fix description] |
| [Issue description] | Critical/Medium/Low | User 2 | [Fix description] |
| [Issue description] | Critical/Medium/Low | All | [Fix description] |

---

## Action Items

### Critical (P0) - Block Production Deployment
| Issue | Fix Assigned | Owner | Timeline |
|-------|-------------|-------|----------|
| [Issue that blocks production] | [Fix description] | [Name] | [Date] |

### High Priority (P1) - Fix Before Next Sprint
| Issue | Fix Assigned | Owner | Timeline |
|-------|-------------|-------|----------|
| [Issue not blocking but important] | [Fix description] | [Name] | [Date] |

### Medium Priority (P2) - Nice to Have
| Issue | Fix Assigned | Owner | Timeline |
|-------|-------------|-------|----------|
| [UX improvement idea] | [Fix description] | [Name] | [Date] |

---

## Screenshots

*(Optional - attach screenshots showing user interactions)*

---

## Recommendation

**Gate Decision**: ⬜ **PASS** | ⬜ **CONCERNS** | ⬜ **FAIL** | ⬜ **WAIVED**

**Rationale**: [Detailed reasoning for gate decision based on UAT results, satisfaction score, and severity of issues found]

**Next Steps**:
1. [Action item 1]
2. [Action item 2]
3. [Action item 3]

---

**Test Completed**: YYYY-MM-DD HH:mm
**Reviewed By**: [QA Lead Name]
**Approved By**: [Product Owner Name]
