import argparse
import json


def compute_scores(path):
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    scores = {}
    for dataset_name, rows in data.items():
        total = len(rows)
        correct = sum(1 for item in rows.values() if item.get("correct"))
        by_task = {}
        for item in rows.values():
            task = item.get("task_type", "unknown")
            by_task.setdefault(task, {"total": 0, "correct": 0})
            by_task[task]["total"] += 1
            by_task[task]["correct"] += int(bool(item.get("correct")))
        for task, counts in by_task.items():
            counts["accuracy"] = counts["correct"] / counts["total"] if counts["total"] else 0
        scores[dataset_name] = {
            "total": total,
            "correct": correct,
            "accuracy": correct / total if total else 0,
            "by_task": by_task,
        }
    return scores


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--merge_file", type=str, default="./ChronoPhyBench_Input.json")
    parser.add_argument("--score_output_file", type=str, default="./ChronoPhyBench_scores.json")
    args = parser.parse_args()

    scores = compute_scores(args.merge_file)
    with open(args.score_output_file, "w", encoding="utf-8") as f:
        json.dump(scores, f, indent=2, ensure_ascii=False)
    print(json.dumps(scores, indent=2, ensure_ascii=False))
