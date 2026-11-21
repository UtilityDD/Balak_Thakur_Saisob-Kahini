---
name: agent-dispatch
description: How to split Balak Thakur production work (scene passes, new scenes, rig changes, sound re-sync, QA audits) across parallel subagents safely - one agent per file, a shared brief file per pass with short per-agent prompts, protected fixes in every brief, every render through scripts/render_locked.sh or the bundle method, files kept compiling between saves, no full renders by agents, and the main session verifying with stills and short clips before reporting. Use whenever you are about to launch more than one agent, or brief any agent to edit scene, rig or sound code.
---

# agent-dispatch

## Rules (from the director and today's passes)
1. **One agent per file.** Never two agents on one file at once. Shared files (`src/cinematic/rig/*`,
   `src/episode/*`, `EpisodeNN.tsx`, `Root.tsx`) get exactly one owner per round, or you edit them after the agents.
   `timing.ts` and `subtitles.ts` are generated: nobody edits them; change the generator and re-run it.
2. **A shared brief file per pass.** Write the common context once to a file in the worktree root
   (`AGENT_BRIEF_epN_pass.md`, models: `AGENT_BRIEF_ep2_pass.md`, `AGENT_BRIEF_ep3_pass.md`). Each agent's prompt
   only adds: the file it owns, its scene ID, its plan section, its specifics and its protected fixes.
3. **Protected fixes in every prompt.** List the recent fixes in that file and the director decisions that apply,
   and say: "keep all of these; do not undo or restyle them".
4. **Renders are rationed.** The machine has about 16 GB. Every agent render goes through
   `bash ../scripts/render_locked.sh still|render ...` (one render at a time, 4 min / 12 min time limit) or the
   bundle method (`frame-qa` step 1, its own `../bundle_<agent>` folder). Never a full episode or chunk render.
5. **Keep the file compiling between saves.** Every render bundles the whole project, so one agent's broken
   half-edit breaks every other agent's renders. Save after each logical change, and only in a compiling state.
6. **Hung renders time out.** `render_locked.sh` kills a still after 4 min and a clip after 12; a lock older than
   15 min is treated as stale. Agents retry once, then report instead of waiting forever.
7. **Type-check:** agents run it once when done; you run it once after all finish, from `remotion_studio`:
   `NODE_OPTIONS=--max-old-space-size=4096 node node_modules/typescript/bin/tsc --noEmit`.
   Errors inside `src/param_bismoy_ep01` are the director's separate series: never touch that folder, ignore its
   errors. Errors in another agent's file may be that agent mid-edit.
8. **QA agents report only**, never edit.
9. **You verify before reporting.** After the agents: re-bundle, render stills of every changed beat, every pause
   and join, face and hand crops, and short clips for lip sync and motion (`frame-qa`). Look at them. Never pass on
   an agent's "done" without seeing the frames.
10. **Record new decisions** in `01_Series_Bible/DIRECTOR_DECISIONS.md` (creative) or `docs/PIPELINE_DECISIONS.md`
    (process) in the main repo, same session, with date and reason. Commit only when the director asks.

## Where
Worktree `C:\Users\rouma\AppData\Local\Temp\claude\8d2a3455c490787c\d453e53b-1da9-42c9-8691-a833340f8cb5\scratchpad\ep01run`
(branch `feat/ep01-polish-and-rules`) until committed into `C:\Dipankar\Balak_Thakur_AI_Studio`. Give agents
absolute paths.

## Shared brief file: what it contains
Copy the latest `AGENT_BRIEF_ep3_pass.md` and update:
- Who they are (one of N agents, each owns ONE file), the working copy path.
- Read first: `CLAUDE.md`, the decision rules that apply (e.g. CAM-13, CAM-14, MOT-19, MOT-20, BAL-25, the episode's
  STO approval, PIT-01/03), and the APPROVED plan with its status block.
- Timing facts: total frames, exports (`EPNN_SCENES`, `EPNN_PAUSES`, `EPNN_CLIP_PARTS`), and the clocks from
  `src/episode/storyClock.ts`: `f` (story clock, holds in pauses: all story action and story camera keys), `lifeF`
  (real local frame: `lifeF` prop of every Puppet/BabyThakur/SeatedChild, blinks, breathing, anything that moves in a
  pause), `pause` (`inPause, index, t, frames`), `cueLocalStory(snippet, sceneId)` for cue-anchored camera keys,
  `clipSpan(file)` for cut clips. Episode 3 uses the `...3` names (`useStory3`, `cueLocalStory3`, ...).
- Camera grammar and motion rules in short; shared sets to use (e.g. `UjancharHouse`).
- Rendering: the lock and bundle commands; render only what is needed; look at sheets before finishing.
- Finish: type-check, ignore `param_bismoy_ep01`, save as you go, keep compiling, no commit.

## Per-agent prompt template
```
Read the shared brief first: <worktree>\AGENT_BRIEF_epN_pass.md.
You own ONLY: <absolute path of the scene file>. Scene ID: <id>. Plan section: "<heading>" in <plan path>.
Specifics: <what this scene needs beyond the plan, with cue snippets>.
Protected fixes (keep exactly): <bullets>.
Render checks under ../check_<name>/. Report: what changed, cue/pause frames to check, anything you could not do.
```

## Steps
1. Plan: group changes by file, one agent per file (one per scene file plus one for the episode's sound file
   `EpisodeNN.tsx` is the usual pass). Shared-file changes go in sequence or to you.
2. Collect protected fixes: file header comments, `git diff -- <file>`, backups beside the worktree (`*.backup.tsx`,
   `*.orig.tsx`), the decision files, `docs/QA_CHECKLIST.md`.
3. Write the shared brief file, then launch all agents in one message so they run in parallel.
4. While they run, do not edit their files. Restart the studio if it hangs (`studio-run`).
5. When all are done: type-check, re-bundle, verify (rule 9), send fixes back to the same agent (SendMessage).
6. Report to the director with sheet paths and what to look at. Record new decisions (rule 10).
