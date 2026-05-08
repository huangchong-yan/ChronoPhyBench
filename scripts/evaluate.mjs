import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

function parseJsonl(text) {
  return text
    .split(/\r?\n/)
    .filter((line) => line.trim())
    .map((line) => JSON.parse(line));
}

function normalizeAnswer(value) {
  if (value === null || value === undefined) return "";
  const text = String(value).trim();
  if (!text) return "";
  return text.split(/\s+/)[0].replace(/[.,;:()[\]{}]/g, "").toUpperCase();
}

function normalizeOrder(value) {
  const parts = Array.isArray(value) ? value : String(value ?? "").replaceAll(">", ",").split(/[,\s]+/);
  return parts.map(normalizeAnswer).filter(Boolean);
}

function isCorrect(item, prediction) {
  if (item.task === "frame_sorting") {
    return JSON.stringify(normalizeOrder(prediction)) === JSON.stringify(normalizeOrder(item.answer));
  }
  return normalizeAnswer(prediction) === normalizeAnswer(item.answer);
}

function parseArgs(argv) {
  const args = {
    annotations: path.resolve("data", "sample_annotations.jsonl"),
    predictions: null,
    output: null,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    const value = argv[i + 1];
    if (key === "--annotations") args.annotations = path.resolve(value);
    if (key === "--predictions") args.predictions = path.resolve(value);
    if (key === "--output") args.output = path.resolve(value);
    if (key.startsWith("--")) i += 1;
  }
  if (!args.predictions) {
    throw new Error("--predictions is required");
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));
const annotations = parseJsonl(await readFile(args.annotations, "utf8"));
const predictions = parseJsonl(await readFile(args.predictions, "utf8"));
const predById = new Map(predictions.map((row) => [row.id, row]));

let total = 0;
let correct = 0;
const byTask = new Map();

for (const item of annotations) {
  const predictionRow = predById.get(item.id) || {};
  const prediction = predictionRow.prediction ?? predictionRow.answer;
  const hit = isCorrect(item, prediction);
  total += 1;
  correct += hit ? 1 : 0;
  const task = item.task || "unknown";
  const counts = byTask.get(task) || { total: 0, correct: 0 };
  counts.total += 1;
  counts.correct += hit ? 1 : 0;
  byTask.set(task, counts);
}

const result = {
  total,
  correct,
  accuracy: total ? correct / total : 0,
  by_task: Object.fromEntries(
    [...byTask.entries()].sort().map(([task, counts]) => [
      task,
      { ...counts, accuracy: counts.total ? counts.correct / counts.total : 0 },
    ]),
  ),
};

const payload = `${JSON.stringify(result, null, 2)}\n`;
console.log(payload);
if (args.output) {
  await mkdir(path.dirname(args.output), { recursive: true });
  await writeFile(args.output, payload, "utf8");
}
