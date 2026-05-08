"""Command line evaluator for ChronoPhyBench."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from chronophybench.metrics import evaluate_files


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Evaluate ChronoPhyBench predictions.")
    parser.add_argument(
        "--annotations",
        type=Path,
        default=Path("data/sample_annotations.jsonl"),
        help="Path to ChronoPhyBench annotation JSONL.",
    )
    parser.add_argument(
        "--predictions",
        type=Path,
        required=True,
        help="Path to model prediction JSONL.",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=None,
        help="Optional path for a JSON score report.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    result = evaluate_files(args.annotations, args.predictions).to_dict()
    payload = json.dumps(result, indent=2)
    print(payload)
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(payload + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
