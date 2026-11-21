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
