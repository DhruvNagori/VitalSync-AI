# MedQuAD Qwen3-4B fine-tuning package

This directory contains the reproducible machine-learning assets used by the
VitalSync academic health-information chatbot.

## Contents

| Path | Purpose |
|---|---|
| `notebooks/medquad_qwen3_4b_qlora_colab.ipynb` | Google Colab QLoRA training notebook |
| `notebooks/compare_original_vs_finetuned_colab.ipynb` | Base-versus-adapter comparison notebook |
| `dataset/` | Cleaned, grouped MedQuAD JSONL splits and review queue |
| `scripts/prepare_medquad.py` | Reproducible cleaning and grouped-split pipeline |
| `artifacts/final_adapter/` | Fine-tuned PEFT/LoRA adapter and tokenizer files |
| `results/trainer_state.json` | Saved step-by-step training and validation metrics |
| `results/training_summary.json` | Human-readable run summary |
| `results/base_vs_finetuned/` | Raw base-vs-adapter metrics, 50 paired answers, and correctness audit |
| `gguf/Modelfile` | Qwen template used to import the merged GGUF into Ollama |
| `gguf/README.md` | GGUF limitation, checksum, and export instructions |

## Model

- Base: `unsloth/Qwen3-4B-unsloth-bnb-4bit`
- Method: supervised QLoRA/PEFT
- LoRA rank/alpha: 16/32
- Sequence length: 2,048
- Current run: smoke test, 1,000 training examples, 100 optimizer steps
- Best saved validation loss: 1.050118 at step 100

The adapter is the trained model delta. Because the target repository is a public
GitHub fork that cannot accept new Git LFS objects, the 126 MB weight is committed
as three ordinary Git chunks, each below GitHub's 100 MiB hard file limit.

Reconstruct it after cloning:

```bash
cat ml/artifacts/final_adapter/adapter_model.safetensors.part-* \
  > ml/artifacts/final_adapter/adapter_model.safetensors
shasum -a 256 ml/artifacts/final_adapter/adapter_model.safetensors
```

The checksum must match the value below. The reconstructed adapter is not a
standalone base model. Load `artifacts/final_adapter` with Unsloth/PEFT, which will
resolve the base-model reference from `adapter_config.json`, or merge/export it to
GGUF using the training notebook.

Adapter SHA-256:

```text
9c72558f1888a244e4d536e36a98ebf2bd696eae9eeb133528283ac90dc4f777
```

## Dataset and evaluation warning

The safe splits contain 9,722 train, 1,203 validation, and 1,269 test records,
grouped by medical Focus with zero Focus overlap. Another 2,939 treatment,
prevention, diagnosis, medication, vaccine, or year-sensitive records remain in
`review_required.jsonl`; they were not silently treated as approved training data.

The current adapter is a smoke-run artifact. A lower language-model loss does not
establish medical correctness, safety, or clinical usefulness. See the repository
root `MODEL_CARD.md` and `results/base_vs_finetuned/REVIEW.md` for limitations and
the observed factual failures.

## Reproduce in Colab

1. Upload this `ml` directory to Google Drive or clone the repository in Colab.
2. Open `notebooks/medquad_qwen3_4b_qlora_colab.ipynb`.
3. Set the notebook paths to `ml/dataset` and the desired output directory.
4. Use smoke mode first, then run full mode for the final academic experiment.
5. Run `compare_original_vs_finetuned_colab.ipynb` against the untouched test set.
6. Export `q4_k_m` GGUF and import it using `gguf/Modelfile`.

Use only synthetic or de-identified application data. This project is not a
medical device and must not be used to diagnose or prescribe treatment.
