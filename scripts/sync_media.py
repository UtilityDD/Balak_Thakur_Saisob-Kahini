#!/usr/bin/env python3
"""Media sync pipeline: Google Drive  ->  local cache  ->  remotion_studio/public/

Large media (character videos, voice WAVs, music, SFX) is not stored in git
(*.mp4 and public/audio/ are gitignored). The source of truth for it is a shared
Google Drive folder that mirrors the layout of remotion_studio/public/:

    <drive folder>/audio/...   ->  remotion_studio/public/audio/...
    <drive folder>/video/...   ->  remotion_studio/public/video/...
    <drive folder>/images/...  ->  remotion_studio/public/images/...

Steps
  1. download  Pull the Drive folder into the cache (default: _drive_cache/public,
               gitignored). Temp files stay inside the cache folder, so nothing is
               written to the system temp drive.
  2. mirror    Copy new or changed files from the cache into remotion_studio/public/.
               Existing files are only overwritten when size or content differs.
               Nothing is deleted unless --prune is given.
  3. check     Scan remotion_studio/src for staticFile("...") paths and list any
               that are still missing from public/.

Usage
  python scripts/sync_media.py                  # all three steps
  python scripts/sync_media.py --skip-download  # mirror + check from the existing cache
  python scripts/sync_media.py --check-only     # only report missing assets
  python scripts/sync_media.py --prune          # also delete public/ files absent on Drive
                                                #   (tracked files such as images/ and fonts/ are kept)

Config: scripts/media_sources.json  (Drive folder URL, cache dir).
Requires: pip install gdown   (only for the download step)
"""

from __future__ import annotations

import argparse
import filecmp
import json
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "remotion_studio" / "public"
SRC = ROOT / "remotion_studio" / "src"
CONFIG = Path(__file__).resolve().parent / "media_sources.json"
MEDIA_DIRS = ("audio", "video", "images")
# Local stand-ins (still-plate or card videos) awaiting the real file; one public/-relative path per line.
PLACEHOLDERS = PUBLIC / "video" / "_PLACEHOLDERS.txt"


def load_config() -> dict:
    with open(CONFIG, encoding="utf-8") as f:
        cfg = json.load(f)
    cache = Path(cfg.get("cache_dir", "_drive_cache"))
    cfg["cache_dir"] = cache if cache.is_absolute() else ROOT / cache
    return cfg


def download(cfg: dict) -> Path:
    cache: Path = cfg["cache_dir"]
    dest = cache / "public"
    tmp = cache / "tmp"
    dest.mkdir(parents=True, exist_ok=True)
    tmp.mkdir(parents=True, exist_ok=True)
    env = dict(os.environ, TMP=str(tmp), TEMP=str(tmp), TMPDIR=str(tmp))
    print(f"[download] {cfg['drive_folder_url']}\n        -> {dest}")
    cmd = [sys.executable, "-m", "gdown", "--folder", cfg["drive_folder_url"], "-O", str(dest)]
    result = subprocess.run(cmd, env=env, cwd=str(cache))
    if result.returncode != 0:
        sys.exit(
            "[download] gdown failed. Check that the Drive folder is shared as "
            "'Anyone with the link', or rerun with --skip-download."
        )
    shutil.rmtree(tmp, ignore_errors=True)
    return dest


def tracked_public_files() -> set[str]:
    try:
        out = subprocess.run(
            ["git", "ls-files", "remotion_studio/public"],
            cwd=str(ROOT), capture_output=True, text=True, check=True,
        ).stdout
    except (OSError, subprocess.CalledProcessError):
        return set()
    return {line.removeprefix("remotion_studio/public/") for line in out.splitlines() if line}


def mirror(source: Path, prune: bool) -> None:
    if not source.is_dir():
        sys.exit(f"[mirror] cache folder not found: {source} (run without --skip-download first)")
    added = updated = same = 0
    seen: set[str] = set()
    for f in sorted(source.rglob("*")):
        if not f.is_file():
            continue
        rel = f.relative_to(source).as_posix()
        seen.add(rel)
        target = PUBLIC / rel
        if target.exists():
            if target.stat().st_size == f.stat().st_size and filecmp.cmp(f, target, shallow=False):
                same += 1
                continue
            updated += 1
            print(f"[mirror] update  {rel}")
        else:
            added += 1
            print(f"[mirror] add     {rel}")
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(f, target)

    # A real file from Drive replaces any local stand-in: drop it from the placeholder list.
    if PLACEHOLDERS.is_file():
        entries = [l.strip() for l in PLACEHOLDERS.read_text(encoding="utf-8").splitlines() if l.strip()]
        kept = [e for e in entries if e not in seen]
        if len(kept) != len(entries):
            PLACEHOLDERS.write_text("".join(e + "\n" for e in kept), encoding="utf-8")
            print(f"[mirror] {len(entries) - len(kept)} placeholder(s) replaced by real media")

    removed = 0
    if prune:
        keep = tracked_public_files()
        for d in MEDIA_DIRS:
            for t in sorted((PUBLIC / d).rglob("*")) if (PUBLIC / d).is_dir() else []:
                rel = t.relative_to(PUBLIC).as_posix()
                if t.is_file() and rel not in seen and rel not in keep:
                    t.unlink()
                    removed += 1
                    print(f"[mirror] remove  {rel}")
    print(f"[mirror] {added} added, {updated} updated, {same} unchanged, {removed} removed")


STATIC_RE = re.compile(r"""staticFile\(\s*["'`]/?([^"'`$]+)["'`]\s*\)""")
# Bare file-name literals used through template paths such as `audio/s2_ep01/${a.file}`
TEMPLATE_RE = re.compile(r"""staticFile\(\s*`/?([^`$]*)\$\{""")


def check() -> int:
    referenced: set[str] = set()
    template_dirs: set[str] = set()
    for f in SRC.rglob("*.ts*"):
        text = f.read_text(encoding="utf-8", errors="ignore")
        referenced.update(STATIC_RE.findall(text))
        template_dirs.update(TEMPLATE_RE.findall(text))
    missing = sorted(p for p in referenced if not (PUBLIC / p).is_file())
    print(f"[check] {len(referenced)} literal staticFile() paths in src/, {len(missing)} missing from public/")
    for p in missing:
        print(f"[check] MISSING {p}")
    placeholders = sorted(
        l.strip() for l in PLACEHOLDERS.read_text(encoding="utf-8").splitlines() if l.strip()
    ) if PLACEHOLDERS.is_file() else []
    if placeholders:
        print(f"[check] {len(placeholders)} local stand-ins still waiting for the real file on Drive:")
        for p in placeholders:
            print(f"[check]   {p}")
    if template_dirs:
        print("[check] dynamic paths (not verified): " + ", ".join(sorted(template_dirs)))
    return 1 if missing else 0


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--skip-download", action="store_true", help="use the existing cache")
    ap.add_argument("--check-only", action="store_true", help="only report missing assets")
    ap.add_argument("--prune", action="store_true", help="delete untracked public/ media that is not on Drive")
    args = ap.parse_args()

    if not args.check_only:
        cfg = load_config()
        source = cfg["cache_dir"] / "public"
        if not args.skip_download:
            source = download(cfg)
        mirror(source, args.prune)
    sys.exit(check())


if __name__ == "__main__":
    main()
