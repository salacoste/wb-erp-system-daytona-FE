# Risk Analysis Process

## 1. Risk Identification

For each category, identify specific risks:

```yaml
risk:
  id: 'SEC-001' # Use prefixes: SEC, PERF, DATA, BUS, OPS, TECH
  category: security
  title: 'Insufficient input validation on user forms'
  description: 'Form inputs not properly sanitized could lead to XSS attacks'
  affected_components:
    - 'UserRegistrationForm'
    - 'ProfileUpdateForm'
  detection_method: 'Code review revealed missing validation'
```

## 2. Risk Assessment

Evaluate each risk using probability × impact:

**Probability Levels:**

- `High (3)`: Likely to occur (>70% chance)
- `Medium (2)`: Possible occurrence (30-70% chance)
- `Low (1)`: Unlikely to occur (<30% chance)

**Impact Levels:**

- `High (3)`: Severe consequences (data breach, system down, major financial loss)
- `Medium (2)`: Moderate consequences (degraded performance, minor data issues)
- `Low (1)`: Minor consequences (cosmetic issues, slight inconvenience)

## Risk Score = Probability × Impact

- 9: Critical Risk (Red)
- 6: High Risk (Orange)
- 4: Medium Risk (Yellow)
- 2-3: Low Risk (Green)
- 1: Minimal Risk (Blue)

## 3. Risk Prioritization

Create risk matrix:

```markdown