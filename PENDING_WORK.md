# Pending work — live handoff (read this first when resuming)

Any agent (Claude, Cursor, another machine) picking this project up: start here. Keep this file current.
Last updated: **2026-11-26 09:35** (Claude Code session on the director's laptop). Everything below "Older notes" is
the 2026-11-24 handoff from the other machine and is kept for history only.

## Where things are (this laptop)

| What | Where |
|---|---|
| Production worktree (code) | `C:\Dipankar\Balak_Thakur_Production`, branch `feat/ep01-polish-and-rules` (pushed) |
| Main repo (bible, scripts, voices, renders) | `C:\Dipankar\Balak_Thakur_AI_Studio`, branch `feat/cinematic-animation` (pushed) |
| Rules | main repo `CLAUDE.md`, `01_Series_Bible/DIRECTOR_DECISIONS.md`, `docs/PIPELINE_DECISIONS.md`, `docs/decisions/CHANGELOG.md` |
| Gitignored audio | `remotion_studio/public/audio/`; backups in main repo `_backups/` (latest: `2026-11-26b_worktree_public_ep05rewrite`) |
| Original book text | main repo `book.xlsx` (one chapter per row); per-episode extracts `01_Script_and_Storyboard/EpNN_Book_Source_Text.md` |
| Studio | `npx remotion studio src/index.ts --port=3100 --no-open` from `remotion_studio` (LAN http://192.168.1.8:3100) |

Rules that changed this week (details in the decision files):
- Renders use the GPU: `--gl=angle`, concurrency 2, heavy Ghibli scenes in pieces of about 320 frames (REN-GPU-01; `scripts/ghibli_render/`).
- Captions are one line (TTL-14).
- The `music/ep05` instrument library is the series score (AUD-09).
- Ghibli rewrites are conversation-led and drafted from the book (STO-23).
- Balak's new look is opt-in `plateLook="ref2"`, for new episodes only (BAL-26e/f).

## Done

- **Ghibli Episode 4 delivered for review** (2026-11-26):
  `03_Episodes/Episode_04_Idols_and_Coconut_Water/04_Video_Assembly/Ghibli_Test_Render/Episode04GhibliFull_2026-11-26.mp4`
  with `_bn.srt` (8,594 frames, 5:58, -16.5 LUFS). Rendered from commit `5d27c0e`.
- **Ghibli Episode 5 rewrite, preparation** (all in `src/ghibli_pipeline/episode05_rewrite/`, composition `Episode05GhibliRewrite`):
  - blueprint: main repo `Episode_05_FULL_PRODUCTION_BLUEPRINT.md` (DRAFT);
  - timing generator and skeleton scenes (9,316 frames on estimated line lengths);
  - cast and props (`Ep05RewriteCastQA`);
  - 10 CC sound effects (`public/audio/sfx/ep05_rewrite/`).

## Next work, in order

### 1. Ghibli Episode 5 rewrite: BLOCKED on the director's voices and answers
- The director is generating the 40 voice WAVs into main repo
  `03_Episodes/Episode_05_Tortoise_and_Gentle_Cow/02_Audio/Voice_WAVs_Full_Rewrite/`. 2 of 40 are there
  (`00_Intro`, `01a_Narrator_Kachari`). File names are in the blueprint's section 10.
- When more WAVs land, run from the worktree root:
  `python scripts/prepare_ep05g_voices.py && node scripts/build_ep05g_timing.js`
  It levels voices to -16 LUFS and rebuilds `timing.ts` and the one-line `subtitles.ts`. Lines without a WAV stay on
  estimates and stay silent.
- The director still has to answer the blueprint's section 9 (26 open questions). The main ones:
  - the lines marked [implied];
  - the line "কখনো কখনো মারও জুটত";
  - new voices (Binoy, Haricharan, junior clerk) and Binoy's height;
  - whether Balak's new look applies to Episode 5;
  - the 6 new paintings (Gemini prompts are in the blueprint; process them like the `ghibli_ep04` plates, GHB-PLATE-01).
- Then, with agents (brief: `AGENT_BRIEF_ep5_rewrite.md`, one agent per file):
  1. acting and gesture pass per scene on the real lines (switch stand-ins to `Ep05RewriteCast.tsx` and
     `Ep05RewriteProps.tsx`; turn off `SKELETON_LABELS`);
  2. life layer (STO-22b);
  3. sound pass (AUD-09 score at about -22 LUFS in wordless moments, about -16 in dialogue; the new sound effects);
  4. main-session review with stills and clips, then the director's approval;
  5. GPU render (`scripts/ghibli_render/`, about 40 minutes).

### 2. Balak new-look rig (ref2): PAUSED mid round 5 by the director (2026-11-26 08:20)
- Files: `src/episode05/rig/StandingChild.tsx`, `src/episode03/rig/SeatedChild.tsx`,
  `src/cinematic/rig/ThakurHeadPlate.tsx`. Test bed: `BalakRef2PoseQA` (480 frames, 13 gestures).
- ref2 ONLY. Episodes 3, 5 and 6 were verified pixel-identical after the last edit (8 frames, 0 differing pixels).
  Baselines are `out_balakrig/iso/head_*.png`. Re-verify after any rig change.
- In so far: broad shawl chadar, shorter arms, shoulder follows the arm, standing namaskar (`handDirs`), and the opt-in
  props `bodyLean` (with a partial twist) on StandingChild and `offerTuck` on SeatedChild.
- Still wrong (the director's list plus the last sheet `out_balakrig/r5_standing_zoom.png`):
  - pointing bunches the shawl into a towel-like block at the neck;
  - offering leaves the far raised elbow bare and sharp;
  - shrug forearms tangle;
  - seated offering forearms read long (Episode 4 frames 2960-3580);
  - the twist has not been reviewed.
- Round 5 was stopped before its report. Review it before building on it.
- NOTE: Ghibli Episode 4 in the studio now shows these newer rig rounds, so it no longer matches the delivered MP4
  exactly (the MP4 is commit `5d27c0e`). Re-check Episode 4 stills before any Episode 4 re-render.

### 3. Ghibli Episode 4: open review points (the director has the MP4)
- Flat veranda pillar and roof beams at 5760-5815.
- Charu's palms-joined moment in Scene 04 needs approval.
- The kingfisher dive is small in frame.
- Soft spot effects are partly masked by the louder music.
- The director's new 17.9 s `01a_Narrator_Morning.wav` take (adds "কিন্তু একদিন হলো কী…") is NOT in the episode. It needs
  the voice swapped, a caption added and a shift of about 5.6 s, then a re-render.

### 4. Ghibli Episode 6 rewrite: NOT started (after Episode 5, STO-23)
Episode 6 has 25 painted plates and `Episode06GhibliTest`, but it is about 94% narration. Draft
`Episode_06_FULL_PRODUCTION_BLUEPRINT.md` from the book (`book.xlsx` chapters দশ, এগার, বার), with the same method as Episode 5.

### 5. Smaller open items
- Episode 6 immersive SVG re-cut (STO-22a): review set and approval pending.
- Episode 2 outro re-render: paused at 2 of 4 chunks.
- Episode 1 re-render for the shared rig fixes: the director said "not now".
- GitHub Actions rendering: possible (public repo), not needed since the GPU switch.

## Housekeeping notes
- Scratch folders in the worktree root (`bundle_*`, `check_*`, `out*`, `review*`, `chunks_ep4g`, `bench`, `ep5r_qa` and
  similar) are untracked render output. They are safe to delete when disk is needed; keep the `out_balakrig/iso/` baselines.
- Close heavy apps before rendering (16 GB RAM). Run two GPU renders at most; agents render one at a time through
  `scripts/render_locked.sh`.
- Commit and push only when the director asks.

---

# Older notes (other machine, 2026-11-24): history only


Any agent (Claude, Cursor, another machine) picking this project up: start here. Keep this file current —
update it whenever a task starts, finishes, gets blocked, or a director decision changes the plan.
Last updated: **2026-11-24** (Cursor: Thakurmoshai floor-sit + ashon ground + upright lean landed).

## Where things are

| What | Where |
|---|---|
| Working folder (this file) | `D:\Dipankar\MyCodes\AI Projects\Balak_Thakur_param_bismoy` — git worktree, detached HEAD on `origin/feat/ep01-polish-and-rules` @ `e4b31a8`, **with uncommitted work** (see "Uncommitted state") |
| Main repo folder | `D:\Dipankar\MyCodes\AI Projects\Balak_Thakur_Saisob-Kahini` (branch `main`, no new work; only a local `package-lock.json` change) |
| Docs / director rules | `01_Series_Bible/DIRECTOR_DECISIONS.md` and the Ep04 blueprint are on `origin/feat/cinematic-animation`; local read copies in `_reference/` |
| Large media (gitignored) | Google Drive folder https://drive.google.com/drive/folders/1TSyqSocmF0W1VQx0Z5D0ydDEOyzh7BLr mirrors `remotion_studio/public/`; pull with `python scripts/sync_media.py` |
| Local stand-ins awaiting real media | `remotion_studio/public/video/_PLACEHOLDERS.txt` (cleared automatically by `sync_media.py` / `regenerate_lipsync.py`) |
| Lip-sync tool (JoyVASA) | `D:\AI_Tools\JoyVASA` (venv + weights; work dir `_work/`). Not in git. |
| Review stills / scratch | `_reference/` (gitignored) |

Machine rule: **never use the C: drive** for downloads, caches, renders or temp files — set `TMP`/`TEMP` to a folder on D:.

## Uncommitted state (nothing below is pushed yet)

- Backup of the pre-pull local work: `git stash list` → `stash@{0}` "backup: local Param Bismoy work before pulling e4b31a8 (2026-11-24)". Do not drop it until this work is committed.
- Param Bismoy Ep01: `LipSyncVideo.tsx` (voice-locked clips), Scene03 multi-angle re-cut, Scene01/02 clips switched to `LipSyncVideo`, duplicate thunder removed, painted-demo part B `trimBefore`, closed-mouth plates (`*_closed.jpg`), new plates from another session (wife point, villager disbelief, migration, Pagol arms raised…), `CharacterPuppet` / `KineticPlate` / `CinematicGrade` / `ghibli_demo` (another session).
- Pipeline scripts: `scripts/sync_media.py`, `media_sources.json`, `regenerate_lipsync.py`, `check_lipsync.py`, `close_mouth_plate.py`, README section.
- Episode 4 Ghibli fixes in progress (below) in `src/ghibli_pipeline/episode04/**`, `core/GhibliLifeKit.tsx` (added `GhibliBirdFlock`).
- `src/Root.tsx`: upstream + local `GhibliAnimeTest` merged by hand.

## In progress right now

### Episode 4 Ghibli — fresh full audit, fix, full render (director 2026-11-24 ~17:00: "1st start working with 4")
Same brief as Ep05 below but for Ep04 first: audit current uncommitted Ep04 state (after agents A–E + Cursor passes), fix inconsistencies in visuals/rigs/animation properly, render full episode to `_reference/ep04_ghibli_render/` for review. Status: **auditing** (stills every 3 s → `_reference/ep04_audit/`).
Director then: "completely make episode ready for publish" → scope = picture fixes + real music + final MP4 (1920x1080/24/H.264+AAC) + `_bn.srt` + QA (loudness, black/broken frames, caption sync).
- Known so far: Balak `build:"healthy"` missing in Scene05/06 (BAL-26d) — colours change mid-episode; `cast.ts` Bhagabati changed bare-chest→white kurta GLOBALLY — **DIRECTOR DECISION 2026-11-24: keep the white kurta for the whole series** (record as a CHR rule in `01_Series_Bible/DIRECTOR_DECISIONS.md` on `feat/cinematic-animation` when docs are next committed; Ep1 and older renders/blueprints that say "bare-chested with namaboli" are superseded); `Episode05.tsx` replaced by a stub routing to Ghibli (original in git HEAD + `Episode05_Legacy_Backup.tsx`).
- AUDIT DONE (119 stills `_reference/ep04_audit/`, 4 review agents): 7 BLOCKERS — Charu off-frame f828/900; Charu pranam reads as fainted f972–1116; Mangla seated paper-doll f2916–3636; mandar trunk see-through (pond); Balak half off-frame on "এটা পুকুরে ছুঁড়ে ফেলে দেব!" f4212; Balak floating in shrine f6516/6588 (+ Scene 06 throughout); plus ~30 HIGH/MEDIUM (wide shots for spoken lines, heads cut at frame edges, priest/women pancake laps, stray doorway arch, stray dash sprite, glow beat weak, dhupdani on lap, Ep5 glimpse missing Balak, 2 captions at once f8316, ending fade). Balak "classic palette" suspicion REFUTED by pixel check.
- FIXING (4 agents, file ownership): Rig → `cinematic/rig/*`, `SeatedChild`, `StandingChild` (seated adults, pranam pose, neck shear, Balak sleeve/seam/hand, prop-in-hand) with before/after regression stills for Ep3/5/6 → `_reference/ep04_fix_rig/`; S1 → Scene01 + Ep04GhibliShared + subtitles + Episode04Ghibli (transitions) → `_reference/ep04_fix_S1/`; S23 → Scene02/03 (+GhibliStage tree only if needed) → `_reference/ep04_fix_S23/`; S456 → Scene04/05/06 → `_reference/ep04_fix_S456/`.
  - 2026-11-24 ~17:30: all 4 fixers hit the account's 5-hour usage limit mid-work (work saved on disk); resumed after re-login. If they stop again: their partial edits are in the files above — a new agent should diff (`git diff -- <file>`), re-render the audit frames, and continue the same finding list.
  - 18:20 ALL 4 FIXERS DONE. Rig: new OPT-IN props in `Puppet.tsx` (`sitStyle="crossLegged"|"kneel"`, `softSleeves`, `reachExact`, `pointReach`), head-roll clamp (default), `StandingChild sturdy`, SeatedChild far-sleeve seam (default); Ep3/5/6 pixel-identical before/after. Props applied: Scene01 Charu kneel+softSleeves+pointReach 0.8, standing Balak sturdy (S01, S03), Scene02 Mangla crossLegged + lap holdAt, Scene04 Charu/Thakurma kneel+softSleeves, Scene05/06 priest crossLegged. Scene agents' per-finding reports in chat; stills `_reference/ep04_fix_{S1,S23,S456}/`, `_reference/ep04_props_check/`.
  - Remaining polish (not blockers): Charu's pranam reads as a white heap (head hidden under veil) — director to judge; side-on staging would fix; drinking pose lifts bowl with ONE hand (rig); priest flush only orange-red (rig tints at 0.33×flush); brother's wrist grip not clearly gripping (`reachExact` exists, not applied); family freeze shot still somewhat row-like; ghat still slightly plank-like; Mangla's far arm stick-like in one shot.
  - C: DRIVE: Remotion bundler ignores shell TMP/TEMP → bundles land in `C:\Users\dipnk\AppData\Local\Temp\remotion-webpack-bundle-*` (1.3 GB each; C: hit 100%). Cleared ~20 GB on 2026-11-24. Set `process.env.TMP/TEMP` INSIDE node scripts before importing @remotion/*, or render from a CLI `bundle --out-dir` on D:. Check that folder after any render.
- THEN: re-render audit sheet (`_reference/ep04_audit2/`), verify, `bash scripts/render_ep04_ghibli_final.sh` (chunked MP4 + `_bn.srt` via `scripts/export_ghibli_srt.js` + QA) → `render_final_ep04_ghibli/`.
- Music: DONE — 14 files synthesised by `scripts/synthesize_ep05_music_library.py` (levels/lengths match the code's loudness tables; tanpura in C 130.81 Hz, `_cs` in C#; loops seamless; spectrograms `_reference/music_check/`). Needs a director LISTENING pass. If the originals turn up, upload to Drive at the same paths and run `sync_media.py`.
  - Publishing note: Ep03/Ep04 cue sheets (and likely `docs/AUDIO_CREDITS.md`) credit outside recordings (sankalp, luckylittleraven, tabladrumsonline, Johnny Kalsi, MayankSingh33) that the synthesised files no longer use → fix the Ep04 video-description credits.
  - Still silent, NOT used by Ep04: `music/ep05/{bansuri_relief, drum_pulse, drum_pulse_fast, drum_pulse_fast_hot, drum_pulse_hot, tanpura_drone_low_hot, cheeky_pluck_}`; Ep06 also wants a missing `cheeky_pluck_4`.

### Episode 5 Ghibli — ON HOLD (director 2026-11-24: "do not need to work on 5, no background work") — partial audit stills in `_reference/ep05_audit/`; resume only when asked
Director: "many inconsistencies on the visuals, rig models and animation; tried to fix but failed. Audit, fix better, render the episode for my review." Plan: (1) map Ep05 Ghibli + check the uncommitted shared-rig edits (`SeatedChild` −338, `StandingChild` ±800, `Puppet`, `cast`) and the cut-down `src/episode05/Episode05.tsx` (backup `Episode05_Legacy_Backup.tsx`) for regressions; (2) render every shot, parallel review agents vs DIRECTOR_DECISIONS + Ghibli style bible; (3) fix by file ownership; (4) full render to `_reference/ep05_ghibli_render/` for review. Status: **starting audit**.

### Episode 4 Ghibli — picture pass (director: "complete episode 4 first")
Review that started it: `_reference/ep04_ghibli_stills/sheet.jpg` (18 stills; 3 agent reviews summarised in the chat).
### Done earlier — seated lower width + Biru dhoop sliding
- Shared `Puppet.tsx` seat/kneel widen; Ep04 `seated` on Charu/Thakurma/priest/Mangla; Scene05 `kneeStepTravel`.
- QA stills in `_reference/ep04_sit_dhoop_fix/`. Studio: http://192.168.1.7:3100 → `Episode04GhibliFull`.

### Done — Scene01 morning light / Biru exit walk / upper chadar
- `Scene01ClayShivaGhibli.tsx`: softened `FeelMorning` overlays; Scene01-only `S01_MORNING_LIGHT` (`brightness: 0.96`); Balak aura/glow toned down locally (`glow 0.55`, ground `0.4`); exit walk phase-locked (body advances only in swing; planted feet hold world X; stronger plant shadows).
- `StandingChild.tsx` healthy path only: sealed wrap poly, softer fold strokes + clothPaint mounds, chest-hold cape `tight` (floor ~0.32) so Shiva hug does not peel a wing. Classic path untouched.
- QA stills: `_reference/ep04_fix_A/a_f{850,1029,1053,1061,1087,1117,1297}.jpg` (review at http://192.168.1.7:3100 → `Episode04GhibliFull`).

### Parallel agents A–E — finished

| Agent | Files | Status |
|---|---|---|
| A — Scene 01 + shared | Scene01, Ep04GhibliShared, subtitles, Episode04Ghibli clink | **Stopped** (director took Scene01 light/walk/cloth); prior Biru exit polish kept |
| B — Pond | Scene02, Scene03 | **Done** — soft grass washes, Mangla squat life, Scene03 staging; stills `_reference/ep04_fix_B/` |
| C — Prophecy/ants | Scene04, Scene06 | **Done** — family depth, Harendra jab, glow CU, priest shock, ants floor; stills `_reference/ep04_fix_C/` |
| D — Seat silhouette | `Puppet.tsx` | **Done** — taller lap mass / thigh mounds; stills `final_*` (= `v3_*`); remaining: saree pancake, priest knee creases (director pass removed seated beanbag ellipse) |
| E — Verify | typecheck + 18 stills | **Done** — only known `thakur/qa` typecheck errors; `_reference/ep04_ghibli_stills/s01–s18` fresh (`sheet.jpg` not rebuilt) |

### Done — Thakurmoshai puja sit + ashon ground
- Scene05/06: priest `kneel: 0` + upright baseline lean (forward only on chant/offer); `SHRINE.priestY = floorY`.
- Khat cutout + Gobinda dropped to floorY; stronger priest/khat contact shadows.
- `Puppet.tsx`: seated dhoti ignores kneel override; grounded lap/hem (no giant lap ellipse under seated).
- QA: `_reference/ep04_sit_dhoop_fix/v6_priest_{6100,6288}.jpg` (+ v5 two-shot / s06).

**After director review of sheet + priest sit stills:** full render.

## Blocked / waiting on the director

1. **Episode 4 music** — 13 files `audio/music/ep05/*` (tanpura, tabla, bansuri, plucks…) + `audio/sfx/ep06/plate_clink.wav` exist only on the other machine (not in git, not on Drive). Currently silent stand-ins. Either upload them to the Drive folder at the same paths and run `sync_media.py`, or approve synthesising replacements (`scripts/synthesize_audio.py` has a tanpura generator).
2. **New painted images** — prompts in `IMAGE_REQUESTS_S2_EP01.md` (Scene 02 wife/villager poses, the 6 Kaulipara villagers + cast sheet, Pagol closed-mouth smile). The director wants them generated in his Chrome via the Claude in Chrome extension (installed; needs a Claude Code restart so the browser tools load, then "use my chrome").
3. **Lokenath smile line** (`p1c_01d_24`) still fails the lip-sync check — choose: regenerate with other settings, or cut to Jogesh listening over the voice.

## Next up (not started)

- Param Bismoy Ep01: multi-angle re-cut of Scenes 01 and 02 (as done for Scene 03); then commit.
- Param Bismoy Ep01: rebuild `subtitles.ts` cues and the `_bn.srt` from `timing.ts` (both drift from Scene 02 on; the SRT is from an older cut).
- Remove the leftover root-level extra water-splash SFX in `ParamBismoyEp01.tsx` (scene already has its own).
- 9 pre-existing typecheck errors in `src/cinematic/thakur/qa/{LightQA,PaintedPilot,StandingPaintedQA}.tsx` (planned `look=` prop / `standSerene` pose not in the child rigs; QA screens only, not registered in Root). 19 documented-but-unbuilt creatures in `GhibliLifeKit.tsx`.
- Commit + push all of the above (only when the director asks).

## How to resume

```bash
cd "D:/Dipankar/MyCodes/AI Projects/Balak_Thakur_param_bismoy"
git status --short; git stash list          # see uncommitted work + backup
python scripts/sync_media.py                # pull media from Drive, list stand-ins still missing
cd remotion_studio && npx tsc --noEmit      # expect only the 9 thakur/qa errors
npx remotion studio src/index.ts --port 3100 --ipv4 --no-open   # director reviews at http://192.168.1.7:3100
python ../scripts/regenerate_lipsync.py --list                    # lip-sync clip status
```
