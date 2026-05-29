# Ananta

> AI-only tutoring platform for Karnataka State Board students (Grades 10, 11, 12). Every class delivered by an AI teacher. Daily 7-8 PM live, recorded for on-demand. Two mediums: English and Kanglish (Kannada-English mix).

[![License](https://img.shields.io/badge/license-Proprietary-red.svg)](LICENSE)
[![Launch](https://img.shields.io/badge/launch-July%202026-orange.svg)]()
[![Status](https://img.shields.io/badge/status-pre--launch%20build-yellow.svg)]()

---

## Product at a glance

| Thing | Detail |
|------|--------|
| **Audience** | Karnataka State Board, Grades 10/11/12 |
| **Format** | Daily 7-8 PM live class, one subject per day, recorded |
| **Subjects** | Maths, Science, Social Science, Kannada, English, Hindi |
| **AI Teachers** | Praketa (Maths), Vihaan (Science), Adhvara (Social), Harini (Kannada), Anika (English), Amita (Hindi) |
| **Mediums** | English-medium · Kannada-medium (uses **Kanglish**, not pure Kannada) |
| **Sunday** | 1-hr weekly test + 1-hr live doubt clearing |
| **Pricing** | ₹299/mo · ₹799/qtr · ₹2,499/yr · Sibling ₹499/mo |
| **Launch** | July 2026, gated on ≥10 members joined |
| **Pacing** | Full Karnataka syllabus in ~250 days (~36 lessons/subject) — finishes mid-March 2027 before KSEEB boards |

---

## Repository layout

```
ananta/
├── apps/
│   ├── web/                  # Next.js 14 — student/parent/landing
│   ├── api/                  # NestJS — REST + auth + payments
│   └── ai-worker/            # FastAPI Python — LLM, TTS, animation
├── packages/
│   ├── db/                   # Prisma schema + migrations (shared)
│   ├── ui/                   # Shared React components
│   ├── config/               # Shared tsconfig, eslint, tailwind
│   └── types/                # Shared TS types
├── infra/
│   ├── docker-compose.yml    # Local dev (Postgres, Redis, LiveKit)
│   └── k3s/                  # Production manifests (later)
├── docs/                     # Architecture, decisions, runbooks
│   ├── Ananta_Architecture.html
│   ├── Ananta_Stack_Decisions.html
│   ├── Ananta_Bootstrap_Plan.html
│   └── prototypes/           # Original HTML mockups
└── .github/workflows/        # CI/CD
```

---

## Tech stack (short version — full reasoning in `docs/Ananta_Stack_Decisions.html`)

| Layer | Pick |
|-------|------|
| Frontend | Next.js 14 + React + Tailwind |
| Backend | NestJS + Prisma + Postgres |
| AI worker | FastAPI + Celery |
| Database | PostgreSQL 16 + pgvector |
| Cache/Queue | Redis 7 + BullMQ |
| LLM | Groq (Llama 3.3 70B) + Sarvam-1 (Indic) |
| TTS English | Piper |
| TTS Kanglish/Kannada/Hindi | AI4Bharat IndicTTS |
| Avatar | Live2D Cubism + Rhubarb lip-sync |
| Animation | Manim + Remotion |
| Live class | LiveKit (self-hosted) |
| Storage/CDN | Cloudflare R2 + Cloudflare CDN |
| Hosting | Oracle Cloud Always-Free ARM (4 vCPU, 24 GB) |
| Payments | Razorpay (UPI Auto-Pay) |
| WhatsApp | Meta Cloud API direct |
| SMS | MSG91 |
| Email | Resend |
| Analytics | PostHog |
| Errors | Sentry |
| CI/CD | GitHub Actions |

**Day-1 cost: ~₹900 (domain only). MVP-ready cost: ₹0/mo.**

---

## Quick start (once scaffold lands)

```bash
# Prerequisites: Node 20+, pnpm 9+, Python 3.11+, Docker

git clone git@github.com:<your-username>/ananta.git
cd ananta

# Install
pnpm install

# Bring up Postgres, Redis, LiveKit locally
docker compose -f infra/docker-compose.yml up -d

# Run all three apps in parallel
pnpm dev

# → web at http://localhost:3000
# → api at http://localhost:4000
# → ai-worker at http://localhost:5000
```

---

## Working on this repo

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for branching, commit conventions, and code review rules.

See [`docs/GITHUB_SETUP.md`](docs/GITHUB_SETUP.md) for first-time GitHub push.

---

## Roadmap

- [x] Architecture decisions (v1.0)
- [x] Stack decisions (28 categories)
- [x] Landing page mockup
- [x] Student dashboard mockup
- [x] Live class mockup
- [x] Post-class (quiz + notes + materials) mockup
- [ ] Monorepo scaffold
- [ ] Prisma schema + migrations
- [ ] NestJS API (auth, classes, quizzes, notes, materials, payments)
- [ ] Next.js app (convert mockups to real pages)
- [ ] FastAPI AI worker (lesson generation pipeline)
- [ ] Razorpay UPI Auto-Pay integration
- [ ] WhatsApp parent alerts
- [ ] LiveKit live-class room
- [ ] Admin panel + content uploader
- [ ] Deploy to Oracle Always-Free
- [ ] Pilot with ≥10 students (gating condition)
- [ ] **Launch: July 2026**

---

## License

Proprietary. © 2026 priyanka. All rights reserved. See [LICENSE](LICENSE).
