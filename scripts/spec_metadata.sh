#!/usr/bin/env bash
# Metadata collector for handoff documents
# Usage: source scripts/spec_metadata.sh

set -euo pipefail

# Date/Time formats for different purposes
DATE_ISO=$(date -u '+%Y-%m-%dT%H:%M:%SZ')      # YAML: 2026-01-17T18:08:18Z
DATE_SHORT=$(date '+%Y-%m-%d')                   # last_updated: 2026-01-17
FILENAME_TS=$(date '+%Y-%m-%d_%H-%M-%S')         # Files: 2026-01-17_21-08-18

# Git metadata
if command -v git >/dev/null 2>&1 && git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  GIT_COMMIT=$(git rev-parse HEAD)
  GIT_BRANCH=$(git branch --show-current 2>/dev/null || git rev-parse --abbrev-ref HEAD)
  REPO_ROOT=$(git rev-parse --show-toplevel)
  REPO_NAME=$(basename "$REPO_ROOT")

  # Extract repository name from remote URL
  REPOSITORY=$(git remote get-url origin 2>/dev/null | sed -E 's|.*[:/]([^/]+/[^/]+\.git)|\1|' | sed 's|\.git$||' || echo "$REPO_NAME")
else
  GIT_COMMIT=""
  GIT_BRANCH=""
  REPOSITORY=""
fi

# Export for use in other scripts
export DATE_ISO DATE_SHORT FILENAME_TS
export GIT_COMMIT GIT_BRANCH REPOSITORY

# If executed directly (not sourced), print values
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  echo "Current Date/Time (ISO): $DATE_ISO"
  echo "Current Date (Short): $DATE_SHORT"
  echo "Timestamp For Filename: $FILENAME_TS"
  [ -n "$GIT_COMMIT" ] && echo "Current Git Commit: $GIT_COMMIT"
  [ -n "$GIT_BRANCH" ] && echo "Current Branch: $GIT_BRANCH"
  [ -n "$REPOSITORY" ] && echo "Repository: $REPOSITORY"
fi
