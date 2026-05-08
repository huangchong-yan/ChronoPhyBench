# Evaluation Protocol

ChronoPhyBench evaluates whether a model uses visual evidence for physical reasoning instead of relying on language shortcuts.

## Settings

- **Standard multimodal setting:** The model receives the video and an aligned text prompt.
- **Visual-blind setting:** The visual input is omitted. High scores indicate strong language priors or dataset bias.
- **Conflict setting:** The video is retained, but the text prompt contains a physically incorrect or misleading statement.

## Metrics

- `Accuracy`: Exact-match accuracy for multiple-choice QA and next-state frame selection.
- `Acc@3`: Accuracy for 3-choice next-state frame selection.
- `Acc@6`: Accuracy for 6-choice next-state frame selection.
- `KFrame@3`: Exact order accuracy for 3-frame sorting.
- `KFrame@4`: Exact order accuracy for 4-frame sorting.

## Recommended Reporting

Report each model with:

- Model name and checkpoint/API date.
- Prompt template.
- Number of evaluated examples.
- Decoding parameters.
- Overall accuracy and task-level accuracy.
- Visual-blind and conflict-setting deltas when available.
