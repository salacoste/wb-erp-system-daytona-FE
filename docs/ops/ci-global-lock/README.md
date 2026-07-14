# Host-wide CI serialization lock (self-hosted VPS runner)

Version-controlled source of truth for the GitHub Actions **job-started / job-completed
hooks** that serialize CI across every repo sharing the self-hosted VPS runner box.

> **Why this exists in git:** the live scripts run from `/opt/github-actions-global-lock/`
> on the VPS, which is **not** under version control. A VPS rebuild or a stray reinstall
> would silently lose the fix and regress CI to lock starvation. Restore from here.

---

## The box

- **Host:** `43.131.5.136` (`ssh root@43.131.5.136`), 2 vCPU / 2 GB RAM + swap.
- **Five** GitHub Actions runners share this one box, each running as a **different user**:

  | Runner service (systemd) | User | Repo |
  |---|---|---|
  | `actions.runner.salacoste-wb-erp-system-daytona.wb-vps-runner` | `gh-runner` | backend |
  | `actions.runner.salacoste-wb-erp-system-daytona.wb-vps-runner-2` | `gh-runner` | backend |
  | `actions.runner.salacoste-wb-erp-system-daytona-FE.wb-vps-runner-fe` | `gh-runner-fe` | frontend |
  | `actions.runner.salacoste-daytona-caller-intelligence.caller-intelligence-vps-runner` | `gh-runner-caller` | caller-intelligence |
  | `actions.runner.salacoste-cc-device-manager.cc-device-manager-vps-runner` | `gh-runner-cc` | cc-device-manager |

## Why serialize at all

The 2 GB box OOMs if two CI jobs (each `npm ci` on ~869 packages, `tsc`, vitest) run at
once. A **host-wide mutex** (`flock` on `/var/lock/github-actions-global-ci.lock`) forces
one job at a time across all five repos.

## Why the fancy queue

A raw `flock` is **not fair**: when many waiters contend, the kernel wakes an arbitrary
one. The backend repo runs ~50–100 lock-jobs/day; the frontend repo ~4. So FE's lone
waiter kept losing the race and **starved to the 90-min job timeout** (`Set up runner`
hangs → run `cancelled`). `acquire.sh` therefore layers a **monotonic FIFO ticket queue**
on top of flock: waiters are served strictly in enqueue order, so a low-frequency repo can
never be starved by a high-frequency one. Dead tickets are pruned each scan (self-healing).

---

## Files

| File | Installed to |
|---|---|
| `acquire.sh` | `/opt/github-actions-global-lock/acquire.sh` (hook: `ACTIONS_RUNNER_HOOK_JOB_STARTED`) |
| `release.sh` | `/opt/github-actions-global-lock/release.sh` (hook: `ACTIONS_RUNNER_HOOK_JOB_COMPLETED`) |
| `10-global-ci-lock.conf.example` | `/etc/systemd/system/<each-runner>.service.d/10-global-ci-lock.conf` (systemd drop-in; sets the env vars that point the runner at the hooks) |

The `.conf` only sets environment variables — **all logic lives in the two `.sh` files**.

---

## Multi-user gotchas (do NOT regress these)

The hook runs under `bash -e -o pipefail` (GitHub's invocation), across **five different
users** sharing one state dir. Three bugs were fixed 2026-07-07 — a root-only test harness
misses all three; **always test lock changes cross-user** (`sudo -u gh-runner` vs
`sudo -u gh-runner-fe`):

1. **fd inheritance:** the holder's `sleep` child inherits the lock fd (9) and keeps the
   flock ~30 s after the holder is killed. → `sleep 30 9>&-` closes the fd for the child.
2. **Shared-state permissions:** the shared `queue/` dir + `queue.counter*` get created
   owned by whichever runner ran first; other users then can't create/delete/write, and a
   failing `rm` under `set -e` **aborts the whole hook** (`rm: Permission denied` → fast
   `Set up runner` failure). → `umask 000`, `chmod 0777` state+queue (no sticky, so any
   user can delete any ticket for liveness), and **every housekeeping `rm`/`find` guarded
   with `2>/dev/null || true`**.
3. **Cross-user `kill -0` lies:** `kill -0 <pid>` on a **live** process owned by another
   user returns EPERM (non-zero), which the prune logic misreads as "dead" and **deletes
   live foreign tickets**, corrupting the queue. → liveness uses `[[ -e /proc/$pid ]]`
   (visible to all users); `kill -0` is only used same-user.

## Tunables (env, set in the `.conf`)

| Var | Default | Meaning |
|---|---|---|
| `GITHUB_ACTIONS_GLOBAL_LOCK_MAX_SECONDS` | `21600` (6 h) | fail-safe: holder auto-releases after this |
| `GITHUB_ACTIONS_GLOBAL_LOCK_MAX_WAIT_SECONDS` | `5400` (90 min) | waiter/queue give-up bound |
| `GITHUB_ACTIONS_GLOBAL_LOCK_LOG_RETENTION_DAYS` | `3` | auto-prune `*.holder.log` older than this |

---

## Install / restore (after a VPS rebuild)

```bash
scp acquire.sh release.sh root@43.131.5.136:/opt/github-actions-global-lock/
ssh root@43.131.5.136 'chmod +x /opt/github-actions-global-lock/{acquire,release}.sh'

# systemd drop-in for EACH of the 5 runner services:
for svc in \
  actions.runner.salacoste-wb-erp-system-daytona.wb-vps-runner \
  actions.runner.salacoste-wb-erp-system-daytona.wb-vps-runner-2 \
  actions.runner.salacoste-wb-erp-system-daytona-FE.wb-vps-runner-fe \
  actions.runner.salacoste-daytona-caller-intelligence.caller-intelligence-vps-runner \
  actions.runner.salacoste-cc-device-manager.cc-device-manager-vps-runner ; do
  ssh root@43.131.5.136 "mkdir -p /etc/systemd/system/$svc.service.d && \
    cp /path/10-global-ci-lock.conf.example /etc/systemd/system/$svc.service.d/10-global-ci-lock.conf"
done
ssh root@43.131.5.136 'systemctl daemon-reload && \
  for s in $(systemctl list-units --type=service "actions.runner.*" --no-legend | awk "{print \$1}"); do systemctl restart "$s"; done'
```

## Diagnose

```bash
ssh root@43.131.5.136
S=/var/tmp/github-actions-global-lock
ls "$S/queue"                                   # FIFO queue (ticket = zero-padded seq)
fuser -v /var/lock/github-actions-global-ci.lock # who holds the mutex
for f in "$S"/queue/*; do p=$(cat "$f"); [ -e /proc/$p ] && echo "$f alive" || echo "$f DEAD"; done
```

Healthy: one live holder + waiters queued behind it in ticket order; no DEAD tickets
lingering; `pgrep -x flock` is **not** a queue-depth indicator (waiters poll in bash).

## Reset (destructive — affects all 5 repos; get an OK)

```bash
ssh root@43.131.5.136 'bash -s' <<'EOF'
S=/var/tmp/github-actions-global-lock
for f in "$S"/queue/*; do p=$(cat "$f" 2>/dev/null); [ -e /proc/$p ] || rm -f "$f"; done  # prune dead tickets
pkill -9 -f 'host-wide CI lock' 2>/dev/null || true                                       # kill holder loops
rm -f "$S"/*.pid "$S"/*.ready "$S"/*.holder "$S"/*.ticket 2>/dev/null
for s in $(systemctl list-units --type=service 'actions.runner.*' --no-legend | awk '{print $1}'); do systemctl restart "$s"; done
EOF
```

If a runner is idle+active but not picking up a queued job (Listener wedged after a
cancel/rerun burst): `systemctl restart actions.runner.<...>.service`.

---

_Related: `docs/request-backend/` conventions, `.github/workflows/frontend-quality.yml`
(header comments document the single-job / RAM-budget rationale). Fix history captured
2026-07-05 → 2026-07-07._
