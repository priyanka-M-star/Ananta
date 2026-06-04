"""TTS route — returns audio bytes for a teacher's voice."""
from __future__ import annotations

from fastapi import APIRouter
from fastapi.responses import Response
from pydantic import BaseModel

from ..services.tts import synthesize


router = APIRouter(prefix="/tts", tags=["tts"])


class SynthRequest(BaseModel):
    teacher: str
    text: str


@router.post("")
async def synth(req: SynthRequest):
    audio = await synthesize(teacher_slug=req.teacher, text=req.text)
    return Response(content=audio, media_type="audio/wav")
