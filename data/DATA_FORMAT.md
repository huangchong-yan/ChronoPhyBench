# ChronoPhyBench Data Format

The public annotation file is JSONL. Each line is one benchmark item.

## Common Fields

- `id`: Unique item id.
- `task`: One of `standard_qa`, `hallucination_qa`, `next_state_selection`, or `frame_sorting`.
- `video`: De-identified relative path or URI for the source video.
- `video_id`: De-identified video id from `video_manifest.jsonl` when available.
- `caption`: Human-verified physical description.
- `split`: Dataset split.
- `answer`: Ground-truth answer. Scalar labels are used for QA and frame selection; ordered lists are used for frame sorting.

## Task-Specific Fields

- `question`: Natural-language question for QA tasks.
- `choices`: Multiple-choice answer options for QA tasks.
- `history`: Video/history context for predictive tasks.
- `candidates`: Candidate future frames for frame selection and sorting.

## Prediction Format

Model submissions are also JSONL:

```json
{"id": "chronophy_sample_0001", "prediction": "B"}
{"id": "chronophy_sample_0004", "prediction": ["C", "A", "B"]}
```

For `frame_sorting`, `prediction` may be either a JSON list or a comma-separated string such as `"C,A,B"`.

## Video-Bench-Style QA Format

The main evaluation files in this repository follow the Video-Bench JSON structure:

```json
{
  "0": {
    "vid_path": "Eval_video/ChronoPhyBench/chronophy_000001.mp4",
    "video_id": "chronophy_000001",
    "task_type": "standard_qa",
    "question": "Question text",
    "choices": {
      "A": "Option A",
      "B": "Option B"
    },
    "answer": "B"
  }
}
```

## Video Manifest

`data/video_manifest.jsonl` is safe to publish. It contains neutral ids and paths only:

```json
{"id":"chronophy_000001","video_id":"chronophy_000001","path":"videos/chronophy_000001.mp4","file_name":"chronophy_000001.mp4","file_size_bytes":5103231,"clip_start_sec":15.2,"clip_end_sec":37.3,"clip_duration_sec":22.1,"split":"unassigned"}
```

Original names, people, platform labels, and titles are stored only in `data/private_video_mapping.jsonl`, which is ignored by Git and should not be included in public releases.
