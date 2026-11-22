#!/usr/bin/env python3
"""
Ghibli Ep03 Asset Prep Pipeline (Phase 1B + Director Polish Pass).

Processes raw generated illustrations from:
  remotion_studio/public/images/ghibli_ep03/raw/
into production-ready transparent PNG cutouts, 4K+ stitched panoramas,
procedural watercolor paper grain, TypeScript anchor metadata, and an
alignment preview composite:
  remotion_studio/public/images/ghibli_ep03/
  remotion_studio/src/ghibli_pipeline/episode03/plateAnchors.ts

NEVER uses global white-keying (which would destroy white shiuli blossoms
and cream architectural highlights). Uses edge-connected BFS flood-fill alpha
extraction + morphological choke + distance-feathered edge decontamination.

Usage:
  python prepare_ghibli_plates.py --paper-only
  python prepare_ghibli_plates.py
"""

from __future__ import annotations

import argparse
from collections import deque
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageOps

SCRIPT_DIR = Path(__file__).resolve().parent
PROD_ROOT = SCRIPT_DIR.parent.parent
IMG_DIR = PROD_ROOT / "remotion_studio" / "public" / "images" / "ghibli_ep03"
RAW_DIR = IMG_DIR / "raw"
ANCHORS_TS = PROD_ROOT / "remotion_studio" / "src" / "ghibli_pipeline" / "episode03" / "plateAnchors.ts"
QA_DIR = Path(
    r"C:\Dipankar\Balak_Thakur_AI_Studio\03_Episodes\Episode_03_Five_Year_Old_Wisdom\04_Video_Assembly\Ghibli_Test_Render"
)


# ---------------------------------------------------------------------------
# Procedural Cold-Press Watercolor Paper Grain
# ---------------------------------------------------------------------------

def _blur_noise_l(arr: np.ndarray, radius: float) -> np.ndarray:
    u8 = np.clip(128.0 + arr * 32.0, 0, 255).astype(np.uint8)
    blurred = Image.fromarray(u8, mode="L").filter(ImageFilter.GaussianBlur(radius=radius))
    return (np.asarray(blurred, dtype=np.float32) - 128.0) / 32.0


def generate_paper_grain(out_path: Path, width: int = 1920, height: int = 1080) -> None:
    """Create a subtle warm cold-press paper texture for multiply compositing."""
    rng = np.random.default_rng(4203)

    fine = rng.normal(0.0, 1.0, (height, width)).astype(np.float32)
    med = np.clip(128.0 + rng.normal(0.0, 1.0, (height // 2, width // 2)) * 32.0, 0, 255).astype(np.uint8)
    coarse = np.clip(128.0 + rng.normal(0.0, 1.0, (height // 8, width // 8)) * 32.0, 0, 255).astype(np.uint8)

    med_img = (np.asarray(Image.fromarray(med, mode="L").resize((width, height), Image.Resampling.BILINEAR), dtype=np.float32) - 128.0) / 32.0
    coarse_img = (np.asarray(Image.fromarray(coarse, mode="L").resize((width, height), Image.Resampling.BICUBIC), dtype=np.float32) - 128.0) / 32.0

    fine_img = _blur_noise_l(fine, 0.7)
    horiz = _blur_noise_l(rng.normal(0.0, 1.0, (height, width)).astype(np.float32), 1.8)

    tooth = (
        0.48 * fine_img
        + 0.30 * med_img
        + 0.14 * coarse_img
        + 0.08 * horiz
    )
    tooth = (tooth - tooth.mean()) / (tooth.std() + 1e-6)

    base_r = np.clip(245.0 + tooth * 8.5, 212, 255).astype(np.uint8)
    base_g = np.clip(242.0 + tooth * 8.5, 208, 255).astype(np.uint8)
    base_b = np.clip(236.0 + tooth * 9.0, 200, 255).astype(np.uint8)

    rgb = np.stack([base_r, base_g, base_b], axis=-1)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(rgb, mode="RGB").save(out_path, optimize=True)
    print(f"[OK] Paper grain saved: {out_path} ({width}x{height})")


# ---------------------------------------------------------------------------
# Edge-Connected Flood-Fill Alpha Extraction & Fringe Decontamination
# ---------------------------------------------------------------------------

def extract_border_alpha(
    img: Image.Image,
    mode: str = "all_edges",
    white_min: int = 228,
    sat_max: int = 28,
    feather_px: float = 1.4,
    soft_shadow_bot_frac: float = 0.0,
    choke_light_halo: bool = False,
) -> Image.Image:
    """
    Remove ONLY outer-connected neutral bright background using BFS from borders.
    mode:
      - 'all_edges': seed from all 4 outer edges (for isolated trees/props)
      - 'top_sky': seed from top edge and upper 65% of left/right edges (for sky over buildings/trees)
    soft_shadow_bot_frac:
      - in the bottom fraction of the image, relax background threshold so neutral grey/lavender
        drop-shadow puddles outside tree brick planters dissolve cleanly.
    choke_light_halo:
      - choke 1-2px of bright paper-halo fringe directly adjacent to the outer background,
        eliminating white/paper rim lines on tree trunks during 3x-4x camera close-ups.
    """
    rgba = img.convert("RGBA")
    arr = np.asarray(rgba, dtype=np.uint8).copy()
    h, w, _ = arr.shape

    rgb = arr[:, :, :3].astype(np.int16)
    cmin = rgb.min(axis=2)
    cmax = rgb.max(axis=2)
    sat = cmax - cmin
    is_bg_cand = (cmin >= white_min) & (sat <= sat_max)

    if soft_shadow_bot_frac > 0:
        y_sh = int(h * (1.0 - soft_shadow_bot_frac))
        bot_mask = np.zeros((h, w), dtype=bool)
        bot_mask[y_sh:, :] = True
        # Absorb soft grey/lavender watercolor cast-shadow puddles on white paper outside brick rings
        is_shadow_puddle = bot_mask & (cmin >= 122) & (sat <= 48)
        is_bg_cand = is_bg_cand | is_shadow_puddle

    is_soft_cand = (cmin >= (white_min - 22)) & (sat <= (sat_max + 12))

    visited = np.zeros((h, w), dtype=bool)
    q: deque[tuple[int, int]] = deque()

    def seed(y: int, x: int) -> None:
        if 0 <= y < h and 0 <= x < w and not visited[y, x] and is_bg_cand[y, x]:
            visited[y, x] = True
            q.append((y, x))

    if mode == "all_edges":
        for x in range(w):
            seed(0, x)
            seed(h - 1, x)
        for y in range(h):
            seed(y, 0)
            seed(y, w - 1)
    elif mode == "top_sky":
        for x in range(w):
            seed(0, x)
            seed(1, x)
        max_side_y = int(h * 0.65)
        for y in range(max_side_y):
            seed(y, 0)
            seed(y, w - 1)
    else:
        raise ValueError(f"Unknown mode: {mode}")

    while q:
        cy, cx = q.popleft()
        if cy > 0 and not visited[cy - 1, cx] and is_bg_cand[cy - 1, cx]:
            visited[cy - 1, cx] = True
            q.append((cy - 1, cx))
        if cy + 1 < h and not visited[cy + 1, cx] and is_bg_cand[cy + 1, cx]:
            visited[cy + 1, cx] = True
            q.append((cy + 1, cx))
        if cx > 0 and not visited[cy, cx - 1] and is_bg_cand[cy, cx - 1]:
            visited[cy, cx - 1] = True
            q.append((cy, cx - 1))
        if cx + 1 < w and not visited[cy, cx + 1] and is_bg_cand[cy, cx + 1]:
            visited[cy, cx + 1] = True
            q.append((cy, cx + 1))

    # Optional 3-pass morphological choke of bright paper-halo pixels touching the outer background
    if choke_light_halo:
        for _ in range(3):
            adj_bg = np.zeros((h, w), dtype=bool)
            adj_bg[1:, :] |= visited[:-1, :]
            adj_bg[:-1, :] |= visited[1:, :]
            adj_bg[:, 1:] |= visited[:, :-1]
            adj_bg[:, :-1] |= visited[:, 1:]
            halo = (~visited) & adj_bg & (cmin >= 155) & (sat <= 52)
            if not np.any(halo):
                break
            visited = visited | halo

    fg = ~visited
    alpha = np.where(fg, 255.0, 0.0).astype(np.float32)

    if feather_px > 0:
        alpha_img = Image.fromarray(alpha.astype(np.uint8), mode="L").filter(
            ImageFilter.GaussianBlur(radius=feather_px)
        )
        blurred = np.asarray(alpha_img, dtype=np.float32)
        alpha = np.where(fg & (blurred < 254.0), np.clip(blurred * 1.08, 0, 255), alpha)
        alpha = np.where((~fg) & is_soft_cand & (blurred > 16.0), np.clip(blurred * 0.42, 0, 150), alpha)

    # Strong Fringe RGB decontamination: replace semi-transparent or bright-halo boundary RGB
    # with interior dark ink/bark/leaf RGB (5 dilation steps from deep interior alpha >= 248)
    luma = 0.299 * rgb[:, :, 0] + 0.587 * rgb[:, :, 1] + 0.114 * rgb[:, :, 2]
    fringe_mask = (alpha > 0) & ((alpha < 248) | (choke_light_halo & (alpha < 255) & (luma > 185)))
    if np.any(fringe_mask):
        opaque_mask = (alpha >= 248) & (~(choke_light_halo & (luma > 205) & (sat < 30)))
        clean_rgb = arr[:, :, :3].astype(np.float32)
        valid = opaque_mask.copy()
        for _ in range(5):
            if np.all(valid | ~fringe_mask):
                break
            sum_rgb = np.zeros_like(clean_rgb)
            cnt = np.zeros((h, w), dtype=np.float32)
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    if dy == 0 and dx == 0:
                        continue
                    ys = slice(max(0, dy), h + min(0, dy))
                    xs = slice(max(0, dx), w + min(0, dx))
                    yt = slice(max(0, -dy), h - max(0, dy))
                    xt = slice(max(0, -dx), w - max(0, dx))
                    v = valid[ys, xs]
                    sum_rgb[yt, xt] += clean_rgb[ys, xs] * v[:, :, None]
                    cnt[yt, xt] += v.astype(np.float32)
            fill = (~valid) & (cnt > 0)
            clean_rgb[fill] = sum_rgb[fill] / cnt[fill, None]
            valid = valid | fill

        arr[:, :, :3] = np.where(fringe_mask[:, :, None], np.clip(clean_rgb, 0, 255).astype(np.uint8), arr[:, :, :3])

    arr[:, :, 3] = np.clip(alpha, 0, 255).astype(np.uint8)
    return Image.fromarray(arr, mode="RGBA")


def remove_enclosed_holes(
    img: Image.Image,
    min_area: int,
    max_y_frac: float = 0.85,
    white_min: int = 236,
    sat_max: int = 16,
) -> Image.Image:
    """Punch out trapped pure-white background holes inside closed branches or basket handles, plus 1px halo ring."""
    arr = np.asarray(img.convert("RGBA"), dtype=np.uint8).copy()
    h, w = arr.shape[:2]
    y_lim = int(h * max_y_frac)
    rgb = arr[:y_lim, :, :3].astype(np.int16)
    opaque = arr[:y_lim, :, 3] > 180
    cmin = rgb.min(axis=2)
    sat = rgb.max(axis=2) - cmin
    cand = opaque & (cmin >= white_min) & (sat <= sat_max)

    vis = np.zeros((y_lim, w), dtype=bool)
    punch = np.zeros((h, w), dtype=bool)
    ys, xs = np.where(cand)
    for sy, sx in zip(ys, xs):
        if vis[sy, sx]:
            continue
        q = deque([(sy, sx)])
        vis[sy, sx] = True
        pixels = []
        while q:
            cy, cx = q.popleft()
            pixels.append((cy, cx))
            if cy > 0 and not vis[cy - 1, cx] and cand[cy - 1, cx]:
                vis[cy - 1, cx] = True
                q.append((cy - 1, cx))
            if cy + 1 < y_lim and not vis[cy + 1, cx] and cand[cy + 1, cx]:
                vis[cy + 1, cx] = True
                q.append((cy + 1, cx))
            if cx > 0 and not vis[cy, cx - 1] and cand[cy, cx - 1]:
                vis[cy, cx - 1] = True
                q.append((cy, cx - 1))
            if cx + 1 < w and not vis[cy, cx + 1] and cand[cy, cx + 1]:
                vis[cy, cx + 1] = True
                q.append((cy, cx + 1))
        if len(pixels) >= min_area:
            for py, px in pixels:
                punch[py, px] = True

    if np.any(punch):
        # Expand punched hole by 2px into bright anti-aliased paper rim inside branch forks
        for _ in range(2):
            adj = np.zeros((h, w), dtype=bool)
            adj[1:, :] |= punch[:-1, :]
            adj[:-1, :] |= punch[1:, :]
            adj[:, 1:] |= punch[:, :-1]
            adj[:, :-1] |= punch[:, 1:]
            full_rgb = arr[:, :, :3].astype(np.int16)
            rim = adj & (~punch) & (full_rgb.min(axis=2) >= 165) & ((full_rgb.max(axis=2) - full_rgb.min(axis=2)) <= 50)
            if not np.any(rim):
                break
            punch = punch | rim

        new_alpha = np.where(punch, 0, arr[:, :, 3]).astype(np.uint8)
        blurred = np.asarray(Image.fromarray(new_alpha, mode="L").filter(ImageFilter.GaussianBlur(radius=0.9)))
        arr[:, :, 3] = np.where(punch | (new_alpha < 250), np.minimum(new_alpha, blurred), new_alpha)
    return Image.fromarray(arr, mode="RGBA")


def trim_rgba(img: Image.Image, pad: int = 12, alpha_thresh: int = 8) -> Image.Image:
    """Trim transparent borders cleanly with `pad` pixel margin."""
    arr = np.asarray(img)
    ys, xs = np.where(arr[:, :, 3] > alpha_thresh)
    if len(xs) == 0 or len(ys) == 0:
        return img
    h, w = arr.shape[:2]
    x0 = max(0, int(xs.min()) - pad)
    y0 = max(0, int(ys.min()) - pad)
    x1 = min(w, int(xs.max()) + 1 + pad)
    y1 = min(h, int(ys.max()) + 1 + pad)
    return img.crop((x0, y0, x1, y1))


def resize_sharp(img: Image.Image, size: tuple[int, int], sharpen: bool = True) -> Image.Image:
    out = img.resize(size, Image.Resampling.LANCZOS)
    if sharpen:
        out = out.filter(ImageFilter.UnsharpMask(radius=0.9, percent=40, threshold=3))
    return out


# ---------------------------------------------------------------------------
# Specialized Processors
# ---------------------------------------------------------------------------

def process_courtyard_back(raw_path: Path, out_path: Path) -> None:
    """
    Process straight-on orthogonal veranda panel into 5040x1320 RGBA panorama.
    Crops horizontally through the exact centerlines of the outer fluted columns
    and lowest step line, and alternates mirrored tiles with a narrow 22px cosine
    blend along the symmetric column centerline so no double-arch seam ever appears.
    """
    src = Image.open(raw_path).convert("RGBA")
    rgba = extract_border_alpha(src, mode="top_sky", white_min=226, sat_max=28, feather_px=1.2)
    arr = np.asarray(rgba)
    h, w = arr.shape[:2]

    row_cov = (arr[:, :, 3] > 32).mean(axis=1)
    ys = np.where(row_cov > 0.08)[0]
    top_y = max(0, int(ys.min()) - int(h * 0.04)) if len(ys) else 0
    bot_y = int(h * 0.956)

    # Exact column centerlines on left & right ends
    x0 = int(w * 0.119)
    x1 = int(w * 0.876)
    cropped = rgba.crop((x0, top_y, x1, bot_y))

    target_h = 1320
    target_w = 5040
    panel_w = max(800, round(cropped.width * (target_h / cropped.height)))
    panel = resize_sharp(cropped, (panel_w, target_h), sharpen=True)
    core = np.asarray(panel, dtype=np.float32)
    cw = core.shape[1]

    overlap = 22
    step = cw - overlap
    canvas = np.zeros((target_h, target_w, 4), dtype=np.float32)
    weight_sum = np.zeros((target_h, target_w, 1), dtype=np.float32)

    center_x0 = (target_w - cw) // 2
    offsets: list[tuple[int, int]] = []
    k = 0
    while center_x0 + k * step > -cw:
        k -= 1
    while center_x0 + k * step < target_w:
        offsets.append((k, center_x0 + k * step))
        k += 1

    win_1d = np.ones((cw,), dtype=np.float32)
    ramp = 0.5 * (1.0 - np.cos(np.pi * np.linspace(0.0, 1.0, overlap, dtype=np.float32)))
    win_1d[:overlap] = ramp
    win_1d[-overlap:] = ramp[::-1]
    win_2d = win_1d[None, :, None]

    for tile_k, ox in offsets:
        tile = core if (tile_k % 2 == 0) else np.flip(core, axis=1)
        x_dst0 = max(0, ox)
        x_dst1 = min(target_w, ox + cw)
        if x_dst1 <= x_dst0:
            continue
        x_src0 = x_dst0 - ox
        x_src1 = x_dst1 - ox
        w_slice = win_2d[:, x_src0:x_src1, :]
        canvas[:, x_dst0:x_dst1, :] += tile[:, x_src0:x_src1, :] * w_slice
        weight_sum[:, x_dst0:x_dst1, :] += w_slice

    out_arr = np.clip(canvas / np.maximum(weight_sum, 1e-5), 0, 255).astype(np.uint8)
    Image.fromarray(out_arr, mode="RGBA").save(out_path, optimize=True)
    print(f"[OK] Courtyard back panorama saved: {out_path} ({target_w}x{target_h})")


def process_courtyard_floor(raw_path: Path, out_path: Path) -> None:
    """
    Process courtyard floor into 5440x1200 RGBA panorama.
    1. Crops extra vertical band so the circular alpona and flagstones are foreshortened
       flatter in perspective.
    2. Feathers the top 36px (18 stage px) alpha from 0 -> 255 with a warm sandstone step
       shadow tint so the horizon seam at y=784 melts into the veranda steps during parallax.
    """
    raw = Image.open(raw_path).convert("RGB")
    rw, rh = raw.size
    # Crop deeper from the top (18%) so the central alpona lies lower and flatter in perspective
    src = raw.crop((int(rw * 0.05), int(rh * 0.18), int(rw * 0.95), int(rh * 0.94)))

    target_h = 1200  # 2 * 600 stage height
    target_w = 5440  # 2 * 2720 stage width

    # Increase horizontal stretch slightly (1.22x) to foreshorten the circular alpona into a ground ellipse
    base_w = round(src.width * (target_h / src.height) * 1.22)
    core = np.asarray(resize_sharp(src, (base_w, target_h), sharpen=True), dtype=np.float32)
    cw = core.shape[1]

    canvas = np.zeros((target_h, target_w, 3), dtype=np.float32)
    cx0 = (target_w - cw) // 2
    canvas[:, cx0 : cx0 + cw, :] = core

    wing_w = min(int(cw * 0.38), cx0 + 160)
    overlap = min(140, wing_w // 2)
    ramp = 0.5 * (1.0 - np.cos(np.pi * np.linspace(0.0, 1.0, overlap, dtype=np.float32)))

    left_band = np.flip(core[:, :wing_w, :], axis=1)
    lx = cx0
    while lx > 0:
        seg_w = min(wing_w, lx + overlap)
        src_seg = left_band[:, wing_w - seg_w :, :]
        dst0 = lx + overlap - seg_w
        dst1 = lx + overlap
        blend = np.ones((1, seg_w, 1), dtype=np.float32)
        if seg_w >= overlap:
            blend[0, -overlap:, 0] = 1.0 - ramp
        exist_mask = np.arange(dst0, dst1) >= lx
        alpha_w = np.where(exist_mask[None, :, None], blend, 1.0)
        canvas[:, dst0:dst1, :] = canvas[:, dst0:dst1, :] * (1.0 - alpha_w) + src_seg * alpha_w
        lx = dst0
        left_band = np.flip(left_band, axis=1)

    right_band = np.flip(core[:, cw - wing_w :, :], axis=1)
    rx = cx0 + cw
    while rx < target_w:
        seg_w = min(wing_w, target_w - rx + overlap)
        src_seg = right_band[:, :seg_w, :]
        dst0 = rx - overlap
        dst1 = rx - overlap + seg_w
        blend = np.ones((1, seg_w, 1), dtype=np.float32)
        if seg_w >= overlap:
            blend[0, :overlap, 0] = ramp
        exist_mask = np.arange(dst0, dst1) < rx
        alpha_w = np.where(exist_mask[None, :, None], blend, 1.0)
        canvas[:, dst0:dst1, :] = canvas[:, dst0:dst1, :] * (1.0 - alpha_w) + src_seg * alpha_w
        rx = dst1
        right_band = np.flip(right_band, axis=1)

    # Top edge step-shadow shading + smooth 36px alpha feather so y=784 horizon seam is invisible
    rgba = np.zeros((target_h, target_w, 4), dtype=np.uint8)
    shade_h = 64
    shade_t = np.linspace(0.0, 1.0, shade_h, dtype=np.float32)[:, None, None]
    shade_mul = 0.84 + 0.16 * (0.5 * (1.0 - np.cos(np.pi * shade_t)))
    canvas[:shade_h, :, :] *= shade_mul

    rgba[:, :, :3] = np.clip(canvas, 0, 255).astype(np.uint8)
    alpha = np.full((target_h, target_w), 255.0, dtype=np.float32)
    feather_h = 34
    a_ramp = 0.5 * (1.0 - np.cos(np.pi * np.linspace(0.0, 1.0, feather_h, dtype=np.float32)))
    alpha[:feather_h, :] = (a_ramp * 255.0)[:, None]
    rgba[:, :, 3] = np.clip(alpha, 0, 255).astype(np.uint8)

    Image.fromarray(rgba, mode="RGBA").save(out_path, optimize=True)
    print(f"[OK] Courtyard floor RGBA panorama saved: {out_path} ({target_w}x{target_h})")


def process_far_trees(raw_path: Path, out_path: Path) -> None:
    """Extract transparent sky from far_trees_sketch, trim bottom-right watermark edge, extend to 3200x360."""
    raw = Image.open(raw_path).convert("RGBA")
    rw, rh = raw.size
    src = raw.crop((0, 0, int(rw * 0.945), int(rh * 0.945)))
    rgba = extract_border_alpha(src, mode="top_sky", white_min=228, sat_max=26, feather_px=1.5)
    arr = np.asarray(rgba)
    row_cov = (arr[:, :, 3] > 24).mean(axis=1)
    ys = np.where(row_cov > 0.05)[0]
    top_y = max(0, int(ys.min()) - 18) if len(ys) else 0
    cropped = rgba.crop((0, top_y, arr.shape[1], arr.shape[0]))

    target_w, target_h = 3200, 360
    tile_w = max(640, round(cropped.width * (target_h / cropped.height)))
    tile = np.asarray(resize_sharp(cropped, (tile_w, target_h), sharpen=False), dtype=np.float32)

    overlap = min(140, tile_w // 5)
    step = tile_w - overlap
    canvas = np.zeros((target_h, target_w, 4), dtype=np.float32)
    wsum = np.zeros((target_h, target_w, 1), dtype=np.float32)

    win = np.ones((tile_w,), dtype=np.float32)
    ramp = 0.5 * (1.0 - np.cos(np.pi * np.linspace(0.0, 1.0, overlap, dtype=np.float32)))
    win[:overlap] = ramp
    win[-overlap:] = ramp[::-1]
    win_2d = win[None, :, None]

    idx = 0
    x = 0
    while x < target_w:
        t_cur = tile if idx % 2 == 0 else np.flip(tile, axis=1)
        dst1 = min(target_w, x + tile_w)
        sw = dst1 - x
        canvas[:, x:dst1, :] += t_cur[:, :sw, :] * win_2d[:, :sw, :]
        wsum[:, x:dst1, :] += win_2d[:, :sw, :]
        x += step
        idx += 1

    out_arr = np.clip(canvas / np.maximum(wsum, 1e-5), 0, 255).astype(np.uint8)
    Image.fromarray(out_arr, mode="RGBA").save(out_path, optimize=True)
    print(f"[OK] Far trees panorama saved: {out_path} ({target_w}x{target_h})")


def process_cutout(
    raw_path: Path,
    out_path: Path,
    target_height: int,
    soft_shadow_bot_frac: float = 0.0,
    hole_min_area: int = 0,
    hole_max_y_frac: float = 0.82,
    choke_light_halo: bool = False,
) -> tuple[int, int, float, float]:
    """Extract cutout alpha, remove enclosed sky pockets if requested, trim cleanly, scale to target_height."""
    src = Image.open(raw_path).convert("RGBA")
    rgba = extract_border_alpha(
        src,
        mode="all_edges",
        white_min=228,
        sat_max=28,
        feather_px=1.2,
        soft_shadow_bot_frac=soft_shadow_bot_frac,
        choke_light_halo=choke_light_halo,
    )
    if hole_min_area > 0:
        rgba = remove_enclosed_holes(rgba, min_area=hole_min_area, max_y_frac=hole_max_y_frac)
    trimmed = trim_rgba(rgba, pad=12)
    w = max(64, round(trimmed.width * (target_height / trimmed.height)))
    final = resize_sharp(trimmed, (w, target_height), sharpen=True)
    final.save(out_path, optimize=True)

    arr = np.asarray(final)
    bot_slice = arr[int(target_height * 0.86) :, :, 3] > 60
    ys_b, xs_b = np.where(bot_slice)
    ax = float(xs_b.mean() / w) if len(xs_b) else 0.5
    ys_all = np.where(arr[:, :, 3] > 60)[0]
    ay = float((ys_all.max() + 1) / target_height) if len(ys_all) else 0.98
    print(f"[OK] Cutout saved: {out_path} ({w}x{target_height}, anchor=({ax:.3f}, {ay:.3f}))")
    return w, target_height, ax, ay


def slice_props_sheet(raw_path: Path, out_dir: Path) -> dict[str, tuple[int, int, float, float]]:
    """Split 2x2 props_sheet_ep03.png cleanly along center gutters and extract alpha for each prop."""
    src = Image.open(raw_path).convert("RGBA")
    arr = np.asarray(src)
    h, w = arr.shape[:2]

    rgb = arr[:, :, :3].astype(np.int16)
    non_white = ((rgb.min(axis=2) < 235) | ((rgb.max(axis=2) - rgb.min(axis=2)) > 20)).astype(np.float32)

    y_lo, y_hi = int(h * 0.40), int(h * 0.60)
    x_lo, x_hi = int(w * 0.40), int(w * 0.60)
    split_y = y_lo + int(np.argmin(non_white[y_lo:y_hi, :].sum(axis=1)))
    split_x = x_lo + int(np.argmin(non_white[:, x_lo:x_hi].sum(axis=0)))

    specs = [
        ("prop_ground_saji_a", (0, 0, split_x, split_y), 768),
        ("prop_ground_saji_b", (split_x, 0, w, split_y), 768),
        ("prop_dala_basket", (0, split_y, split_x, h), 960),
        ("prop_pidi_sketch", (split_x, split_y, w, h), 768),
    ]
    results: dict[str, tuple[int, int, float, float]] = {}
    for name, box, target_h in specs:
        crop = src.crop(box)
        rgba = extract_border_alpha(
            crop,
            mode="all_edges",
            white_min=228,
            sat_max=28,
            feather_px=1.1,
            soft_shadow_bot_frac=0.14,
            choke_light_halo=True,
        )
        if name in ("prop_ground_saji_a", "prop_ground_saji_b"):
            rgba = remove_enclosed_holes(rgba, min_area=160, max_y_frac=0.46, white_min=234, sat_max=18)
        trimmed = trim_rgba(rgba, pad=12)
        tw = max(64, round(trimmed.width * (target_h / trimmed.height)))
        final = resize_sharp(trimmed, (tw, target_h), sharpen=True)
        out_path = out_dir / f"{name}.png"
        final.save(out_path, optimize=True)

        f_arr = np.asarray(final)
        ys_all, xs_all = np.where(f_arr[:, :, 3] > 60)
        ax = float(xs_all.mean() / tw) if len(xs_all) else 0.5
        ay = float((ys_all.max() + 1) / target_h) if len(ys_all) else 0.96
        results[name] = (tw, target_h, ax, ay)
        print(f"[OK] Prop '{name}' sliced & saved: {out_path} ({tw}x{target_h})")
    return results


def process_full_plate(raw_path: Path, out_path: Path, width: int = 2560, height: int = 1440) -> None:
    raw = Image.open(raw_path).convert("RGB")
    rw, rh = raw.size
    src = raw.crop((0, 0, int(rw * 0.915), int(rh * 0.915)))
    fitted = ImageOps.fit(src, (width, height), method=Image.Resampling.LANCZOS)
    fitted = fitted.filter(ImageFilter.UnsharpMask(radius=0.8, percent=35, threshold=3))
    fitted.save(out_path, optimize=True)
    print(f"[OK] Full plate saved: {out_path} ({width}x{height})")


def write_anchors_ts(meta: dict[str, tuple[int, int, float, float]]) -> None:
    """Write plateAnchors.ts with measured pixel dimensions and anchor fractions."""
    def fmt(name: str) -> str:
        w, h, ax, ay = meta[name]
        return f"  {name}: {{ width: {w}, height: {h}, anchorX: {ax:.4f}, anchorY: {ay:.4f} }},"

    lines = [
        "// AUTO-GENERATED by scripts/ghibli_pipeline/prepare_ghibli_plates.py (defaults safe before asset run).",
        "export interface CutoutAnchor {",
        "  width: number;",
        "  height: number;",
        "  anchorX: number;",
        "  anchorY: number;",
        "}",
        "",
        "export const GHIBLI_ANCHORS: Record<string, CutoutAnchor> = {",
        fmt("tree_shiuli_sketch"),
        fmt("tree_jhumko_sketch"),
        fmt("tree_jaba_sketch"),
        fmt("tulsi_mancha_sketch"),
        fmt("prop_ground_saji_a"),
        fmt("prop_ground_saji_b"),
        fmt("prop_dala_basket"),
        fmt("prop_pidi_sketch"),
        "};",
        "",
    ]
    ANCHORS_TS.parent.mkdir(parents=True, exist_ok=True)
    ANCHORS_TS.write_text("\n".join(lines), encoding="utf-8")
    print(f"[OK] Wrote anchors metadata: {ANCHORS_TS}")


def build_alignment_preview(meta: dict[str, tuple[int, int, float, float]]) -> None:
    """Render 1920x1080 Stage-exact diagnostic composite with coordinate crosshairs."""
    canvas = Image.new("RGBA", (1920, 1080), (233, 210, 168, 255))

    sky = Image.open(IMG_DIR / "sky_morning_gold.png").convert("RGBA").resize((1920, 1080), Image.Resampling.BILINEAR)
    canvas.alpha_composite(sky)

    far = Image.open(IMG_DIR / "far_trees_sketch.png").convert("RGBA").resize((3200, 360), Image.Resampling.BILINEAR)
    canvas.alpha_composite(far, dest=(-600, -10))

    back = Image.open(IMG_DIR / "courtyard_back_sketch.png").convert("RGBA").resize((2520, 660), Image.Resampling.BILINEAR)
    canvas.alpha_composite(back, dest=(-300, 140))

    floor = Image.open(IMG_DIR / "courtyard_floor_sketch.png").convert("RGBA").resize((2720, 600), Image.Resampling.BILINEAR)
    canvas.alpha_composite(floor, dest=(-400, 784))

    def paste_anchored(file: str, x: float, y: float, target_h: float) -> None:
        im = Image.open(IMG_DIR / file).convert("RGBA")
        key = file.replace(".png", "")
        _, _, ax, ay = meta[key]
        tw = round(im.width * (target_h / im.height))
        th = round(target_h)
        im_r = im.resize((tw, th), Image.Resampling.LANCZOS)
        dx = round(x - tw * ax)
        dy = round(y - th * ay)
        canvas.alpha_composite(im_r, dest=(dx, dy))

    paste_anchored("tree_shiuli_sketch.png", 300, 872, 620)
    paste_anchored("tree_jhumko_sketch.png", 700, 868, 600)
    paste_anchored("tree_jaba_sketch.png", 1080, 866, 650)
    paste_anchored("tulsi_mancha_sketch.png", 1700, 842, 355 * 1.1)
    for sx in (1596, 1652, 1752, 1806):
        paste_anchored("prop_ground_saji_a.png", sx, 858, 68)

    draw = ImageDraw.Draw(canvas)
    draw.line([(0, 784), (1920, 784)], fill=(255, 60, 60, 220), width=2)
    draw.text((24, 764), "FLOOR SEAM y=784", fill=(255, 40, 40, 255))

    markers = [
        (1487, 858, "Balak (1487,858)"),
        (1700, 774, "Tulsi Diya Niche (1700,774)"),
        (1100, 455, "Jaba Branch Origin (1100,455)"),
        (300, 872, "Shiuli Base"),
        (700, 868, "Jhumko Base"),
        (1080, 866, "Jaba Base"),
        (960, 930, "Alpona Center (960,930)"),
        (470, 978, "Tuni"),
        (800, 980, "Rekha"),
        (1350, 982, "Mina"),
        (1230, 934, "Sarala"),
        (1562, 930, "Lata"),
    ]
    for mx, my, label in markers:
        draw.ellipse((mx - 6, my - 6, mx + 6, my + 6), outline=(0, 220, 255, 255), width=2)
        draw.text((mx + 8, my - 8), label, fill=(255, 255, 80, 255))

    QA_DIR.mkdir(parents=True, exist_ok=True)
    out_preview = QA_DIR / "qa_alignment_preview.jpg"
    canvas.convert("RGB").save(out_preview, quality=92)
    print(f"[OK] Alignment preview saved: {out_preview}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Prepare Ghibli Ep03 plates and cutouts.")
    parser.add_argument("--paper-only", action="store_true", help="Only generate procedural watercolor_paper_grain.png")
    args = parser.parse_args()

    IMG_DIR.mkdir(parents=True, exist_ok=True)
    generate_paper_grain(IMG_DIR / "watercolor_paper_grain.png")
    if args.paper_only:
        return

    expected = [
        "sky_sharad_dawn.png",
        "sky_morning_gold.png",
        "far_trees_sketch.png",
        "courtyard_back_panel.png",
        "courtyard_floor_sketch.png",
        "tree_shiuli_sketch.png",
        "tree_jhumko_sketch.png",
        "tree_jaba_sketch.png",
        "tulsi_mancha_sketch.png",
        "props_sheet_ep03.png",
        "card_intro_bg_sketch.png",
        "card_source_bg_sketch.png",
        "card_outro_padma_sketch.png",
        "glimpse_ep04_shivalinga_sketch.png",
    ]
    missing = [f for f in expected if not (RAW_DIR / f).exists()]
    if missing:
        raise FileNotFoundError(f"Missing raw image(s) in {RAW_DIR}: {missing}")

    process_full_plate(RAW_DIR / "sky_sharad_dawn.png", IMG_DIR / "sky_sharad_dawn.png")
    process_full_plate(RAW_DIR / "sky_morning_gold.png", IMG_DIR / "sky_morning_gold.png")
    process_full_plate(RAW_DIR / "card_intro_bg_sketch.png", IMG_DIR / "card_intro_bg_sketch.png")
    process_full_plate(RAW_DIR / "card_source_bg_sketch.png", IMG_DIR / "card_source_bg_sketch.png")
    process_full_plate(RAW_DIR / "card_outro_padma_sketch.png", IMG_DIR / "card_outro_padma_sketch.png")
    process_full_plate(RAW_DIR / "glimpse_ep04_shivalinga_sketch.png", IMG_DIR / "glimpse_ep04_shivalinga_sketch.png")

    process_far_trees(RAW_DIR / "far_trees_sketch.png", IMG_DIR / "far_trees_sketch.png")
    process_courtyard_back(RAW_DIR / "courtyard_back_panel.png", IMG_DIR / "courtyard_back_sketch.png")
    process_courtyard_floor(RAW_DIR / "courtyard_floor_sketch.png", IMG_DIR / "courtyard_floor_sketch.png")

    meta: dict[str, tuple[int, int, float, float]] = {}
    meta["tree_shiuli_sketch"] = process_cutout(
        RAW_DIR / "tree_shiuli_sketch.png",
        IMG_DIR / "tree_shiuli_sketch.png",
        1200,
        soft_shadow_bot_frac=0.22,
        hole_min_area=300,
        hole_max_y_frac=0.82,
        choke_light_halo=True,
    )
    meta["tree_jhumko_sketch"] = process_cutout(
        RAW_DIR / "tree_jhumko_sketch.png",
        IMG_DIR / "tree_jhumko_sketch.png",
        1200,
        soft_shadow_bot_frac=0.22,
        hole_min_area=55,
        hole_max_y_frac=0.82,
        choke_light_halo=True,
    )
    meta["tree_jaba_sketch"] = process_cutout(
        RAW_DIR / "tree_jaba_sketch.png",
        IMG_DIR / "tree_jaba_sketch.png",
        1240,
        soft_shadow_bot_frac=0.22,
        hole_min_area=55,
        hole_max_y_frac=0.82,
        choke_light_halo=True,
    )
    meta["tulsi_mancha_sketch"] = process_cutout(
        RAW_DIR / "tulsi_mancha_sketch.png",
        IMG_DIR / "tulsi_mancha_sketch.png",
        1400,
        soft_shadow_bot_frac=0.14,
        hole_min_area=55,
        hole_max_y_frac=0.46,
        choke_light_halo=True,
    )

    meta.update(slice_props_sheet(RAW_DIR / "props_sheet_ep03.png", IMG_DIR))
    write_anchors_ts(meta)
    build_alignment_preview(meta)


if __name__ == "__main__":
    main()
