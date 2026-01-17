# Assessment Criteria

## Security

**PASS if:**

- Authentication implemented
- Authorization enforced
- Input validation present
- No hardcoded secrets

**CONCERNS if:**

- Missing rate limiting
- Weak encryption
- Incomplete authorization

**FAIL if:**

- No authentication
- Hardcoded credentials
- SQL injection vulnerabilities

## Performance

**PASS if:**

- Meets response time targets
- No obvious bottlenecks
- Reasonable resource usage

**CONCERNS if:**

- Close to limits
- Missing indexes
- No caching strategy

**FAIL if:**

- Exceeds response time limits
- Memory leaks
- Unoptimized queries

## Reliability

**PASS if:**

- Error handling present
- Graceful degradation
- Retry logic where needed

**CONCERNS if:**

- Some error cases unhandled
- No circuit breakers
- Missing health checks

**FAIL if:**

- No error handling
- Crashes on errors
- No recovery mechanisms

## Maintainability

**PASS if:**

- Test coverage meets target
- Code well-structured
- Documentation present

**CONCERNS if:**

- Test coverage below target
- Some code duplication
- Missing documentation

**FAIL if:**

- No tests
- Highly coupled code
- No documentation
