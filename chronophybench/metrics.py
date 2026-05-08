"""Metrics for ChronoPhyBench prediction files."""

from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass
import json
from pathlib import Path
from typing import Any, Iterable


SUPPORTED_TASKS = {
    "standard_qa",
    "hallucination_qa",
    "next_state_selection",
    "frame_sorting",
}


@dataclass(frozen=True)
class EvaluationResult:
    """Aggregate scores for one prediction file."""

    total: int
    correct: int
    accuracy: float
    by_task: dict[str, dict[str, float]]

    def to_dict(self) -> dict[str, Any]:
        return {
            "total": self.total,
            "correct": self.correct,
            "accuracy": self.accuracy,
            "by_task": self.by_task,
        }


def normalize_answer(value: Any) -> str:
    """Normalize a scalar multiple-choice answer."""

    if value is None:
        return ""
    text = str(value).strip()
    if not text:
        return ""
    return text.split()[0].strip(".,;:()[]{}").upper()


def normalize_order(value: Any) -> list[str]:
    """Normalize an ordered frame answer such as ["A", "C", "B"]."""

    if isinstance(value, str):
        parts = value.replace(">", ",").replace(" ", ",").split(",")
    elif isinstance(value, Iterable):
        parts = list(value)
    else:
        parts = []
    return [normalize_answer(part) for part in parts if normalize_answer(part)]


def is_correct(item: dict[str, Any], prediction: Any) -> bool:
    task = item.get("task")
    answer = item.get("answer")
    if task == "frame_sorting":
        return normalize_order(prediction) == normalize_order(answer)
    return normalize_answer(prediction) == normalize_answer(answer)


def read_jsonl(path: str | Path) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    with Path(path).open("r", encoding="utf-8") as handle:
        for line_number, line in enumerate(handle, start=1):
            line = line.strip()
            if not line:
                continue
            try:
                rows.append(json.loads(line))
            except json.JSONDecodeError as exc:
                raise ValueError(f"Invalid JSON on line {line_number} of {path}: {exc}") from exc
    return rows


def evaluate_items(
    annotations: list[dict[str, Any]], predictions: list[dict[str, Any]]
) -> EvaluationResult:
    pred_by_id = {row["id"]: row for row in predictions}
    total = 0
    correct = 0
    by_task_counts: dict[str, dict[str, int]] = defaultdict(lambda: {"total": 0, "correct": 0})

    for item in annotations:
        item_id = item["id"]
        task = item.get("task", "unknown")
        pred_row = pred_by_id.get(item_id, {})
        prediction = pred_row.get("prediction", pred_row.get("answer"))
        hit = is_correct(item, prediction)

        total += 1
        correct += int(hit)
        by_task_counts[task]["total"] += 1
        by_task_counts[task]["correct"] += int(hit)

    by_task: dict[str, dict[str, float]] = {}
    for task, counts in sorted(by_task_counts.items()):
        task_total = counts["total"]
        task_correct = counts["correct"]
        by_task[task] = {
            "total": task_total,
            "correct": task_correct,
            "accuracy": task_correct / task_total if task_total else 0.0,
        }

    return EvaluationResult(
        total=total,
        correct=correct,
        accuracy=correct / total if total else 0.0,
        by_task=by_task,
    )


def evaluate_files(annotation_file: str | Path, prediction_file: str | Path) -> EvaluationResult:
    return evaluate_items(read_jsonl(annotation_file), read_jsonl(prediction_file))
