"""Cartesia Sonic TTS generator for Balak Thakur AI Studio episodes (requires CARTESIA_API_KEY)."""

import argparse
import json
import os
import re
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CARTESIA_ENDPOINT = "https://api.cartesia.ai/tts/bytes"


def parse_script_blocks(md_path: Path) -> list[dict]:
    text = md_path.read_text(encoding="utf-8")
    blocks = re.split(r"^##\s+", text, flags=re.MULTILINE)
    out: list[dict] = []
    for blk in blocks:
        m_wav = re.search(r"\*\*Save As:\*\*\s*`([^`]+)`", blk)
        m_spk = re.search(r"\*\*Speaker:\*\*\s*`([^`]+)`", blk)
        if not m_wav:
            continue
        quotes = re.findall(r"^>\s*(.+)$", blk, flags=re.MULTILINE)
        clean = " ".join(q.strip() for q in quotes)
        clean = re.sub(r"<short pause>", " ... ", clean)
        clean = re.sub(r"</?(laugh|whisper)>", "", clean).strip()
        out.append({
            "wav": m_wav.group(1).strip(),
            "speaker": m_spk.group(1).strip() if m_spk else "01_Narrator_Kathak",
            "text": clean,
        })
    return out


def synthesize_cartesia(episode_name: str, voice_id: str, model_id: str = "sonic-2") -> None:
    api_key = os.environ.get("CARTESIA_API_KEY")
    if not api_key:
        raise SystemExit(
            "CARTESIA_API_KEY is not set. Set CARTESIA_API_KEY in your environment to synthesize via Cartesia."
        )

    ep_dir = ROOT / "03_Episodes" / episode_name
    sb_dir = ep_dir / "01_Script_and_Storyboard"
    script_md = next(sb_dir.glob("*Voice_Script*.md"))
    out_dir = ep_dir / "02_Audio" / "Voice_WAVs"
    out_dir.mkdir(parents=True, exist_ok=True)

    for blk in parse_script_blocks(script_md):
        payload = json.dumps({
            "model_id": model_id,
            "transcript": blk["text"],
            "voice": {"mode": "id", "id": voice_id},
            "output_format": {
                "container": "wav",
                "encoding": "pcm_s16le",
                "sample_rate": 48000,
            },
            "language": "bn",
        }).encode("utf-8")

        req = urllib.request.Request(
            CARTESIA_ENDPOINT,
            data=payload,
            headers={
                "X-API-Key": api_key,
                "Cartesia-Version": "2024-06-10",
                "Content-Type": "application/json",
            },
            method="POST",
        )
        with urllib.request.urlopen(req) as resp:
            (out_dir / blk["wav"]).write_bytes(resp.read())
        print(f"Cartesia TTS -> {blk['wav']}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--episode", required=True)
    parser.add_argument("--voice-id", required=True, help="Cartesia Voice UUID")
    parser.add_argument("--model-id", default="sonic-2")
    args = parser.parse_args()
    synthesize_cartesia(args.episode, args.voice_id, args.model_id)
