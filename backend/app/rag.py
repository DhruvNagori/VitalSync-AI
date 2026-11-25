import json
import math
import re
from collections import Counter
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.orm import Session

from .models import KnowledgeChunk


SEED_PATH = Path(__file__).with_name("knowledge_seed.json")
TOKEN_PATTERN = re.compile(r"[a-z0-9]+")
STOP_WORDS = {
    "a", "about", "an", "and", "are", "as", "at", "be", "can", "do",
    "cause", "causes", "does", "for", "from", "have", "how", "i", "in",
    "information", "is", "it", "manage", "management", "me",
    "my", "of", "on", "or", "should", "the", "this", "to", "what", "when",
    "symptom", "symptoms", "treat", "treatment", "who", "with", "you", "your",
}


def tokenize(value: str) -> list[str]:
    return [token for token in TOKEN_PATTERN.findall(value.casefold()) if token not in STOP_WORDS]


def load_seed_documents() -> list[dict]:
    return json.loads(SEED_PATH.read_text(encoding="utf-8"))


def seed_knowledge(database: Session) -> int:
    existing = {
        (item.document_slug, item.chunk_key): item
        for item in database.scalars(select(KnowledgeChunk)).all()
    }
    changed = 0
    for value in load_seed_documents():
        key = (value["document_slug"], value["chunk_key"])
        chunk = existing.get(key)
        if not chunk:
            chunk = KnowledgeChunk(document_slug=key[0], chunk_key=key[1])
            database.add(chunk)
        for field in (
            "title", "source_organization", "source_url", "source_updated",
            "reviewed_at", "keywords", "content", "active",
        ):
            setattr(chunk, field, value[field])
        changed += 1
    database.commit()
    return changed


def retrieve_knowledge(database: Session, question: str, limit: int = 4) -> list[dict]:
    chunks = database.scalars(
        select(KnowledgeChunk).where(KnowledgeChunk.active.is_(True))
    ).all()
    query_tokens = tokenize(question)
    if not chunks or not query_tokens:
        return []

    document_tokens = [
        tokenize(f"{item.title} {item.keywords} {item.content}") for item in chunks
    ]
    document_frequency = Counter()
    for tokens in document_tokens:
        document_frequency.update(set(tokens))

    query_counts = Counter(query_tokens)
    query_weight = sum(
        (math.log((len(chunks) + 1) / (document_frequency.get(token, 0) + 1)) + 1)
        * count
        for token, count in query_counts.items()
    ) or 1

    ranked = []
    for chunk, tokens in zip(chunks, document_tokens):
        token_counts = Counter(tokens)
        title_keywords = set(tokenize(f"{chunk.title} {chunk.keywords}"))
        overlap_score = 0.0
        matched = set()
        for token, count in query_counts.items():
            if token not in token_counts:
                continue
            matched.add(token)
            inverse_frequency = math.log(
                (len(chunks) + 1) / (document_frequency[token] + 1)
            ) + 1
            overlap_score += inverse_frequency * count
            if token in title_keywords:
                overlap_score += inverse_frequency * 0.7
        coverage = overlap_score / query_weight
        phrase_boost = 0.25 if question.casefold() in chunk.content.casefold() else 0
        score = coverage + phrase_boost
        if matched and score >= 0.22:
            ranked.append((score, chunk))

    ranked.sort(key=lambda value: value[0], reverse=True)
    relative_floor = max(0.22, ranked[0][0] * 0.65) if ranked else 0.22
    results = []
    seen_urls = set()
    for score, chunk in ranked:
        if score < relative_floor:
            continue
        if chunk.source_url in seen_urls:
            continue
        seen_urls.add(chunk.source_url)
        results.append({
            "id": chunk.id,
            "title": chunk.title,
            "organization": chunk.source_organization,
            "url": chunk.source_url,
            "content": chunk.content,
            "score": round(score, 4),
            "sourceUpdated": chunk.source_updated,
            "reviewedAt": chunk.reviewed_at,
        })
        if len(results) >= limit:
            break
    return results


def build_rag_context(results: list[dict]) -> str:
    evidence = []
    for index, result in enumerate(results, start=1):
        evidence.append(
            f"[S{index}] {result['title']} ({result['organization']})\n"
            f"Source: {result['url']}\n"
            f"Reviewed evidence: {result['content']}"
        )
    return "\n\n".join(evidence)
