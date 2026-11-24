"""
Generate remotion_studio/src/data/episode05Data.ts from Episode 5 scenes_manifest.json and Voice Script.
"""

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
EP_DIR = ROOT / "03_Episodes" / "Episode_05_Tortoise_and_Gentle_Cow"
MANIFEST_PATH = EP_DIR / "01_Script_and_Storyboard" / "scenes_manifest.json"
SCRIPT_PATH = EP_DIR / "01_Script_and_Storyboard" / "Episode_05_AI_Studio_Voice_Script.md"
OUT_TS = ROOT / "remotion_studio" / "src" / "data" / "episode05Data.ts"

# 1. Parse Voice Script for Bengali text and speaker mappings
script_text = SCRIPT_PATH.read_text(encoding="utf-8")
blocks = re.split(r"^#{2,4}\s+", script_text, flags=re.MULTILINE)
dialogue_map = {}
speaker_map = {}

for blk in blocks:
    m_wav = re.search(r"\*\*Save As:\*\*\s*`([^`]+)`", blk)
    if not m_wav:
        continue
    wav_name = m_wav.group(1).strip()
    
    # Speaker mapping
    m_spk = re.search(r"\*\*Speaker:\*\*\s*`?([^\n`]+)`?", blk)
    spk_raw = m_spk.group(1).strip().lower() if m_spk else "narrator"
    if "narrator" in spk_raw:
        char_id = "narrator"
    elif "thakur" in spk_raw or "child" in spk_raw or "biru" in spk_raw:
        char_id = "baby_thakur"
    elif "grumpy" in spk_raw or "hari" in spk_raw:
        char_id = "grumpy_relative"
    elif "gopal" in spk_raw or "binoy" in spk_raw:
        char_id = "gopal"
    elif "babu" in spk_raw or "surendra" in spk_raw or "muhuri" in spk_raw:
        char_id = "babukaka"
    elif "sundar" in spk_raw:
        char_id = "sundar_thakur"
    else:
        char_id = "narrator"
    speaker_map[wav_name] = char_id

    # Dialogue text
    quotes = re.findall(r"^>\s*(.+)$", blk, flags=re.MULTILINE)
    clean = " ".join(q.strip() for q in quotes)
    clean = re.sub(r"</?(short pause|laugh|whisper)>", "", clean).strip()
    clean = re.sub(r"\s{2,}", " ", clean)
    dialogue_map[wav_name] = clean

# 2. Read manifest
manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
total_frames = manifest.get("total_frames", 8240)
scenes_data = []

# Optional durations if available
dur_path = EP_DIR / "02_Audio" / "Voice_WAVs" / "audio_durations.json"
durations = json.loads(dur_path.read_text(encoding="utf-8")) if dur_path.exists() else {}

for sc in manifest.get("scenes", []):
    sc_id = sc["scene_id"]
    st_frame = sc.get("frame_start", 0)
    end_frame = sc.get("frame_end", st_frame + 240)
    dur_frames = end_frame - st_frame
    lighting = sc.get("lighting", "golden_daytime")
    ambient = sc.get("ambient_bed", "NONE")
    music = sc.get("music_cue", "NONE")
    sfx = sc.get("sfx", [])
    
    clips = []
    clip_offset = 12 # 0.5s pre-roll inside scene
    
    for wav in sc.get("audio_files", []):
        sub_bn = dialogue_map.get(wav, "")
        spk = speaker_map.get(wav, "narrator")
        dur_sec = durations.get(wav, {}).get("duration_sec") or max(2.5, round(len(sub_bn) / 11.5, 2))
        clip_frames = durations.get(wav, {}).get("rms_envelope")
        frames_count = len(clip_frames) if clip_frames else int(round(dur_sec * 24))
        rms = durations.get(wav, {}).get("rms_envelope") or [0.05, 0.25, 0.65, 0.85, 0.55, 0.25, 0.05]
        
        clips.append({
            "file": wav,
            "durationSec": dur_sec,
            "frames": frames_count,
            "rmsEnvelope": rms[:20], # sample envelope
            "speaker": spk,
            "subtitleBn": sub_bn,
            "offsetFrame": clip_offset,
        })
        clip_offset += frames_count + 14 # inter-clip pause ~0.58s
        
    scenes_data.append({
        "sceneId": sc_id,
        "startFrame": st_frame,
        "durationFrames": dur_frames,
        "lighting": lighting if lighting in [
            "bright_orange_flat", "golden_daytime", "deep_indigo_warm_diyas",
            "sacred_midnight_glow", "warm_mandap_lamps", "cool_slate_rain",
            "warm_indoor_amber", "soft_golden_dawn"
        ] else "golden_daytime",
        "ambientBed": ambient,
        "musicCue": music,
        "sfx": sfx,
        "clips": clips,
    })

ts_content = f'''import {{ SceneTiming }} from "../types/studio";

export const EPISODE_05_TOTAL_FRAMES = {total_frames};
export const EPISODE_05_SCENES: SceneTiming[] = {json.dumps(scenes_data, indent=2, ensure_ascii=False)};
'''

OUT_TS.write_text(ts_content, encoding="utf-8")
print(f"Generated {OUT_TS} with {len(scenes_data)} scenes, total {total_frames} frames.")
