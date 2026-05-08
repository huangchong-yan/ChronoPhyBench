"""Build a JSONL manifest from a directory of clipped videos.

The script is intentionally conservative: it does not copy videos, rename files,
or modify the source directory. It only records stable metadata that can be used
by later annotation and release steps.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
from pathlib import Path
from typing import Any


VIDEO_EXTENSIONS = {".mp4", ".mov", ".avi", ".mkv", ".webm", ".m4v"}
TIME_PATTERN = re.compile(r"__(?P<start>\d+(?:\.\d+)?)s__(?P<end>\d+(?:\.\d+)?)s$", re.I)


def stable_id(relative_path: str) -> str:
    digest = hashlib.sha1(relative_path.encode("utf-8")).hexdigest()[:12]
    return f"chronophy_video_{digest}"


def parse_name(path: Path) -> dict[str, Any]:
    stem = path.stem
    start = None
    end = None
    title = stem

    match = TIME_PATTERN.search(stem)
    if match:
        start = float(match.group("start"))
        end = float(match.group("end"))
        title = stem[: match.start()]

    source_video_id = None
    if "#" in title:
        source_video_id, title = title.split("#", 1)
    else:
        prefix = re.match(r"^[A-Za-z0-9_-]{8,}", title)
        if prefix:
            source_video_id = prefix.group(0)
            title = title[prefix.end() :]

    return {
        "source_video_id": source_video_id,
        "title": title.strip(),
        "clip_start_sec": start,
        "clip_end_sec": end,
        "clip_duration_sec": round(end - start, 3) if start is not None and end is not None else None,
    }


def iter_videos(root: Path) -> list[Path]:
    return sorted(
        path
        for path in root.rglob("*")
        if path.is_file() and path.suffix.lower() in VIDEO_EXTENSIONS
    )


def build_manifest(root: Path, base: Path) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for path in iter_videos(root):
        relative_path = path.relative_to(base).as_posix()
        source_parts = path.relative_to(root).parts
        source_collection = source_parts[0] if source_parts else ""
        parsed = parse_name(path)
        row = {
            "id": stable_id(relative_path),
            "path": relative_path,
            "source_collection": source_collection,
            "file_name": path.name,
            "file_size_bytes": path.stat().st_size,
            **parsed,
        }
        rows.append(row)
    return rows


def main() -> None:
    parser = argparse.ArgumentParser(description="Build ChronoPhy video manifest.")
    parser.add_argument("--root", type=Path, default=Path("../剪辑后视频"), help="Video dataset root.")
    parser.add_argument("--base", type=Path, default=Path(".."), help="Base directory for relative paths.")
    parser.add_argument("--output", type=Path, default=Path("data/video_manifest.jsonl"))
    parser.add_argument("--limit", type=int, default=None, help="Optional maximum number of rows.")
    args = parser.parse_args()

    root = args.root.resolve()
    base = args.base.resolve()
    rows = build_manifest(root, base)
    if args.limit is not None:
        rows = rows[: args.limit]

    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open("w", encoding="utf-8") as handle:
        for row in rows:
            handle.write(json.dumps(row, ensure_ascii=False) + "\n")

    print(f"Wrote {len(rows)} rows to {args.output}")


if __name__ == "__main__":
    main()
