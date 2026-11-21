"""Normalize voice WAVs to the series loudness rule and extract 24fps lip-sync RMS envelopes.

Rule (docs/PIPELINE_DECISIONS.md PAU-01..04, .claude/skills/voice-loudness/SKILL.md):
  -16 LUFS integrated, -1.5 dBTP true-peak ceiling, two-pass ffmpeg loudnorm in linear mode
  (pass 1 measures, pass 2 applies the measured_* values with linear=true), 48 kHz mono 16-bit
  output, clip lengths unchanged (no silence trimming), originals backed up to _original_levels/.

Usage:
  python scripts/normalize_audio.py --episode Episode_02_Shashthi_and_GoShaap
      -> 03_Episodes/<episode>/02_Audio/Voice_WAVs/Normalized_48k/*.wav + audio_durations.json
  python scripts/normalize_audio.py --dir path/to/wavs [--in-place]
      -> <dir>/Normalized_48k/*.wav (or the WAVs in <dir> themselves with --in-place)
  Add --dry-run to only measure and print each file's integrated loudness and true peak.

Originals are copied to <wav dir>/_original_levels/ (an existing backup is never overwritten) and
every pass reads from that backup, so re-running is safe.
"""

import argparse
import json
import shutil
import subprocess
import wave
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent

TARGET_LUFS = -16.0
TARGET_TP = -1.5
TARGET_LRA = 11.0
BACKUP_DIRNAME = "_original_levels"


def compute_rms_envelope(wav_path: Path, fps: int = 24) -> tuple[float, list[float]]:
    """Return (duration_sec, normalized 0..1 RMS envelope per video frame)."""
    with wave.open(str(wav_path), "rb") as wf:
        sr = wf.getframerate()
        n_channels = wf.getnchannels()
        n_frames = wf.getnframes()
        raw = wf.readframes(n_frames)
    samples = np.frombuffer(raw, dtype=np.int16).astype(np.float32)
    if n_channels > 1:
        samples = samples.reshape(-1, n_channels).mean(axis=1)
    duration = n_frames / float(sr)
    samples /= 32768.0

    step = max(1, int(sr / fps))
    envelope: list[float] = []
    for i in range(0, len(samples), step):
        chunk = samples[i : i + step]
        rms = float(np.sqrt(np.mean(chunk * chunk))) if len(chunk) else 0.0
        envelope.append(round(min(1.0, rms * 4.0), 4))
    return round(duration, 3), envelope


def _loudnorm_json(stderr: str) -> dict:
    """Extract the JSON block loudnorm prints (print_format=json) at the end of ffmpeg's stderr."""
    start = stderr.rfind("{")
    end = stderr.rfind("}")
    if start < 0 or end < start:
        raise RuntimeError("loudnorm did not print its JSON report:\n" + stderr[-2000:])
    return json.loads(stderr[start : end + 1])


def measure(wav: Path, target_lufs: float = TARGET_LUFS) -> dict:
    """Pass 1: measure integrated loudness, true peak, LRA and threshold with loudnorm."""
    cmd = [
        "ffmpeg", "-hide_banner", "-nostats", "-i", str(wav),
        "-af", f"loudnorm=I={target_lufs}:TP={TARGET_TP}:LRA={TARGET_LRA}:print_format=json",
        "-f", "null", "-",
    ]
    res = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")
    if res.returncode != 0:
        raise RuntimeError(f"ffmpeg measure failed for {wav}:\n{res.stderr[-2000:]}")
    return _loudnorm_json(res.stderr)


def apply(src: Path, dst: Path, m: dict, target_lufs: float = TARGET_LUFS) -> dict:
    """Pass 2: apply loudnorm in linear mode with the measured values; 48 kHz mono 16-bit out."""
    af = (
        f"loudnorm=I={target_lufs}:TP={TARGET_TP}:LRA={TARGET_LRA}"
        f":measured_I={m['input_i']}:measured_TP={m['input_tp']}"
        f":measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}"
        f":offset={m['target_offset']}:linear=true:print_format=json"
    )
    cmd = [
        "ffmpeg", "-hide_banner", "-nostats", "-y", "-i", str(src),
        "-af", af,
        "-ar", "48000", "-ac", "1", "-c:a", "pcm_s16le",
        str(dst),
    ]
    res = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")
    if res.returncode != 0:
        raise RuntimeError(f"ffmpeg normalize failed for {src}:\n{res.stderr[-2000:]}")
    return _loudnorm_json(res.stderr)


def normalize_dir(
    wav_dir: Path,
    target_lufs: float = TARGET_LUFS,
    dry_run: bool = False,
    in_place: bool = False,
) -> None:
    wavs = sorted(p for p in wav_dir.glob("*.wav") if p.is_file())
    if not wavs:
        print(f"No .wav files found in {wav_dir}")
        return

    if dry_run:
        print(f"{'file':<36} {'integrated LUFS':>16} {'true peak dBTP':>15}")
        for wav in wavs:
            m = measure(wav, target_lufs)
            print(f"{wav.name:<36} {float(m['input_i']):>16.2f} {float(m['input_tp']):>15.2f}")
        return

    backup_dir = wav_dir / BACKUP_DIRNAME
    backup_dir.mkdir(parents=True, exist_ok=True)
    out_dir = wav_dir if in_place else wav_dir / "Normalized_48k"
    out_dir.mkdir(parents=True, exist_ok=True)

    durations: dict[str, dict] = {}
    for wav in wavs:
        src = backup_dir / wav.name
        if not src.exists():  # never overwrite an existing backup
            shutil.copy2(wav, src)
        out_wav = out_dir / wav.name
        m = measure(src, target_lufs)
        r = apply(src, out_wav, m, target_lufs)
        dur, env = compute_rms_envelope(out_wav)
        durations[wav.name] = {"duration_sec": dur, "fps": 24, "rms_envelope": env}
        mode = r.get("normalization_type", "?")
        flag = "" if mode == "linear" else "  (fell back to dynamic: could not reach target with gain alone)"
        print(
            f"Normalized {wav.name}: {float(m['input_i']):.2f} LUFS / {float(m['input_tp']):.2f} dBTP"
            f" -> {float(r['output_i']):.2f} LUFS / {float(r['output_tp']):.2f} dBTP"
            f" [{mode}] {dur:.3f}s ({len(env)} frames){flag}"
        )

    meta_path = wav_dir / "audio_durations.json"
    meta_path.write_text(json.dumps(durations, indent=2), encoding="utf-8")
    print(f"Saved {meta_path}")


def normalize_episode_audio(
    episode_name: str, target_lufs: float = TARGET_LUFS, dry_run: bool = False, in_place: bool = False
) -> None:
    wav_dir = ROOT / "03_Episodes" / episode_name / "02_Audio" / "Voice_WAVs"
    normalize_dir(wav_dir, target_lufs, dry_run=dry_run, in_place=in_place)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    src = parser.add_mutually_exclusive_group(required=True)
    src.add_argument("--episode", help="Episode folder name, e.g. Episode_01_Kali_Puja_Birth")
    src.add_argument("--dir", type=Path, help="Any folder of WAVs (e.g. remotion_studio/public/audio/ep03)")
    parser.add_argument("--dry-run", action="store_true",
                        help="Only measure and print each file's integrated loudness and true peak; write nothing")
    parser.add_argument("--in-place", action="store_true",
                        help="Overwrite the WAVs in the folder (originals stay in _original_levels/) "
                             "instead of writing to Normalized_48k/")
    args = parser.parse_args()
    if args.episode:
        normalize_episode_audio(args.episode, dry_run=args.dry_run, in_place=args.in_place)
    else:
        normalize_dir(args.dir.resolve(), dry_run=args.dry_run, in_place=args.in_place)
