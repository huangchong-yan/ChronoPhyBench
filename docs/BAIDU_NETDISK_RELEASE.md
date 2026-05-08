# Baidu Netdisk Release Checklist

Use this checklist when publishing the video data package.

## 1. Build De-identified Release Files

```bash
node scripts/build_video_manifest.mjs \
  --root ../剪辑后视频 \
  --base .. \
  --output data/video_manifest.jsonl \
  --private-mapping data/private_video_mapping.jsonl \
  --release-dir release/ChronoPhyBench-videos \
  --copy-mode hardlink
```

The release folder will contain files named like:

```text
chronophy_000001.mp4
chronophy_000002.mp4
chronophy_000003.mp4
```

## 2. Package and Upload

Compress `release/ChronoPhyBench-videos` into one or more archives and upload them to Baidu Netdisk.

Recommended archive naming:

```text
ChronoPhyBench-videos-part01.zip
ChronoPhyBench-videos-part02.zip
```

## 3. Keep Private Files Private

Do not upload:

- `data/private_video_mapping.jsonl`
- Original raw video folders
- Any archive that preserves original filenames

## 4. Update README

Replace the placeholders in the Dataset Download section:

- Baidu Netdisk link
- Extraction code
- Optional checksum file

## 5. Verify

After downloading the package into a clean folder, confirm that the public manifest paths resolve under `Eval_video/ChronoPhyBench/` and the evaluator still runs.
