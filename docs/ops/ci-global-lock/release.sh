#!/usr/bin/env bash
# Release the host-wide CI FIFO lock for this job (multi-user safe).
# Terminates the background holder (queued OR holding — single pid either way),
# then scrubs its queue/state files. Every rm is guarded so a cross-user
# permission error never aborts the hook. Backward-compatible with the pre-FIFO
# layout (PID_FILE / PID_FILE.waiter, no HOLDER_SELF_FILE).
set -euo pipefail
umask 000
STATE_DIR=${GITHUB_ACTIONS_GLOBAL_LOCK_STATE_DIR:-/var/tmp/github-actions-global-lock}
QUEUE_DIR="$STATE_DIR/queue"
RUNNER_ID_RAW="${RUNNER_NAME:-unknown-runner}"
RUN_ID="${GITHUB_RUN_ID:-no-run}"
JOB_ID="${GITHUB_JOB:-no-job}"
SAFE_ID=$(printf '%s__%s__%s' "$RUNNER_ID_RAW" "$RUN_ID" "$JOB_ID" | tr -c 'A-Za-z0-9_.-' '_')
PID_FILE="$STATE_DIR/$SAFE_ID.pid"
READY_FILE="$STATE_DIR/$SAFE_ID.ready"
LOG_FILE="$STATE_DIR/$SAFE_ID.holder.log"
HOLDER_SELF_FILE="$STATE_DIR/$SAFE_ID.holder"
TICKET_FILE="$STATE_DIR/$SAFE_ID.ticket"
WAITER_FILE="${PID_FILE}.waiter"   # legacy pre-FIFO format

kill_pidfile() {
  local f="$1" label="$2" pid
  [[ -s "$f" ]] || return 0
  pid=$(cat "$f" 2>/dev/null || true)
  if [[ -n "${pid:-}" ]] && kill -0 "$pid" 2>/dev/null; then
    echo "::notice::[$SAFE_ID] releasing host-wide CI lock ($label pid=$pid)"
    kill "$pid" 2>/dev/null || true
    for _ in $(seq 1 10); do
      kill -0 "$pid" 2>/dev/null || break
      sleep 0.2
    done
    kill -9 "$pid" 2>/dev/null || true
  fi
}

kill_pidfile "$HOLDER_SELF_FILE" "holder"
kill_pidfile "$PID_FILE"        "pid(legacy/holder)"
kill_pidfile "$WAITER_FILE"     "waiter(legacy)"

# Belt-and-suspenders: remove our FIFO queue entry (in case a hard kill skipped the trap).
if [[ -s "$TICKET_FILE" ]]; then
  ticket=$(cat "$TICKET_FILE" 2>/dev/null || true)
  if [[ -n "${ticket:-}" ]]; then
    padded=$(printf "%020d" "$ticket" 2>/dev/null || echo "")
    [[ -n "$padded" ]] && rm -f "$QUEUE_DIR/$padded" 2>/dev/null || true
  fi
fi

rm -f "$PID_FILE" "$READY_FILE" "$HOLDER_SELF_FILE" "$TICKET_FILE" "$WAITER_FILE" 2>/dev/null || true
tail -20 "$LOG_FILE" 2>/dev/null || true
