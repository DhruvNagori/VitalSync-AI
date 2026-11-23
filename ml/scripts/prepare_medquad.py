#!/usr/bin/env python3
"""Prepare a conservative, leakage-safe MedQuAD chat dataset.

This script uses only Python's standard library. It parses the official MedQuAD
XML checkout, applies mechanical quality filters, flags clinically sensitive or
potentially stale records, and creates focus-grouped JSONL splits.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import xml.etree.ElementTree as ET
from collections import Counter
from pathlib import Path


SYSTEM_PROMPT = (
    "You are an educational health information assistant. Give clear, general "
    "health information based on trusted reference material. Do not claim to "
    "diagnose the user and do not prescribe personalized medication or dosage. "
    "When a question may involve an emergency, advise seeking immediate "
    "professional medical care."
)


def element_text(element: ET.Element | None) -> str:
    if element is None:
        return ""
    return " ".join("".join(element.itertext()).split())


def normalize(text: str) -> str:
    return re.sub(r"\W+", " ", text.casefold()).strip()


def load_drug_names(root: Path) -> set[str]:
    names: set[str] = set()
    for path in (root / "11_MPlusDrugs_QA").glob("*.xml"):
        focus = normalize(ET.parse(path).getroot().findtext("Focus") or "")
        if len(focus) >= 4:
            names.add(focus)
    return names


def load_records(root: Path) -> list[dict]:
    records: list[dict] = []
    for path in root.glob("**/*.xml"):
        document = ET.parse(path).getroot()
        source = document.attrib.get("source", "")
        focus = element_text(document.find("Focus"))
        source_url = document.attrib.get("url", "")
        for pair in document.findall(".//QAPair"):
            question_element = pair.find("Question")
            records.append(
                {
                    "question": element_text(question_element),
                    "answer": element_text(pair.find("Answer")),
                    "focus": focus,
                    "question_type": (
                        question_element.attrib.get("qtype", "")
                        if question_element is not None
                        else ""
                    ),
                    "source": source,
                    "source_url": source_url,
                    "source_file": str(path.relative_to(root)),
                }
            )
    return records


def quality_filter(records: list[dict]) -> tuple[list[dict], list[tuple[str, int]]]:
    stages: list[tuple[str, int]] = [("raw", len(records))]

    records = [row for row in records if row["answer"].strip()]
    stages.append(("nonempty_answer", len(records)))

    records = [
        row
        for row in records
        if normalize(row["answer"]) != normalize(row["question"])
    ]
    stages.append(("remove_answer_equals_question", len(records)))

    records = [
        row
        for row in records
        if not (len(row["answer"]) < 160 and row["answer"].rstrip().endswith("?"))
    ]
    stages.append(("remove_short_question_like_answers", len(records)))

    placeholder = re.compile(
        r"^(these resources|the following organizations|information on .* may be found)",
        re.IGNORECASE,
    )
    records = [row for row in records if not placeholder.search(row["answer"])]
    stages.append(("remove_resource_placeholders", len(records)))

    link_dependent = re.compile(
        r"\b(click here|see the links below|following link|"
        r"visit the following (?:link|website))\b",
        re.IGNORECASE,
    )
    records = [row for row in records if not link_dependent.search(row["answer"])]
    stages.append(("remove_link_dependent", len(records)))

    deduplicated: list[dict] = []
    seen: set[tuple[str, str]] = set()
    for row in records:
        key = (normalize(row["question"]), normalize(row["answer"]))
        if key not in seen:
            seen.add(key)
            deduplicated.append(row)
    stages.append(("deduplicate_normalized_qa", len(deduplicated)))
    return deduplicated, stages


def add_review_flags(records: list[dict], drug_names: set[str]) -> None:
    drug_pattern = re.compile(
        r"(?<!\w)(?:"
        + "|".join(re.escape(name) for name in sorted(drug_names, key=len, reverse=True))
        + r")(?!\w)"
    )
    vaccine_pattern = re.compile(
        r"\b(vaccin(?:e|es|ation|ations)|immuni[sz](?:e|ed|ation|ations))\b",
        re.IGNORECASE,
    )
    review_types = {
        "treatment",
        "prevention",
        "exams and tests",
        "dose",
        "contraindication",
        "severe reaction",
    }

    for row in records:
        question_type = normalize(row["question_type"])
        question = normalize(row["question"])
        answer = normalize(row["answer"])
        row["review_flags"] = {
            "clinical": (
                question_type in review_types
                or "how to diagnose" in question
                or "diagnos" in question_type
            ),
            "year": bool(re.search(r"\b(?:19|20)\d{2}\b", row["answer"])),
            "medication": bool(drug_pattern.search(answer)),
            "vaccine": bool(vaccine_pattern.search(row["answer"])),
        }
        row["requires_review"] = any(row["review_flags"].values())


def split_name(row: dict) -> str:
    # Hash the focus so every record about the same condition stays in one split.
    group_key = normalize(row["focus"]) or normalize(row["source_url"])
    if not group_key:
        group_key = row["source_file"]
    bucket = int(hashlib.sha256(group_key.encode("utf-8")).hexdigest()[:8], 16) % 100
    if bucket < 80:
        return "train"
    if bucket < 90:
        return "valid"
    return "test"


def chat_record(row: dict) -> dict:
    return {
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": row["question"]},
            {"role": "assistant", "content": row["answer"]},
        ],
        "metadata": {
            "focus": row["focus"],
            "question_type": row["question_type"],
            "source": row["source"],
            "source_url": row["source_url"],
            "source_file": row["source_file"],
            "review_flags": row["review_flags"],
        },
    }


def write_jsonl(path: Path, rows: list[dict]) -> None:
    with path.open("w", encoding="utf-8") as handle:
        for row in rows:
            handle.write(json.dumps(row, ensure_ascii=False) + "\n")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--medquad-root", type=Path, required=True)
    parser.add_argument("--output-dir", type=Path, required=True)
    args = parser.parse_args()

    if not (args.medquad_root / "3_GHR_QA").is_dir():
        raise SystemExit("The supplied path does not look like the official MedQuAD checkout.")

    args.output_dir.mkdir(parents=True, exist_ok=True)
    records = load_records(args.medquad_root)
    records, stages = quality_filter(records)
    add_review_flags(records, load_drug_names(args.medquad_root))

    safe_records = [row for row in records if not row["requires_review"]]
    review_records = [row for row in records if row["requires_review"]]
    splits = {
        split: [chat_record(row) for row in safe_records if split_name(row) == split]
        for split in ("train", "valid", "test")
    }

    for split, rows in splits.items():
        write_jsonl(args.output_dir / f"{split}.jsonl", rows)
    write_jsonl(
        args.output_dir / "review_required.jsonl",
        [chat_record(row) for row in review_records],
    )

    focus_sets = {
        split: {normalize(row["metadata"]["focus"]) for row in rows}
        for split, rows in splits.items()
    }
    focus_overlap = sum(
        len(focus_sets[left] & focus_sets[right])
        for left, right in (("train", "valid"), ("train", "test"), ("valid", "test"))
    )
    summary = {
        "pipeline_stages": dict(stages),
        "safe_records": len(safe_records),
        "review_required_records": len(review_records),
        "splits": {name: len(rows) for name, rows in splits.items()},
        "focus_overlap_across_splits": focus_overlap,
        "safe_question_types": Counter(row["question_type"] for row in safe_records),
        "safe_sources": Counter(row["source"] for row in safe_records),
    }
    with (args.output_dir / "summary.json").open("w", encoding="utf-8") as handle:
        json.dump(summary, handle, indent=2, ensure_ascii=False)
        handle.write("\n")
    print(json.dumps(summary, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
