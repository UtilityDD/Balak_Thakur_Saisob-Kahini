"""Prepare the Ghibli Episode 5 rewrite voices (STO-23): copy, level, measure.

RE-RUN (from the worktree root, Git Bash), the moment new or changed WAVs land:
    python scripts/prepare_ep05g_voices.py            # then: node scripts/build_ep05g_timing.js
    python scripts/prepare_ep05g_voices.py --force    # re-level every file even if unchanged
    python scripts/prepare_ep05g_voices.py --dry-run  # only report what is there / missing

What it does
  1. Reads the line list from remotion_studio/src/ghibli_pipeline/episode05_rewrite/lines.json (the 40 rewrite clips from the
     blueprint's section 10 plus the reused 00a_Source_Attribution.wav).
  2. For every line whose WAV exists in the director's folder
        C:/Dipankar/Balak_Thakur_AI_Studio/03_Episodes/Episode_05_Tortoise_and_Gentle_Cow/02_Audio/Voice_WAVs_Full_Rewrite/
     (or the line's own `sourcePath`, relative to the worktree root, e.g. the source card from public/audio/ep05/), it levels the
     clip to -16 LUFS integrated / -1.5 dBTP with the series' two-pass linear loudnorm (pass 1 measures, pass 2 applies the
     measured values with linear=true; 48 kHz mono 16-bit; length unchanged; same as scripts/normalize_audio.py) and writes it to
        remotion_studio/public/audio/ep05_ghibli_rewrite/<file>
     A line marked "prelevelled": true in lines.json (the reused source card) is copied unchanged. The originals are only
     read, never changed. A clip is skipped (kept as is) when the output is newer than its source and
     already measured, unless --force.
  3. Writes remotion_studio/public/audio/ep05_ghibli_rewrite/audio_durations.json in the format of
     public/audio/ep04_ghibli/audio_durations.json: {file: {duration_sec, frames (ceil at 24 fps), rms_envelope (one value per
     video frame, normalised to the clip's peak = 1, 3 decimals)}}, plus a `_report` entry (levels, missing files).
     Only files that exist are listed; the timing generator falls back to the blueprint estimate for the rest (and marks them).
  4. Prints the files that are missing (expected but not found) and any extra WAVs in the folder that lines.json does not name
     (a renamed take?). Missing files are skipped, never fatal.

Options: --src DIR (voice folder), --force, --dry-run. Needs ffmpeg on PATH and numpy.
"""

from __future__ import annotations

import argparse
import json
import math
import shutil
import subprocess
import sys
import wave
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent  # the production worktree
LINES_JSON = ROOT / "remotion_studio" / "src" / "ghibli_pipeline" / "episode05_rewrite" / "lines.json"
DST_DIR = ROOT / "remotion_studio" / "public" / "audio" / "ep05_ghibli_rewrite"
DEFAULT_SRC = Path(
    "C:/Dipankar/Balak_Thakur_AI_Studio/03_Episodes/Episode_05_Tortoise_and_Gentle_Cow/02_Audio/Voice_WAVs_Full_Rewrite"
)
FPS = 24
TARGET_LUFS = -16.0
TARGET_TP = -1.5
TARGET_LRA = 11.0


def _loudnorm_json(stderr: str) -> dict:
    start = stderr.rfind("{")
    end = stderr.rfind("}")
    if start < 0 or end < start:
        raise RuntimeError("loudnorm did not print its JSON report:\n" + stderr[-2000:])
    return json.loads(stderr[start : end + 1])


def measure(wav: Path) -> dict:
    cmd = [
        "ffmpeg", "-hide_banner", "-nostats", "-i", str(wav),
        "-af", f"loudnorm=I={TARGET_LUFS}:TP={TARGET_TP}:LRA={TARGET_LRA}:print_format=json",
        "-f", "null", "-",
    ]
    res = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")
    if res.returncode != 0:
        raise RuntimeError(f"ffmpeg measure failed for {wav}:\n{res.stderr[-2000:]}")
    return _loudnorm_json(res.stderr)


def apply(src: Path, dst: Path, m: dict) -> dict:
    af = (
        f"loudnorm=I={TARGET_LUFS}:TP={TARGET_TP}:LRA={TARGET_LRA}"
        f":measured_I={m['input_i']}:measured_TP={m['input_tp']}"
        f":measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}"
        f":offset={m['target_offset']}:linear=true:print_format=json"
    )
    tmp = dst.with_suffix(".tmp.wav")
    cmd = ["ffmpeg", "-hide_banner", "-nostats", "-y", "-i", str(src), "-af", af,
           "-ar", "48000", "-ac", "1", "-c:a", "pcm_s16le", str(tmp)]
    res = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")
    if res.returncode != 0:
        tmp.unlink(missing_ok=True)
        raise RuntimeError(f"ffmpeg normalize failed for {src}:\n{res.stderr[-2000:]}")
    tmp.replace(dst)
    return _loudnorm_json(res.stderr)


def envelope(wav_path: Path) -> tuple[float, int, list[float]]:
    """(duration s, frames = ceil(duration * 24), per-frame RMS normalised to the clip's peak, 3 decimals)."""
    with wave.open(str(wav_path), "rb") as wf:
        sr = wf.getframerate()
        ch = wf.getnchannels()
        sw = wf.getsampwidth()
        n = wf.getnframes()
        raw = wf.readframes(n)
    if sw != 2:
        raise RuntimeError(f"{wav_path.name}: expected 16-bit PCM, got {8 * sw}-bit")
    x = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0
    if ch > 1:
        x = x.reshape(-1, ch).mean(axis=1)
    dur = n / float(sr)
    frames = max(1, math.ceil(dur * FPS - 1e-6))
    vals = []
    for i in range(frames):
        a = int(round(i * sr / FPS))
        b = int(round((i + 1) * sr / FPS))
        seg = x[a:b]
        vals.append(float(np.sqrt(np.mean(seg * seg))) if len(seg) else 0.0)
    peak = max(vals) if vals else 0.0
    env = [round(v / peak, 3) if peak > 0 else 0.0 for v in vals]
    return round(dur, 3), frames, env


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("--src", type=Path, default=DEFAULT_SRC, help="folder with the director's rewrite WAVs")
    ap.add_argument("--force", action="store_true", help="re-level every clip even when the output is up to date")
    ap.add_argument("--dry-run", action="store_true", help="only report present / missing files; write nothing")
    args = ap.parse_args()

    doc = json.loads(LINES_JSON.read_text(encoding="utf-8"))
    lines = doc["lines"]
    src_dir: Path = args.src
    DST_DIR.mkdir(parents=True, exist_ok=True)
    meta_path = DST_DIR / "audio_durations.json"
    old = {}
    if meta_path.exists():
        try:
            old = json.loads(meta_path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            old = {}

    durations: dict[str, dict] = {}
    report = {"levelled": [], "kept": [], "missing": [], "extra": [], "levels": {}}
    expected = set()
    for ln in lines:
        name = ln["file"]
        expected.add(name)
        src = (ROOT / ln["sourcePath"]) if ln.get("sourcePath") else (src_dir / name)
        dst = DST_DIR / name
        if not src.exists():
            report["missing"].append(name)
            dst_note = " (a levelled copy from an earlier run is left in place but NOT listed)" if dst.exists() else ""
            print(f"  missing  {name}{dst_note}")
            continue
        if args.dry_run:
            print(f"  found    {name}  <- {src}")
            continue
        up_to_date = (
            not args.force
            and dst.exists()
            and dst.stat().st_mtime >= src.stat().st_mtime
            and name in old
            and isinstance(old[name], dict)
        )
        if up_to_date:
            durations[name] = old[name]
            report["kept"].append(name)
            lv = old.get("_report", {}).get("levels", {}).get(name)
            if lv:
                report["levels"][name] = lv
            print(f"  kept     {name}  ({old[name]['duration_sec']} s, up to date)")
            continue
        m = measure(src)
        if ln.get("prelevelled"):
            # already levelled for the series (e.g. the delivered source card): copied as is, so a second loudnorm
            # cannot fall back to dynamic mode on a clip that already sits at the true-peak ceiling
            shutil.copy2(src, dst)
            r = {"output_i": m["input_i"], "output_tp": m["input_tp"], "normalization_type": "copied (prelevelled)"}
        else:
            r = apply(src, dst, m)
        dur, frames, env = envelope(dst)
        durations[name] = {"duration_sec": dur, "frames": frames, "rms_envelope": env}
        report["levelled"].append(name)
        report["levels"][name] = {
            "in_lufs": float(m["input_i"]), "in_tp": float(m["input_tp"]),
            "out_lufs": float(r["output_i"]), "out_tp": float(r["output_tp"]), "mode": r.get("normalization_type", "?"),
        }
        flag = "" if r.get("normalization_type") in ("linear", "copied (prelevelled)") else "  (NOT linear: loudnorm fell back to dynamic)"
        print(
            f"  levelled {name}: {float(m['input_i']):.2f} LUFS / {float(m['input_tp']):.2f} dBTP -> "
            f"{float(r['output_i']):.2f} LUFS / {float(r['output_tp']):.2f} dBTP, {dur:.2f} s ({frames} f){flag}"
        )

    if src_dir.exists():
        for p in sorted(src_dir.glob("*.wav")):
            if p.name not in expected:
                report["extra"].append(p.name)
    else:
        print(f"NOTE: voice folder not found: {src_dir}")

    print(
        f"\n{len(durations) if not args.dry_run else '-'} of {len(lines)} clips ready; "
        f"{len(report['missing'])} missing; {len(report['extra'])} extra WAV(s) in the folder not named in lines.json"
    )
    if report["missing"]:
        print("MISSING (the timing generator uses the blueprint estimates for these):")
        for n in report["missing"]:
            print("   -", n)
    if report["extra"]:
        print("EXTRA (not in lines.json: rename the take or add the line):")
        for n in report["extra"]:
            print("   -", n)
    if args.dry_run:
        return 0

    out = {k: durations[k] for k in [ln["file"] for ln in lines] if k in durations}
    out["_report"] = report
    meta_path.write_text(json.dumps(out, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Saved {meta_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
