import os
import re
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
from .database import Base, SessionLocal, engine, get_db
from .models import ChatCitation, ChatMessage as StoredChatMessage, KnowledgeChunk, User
from .rag import build_rag_context, retrieve_knowledge, seed_knowledge
from .security import get_current_user


OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://host.docker.internal:11434").rstrip("/")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "vitalsync-medquad-qwen3-4b")
REQUEST_TIMEOUT_SECONDS = float(os.getenv("OLLAMA_TIMEOUT_SECONDS", "120"))
MAX_HISTORY_MESSAGES = 10

STANDARD_DISCLAIMER = (
    "Educational information only; not a medical diagnosis or a substitute for "
    "a qualified healthcare professional."
)

SYSTEM_PROMPT = """You are VitalSync, an educational health-information assistant
using retrieval-augmented generation. Answer only from the supplied trusted
evidence. Do not use remembered medical facts that are absent from the evidence.
Use short paragraphs or bullets when they improve readability.

Do not diagnose the user, claim certainty from incomplete information, prescribe
personalized treatment, or give personalized medication or supplement dosages.
Explain when evaluation by a qualified healthcare professional is important. For
urgent or potentially life-threatening symptoms, advise immediate professional
care.

Add an inline citation such as [S1] after every paragraph containing factual
medical claims. Cite only source labels supplied in the evidence. If the evidence
does not answer part of the question, say that the reviewed library does not cover
it. Do not invent a citation. Do not output a generic disclaimer because the
application displays it separately.
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
    "face drooping",
    "arm weakness",
    "slurred speech",
    "chest pressure",
    "fainting",
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
    sources: list[dict] = Field(default_factory=list)
    rag_used: bool = False
    retrieval_score: float | None = None
    knowledge_scope_limited: bool = False


@asynccontextmanager
async def lifespan(_app: FastAPI):
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as database:
        seed_knowledge(database)
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

    retrieved = retrieve_knowledge(database, request.message)
    sources = [
        {
            "label": f"S{index}",
            "title": item["title"],
            "organization": item["organization"],
            "url": item["url"],
            "score": item["score"],
            "sourceUpdated": item["sourceUpdated"],
            "reviewedAt": item["reviewedAt"],
        }
        for index, item in enumerate(retrieved, start=1)
    ]

    if not retrieved:
        reply = (
            "I don't have reviewed source material for that question in the current "
            "trusted library, so I won't guess. The available topics are iron "
            "deficiency, high blood pressure, diabetes, asthma, stroke warning signs, "
            "heart attack warning signs, dehydration, and the common cold. Please ask "
            "about one of those topics or discuss the question with a qualified "
            "healthcare professional."
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
            sources=[],
            rag_used=False,
            retrieval_score=None,
            knowledge_scope_limited=True,
        )

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {
            "role": "system",
            "content": (
                "Trusted evidence follows. Treat it as the complete factual boundary "
                "for this answer.\n\n" + build_rag_context(retrieved)
            ),
        },
    ]
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

    valid_citations = {f"S{index}" for index in range(1, len(sources) + 1)}
    cited_labels = set(re.findall(r"\[(S\d+)\]", reply))
    if not cited_labels or not cited_labels.issubset(valid_citations):
        citation_retry = [*messages]
        citation_retry[-1] = {
            "role": "user",
            "content": (
                f"{request.message}\n\nRewrite the answer using only the supplied "
                "evidence. Put a valid inline citation such as [S1] after every "
                "paragraph containing a medical claim."
            ),
        }
        try:
            reply = await request_model(citation_retry)
        except httpx.HTTPError:
            pass
        cited_labels = set(re.findall(r"\[(S\d+)\]", reply))
    if not cited_labels or not cited_labels.issubset(valid_citations):
        reply = "Here is the reviewed information available for this question:\n\n" + "\n\n".join(
            f"{item['content']} [S{index}]"
            for index, item in enumerate(retrieved, start=1)
        )

    if emergency_detected:
        reply = f"{EMERGENCY_NOTICE}\n\n{reply}"

    user_message = StoredChatMessage(
        patient_id=_current_user.id, role="user", content=request.message
    )
    assistant_message = StoredChatMessage(
        patient_id=_current_user.id, role="assistant", content=reply, model=OLLAMA_MODEL
    )
    database.add_all([user_message, assistant_message])
    database.flush()
    database.add_all([
        ChatCitation(
            message_id=assistant_message.id,
            source_label=source["label"],
            title=source["title"],
            source_url=source["url"],
            source_organization=source["organization"],
            retrieval_score=source["score"],
        )
        for source in sources
    ])
    database.commit()

    return ChatResponse(
        reply=reply,
        emergency_detected=emergency_detected,
        model=OLLAMA_MODEL,
        disclaimer=STANDARD_DISCLAIMER,
        sources=sources,
        rag_used=True,
        retrieval_score=max(item["score"] for item in retrieved),
        knowledge_scope_limited=False,
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
    citations = database.scalars(
        select(ChatCitation).where(
            ChatCitation.message_id.in_([item.id for item in messages])
        )
    ).all() if messages else []
    citations_by_message: dict[int, list[dict]] = {}
    for citation in citations:
        citations_by_message.setdefault(citation.message_id, []).append({
            "label": citation.source_label,
            "title": citation.title,
            "url": citation.source_url,
            "organization": citation.source_organization,
            "score": citation.retrieval_score,
        })
    return [
        {
            "id": item.id,
            "role": item.role,
            "content": item.content,
            "model": item.model,
            "createdAt": item.created_at.isoformat(),
            "sources": citations_by_message.get(item.id, []),
        }
        for item in reversed(messages)
    ]


@app.get("/api/v1/knowledge/sources")
def knowledge_sources(
    _current_user: Annotated[User, Depends(get_current_user)],
    database: Annotated[Session, Depends(get_db)],
):
    chunks = database.scalars(
        select(KnowledgeChunk)
        .where(KnowledgeChunk.active.is_(True))
        .order_by(KnowledgeChunk.source_organization, KnowledgeChunk.title)
    ).all()
    seen = set()
    results = []
    for chunk in chunks:
        if chunk.source_url in seen:
            continue
        seen.add(chunk.source_url)
        results.append({
            "title": chunk.title,
            "organization": chunk.source_organization,
            "url": chunk.source_url,
            "sourceUpdated": chunk.source_updated,
            "reviewedAt": chunk.reviewed_at,
        })
    return {"count": len(results), "sources": results, "retrieval": "local lexical RAG"}
