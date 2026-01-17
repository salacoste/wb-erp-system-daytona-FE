# Outputs

## Output 1: Gate YAML Block

Generate for pasting into gate file under `risk_summary`:

**Output rules:**

- Only include assessed risks; do not emit placeholders
- Sort risks by score (desc) when emitting highest and any tabular lists
- If no risks: totals all zeros, omit highest, keep recommendations arrays empty

```yaml