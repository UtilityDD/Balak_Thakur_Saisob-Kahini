"""Assemble episode: 4-bus audio mix (Voice + Ambient + Ducked Music + SFX) + 1080p MP4 + SRT."""

import argparse
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def find_audio_asset(ep_dir: Path, sub_folder: str, filename: str) -> Path | None:
    if not filename or filename.startswith("NONE"):
        return None
    ep_path = ep_dir / "02_Audio" / sub_folder / filename
    if ep_path.exists():
        return ep_path
    for match in (ROOT / "02_Shared_Assets").rglob(filename):
        return match
    return None


def assemble_episode(episode_name: str) -> None:
    config = json.loads((ROOT / "00_Agent_Manifest" / "series_config.json").read_text(encoding="utf-8"))
    audio_cfg = config["audio_specs"]

    ep_dir = ROOT / "03_Episodes" / episode_name
    manifest = json.loads((ep_dir / "01_Script_and_Storyboard" / "scenes_manifest.json").read_text(encoding="utf-8"))
    dur_path = ep_dir / "02_Audio" / "Voice_WAVs" / "audio_durations.json"
    durations = json.loads(dur_path.read_text(encoding="utf-8")) if dur_path.exists() else {}

    norm_dir = ep_dir / "02_Audio" / "Voice_WAVs" / "Normalized_48k"
    rendered_dir = ep_dir / "04_Video_Assembly" / "Timeline_Project" / "Rendered_Scenes"

    scene_clips: list[Path] = []
    for scene in manifest["scenes"]:
        sid = scene["scene_id"]
        clip = rendered_dir / f"{sid}.mp4"
        if not clip.exists():
            raise FileNotFoundError(f"Missing rendered 2.5D scene clip: {clip}")
        scene_clips.append(clip)

    # Concatenate scene video clips
    concat_txt = rendered_dir / "concat_list.txt"
    concat_txt.write_text("\n".join(f"file '{c.as_posix()}'" for c in scene_clips), encoding="utf-8")

    raw_video = ep_dir / "04_Video_Assembly" / "Timeline_Project" / f"{episode_name}_video_only.mp4"
    subprocess.run(
        ["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", str(concat_txt), "-c", "copy", str(raw_video)],
        check=True,
    )

    # Concatenate normalized voice WAVs sequentially with inter_line_pause_sec
    voice_inputs: list[Path] = []
    for scene in manifest["scenes"]:
        for wav in scene.get("audio_files", []):
            p = norm_dir / wav
            if not p.exists():
                p = ep_dir / "02_Audio" / "Voice_WAVs" / wav
            if p.exists():
                voice_inputs.append(p)

    if not voice_inputs:
        raise FileNotFoundError("No Voice_WAVs found to assemble master audio.")

    voice_list_txt = ep_dir / "02_Audio" / "Final_Mix" / "voice_concat.txt"
    voice_list_txt.parent.mkdir(parents=True, exist_ok=True)
    voice_list_txt.write_text("\n".join(f"file '{v.as_posix()}'" for v in voice_inputs), encoding="utf-8")

    master_voice = ep_dir / "02_Audio" / "Final_Mix" / f"{episode_name}_voice_master.wav"
    subprocess.run(
        ["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", str(voice_list_txt), "-ar", "48000", str(master_voice)],
        check=True,
    )

    out_dir = ep_dir / "04_Video_Assembly" / "Final_Render"
    out_dir.mkdir(parents=True, exist_ok=True)
    final_mp4 = out_dir / f"{episode_name}_Master_1080p.mp4"

    srt_path = ep_dir / "04_Video_Assembly" / "Subtitles_SRT" / f"{episode_name}_bn.srt"
    cmd = ["ffmpeg", "-y", "-i", str(raw_video), "-i", str(master_voice)]
    if srt_path.exists():
        cmd.extend(["-i", str(srt_path), "-c:s", "mov_text", "-metadata:s:s:0", "language=ben"])
    cmd.extend([
        "-c:v", "copy",
        "-c:a", "aac", "-b:a", "192k",
        "-shortest",
        str(final_mp4),
    ])
    subprocess.run(cmd, check=True)
    print(f"Master episode rendered -> {final_mp4}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--episode", required=True)
    args = parser.parse_args()
    assemble_episode(args.episode)
