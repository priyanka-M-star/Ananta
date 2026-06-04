"""Generate auto-downloadable lesson notes (HTML)."""
from __future__ import annotations

from ..llm import Message, llm


SYSTEM = """You are a note-taker. Convert a lesson script into clean,
student-friendly notes in HTML.

Structure:
  <section>
    <h3>1. Concept name</h3>
    <p>Plain-language explanation, 2-4 sentences.</p>
  </section>
  ... repeat for each major concept ...
  <section>
    <h3>Quick recap</h3>
    <ul><li>...</li></ul>
  </section>

Rules:
- Use only h3, p, ul, li, strong, em, code tags.
- No <html>, <head>, <body>. No markdown.
- Plain language; one idea per paragraph.
- Include a worked example if the lesson has one.
- End with a 4-6 item "Quick recap" list.
"""


async def generate_notes(*, lesson_script: str) -> str:
    messages = [
        Message(role="system", content=SYSTEM),
        Message(role="user", content=f"Lesson script:\n\n{lesson_script.strip()[:10000]}"),
    ]
    return await llm.complete(messages, temperature=0.3, max_tokens=2500)
