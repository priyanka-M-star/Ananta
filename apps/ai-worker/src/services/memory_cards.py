"""Extract spaced-repetition flashcards from a lesson script."""
from __future__ import annotations

import json
from typing import Literal

from loguru import logger
from pydantic import BaseModel, Field

from ..llm import Message, llm


CardKind = Literal["definition", "formula", "fact", "process"]


class MemoryCard(BaseModel):
    front: str
    back: str
    kind: CardKind = "fact"
    tags: list[str] = Field(default_factory=list)


class GeneratedCards(BaseModel):
    cards: list[MemoryCard]


SYSTEM = """You are a flashcard designer. Extract 8-12 spaced-repetition cards
from a lesson script. Each card must be tight: front is a single question or prompt,
back is the answer in one or two sentences.

Mix kinds: definitions, formulas, key facts, processes.

Output strict JSON:
{
  "cards": [
    {"front": "...", "back": "...", "kind": "definition", "tags": ["chapter-2"]}
  ]
}

No markdown."""


async def extract_cards(*, lesson_script: str, chapter_tag: str = "") -> GeneratedCards:
    messages = [
        Message(role="system", content=SYSTEM),
        Message(
            role="user",
            content=(
                f"Lesson script (chapter tag: {chapter_tag!r}):\n\n"
                f"{lesson_script.strip()[:8000]}"
            ),
        ),
    ]
    raw = await llm.complete(messages, temperature=0.4, max_tokens=2500)
    raw = raw.strip()
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1] if "\n" in raw else raw
        if raw.endswith("```"):
            raw = raw.rsplit("```", 1)[0]
    try:
        return GeneratedCards(**json.loads(raw))
    except Exception as e:
        logger.warning(f"Memory cards parse failed: {e}")
        raise
