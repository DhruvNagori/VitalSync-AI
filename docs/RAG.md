# Trusted-source RAG

VitalSync uses a small, local retrieval-augmented generation layer to reduce
unsupported medical claims from the fine-tuned Qwen3-4B model. It is an academic
safety improvement, not a clinically validated decision-support system.

## Request flow

```text
Patient question
  -> deterministic emergency phrase check
  -> retrieve reviewed chunks from PostgreSQL
  -> no match: return a scope-limited response without calling the LLM
  -> match: send question + retrieved evidence to local Ollama Qwen3-4B
  -> require inline [S1], [S2] citations
  -> persist answer citations and show source links in React
```

The first version uses deterministic, dependency-free lexical retrieval. This is
appropriate for the small reviewed collection and works offline after the Docker
database is seeded. The retrieval implementation is isolated in
`backend/app/rag.py`, so it can later be replaced with hybrid lexical/vector
retrieval without changing the chat API.

## Included source collection

The seed collection is stored in `backend/app/knowledge_seed.json`. Its summaries
are locally authored from the linked government health pages rather than copied
full-page content.

| Topic | Organization | Source |
|---|---|---|
| Iron nutrition and supplement safety | NIH Office of Dietary Supplements | https://ods.od.nih.gov/factsheets/Iron-Consumer/ |
| Iron-deficiency anemia | NHLBI | https://www.nhlbi.nih.gov/health/anemia/iron-deficiency-anemia |
| High blood pressure | NHLBI | https://www.nhlbi.nih.gov/health/high-blood-pressure/treatment |
| Diabetes | NIDDK | https://www.niddk.nih.gov/health-information/diabetes/overview |
| Asthma | NHLBI | https://www.nhlbi.nih.gov/health/asthma/causes |
| Stroke warning signs | CDC | https://www.cdc.gov/stroke/signs-symptoms/ |
| Heart attack warning signs | CDC | https://www.cdc.gov/heart-disease/about/heart-attack.html |
| Dehydration | MedlinePlus/NLM | https://medlineplus.gov/dehydration.html |
| Common cold | MedlinePlus/NLM | https://medlineplus.gov/commoncold.html |

Each chunk records its organization, canonical URL, source update date when
available, and the date the local summary was reviewed. Startup seeding is an
idempotent upsert keyed by `document_slug` and `chunk_key`.

## Strict grounding behavior

- The prompt tells the model to use only retrieved evidence.
- Medical-claim paragraphs must include inline source labels.
- If retrieval does not find a reviewed chunk, the model is not called.
- The response lists clickable source links and persists them with chat history.
- Emergency detection and escalation occur outside the model.
- The knowledge index contains general public health information, never patient
  documents or wearable records.

## Adding a trusted source

1. Select an authoritative, stable government or professional source.
2. Verify its canonical URL and last update date.
3. Write a short, original summary limited to claims supported by that source.
4. Add topic synonyms to `keywords`; do not add diagnoses or unsupported claims.
5. Add the entry to `backend/app/knowledge_seed.json` with a new stable key.
6. Rebuild the backend. Startup will insert or update the chunk.
7. Test a positive query, a paraphrased query, and an unrelated negative query.
8. Review the generated answer and every citation manually.

## Current limitations

- Nine reviewed pages cover only eight topic areas.
- Lexical retrieval is weaker than hybrid search for synonyms not present in the
  question or keyword field.
- Source content is a reviewed local summary and will not update automatically.
- Citation presence does not prove that every generated sentence is entailed.
- This system has not been evaluated by clinicians and must remain an educational
  academic demonstration.

The next research step should add a source-refresh review workflow, entailment
checks, retrieval evaluation, and optional embeddings for hybrid search.
