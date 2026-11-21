# Shared brief: Episode 4 build (2026-11-22)

You are one of several agents building Episode 4 of "Stories of Balak Thakur", a gentle Bengali devotional
children's animated series (Remotion, React + SVG, 1920x1080, 24 fps, 2.5D multiplane camera). Each agent owns
only the file(s) named in its prompt. Never edit any other file.

Production worktree: `C:\Dipankar\Balak_Thakur_Production` (branch `feat/ep01-polish-and-rules`; recreated on
2026-11-22, node_modules fresh). Remotion commands run from `remotion_studio`.

## Read first
- `C:\Dipankar\Balak_Thakur_AI_Studio\CLAUDE.md` (golden rules, how work is done).
- `C:\Dipankar\Balak_Thakur_AI_Studio\01_Series_Bible\DIRECTOR_DECISIONS.md`: STO-19 (the approved Episode 4
  answers), STO-18 (place, people and speakers come from the book), CAM-10 (chapter breaks), CAM-11, CAM-13
  (camera grammar), CAM-14 (pauses), MOT-19 (hands), MOT-20 (breathing), BAL-01 to BAL-25 (Balak's divine look; he
  is about five here), TTL-10a (soft outro glimpse); `docs\PIPELINE_DECISIONS.md` PIT-01 to PIT-03.
- The APPROVED plan: `C:\Dipankar\Balak_Thakur_AI_Studio\03_Episodes\Episode_04_Idols_and_Coconut_Water\01_Script_and_Storyboard\Ep04_Shots_and_Pauses_DRAFT.md`
  (status block with the answers, "The book, the recordings and who is on screen", "Scene designs and shared
  looks", your scene's shot list and pauses, "Notes for whoever codes this" with the protected fixes).
- The source: the book's chapters 6 and 7 are in `C:\Dipankar\Balak_Thakur_AI_Studio\book.xlsx` (row 11 and row 12,
  column D; read with openpyxl via `python -I`, writing UTF-8 to a file). Visuals follow the book and the narration.

## Story facts (from the book)
- All three stories happen at the Vedic house (Bhagabati Thakur's joint family). People: Charu, the jyethi
  (Bhagabati's wife), Sundar Thakur (does the Gobinda puja), Harendra Thakur, Thakurma, Bhagabati Thakur (the house
  priest and head), the elder brother, the servant Mangla (left out), Balak about five.
- Scene 01: Charu makes a clay Shiva daily and bows down long after puja; Balak lifts the clay Shiva from the puja
  plate, sets his painted wooden doll (bought at the fair) in its place, and rolls the clay into a ball.
- Scene 02: Charu tells the jyethi (flashback): Balak took the brass Gobinda from the deity's khat and put his doll
  there; Sundar found it; they found him under the mandar tree by the pond; he gave the Gobinda back to Sundar after
  a runner fetched his doll. Then at home Harendra says "কি যে কালাপাহাড় এল আমাদের ঘরে" and Thakurma answers
  "এই কালাপাহাড়ই একদিন কৈলাসপতি হয়ে উঠবে" (the one gentle glow beat of the episode).
- Scene 03: a full-moon abhishek in the shrine room; Balak watches from the veranda (he is forbidden inside); the
  priest calls "ধুপ! ধুপ কই?"; Balak brings the incense, asks to sit inside (wordless, by gesture), and while the
  priest is busy he drinks the coconut water from the stone bowl in one gulp and puts the bowl back with the
  coconut kernel; then his line "ঠাকুরমশায়, আপনার ঠাকুর তো কিছুই খায় না…".

## Timing and story clock
- `scripts\build_ep04_timing.js` writes `src\episode04\timing.ts` and `subtitles.ts` (generated: never hand-edit).
- `src\episode\storyClock.ts`: `useStory4(sceneId)` returns `{ f, lifeF, pause }` (f = story clock, holds in pauses;
  lifeF = real local frame for every rig's `lifeF` prop and anything that keeps moving); `cueLocalStory4`,
  `clipSpan4`, `pausesFor4`. Action gaps (time in which the story clock runs with no narration, for scene 03's
  wordless action) are being added by the generator agent; read the generator's header and the exports in
  timing.ts when you start.
- Tie camera keys to narration cues (CAM-13); one move at most per line; holds; close-ups 6 to 8 frames early.

## Rigs, sets and look
- Five-year-old Balak: `src\episode03\rig\SeatedChild.tsx` (and `BirulGlow.tsx` for his halo), shared Hand, natural
  breathing, `lifeF`, `sigh`, `talk`. New poses for Episode 4 are being added by another agent.
- Adults: Puppet (`src\cinematic\rig\Puppet.tsx`), cast in `src\cinematic\rig\cast.ts` (bhagabati, charu, thakurma,
  babukaka and others; Sundar and Thakurma may move to the shared cast during this build).
- Sets: the Vedic house (`BaidikBariDay` in `src\cinematic\sets\S01_DaySets.tsx`; inner courtyard `CourtyardBack`,
  `CourtyardFloor` in `Interiors.tsx`); `Sacred.tsx`; props `TulsiMancha` and `JabaShrub` are exported by
  `UjancharHouse.tsx`. A new set file for the day pond with the mandar tree and the shrine room (ThakurGhar) is being
  built by another agent.
- No glow on any idol, prop or other character; Balak's glow restrained (BAL-05 to BAL-07); faces above y = 820; no
  background edges; Baloo Da 2 for text.

## Rendering (16 GB machine)
Bundle once after each edit and render stills from the bundle (about 4 s each):
`node node_modules/@remotion/cli/remotion-cli.js bundle src/index.ts --out-dir=../bundle_<you>` then
`node node_modules/@remotion/cli/remotion-cli.js still ../bundle_<you> <Composition> ../check_<you>/f.png --frame=N`.
For a clip use the lock: `bash ../scripts/render_locked.sh render <Composition> ../check_<you>/clip.mp4 --frames=A-B --codec=h264`.
Look at your stills before you finish.

## Finish
Type-check: `NODE_OPTIONS=--max-old-space-size=4096 node node_modules/typescript/bin/tsc --noEmit` (errors inside
`src/param_bismoy_ep01` are the director's separate series: ignore; other agents' files may be mid-edit: say so).
Keep your file compiling between saves (every render bundles the whole project). Save as you go. Do NOT git commit.
