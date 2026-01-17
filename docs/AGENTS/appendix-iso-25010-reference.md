# Appendix: ISO 25010 Reference

<details>
<summary>Full ISO 25010 Quality Model (click to expand)</summary>

## All 8 Quality Characteristics

1. **Functional Suitability**: Completeness, correctness, appropriateness
2. **Performance Efficiency**: Time behavior, resource use, capacity
3. **Compatibility**: Co-existence, interoperability
4. **Usability**: Learnability, operability, accessibility
5. **Reliability**: Maturity, availability, fault tolerance
6. **Security**: Confidentiality, integrity, authenticity
7. **Maintainability**: Modularity, reusability, testability
8. **Portability**: Adaptability, installability

Use these when assessing beyond the core four.

</details>

<details>
<summary>Example: Deep Performance Analysis (click to expand)</summary>

```yaml
performance_deep_dive:
  response_times:
    p50: 45ms
    p95: 180ms
    p99: 350ms
  database:
    slow_queries: 2
    missing_indexes: ['users.email', 'orders.user_id']
  caching:
    hit_rate: 0%
    recommendation: 'Add Redis for session data'
  load_test:
    max_rps: 150
    breaking_point: 200 rps
```

</details>
```

## Task: kb-mode-interaction
Source: .bmad-core/tasks/kb-mode-interaction.md
- How to use: "Use task kb-mode-interaction with the appropriate agent" and paste relevant parts as needed.

```md
<!-- Powered by BMAD™ Core -->
