# 05_Rework

Planned rework projects that change shared assets (rigs, looks, libraries) across the series. Each project has its
own folder with a `PLAN.md` (what, why, how, phases, acceptance), and subfolders for its references, QA output and
reviews. Nothing in a project starts until the director approves its plan; decisions taken go into
`01_Series_Bible/DIRECTOR_DECISIONS.md` or `docs/PIPELINE_DECISIONS.md` as usual (CLAUDE.md, "When the director
decides something new").

| Project | Folder | Status |
|---|---|---|
| Balak painted-look library (pilot for a hand-painted, more alive character look) | [Thakur_Painted_Look_Library/](Thakur_Painted_Look_Library/PLAN.md) | Started by another session on 2026-11-23 (`src/cinematic/thakur/`), then PAUSED by the director (PROC-OWN-01) until the Episode 6 re-cut is delivered; resume on top of the healthy build (BAL-26c/d) |

## Layout of a project folder

```
<Project>/
  PLAN.md          the plan: goal, scope, rules, work list, phases, acceptance, open decisions, log
  references/      reference images and notes (director's plates, style references, measurements)
  qa/              QA sheets, turnarounds, comparison stills and test clips the project produces
  reviews/         the director's review notes per phase, dated
```
