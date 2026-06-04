"""Loads teacher persona configs from YAML."""
from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

import yaml

from ..config import settings


@dataclass(frozen=True)
class Persona:
    slug: str            # "vihaan"
    name: str            # "Vihaan"
    subject: str         # "Science"
    day: str             # "Tuesday"
    description: str
    teaching_style: str
    use_naturally: list[str]
    avoid: list[str]
    formality: int       # 1 (casual) → 5 (formal)
    energy: int
    patience: int
    examples: list[dict[str, str]]  # [{question, answer}, ...]

    def system_prompt(self, *, medium: str, grade: str) -> str:
        return f"""You are {self.name}, the AI teacher for {self.subject} on Ananta.
You teach Karnataka State Board, {grade}, {medium}-medium.

TEACHING STYLE:
{self.teaching_style}

VOICE / VOCABULARY:
- Use these phrases naturally when they fit: {", ".join(repr(p) for p in self.use_naturally)}
- Never use: {", ".join(repr(p) for p in self.avoid)}
- Formality {self.formality}/5, energy {self.energy}/5, patience {self.patience}/5.

RULES:
- Answer ONLY using the CONTEXT below + standard KSEEB syllabus knowledge.
- If the context doesn't contain enough to answer, say
  "Let me note this — I'll cover it in detail in a future class."
  and do not guess.
- Cite the lesson the fact came from in parentheses: "(from Ch.2 — Reactions)"
- Match the student's medium: if they wrote in Kanglish, answer in Kanglish.
- Keep answers under 200 words unless they explicitly ask for more.
"""

    def few_shot(self) -> list[dict[str, str]]:
        msgs: list[dict[str, str]] = []
        for ex in self.examples:
            msgs.append({"role": "user", "content": ex["question"]})
            msgs.append({"role": "assistant", "content": ex["answer"]})
        return msgs


@lru_cache
def load(slug: str) -> Persona:
    path = settings.personas_dir / f"{slug}.yaml"
    raw = yaml.safe_load(path.read_text(encoding="utf-8"))
    return Persona(
        slug=slug,
        name=raw["name"],
        subject=raw["subject"],
        day=raw.get("day", ""),
        description=raw.get("description", ""),
        teaching_style=raw["teaching_style"].strip(),
        use_naturally=list(raw.get("vocabulary", {}).get("use_naturally", [])),
        avoid=list(raw.get("vocabulary", {}).get("avoid", [])),
        formality=int(raw.get("tone", {}).get("formality", 3)),
        energy=int(raw.get("tone", {}).get("energy", 3)),
        patience=int(raw.get("tone", {}).get("patience", 4)),
        examples=list(raw.get("example_answers", [])),
    )
