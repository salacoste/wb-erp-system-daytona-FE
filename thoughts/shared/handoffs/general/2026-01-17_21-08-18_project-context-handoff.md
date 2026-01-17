---
date: 2026-01-17T18:08:18Z
researcher: Claude Code (Session)
git_commit: b6b7e2265291746240ab765720ec9540d99f8eb2
branch: main
repository: wb-erp-system-daytona-FE
topic: "WB Repricer System Frontend - Project Context Handoff"
tags: [project-context, frontend-architecture, nextjs, typescript]
status: complete
last_updated: 2026-01-17
last_updated_by: Claude Code
type: project_handoff
---

# Handoff: WB Repricer System Frontend - Project Context

## Task(s)

**Session Purpose**: Initial project context setup and handoff document creation.

This session focused on establishing a comprehensive handoff document for the WB Repricer System Frontend project. No implementation work was performed - this is purely a knowledge transfer document.

**Status**: Complete - Handoff document created for future sessions.

## Critical References

1. **`CLAUDE.md`** (Project Root)
   - Complete project overview, architecture, and development guidelines
   - Contains all epic references (54 total: 43 backend + 11 frontend)
   - API integration patterns and business logic locations

2. **`../backend/CLAUDE.md`** (Backend Context)
   - Backend service running on port 3000
   - Prisma schema, task queue system, business logic rules
   - Critical for understanding API contracts

3. **`docs/front-end-spec.md`**
   - Complete UI/UX specifications with personas and flows
   - Design system specifications and component patterns

## Recent Changes

**Git Status Snapshot** (from session start):
- Modified files include documentation updates for Epic 37, Epic 42, Epic 44
- New untracked files: E2E tests for price calculator, QA gate files
- Recent commit: `b6b7e22` - "chore: remove old conductor session archive"

**Key Files Modified**:
- `src/lib/api/storage-analytics.ts` - Epic 24 storage analytics
- `src/hooks/useStorageAnalytics.test.ts` - Test coverage
- `docs/stories/epic-44/` - Price calculator documentation

## Learnings

**Project Architecture Patterns**:
1. **API Client Pattern** (`src/lib/api-client.ts`):
   - Auto-includes JWT and Cabinet-ID headers
   - Auto-unwraps `{ data: ... }` responses
   - Error handling with `ApiError` class

2. **TanStack Query Pattern**:
   - All data fetching through `useQuery` hooks
   - Mutations with automatic cache invalidation
   - Configuration in `src/lib/queryClient.ts`

3. **Margin Polling Pattern** (`src/lib/margin-helpers.ts`):
   - After COGS assignment, poll for margin recalculation
   - Strategy based on COGS date and bulk vs single assignment
   - Critical for user experience (Request #17)

**Critical Business Rules**:
- Week definition: ISO week format, `Europe/Moscow` timezone
- COGS midpoint rule: Thursday determines which version applies
- Payout formula: WB Dashboard compatible (see CLAUDE.md for full formula)

**File Size Limit**: All source files MUST be under 200 lines (ESLint enforced)

## Artifacts

**Documentation Created/Updated**:
- `thoughts/shared/handoffs/general/2026-01-17_21-08-18_project-context-handoff.md` (this file)

**Key Documentation Locations**:
- `docs/epics/` - All epic documentation (54 epics total)
- `docs/stories/` - Story-level documentation (76 stories, 68 complete)
- `docs/request-backend/` - Backend API request catalog (100+ files)
- `../backend/test-api/` - REST Client .http files for API testing

**Epic Completion Status**:
- Epic 1-FE through 6-FE: ✅ Complete
- Epic 24-FE (Storage): ✅ Complete
- Epic 33-FE (Advertising): ✅ Complete
- Epic 34-FE (Telegram): ✅ Complete
- Epic 36-FE (Product Linking): ✅ Complete
- Epic 37-FE (Merged Groups): ✅ Complete
- Epic 42-FE (Task Handlers): 📋 Ready for Dev
- Epic 44-FE (Price Calculator): ✅ Complete

## Action Items & Next Steps

**For Next Session**:
1. Review `CLAUDE.md` thoroughly - contains ALL project context
2. Check `docs/stories/STORIES-STATUS-REPORT.md` for current work priorities
3. Identify which epic/story to work on based on user requirements
4. Always use Context7 MCP server for framework patterns (`--c7` flag)
5. Follow 200-line file limit rule (split large files)

**Pending Work** (from status report):
- Epic 42-FE: Task Handlers Adaptation (4 stories, ready for dev)
- Epic 38 (Backend): API Documentation Automation (8 stories, in progress)

**Development Commands Reference**:
```bash
npm run dev              # Start dev server (port 3000)
npm run build           # Production build
npm run lint            # ESLint check
npm run type-check      # TypeScript validation
npm test                # Unit tests (Vitest)
npm run test:e2e        # E2E tests (Playwright)
```

## Other Notes

**Tech Stack Summary**:
- Framework: Next.js 15 with App Router
- Language: TypeScript 5 (strict mode, no `any`)
- Styling: Tailwind CSS 4.x + shadcn/ui
- State: TanStack Query v5 + Zustand
- Testing: Vitest + Playwright

**Port Configuration**:
- Development: 3000
- Production (PM2): 3100

**Backend Integration**:
- API URL: `http://localhost:3000` (default)
- Swagger UI: `http://localhost:3000/api`
- Authentication: Bearer JWT + `X-Cabinet-Id` header

**BMad Framework Integration**:
- Agents available in `.claude/commands/BMad/`
- Task-based commands in `.claude/commands/BMad/tasks/`
- Use for epic creation, story development, QA gates

**Test User Credentials**:
- Email: `test@test.com`
- Password: `Russia23!`

**Critical Files to Understand First**:
1. `CLAUDE.md` - Start here for everything
2. `src/lib/api-client.ts` - API integration layer
3. `src/lib/routes.ts` - Route structure
4. `src/lib/margin-helpers.ts` - Business logic utilities
5. `docs/stories/STORIES-STATUS-REPORT.md` - Current priorities

**Quality Standards**:
- TypeScript strict mode (no `any`)
- All functions must have explicit return types
- Component files < 200 lines
- WCAG 2.1 AA accessibility required
- Unit test coverage goal: 60%+

**When Implementing Features**:
1. Always check Context7 for framework patterns first
2. Read existing code before making changes
3. Follow established patterns (API client, hooks, stores)
4. Test thoroughly (unit + integration + E2E)
5. Update documentation as needed
