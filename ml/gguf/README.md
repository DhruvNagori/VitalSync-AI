# GGUF deployment artifact

The exported `Qwen3-4B.Q4_K_M.gguf` is approximately 2.3 GiB and has SHA-256:

```text
ff0ce1032104a78625448e2b72d6632f1d16b9a93152c5dada737cd54f874e2d
```

It is intentionally not committed to GitHub. GitHub blocks normal Git objects
above 100 MiB, and the file is larger than the 2 GB Git LFS per-file limit on
GitHub Free and Pro plans.

The repository includes the fine-tuned LoRA adapter needed to reproduce it. In
the Colab training notebook, load `ml/artifacts/final_adapter` and run:

```python
model.save_pretrained_gguf(
    "medquad-qwen3-4b",
    tokenizer,
    quantization_method="q4_k_m",
)
```

Keep the generated GGUF next to this directory's `Modelfile`, then import it:

```bash
ollama create vitalsync-medquad-qwen3-4b -f ml/gguf/Modelfile
```

The current local development copy is stored outside the Git repository at:

```text
/Users/sohitkumar/Downloads/medquad-qwen3-4b_gguf/Qwen3-4B.Q4_K_M.gguf
```

That local path is informational and is not required by another clone after the
GGUF has been regenerated or downloaded to a new location.
