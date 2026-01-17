# Minimal Required Schema

```yaml
schema: 1
story: '{epic}.{story}'
gate: PASS|CONCERNS|FAIL|WAIVED
status_reason: '1-2 sentence explanation of gate decision'
reviewer: 'Quinn'
updated: '{ISO-8601 timestamp}'
top_issues: [] # Empty array if no issues
waiver: { active: false } # Only set active: true if WAIVED
```
