---
name: episode-polish-pass
description: The workflow that made Balak Thakur Episodes 2 and 3 - a director-approved per-scene shot list and pause table (plan-only agent), pauses added to the timing generator at true silences, parallel agents (one per scene file plus one for the sound file) on a shared brief with the story and life clocks and cue-anchored camera keys, a final sound re-sync to the rebuilt choreography, the main session's verification sweep with bundle-once stills, crops and short clips, then director approval and render-episode. Use when the director asks to polish an episode's camera, pacing, pauses, motion or sound, or to bring a new episode up to the Episode 2/3 standard (CAM-13, CAM-14).
---

# episode-polish-pass

Six steps, in order; each waits for the previous one. Worked examples: Episode 2 (STO-16, 23 pauses, 7,307 frames)
and Episode 3 (STO-17, 12 pauses, 3,259 frames). Worktree root (`W`):
`C:\Users\rouma\AppData\Local\Temp\claude\8d2a3455c490787c\d453e53b-1da9-42c9-8691-a833340f8cb5\scratchpad\ep01run`
until committed into `C:\Dipankar\Balak_Thakur_AI_Studio`. Rules: CAM-13 (camera grammar), CAM-14 (pauses), MOT-19,
MOT-20, BAL-25, TTL-10a, AUD-02/03 in `01_Series_Bible/DIRECTOR_DECISIONS.md`; TIM-INS-01, TIM-PAUSE-01..03, REN-LOCK-01,
REN-BUNDLE-01, PIT-01..03 in `docs/PIPELINE_DECISIONS.md`.

## 1. Plan: shot list and pause table, then the director's answers
- Launch ONE plan-only agent (reads code, timing, subtitles and voices; edits no code; renders nothing) to write
  `03_Episodes/<EP>/01_Script_and_Storyboard/EpNN_Shots_and_Pauses_DRAFT.md`, modelled on the Episode 2 document
  (`03_Episodes/Episode_02_Shashthi_and_GoShaap/01_Script_and_Storyboard/Ep02_Shots_and_Pauses_DRAFT.md`) and Episode 3's:
  - "How to read this" (camera words, rules used), "Sounds available" (what is in `public/audio/`).
  - Per scene: a **Shot list** table (`# | f | Line | Shot | Camera | Why`), one row per narration line, every move
    with a story reason on its line (CAM-13); and a **Pauses** table (`# | After | Length | Picture | Sound`): 2 or 3
    per scene, 1 to 2 s, at settled moments (after a reaction, reveal or emotional line), never mid-action; `open` /
    `end` pauses for one-sentence scenes. No pauses in the intro, source card, outro or glimpse.
  - Totals (pauses, added seconds, new length); "Notes for whoever codes this": the measured silences per clip
    (`ffmpeg -i clip.wav -af silencedetect=n=-45dB:d=0.12 -f null - 2>&1 | grep silence_`), where captions are early,
    hard-coded frames to move to the story clock, protected fixes; "For the director to decide": a short numbered
    list of real choices (set, who speaks, the ending, length, levels).
  - Carry over the standing answers: the camera follows the narration strictly and invents no tension; establishing
    lines get held wides; the outro stays the series template; beds capped at 0.25 in pauses.
- Show the director the plan and ask the questions. Record the answers in the plan's **Status** block at the top
  ("APPROVED by the director on <date> (decision STO-NN), with these answers: 1. ... 2. ..."), as a new STO rule in
  `01_Series_Bible/DIRECTOR_DECISIONS.md`, and in `docs/decisions/CHANGELOG.md`, in the same session.

## 2. Pauses in the timing generator
- Copy the approved table into `PAUSES` of `scripts/build_epNN_timing.js` (`build_ep03_timing.js` is the model):
  `{ scene, after: "<unique phrase snippet>", sec, note }`, `{ scene, at: "open" | "end", sec, note }`, and
  `clip` + `silence: [a, b]` (original clip seconds) where the caption estimate misses the real silence by > 0.5 s.
  Each pause sits at a TRUE silence: the generator cuts the clip there (checked RMS < -45 dB, peak < -38 dB).
- Back up the generated files first, then regenerate and compare:
```bash
cd "$W"; cp remotion_studio/src/episodeNN/timing.ts ../epNN_timing_before_pauses.ts; cp remotion_studio/src/episodeNN/subtitles.ts ../epNN_subs_before_pauses.ts
node scripts/build_epNN_timing.js                                   # prints scenes, pauses, cuts and the total
NO_PAUSES=1 OUT_DIR=../epNN_nopause node scripts/build_epNN_timing.js  # same timing without pauses, for comparison
```
- If it stops with "no silence within 0.5 s", read the listed silences and add a named `silence`. Fix the generator,
  never `timing.ts`. Add the episode's clock block to `src/episode/storyClock.ts` if missing (one owner).
- Record the result (pauses, frames, length, cut points) in `docs/PIPELINE_DECISIONS.md` as Episodes 2/3 did.

## 3. Parallel scene pass (agent-dispatch)
- Write the shared brief `$W/AGENT_BRIEF_epN_pass.md` (copy `AGENT_BRIEF_ep3_pass.md`, update facts). Launch, in one
  message, one agent per scene file plus one for the episode's sound file (`EpisodeNN.tsx`: beds, ducking, SFX and
  pause sound cues). Per-agent prompt = owned file + scene ID + plan section + specifics + protected fixes.
- What every scene agent does:
  - Story action on `f` from `useStoryN(sceneId)` (holds in pauses); `lifeF` to every Puppet / BabyThakur /
    SeatedChild and to anything that moves in a pause (blinks, breathing, rain, motes, a slow push).
  - The approved pause moment from `pause` (`inPause, index, t`): a look, a sigh (`sigh` prop), the glow brightening
    gently on key beats only.
  - Camera keys anchored to cues: `cueLocalStoryN("<snippet>", sceneId)`, a speaker's close-up 6 to 8 f before the
    line, at most one move per sentence, about 2 s hold between moves. No hard-coded frame keys.
  - A cut clip is looked up with `clipSpanN(originalFile)` (the generator warns which scene files need it).
- You do not edit their files while they run. Restart the studio if it hangs (`studio-run`).

## 4. Sound re-sync to the rebuilt choreography
After the scene agents finish, the sound file's cues no longer match the new poses and camera. Run one agent (or do
it yourself) on `EpisodeNN.tsx` only: back it up (`$W/EpisodeNN.pre_sound.backup.tsx`, as `Episode03.pre_sound.backup.tsx`), re-anchor every
SFX to the scene's story events, cues and pauses (not absolute frames), keep one-shots 0.15 to 0.45 and loops at or
below 0.25, beds ducked under voices and at most 0.25 in pauses, `Divine_Motif` only at sacred moments. Verify with
short clips (listen) and the loudness check from `render-episode` step 4 on a clip.

## 5. Verification sweep (main session, before reporting)
- Type-check (ignore `src/param_bismoy_ep01`), then bundle once and render from the bundle (`frame-qa` step 1):
  every scene's start, key beats and end; every pause (first, middle, last frame); every dissolve and join; the
  intro (no captions), source card and outro glimpse.
- Contact sheets per scene; large face and hand crops; baby faces beside the newborn reference (BAL-25); hands with
  no outline and correct thumbs (MOT-19); eyes open in pause frames (PIT-03).
- Short clips (24 to 48 frames) of each speaking line for lip sync (PIT-02) and of a pause or two for breathing and
  life (MOT-20). Read every sheet. Send failures back to the owning agent; re-verify into a `_v2` folder.

## 6. Director approval, then render
Show the director the sheets, clips and the studio (`studio-run`). Fix what they flag (back to steps 3 to 5). Only after
explicit approval and a render request: `render-episode` (bundle, chunks, checks, final SRT, backup, changelog).

## Pitfalls met on Episodes 2 and 3
- **Frozen blinks in pauses (PIT-03):** a blink or the Puppet's end-of-speech blink on the story clock holds shut for
  the whole pause. Blinks on `lifeF`; a speaker's `talk` must read silent across a pause boundary.
- **Lip sync hidden by cheeks (PIT-01):** `cheeks` above 0.3 squeezes the mouth; keep it at or below 0.3 on a speaker.
- **Lip sync judged on scattered stills (PIT-02):** always check consecutive frames.
- **Open pause during a dissolve:** Episode 3 scene 02's open pause holds story frame 0 through the 18 f dissolve, so
  the scene's fade-in must run on `lifeF`.
- **End pause with an overlapping next scene:** the hold must sit on the last frame the scene shows alone
  (TIM-PAUSE-03), or half the pause plays under the dissolve.
- **Captions are character-share estimates:** real voice can be 0.5 to 1.5 s off; use named silences, and the
  generator re-spreads phrases between real cuts.
- **Hand-copied breathing:** a holder aiming hands at a baby with the old bounce floats once breathing changes; use
  `puppetBreath(...)` so contact stays exact. The Hand "open" shape reads as a wave: use "relaxed" on chest or cheek.
- **Beds too loud in pauses:** the old `AMBIENT_OPEN` 0.45 broke the 0.25 loop cap.
- **Memory:** parallel renders crash the 16 GB machine (and the studio, exit 139): renders through
  `scripts/render_locked.sh` or the bundle method; a half-saved, non-compiling file breaks every bundle; re-bundle
  after each change or you review old code.
- **Length estimates:** the plan's total ignores dissolve overlaps (Episode 2: planned about 7,350 f, real 7,307 f).
  Report the generator's number.
- **Part files:** cut at each clip's own sample rate (Episode 3 voices are 24 kHz); stale `_pN.wav` are deleted by the
  generator; never hand-edit them.
