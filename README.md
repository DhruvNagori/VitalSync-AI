# VitalSync AI

An academic healthcare-monitoring platform with patient and doctor portals, a
PostgreSQL-backed account system, and a locally hosted fine-tuned Qwen3-4B health
information chatbot.

> [!CAUTION]
> VitalSync AI is an academic demonstration, not a medical device. It does not
> diagnose, prescribe, or replace a qualified healthcare professional. Do not use
> it for emergencies or with real identifiable patient data.

## Contents

- [System overview](#system-overview)
- [Features](#features)
- [Technology stack](#technology-stack)
- [Quick start on an Apple Silicon Mac](#quick-start-on-an-apple-silicon-mac)
- [Fine-tuned model and outputs](#fine-tuned-model-and-outputs)
- [Database and authentication](#database-and-authentication)
- [API endpoints](#api-endpoints)
- [Development commands](#development-commands)
- [Repository structure](#repository-structure)
- [Testing and verification](#testing-and-verification)
- [Known limitations](#known-limitations)
- [Privacy and security](#privacy-and-security)
- [Contributing](#contributing)
- [Troubleshooting](#troubleshooting)

## System overview

```text
Browser
  │
  ▼
React frontend + Nginx (Docker, port 8080)
  │ /api/v1
  ▼
FastAPI backend (Docker, port 8000)
  ├── PostgreSQL (Docker volume)
  └── Ollama API via host.docker.internal:11434
          │
          ▼
      Fine-tuned Qwen3-4B Q4_K_M GGUF
```

Ollama runs natively on macOS so the model can use Apple Metal. The web
application, API, and database run through Docker Compose.

## Features

### Patient portal

- Registration and login with persistent PostgreSQL storage.
- Database-backed dashboard, symptom timeline, and medical-document management.
- Simulated smart-band scenarios with persisted readings and explainable anomaly rules.
- Location-filtered doctor discovery and appointment requests.
- Per-appointment consent snapshots for profile, symptoms, history, wearable
  readings, alerts, selected documents, written summaries, and chat summaries.
- Persistent doctor messaging and care-plan updates.
- Hospital discovery and clearly labelled simulated-device interfaces.
- Local AI health-information assistant with conversation history.
- Deterministic emergency-message fallback and visible safety notices.
- Trusted NIH source links for the currently grounded iron-deficiency topic.

### Doctor portal

- Professional registration with specialization and registration number.
- Doctor dashboard, appointment review, and patient directory.
- Consent-scoped patient workspace.
- Consultation notes, care plans, follow-up items, and messaging.
- Doctor profile and availability settings.

### Authentication and persistence

- Patient and doctor accounts stored in PostgreSQL.
- Argon2id password hashes; plaintext passwords are never stored.
- Signed access tokens and session restoration after page refresh.
- Unique email and professional registration-number constraints.
- Authenticated chatbot endpoint.
- Persistent Docker volume for accounts, health records, appointments, consent
  snapshots, files, messages, notes, care plans, chatbot history, and mock wearable data.

## Technology stack

| Area | Technology |
|---|---|
| Frontend | React 19, Vite 8, React Router |
| Styling | Tailwind CSS 4 and project CSS |
| Backend | FastAPI, Pydantic, Uvicorn, HTTPX |
| Database | PostgreSQL 17, SQLAlchemy, Psycopg |
| Authentication | Argon2id password hashing, signed JWT access tokens |
| Local inference | Ollama native on macOS |
| Fine-tuned model | Qwen3-4B, QLoRA/PEFT adapter, Q4_K_M GGUF |
| ML tooling | Unsloth, TRL, Transformers, Datasets, Google Colab |
| Deployment | Docker Compose and Nginx |
| Charts/maps | Recharts, Leaflet, React Leaflet |

## Quick start on an Apple Silicon Mac

### 1. Requirements

Install Git, Docker Desktop, and Ollama for macOS. Node.js is only required when
running the frontend outside Docker.

```bash
git --version
docker --version
docker compose version
ollama --version
```

### 2. Clone the repository

```bash
git clone https://github.com/sohitkumar7505/ai_based_health_monitoring_system.git
cd ai_based_health_monitoring_system
```

### 3. Configure local environment values

```bash
cp env.example .env
openssl rand -hex 32
```

Put the generated value in `.env` as `JWT_SECRET`. Replace
`POSTGRES_PASSWORD` with a separate strong local password before creating the
database volume. Never commit `.env`.

### 4. Reconstruct the fine-tuned adapter

The trained adapter is split into three files so it can be stored in this public
GitHub fork without Git LFS:

```bash
cat ml/artifacts/final_adapter/adapter_model.safetensors.part-* \
  > ml/artifacts/final_adapter/adapter_model.safetensors

shasum -a 256 ml/artifacts/final_adapter/adapter_model.safetensors
```

Expected SHA-256:

```text
9c72558f1888a244e4d536e36a98ebf2bd696eae9eeb133528283ac90dc4f777
```

### 5. Create the GGUF model

The 2.3 GiB GGUF cannot be committed because it exceeds GitHub Free/Pro's 2 GB
per-file Git LFS limit. Generate it in Colab from the included adapter:

```python
model.save_pretrained_gguf(
    "medquad-qwen3-4b",
    tokenizer,
    quantization_method="q4_k_m",
)
```

The full workflow is in
[`ml/notebooks/medquad_qwen3_4b_qlora_colab.ipynb`](ml/notebooks/medquad_qwen3_4b_qlora_colab.ipynb).
Copy or download the export to:

```text
ml/gguf/Qwen3-4B.Q4_K_M.gguf
```

Expected GGUF SHA-256 for the current export:

```text
ff0ce1032104a78625448e2b72d6632f1d16b9a93152c5dada737cd54f874e2d
```

### 6. Import and test the model with Ollama

Start the Ollama macOS application, then run:

```bash
ollama create vitalsync-medquad-qwen3-4b -f ml/gguf/Modelfile
ollama list
ollama run vitalsync-medquad-qwen3-4b "What is hypertension?"
curl http://localhost:11434/api/version
```

### 7. Start the application

Start Docker Desktop, then run:

```bash
docker compose up -d --build
```

Open:

- Application: <http://localhost:8080>
- API documentation: <http://localhost:8000/docs>
- Backend health: <http://localhost:8000/api/v1/health>

Register a patient or doctor account, log in, and open the patient AI Assistant.

## Fine-tuned model and outputs

### Model configuration

| Property | Value |
|---|---|
| Base model | `unsloth/Qwen3-4B-unsloth-bnb-4bit` |
| Fine-tuning method | Supervised QLoRA/PEFT |
| LoRA rank / alpha | 16 / 32 |
| LoRA dropout | 0 |
| Maximum sequence length | 2,048 |
| Learning rate | `1e-4` |
| Micro batch / gradient accumulation | 1 / 8 |
| Deployment quantization | `Q4_K_M` |

### Dataset

| Stage | Records |
|---|---:|
| Raw MedQuAD records | 47,441 |
| After cleaning and normalized deduplication | 15,133 |
| Safe/unflagged records | 12,194 |
| Manual-review records | 2,939 |
| Train split | 9,722 |
| Validation split | 1,203 |
| Test split | 1,269 |

The split is grouped by medical `Focus`, with zero Focus overlap among training,
validation, and test data. Treatment, prevention, diagnosis, medication, vaccine,
and year-sensitive records are retained in `ml/dataset/review_required.jsonl`.

### Current saved run

The committed adapter is a smoke-test result:

- 1,000 training and 200 validation examples
- 100 optimizer steps, reaching 0.8 epoch
- Validation loss at step 50: `1.0856`
- Validation loss at step 100: `1.0501`

These metrics show that optimization ran successfully. They do not demonstrate
medical correctness or clinical safety.

### Reproducibility files

| Location | Contents |
|---|---|
| [`MODEL_CARD.md`](MODEL_CARD.md) | Intended use, limitations, evaluation requirements |
| [`ml/README.md`](ml/README.md) | ML-package instructions |
| `ml/artifacts/final_adapter/` | Split trained adapter and tokenizer |
| `ml/dataset/` | Cleaned dataset splits and review queue |
| `ml/notebooks/` | Training and base-versus-fine-tuned comparison |
| `ml/results/` | Trainer state and compact result summary |
| [`ml/results/base_vs_finetuned/REVIEW.md`](ml/results/base_vs_finetuned/REVIEW.md) | Base-vs-fine-tuned metrics and factual-error audit |
| `ml/scripts/prepare_medquad.py` | Dataset cleaning and splitting pipeline |
| `ml/gguf/` | Ollama Modelfile and GGUF documentation |

## Database and authentication

PostgreSQL runs as the internal `database` service. Account data persists in the
named volume `vitalsync-ai_postgres_data`.

```bash
# Inspect accounts without showing password hashes
docker compose exec database psql -U vitalsync -d vitalsync \
  -c "SELECT id, name, email, role, is_verified, created_at FROM users;"

# Stop containers and preserve accounts
docker compose down

# Permanently delete the local database volume and accounts
docker compose down --volumes
```

Do not use `--volumes` unless deletion is intentional.

## API endpoints

| Method | Endpoint | Authentication | Purpose |
|---|---|---:|---|
| `GET` | `/api/v1/health` | No | Backend/model configuration health |
| `POST` | `/api/v1/auth/register` | No | Register patient or doctor |
| `POST` | `/api/v1/auth/login` | No | Verify credentials and issue token |
| `GET` | `/api/v1/auth/me` | Bearer | Restore current account |
| `POST` | `/api/v1/chat` | Bearer | Send chatbot request |
| `GET` | `/api/v1/chat/history` | Bearer | Load persisted chatbot history |
| `GET/POST` | `/api/v1/symptoms` | Patient | List or create symptom records |
| `GET` | `/api/v1/wearables` | Patient | Read demo-band state, readings, and alerts |
| `POST` | `/api/v1/wearables/device` | Patient | Configure the simulated band |
| `POST` | `/api/v1/wearables/sync` | Patient | Generate and persist mock readings |
| `GET/POST` | `/api/v1/appointments` | Bearer | List or create appointment requests |
| `PATCH` | `/api/v1/appointments/{id}/status` | Bearer | Review or cancel an appointment |
| `GET` | `/api/v1/doctors` | Bearer | Discover registered doctors by city |
| `GET/POST` | `/api/v1/documents` | Patient | List or upload medical documents |
| `GET` | `/api/v1/doctor/patients/{id}` | Doctor | Open the consent-scoped workspace |
| `GET/POST` | `/api/v1/messages` | Bearer | Appointment-linked messaging |

Example chat body:

```json
{
  "message": "What is hypertension?",
  "history": [
    {"role": "user", "content": "What is blood pressure?"},
    {"role": "assistant", "content": "Blood pressure is..."}
  ]
}
```

## Development commands

### Docker workflow

```bash
docker compose up -d --build
docker compose ps
docker compose logs -f backend
docker compose down
```

### Frontend outside Docker

```bash
npm install
cp env.example .env.local
npm run dev
```

The Vite development server normally runs at <http://localhost:5173>. The Docker
backend and database must still be available.

### Quality checks

```bash
npm run lint
npm run build
PYTHONPYCACHEPREFIX=/tmp/vitalsync-pycache python3 -m compileall -q backend/app
docker compose config
```

## Repository structure

```text
ai_based_health_monitoring_system/
├── backend/
│   ├── app/
│   │   ├── auth_routes.py         # Registration and login API
│   │   ├── database.py            # SQLAlchemy sessions
│   │   ├── domain_routes.py       # Care, wearable, document, and messaging APIs
│   │   ├── main.py                # Chat API and safety/grounding
│   │   ├── models.py              # PostgreSQL healthcare domain models
│   │   ├── schemas.py             # API schemas
│   │   └── security.py            # Argon2id and tokens
│   ├── Dockerfile
│   └── requirements.txt
├── ml/
│   ├── artifacts/final_adapter/   # Split adapter and tokenizer
│   ├── dataset/                   # Cleaned JSONL splits
│   ├── gguf/                      # Ollama import files
│   ├── notebooks/                 # Colab training and comparison
│   ├── results/                   # Training outputs
│   └── scripts/                   # Dataset preparation
├── model/                         # Application Modelfile example
├── public/
├── src/                           # React application
├── compose.yaml
├── Dockerfile                     # React/Nginx image
├── nginx.conf
├── env.example
├── MODEL_CARD.md
└── README.md
```

Generated dependencies, builds, `.env` files, database contents, reconstructed
model weights, and GGUF files are ignored by Git.

## Testing and verification

The implementation has been checked with:

- React production build and lint command.
- Backend Python compilation and Docker Compose validation.
- PostgreSQL health and persistence across backend restart.
- Patient/doctor registration, duplicate rejection, and Argon2id hashing.
- Login, token restoration, and role-based routing.
- Authenticated end-to-end Ollama inference.
- Patient-to-doctor workflow: symptoms, simulated wearable sync, alerts,
  consent snapshot, review, note, care plan, and message.
- Emergency fallback and disclaimer-only response retry.
- NIH-grounded iron-deficiency response with source links.
- Adapter reconstruction and SHA-256 verification.

Synthetic accounts created during testing were removed.

## Known limitations

- The committed adapter is a smoke-run model trained on 1,000 examples.
- A 4B model can produce confident but incorrect health information.
- Only iron deficiency currently has a reviewed, source-linked grounding rule;
  full trusted-document RAG is not implemented for every topic.
- Training loss does not establish medical accuracy.
- Doctor verification has no administrative workflow yet.
- Smart-band readings and alerts are simulated; there is no Bluetooth or
  certified medical-device integration.
- Anomaly detection uses simple transparent thresholds and is not diagnostic.
- Token storage and automatic table creation are for local academic use, not a
  production healthcare deployment.

Before reporting final results, train on the full approved set and compare the
base and fine-tuned models on the untouched Focus-grouped test set. Report factual
correctness, unsupported claims, safety violations, emergency behavior, latency,
and memory use.

## Privacy and security

Never commit or enter:

- Real patient identifiers, contact information, or medical records.
- Production database credentials, JWT secrets, API keys, or private keys.
- `.env`, `.env.local`, database dumps, uploaded documents, or browser exports.
- Logs containing authorization headers or health information.

For a real deployment, add HTTPS, secure HTTP-only cookies, database migrations,
encrypted storage, managed secrets, backups, audit logs, authorization tests,
retention controls, and review against applicable health-data requirements.

## Contributing

```bash
git clone https://github.com/sohitkumar7505/ai_based_health_monitoring_system.git
cd ai_based_health_monitoring_system
git switch -c feature/short-description
```

Before committing:

```bash
npm run lint
npm run build
git status
git diff
```

Then:

```bash
git add <intended-files>
git commit -m "Describe the change"
git push -u origin feature/short-description
```

Do not commit `node_modules`, `dist`, `.env`, real health data, the reconstructed
`.safetensors` file, or GGUF files.

## Troubleshooting

### Local model unavailable

```bash
curl http://localhost:11434/api/version
ollama list
docker compose logs --tail=100 backend
```

The model name must be `vitalsync-medquad-qwen3-4b` unless `OLLAMA_MODEL` is
changed in `.env`.

### Adapter cannot be loaded

Reconstruct it and compare the SHA-256 value with the checksum above:

```bash
cat ml/artifacts/final_adapter/adapter_model.safetensors.part-* \
  > ml/artifacts/final_adapter/adapter_model.safetensors
```

### PostgreSQL connection problem

```bash
docker compose ps
docker compose logs database
docker compose logs backend
```

If the volume was created with different credentials, update the PostgreSQL role
consistently or intentionally recreate an empty development volume.

### Frontend shows old code

```bash
docker compose up -d --build frontend
```

Then hard-refresh with `Cmd + Shift + R`.

### Default ports

- `8080`: React/Nginx application
- `8000`: FastAPI
- `11434`: native Ollama

## License and attribution

Review and preserve the licenses and terms of the base model, source datasets,
and third-party libraries before redistribution or deployment. The cleaned
dataset retains source metadata and URLs for academic traceability.

## Disclaimer

VitalSync AI is educational software. It is not intended to diagnose, treat,
cure, or prevent disease and must not be used as the sole basis for medical
decisions. For urgent symptoms, contact local emergency services or seek
immediate in-person medical care.
