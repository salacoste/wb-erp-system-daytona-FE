# Story: {epic}.{story} - {title}

## Coverage Summary

- Total Requirements: X
- Fully Covered: Y (Z%)
- Partially Covered: A (B%)
- Not Covered: C (D%)

## Requirement Mappings

### AC1: {Acceptance Criterion 1}

**Coverage: FULL**

Given-When-Then Mappings:

- **Unit Test**: `auth.service.test.ts::validateCredentials`
  - Given: Valid user credentials
  - When: Validation method called
  - Then: Returns true with user object

- **Integration Test**: `auth.integration.test.ts::loginFlow`
  - Given: User with valid account
  - When: Login API called
  - Then: JWT token returned and session created

### AC2: {Acceptance Criterion 2}

**Coverage: PARTIAL**

[Continue for all ACs...]

## Critical Gaps

1. **Performance Requirements**
   - Gap: No load testing for concurrent users
   - Risk: High - Could fail under production load
   - Action: Implement load tests using k6 or similar

2. **Security Requirements**
   - Gap: Rate limiting not tested
   - Risk: Medium - Potential DoS vulnerability
   - Action: Add rate limit tests to integration suite

## Test Design Recommendations

Based on gaps identified, recommend:

1. Additional test scenarios needed
2. Test types to implement (unit/integration/e2e/performance)
3. Test data requirements
4. Mock/stub strategies

## Risk Assessment

- **High Risk**: Requirements with no coverage
- **Medium Risk**: Requirements with only partial coverage
- **Low Risk**: Requirements with full unit + integration coverage
```
