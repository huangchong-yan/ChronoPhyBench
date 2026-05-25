<p align="center">
    <img src="assets/logo.svg" width="180" style="margin-bottom: 0.2;" alt="ChronoPhyBench logo"/>
<p>

<h2 align="center">
  ChronoPhyBench: Do MLLMs Truly Understand the World or Merely Exploit Language Priors?
</h2>

<h5 align="center">
  A chronological physical dynamics reasoning benchmark for evaluating whether multimodal large language models truly use visual evidence.
</h5>

<h5 align="center">

[![Paper](https://img.shields.io/badge/Paper-NeurIPS%202026-b31b1b.svg?logo=arXiv)](#citation)
[![Dataset](https://img.shields.io/badge/Kohsin/ChronoPhyBench)](#data-preparation)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Format](https://img.shields.io/badge/Format-JSON-green.svg)](Eval_QA/ChronoPhyBench_QA_sample.json)

</h5>

* **We introduce ChronoPhyBench, a multimodal benchmark for chronological physical dynamics reasoning.** It evaluates whether MLLMs can infer future physical states from historical video context instead of relying on text priors.
* **We provide a Video-Bench-style evaluation toolkit.** The repository contains QA files, model-output collection format, answer judging scripts, and merge/score utilities.
* **We document the full data construction pipeline.** The workflow covers raw video collection, valid physical-clip extraction, Chinese QA translation/filtering, de-identified release naming, and Baidu Netdisk packaging.

## News

**[2026.05.08]** Initial ChronoPhyBench repository scaffold is released with Video-Bench-style QA format, evaluation scripts, and de-identified video manifest.

**[2026.05.07]** ChronoPhyBench paper draft prepared for NeurIPS 2026.

## Leaderboard

We will maintain a public leaderboard after the evaluation split is finalized.

| Model | Acc@3 | Acc@6 | KFrame@3 | KFrame@4 |
| --- | ---: | ---: | ---: | ---: |
| Random baseline | 33.33 | 16.67 | 16.67 | 4.17 |
| GPT-5.5 | 72.5 | 70.5 | 72.0 | 40.5 |
| Seed-2.0 Pro-260215 | 68.0 | 65.0 | 74.0 | 45.5 |
| Gemini-3.0 Pro Preview | 68.5 | 63.0 | 70.0 | 35.5 |
| GLM-4.6V-Flash | 50.0 | 45.0 | 40.0 | 15.0 |

## Benchmark

ChronoPhyBench targets a failure mode that ordinary video QA can hide: a model may answer correctly by exploiting language priors while ignoring the video. The benchmark therefore combines standard QA with explicit stress tests.

### Task Types

* **Standard QA:** aligned video-text physical reasoning questions.
* **Hallucination QA:** questions where the text can conflict with the visual evidence, exposing language-prior shortcuts.
* **Next-State Frame Selection:** models select the physically plausible next frame from candidate future states.
* **Multi-Frame Chronological Sorting:** models sort shuffled candidate frames into the correct temporal and physical order.

### Dataset Statistics from the Paper

| Category | Count | Purpose |
| --- | ---: | --- |
| Curated videos | 10,000+ | Real-world physical interaction videos |
| Standard QA pairs | 10,000+ | Baseline multimodal comprehension |
| Hallucination QA pairs | 5,000+ | Modality-conflict stress testing |
| Chronological sorting pairs | 400+ | Multi-frame temporal ordering |
| Next-state selection pairs | 400+ | Predictive physical state selection |
| Predictive pairs | 16,000+ | Combined benchmark annotations |

## Data Preparation

### 1. Raw Video Pool

The local working dataset is stored in:

```text
../剪辑后视频/
```

This folder contains clipped physical videos from multiple sources. Public release files must not preserve original names, people names, platform names, or raw titles.

### 2. Effective Physical Segment Clipping

Use:

```text
../视频剪辑m3.exe
```

This tool is used to clip raw videos into valid physical-event segments. The expected output is a folder of short videos whose filenames include clip timing information such as:

```text
original_title__16.1s__25.7s.mp4
```

These clipped videos form the basis of ChronoPhyBench video examples.

### 3. QA Translation and Filtering

Use:

```text
../QA翻译筛选器.exe
```

This tool translates QA questions, answer options, and labels into Chinese, then supports filtering low-quality or invalid QA examples. The filtered QA files should be exported into the Video-Bench-style format under `Eval_QA/`.

Each QA item follows this structure:

```json
{
  "0": {
    "vid_path": "Eval_video/ChronoPhyBench/chronophy_000001.mp4",
    "video_id": "chronophy_000001",
    "task_type": "standard_qa",
    "question": "What happens immediately after ...?",
    "choices": {
      "A": "Option A",
      "B": "Option B",
      "C": "Option C",
      "D": "Option D"
    },
    "answer": "B"
  }
}
```

### 4. De-identified Video Release

Generate a clean public manifest and a private source mapping:

```bash
node scripts/build_video_manifest.mjs \
  --root ../剪辑后视频 \
  --base .. \
  --output data/video_manifest.jsonl \
  --private-mapping data/private_video_mapping.jsonl
```

Create a de-identified release folder for Baidu Netdisk upload:

```bash
node scripts/build_video_manifest.mjs \
  --root ../剪辑后视频 \
  --base .. \
  --output data/video_manifest.jsonl \
  --private-mapping data/private_video_mapping.jsonl \
  --release-dir release/ChronoPhyBench-videos \
  --copy-mode hardlink
```

The release folder uses neutral names:

```text
release/ChronoPhyBench-videos/
  chronophy_000001.mp4
  chronophy_000002.mp4
  chronophy_000003.mp4
```

Do not upload `data/private_video_mapping.jsonl`; it preserves the original source paths and is ignored by Git.

### 5. Baidu Netdisk

The de-identified video package will be distributed through Baidu Netdisk.

| Item | Link | Extraction code |
| --- | --- | --- |
| ChronoPhyBench videos | Coming soon | Coming soon |

After downloading, place the videos under:

```text
ChronoPhyBench/
  Eval_video/
    ChronoPhyBench/
      chronophy_000001.mp4
      chronophy_000002.mp4
```

## Evaluation

1. Clone this repository and navigate to the ChronoPhyBench folder.

```bash
git clone https://github.com/YOUR_ORG/ChronoPhyBench.git
cd ChronoPhyBench
```

2. Install packages if you use optional Python judges.

```bash
pip install -r requirements.txt
```

The default Node/Python scoring utilities are lightweight and do not require heavy model dependencies.

### Step1: Chat with Your Own Model

The code below follows the same pattern as Video-Bench. You should replace the model loading and `ask(...)` call with your own MLLM.

```python
import argparse
import json
import os

parser = argparse.ArgumentParser()
parser.add_argument("--dataset_name", type=str, default="ChronoPhyBench")
parser.add_argument("--Eval_QA_root", type=str, default="./")
parser.add_argument("--Eval_Video_root", type=str, default="./")
parser.add_argument("--chat_conversation_output_folder", type=str, default="./Chat_results")
args = parser.parse_args()

dataset_qajson = {
    "ChronoPhyBench": f"{args.Eval_QA_root}/Eval_QA/ChronoPhyBench_QA_sample.json"
}

os.makedirs(args.chat_conversation_output_folder, exist_ok=True)

for dataset_name, qa_json in dataset_qajson.items():
    with open(qa_json, "r", encoding="utf-8") as f:
        data = json.load(f)

    eval_dict = {}
    for q_id, item in data.items():
        question = item["question"]
        choices = item["choices"]
        choice_text = " ".join([f"{key}. {value}" for key, value in choices.items()])
        question = f"{question} {choice_text}\nAmong the options above, the closest answer is:"
        vid_path = os.path.join(args.Eval_Video_root, item["vid_path"])

        # ===================== Replace this block with your model =====================
        # output, output_scores = ask(args, question, model, tokenizer, image_processor, vid_path)
        output = "B"
        # ==============================================================================

        qid_vid = f"{q_id}_{item['video_id']}"
        eval_dict[qid_vid] = {
            "qid": q_id,
            "video_id": item["video_id"],
            "task_type": item.get("task_type", "unknown"),
            "question": question,
            "output_sequence": output
        }

    output_file = f"{args.chat_conversation_output_folder}/{dataset_name}_eval.json"
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(eval_dict, f, indent=2, ensure_ascii=False)
```

### Step2: Judge Model Answers

The offline rule-based judge extracts the selected option from `output_sequence` and compares it with the ground-truth answer.

```bash
python Step2_rule_judge.py \
  --model_chat_files_folder ./Chat_results \
  --rule_judge_output_folder ./Rule_Judge \
  --Eval_QA_root ./
```

If you want a semantic judge similar to Video-Bench's ChatGPT/T5 evaluator, adapt `Step2_chatgpt_judge.py` or `Step2_T5_judge.py` from `Video-Bench-main`.

### Step3: Merge Judge Results

```bash
python Step3_merge_into_one_json.py \
  --judge_files_folder ./Rule_Judge \
  --merge_file ./ChronoPhyBench_Input.json
```

### Step4: Compute Scores

```bash
python Step4_compute_scores.py \
  --merge_file ./ChronoPhyBench_Input.json \
  --score_output_file ./ChronoPhyBench_scores.json
```

If Python is not available on Windows, the same sample pipeline can be checked with Node:

```bash
npm run video-bench:sample
```

## Repository Structure

```text
ChronoPhyBench/
  Eval_QA/                         # Video-Bench-style QA files
  Eval_video/                      # Local video folder after Baidu Netdisk download
  assets/                          # Logo and figures
  data/                            # Public manifest and data format docs
  docs/                            # Dataset build and release docs
  scripts/                         # Manifest builder and Node evaluator
  Step2_rule_judge.py              # Offline answer judge
  Step3_merge_into_one_json.py     # Merge judge outputs
  Step4_compute_scores.py          # Score computation
```

## License

Code is released under the MIT License. Dataset videos and annotations may have separate terms depending on the final public release package.

## Citation

If you find our paper and benchmark useful in your research, please consider citing:

```bibtex
@inproceedings{chronophybench2026,
  title = {ChronoPhyBench: Do MLLMs Truly Understand the World or Merely Exploit Language Priors?},
  author = {Anonymous Authors},
  booktitle = {Submitted to the 40th Conference on Neural Information Processing Systems},
  year = {2026}
}
```
