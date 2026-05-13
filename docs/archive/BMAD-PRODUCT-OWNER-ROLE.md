# BMad Product Owner Role Explained

**Created**: 2026-01-10
**Purpose**: Clarify the Product Owner role in BMad framework and how it integrates with agents
**Context**: WB Repricer Frontend with BMad v6.0.0-alpha.22

---

## Executive Summary

**Question**: "We don't have a Product agent. PO - is this normal, who performs his role. I know he existed before."

**Answer**: Yes, the Product Owner agent **does exist** in BMad framework, but it works differently than you might expect. The **USER (you)** plays the Product Owner role, and agents collaborate WITH you as Product Owner.

---

## 📋 The Three Layers of Product Owner

### 1. **Original BMad Framework**

**Location**: `.bmad-core/agents/po.md`

**Status**: ✅ EXISTS
**Purpose**: Product Owner agent with responsibilities for backlog management, story validation, acceptance criteria, sprint planning, prioritization decisions.

**Key Characteristics**:

- User-focused product ownership
- Validates stories from Scrum Master
- Manages backlog and sprint priorities
- Ensures stories are ready for development

**Documentation**: Listed in `AGENTS.md` (line 42) with full agent definition.

---

### 2. **BMad Workflow Design**

**Key Principle**: The **USER acts as Product Owner** in all BMad workflows.

**Evidence from `create-epics-and-stories/workflow.md` (line 11)**:

```yaml
Your Role: In addition to your name, communication_style, and persona,
you are also a product strategist and technical specifications writer
collaborating with a product owner. This is a partnership, not a
client-vendor relationship. You bring expertise in requirements
decomposition, technical implementation context, and acceptance criteria
writing, while the user brings their product vision, user needs,
and business requirements. Work together as equals.
```

**How It Works**:

| Agent                 | Role                         | Product Owner Role                                |
| --------------------- | ---------------------------- | ------------------------------------------------- |
| @pm (Product Manager) | Creates PRDs, epics, stories | Collaborates with **USER** (you) as Product Owner |
| @architect            | Designs architecture         | Collaborates with **USER** (you) as Product Owner |
| @sm (Scrum Master)    | Prepares story files         | Collaborates with **USER** (you) as Product Owner |
| @dev (Developer)      | Implements stories           | Collaborates with **USER** (you) as Product Owner |

**Why This Design**:

1. **Human Product Owner Knows the Business**: You know your users, market, and business goals better than any AI agent.
2. **Partnership Model**: Agents are **equals**, not vendors. They bring technical expertise, you bring product vision.
3. **Agile Best Practices**: In real Scrum, the Product Owner is a human role, not an automated process.
4. **Flexibility**: You can make strategic decisions, trade-offs, and prioritize based on business context.

---

### 3. **Our Custom Cursor AI Integration**

**Location**: `.claude/commands/BMad/core/agents/po.agent.yaml`

**Status**: ✅ CUSTOM VERSION (Created by us)
**Purpose**: Product Owner agent specifically configured for Cursor AI integration

**Key Differences from Original BMad**:

| Feature        | Original BMad PO           | Our Cursor AI PO              |
| -------------- | -------------------------- | ----------------------------- |
| Format         | Markdown (.md)             | YAML (.agent.yaml)            |
| IDE Support    | Codex/Web                  | Cursor AI, Claude Code, Codex |
| Integration    | Standard BMad              | Custom Cursor AI rules        |
| Workflow Usage | NOT used in BMad workflows | NOT used in BMad workflows    |

**Our Custom PO Agent Responsibilities**:

```yaml
responsibilities:
  backlog_management:
    - Maintain product backlog
    - Prioritize stories for sprints
    - Ensure stories are ready for development
    - Manage dependencies between stories
    - Track story completion status

  story_validation:
    - Validate story drafts from SM
    - Ensure stories meet acceptance criteria
    - Verify technical feasibility
    - Check for sufficient context
    - Approve or reject story drafts

  quality_assurance:
    - Ensure stories are testable
    - Verify acceptance criteria are measurable
    - Check for proper documentation
    - Maintain story consistency
```

**Cursor Commands**:

```yaml
cursor_commands:
  - validate-story: Validate a story draft using Story Draft Checklist
  - approve-story: Approve a validated story
  - reject-story: Reject a story with reasons
  - request-changes: Request specific changes to a story
  - check-backlog: Review and manage product backlog
```

**Important Note**: This custom PO agent is **NOT used in standard BMad workflows**. It's available as a specialized tool for Cursor AI but doesn't replace the USER as Product Owner in the BMad workflow process.

---

## 🔍 How Product Owner Role Works in Practice

### Scenario 1: Creating Epics and Stories

**Workflow**: `create-epics-and-stories`
**Agent**: @pm (Product Manager)
**Product Owner**: **YOU (USER)**

**Process**:

1. **@pm Agent** (Product Manager) creates PRD with requirements
2. **@pm Agent** (Product Manager) breaks down PRD into epics and stories
3. **@pm Agent** (Product Manager) collaborates with **YOU** to:
   - Validate business requirements
   - Confirm user value priorities
   - Adjust story scope based on business constraints
   - Make trade-off decisions (time vs. features vs. quality)

**Example Dialogue**:

```
@pm: "I've broken down the dashboard feature into 3 stories:
   1. Basic dashboard layout
   2. Metrics visualization
   3. Advanced filtering

   Based on the PRD, this seems like the right breakdown.
   Does this align with your vision, or should we adjust scope?"

YOU (Product Owner): "Story 3 (Advanced filtering) is important,
   but we can defer it to v2 if needed. Let's keep it lower priority."

@pm: "Got it. I'll mark it as P2 and keep stories 1-2 as P0 for MVP."
```

---

### Scenario 2: Preparing Story Files

**Workflow**: `create-story`
**Agent**: @sm (Scrum Master)
**Product Owner**: **YOU (USER)**

**Process**:

1. **@sm Agent** (Scrum Master) prepares detailed story file with tasks and acceptance criteria
2. **@sm Agent** (Scrum Master) asks **YOU** to validate:
   - Are acceptance criteria correct?
   - Is the story scope appropriate?
   - Are there missing requirements?
3. **YOU (Product Owner)** approves or requests changes

**Example Dialogue**:

```
@sm: "I've prepared story 1.3: 'User Profile Page' with the following AC:
   - User can view their profile information
   - User can edit email and phone
   - User can upload profile picture

   Are these the correct requirements, or should I adjust?"

YOU (Product Owner): "Yes, these are correct for v1.
   But please add AC: 'Changes are saved to local storage if offline'"

@sm: "Got it. I'll add that AC and update the tasks accordingly."
```

---

### Scenario 3: Development Handoff

**Workflow**: `dev-story`
**Agent**: @dev (Developer)
**Product Owner**: **YOU (USER)**

**Process**:

1. **@dev Agent** (Developer) implements the story
2. **@dev Agent** (Developer) asks **YOU** clarifying questions:
   - How should this edge case be handled?
   - Which is more important: performance or simplicity?
   - Should we refactor this now or create a tech debt ticket?

**Example Dialogue**:

```
@dev: "I'm implementing the dashboard metrics calculation.
   I found two approaches:
   1. Calculate on-demand (slower, less code)
   2. Pre-calculate and cache (faster, more code)

   Which approach should I use?"

YOU (Product Owner): "Use option 2 (cache). Users expect fast loading,
   and we have time to implement it properly in this sprint."
```

---

## 📊 Workflow Agent Assignment Summary

| Workflow                   | Agent      | Product Owner  |
| -------------------------- | ---------- | -------------- |
| `create-prd`               | @pm        | **YOU (USER)** |
| `create-architecture`      | @architect | **YOU (USER)** |
| `create-epics-and-stories` | @pm        | **YOU (USER)** |
| `create-story`             | @sm        | **YOU (USER)** |
| `dev-story`                | @dev       | **YOU (USER)** |
| `sprint-planning`          | @sm        | **YOU (USER)** |
| `retrospective`            | @sm        | **YOU (USER)** |

**No BMad workflow uses @po agent** - all workflows assume USER as Product Owner.

---

## 🎯 Why BMad Designed It This Way

### 1. **Agile Methodology Alignment**

**Real Scrum Team**:

- Product Owner: Human (business decision-maker)
- Scrum Master: Human (process facilitator)
- Development Team: Humans (implementers)

**BMad AI Team**:

- Product Owner: **YOU (human)** - Business vision, priorities, trade-offs
- Scrum Master: **@sm agent** - Story preparation, sprint management
- Development Team: **@dev agent** - Code implementation, testing

**Key Insight**: Product Owner must be human because:

- Requires business context and market knowledge
- Makes strategic trade-off decisions
- Represents stakeholder interests
- Adjusts priorities based on changing circumstances

### 2. **AI Agent Capabilities vs. Limitations**

**What AI Agents Do Well**:

- Technical decomposition (break down requirements)
- Code implementation and refactoring
- Pattern recognition and optimization
- Testing and validation
- Documentation generation

**What AI Agents Struggle With**:

- Business strategy and market fit
- User empathy and needs understanding
- Political and organizational constraints
- Budget and resource reality
- Strategic trade-offs (time vs. scope vs. quality)

**Conclusion**: Let AI handle technical work, let humans handle business decisions.

### 3. **Partnership Model Benefits**

**Traditional AI as Vendor**:

```
User: "Build me a dashboard."
AI: "Here's a dashboard."
User: "This is wrong."
AI: "Sorry, I'll try again."
```

**BMad Partnership Model**:

```
@pm: "I'm creating a dashboard feature. Here are 3 possible story breakdowns.
   Option 1: [Simple, fast, fewer features]
   Option 2: [Balanced features, medium effort]
   Option 3: [Comprehensive features, slower delivery]

   Which approach aligns with your v1 goals?"

YOU (Product Owner): "Option 2 looks right for v1. We want feature-complete
   but need to deliver this sprint. Let's defer advanced features to v2."

@pm: "Perfect. I'll structure the stories accordingly and create a roadmap
   that gets us to v3 with the advanced features."
```

**Key Difference**: AI asks **YOU** for strategic decisions, then handles technical execution.

---

## 💡 Practical Guidance: How to Be Product Owner

### Before Starting Development

**Your Responsibilities**:

1. **Define Product Vision**
   - What problem are we solving?
   - Who are the target users?
   - What's the v1 goal vs. long-term vision?

2. **Prioritize Features**
   - What's critical for v1 (P0)?
   - What's important but can wait (P1)?
   - What's nice-to-have (P2)?

3. **Define Success Metrics**
   - How do we measure success?
   - What are the key performance indicators (KPIs)?

### During Development

**Your Responsibilities**:

1. **Validate Stories**
   - Are acceptance criteria correct?
   - Is the story scope appropriate?
   - Are there missing requirements?

2. **Make Trade-Off Decisions**
   - Performance vs. simplicity
   - Time vs. features vs. quality
   - Refactor now vs. technical debt

3. **Clarify Ambiguities**
   - Answer agent questions about behavior
   - Provide context for edge cases
   - Confirm integration requirements

### After Development

**Your Responsibilities**:

1. **Review Completed Features**
   - Does this meet the vision?
   - Are there any issues?
   - Should we adjust priorities for next sprint?

2. **Plan Next Iteration**
   - What's next based on learnings?
   - Should we adjust the roadmap?
   - Are there any technical debt items to prioritize?

---

## 🛠️ When to Use @po Agent (Optional)

**Our Custom @po Agent** is available as a specialized tool for Cursor AI but is **NOT part of standard BMad workflows**.

**Use @po Agent When**:

1. **Automated Story Validation**
   - You have many stories to validate
   - You want consistency checks applied automatically
   - You're delegating routine validation tasks

2. **Backlog Management Assistance**
   - You want help organizing and prioritizing backlog
   - You need to track story dependencies
   - You want to generate sprint planning documents

3. **Quality Checks Before Development**
   - You want to verify stories are testable
   - You need to check acceptance criteria are measurable
   - You want to ensure technical guidance is sufficient

**Important**: Using @po agent is **optional**. The standard BMad approach is for **YOU** to be Product Owner, not an AI agent.

---

## 📚 Key Files Reference

### Original BMad PO Agent

```bash
# Location
.bmad-core/agents/po.md

# Documentation
AGENTS.md (line 42: Product Owner)

# Responsibilities
- Backlog management
- Story validation
- Acceptance criteria verification
- Sprint planning
- Prioritization decisions
```

### Our Custom Cursor AI PO Agent

```bash
# Location
.claude/commands/BMad/core/agents/po.agent.yaml

# Custom Configuration
- Cursor AI rules integration
- Custom cursor_commands for workflow automation
- Story validation checklists
- Quality assurance criteria
```

### BMad Workflow Design

```bash
# Main Workflow
_bmad/bmm/workflows/3-solutioning/create-epics-and-stories/workflow.md

# Key Principle (line 11)
"collaborating with a product owner as equals, not client-vendor"

# All Workflows
_bmad/_config/workflow-manifest.csv

# Note: No workflow uses @po agent - all assume USER as Product Owner
```

---

## ✅ Summary: Answer to Your Question

**Question**: "We don't have a Product agent. PO - is this normal, who performs his role. I know he existed before."

**Answer**:

1. **Yes, PO agent exists** in original BMad framework (`.bmad-core/agents/po.md`)
2. **Yes, PO agent exists** in our custom Cursor AI integration (`.claude/commands/BMad/core/agents/po.agent.yaml`)
3. **However, PO agent is NOT used in BMad workflows** - all workflows assume **YOU (USER)** act as Product Owner
4. **This is BY DESIGN** - Product Owner is a human role in real Scrum, and BMad follows this principle
5. **You collaborate with agents** (@pm, @architect, @sm, @dev) as equals, bringing your product vision and business knowledge
6. **Agents bring technical expertise**, you bring business strategy - together you build the right product

**So yes, it's normal!** The Product Owner role exists as an agent definition, but the actual Product Owner in BMad workflows is **YOU**.

---

## 🎬 Recommended Approach

### For Your Project (WB Repricer Frontend)

**Standard BMad Approach** (Recommended):

- **YOU act as Product Owner**
- Use `@pm` for PRD, epics, stories creation
- Use `@architect` for system architecture
- Use `@sm` for story preparation
- Use `@dev` for implementation
- You provide product vision, priorities, and business context

### When You Might Use @po Agent:

- You have many stories to validate and want automated consistency checks
- You want help with backlog management and sprint planning
- You want to delegate routine validation tasks

**Bottom Line**: Start with **YOU as Product Owner**. If you find you need automated story validation or backlog management, then consider using `@po` agent as a helper tool. But the core Product Owner decisions should always come from **YOU**.

---

**Next Steps**:

1. Try the standard BMad approach: YOU as Product Owner
2. Use `@pm` to create epics and stories (it will collaborate with you as Product Owner)
3. If you need automated validation, try `@po` agent as an optional helper
4. Focus on providing clear product vision and business requirements

---

**Questions?** If anything is unclear about how to be Product Owner in BMad workflows, or when to use `@po` agent, feel free to ask!
