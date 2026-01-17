# Output 2: Create Quality Gate File

**Template and Directory:**

- Render from `../templates/qa-gate-tmpl.yaml`
- Create directory defined in `qa.qaLocation/gates` (see `.bmad-core/core-config.yaml`) if missing
- Save to: `qa.qaLocation/gates/{epic}.{story}-{slug}.yml`

Gate file structure:

```yaml
schema: 1
story: '{epic}.{story}'
story_title: '{story title}'
gate: PASS|CONCERNS|FAIL|WAIVED
status_reason: '1-2 sentence explanation of gate decision'
reviewer: 'Quinn (Test Architect)'
updated: '{ISO-8601 timestamp}'

top_issues: [] # Empty if no issues
waiver: { active: false } # Set active: true only if WAIVED
