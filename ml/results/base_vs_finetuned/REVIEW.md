# Base vs fine-tuned comparison review

This directory contains the raw output from the deterministic comparison notebook
and an audit of what the numbers do and do not show. This is an academic model
evaluation, not a clinical validation.

## Files and integrity

| File | Description | SHA-256 |
|---|---|---|
| `comparison_summary.json` | Aggregate loss, perplexity, and ROUGE | `2fb445465092c06dc31826798d56bf58a54f7c1d37994610a176d58f57bda541` |
| `loss_and_perplexity.csv` | Base and adapter loss/perplexity | `77c1ac531422573ba08865ca57bd414fd6a25727d54a37fa617cee69b102bd2d` |
| `rouge_scores.csv` | ROUGE comparison | `79f4d55b94aa1e1d79a48ecc745b1ba0a40ae99d5e689ae3161af4ca7eb1b8ae` |
| `original_vs_finetuned_answers.csv` | 50 paired generations and references | `c0dd752f7e9d6c976e4d52e0122ef4d2055684ba17c738aee8cbded5d16274e1` |
| `manual_review_flags.csv` | Material issues found during this audit | Repository-generated |

All JSON/CSV files parse successfully. The paired-answer file has 50 unique test
indices and a consistent 12-column schema. No spreadsheet-formula prefixes were
found. The empty `temporary_trainer` directory from the downloaded output was not
committed.

## Quantitative result

| Metric | Original Qwen3-4B | MedQuAD QLoRA | Change |
|---|---:|---:|---:|
| Test loss, 1,269 examples | 2.6779 | 1.1237 | 58.04% lower |
| Perplexity | 14.5539 | 3.0761 | 78.86% lower |
| ROUGE-1, 50 generations | 0.3063 | 0.3520 | +0.0458 |
| ROUGE-2, 50 generations | 0.0859 | 0.1530 | +0.0671 |
| ROUGE-L, 50 generations | 0.1648 | 0.2552 | +0.0905 |
| ROUGE-Lsum, 50 generations | 0.2107 | 0.2558 | +0.0451 |

The perplexities exactly equal `exp(test_loss)`. The test loss used the full
1,269-example held-out set. Generation used a seeded random sample of 50 examples
(3.94% of the test set), greedy decoding, `max_new_tokens=256`, and identical
settings for both models.

## Correct interpretation

The adapter learned the MedQuAD answer distribution and matches reference wording
more closely. This supports a claim of improved held-out language-model fit and
reference overlap for this run.

It does **not** support a claim that the fine-tuned model is medically correct,
safe, clinically useful, or better on current guidance. The manual score, safety,
and review-note columns in the raw comparison are all empty. ROUGE rewards wording
overlap and can rise even when a clinically important fact is wrong.

## Material correctness findings

Manual inspection found multiple high-severity failures. Examples include:

- Test 82 says `CYP27A1` causes CADASIL; the reference and MedlinePlus identify
  `NOTCH3`.
- Test 602 says `PAX6` causes Norum disease; the reference identifies `LCAT`.
- Test 621 describes the liver being pushed against the diaphragm and suggests
  tumor surgery. Chilaiditi syndrome is interposition of colon between the liver
  and diaphragm, often incidental.
- Several prevalence answers replace an unknown or different reference estimate
  with an unsupported round number such as 1 in 20,000 or 1 in 200,000.
- Several symptom answers imitate the Human Phenotype Ontology template while
  inventing repetitive, contradictory, or unrelated features and 90% frequencies.
  Examples include tests 500, 651, 682, 568, 1189, and 513.

The original model also contains serious errors, including condition conflation
and invented definitions. The comparison therefore shows that lower loss did not
remove hallucinations from either model.

See `manual_review_flags.csv` for the audited test indices. The file is a focused
error list, not a complete clinical score of every answer.

## Independent spot checks

- MedlinePlus Genetics: CADASIL is typically caused by pathogenic variants in
  `NOTCH3`: https://medlineplus.gov/genetics/condition/cerebral-autosomal-dominant-arteriopathy-with-subcortical-infarcts-and-leukoencephalopathy/
- MedlinePlus Genetics: Williams syndrome frequency is estimated at 1 in 7,500
  to 18,000: https://medlineplus.gov/genetics/condition/williams-syndrome/
- NIH GARD: Norum disease is complete LCAT deficiency:
  https://rarediseases.info.nih.gov/diseases/4011/norum-disease
- MedlinePlus Genetics: somatic `GNAS` mutations occur in fibrous bone lesions:
  https://medlineplus.gov/genetics/gene/gnas/

## Recommendation

Do not deploy the fine-tuned model as an unguided medical-answering system. For
the academic project:

1. keep the visible educational-use warning and emergency guard;
2. add retrieval from versioned NIH/CDC sources with answer citations;
3. complete blinded manual scoring of all 50 paired answers by at least two
   reviewers and report agreement;
4. add factuality, unsupported-claim, emergency, medication, and refusal test sets;
5. rerun generation on at least 100-200 examples and report confidence intervals;
6. treat lower loss and ROUGE as supporting ML metrics, never medical accuracy.
