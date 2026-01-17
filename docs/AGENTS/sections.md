# Sections

- [Section Name 1](./section-name-1.md)
- [Section Name 2](./section-name-2.md)
- [Section Name 3](./section-name-3.md)
  ...
```

## 5. Preserve Special Content

1. **Code blocks**: Must capture complete blocks including:

   ```language
   content
   ```

2. **Mermaid diagrams**: Preserve complete syntax:

   ```mermaid
   graph TD
   ...
   ```

3. **Tables**: Maintain proper markdown table formatting

4. **Lists**: Preserve indentation and nesting

5. **Inline code**: Preserve backticks

6. **Links and references**: Keep all markdown links intact

7. **Template markup**: If documents contain {{placeholders}} ,preserve exactly

## 6. Validation

After sharding:

1. Verify all sections were extracted
2. Check that no content was lost
3. Ensure heading levels were properly adjusted
4. Confirm all files were created successfully

## 7. Report Results

Provide a summary:

```text
Document sharded successfully:
- Source: [original document path]
- Destination: docs/[folder-name]/
- Files created: [count]
- Sections:
  - section-name-1.md: "Section Title 1"
  - section-name-2.md: "Section Title 2"
  ...
```
