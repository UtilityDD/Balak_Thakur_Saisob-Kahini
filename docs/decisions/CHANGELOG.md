# Decisions Changelog

A dated log of the director's decisions. Newest entry first. Each entry points to the rule IDs in
`01_Series_Bible/DIRECTOR_DECISIONS.md` (BAL, CHR, MOT, CAM, STO, ANI, TTL, AUD) and
`docs/PIPELINE_DECISIONS.md` (LOC, AGT, QA, REN, STU, PAU, SFX, WEB, GIT).

**How to add an entry:** in the same session as the decision, add a dated line under a new or existing date heading, name the episode, and list the rule IDs added or superseded. Do not rewrite past entries.

---

## 2026-11-21: decision documents created

Rules gathered from the director's sessions for Episodes 1 to 3 were recorded as 87 creative rules and 35 pipeline rules, with `docs/QA_CHECKLIST.md` derived from them. Conflicts with the older bible files are listed at the end of each decisions file.

### Episode 1
- Set the title and caption look the series keeps: the Episode 1 intro layout with no narration captions on the title page (TTL-02 to TTL-04), the Episode 1 subtitle style (TTL-07, TTL-08), and the sunset outro with a framed preview of the next episode (TTL-09 to TTL-12).
- Episode 1's outro previewed Episode 2; every episode now previews the next (TTL-11).

### Episode 2
- Balak shown as newborn and infant; crawling infant of about 8 to 10 months in the go-saap scene, with a real hands-and-knees crawl; the level, animal-like torso was rejected (BAL-15, MOT-16 to MOT-18).
- Infant langot: loose, knotted, trailing the hips, never a solid band (BAL-19, BAL-20).
- Visuals follow the narration literally; worked examples: the rain-blocked Shashthi puja, the move to Ujanchar, the fox's entry and exit, the rice pot covering the smiling baby, the jungle around Ujanchar (STO-01, STO-05 to STO-09).
- Fox rim light and the frightening go-saap with tongue flicks (ANI-03, ANI-05, ANI-06).
- Generated SFX come from `scripts/synthesize_ep02_sfx.js`; a placeholder is replaced by a recording under the same file name (SFX-05, SFX-06).

### Episode 3 (in progress)
- Balak is about five; the visual age may differ slightly from the narration (BAL-16).
- Five-year-old costume: white or cream dhoti with an uttariya worn like a young Brahmin boy, cloth following every pose (BAL-17, BAL-18).
- Decision documents and the QA checklist were set up so every episode is reviewed the same way (QA-05).

### Decided during the Episode 1 to 3 sessions (exact episode not recorded)
- Balak's non-Krishna likeness, restrained divine light and serene face (BAL-01 to BAL-14).
- Charu, Thakurma, alta and sari walking (CHR-01 to CHR-07); held-baby, contact, idle and timing rules (MOT-01 to MOT-15).
- Cinematic camera, face close-ups, caption-safe staging, cross-dissolves and chapter breaks (CAM-01 to CAM-10); set reuse (STO-02 to STO-04); Bagha and the zebu cow (ANI-01, ANI-02, ANI-04).
- Font, source card, no place-name boards (TTL-01, TTL-05, TTL-06, TTL-13); SFX and loop levels (AUD-01 to AUD-04).
- Pipeline: code location and the open action to commit the ep01run worktree (LOC-01 to LOC-04), agent workflow (AGT-01 to AGT-04), review by stills and contact sheets before any full render (QA-01 to QA-04), chunked renders (REN-01 to REN-05), studio on port 3100 (STU-01 to STU-03), -16 LUFS voice loudness (PAU-01 to PAU-04), Wikimedia sourcing and credits (SFX-01 to SFX-04, WEB-01, WEB-02), commit rules (GIT-01, GIT-02).

## 2026-11-21: Episode 2 final render delivered
- Director approved and asked for the final render. `03_Episodes/Episode_02_Shashthi_and_GoShaap/04_Video_Assembly/Final_Render/Episode_02_Shashthi_and_GoShaap.mp4`: 7,307 frames, 5:04.5, h264 CRF 16, four chunks joined with no fault at the joins; audio -16.7 LUFS integrated, peak -2.4 dBFS. The previous cut is kept outside the repo in the session scratchpad (`render_Episode02/Episode_02_Shashthi_and_GoShaap_previous.mp4`).
- This cut includes: the hands-and-rain interior scene (STO-14), the peon handover and the TV-paced news, farewell and music-led journey to Ujanchar (STO-13, STO-15), the approved shot list and 23 pauses inside scenes (STO-16, CAM-13, CAM-14), the rebuilt hands (MOT-19), natural breathing and a steady halo (MOT-20), the restored newborn look, the soft boxless outro glimpse (TTL-10a), and the re-synced sound.
- Final subtitles: `Episode_02_Shashthi_and_GoShaap_bn_final.srt` beside the source SRT (re-exported from `subtitles.ts`).

## 2026-11-21 (later): Episode 2 re-render and Episode 3 final delivered
- Episode 2 re-rendered with the hands without outline or wrist seam (MOT-19), one baby face across newborn, go-saap and matka (BAL-25), and Balak awake through the hands miracle: 7,307 frames, 5:04.5, -16.7 LUFS, peak -2.4 dBFS. Previous cut kept in the scratchpad (`render_final2/..._previous.mp4`).
- Episode 3 final (STO-17): the dawn flower gathering and the main scene at the shared Ujanchar village house, 12 pauses, Charu's on-screen scolding, new sound beds and the divine-motif ending; voices levelled to -16 LUFS / -1.5 dBTP (they were -24.4 to -14.4): 3,259 frames, 2:15.8, -16.4 LUFS, peak -3.4 dBFS. Previous cut kept in the scratchpad (`render_ep3_v2/..._previous.mp4`).
- Code committed on `feat/ep01-polish-and-rules` (3f1bf72); docs on `feat/cinematic-animation` (fdc37e8); audio backed up to `_backups/2026-11-21_worktree_public/` (checksums verified).

## 2026-11-22: book check, production worktree recreated, Episode 4 approved
- The temp production worktree was deleted by a cleanup; recreated at `C:\Dipankar\Balak_Thakur_Production` from commit 3f1bf72, `npm ci`, audio restored from `_backups/` (LOC-04 closed). All guides and skills repointed.
- Checked against the source book (`book.xlsx`): Episode 3's scold is by the girls of the house, not Charu (STO-17a), and Episode 3 happens at the Vedic house, not Ujanchar (STO-18); Babukaka is the father Surendra (the rice-pot father now uses Surendra's look).
- Episode 4 timing generator built (`scripts/build_ep04_timing.js`, voices levelled); Episode 4 plan approved (STO-19): the Vedic house, the priest Bhagabati captioned পুরোহিত ঠাকুর, scene 3 wordless, chapter breaks. Build started.
- episode-polish-pass skill: who speaks and where come from the book, not the voice ID.

## 2026-11-22 (evening): Episodes 2, 3 and 4 final renders delivered
- Episode 2 (7,307 frames, 5:04.5, -16.7 LUFS): the rice-pot father now uses Surendra's look (Babukaka is Surendra).
- Episode 3 (3,259 frames, 2:15.8, -16.4 LUFS): moved to the Vedic house courtyard (STO-18); the girls of the house scold Balak, Charu absent (STO-17a); serene open eyes at the end.
- Episode 4 (3,335 frames, 2:19.0, -16.4 LUFS), new: the clay Shiva and the doll, the Gobinda at the pond and Thakurma's prophecy, the coconut water (STO-19); chapter breaks; the big stone bowl as in the book.
- All joins seamless, zero decode errors; previous cuts kept in `C:\Dipankar\Balak_Thakur_Production\render_final_2026-11-22\`. Final SRTs re-exported. Audio backed up to `_backups/2026-11-22_worktree_public/`.
- Process: orphaned renders after stopped scripts caused memory exhaustion (PIT-04); render scripts now write chunks to .tmp, skip done chunks, and join with Windows paths.

## 2026-11-22 (later)
- BAL-26: the director’s reference plates (age 6 to 22) set Balak’s face and body from Episode 5 on, adapted to age; short straight black hair replaces curls for these ages. Plates copied to `01_Series_Bible/Thakur_Reference_Plates/`.
- STO-20: Episode 5 shot-and-pause plan approved on the recommended answers (kachari in Ujanchar, Balak six in the BAL-26 design, standing rig, tortoises, cow walk, six pauses, two action gaps, one chapter break).
- Episode 5 build (STO-20, BAL-26): plate-design Balak (seated and standing, shared head), tortoises, Gentle cow, Krishnanagar kachari set, Binoy and Haricharan, timing 2,849 frames (6 pauses, 2 action gaps, 1 chapter break), CC sound effects in sfx/ep05; review stills and clips prepared for the director (not yet approved).
- STO-20a: director review of Episode 5 scene 01: smile and push-in during the tortoise play; remove the hump and stiff chadar panel from the standing child’s back in bends.
- STO-20b: Balak sits on the ground for the whole Episode 5 tortoise scene (director override of the book’s standing posture).
- AUD-07: cinematic, situation-led scoring with Indian instruments from Episode 5 (cue sheet Ep05_Music_Cue_Sheet.md); tension and fear at the tortoise bite.
- BAL-26a: Episode 3 switches to the reference-plate Balak (age 5); re-render after approval.
- Director approved the reference-plate Balak in Episode 3 (BAL-26a) and asked for the new cinematic music (AUD-07) in Episode 3 too (cue sheet Ep03_Music_Cue_Sheet.md); Episode 3 to be re-rendered after approval.
- BAL-26b: Episode 4 switches to the reference-plate Balak (age 5; age 6 in the outro glimpse); re-render after approval.
- Director: proceed with the suggestions: the new score in Episode 4 too (AUD-07), and Episode 2 re-rendered in the same final session so its outro glimpse of Episode 3 shows the reference-plate Balak; final renders of Episodes 5, 3, 4 and 2 after the main session's check (render_final_set3.sh).
- Deliveries 2026-11-22 (second set, render_final_set3.sh): Episode 5 new (2,849 frames, 1:58.8, -16.7 LUFS); Episode 3 (3,259 frames, -16.2 LUFS) and Episode 4 (3,335 frames, -16.3 LUFS) re-delivered with the reference-plate Balak and the cinematic score. All zero decode errors, black only at designed fades and chapter breaks; final SRTs re-exported; previous Episode 3/4 cuts kept in the worktree folder render_final_2026-11-22/. Episode 2 re-render paused by the director at 2 of 4 chunks.
- STO-21: Episode 6 plan approved on the recommended answers (Ujanchar house and a new Ujanchar playing field; elder brother, village boys, khadam; six pauses, three action gaps, one chapter break, about 2,970 frames). Build pass started.
- CHR-08: children together meet halfway (smaller heads for the new Puppet children, Balak as tall as boys of his age with a slightly bigger head).
- RIG-EP06-01 (plate head turn clamped to ±1.3), RIG-EP06-02 (Episode 6 child scale and opt-in Puppet additions), TIM-EP06-01 (caption phrase anchors).
- 2026-11-23: new 05_Rework/ folder; plan for the Balak painted-look library written (not started, awaiting approval after Episode 6).
- 2026-11-23: director approved Episode 6 for the full render; AUD-08 (outro shimmer 0.2 from Episode 6 on); CHR-08a (Episode 6 accepted with the CHR-08 proportions).
- 2026-11-23: Episode 6 final render delivered: `03_Episodes/Episode_06_Rescuing_Brother_and_Playmates/04_Video_Assembly/Final_Render/Episode_06_Rescuing_Brother_and_Playmates.mp4` (2,978 frames, 2:04.1, h264 CRF 16, 2 chunks; joined with video copy and AAC 192k audio re-encode after a 37 ms audio gap at the copy-join; zero decode errors; black only at the template dip after the title, the chapter break and the outro end; -16.4 LUFS, peak -3.6 dBFS). Final SRT `_bn_final.srt` (30 cues). No previous cut existed. Includes STO-21, CHR-08/08a, AUD-07/08, RIG-EP06-01/02, TIM-EP06-01. Episode 6 audio backed up to `_backups/2026-11-23_worktree_public_ep06/`.
- 2026-11-23: STO-22 faithful story, cinematic telling (widens STO-01); Episode 6 to be re-cut as its pilot (plan Ep06_Immersive_Recut_PLAN.md, awaiting approval).
- 2026-11-23: STO-22a Episode 6 immersive re-cut plan approved; build round 1 started.
- 2026-11-23: BAL-26c standing Balak healthy and lively (proportions, posture, costume, face, hands), opt-in for the Episode 6 re-cut on.
- 2026-11-23: BAL-26d (healthy look approved: chadar over the upper arms, head 1.45, seated palette matched, +3% standing scale); PROC-OWN-01 (painted-look work paused while this session owns the Balak rig files).
- 2026-11-23: Episode 6 re-cut sound pass done; K1 sounds thinned, l1_steps re-keyed after P2, AUD-08a (outro sparkle 0.12, to confirm).
- 2026-11-24: GHB-PLATE-01 (Ghibli plates as layered painted rasters plus SVG overlays); new Vedic courtyard wall and floor plates for Ghibli Episode 4 from the director's images.
- 2026-11-24: TTL-14 one-line captions only; Ghibli Episode 4 captions split (90 to 113 cues, max 44 characters).
- 2026-11-24: CHR-09 children from earlier episodes grow with the timeline (Rama in Ghibli Episode 4 enlarged to about 10-11).
- 2026-11-24: STO-22b immersive world-and-light layer for the Ghibli episodes (life kit, sunrise opening, ground cover, depth); kit and sounds started.
- 2026-11-24: STO-22c Ghibli Episode 4 television picture pass approved after the 3-second courtyard proof (`Ep04_Feel_3s.mp4`). Characters unchanged. Closer shots, light, ground, depth, hero objects, seen entrances, courtyard title, soft outro. New images and props allowed. No full render until stills are seen.
- 2026-11-24: MOT-21. Pointing shows the index finger only; conversation palms stay together and turned; the dhoti hangs and stirs slowly, with a softer ink line on white cloth. From the director's gesture notes on the Episode 4 Ghibli pictures.
