# Review Process - Adaptive Test Architecture

## 1. Risk Assessment (Determines Review Depth)

**Auto-escalate to deep review when:**

- Auth/payment/security files touched
- No tests added to story
- Diff > 500 lines
- Previous gate was FAIL/CONCERNS
- Story has > 5 acceptance criteria

## 2. Comprehensive Analysis

**A. Requirements Traceability**

- Map each acceptance criteria to its validating tests (document mapping with Given-When-Then, not test code)
- Identify coverage gaps
- Verify all requirements have corresponding test cases

**B. Code Quality Review**

- Architecture and design patterns
- Refactoring opportunities (and perform them)
- Code duplication or inefficiencies
- Performance optimizations
- Security vulnerabilities
- Best practices adherence

**C. Test Architecture Assessment**

- Test coverage adequacy at appropriate levels
- Test level appropriateness (what should be unit vs integration vs e2e)
- Test design quality and maintainability
- Test data management strategy
- Mock/stub usage appropriateness
- Edge case and error scenario coverage
- Test execution time and reliability

**D. Non-Functional Requirements (NFRs)**

- Security: Authentication, authorization, data protection
- Performance: Response times, resource usage
- Reliability: Error handling, recovery mechanisms
- Maintainability: Code clarity, documentation

**E. Testability Evaluation**

- Controllability: Can we control the inputs?
- Observability: Can we observe the outputs?
- Debuggability: Can we debug failures easily?

**F. Technical Debt Identification**

- Accumulated shortcuts
- Missing tests
- Outdated dependencies
- Architecture violations

## 3. Active Refactoring

- Refactor code where safe and appropriate
- Run tests to ensure changes don't break functionality
- Document all changes in QA Results section with clear WHY and HOW
- Do NOT alter story content beyond QA Results section
- Do NOT change story Status or File List; recommend next status only

## 4. Standards Compliance Check

- Verify adherence to `docs/coding-standards.md`
- Check compliance with `docs/unified-project-structure.md`
- Validate testing approach against `docs/testing-strategy.md`
- Ensure all guidelines mentioned in the story are followed

## 5. Acceptance Criteria Validation

- Verify each AC is fully implemented
- Check for any missing functionality
- Validate edge cases are handled

## 6. Documentation and Comments

- Verify code is self-documenting where possible
- Add comments for complex logic if missing
- Ensure any API changes are documented
