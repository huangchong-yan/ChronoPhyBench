# Model Adapters

ChronoPhyBench keeps the evaluator model-agnostic. To evaluate a model:

1. Load each JSONL annotation.
2. Build the model prompt from `question`, `choices`, `history`, and `candidates`.
3. Run the model with the associated video or frame inputs.
4. Save one JSONL prediction row per item.

Minimal output:

```json
{"id": "chronophy_sample_0001", "prediction": "B"}
```

Optional output:

```json
{
  "id": "chronophy_sample_0001",
  "prediction": "B",
  "raw_response": "The answer is B because the ball transfers momentum.",
  "model": "your-model-name"
}
```

The evaluator ignores extra fields.
