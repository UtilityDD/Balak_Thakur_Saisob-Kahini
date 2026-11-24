---
name: studio-run
description: Start, restart or health-check the Remotion Studio for the Balak Thakur series on port 3100 (localhost and LAN 192.168.1.8) with a raised Node heap, restart it after a crash (exit 139 under memory pressure) or a hang, check the LAN address is still 192.168.1.8, and find and kill a hung studio on Windows. Use when the director asks to open, start, restart or "fix" the studio, when http://localhost:3100 stops responding, after renders or agents ran the machine out of memory, or after agents saved many files and the studio froze.
---

# studio-run

## Where to run
Worktree (branch `feat/ep01-polish-and-rules`) until it is committed; the main repo if
`remotion_studio/src/episode02/Episode02.tsx` exists there. Commands run in Git Bash.
```bash
W="/c/Dipankar/Balak_Thakur_Production"
M="/c/Dipankar/Balak_Thakur_AI_Studio"
if [ -f "$M/remotion_studio/src/episode02/Episode02.tsx" ]; then ROOT="$M"; else ROOT="$W"; fi
cd "$ROOT/remotion_studio"
```

## 1. Is it running?
```bash
curl -s -o /dev/null -w "local %{http_code}\n" --max-time 10 http://localhost:3100
curl -s -o /dev/null -w "lan   %{http_code}\n" --max-time 10 http://192.168.1.8:3100
netstat -ano | grep ":3100" | grep LISTENING      # last column is the PID
```
`200` on both: up (stop unless a restart was asked). `000` with the port LISTENING: hung, go to step 2. Nothing
listening: it crashed, go to step 3.

**Why it dies.** The studio's Node process segfaults (exit code 139) when the machine (about 16 GB) runs out of
memory: parallel still or chunk renders, several agents bundling at once, or many rapid saves. The background task
then reports exit 139 and the port goes free. Restart it after the memory-heavy work finishes (or between render
batches). Check the log for the cause: `tail -20 "$ROOT/studio.log"`.

## 2. Stop a hung or old studio (Windows)
```bash
PID=$(netstat -ano | grep ":3100" | grep LISTENING | awk '{print $NF}' | head -1)
[ -n "$PID" ] && tasklist //FI "PID eq $PID"        # confirm it is node.exe
[ -n "$PID" ] && taskkill //PID "$PID" //T //F       # //T ends its children too
netstat -ano | grep ":3100" | grep LISTENING || echo "port 3100 free"
```
Kill only the PID on port 3100, never every node.exe (renders and agents may be running).

## 3. Start it (raised heap)
Run as a background task (`run_in_background: true`), log outside `src/`:
```bash
cd "$ROOT/remotion_studio"
NODE_OPTIONS=--max-old-space-size=6144 npx remotion studio src/index.ts --port=3100 --no-open > "$ROOT/studio.log" 2>&1
```
The raised heap keeps it from running out of memory while it bundles all episodes. If file changes stop being picked
up, add `--webpack-poll=1000`. If a render batch is about to start, start the studio after it instead.

## 4. Check it responds, and the LAN address
Wait for `Server ready` in the log, then repeat the curl checks of step 1 (expect `200` twice). Confirm the LAN IP:
```bash
ipconfig | grep -a "IPv4"          # must list 192.168.1.8; another address is a VPN or a different adapter
```
- The log's "Network:" line may show the VPN adapter (25.x.x.x); the director's LAN address is 192.168.1.8.
- If `ipconfig` no longer lists 192.168.1.8, give the director the address it does show on the 192.168.x.x network.
- If localhost works but the LAN check fails, Windows Firewall blocks node.exe on the private network: tell the
  director; do not change firewall settings yourself.

## 5. Tell the director
- Local: http://localhost:3100  LAN: http://192.168.1.8:3100 (pick the composition, e.g. `Episode03`).
- Browsers block audio until the page gets a click: click once in the player before listening.

## Notes
- The studio can also hang while agents save many files: restart after a batch of edits (steps 2 to 4).
- A compile error in any file (an agent mid-edit) shows as an error overlay, not a crash: wait for the agent's next
  save or run the type-check. Errors only in `src/param_bismoy_ep01` (the director's separate series) are ignored.
- The studio is for viewing. Verification is done with stills (`frame-qa`), not by watching.
