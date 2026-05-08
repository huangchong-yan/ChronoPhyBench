import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

function parseArgs(argv) {
  const args = {
    mergeFile: path.resolve("ChronoPhyBench_Input.json"),
    scoreOutputFile: path.resolve("ChronoPhyBench_scores.json"),
  };
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    const value = argv[i + 1];
    if (key === "--merge_file") args.mergeFile = path.resolve(value);
    if (key === "--score_output_file") args.scoreOutputFile = path.resolve(value);
    if (key.startsWith("--")) i += 1;
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));
const data = JSON.parse(await readFile(args.mergeFile, "utf8"));
const scores = {};

for (const [datasetName, rows] of Object.entries(data)) {
  const values = Object.values(rows);
  const total = values.length;
  const correct = values.filter((item) => item.correct).length;
  const byTask = {};
  for (const item of values) {
    const task = item.task_type ?? "unknown";
    byTask[task] ??= { total: 0, correct: 0 };
    byTask[task].total += 1;
    byTask[task].correct += item.correct ? 1 : 0;
  }
  for (const counts of Object.values(byTask)) {
    counts.accuracy = counts.total ? counts.correct / counts.total : 0;
  }
  scores[datasetName] = {
    total,
    correct,
    accuracy: total ? correct / total : 0,
    by_task: byTask,
  };
}

const payload = `${JSON.stringify(scores, null, 2)}\n`;
await mkdir(path.dirname(args.scoreOutputFile), { recursive: true });
await writeFile(args.scoreOutputFile, payload, "utf8");
console.log(payload);
