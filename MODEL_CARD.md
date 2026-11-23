# VitalSync MedQuAD Qwen3-4B

## Intended use

This model is an academic demonstration for answering general health-information
questions. It is not a medical device, must not diagnose or prescribe, and must
not be used for emergencies or as the sole basis for a healthcare decision.

## Model and tuning method

| Item | Value |
|---|---|
| Base model | `unsloth/Qwen3-4B-unsloth-bnb-4bit` |
| Architecture | Qwen3 causal language model, approximately 4B parameters |
| Fine-tuning | QLoRA/PEFT supervised fine-tuning |
| LoRA rank | 16 |
| LoRA alpha | 32 |
| LoRA dropout | 0 |
| Target modules | `q_proj`, `k_proj`, `v_proj`, `o_proj`, `gate_proj`, `up_proj`, `down_proj` |
| Maximum sequence length | 2,048 tokens |
| Learning rate | `1e-4` |
| Micro batch size | 1 |
| Gradient accumulation | 8 |
| Training seed | 3407 |
| Deployment format | Merged GGUF, recommended quantization `Q4_K_M` |

The saved `final_adapter` is a roughly 132 MB LoRA adapter, not a complete model.
It must be loaded with its base model or merged/exported to GGUF before deployment.

## Dataset

The source is a cleaned MedQuAD question-answer collection. The preparation
pipeline removed empty answers, question-equals-answer rows, short question-like
answers, resource placeholders, link-dependent answers, and normalized duplicate
pairs. Treatment, prevention, diagnosis, year, medication, and vaccine records
were separated for manual review.

| Stage | Records |
|---|---:|
| Raw | 47,441 |
| After automatic cleaning and deduplication | 15,133 |
| Safe/unflagged records | 12,194 |
| Manual-review records | 2,939 |
| Train split | 9,722 |
| Validation split | 1,203 |
| Test split | 1,269 |

Splitting was grouped by medical `Focus`, with zero Focus overlap among train,
validation, and test. The safe data comes from NIH-related collections and CDC,
including GHR, GARD, NINDS, Cancer.gov, NHLBI, MedlinePlus Health Topics,
NIH Senior Health, CDC, and NIDDK.

## Current training run

The currently saved adapter is a smoke-test model, not the final full-data model.
It trained on a shuffled 1,000-example training subset for 100 optimizer steps
(0.8 epoch). The validation evaluation used 200 examples.

| Checkpoint | Validation loss |
|---|---:|
| Step 50 | 1.0856 |
| Step 100 | 1.0501 |

The lower validation loss shows that the optimization run learned the training
format. It does **not** prove that answers are medically correct, safe, current,
or better than the base model.

## Required evaluation before reporting results

Evaluate the original and fine-tuned models with identical decoding settings on
the untouched, Focus-grouped test set. Report at least:

- answer relevance and completeness;
- factual correctness judged against the reference and, for a sample, a qualified reviewer;
- unsupported-claim or hallucination rate;
- diagnosis/prescription boundary violations;
- emergency escalation recall;
- refusal behavior for requests outside the intended scope;
- latency and memory use on the target Mac.

Do not use validation/test answers for training or prompt examples. Do not claim
clinical accuracy from training loss, ROUGE, BLEU, or semantic similarity alone.

## Known limitations

- The source data is not a replacement for current clinical guidance.
- A 4B model can produce convincing but incorrect statements.
- Fine-tuning changes behavior and style but does not guarantee factual grounding.
- The smoke run used only part of the available training data.
- The system currently has no retrieval/citation layer.
- The keyword emergency guard is a fallback, not a validated triage system.
- Conversation content is sent to the local model service; only synthetic or
  de-identified demonstration data should be entered.

For a stronger academic system, combine the fine-tuned model with retrieval from
versioned trusted documents, display citations, and evaluate retrieval and answer
generation separately.
