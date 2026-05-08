import { createHash } from "node:crypto";
import { constants as fsConstants } from "node:fs";
import { copyFile, link, readdir, stat, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const VIDEO_EXTENSIONS = new Set([".mp4", ".mov", ".avi", ".mkv", ".webm", ".m4v"]);
const TIME_PATTERN = /__(\d+(?:\.\d+)?)s__(\d+(?:\.\d+)?)s$/i;

function stableId(relativePath) {
  const digest = createHash("sha1").update(relativePath, "utf8").digest("hex").slice(0, 12);
  return `chronophy_video_${digest}`;
}

function parseName(filePath) {
  const parsed = path.parse(filePath);
  let title = parsed.name;
  let clipStartSec = null;
  let clipEndSec = null;
  let clipDurationSec = null;

  const timeMatch = title.match(TIME_PATTERN);
  if (timeMatch) {
    clipStartSec = Number(timeMatch[1]);
    clipEndSec = Number(timeMatch[2]);
    clipDurationSec = Number((clipEndSec - clipStartSec).toFixed(3));
    title = title.slice(0, timeMatch.index);
  }

  let sourceVideoId = null;
  if (title.includes("#")) {
    const parts = title.split("#");
    sourceVideoId = parts.shift() || null;
    title = parts.join("#");
  } else {
    const prefix = title.match(/^[A-Za-z0-9_-]{8,}/);
    if (prefix) {
      sourceVideoId = prefix[0];
      title = title.slice(prefix[0].length);
    }
  }

  return {
    source_video_id: sourceVideoId,
    title: title.trim(),
    clip_start_sec: clipStartSec,
    clip_end_sec: clipEndSec,
    clip_duration_sec: clipDurationSec,
  };
}

async function walk(root) {
  const out = [];
  async function visit(current) {
    const entries = await readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        await visit(fullPath);
      } else if (entry.isFile() && VIDEO_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
        out.push(fullPath);
      }
    }
  }
  await visit(root);
  return out.sort((a, b) => a.localeCompare(b, "zh-Hans-CN"));
}

function parseArgs(argv) {
  const args = {
    root: path.resolve("..", "剪辑后视频"),
    base: path.resolve(".."),
    output: path.resolve("data", "video_manifest.jsonl"),
    privateMapping: path.resolve("data", "private_video_mapping.jsonl"),
    releaseDir: null,
    limit: null,
    copyMode: "none",
  };
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    const value = argv[i + 1];
    if (key === "--root") args.root = path.resolve(value);
    if (key === "--base") args.base = path.resolve(value);
    if (key === "--output") args.output = path.resolve(value);
    if (key === "--private-mapping") args.privateMapping = path.resolve(value);
    if (key === "--release-dir") args.releaseDir = path.resolve(value);
    if (key === "--limit") args.limit = Number(value);
    if (key === "--copy-mode") args.copyMode = value;
    if (key.startsWith("--")) i += 1;
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));
const files = await walk(args.root);
const selected = args.limit ? files.slice(0, args.limit) : files;
const rows = [];
const privateRows = [];

for (const [index, filePath] of selected.entries()) {
  const info = await stat(filePath);
  const relativePath = path.relative(args.base, filePath).replaceAll(path.sep, "/");
  const relativeToRoot = path.relative(args.root, filePath).split(path.sep);
  const videoId = `chronophy_${String(index + 1).padStart(6, "0")}`;
  const publicFileName = `${videoId}${path.extname(filePath).toLowerCase()}`;
  const publicPath = `videos/${publicFileName}`;
  const parsed = parseName(filePath);

  rows.push({
    id: videoId,
    video_id: videoId,
    path: publicPath,
    file_name: publicFileName,
    file_size_bytes: info.size,
    clip_start_sec: parsed.clip_start_sec,
    clip_end_sec: parsed.clip_end_sec,
    clip_duration_sec: parsed.clip_duration_sec,
    split: "unassigned",
  });

  privateRows.push({
    id: videoId,
    original_stable_id: stableId(relativePath),
    public_path: publicPath,
    original_path: relativePath,
    original_source_collection: relativeToRoot[0] || "",
    original_file_name: path.basename(filePath),
    original_source_video_id: parsed.source_video_id,
    original_title: parsed.title,
    file_size_bytes: info.size,
  });

  if (args.releaseDir) {
    const target = path.join(args.releaseDir, publicFileName);
    await mkdir(path.dirname(target), { recursive: true });
    if (args.copyMode === "hardlink") {
      try {
        await link(filePath, target);
      } catch (error) {
        if (error.code !== "EEXIST") throw error;
      }
    } else if (args.copyMode === "copy") {
      await copyFile(filePath, target, fsConstants.COPYFILE_EXCL).catch((error) => {
        if (error.code !== "EEXIST") throw error;
      });
    }
  }
}

await mkdir(path.dirname(args.output), { recursive: true });
await writeFile(args.output, rows.map((row) => JSON.stringify(row)).join("\n") + "\n", "utf8");
await mkdir(path.dirname(args.privateMapping), { recursive: true });
await writeFile(
  args.privateMapping,
  privateRows.map((row) => JSON.stringify(row)).join("\n") + "\n",
  "utf8",
);
console.log(`Wrote ${rows.length} public rows to ${args.output}`);
console.log(`Wrote ${privateRows.length} private mapping rows to ${args.privateMapping}`);
if (args.releaseDir) {
  console.log(`${args.copyMode} release files in ${args.releaseDir}`);
}
