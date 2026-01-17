# Inputs

```yaml
required:
  - story_id: '{epic}.{story}' # e.g., "2.2"
  - qa_root: from `.bmad-core/core-config.yaml` key `qa.qaLocation` (e.g., `docs/project/qa`)
  - story_root: from `.bmad-core/core-config.yaml` key `devStoryLocation` (e.g., `docs/project/stories`)

optional:
  - story_title: '{title}' # derive from story H1 if missing
  - story_slug: '{slug}' # derive from title (lowercase, hyphenated) if missing
```
