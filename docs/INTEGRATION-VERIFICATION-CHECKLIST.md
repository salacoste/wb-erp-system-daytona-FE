# Cursor AI + Antigravity Integration Verification Checklist

## 📋 Purpose

This checklist helps verify that the BMad framework has been properly integrated with Cursor AI and Antigravity for the WB Repricer Frontend project.

---

## ✅ Cursor AI Integration

### Phase 1: Core Files

- [ ] `.cursorrules` file exists and is not empty

  ```bash
  ls -lh .cursorrules
  # Should show file size > 0 bytes
  ```

- [ ] `.cursorrules` contains all required sections:
  - [ ] Project Overview
  - [ ] Technology Stack
  - [ ] Code Standards (TypeScript, React, API integration)
  - [ ] Component Patterns (API hooks, state management, forms)
  - [ ] Testing Requirements (Vitest, Playwright)
  - [ ] Common Pitfalls to Avoid
  - [ ] BMad Agent Integration

- [ ] `.cursorrules` mentions BMad agents:
  - [ ] @pm
  - [ ] @architect
  - [ ] @ux-expert
  - [ ] @sm
  - [ ] @po
  - [ ] @dev
  - [ ] @qa

**Verification Command**:

```bash
cat .cursorrules | grep -E "(PM|Architect|UX|SM|PO|Dev|QA)"
```

### Phase 2: Agent Configurations

- [ ] All agent configs updated for Cursor AI:
  - [ ] `.claude/commands/BMad/core/agents/dev.agent.yaml` (version: 1.0.0-cursor)
  - [ ] `.claude/commands/BMad/core/agents/pm.agent.yaml` (version: 1.0.0-cursor)
  - [ ] `.claude/commands/BMad/core/agents/po.agent.yaml` (version: 1.0.0-cursor)
  - [ ] `.claude/commands/BMad/core/agents/sm.agent.yaml` (version: 1.0.0-cursor)
  - [ ] `.claude/commands/BMad/core/agents/qa.agent.yaml` (version: 1.0.0-cursor)
  - [ ] `.claude/commands/BMad/core/agents/architect.agent.yaml` (version: 1.0.0-cursor)

- [ ] Each agent config contains:
  - [ ] `cursor_rules` section with:
    - [ ] location: `.cursorrules`
    - [ ] framework: `BMad v6.0.0-alpha.22`
    - [ ] domain_pack path
  - [ ] `cursor_workflow` section
  - [ ] `cursor_commands` section

**Verification Command**:

```bash
for agent in dev pm po sm qa architect; do
  echo "=== Checking $agent.agent.yaml ==="
  grep -E "(version.*cursor|cursor_rules|cursor_workflow|cursor_commands)" ".claude/commands/BMad/core/agents/$agent.agent.yaml"
done
```

### Phase 3: Documentation

- [ ] BMad Cursor Integration Guide exists:

  ```bash
  ls -lh docs/BMAD-CURSOR-INTEGRATION-GUIDE.md
  ```

- [ ] Integration guide contains:
  - [ ] Quick Start section
  - [ ] Agent descriptions and usage
  - [ ] Workflow examples
  - [ ] Cursor-specific commands
  - [ ] Troubleshooting section

- [ ] BMad Integration Overview exists:

  ```bash
  ls -lh docs/BMAD-INTEGRATION-OVERVIEW.md
  ```

- [ ] Usage Examples document exists:
  ```bash
  ls -lh docs/BMAD-USAGE-EXAMPLES.md
  ```

**Verification Command**:

```bash
ls -lh docs/BMAD-*.md
```

---

## ✅ Antigravity Integration

### Phase 1: Core Files

- [ ] BMad Antigravity Integration Guide exists:

  ```bash
  ls -lh docs/BMAD-ANTIGRAVITY-INTEGRATION-GUIDE.md
  ```

- [ ] Integration guide contains:
  - [ ] Antigravity overview
  - [ ] BMad + Antigravity architecture
  - [ ] Agent orchestration patterns
  - [ ] Workflow automation examples
  - [ ] Context sharing patterns

### Phase 2: Configuration

- [ ] `.bmad-core/core-config.yaml` updated with:
  - [ ] `cursor` section:
    - [ ] enabled: true
    - [ ] cursorRulesFile: `.cursorrules`
    - [ ] domainPack path
    - [ ] integrationGuide path
    - [ ] agents list
  - [ ] `antigravity` section:
    - [ ] enabled: true
    - [ ] orchestrator: `antigravity`
    - [ ] integrationGuide path
    - [ ] workflows list
    - [ ] contextSharing: true
    - [ ] parallelExecution: true

**Verification Command**:

```bash
cat .bmad-core/core-config.yaml | grep -A 10 "cursor:"
cat .bmad-core/core-config.yaml | grep -A 10 "antigravity:"
```

---

## ✅ End-to-End Verification

### Test 1: Cursor AI - Story Implementation

**Scenario**: Use Cursor AI to implement a story

**Steps**:

- [ ] Open project in Cursor AI
- [ ] Type: `/dev` and request to read `.cursorrules`
- [ ] Verify Cursor AI recognizes the agent and loads `.cursorrules`
- [ ] Type: `/dev` and request to implement Story 34.7-FE
- [ ] Verify Dev agent reads the story from `docs/stories/`
- [ ] Verify Dev agent follows tasks sequentially
- [ ] Verify Dev agent writes tests
- [ ] Verify Dev agent updates Dev Agent Record

**Expected Result**: ✅ Story implemented successfully

### Test 2: Cursor AI - Story Validation

**Scenario**: Use Cursor AI to validate a story

**Steps**:

- [ ] Type: `/po` and request to validate Story 34.7-FE
- [ ] Verify PO agent reads Story Draft Checklist
- [ ] Verify PO agent validates all 5 categories
- [ ] Verify PO agent provides PASS/CONCERNS/FAIL decision

**Expected Result**: ✅ Story validation completed

### Test 3: Antigravity - Epic Creation

**Scenario**: Use Antigravity to create an epic

**Steps**:

- [ ] Initialize Antigravity with BMad framework
- [ ] Execute automated-epic-pipeline workflow
- [ ] Verify PM creates Epic PRD
- [ ] Verify Architect designs architecture
- [ ] Verify UX Expert defines requirements
- [ ] Verify SM creates stories
- [ ] Verify PO validates stories

**Expected Result**: ✅ Epic created successfully

### Test 4: Antigravity - Story Implementation

**Scenario**: Use Antigravity to implement a story

**Steps**:

- [ ] Execute automated-story-pipeline workflow
- [ ] Verify @dev implements story
- [ ] Verify @dev writes tests
- [ ] Verify @dev runs validation
- [ ] Verify @qa reviews implementation
- [ ] Verify @qa creates quality gate

**Expected Result**: ✅ Story implemented and quality gate created

---

## ✅ Quick Checks

### File Existence

```bash
# Run this command to check all files exist
echo "=== Checking Cursor AI Integration ==="
test -f .cursorrules && echo "✅ .cursorrules exists" || echo "❌ .cursorrules missing"
test -f docs/BMAD-CURSOR-INTEGRATION-GUIDE.md && echo "✅ Cursor guide exists" || echo "❌ Cursor guide missing"

echo ""
echo "=== Checking Antigravity Integration ==="
test -f docs/BMAD-ANTIGRAVITY-INTEGRATION-GUIDE.md && echo "✅ Antigravity guide exists" || echo "❌ Antigravity guide missing"
test -f docs/BMAD-INTEGRATION-OVERVIEW.md && echo "✅ Overview exists" || echo "❌ Overview missing"
test -f docs/BMAD-USAGE-EXAMPLES.md && echo "✅ Examples exist" || echo "❌ Examples missing"

echo ""
echo "=== Checking Agent Configs ==="
for agent in dev pm po sm qa architect; do
  test -f ".claude/commands/BMad/core/agents/$agent.agent.yaml" && echo "✅ $agent.agent.yaml exists" || echo "❌ $agent.agent.yaml missing"
done

echo ""
echo "=== Checking Core Config ==="
test -f .bmad-core/core-config.yaml && echo "✅ core-config.yaml exists" || echo "❌ core-config.yaml missing"
```

### File Content Checks

```bash
# Check .cursorrules contains BMad references
echo "=== Checking .cursorrules ==="
grep -q "BMad agent" .cursorrules && echo "✅ Contains BMad agent references" || echo "❌ Missing BMad agent references"

# Check agent configs contain cursor fields
echo ""
echo "=== Checking Agent Configs ==="
grep -q "cursor_rules" .claude/commands/BMad/core/agents/dev.agent.yaml && echo "✅ Dev agent has cursor_rules" || echo "❌ Dev agent missing cursor_rules"
grep -q "version.*cursor" .claude/commands/BMad/core/agents/dev.agent.yaml && echo "✅ Dev agent is cursor version" || echo "❌ Dev agent not cursor version"

# Check core config has cursor and antigravity
echo ""
echo "=== Checking Core Config ==="
grep -q "cursor:" .bmad-core/core-config.yaml && echo "✅ Has cursor section" || echo "❌ Missing cursor section"
grep -q "antigravity:" .bmad-core/core-config.yaml && echo "✅ Has antigravity section" || echo "❌ Missing antigravity section"
```

---

## ✅ Sign-Off

### Verification Complete?

- [ ] All file existence checks passed
- [ ] All file content checks passed
- [ ] All end-to-end tests passed
- [ ] All agents updated for Cursor AI
- [ ] All workflows defined for Antigravity
- [ ] Documentation is complete and accurate

### Ready for Production?

- [ ] Yes - All checks passed
- [ ] No - Issues found (see below)

### Issues Found (if any)

```
[List any issues found during verification]
```

### Notes

```
[Any additional notes or observations]
```

---

## 🎯 Success Criteria

Integration is considered **SUCCESSFUL** when:

1. ✅ `.cursorrules` file exists with complete content
2. ✅ All agent configs updated for Cursor AI
3. ✅ Integration guides exist and are accurate
4. ✅ Core config updated with Cursor and Antigravity sections
5. ✅ Cursor AI can use BMad agents
6. ✅ Antigravity can execute BMad workflows
7. ✅ End-to-end tests pass

---

## 📞 Support

If you encounter issues:

1. **Check the guides**:
   - `docs/BMAD-CURSOR-INTEGRATION-GUIDE.md`
   - `docs/BMAD-ANTIGRAVITY-INTEGRATION-GUIDE.md`

2. **Check the examples**:
   - `docs/BMAD-USAGE-EXAMPLES.md`

3. **Review the overview**:
   - `docs/BMAD-INTEGRATION-OVERVIEW.md`

4. **Verify files exist**:

   ```bash
   ls -lh .cursorrules docs/BMAD-*.md .claude/commands/BMad/core/agents/*.agent.yaml
   ```

5. **Check configurations**:
   ```bash
   cat .bmad-core/core-config.yaml
   ```

---

**Created**: 2026-01-10
**BMad Version**: v6.0.0-alpha.22
**Last Updated**: 2026-01-10
