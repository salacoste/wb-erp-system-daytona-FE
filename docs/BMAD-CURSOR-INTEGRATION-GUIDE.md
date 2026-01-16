# BMad Cursor AI Integration Guide

## Overview

This guide explains how to use BMad framework with **Cursor AI** for the WB Repricer Frontend project.

---

## Quick Start

1. **Read `.cursorrules` first** - This is your primary reference for all development work
2. **Use BMad agents** - Specialized agents for different roles (@pm, @architect, @sm, @po, @dev, @qa)
3. **Follow workflows** - Use workflows to guide you through tasks

---

## Cursor AI Setup

### 1. `.cursorrules` Configuration

The `.cursorrules` file contains:

- Project overview and tech stack
- Code standards (TypeScript, React, API integration)
- Component patterns (API hooks, state management, forms)
- Testing requirements (Vitest, Playwright)
- Common pitfalls to avoid
- BMad agent integration

**Always read this file before starting work!**

### 2. BMad Domain Pack

Location: `.claude/commands/BMad/expansion-packs/wb-repricer-frontend-domain.yaml`

Contains:

- Project-specific patterns
- Component conventions
- API integration strategies
- Testing approaches

Refer to this for project-specific guidance.

---

## BMad Agents for Cursor

### Available Agents

| Agent        | Role            | Purpose                                               | Cursor Command |
| ------------ | --------------- | ----------------------------------------------------- | -------------- |
| `@pm`        | Product Manager | Creates Epic PRDs and product strategy                | `/pm`          |
| `@architect` | Architect       | Defines frontend architecture and technical solutions | `/architect`   |
| `@ux-expert` | UX Expert       | Provides UI/UX guidance and design decisions          | `/ux`          |
| `@sm`        | Scrum Master    | Creates detailed stories from Epic PRDs               | `/sm`          |
| `@po`        | Product Owner   | Validates stories and manages backlog                 | `/po`          |
| `@dev`       | Developer       | Implements stories (YOU!)                             | `/dev`         |
| `@qa`        | QA              | Reviews implementations and creates quality gates     | `/qa`          |

### When to Use Each Agent

```
PM (creates Epic)
  ↓
Architect (designs solution)
  ↓
UX Expert (defines UX requirements)
  ↓
SM (creates stories)
  ↓
PO (validates stories)
  ↓
DEV (implements stories) ← YOU ARE HERE
  ↓
QA (reviews and quality gates)
```

---

## Development Workflow for @dev

### Before Starting a Story

1. **Read `.cursorrules` completely**

   ```bash
   # Cursor Command
   /dev
   ```

   Then ask: "Please read .cursorrules and summarize key points"

2. **Check BMad Domain Pack**
   - Refer to `.claude/commands/BMad/expansion-packs/wb-repricer-frontend-domain.yaml`
   - Look for project-specific patterns

3. **Read the Story Completely**
   - Location: `docs/stories/epic-{ID}/story-{ID}.{NUM}*.md`
   - Read all sections
   - Understand all acceptance criteria

4. **Review Dev Notes Section**
   - Look for specific technical guidance
   - Check for referenced architecture documents

### During Implementation

1. **Follow Tasks Sequentially**
   - Don't skip ahead
   - Complete each task before moving to next

2. **Refer to `.cursorrules` for Patterns**
   - API hooks pattern
   - State management pattern
   - Form pattern
   - Error handling pattern

3. **Write Tests as You Go**
   - Unit tests with Vitest
   - E2E tests with Playwright
   - Follow testing standards from `.cursorrules`

4. **Update Dev Agent Record**
   - Add your name
   - Track progress
   - Record lessons learned
   - Note any issues

### When Complete

1. **Update Dev Agent Record**

   ```yaml
   Dev Agent Record:
     Developer: [Your Name]
     Start Date: [Date]
     End Date: [Date]
     Status: Ready for Review
     Completion Notes: [Your notes]
     Lessons Learned: [What you learned]
     File List: [All files created/modified]
   ```

2. **Update File List**

   ```yaml
   File List:
     Created:
       - src/components/example/ExampleComponent.tsx
       - src/hooks/useExample.ts
     Modified:
       - src/app/page.tsx
     Deleted: []
   ```

3. **Run Validation**

   ```bash
   npm run type-check
   npm run lint
   npm run test
   npm run test:e2e
   ```

4. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat(story-34.7): implement hero banner for Telegram empty state"
   ```

---

## Cursor-Specific Commands

### For @dev (Developer)

```markdown
# Implement a Story

/dev
Please read .cursorrules and then implement Story 34.7-FE from docs/stories/epic-34/story-34.7-fe-empty-state-hero-banner.md

# Get Help with Patterns

/dev
How should I structure a React Query hook according to .cursorrules?

# Debug an Issue

/dev
I'm getting a TypeScript error in this component. The error is: [paste error]

# Request Code Review

/dev
I've completed the implementation. Please review the code for compliance with .cursorrules
```

### For @pm (Product Manager)

```markdown
# Create Epic PRD

/pm
Create an Epic PRD for a new feature: [describe feature]

# Update Epic

/pm
Update Epic 34-FE with new business requirements

# Prioritize Features

/pm
Prioritize the following stories for the next sprint: [list stories]
```

### For @sm (Scrum Master)

```markdown
# Create Next Story

/sm
Create the next story from Epic 34-FE

# Review Story

/sm
Review Story 34.7-FE for completeness

# Update Story

/sm
Update Story 34.7-FE based on PO feedback
```

### For @po (Product Owner)

```markdown
# Validate Story

/po
Validate Story 34.7-FE using the Story Draft Checklist

# Approve Story

/po
Approve Story 34.7-FE for implementation

# Request Changes

/po
Story 34.7-FE needs changes: [list required changes]
```

### For @qa (Quality Advisor)

```markdown
# Review Implementation

/qa
Review the implementation of Story 34.7-FE

# Create Quality Gate

/qa
Create a quality gate for Story 34.7-FE

# Test Design

/qa
Design test scenarios for Story 34.7-FE
```

### For @architect (Architect)

```markdown
# Create Architecture

/architect
Create architecture documentation for Epic 34-FE

# Design Solution

/architect
Design a technical solution for [feature]

# Review Code

/architect
Review this code for architectural compliance
```

---

## Common Workflows

### Workflow 1: Implementing a New Story

```bash
# Step 1: Read .cursorrules
Read .cursorrules file completely

# Step 2: Read the story
Read docs/stories/epic-{ID}/story-{ID}.{NUM}*.md

# Step 3: Review Dev Notes
Check Dev Notes section for specific guidance

# Step 4: Implement tasks sequentially
Follow tasks listed in story

# Step 5: Write tests
Write unit tests and E2E tests

# Step 6: Update Dev Agent Record
Add your progress and notes

# Step 7: Run validation
npm run type-check && npm run lint && npm run test

# Step 8: Update File List
List all created/modified files

# Step 9: Commit changes
git commit -m "feat(story-{ID}.{NUM}): [description]"
```

### Workflow 2: Creating a New Epic

```bash
# Step 1: Consult @pm
/pm
Create Epic PRD for [feature]

# Step 2: Consult @architect
/architect
Design architecture for [feature]

# Step 3: Consult @ux-expert
/ux
Define UX requirements for [feature]

# Step 4: Create stories with @sm
/sm
Create stories for Epic [ID]

# Step 5: Validate with @po
/po
Validate stories for Epic [ID]
```

### Workflow 3: Reviewing and Quality Gates

```bash
# Step 1: Dev completes implementation

# Step 2: QA reviews
/qa
Review Story 34.7-FE implementation

# Step 3: QA creates gate
/qa
Create quality gate for Story 34.7-FE

# Step 4: Dev fixes issues (if any)

# Step 5: Final approval
```

---

## Cursor AI Features Integration

### 1. Context Awareness

Cursor AI automatically reads:

- `.cursorrules` - Project rules and standards
- BMad Domain Pack - Project-specific patterns
- Story files - Implementation requirements
- Architecture docs - Technical guidance

### 2. Agent Selection

Use appropriate agent based on task:

- **@dev** - For implementing stories
- **@pm** - For product decisions
- **@architect** - For architecture design
- **@sm** - For story creation
- **@po** - For story validation
- **@qa** - For quality assurance

### 3. Workflow Integration

BMad workflows are integrated as Cursor commands:

- `/create-epic` - Create new Epic
- `/create-story` - Create new story
- `/validate-story` - Validate story
- `/implement-story` - Implement story
- `/review-story` - Review story

---

## Tips for Best Results

1. **Always start with .cursorrules** - This is your primary reference
2. **Read stories completely** - Don't skip sections
3. **Follow patterns from domain pack** - Project-specific conventions
4. **Update Dev Agent Record** - Track your progress
5. **Write tests** - Don't skip this step
6. **Run validation** - Type-check, lint, and test before committing
7. **Use appropriate agents** - Each agent has specific expertise
8. **Ask for help** - If stuck, ask for clarification

---

## Troubleshooting

### Issue: Cursor AI doesn't know about BMad

**Solution**: Ensure `.cursorrules` file contains BMad agent references

### Issue: Story validation fails

**Solution**: Check Story Draft Checklist in `.bmad-core/checklists/story-draft-checklist.md`

### Issue: Tests failing

**Solution**: Check testing standards in `.cursorrules` section "Testing Rules"

### Issue: TypeScript errors

**Solution**: Check code standards in `.cursorrules` section "TypeScript Rules"

---

## Resources

- **.cursorrules** - Primary reference
- **BMad Domain Pack** - `.claude/commands/BMad/expansion-packs/wb-repricer-frontend-domain.yaml`
- **Story Draft Checklist** - `.bmad-core/checklists/story-draft-checklist.md`
- **Architecture Docs** - `docs/architecture/`
- **Epic Docs** - `docs/epics/`
- **Story Docs** - `docs/stories/`

---

**Last Updated**: 2026-01-10
**BMad Version**: v6.0.0-alpha.22
**Cursor AI Compatible**: ✅
