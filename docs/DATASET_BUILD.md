# Building the Video Manifest

Your clipped videos live outside the GitHub repository in `../剪辑后视频`. The repository tracks a public JSONL manifest instead of copying all video binaries.

Run from the repository root:

```bash
node scripts/build_video_manifest.mjs \
  --root ../剪辑后视频 \
  --base .. \
  --output data/video_manifest.jsonl \
  --private-mapping data/private_video_mapping.jsonl
```

Public rows contain only release-safe names:

- `id` / `video_id`: Neutral benchmark id such as `chronophy_000001`.
- `path`: Neutral release path such as `videos/chronophy_000001.mp4`.
- `clip_start_sec`, `clip_end_sec`, `clip_duration_sec`: Parsed from filenames with `__start__end` timing.
- `file_size_bytes`: Local file size.
- `split`: Initially `unassigned`.

Private rows in `data/private_video_mapping.jsonl` preserve original paths, names, source folders, and parsed titles for internal auditing. This file is ignored by Git.

## Build the Baidu Netdisk Release Folder

Create a de-identified video folder using hard links:

```bash
node scripts/build_video_manifest.mjs \
  --root ../剪辑后视频 \
  --base .. \
  --output data/video_manifest.jsonl \
  --private-mapping data/private_video_mapping.jsonl \
  --release-dir release/ChronoPhyBench-videos \
  --copy-mode hardlink
```

Hard links avoid duplicating disk usage on the same drive. If the release folder is moved to another disk before upload, Windows will copy the actual bytes at that time.

Zip `release/ChronoPhyBench-videos` and upload the archive to Baidu Netdisk. The README contains placeholders for the final share link and extraction code.
