"""Generate Bengali SRT subtitles from Episode AI Studio Voice Script and audio_durations.json."""

import argparse
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
INTER_LINE_PAUSE = 0.45


def fmt_srt_time(seconds: float) -> str:
    ms = int(round((seconds % 1.0) * 1000))
    total_s = int(seconds)
    s = total_s % 60
    m = (total_s // 60) % 60
    h = total_s // 3600
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def parse_voice_script(md_path: Path) -> dict[str, str]:
    """Map .wav filename -> clean Bengali dialogue text."""
    text = md_path.read_text(encoding="utf-8")
    blocks = re.split(r"^#{2,4}\s+", text, flags=re.MULTILINE)
    mapping: dict[str, str] = {}
    for blk in blocks:
        m_wav = re.search(r"\*\*Save As:\*\*\s*`([^`]+)`", blk)
        if not m_wav:
            continue
        wav_name = m_wav.group(1).strip()
        quotes = re.findall(r"^>\s*(.+)$", blk, flags=re.MULTILINE)
        clean = " ".join(q.strip() for q in quotes)
        clean = re.sub(r"</?(short pause|laugh|whisper)>", "", clean).strip()
        clean = re.sub(r"\s{2,}", " ", clean)
        mapping[wav_name] = clean
    return mapping


def generate_srt(episode_name: str) -> None:
    ep_dir = ROOT / "03_Episodes" / episode_name
    sb_dir = ep_dir / "01_Script_and_Storyboard"
    manifest = json.loads((sb_dir / "scenes_manifest.json").read_text(encoding="utf-8"))

    script_files = list(sb_dir.glob("*Voice_Script*.md"))
    if not script_files:
        raise FileNotFoundError(f"No Voice Script .md found in {sb_dir}")
    lines_map = parse_voice_script(script_files[0])

    dur_path = ep_dir / "02_Audio" / "Voice_WAVs" / "audio_durations.json"
    durations = json.loads(dur_path.read_text(encoding="utf-8")) if dur_path.exists() else {}

    srt_entries: list[str] = []
    cursor = 0.0
    idx = 1
    for scene in manifest.get("scenes", []):
        for wav in scene.get("audio_files", []):
            dialogue = lines_map.get(wav, "")
            # Fallback estimate (~12 Bengali chars/sec) when WAVs are not yet generated
            dur = durations.get(wav, {}).get("duration_sec") or max(2.5, round(len(dialogue) / 12.0, 2))
            if dialogue:
                srt_entries.append(
                    f"{idx}\n{fmt_srt_time(cursor)} --> {fmt_srt_time(cursor + dur)}\n{dialogue}\n"
                )
                idx += 1
            cursor += dur + INTER_LINE_PAUSE

    out_dir = ep_dir / "04_Video_Assembly" / "Subtitles_SRT"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / f"{episode_name}_bn.srt"
    out_path.write_text("\n".join(srt_entries), encoding="utf-8")
    print(f"Generated {idx - 1} subtitles -> {out_path}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--episode", required=True)
    args = parser.parse_args()
    generate_srt(args.episode)
