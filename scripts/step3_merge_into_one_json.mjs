import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

function parseArgs(argv) {
  const args = {
    judgeFilesFolder: path.resolve("Rule_Judge"),
    mergeFile: path.resolve("ChronoPhyBench_Input.json"),
  };
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    const value = argv[i + 1];
    if (key === "--judge_files_folder") args.judgeFilesFolder = path.resolve(value);
    if (key === "--merge_file") args.mergeFile = path.resolve(value);
    if (key.startsWith("--")) i += 1;
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));
const datasets = {};
const subfolders = await readdir(args.judgeFilesFolder, { withFileTypes: true });

for (const entry of subfolders.filter((item) => item.isDirectory())) {
  const datasetName = entry.name.replace("_chatgpt_eval", "").replace("_rule_eval", "");
  const folder = path.join(args.judgeFilesFolder, entry.name);
  const rows = {};
  const files = (await readdir(folder)).filter((name) => name.endsWith(".json"));
  for (const file of files) {
    Object.assign(rows, JSON.parse(await readFile(path.join(folder, file), "utf8")));
  }
  datasets[datasetName] = rows;
}

await mkdir(path.dirname(args.mergeFile), { recursive: true });
await writeFile(args.mergeFile, JSON.stringify(datasets, null, 2), "utf8");
console.log(`Wrote ${args.mergeFile}`);
