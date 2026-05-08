# -*- coding: utf-8 -*-
"""Rule-based judge for ChronoPhyBench-style multiple-choice outputs.

This follows the same Step2 role as Video-Bench's ChatGPT/T5 judge scripts, but
keeps the default evaluator offline and deterministic.
"""

import argparse
import glob
import json
import os
import re


CHOICE_PATTERN = re.compile(r"\b([A-F])\b", re.IGNORECASE)


def extract_choice(text):
    if text is None:
        return ""
    text = str(text).strip()
    if not text:
        return ""
    match = CHOICE_PATTERN.search(text.upper())
    if match:
        return match.group(1).upper()
    return text[:1].upper()


def load_qa(eval_qa_root, dataset_name):
    qa_path = os.path.join(eval_qa_root, "Eval_QA", f"{dataset_name}_QA_sample.json")
    if not os.path.exists(qa_path):
        qa_path = os.path.join(eval_qa_root, "Eval_QA", f"{dataset_name}_QA.json")
    with open(qa_path, "r", encoding="utf-8") as f:
        return json.load(f)


def process_file(eval_file, args):
    dataset_name = os.path.basename(eval_file).replace("_eval.json", "")
    qa_data = load_qa(args.Eval_QA_root, dataset_name)
    with open(eval_file, "r", encoding="utf-8") as f:
        eval_data = json.load(f)

    output_folder = os.path.join(
        args.rule_judge_output_folder, os.path.basename(eval_file).replace("_eval.json", "_rule_eval")
    )
    os.makedirs(output_folder, exist_ok=True)

    for qid_vid, item in eval_data.items():
        qid = str(item.get("qid", qid_vid.split("_")[0]))
        gt = qa_data[qid].get("answer", "")
        pred = extract_choice(item.get("output_sequence", ""))
        judged = dict(item)
        judged["output_rule_choice"] = pred
        judged["answer"] = gt
        judged["correct"] = pred == gt
        output_file = os.path.join(output_folder, f"{qid_vid}.json")
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump({qid_vid: judged}, f, indent=2, ensure_ascii=False)
    print(f"{eval_file} is finished.")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--model_chat_files_folder", type=str, default="./Chat_results")
    parser.add_argument("--rule_judge_output_folder", type=str, default="./Rule_Judge")
    parser.add_argument("--Eval_QA_root", type=str, default="./")
    args = parser.parse_args()

    os.makedirs(args.rule_judge_output_folder, exist_ok=True)
    evaljson_list = glob.glob(f"{args.model_chat_files_folder}/*_eval.json")
    for eval_file in evaljson_list:
        process_file(eval_file, args)


if __name__ == "__main__":
    main()
