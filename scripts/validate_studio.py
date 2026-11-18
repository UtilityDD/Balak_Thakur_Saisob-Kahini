"""Validate Balak Thakur AI Studio configuration, character bible, and episode manifests."""

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def load_json(path: Path) -> dict:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:
        raise ValueError(f"Invalid JSON in {path.relative_to(ROOT)}: {exc}") from exc


def validate_all() -> int:
    errors: list[str] = []
    warnings: list[str] = []

    config_path = ROOT / "00_Agent_Manifest" / "series_config.json"
    chars_path = ROOT / "01_Series_Bible" / "characters.json"

    try:
        config = load_json(config_path)
        for key in ("series_title", "video_specs", "depth_planes", "audio_specs"):
            if key not in config:
                errors.append(f"series_config.json missing '{key}'")
    except ValueError as e:
        errors.append(str(e))

    char_ids: set[str] = set()
    try:
        chars = load_json(chars_path)
        for ch in chars.get("characters", []):
            cid = ch.get("id")
            if not cid:
                errors.append("characters.json entry missing 'id'")
                continue
            char_ids.add(cid)
            if ch.get("voice_id") == "PASTE_VOICE_ID_HERE":
                warnings.append(f"Character '{cid}' still has placeholder voice_id")
    except ValueError as e:
        errors.append(str(e))

    episodes_dir = ROOT / "03_Episodes"
    for ep_dir in sorted(episodes_dir.glob("Episode_*")):
        if not ep_dir.is_dir():
            continue
        manifest_path = ep_dir / "01_Script_and_Storyboard" / "scenes_manifest.json"
        if not manifest_path.exists():
            warnings.append(f"{ep_dir.name}: missing scenes_manifest.json")
            continue
        try:
            manifest = load_json(manifest_path)
        except ValueError as e:
            errors.append(str(e))
            continue

        scenes = manifest.get("scenes", [])
        if not scenes:
            errors.append(f"{ep_dir.name}: scenes_manifest.json has no scenes")
            continue

        wav_dir = ep_dir / "02_Audio" / "Voice_WAVs"
        for sc in scenes:
            sid = sc.get("scene_id", "<unknown>")
            for cid in sc.get("characters", []):
                if char_ids and cid not in char_ids:
                    errors.append(f"{ep_dir.name}/{sid}: unknown character '{cid}'")
            for wav in sc.get("audio_files", []):
                if not (wav_dir / wav).exists():
                    warnings.append(f"{ep_dir.name}/{sid}: pending Voice WAV '{wav}'")

    print("=== Balak Thakur AI Studio Validation ===")
    print(f"Characters registered: {len(char_ids)}")
    print(f"Errors: {len(errors)} | Warnings: {len(warnings)}")
    for w in warnings:
        print(f"  [WARN] {w}")
    for err in errors:
        print(f"  [ERR]  {err}")

    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(validate_all())
