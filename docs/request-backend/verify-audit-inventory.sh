#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
LEDGER="$SCRIPT_DIR/AUDIT-2026-07-13.md"
GENERATED_LEDGER="AUDIT-2026-07-13.md"
EXPECTED_COUNT=244
EXPECTED_SHA256="0e45f0cec3b37c60658fefc096d98388787f7f203f50ba172ac7567cac680630"

tmp_dir=$(mktemp -d)
trap 'rm -rf "$tmp_dir"' EXIT HUP INT TERM

awk -F '\t' '
  /<!-- SOURCE-MANIFEST-START -->/ { in_manifest=1; next }
  /<!-- SOURCE-MANIFEST-END -->/ { in_manifest=0 }
  in_manifest && $1 ~ /\.md$/ && $1 != "source_basename" { print $1 }
' "$LEDGER" | LC_ALL=C sort > "$tmp_dir/ledger-basenames.txt"

find "$SCRIPT_DIR" -maxdepth 1 -type f -name '*.md' ! -name "$GENERATED_LEDGER" \
  -exec basename {} \; | LC_ALL=C sort > "$tmp_dir/current-source-basenames.txt"

ledger_count=$(wc -l < "$tmp_dir/ledger-basenames.txt" | tr -d ' ')
current_count=$(wc -l < "$tmp_dir/current-source-basenames.txt" | tr -d ' ')
unique_count=$(LC_ALL=C sort -u "$tmp_dir/ledger-basenames.txt" | wc -l | tr -d ' ')
ledger_hash=$(shasum -a 256 "$tmp_dir/ledger-basenames.txt" | awk '{print $1}')

test "$ledger_count" -eq "$EXPECTED_COUNT"
test "$current_count" -eq "$EXPECTED_COUNT"
test "$unique_count" -eq "$EXPECTED_COUNT"
test "$ledger_hash" = "$EXPECTED_SHA256"
! grep -Fxq "$GENERATED_LEDGER" "$tmp_dir/ledger-basenames.txt"
diff -u "$tmp_dir/current-source-basenames.txt" "$tmp_dir/ledger-basenames.txt"

printf 'PASS: frozen_sources=%s ledger_rows=%s unique_rows=%s\n' \
  "$current_count" "$ledger_count" "$unique_count"
printf 'PASS: basename_sha256=%s\n' "$ledger_hash"
printf 'PASS: generated_output_excluded=%s\n' "$GENERATED_LEDGER"
