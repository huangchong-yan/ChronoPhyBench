import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const CHOICE_PATTERN = /\b([A-F])\b/i;

function parseArgs(argv) {
  const args = {
    modelChatFilesFolder: path.resolve("Chat_results"),
    ruleJudgeOutputFolder: path.resolve("Rule_Judge"),
    evalQaRoot: path.resolve("."),
  };
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    const value = argv[i + 1];
    if (key === "--model_chat_files_folder") args.modelChatFilesFolder = path.resolve(value);
    if (key === "--rule_judge_output_folder") args.ruleJudgeOutputFolder = path.resolve(value);
    if (key === "--Eval_QA_root") args.evalQaRoot = path.resolve(value);
    if (key.startsWith("--")) i += 1;
  }
  return args;
}

function extractChoice(text) {
  const normalized = String(text ?? "").trim().toUpperCase();
  const match = normalized.match(CHOICE_PATTERN);
  if (match) return match[1].toUpperCase();
  return normalized.slice(0, 1);
}

async function loadQa(evalQaRoot, datasetName) {
  const candidates = [
    path.join(evalQaRoot, "Eval_QA", `${datasetName}_QA_sample.json`),
    path.join(evalQaRoot, "Eval_QA", `${datasetName}_QA.json`),
  ];
  for (const file of candidates) {
    try {
      return JSON.parse(await readFile(file, "utf8"));
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
  throw new Error(`Cannot find QA file for ${datasetName}`);
}

const args = parseArgs(process.argv.slice(2));
await mkdir(args.ruleJudgeOutputFolder, { recursive: true });
const files = (await readdir(args.modelChatFilesFolder))
  .filter((name) => name.endsWith("_eval.json"))
  .map((name) => path.join(args.modelChatFilesFolder, name));

for (const file of files) {
  const datasetName = path.basename(file).replace("_eval.json", "");
  const qaData = await loadQa(args.evalQaRoot, datasetName);
  const evalData = JSON.parse(await readFile(file, "utf8"));
  const outDir = path.join(args.ruleJudgeOutputFolder, path.basename(file).replace("_eval.json", "_rule_eval"));
  await mkdir(outDir, { recursive: true });

  for (const [qidVid, item] of Object.entries(evalData)) {
    const qid = String(item.qid ?? qidVid.split("_")[0]);
    const answer = qaData[qid]?.answer ?? "";
    const prediction = extractChoice(item.output_sequence);
    const judged = {
      ...item,
      output_rule_choice: prediction,
      answer,
      correct: prediction === answer,
    };
    await writeFile(path.join(outDir, `${qidVid}.json`), JSON.stringify({ [qidVid]: judged }, null, 2), "utf8");
  }
  console.log(`${file} is finished.`);
}
