import os
from contextlib import asynccontextmanager
from typing import Literal
from typing import Annotated

import httpx
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import select
from sqlalchemy.orm import Session

from .auth_routes import router as auth_router
from .domain_routes import router as domain_router
from .database import Base, engine, get_db
from .models import ChatMessage as StoredChatMessage, User
from .security import get_current_user


OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://host.docker.internal:11434").rstrip("/")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "vitalsync-medquad-qwen3-4b")
REQUEST_TIMEOUT_SECONDS = float(os.getenv("OLLAMA_TIMEOUT_SECONDS", "120"))
MAX_HISTORY_MESSAGES = 10

STANDARD_DISCLAIMER = (
    "Educational information only; not a medical diagnosis or a substitute for "
    "a qualified healthcare professional."
)

SYSTEM_PROMPT = """You are VitalSync, an educational health-information assistant.
Answer the user's health question directly before giving cautions. Provide clear,
useful general information and specific examples when appropriate. Use short
paragraphs or bullet points when they improve readability.

Do not diagnose the user, claim certainty from incomplete information, prescribe
personalized treatment, or give personalized medication or supplement dosages.
Explain when evaluation by a qualified healthcare professional is important. For
urgent or potentially life-threatening symptoms, advise immediate professional
care.

Do not output a generic medical disclaimer. The application displays its standard
disclaimer separately. Never respond with only a disclaimer.
"""

EMERGENCY_PHRASES = {
    "cannot breathe",
    "difficulty breathing",
    "severe chest pain",
    "severe bleeding",
    "unconscious",
    "overdose",
    "having a seizure",
    "signs of stroke",
    "kill myself",
    "suicide",
}

EMERGENCY_NOTICE = (
    "This may be an emergency. Contact your local emergency service or seek "
    "immediate in-person medical care. Do not wait for or rely on this chatbot."
)


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=8_000)

    @field_validator("content")
    @classmethod
    def clean_content(cls, value: str) -> str:
        return value.strip()


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4_000)
    history: list[ChatMessage] = Field(default_factory=list, max_length=20)

    @field_validator("message")
    @classmethod
    def clean_message(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Message cannot be empty")
        return cleaned


class ChatResponse(BaseModel):
    reply: str
    emergency_detected: bool
    model: str
    disclaimer: str
    sources: list[dict[str, str]] = Field(default_factory=list)


def trusted_context_for(question: str) -> tuple[str | None, list[dict[str, str]]]:
    normalized = question.casefold()
    mentions_iron = "iron" in normalized
    mentions_low_or_deficiency = "defic" in normalized or "low iron" in normalized
    if not (mentions_iron and mentions_low_or_deficiency):
        return None, []

    context = """Trusted NIH context for this answer:
- Iron deficiency should be confirmed and its cause assessed. Clinicians commonly
  use blood tests such as a complete blood count, hemoglobin, iron, and ferritin.
- Causes can include blood loss, inadequate dietary iron, or difficulty absorbing iron.
- Food sources include lean meat, seafood, poultry, iron-fortified cereals and
  breads, white beans, lentils, kidney beans, peas, spinach, nuts, and some dried fruit.
- Vitamin C foods such as citrus fruit, strawberries, sweet peppers, tomatoes, and
  broccoli can improve absorption of iron from plant foods.
- Iron supplements may be recommended after evaluation, but excess iron can be
  harmful and supplements can cause side effects. Do not provide a dose.
- Treatment depends on the cause and severity. Do not suggest blood transfusion as
  routine general advice for improving iron deficiency.
- Advise urgent care for chest pain, severe trouble breathing, fainting, or signs of
  significant bleeding. Other symptoms should prompt appropriate clinical review.
Use only this context for specific medical claims in this answer. Give practical
general steps and explain why professional evaluation matters.
"""
    sources = [
        {
            "title": "NIH Office of Dietary Supplements: Iron",
            "url": "https://ods.od.nih.gov/factsheets/Iron-Consumer/",
        },
        {
            "title": "NHLBI: Iron-Deficiency Anemia",
            "url": "https://www.nhlbi.nih.gov/health/anemia/iron-deficiency-anemia",
        },
    ]
    return context, sources


@asynccontextmanager
async def lifespan(_app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="VitalSync AI API",
    version="0.1.0",
    description="Academic health-information chatbot backed by a local Ollama model.",
    lifespan=lifespan,
)

app.include_router(auth_router)
app.include_router(domain_router)

allowed_origins = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS", "http://localhost:5173,http://localhost:8080"
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "model": OLLAMA_MODEL}


@app.get("/api/v1/health")
async def api_health() -> dict[str, str]:
    return {"status": "ok", "model": OLLAMA_MODEL}


@app.post("/api/v1/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    _current_user: Annotated[User, Depends(get_current_user)],
    database: Annotated[Session, Depends(get_db)],
) -> ChatResponse:
    normalized_question = request.message.casefold()
    emergency_detected = any(
        phrase in normalized_question for phrase in EMERGENCY_PHRASES
    )

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    trusted_context, sources = trusted_context_for(request.message)
    if trusted_context:
        messages.append({"role": "system", "content": trusted_context})
    messages.extend(
        message.model_dump() for message in request.history[-MAX_HISTORY_MESSAGES:]
    )
    messages.append({"role": "user", "content": request.message})

    async def request_model(model_messages: list[dict[str, str]]) -> str:
        async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT_SECONDS) as client:
            response = await client.post(
                f"{OLLAMA_BASE_URL}/api/chat",
                json={
                    "model": OLLAMA_MODEL,
                    "messages": model_messages,
                    "stream": False,
                    "think": False,
                    "keep_alive": "10m",
                    "options": {
                        "temperature": 0.2,
                        "top_p": 0.9,
                        "num_predict": 500,
                    },
                },
            )
            response.raise_for_status()
            payload = response.json()
        return payload.get("message", {}).get("content", "").strip()

    try:
        reply = await request_model(messages)
    except httpx.TimeoutException as exc:
        raise HTTPException(
            status_code=504,
            detail="The local model took too long to answer. Please try again.",
        ) from exc
    except (httpx.HTTPError, ValueError, KeyError) as exc:
        raise HTTPException(
            status_code=503,
            detail=(
                "The local AI model is unavailable. Confirm that Ollama is running "
                f"and that the '{OLLAMA_MODEL}' model has been created."
            ),
        ) from exc

    disclaimer_variants = {
        STANDARD_DISCLAIMER.casefold(),
        STANDARD_DISCLAIMER.replace(";", ".").casefold(),
    }
    if reply.casefold().strip(" \\n.") in {
        value.strip(" .") for value in disclaimer_variants
    }:
        retry_messages = [*messages]
        retry_messages[-1] = {
            "role": "user",
            "content": (
                f"{request.message}\n\nAnswer the question itself with useful general "
                "information and specific examples. Do not return a disclaimer."
            ),
        }
        try:
            reply = await request_model(retry_messages)
        except httpx.HTTPError:
            pass

    if not reply:
        raise HTTPException(status_code=502, detail="The model returned an empty response.")

    if trusted_context:
        reply = (
            f"{reply}\n\nBecause low iron can result from blood loss or problems "
            "absorbing iron, a healthcare professional can confirm it with appropriate "
            "blood tests and investigate the cause. Do not start a high-dose iron "
            "supplement without professional guidance; excess iron can be harmful."
        )

    if emergency_detected:
        reply = f"{EMERGENCY_NOTICE}\n\n{reply}"

    database.add_all([
        StoredChatMessage(patient_id=_current_user.id, role="user", content=request.message),
        StoredChatMessage(patient_id=_current_user.id, role="assistant", content=reply, model=OLLAMA_MODEL),
    ])
    database.commit()

    return ChatResponse(
        reply=reply,
        emergency_detected=emergency_detected,
        model=OLLAMA_MODEL,
        disclaimer=STANDARD_DISCLAIMER,
        sources=sources,
    )


@app.get("/api/v1/chat/history")
def chat_history(
    current_user: Annotated[User, Depends(get_current_user)],
    database: Annotated[Session, Depends(get_db)],
):
    messages = database.scalars(
        select(StoredChatMessage)
        .where(StoredChatMessage.patient_id == current_user.id)
        .order_by(StoredChatMessage.created_at.desc())
        .limit(40)
    ).all()
    return [
        {
            "id": item.id,
            "role": item.role,
            "content": item.content,
            "model": item.model,
            "createdAt": item.created_at.isoformat(),
        }
        for item in reversed(messages)
    ]
