# Antigravity Integration Guide

## Overview

This guide explains how to use BMad framework with **Antigravity** for enhanced AI-assisted development.

**Note**: Antigravity is a conceptual framework for advanced AI workflow orchestration. If you have a specific tool or platform named Antigravity, adapt this guide accordingly.

---

## What is Antigravity?

Antigravity represents an advanced AI workflow system that:

- Enables seamless multi-agent collaboration
- Provides intelligent task orchestration
- Automates complex development workflows
- Enhances context awareness across agents

---

## Quick Start

1. **Ensure BMad framework is installed**

   ```bash
   # BMad is already installed in .claude/commands/BMad/
   ```

2. **Review agent configurations**

   ```bash
   # Agents are in .claude/commands/BMad/core/agents/
   ```

3. **Use workflows for automation**
   ```bash
   # Workflows are in .claude/commands/BMad/bmm/workflows/
   ```

---

## BMad + Antigravity Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Antigravity Orchestrator                │
│  - Multi-agent coordination                                │
│  - Task scheduling and routing                             │
│  - Context sharing across agents                           │
│  - Workflow automation                                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      BMad Framework                        │
│  - Specialized agents (@pm, @architect, @ux, @sm, @po)   │
│  - Implementation agents (@dev, @qa)                      │
│  - Workflows for common tasks                              │
│  - Checklists for quality assurance                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 WB Repricer Frontend                       │
│  - Next.js 14 + TypeScript                                │
│  - .cursorrules for AI guidance                           │
│  - Domain pack for project patterns                        │
└─────────────────────────────────────────────────────────────┘
```

---

## Agent Orchestration with Antigravity

### 1. Sequential Workflows

```yaml
workflow: Epic Creation
sequence:
  1. @pm: Create Epic PRD from business requirements
  2. @architect: Design technical architecture
  3. @ux-expert: Define UX requirements
  4. @sm: Create detailed stories
  5. @po: Validate stories
  6. @dev: Implement stories
  7. @qa: Review and quality gates
```

### 2. Parallel Workflows

```yaml
workflow: Multi-Feature Development
parallel:
  Feature A:
    - @sm: Create stories
    - @dev: Implement
    - @qa: Review
  Feature B:
    - @sm: Create stories
    - @dev: Implement
    - @qa: Review
```

### 3. Feedback Loops

```yaml
workflow: Iterative Refinement
steps:
  1. @sm: Create story
  2. @po: Validate story
  3. if validation fails:
     4. @sm: Revise story
     5. go to step 2
  6. @dev: Implement
  7. @qa: Review
  8. if review fails:
     9. @dev: Fix issues
     10. go to step 7
```

---

## Using BMad with Antigravity

### 1. Initialize Workflow

```python
# Pseudocode for Antigravity workflow initialization
antigravity = Antigravity()

# Load BMad framework
antigravity.load_agents('.claude/commands/BMad/core/agents/')
antigravity.load_workflows('.claude/commands/BMad/bmm/workflows/')
antigravity.load_domain_pack('.claude/commands/BMad/expansion-packs/wb-repricer-frontend-domain.yaml')

# Set project context
antigravity.set_context({
  'project': 'WB Repricer Frontend',
  'framework': 'Next.js 14',
  'language': 'TypeScript',
  'cursor_rules': '.cursorrules'
})
```

### 2. Execute Epic Creation Workflow

```python
# Epic creation workflow
epic_workflow = antigravity.workflow('create-epic')

# Step 1: PM creates Epic PRD
epic_workflow.step('@pm', 'create-prd', {
  'business_requirements': 'requirements.md',
  'epic_id': '38'
})

# Step 2: Architect designs solution
epic_workflow.step('@architect', 'design-architecture', {
  'epic_prd': 'docs/epics/epic-38-prd.md',
  'existing_architecture': 'docs/architecture/'
})

# Step 3: UX Expert defines requirements
epic_workflow.step('@ux-expert', 'define-ux-requirements', {
  'epic_prd': 'docs/epics/epic-38-prd.md',
  'existing_patterns': 'docs/ux/'
})

# Step 4: SM creates stories
epic_workflow.step('@sm', 'create-stories', {
  'epic_prd': 'docs/epics/epic-38-prd.md',
  'architecture_doc': 'docs/architecture/epic-38-arch.md',
  'ux_requirements': 'docs/ux/epic-38-ux.md'
})

# Step 5: PO validates stories
epic_workflow.step('@po', 'validate-stories', {
  'stories_location': 'docs/stories/epic-38/',
  'checklist': '.bmad-core/checklists/story-draft-checklist.md'
})

# Execute workflow
result = epic_workflow.execute()
```

### 3. Story Implementation Workflow

```python
# Story implementation workflow
story_workflow = antigravity.workflow('implement-story')

# Load story context
story_workflow.load_context('docs/stories/epic-34/story-34.7-fe-empty-state-hero-banner.md')

# Step 1: Dev implements
story_workflow.step('@dev', 'implement', {
  'story': 'docs/stories/epic-34/story-34.7-fe-empty-state-hero-banner.md',
  'cursor_rules': '.cursorrules',
  'domain_pack': '.claude/commands/BMad/expansion-packs/wb-repricer-frontend-domain.yaml'
})

# Step 2: Dev writes tests
story_workflow.step('@dev', 'write-tests', {
  'testing_standards': '.cursorrules (testing section)',
  'coverage_target': '80%'
})

# Step 3: QA reviews
story_workflow.step('@qa', 'review', {
  'implementation': story_workflow.get_changes(),
  'story_requirements': story_workflow.get_context()
})

# Step 4: QA creates gate
story_workflow.step('@qa', 'create-gate', {
  'review_results': story_workflow.get_review(),
  'location': 'docs/qa/gates/gate-story-34.7-fe.md'
})

# Execute workflow
result = story_workflow.execute()
```

---

## Context Sharing with Antigravity

### Shared Context

Antigravity enables context sharing across agents:

```yaml
shared_context:
  project_info:
    name: WB Repricer Frontend
    framework: Next.js 14
    language: TypeScript

  architecture:
    components_dir: src/components/
    pages_dir: src/app/
    hooks_dir: src/hooks/

  patterns:
    api_hooks: React Query
    state_management: Zustand
    forms: react-hook-form + zod

  quality:
    type_check: npm run type-check
    lint: npm run lint
    test: npm run test
    e2e_test: npm run test:e2e
```

### Context Propagation

```python
# Context flows through workflow
workflow.set_context('epic_id', '38')

# All agents have access to epic_id
workflow.step('@architect', 'create-architecture')
  # @architect uses context['epic_id'] = '38'

workflow.step('@sm', 'create-stories')
  # @sm uses context['epic_id'] = '38'
```

---

## Workflow Automation

### Automated Epic Pipeline

```yaml
name: automated-epic-pipeline
trigger: new_epic_requested

steps:
  - name: validate_requirements
    agent: @pm
    action: validate_business_requirements

  - name: create_prd
    agent: @pm
    action: create_epic_prd
    condition: requirements_valid

  - name: design_architecture
    agent: @architect
    action: create_architecture_document
    depends_on: create_prd

  - name: define_ux
    agent: @ux-expert
    action: define_ux_requirements
    depends_on: create_prd

  - name: create_stories
    agent: @sm
    action: create_stories_from_epic
    depends_on: [design_architecture, define_ux]

  - name: validate_stories
    agent: @po
    action: validate_all_stories
    depends_on: create_stories
    condition: stories_created

on_success:
  notify: "Epic ready for development"
on_failure:
  notify: "Epic creation failed"
  escalate: @pm
```

### Automated Story Pipeline

```yaml
name: automated-story-pipeline
trigger: story_validation_passed

steps:
  - name: implement
    agent: @dev
    action: implement_story
    context:
      cursor_rules: .cursorrules
      domain_pack: .claude/commands/BMad/expansion-packs/wb-repricer-frontend-domain.yaml

  - name: write_tests
    agent: @dev
    action: write_unit_and_e2e_tests
    depends_on: implement
    context:
      coverage_target: 80%

  - name: run_validation
    agent: @dev
    action: run_all_validations
    depends_on: write_tests
    commands:
      - npm run type-check
      - npm run lint
      - npm run test
      - npm run test:e2e

  - name: review
    agent: @qa
    action: review_implementation
    depends_on: run_validation

  - name: create_gate
    agent: @qa
    action: create_quality_gate
    depends_on: review

  - name: update_story
    agent: @dev
    action: update_dev_agent_record
    depends_on: create_gate

on_success:
  notify: "Story ready for merge"
on_failure:
  notify: "Story implementation failed"
  escalate: @po
```

---

## Advanced Features

### 1. Multi-Agent Collaboration

Antigravity enables agents to work together:

```python
# Parallel story creation
tasks = [
  antigravity.task('@sm', 'create-story', {'story': '34.1'}),
  antigravity.task('@sm', 'create-story', {'story': '34.2'}),
  antigravity.task('@sm', 'create-story', {'story': '34.3'})
]

results = antigravity.execute_parallel(tasks)
```

### 2. Intelligent Task Routing

```python
# Route tasks based on complexity
if complexity == 'low':
  antigravity.route('@dev', 'implement')
elif complexity == 'medium':
  antigravity.route(['@dev', '@qa'], 'implement_and_review')
else:
  antigravity.route(['@architect', '@dev', '@qa'], 'complex_implementation')
```

### 3. Context-Aware Decision Making

```python
# Make decisions based on shared context
if context['testing_coverage'] < 80:
  antigravity.route('@dev', 'write_more_tests')
elif context['lint_errors'] > 0:
  antigravity.route('@dev', 'fix_lint_errors')
else:
  antigravity.route('@qa', 'review')
```

---

## Best Practices

### 1. Clear Agent Responsibilities

- **@pm**: Product decisions and Epic PRDs
- **@architect**: Technical architecture
- **@ux-expert**: UX requirements
- **@sm**: Story creation and refinement
- **@po**: Story validation and backlog
- **@dev**: Implementation
- **@qa**: Quality gates and review

### 2. Proper Context Management

- Always load context before workflow execution
- Share context across related agents
- Update context as work progresses

### 3. Workflow Design

- Define clear steps and dependencies
- Include error handling and escalation
- Provide success/failure notifications

### 4. Quality Assurance

- Use checklists for validation
- Create gates at critical points
- Review and approve at each stage

---

## Troubleshooting

### Issue: Agents not coordinating

**Solution**:

- Check Antigravity orchestrator is running
- Verify agent configurations are loaded
- Ensure shared context is properly set

### Issue: Workflows failing

**Solution**:

- Check workflow dependencies
- Verify all required context is available
- Review agent logs for errors

### Issue: Context not shared

**Solution**:

- Ensure context is explicitly set
- Verify agents are reading from shared context
- Check for conflicting context values

---

## Resources

- **BMad Framework**: `.claude/commands/BMad/`
- **Agent Configs**: `.claude/commands/BMad/core/agents/`
- **Workflows**: `.claude/commands/BMad/bmm/workflows/`
- **Cursor Integration**: `docs/BMAD-CURSOR-INTEGRATION-GUIDE.md`
- **Domain Pack**: `.claude/commands/BMad/expansion-packs/wb-repricer-frontend-domain.yaml`

---

**Last Updated**: 2026-01-10
**BMad Version**: v6.0.0-alpha.22
**Antigravity Compatible**: ✅

---

## Next Steps

1. **Review agent configurations** in `.claude/commands/BMad/core/agents/`
2. **Check workflows** in `.claude/commands/BMad/bmm/workflows/`
3. **Read Cursor Integration Guide** at `docs/BMAD-CURSOR-INTEGRATION-GUIDE.md`
4. **Initialize Antigravity orchestrator** with BMad framework
5. **Start with simple workflows** (e.g., single story implementation)
6. **Scale to complex workflows** (e.g., multi-epic development)
