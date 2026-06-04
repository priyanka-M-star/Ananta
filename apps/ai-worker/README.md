# Ananta AI worker

Python 3.11 · FastAPI · Celery · Postgres + pgvector.

Handles everything LLM-shaped: doubt answering (RAG), quiz generation, notes generation,
Memory Deck card extraction, TTS rendering, and overnight lesson generation.

Architecture is detailed in `docs/Ananta_AI_Architecture.html`.

---

## Run locally

```bash
# from monorepo root
docker compose -f infra/docker-compose.yml up -d   # Postgres, Redis

cd apps/ai-worker
python -m venv .venv
source .venv/bin/activate    # Windows: .venv\Scripts\activate
pip install -e ".[dev]"

cp .env.example .env
# fill in GROQ_API_KEY at minimum

# 1. the HTTP server
uvicorn src.main:app --reload --port 5000

# 2. the celery worker (separate terminal)
celery -A src.celery_app worker --loglevel=info

# 3. celery beat for cron tasks (separate terminal, optional)
celery -A src.celery_app beat --loglevel=info
```

Smoke tests:

```bash
curl http://localhost:5000/health
curl http://localhost:5000/health/ready

curl -X POST http://localhost:5000/doubts/answer/sync \
  -H "Content-Type: application/json" \
  -d '{"doubtId":"<some-uuid-in-the-Doubt-table>"}'
```

---

## Folder layout

```
src/
├── main.py                FastAPI bootstrap, CORS, lifespan, routes
├── config.py              pydantic-settings, loaded from .env
├── logging.py             loguru setup (pretty in dev, JSON in prod)
├── db.py                  async SQLAlchemy session for Postgres + pgvector
├── embeddings.py          BGE-M3 wrapper (1024-d, multilingual)
├── llm.py                 Groq primary + OpenRouter fallback, streaming support
├── rag.py                 retrieve top-K chunks via pgvector, build prompt
│
├── personas/
│   ├── loader.py          loads YAML, builds system prompt + few-shot
│   ├── vihaan.yaml        Science teacher persona
│   ├── praketa.yaml       Mathematics
│   └── adhvara.yaml       Social Science
│
├── services/
│   ├── doubts.py          answer + persist + POST back to Nest
│   ├── quiz_gen.py        7 MCQs from a lesson script (validated JSON)
│   ├── notes_gen.py       HTML lesson notes (h3 + p + ul only)
│   ├── memory_cards.py    8-12 flashcards from a lesson script
│   └── tts.py             AI4Bharat IndicTTS wrapper (per-teacher voices)
│
├── routes/
│   ├── health.py          GET /health, /health/ready
│   ├── doubts.py          POST /doubts/answer (async), /doubts/answer/sync
│   ├── generation.py      POST /generate/{quiz, notes, cards}
│   └── tts.py             POST /tts → audio/wav
│
├── celery_app.py          Celery setup, queues, beat schedule
└── tasks.py               background tasks (nightly lesson gen, TTS, etc.)
```

---

## The doubt flow, end-to-end

```
1. Student types doubt in live class
2. Nest API: POST /v1/doubts        → persists Doubt with status=PENDING
3. Nest service fires:               POST {AI_WORKER_URL}/doubts/answer {doubtId}
4. AI worker accepts, returns 202, runs answer_doubt() in background
5. answer_doubt():
   a. Loads Doubt row + ClassSession + Subject
   b. Picks persona (vihaan/praketa/…)
   c. RAG: embed query → pgvector top-K → re-rank → build context
   d. LLM call (Groq Llama 3.3 70B via OpenAI-compat client)
   e. UPDATE Doubt SET answer, status='ANSWERED', embedding=…
   f. POST {API_URL}/doubts/{id}/answer  (internal-secret header)
6. Nest pushes answer to student's WebSocket
```

For Phase 2 (≥500 paying users) we replace the LLM call with a self-hosted
fine-tuned Mistral 7B served via vLLM. The pipeline above doesn't change —
only `LlmClient` changes.
