# Shared brief: Episode 4 Balak to the reference-plate design (2026-11-22)

You are one of four agents, each owning ONE Episode 4 scene file. Do not edit any other file (rigs, sets, Episode04.tsx,
other scenes). Do NOT git commit.

Production worktree: `C:\Dipankar\Balak_Thakur_Production` (branch `feat/ep01-polish-and-rules`); Remotion commands from
`remotion_studio`.

## The director's request
"Similarly replace the Thakur of Episode 4, suitably adjusting the size and age effect." Episode 3 was just switched to
the reference-plate design and the director approved it (BAL-26a). Episode 4 now follows (BAL-26b).

## Read first
- `C:\Dipankar\Balak_Thakur_AI_Studio\01_Series_Bible\DIRECTOR_DECISIONS.md`: BAL-26, BAL-26a (and BAL-01 to BAL-14:
  his halo only, restrained), STO-19 (Episode 4's approved plan).
- The plates: `C:\Dipankar\Balak_Thakur_AI_Studio\01_Series_Bible\Thakur_Reference_Plates\` (plate 01 is age 6).
- The rig: `remotion_studio\src\episode03\rig\SeatedChild.tsx` header: `design="plate"`, `age`, the expressions
  (serene, joyful, playful, thoughtful, compassionate, surprised), `blinkAt`, `handsTo`/`handTargets`/`palmUp`,
  `seatedChildHands(props)` (palms, wrists, `glowAnchor {cx, cy, r}`), and all Episode 4 poses and held objects
  (clayLump, clayShiva, doll, gobinda, incense, stoneBowl) which work in the plate design.
- How Episode 3 did it: `git diff` of `remotion_studio\src\episode03\scenes\Scene02FlowersOnOwnFeet.tsx` (the switch
  to design="plate", age={5}, and the halo on the glow anchor). The Episode 5 outro / scene 02 show the plate child
  next to Puppet adults.

## What to do in your file
1. Every Balak: `design="plate"`. Age: **5** in Episode 4's story scenes (the book: about five), **6** in the outro's
   Episode 5 glimpse (Balak beside the cow; Episode 5 uses age 6).
2. Size and age effect: the plate head sits a little higher and the face proportions differ. Re-check his scale against
   the adults (Puppets) and the props in each shot: a five-year-old's head about 80-85% of an adult Puppet head when
   they share a frame, his seated height believable next to them; adjust `s` and positions as needed, keeping his
   contact with held objects (the clay Shiva, the doll, the brass Gobinda, the incense, the stone bowl) and his place in
   the composition.
3. Halo: put BirulGlow at `seatedChildHands(props).glowAnchor` (cx, cy, r) so it is centred behind the plate head.
4. Keep all poses, actions, timing, lip sync, blinks, expressions and camera; faces above y = 820; nothing cut by the
   frame edge; nobody newly overlapping.

## Verify
Render ONLY through the lock (other agents render too):
`bash ../scripts/render_locked.sh still Episode04 ../check_ep04_plate/<you>/f_N.png --frame=N`
and for a short clip `bash ../scripts/render_locked.sh render Episode04 ../check_ep04_plate/<you>/clip.mp4 --frames=A-B --codec=h264`.
Scene starts are in `src\episode04\timing.ts`. Render every shot with Balak and every pause in your scene, make a
contact sheet, face crops beside plate 01, look at them. Type-check:
`NODE_OPTIONS=--max-old-space-size=4096 node node_modules/typescript/bin/tsc --noEmit` (ignore `src/param_bismoy_ep01`).
Report: what changed (scale, positions), still paths (contact sheet first), anything off.
