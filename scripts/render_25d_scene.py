"""2.5D Multi-Plane Parallax & Eased Camera Compositor using FFmpeg."""

import argparse
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

PARALLAX_SPEEDS = {
    "L1_sky": 0.15,
    "L2_river": 0.35,
    "L3_midground": 0.65,
    "L4_stage": 1.00,
    "L5_vfx": 1.35,
}


def resolve_layer_path(ep_dir: Path, filename: str) -> Path | None:
    """Look up a layer image in episode Visuals or Shared Assets."""
    candidates = [
        ep_dir / "03_Visuals" / "Backgrounds" / filename,
        ep_dir / "03_Visuals" / "Characters" / filename,
        ep_dir / "03_Visuals" / "Generated_Scenes" / filename,
        ep_dir / "03_Visuals" / "Title_Cards" / filename,
    ]
    for c in candidates:
        if c.exists():
            return c
    shared_root = ROOT / "02_Shared_Assets"
    for match in shared_root.rglob(filename):
        return match
    return None


def render_scene_25d(
    ep_dir: Path,
    scene: dict,
    duration_sec: float,
    fps: int = 24,
    width: int = 1920,
    height: int = 1080,
) -> Path | None:
    """Composite 5 borderless RGBA layers with sine-eased 2.5D parallax motion."""
    layers_cfg = scene.get("depth_layers", {})
    found_layers: list[tuple[str, Path]] = []
    for key in ("L1_sky", "L2_river", "L3_midground", "L4_stage", "L5_vfx"):
        fname = layers_cfg.get(key)
        if fname:
            p = resolve_layer_path(ep_dir, fname)
            if p:
                found_layers.append((key, p))

    if not found_layers:
        return None

    out_dir = ep_dir / "04_Video_Assembly" / "Timeline_Project" / "Rendered_Scenes"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_mp4 = out_dir / f"{scene['scene_id']}.mp4"

    # Overscan 12% so differential parallax never exposes frame borders
    pad_w = int(width * 1.12)
    pad_h = int(height * 1.12)
    max_pan = pad_w - width

    cmd = ["ffmpeg", "-y"]
    for _, path in found_layers:
        cmd.extend(["-loop", "1", "-t", f"{duration_sec:.3f}", "-i", str(path)])

    filter_parts: list[str] = []
    for idx, (key, _) in enumerate(found_layers):
        speed = PARALLAX_SPEEDS.get(key, 1.0)
        pan_px = int(max_pan * min(1.0, speed) * 0.7)
        # Smooth sine-in-out horizontal parallax: 0.5 * (1 - cos(pi * t / D))
        x_expr = f"-{pan_px}*0.5*(1-cos(PI*t/{duration_sec:.3f}))"
        y_expr = f"-{int((pad_h - height) / 2)}"
        filter_parts.append(
            f"[{idx}:v]format=rgba,scale={pad_w}:{pad_h}:flags=lanczos[s{idx}]"
        )
        if idx == 0:
            filter_parts.append(
                f"color=c=black:s={width}x{height}:r={fps}:d={duration_sec:.3f}[base0]"
            )
            filter_parts.append(
                f"[base0][s0]overlay=x='{x_expr}':y='{y_expr}':shortest=1[c0]"
            )
        else:
            filter_parts.append(
                f"[c{idx-1}][s{idx}]overlay=x='{x_expr}':y='{y_expr}':format=auto:shortest=1[c{idx}]"
            )

    last_tag = f"c{len(found_layers) - 1}"
    filter_parts.append(f"[{last_tag}]format=yuv420p[vout]")

    cmd.extend([
        "-filter_complex", ";".join(filter_parts),
        "-map", "[vout]",
        "-r", str(fps),
        "-c:v", "libx264", "-crf", "16", "-preset", "medium",
        str(out_mp4),
    ])
    subprocess.run(cmd, check=True)
    return out_mp4


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--episode", required=True)
    parser.add_argument("--scene", required=True, help="scene_id from scenes_manifest.json")
    parser.add_argument("--duration", type=float, default=6.0)
    args = parser.parse_args()

    ep_dir = ROOT / "03_Episodes" / args.episode
    manifest = json.loads((ep_dir / "01_Script_and_Storyboard" / "scenes_manifest.json").read_text(encoding="utf-8"))
    scene = next((s for s in manifest["scenes"] if s["scene_id"] == args.scene), None)
    if not scene:
        raise SystemExit(f"Scene '{args.scene}' not found.")
    result = render_scene_25d(ep_dir, scene, args.duration)
    print(f"Rendered: {result}" if result else "No layer PNGs found for this scene yet.")
