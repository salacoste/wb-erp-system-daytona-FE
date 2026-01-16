# Cursor AI + Antigravity: Usage Examples

## Examples for Developers

---

## 1. Implementing a Story with Cursor AI

### Step-by-Step Example

**Scenario**: Implement Story 34.7-FE (Empty State Hero Banner)

```
# In Cursor AI, type:

/dev
Read .cursorrules completely, then implement Story 34.7-FE from docs/stories/epic-34/story-34.7-fe-empty-state-hero-banner.md

Steps:
1. Read .cursorrules
2. Read the story completely
3. Review Dev Notes section
4. Implement tasks sequentially
5. Write unit tests with Vitest
6. Write E2E tests with Playwright
7. Update Dev Agent Record
8. Update File List
9. Run validation (type-check, lint, test)
```

**Expected Output**:

- Dev agent reads `.cursorrules`
- Reads story from `docs/stories/epic-34/story-34.7-fe-empty-state-hero-banner.md`
- Implements tasks in order
- Creates files:
  - `src/components/TelegramBindingCard.tsx` (modified)
  - `src/hooks/useTelegramBinding.ts` (created)
- Creates tests:
  - `src/components/__tests__/TelegramBindingCard.test.tsx`
  - `e2e/telegram-binding.spec.ts`
- Updates Dev Agent Record in story
- Runs validation and reports results

---

## 2. Creating a New Epic with Cursor AI

### Step-by-Step Example

**Scenario**: Create Epic 38-FE for Analytics Dashboard

```
# In Cursor AI, type:

/pm
Create Epic PRD for "Analytics Dashboard" feature with the following requirements:

Business Requirements:
- Display product performance metrics
- Show sales trends over time
- Compare competitor pricing
- Export data to CSV

Target Users: Store managers
Success Metrics: 30% increase in pricing decisions

Steps:
1. Create Epic PRD in docs/epics/epic-38-analytics-dashboard-prd.md
2. Define user stories
3. Identify technical requirements
4. Set success metrics
```

**Expected Output**:

- PM agent creates `docs/epics/epic-38-analytics-dashboard-prd.md`
- Epic contains:
  - Problem Statement
  - Solution Overview
  - User Stories
  - Technical Requirements
  - Success Metrics
  - Dependencies
  - Risk Assessment

---

## 3. Validating a Story with Cursor AI

### Step-by-Step Example

**Scenario**: Validate Story 34.7-FE with PO agent

```
# In Cursor AI, type:

/po
Validate Story 34.7-FE using the Story Draft Checklist from .bmad-core/checklists/story-draft-checklist.md

Story location: docs/stories/epic-34/story-34.7-fe-empty-state-hero-banner.md

Check:
1. Goal & Context Clarity
2. Technical Implementation Guidance
3. Reference Effectiveness
4. Self-Containment Assessment
5. Testing Guidance

Provide:
- PASS/PARTIAL/FAIL status for each category
- Overall readiness assessment
- Specific issues if any
- Recommendations
```

**Expected Output**:

- PO agent validates story against checklist
- Provides validation report:

  ```
  | Category | Status | Issues |
  |----------|--------|--------|
  | 1. Goal & Context Clarity | ✅ PASS | None |
  | 2. Technical Implementation Guidance | ✅ PASS | None |
  | 3. Reference Effectiveness | ✅ PASS | None |
  | 4. Self-Containment Assessment | ✅ PASS | None |
  | 5. Testing Guidance | ✅ PASS | None |

  Overall: ✅ READY FOR IMPLEMENTATION
  Clarity Score: 9.5/10
  ```

---

## 4. Architecture Design with Cursor AI

### Step-by-Step Example

**Scenario**: Design architecture for Epic 38-FE

```
# In Cursor AI, type:

/architect
Create architecture document for Epic 38-FE (Analytics Dashboard)

Epic PRD: docs/epics/epic-38-analytics-dashboard-prd.md

Consider:
- Component architecture
- Data flow
- API integration patterns
- State management strategy
- Performance optimization

Create: docs/architecture/epic-38-analytics-dashboard-arch.md
```

**Expected Output**:

- Architect agent creates architecture document
- Architecture includes:
  - System overview
  - Component hierarchy
  - Data flow diagrams
  - API integration patterns
  - State management strategy
  - Performance considerations

---

## 5. Quality Gate with Cursor AI

### Step-by-Step Example

**Scenario**: QA reviews Story 34.7-FE implementation

```
# In Cursor AI, type:

/qa
Review the implementation of Story 34.7-FE and create a quality gate

Story: docs/stories/epic-34/story-34.7-fe-empty-state-hero-banner.md
Dev Agent Record: [see story file]
File List: [see story file]

Check:
- Code quality (follows .cursorrules)
- Test coverage (≥80%)
- Architecture compliance
- Security
- Performance
- Accessibility (WCAG 2.1 AA)

Create gate file: docs/qa/gates/gate-story-34.7-fe.md

Decision: PASS / CONCERNS / FAIL
```

**Expected Output**:

- QA agent reviews implementation
- Creates quality gate document:
  ```yaml
  Status: PASS
  Issues: []
  Recommendations: []
  Coverage: 85%
  Security: No issues
  Accessibility: WCAG 2.1 AA compliant
  ```

---

## Examples for Antigravity

### 1. Automated Epic Creation Workflow

```python
# Initialize Antigravity
antigravity = Antigravity()
antigravity.load_bmad_framework()

# Create Epic 38-FE
epic_workflow = antigravity.workflow('automated-epic-pipeline')

# Set epic context
epic_workflow.set_context({
  'epic_id': '38',
  'epic_name': 'Analytics Dashboard',
  'business_requirements': 'requirements.md'
})

# Execute workflow
result = epic_workflow.execute()

# Expected:
# - PM creates Epic PRD
# - Architect designs architecture
# - UX Expert defines requirements
# - SM creates stories
# - PO validates stories
# - Epic ready for development
```

### 2. Parallel Story Creation with Antigravity

```python
# Create multiple stories in parallel
stories = [
  {'epic': '38', 'id': '38.1', 'name': 'Dashboard Layout'},
  {'epic': '38', 'id': '38.2', 'name': 'Metrics Display'},
  {'epic': '38', 'id': '38.3', 'name': 'Data Export'},
]

tasks = [
  antigravity.task('@sm', 'create-story', story)
  for story in stories
]

results = antigravity.execute_parallel(tasks)

# Expected:
# - Story 38.1 created
# - Story 38.2 created
# - Story 38.3 created
# - All created in parallel (faster than sequential)
```

### 3. Automated Story Implementation Workflow

```python
# Implement Story 34.7-FE
story_workflow = antigravity.workflow('automated-story-pipeline')

# Load story context
story_workflow.load_context('docs/stories/epic-34/story-34.7-fe-empty-state-hero-banner.md')

# Set execution context
story_workflow.set_context({
  'cursor_rules': '.cursorrules',
  'domain_pack': '.claude/commands/BMad/expansion-packs/wb-repricer-frontend-domain.yaml',
  'coverage_target': '80%'
})

# Execute workflow
result = story_workflow.execute()

# Expected:
# - @dev implements story
# - @dev writes tests
# - @dev runs validation (type-check, lint, test)
# - @qa reviews implementation
# - @qa creates quality gate
# - @dev updates Dev Agent Record
# - Story ready for merge
```

### 4. Context Sharing Across Agents

```python
# Create Epic 38-FE with context sharing
epic_workflow = antigravity.workflow('create-epic')

# Step 1: PM creates Epic PRD
epic_workflow.step('@pm', 'create-prd', {
  'epic_id': '38',
  'requirements': 'requirements.md'
})

# Step 2: Architect uses context from PM
epic_workflow.step('@architect', 'design-architecture', {
  'use_context': 'epic_prd',  # Use PRD from previous step
  'epic_id': '38'
})

# Step 3: UX Expert uses context from Architect
epic_workflow.step('@ux-expert', 'define-ux', {
  'use_context': ['epic_prd', 'architecture_doc'],  # Use multiple contexts
  'epic_id': '38'
})

# Execute
result = epic_workflow.execute()

# Expected:
# - Each agent has access to previous agents' work
# - Context is automatically shared
# - Agents can reference each other's outputs
```

### 5. Intelligent Task Routing with Antigravity

```python
# Route tasks based on complexity
def route_task(task):
  if task['complexity'] == 'low':
    return antigravity.route('@dev', 'simple_implementation')
  elif task['complexity'] == 'medium':
    return antigravity.route(['@dev', '@qa'], 'standard_implementation')
  else:
    return antigravity.route(
      ['@architect', '@dev', '@qa'],
      'complex_implementation'
    )

# Example: Route Story 34.7-FE
story = {
  'id': '34.7',
  'name': 'Empty State Hero Banner',
  'complexity': 'medium'
}

route_task(story)

# Expected:
# - Routes to @dev and @qa
# - Dev implements
# - QA reviews
# - Quality gate created
```

### 6. Automated Quality Gates with Antigravity

```python
# Automated quality gate workflow
quality_workflow = antigravity.workflow('automated-quality-gate')

# Set story context
quality_workflow.load_context('docs/stories/epic-34/story-34.7-fe-empty-state-hero-banner.md')

# Execute quality checks
quality_workflow.step('@qa', 'review_implementation')
quality_workflow.step('@qa', 'check_coverage', {'target': '80%'})
quality_workflow.step('@qa', 'check_security')
quality_workflow.step('@qa', 'check_accessibility', {'standard': 'WCAG 2.1 AA'})
quality_workflow.step('@qa', 'create_gate')

# Execute
result = quality_workflow.execute()

# Expected:
# - QA reviews implementation
# - Checks test coverage (≥80%)
# - Checks security issues
# - Checks accessibility compliance
# - Creates quality gate with PASS/CONCERNS/FAIL decision
```

---

## Combined Examples

### 1. Full Epic Lifecycle with Antigravity

```python
# Complete Epic 38-FE lifecycle
antigravity = Antigravity()
antigravity.load_bmad_framework()

# Phase 1: Create Epic
epic = antigravity.workflow('create-epic')
epic.set_context({'epic_id': '38', 'requirements': 'requirements.md'})
epic_result = epic.execute()

# Phase 2: Create Stories (in parallel)
stories = antigravity.workflow('create-stories-parallel')
stories.set_context({'epic_id': '38'})
stories_result = stories.execute()

# Phase 3: Validate Stories (in parallel)
validation = antigravity.workflow('validate-stories-parallel')
validation.set_context({'epic_id': '38'})
validation_result = validation.execute()

# Phase 4: Implement Stories (sequential)
implementation = antigravity.workflow('implement-stories')
implementation.set_context({'epic_id': '38', 'cursor_rules': '.cursorrules'})
implementation_result = implementation.execute()

# Phase 5: Quality Gates (in parallel)
gates = antigravity.workflow('create-quality-gates-parallel')
gates.set_context({'epic_id': '38'})
gates_result = gates.execute()

# Expected:
# - Epic 38-FE created
# - All stories created
# - All stories validated
# - All stories implemented
# - All quality gates created
# - Epic ready for release
```

### 2. Cursor AI + Antigravity Hybrid Workflow

```python
# Use Cursor AI for development, Antigravity for orchestration
antigravity = Antigravity()
antigravity.load_bmad_framework()

# Step 1: Create Epic with Antigravity
epic = antigravity.workflow('create-epic')
epic.step('@pm', 'create-prd', {'requirements': 'requirements.md'})
epic.execute()

# Step 2: Create Stories with Cursor AI
# Developer uses Cursor AI:
# /sm
# Create stories for Epic 38-FE

# Step 3: Validate Stories with Cursor AI
# Product Owner uses Cursor AI:
# /po
# Validate stories for Epic 38-FE

# Step 4: Implement Stories with Cursor AI
# Developer uses Cursor AI:
# /dev
# Implement Story 38.1-FE

# Step 5: Quality Gate with Antigravity
gate = antigravity.workflow('quality-gate')
gate.step('@qa', 'review', {'story': '38.1-FE'})
gate.step('@qa', 'create-gate', {'story': '38.1-FE'})
gate.execute()

# Expected:
# - Best of both worlds
# - Cursor AI for interactive development
# - Antigravity for automated workflows
```

---

## Troubleshooting Examples

### Issue: Story Implementation Failed

```
# In Cursor AI, type:

/dev
Story 34.7-FE implementation failed. Help me debug:

Errors:
1. TypeScript error: Type 'undefined' is not assignable to type 'string'
2. Test failure: Expected hero banner to have class "text-gray-900"

Context:
- Story: docs/stories/epic-34/story-34.7-fe-empty-state-hero-banner.md
- Dev Agent Record: [current progress]
- Files modified: [list of files]

Steps to debug:
1. Review TypeScript errors
2. Review test failures
3. Check Dev Notes section for guidance
4. Check .cursorrules for patterns
5. Fix issues
6. Re-run tests
7. Update Dev Agent Record
```

### Issue: Quality Gate FAILED

```
# In Cursor AI, type:

/qa
Quality gate for Story 34.7-FE failed. Help me understand:

Gate file: docs/qa/gates/gate-story-34.7-fe.md
Decision: FAIL

Issues:
1. Test coverage is 75% (target: 80%)
2. Missing accessibility ARIA labels
3. Lint errors: 3

Steps to fix:
1. Review gate file
2. Fix test coverage (add more tests)
3. Fix accessibility (add ARIA labels)
4. Fix lint errors
5. Re-run validation
6. Request re-review

Help me fix these issues one by one.
```

---

## Summary

These examples show how to use BMad framework with:

- **Cursor AI**: Interactive development with specialized agents
- **Antigravity**: Automated workflow orchestration
- **Combined**: Best of both worlds

**Key Takeaways**:

1. Always read `.cursorrules` first with Cursor AI
2. Use appropriate agents for each task
3. Leverage Antigravity for automation
4. Combine both approaches for maximum efficiency
5. Follow workflows for consistent results

---

**Last Updated**: 2026-01-10
**BMad Version**: v6.0.0-alpha.22
