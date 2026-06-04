"""Content generation routes — quiz, notes, memory cards from a lesson script."""
from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel

from ..services.memory_cards import GeneratedCards, extract_cards
from ..services.notes_gen import generate_notes
from ..services.quiz_gen import GeneratedQuiz, generate_quiz


router = APIRouter(prefix="/generate", tags=["generate"])


class FromScript(BaseModel):
    lesson_script: str
    num_questions: int = 7
    chapter_tag: str = ""


@router.post("/quiz", response_model=GeneratedQuiz)
async def quiz(req: FromScript) -> GeneratedQuiz:
    return await generate_quiz(lesson_script=req.lesson_script, num_questions=req.num_questions)


@router.post("/notes")
async def notes(req: FromScript) -> dict[str, str]:
    html = await generate_notes(lesson_script=req.lesson_script)
    return {"html": html}


@router.post("/cards", response_model=GeneratedCards)
async def cards(req: FromScript) -> GeneratedCards:
    return await extract_cards(lesson_script=req.lesson_script, chapter_tag=req.chapter_tag)
