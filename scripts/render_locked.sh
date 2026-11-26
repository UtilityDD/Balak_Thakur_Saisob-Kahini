#!/usr/bin/env bash
# Serialises Remotion renders across parallel agents (the machine has ~16 GB RAM; several concurrent
# renders run it out of memory). Usage, from remotion_studio:
#   bash ../scripts/render_locked.sh still Episode02 ../out/f_1200.png --frame=1200
#   bash ../scripts/render_locked.sh render Episode02 ../out/clip.mp4 --frames=1200-1260 --codec=h264
# It waits (up to 30 min) for a lock directory, runs one render, and always releases the lock.
set -u
LOCK="$(cd "$(dirname "$0")/.." && pwd)/.render.lock"
waited=0
until mkdir "$LOCK" 2>/dev/null; do
  # break a stale lock older than 15 minutes (a crashed render)
  if [ -d "$LOCK" ] && [ -n "$(find "$LOCK" -maxdepth 0 -mmin +15 2>/dev/null)" ]; then rmdir "$LOCK" 2>/dev/null; continue; fi
  sleep 3; waited=$((waited + 3))
  if [ "$waited" -ge 1800 ]; then echo "render_locked: gave up waiting for the lock" >&2; exit 2; fi
done
trap 'rmdir "$LOCK" 2>/dev/null' EXIT INT TERM
cmd="$1"; shift
# a hung render must not block the queue: stills get 4 minutes, clips 12 minutes
limit=240; [ "$cmd" = "render" ] && limit=720
NODE_OPTIONS=--max-old-space-size=6144 timeout "$limit" node node_modules/@remotion/cli/remotion-cli.js "$cmd" src/index.ts --gl=angle "$@"   # REN-GPU-01
rc=$?; [ $rc -eq 124 ] && echo "render_locked: render timed out after ${limit}s (retry it)" >&2
exit $rc
