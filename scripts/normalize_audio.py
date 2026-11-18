"""Normalize episode Voice_WAVs to 48kHz -16 LUFS and extract 24fps lip-sync RMS envelopes."""

import argparse
import json
import subprocess
import wave
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent


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


def normalize_episode_audio(episode_name: str, target_lufs: float = -16.0) -> None:
    ep_dir = ROOT / "03_Episodes" / episode_name
    wav_dir = ep_dir / "02_Audio" / "Voice_WAVs"
    norm_dir = wav_dir / "Normalized_48k"
    norm_dir.mkdir(parents=True, exist_ok=True)

    wavs = sorted(p for p in wav_dir.glob("*.wav") if p.is_file())
    if not wavs:
        print(f"No .wav files found in {wav_dir}")
        return

    durations: dict[str, dict] = {}
    for wav in wavs:
        out_wav = norm_dir / wav.name
        cmd = [
            "ffmpeg", "-y", "-i", str(wav),
            "-af", f"silenceremove=start_periods=1:start_silence=0.1:start_threshold=-50dB,loudnorm=I={target_lufs}:TP=-1.5:LRA=11",
            "-ar", "48000", "-ac", "1", "-c:a", "pcm_s16le",
            str(out_wav),
        ]
        subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        dur, env = compute_rms_envelope(out_wav)
        durations[wav.name] = {"duration_sec": dur, "fps": 24, "rms_envelope": env}
        print(f"Normalized {wav.name} -> {dur:.2f}s ({len(env)} frames)")

    meta_path = wav_dir / "audio_durations.json"
    meta_path.write_text(json.dumps(durations, indent=2), encoding="utf-8")
    print(f"Saved {meta_path}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--episode", required=True, help="Episode folder name, e.g. Episode_01_Kali_Puja_Birth")
    args = parser.parse_args()
    normalize_episode_audio(args.episode)
