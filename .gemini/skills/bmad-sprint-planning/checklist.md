# Sprint Planning Validation Checklist

## Core Validation

### Complete Coverage Check

- [ ] Every epic found in epic\*.md files appears in sprint-status.yaml
- [ ] Every story found in epic\*.md files appears in sprint-status.yaml
- [ ] Retrospective entries are present when explicitly required or already tracked; historical story-backed epics may omit retrospective rows
- [ ] No items in sprint-status.yaml that don't exist in epic files, except explicitly documented epic-only status records
- [ ] Epic-only exceptions are allowed only when explicitly documented as no-story-ID status records and excluded from story and retrospective counts

### Parsing Verification

Compare epic files against generated sprint-status.yaml:

```
Epic Files Contains:                Sprint Status Contains:
✓ Epic 1                            ✓ epic-1: [status]
  ✓ Story 1.1: User Auth              ✓ 1-1-user-auth: [status]
  ✓ Story 1.2: Account Mgmt           ✓ 1-2-account-mgmt: [status]
  ✓ Story 1.3: Plant Naming           ✓ 1-3-plant-naming: [status]
                                      ✓ epic-1-retrospective: [status]
✓ Epic 2                            ✓ epic-2: [status]
  ✓ Story 2.1: Personality Model      ✓ 2-1-personality-model: [status]
  ✓ Story 2.2: Chat Interface         ✓ 2-2-chat-interface: [status]
                                      ✓ epic-2-retrospective: [status]
```

### Final Check

- [ ] Total count of epics matches
- [ ] Total count of stories matches for story-backed rows; documented epic-only entries are excluded from story and retrospective counts
- [ ] Story-backed items are in the expected order (epic, stories, optional retrospective); documented epic-only entries contain only the epic row
- [ ] Any epic-only entries have no fabricated story or retrospective rows and include an explicit no-story-ID note
