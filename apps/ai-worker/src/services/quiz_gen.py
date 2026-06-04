"""Generate a post-class quiz from a lesson script."""
from __future__ import annotations

import json
from typing import Literal

from loguru import logger
from pydantic import BaseModel, Field

from ..llm import Message, llm


Difficulty = Literal["EASY", "MEDIUM", "HARD"]


class QuizQuestion(BaseModel):
    text: str
    options: list[str] = Field(min_length=2, max_length=5)
    correct_index: int
    explanation: str
    difficulty: Difficulty = "EASY"


class GeneratedQuiz(BaseModel):
    questions: list[QuizQuestion]


SYSTEM = """You are a quiz designer for an Indian high-school AI tutoring platform.
Given a lesson script, write a {n} question multiple-choice quiz that tests the
core concepts. Mix difficulty: ~50% easy, ~35% medium, ~15% hard.

Strict output: a single JSON object matching this schema:
{
  "questions": [
    {
      "text": "...",
      "options": ["...", "...", "...", "..."],
      "correct_index": 2,
      "explanation": "Why this is right, in one or two sentences.",
      "difficulty": "EASY" | "MEDIUM" | "HARD"
    }
  ]
}

No markdown, no preamble, just the JSON."""


async def generate_quiz(*, lesson_script: str, num_questions: int = 7) -> GeneratedQuiz:
    messages = [
        Message(role="system", content=SYSTEM.replace("{n}", str(num_questions))),
        Message(role="user", content=f"Lesson script:\n\n{lesson_script.strip()[:8000]}"),
    ]
    raw = await llm.complete(messages, temperature=0.4, max_tokens=2000)
    raw = _strip_json_fence(raw)
    try:
        parsed = json.loads(raw)
        quiz = GeneratedQuiz(**parsed)
    except Exception as e:
        logger.warning(f"Quiz JSON parse failed; retrying once. Error: {e}")
        raise

    # validate self-consistency: correct_index in range
    for q in quiz.questions:
        if not 0 <= q.correct_index < len(q.options):
            raise ValueError(f"correct_index {q.correct_index} out of range for {len(q.options)} options")

    return quiz


def _strip_json_fence(s: str) -> str:
    s = s.strip()
    if s.startswith("```"):
        s = s.split("\n", 1)[1] if "\n" in s else s
        if s.endswith("```"):
            s = s.rsplit("```", 1)[0]
    return s.strip()
