# Traceability Best Practices

## Given-When-Then for Mapping (Not Test Code)

Use Given-When-Then to document what each test validates:

**Given**: The initial context the test sets up

- What state/data the test prepares
- User context being simulated
- System preconditions

**When**: The action the test performs

- What the test executes
- API calls or user actions tested
- Events triggered

**Then**: What the test asserts

- Expected outcomes verified
- State changes checked
- Values validated

**Note**: This is for documentation only. Actual test code follows your project's standards (e.g., describe/it blocks, no BDD syntax).

## Coverage Priority

Prioritize coverage based on:

1. Critical business flows
2. Security-related requirements
3. Data integrity requirements
4. User-facing features
5. Performance SLAs

## Test Granularity

Map at appropriate levels:

- Unit tests for business logic
- Integration tests for component interaction
- E2E tests for user journeys
- Performance tests for NFRs
