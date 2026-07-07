#!/usr/bin/env bash
# Host-wide CI serialization lock with FIFO fairness (multi-user safe).
# Raw flock is NOT fair: among many waiters the kernel wakes an arbitrary one,
# so a low-frequency repo (FE) starves behind a high-frequency repo (backend).
# We add a monotonic ticket queue on top of flock: waiters are served in the
# order they enqueued; dead entries are pruned each scan (self-healing liveness).
#
# MULTI-USER: the 5 runners on this box run as DIFFERENT users (gh-runner,
# gh-runner-fe, gh-runner-caller, ...). All shared state (queue dir, counter)
# must therefore be world-writable, and every housekeeping rm/find MUST be
# guarded with `|| true` so a cross-user permission error never aborts the hook
# (GitHub invokes it under `bash -e -o pipefail`).
set -euo pipefail
umask 000   # shared state files/dirs must be writable+deletable by ANY runner user
LOCK_FILE=${GITHUB_ACTIONS_GLOBAL_LOCK_FILE:-/var/lock/github-actions-global-ci.lock}
STATE_DIR=${GITHUB_ACTIONS_GLOBAL_LOCK_STATE_DIR:-/var/tmp/github-actions-global-lock}
MAX_SECONDS=${GITHUB_ACTIONS_GLOBAL_LOCK_MAX_SECONDS:-21600}
MAX_WAIT_SECONDS=${GITHUB_ACTIONS_GLOBAL_LOCK_MAX_WAIT_SECONDS:-5400}
LOG_RETENTION_DAYS=${GITHUB_ACTIONS_GLOBAL_LOCK_LOG_RETENTION_DAYS:-3}
RUNNER_ID_RAW="${RUNNER_NAME:-unknown-runner}"
RUN_ID="${GITHUB_RUN_ID:-no-run}"
JOB_ID="${GITHUB_JOB:-no-job}"
SAFE_ID=$(printf '%s__%s__%s' "$RUNNER_ID_RAW" "$RUN_ID" "$JOB_ID" | tr -c 'A-Za-z0-9_.-' '_')
PID_FILE="$STATE_DIR/$SAFE_ID.pid"
READY_FILE="$STATE_DIR/$SAFE_ID.ready"
LOG_FILE="$STATE_DIR/$SAFE_ID.holder.log"
HOLDER_SELF_FILE="$STATE_DIR/$SAFE_ID.holder"
TICKET_FILE="$STATE_DIR/$SAFE_ID.ticket"
QUEUE_DIR="$STATE_DIR/queue"
COUNTER_FILE="$STATE_DIR/queue.counter"
COUNTER_LOCK="$STATE_DIR/queue.counter.lock"
mkdir -p "$STATE_DIR" "$QUEUE_DIR" "$(dirname "$LOCK_FILE")" 2>/dev/null || true
# Self-heal perms so every runner user can create/delete queue entries (no sticky).
chmod 0777 "$STATE_DIR" "$QUEUE_DIR" 2>/dev/null || true
rm -f "$READY_FILE" 2>/dev/null || true

# Opportunistic cleanup: prune stale holder logs (>N days). Cross-user deletes may
# fail on a sticky dir; that is fine (the owner prunes its own) — never fatal.
find "$STATE_DIR" -maxdepth 1 -name '*.holder.log' -mtime "+${LOG_RETENTION_DAYS}" -delete 2>/dev/null || true

# Prune orphaned queue entries whose owning process is dead (cancelled jobs).
if [[ -d "$QUEUE_DIR" ]]; then
  for entry in "$QUEUE_DIR"/*; do
    [[ -e "$entry" ]] || continue
    qpid=$(cat "$entry" 2>/dev/null || true)
    if [[ -z "${qpid:-}" ]] || [[ ! -e /proc/$qpid ]]; then
      rm -f "$entry" 2>/dev/null || true
    fi
  done
fi

# Terminate a stale holder for the SAME runner/job id (retried job).
if [[ -s "$HOLDER_SELF_FILE" ]]; then
  old_pid=$(cat "$HOLDER_SELF_FILE" 2>/dev/null || true)
  if [[ -n "${old_pid:-}" ]] && kill -0 "$old_pid" 2>/dev/null; then
    echo "::warning::[$SAFE_ID] terminating stale lock holder pid=$old_pid for same runner/job id"
    kill "$old_pid" 2>/dev/null || true
    sleep 1
  fi
  rm -f "$HOLDER_SELF_FILE" "$PID_FILE" 2>/dev/null || true
fi

nohup bash -c '
set -euo pipefail
umask 000
lock_file="$1"; state_dir="$2"; pid_file="$3"; ready_file="$4"; max_seconds="$5"
safe_id="$6"; max_wait_seconds="$7"; holder_self_file="$8"; ticket_file="$9"
queue_dir="${10}"; counter_file="${11}"; counter_lock="${12}"
mkdir -p "$state_dir" "$queue_dir" "$(dirname "$lock_file")" 2>/dev/null || true

# Record our own pid first so release.sh can terminate us in ANY phase
# (queued or holding), regardless of whether we have acquired yet.
echo "$BASHPID" > "$holder_self_file"

# ---- Take a FIFO ticket (atomic increment under a brief counter lock) ----
exec 8>"$counter_lock"
flock 8
cur=0
[[ -s "$counter_file" ]] && cur=$(cat "$counter_file" 2>/dev/null || echo 0)
ticket=$(( cur + 1 ))
echo "$ticket" > "$counter_file"
padded=$(printf "%020d" "$ticket")
my_entry="$queue_dir/$padded"
echo "$BASHPID" > "$my_entry"
echo "$ticket" > "$ticket_file"
flock -u 8
exec 8>&-

cleanup() {
  echo "$(date -Is) [$safe_id] releasing host-wide CI lock (ticket=$ticket)"
  rm -f "$pid_file" "$ready_file" "$my_entry" "$ticket_file" "$holder_self_file" 2>/dev/null || true
  exit 0
}
trap cleanup TERM INT EXIT

echo "$(date -Is) [$safe_id] queued for host-wide CI lock (ticket=$ticket)"

# ---- Wait for our turn: be the oldest live ticket, pruning dead ones ----
wait_deadline=$(( $(date +%s) + max_wait_seconds ))
while :; do
  head=""
  for entry in $(ls "$queue_dir" 2>/dev/null | sort); do
    p=$(cat "$queue_dir/$entry" 2>/dev/null || true)
    if [[ -n "$p" ]] && [[ -e /proc/$p ]]; then
      head="$entry"
      break
    fi
    rm -f "$queue_dir/$entry" 2>/dev/null || true
  done
  [[ "$head" == "$padded" ]] && break
  if (( $(date +%s) >= wait_deadline )); then
    echo "$(date -Is) [$safe_id] timed out in FIFO queue after ${max_wait_seconds}s (ticket=$ticket); giving up"
    exit 1
  fi
  sleep 1
done

# ---- Our turn: grab the real mutex (should be free; -w is belt-and-suspenders) ----
exec 9>"$lock_file"
if ! flock -w "$max_wait_seconds" 9; then
  echo "$(date -Is) [$safe_id] head-of-queue but could not acquire mutex in ${max_wait_seconds}s (ticket=$ticket)"
  exit 1
fi
echo "$BASHPID" > "$pid_file"
date -Is > "$ready_file"
echo "$(date -Is) [$safe_id] acquired host-wide CI lock (ticket=$ticket)"

end=$(( $(date +%s) + max_seconds ))
while :; do
  if (( $(date +%s) >= end )); then
    echo "$(date -Is) [$safe_id] max hold seconds reached ($max_seconds); releasing fail-safe lock"
    cleanup
  fi
  sleep 30 9>&-
done
' _ "$LOCK_FILE" "$STATE_DIR" "$PID_FILE" "$READY_FILE" "$MAX_SECONDS" "$SAFE_ID" \
    "$MAX_WAIT_SECONDS" "$HOLDER_SELF_FILE" "$TICKET_FILE" "$QUEUE_DIR" \
    "$COUNTER_FILE" "$COUNTER_LOCK" > "$LOG_FILE" 2>&1 < /dev/null &
holder_pid=$!

for i in $(seq 1 "$MAX_SECONDS"); do
  if [[ -f "$READY_FILE" ]]; then
    cat "$LOG_FILE" 2>/dev/null || true
    echo "::notice::[$SAFE_ID] host-wide CI lock acquired by pid=$(cat "$PID_FILE" 2>/dev/null || echo "$holder_pid")"
    exit 0
  fi
  if ! kill -0 "$holder_pid" 2>/dev/null; then
    cat "$LOG_FILE" 2>/dev/null || true
    echo "::error::[$SAFE_ID] lock holder process exited before acquiring lock"
    exit 1
  fi
  if (( i % 60 == 0 )); then
    echo "::notice::[$SAFE_ID] waiting ${i}s for host-wide CI lock (FIFO) $LOCK_FILE"
    tail -5 "$LOG_FILE" 2>/dev/null || true
  fi
  sleep 1
done
echo "::error::[$SAFE_ID] timed out waiting for host-wide CI lock after ${MAX_SECONDS}s"
exit 1
